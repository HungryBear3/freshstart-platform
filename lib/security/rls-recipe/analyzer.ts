/**
 * The single lexing/discovery recursion.
 *
 * `analyzeCode` is the ONLY function that turns a `Text` into tokens for
 * discovery, and each literal reaches it through exactly one path: a `DO` or
 * function body, or a folded `EXECUTE` argument. That is what stops one site
 * being reported twice, and what keeps every reported offset an original source
 * offset rather than an index into a decoded string.
 */
import { MAX_NESTING_DEPTH } from "./bounds"
import {
  type Token,
  isClose,
  isOpen,
  isSymbol,
  isWord,
  lex,
  literalText,
  wordTextOf,
} from "./lexer"
import { isDangerous, policyHeaderIndices, policyStatementAt } from "./policy-statement"
import { TextAssembler, type Text } from "./source-text"
import { VariableEnvironment, foldExpression, unfoldable } from "./dynamic-sql"

export type FindingKind =
  | "permissive-untrusted-recipe"
  | "unsupported-dynamic-sql"
  | "unsupported-procedural-language"

export type Finding = { offset: number; kind: FindingKind }

/** The only procedural languages this guard can read. Anything else is blocked. */
const READABLE_LANGUAGES = ["plpgsql", "sql"]

/** A logical statement also ends after each of these, so blocks are visible. */
const STATEMENT_BOUNDARY_WORDS = ["then", "else", "loop", "begin", "declare", "exception"]

/** A logical statement ending in one of these opens a block. */
const BLOCK_OPENERS = ["begin", "then", "loop"]

const logicalStatements = (tokens: Token[]): Token[][] => {
  const statements: Token[][] = []
  let current: Token[] = []
  let depth = 0

  for (const token of tokens) {
    if (isOpen(token)) depth += 1
    else if (isClose(token)) depth = Math.max(0, depth - 1)

    if (depth === 0 && isSymbol(token, ";")) {
      statements.push(current)
      current = []
      continue
    }

    current.push(token)
    if (depth === 0 && token.kind === "word" && STATEMENT_BOUNDARY_WORDS.includes(token.text)) {
      statements.push(current)
      current = []
    }
  }

  statements.push(current)
  return statements.filter(statement => statement.length > 0)
}

const depthZeroIndex = (
  statement: Token[],
  matches: (token: Token) => boolean,
  start = 0
): number => {
  let depth = 0
  for (let index = start; index < statement.length; index += 1) {
    if (isOpen(statement[index])) depth += 1
    else if (isClose(statement[index])) depth = Math.max(0, depth - 1)
    else if (depth === 0 && matches(statement[index])) return index
  }
  return -1
}

type Assignment = { name: string; rhs: Token[] }

/**
 * `name := expr` / `name = expr`, and in the DECLARE section
 * `name type [CONSTANT] (:= | = | DEFAULT) expr`. A record field (`r.x`) is
 * never tracked.
 */
const assignmentOf = (statement: Token[], inDeclareSection: boolean): Assignment | null => {
  const name = wordTextOf(statement[0])
  if (name === undefined || statement.length < 3) return null
  if (isSymbol(statement[1], ".")) return null

  if (isSymbol(statement[1], ":=") || isSymbol(statement[1], "=")) {
    return { name, rhs: statement.slice(2) }
  }
  if (!inDeclareSection) return null

  const operator = depthZeroIndex(
    statement,
    token => isSymbol(token, ":=") || isSymbol(token, "=") || isWord(token, "default"),
    2
  )
  return operator === -1 ? null : { name, rhs: statement.slice(operator + 1) }
}

const assignmentCounts = (statements: Token[][]): Map<string, number> => {
  const counts = new Map<string, number>()
  let inDeclareSection = false

  for (const statement of statements) {
    if (isWord(statement[0], "declare")) {
      inDeclareSection = true
      continue
    }
    if (isWord(statement[0], "begin")) {
      inDeclareSection = false
      continue
    }
    const assignment = assignmentOf(statement, inDeclareSection)
    if (assignment) counts.set(assignment.name, (counts.get(assignment.name) ?? 0) + 1)
  }

  return counts
}

/** Variables overwritten by PL/pgSQL constructs that are not assignments. */
const indirectWriteTarget = (statement: Token[]): string | undefined => {
  if (isWord(statement[0], "for")) return wordTextOf(statement[1])
  if (isWord(statement[0], "select")) {
    const into = depthZeroIndex(statement, token => isWord(token, "into"), 1)
    if (into !== -1) return wordTextOf(statement[into + 1])
  }
  return undefined
}

const languageNameOf = (token: Token | undefined): string | undefined => {
  if (token?.kind === "word") return token.text
  if (token?.kind === "quoted") return token.name ?? "<unresolved quoted language>"
  return undefined
}

/** `CREATE [OR REPLACE] FUNCTION|PROCEDURE` — index of the FUNCTION/PROCEDURE word. */
const routineKeywordIndex = (statement: Token[]): number => {
  if (!isWord(statement[0], "create")) return -1
  const isRoutine = (index: number) =>
    isWord(statement[index], "function") || isWord(statement[index], "procedure")
  if (isRoutine(1)) return 1
  if (isWord(statement[1], "or") && isWord(statement[2], "replace") && isRoutine(3)) return 3
  return -1
}

/**
 * Analyze one region of code. `depth` is 0 for a file or Markdown-fence region
 * and increments through every procedural body and folded `EXECUTE`.
 */
export const analyzeCode = (text: Text, depth: number): Finding[] => {
  const findings: Finding[] = []

  const result = lex(text)
  if (!result.ok) {
    // A `format()` hole landed inside a literal, a quoted identifier or a
    // comment; the executed text cannot be reconstructed.
    const hole = text.holes[0]
    return [{ offset: text.originAt(hole ? hole.range.start : 0), kind: "unsupported-dynamic-sql" }]
  }
  const tokens = result.tokens

  for (const index of policyHeaderIndices(tokens)) {
    const statement = policyStatementAt(tokens, index, text.value.length)
    if (isDangerous(statement)) {
      findings.push({ offset: statement.header.span.start, kind: "permissive-untrusted-recipe" })
    }
  }

  const statements = logicalStatements(tokens)
  const environment = new VariableEnvironment(assignmentCounts(statements))
  const blocks: { exception: boolean }[] = []
  let inDeclareSection = false

  const recurse = (body: Text, offset: number): void => {
    if (depth + 1 > MAX_NESTING_DEPTH) {
      findings.push({ offset, kind: "unsupported-dynamic-sql" })
      return
    }
    findings.push(...analyzeCode(body, depth + 1))
  }

  const analyzeBody = (body: Token, language: string | undefined): void => {
    const decoded = literalText(body)
    if (!decoded) {
      findings.push({ offset: body.span.start, kind: "unsupported-dynamic-sql" })
      return
    }
    if (language !== undefined && !READABLE_LANGUAGES.includes(language)) {
      findings.push({ offset: body.span.start, kind: "unsupported-procedural-language" })
      return
    }
    recurse(decoded, body.span.start)
  }

  const analyzeDo = (statement: Token[]): void => {
    let index = 1
    let language: string | undefined

    if (
      isWord(statement[index], "language") &&
      languageNameOf(statement[index + 1]) !== undefined
    ) {
      language = languageNameOf(statement[index + 1])
      index += 2
    }

    const body = statement[index]
    if (body?.kind !== "literal") return

    if (
      isWord(statement[index + 1], "language") &&
      languageNameOf(statement[index + 2]) !== undefined
    ) {
      language = languageNameOf(statement[index + 2])
    }
    analyzeBody(body, language)
  }

  const analyzeRoutine = (statement: Token[]): void => {
    const as = depthZeroIndex(statement, token => isWord(token, "as"))
    if (as === -1) return
    const body = statement[as + 1]
    if (body?.kind !== "literal") return

    const languageIndex = depthZeroIndex(statement, token => isWord(token, "language"))
    analyzeBody(
      body,
      languageIndex === -1 ? undefined : languageNameOf(statement[languageIndex + 1])
    )
  }

  const analyzeExecute = (statement: Token[]): void => {
    // At file level `EXECUTE name(...)` is the prepared-statement form, and
    // PREPARE cannot hold DDL. Inside a body the same shape is a function call.
    const called = statement[1]
    if (
      depth === 0 &&
      called?.kind === "word" &&
      called.text !== "format" &&
      isOpen(statement[2])
    ) {
      return
    }

    const stop = depthZeroIndex(
      statement,
      token => isWord(token, "into") || isWord(token, "using"),
      1
    )
    const argument = statement.slice(1, stop === -1 ? statement.length : stop)
    const folded = foldExpression(argument, environment, text)
    if (!folded.ok) {
      findings.push({ offset: statement[0].span.start, kind: "unsupported-dynamic-sql" })
      return
    }
    // PostgreSQL's procedural EXECUTE accepts one complete command without a
    // trailing semicolon. Add a synthetic terminator before statement bounding
    // so end-of-value is not mistaken for a clipped recipe. The injected byte
    // carries only the end sentinel; every reportable token retains its original
    // file provenance.
    const executable = new TextAssembler()
    executable.appendText(folded.text)
    executable.appendRaw(";", folded.text.originAt(folded.text.value.length))
    recurse(
      executable.build(folded.text.originAt(folded.text.value.length)),
      statement[0].span.start
    )
  }

  for (const statement of statements) {
    const first = statement[0]
    const last = statement[statement.length - 1]

    if (isWord(first, "end")) blocks.pop()
    else if (last.kind === "word" && BLOCK_OPENERS.includes(last.text)) {
      blocks.push({ exception: false })
    }
    if (isWord(first, "declare")) inDeclareSection = true
    if (isWord(first, "begin")) inDeclareSection = false
    if (isWord(first, "exception") && blocks.length > 0) {
      blocks[blocks.length - 1].exception = true
    }

    environment.straightLine = blocks.length <= 1 && !blocks[0]?.exception

    if (isWord(first, "do")) {
      analyzeDo(statement)
      continue
    }
    if (routineKeywordIndex(statement) !== -1) {
      analyzeRoutine(statement)
      continue
    }
    if (isWord(first, "execute")) {
      analyzeExecute(statement)
      continue
    }

    const assignment = assignmentOf(statement, inDeclareSection)
    if (assignment) {
      environment.assign(
        assignment.name,
        environment.straightLine
          ? foldExpression(assignment.rhs, environment, text)
          : unfoldable("assigned outside a straight-line position")
      )
      continue
    }

    const overwritten = indirectWriteTarget(statement)
    if (overwritten !== undefined) {
      environment.assign(
        overwritten,
        unfoldable("variable overwritten by an unsupported construct")
      )
    }
  }

  // Dedup by original source identity, then order deterministically.
  const seen = new Set<string>()
  return findings
    .filter(finding => {
      const key = `${finding.offset} ${finding.kind}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((left, right) => left.offset - right.offset || left.kind.localeCompare(right.kind))
}
