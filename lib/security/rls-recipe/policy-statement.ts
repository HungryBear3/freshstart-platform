/**
 * Header discovery, statement bounding and the clause model.
 *
 * Every rule the cycle-2 detector enforced is preserved: an omitted `TO` is
 * PUBLIC, an unrecognised `FOR` is ALL, an unrecognised `AS` is PERMISSIVE, a
 * statement with no terminator inside MAX_STATEMENT_CHARS is unconditional, and
 * trust and RESTRICTIVE are still judged on what was actually read.
 */
import { MAX_STATEMENT_CHARS } from "./bounds"
import { type Token, isClose, isOpen, isSymbol, isWord } from "./lexer"
import {
  type PredicateClassification,
  classifyPredicate,
  matchingCloseParen,
  topLevelWordIndex,
} from "./predicate"

/**
 * Grantees that must never hold an unconditional PERMISSIVE policy.
 *
 * `public` is listed because an omitted `TO` clause IS a grant to PUBLIC — the
 * dangerous default, not a neutral one. `anon` is Supabase's unauthenticated
 * Data API role.
 */
export const UNTRUSTED_GRANTEES = ["public", "anon"]

/** The commands a policy can govern; PostgreSQL defaults an omitted `FOR` to `ALL`. */
export type PolicyCommand = "all" | "select" | "insert" | "update" | "delete"

/** `unknown` is set by an `%I` hole: a grantee this guard cannot name. */
export type Grantees = { roles: string[]; unknown: boolean }

export type PolicyStatement = {
  header: Token
  tokens: Token[]
  truncated: boolean
  clipped: boolean
  command: PolicyCommand
  permissive: boolean
  grantees: Grantees
  using: PredicateClassification
  check: PredicateClassification
}

/** Indices of every `CREATE|ALTER` immediately followed by `POLICY`. Comments are gone. */
export const policyHeaderIndices = (tokens: Token[]): number[] => {
  const indices: number[] = []
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const keyword = tokens[index]
    if (keyword.kind !== "word") continue
    if (keyword.text !== "create" && keyword.text !== "alter") continue
    if (isWord(tokens[index + 1], "policy")) indices.push(index)
  }
  return indices
}

/** The clause keywords that end the `ON <table>` region and begin the clause list. */
const CLAUSE_KEYWORDS = ["as", "for", "to", "using", "with"]

const clauseSearchStart = (tokens: Token[]): number => {
  const on = topLevelWordIndex(tokens, "on", 2)
  if (on === -1) return tokens.length

  let depth = 0
  for (let index = on + 1; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) depth += 1
    else if (isClose(tokens[index])) depth = Math.max(0, depth - 1)
    else if (CLAUSE_KEYWORDS.some(keyword => depth === 0 && isWord(tokens[index], keyword))) {
      return index
    }
  }
  return tokens.length
}

const clauseIndex = (tokens: Token[], clause: string): number =>
  topLevelWordIndex(tokens, clause, clauseSearchStart(tokens))

export const granteesOf = (tokens: Token[]): Grantees => {
  const to = clauseIndex(tokens, "to")
  const predicate = [clauseIndex(tokens, "using"), clauseIndex(tokens, "with")]
    .filter(index => index !== -1)
    .reduce((earliest, index) => Math.min(earliest, index), tokens.length)

  // No executable `TO` before the predicates is PostgreSQL's PUBLIC default.
  if (to === -1 || to > predicate) return { roles: ["public"], unknown: false }

  const roles: string[] = []
  let unknown = false
  for (let index = to + 1; index < predicate; index += 1) {
    const token = tokens[index]
    if (token.kind === "word") roles.push(token.text)
    else if (token.kind === "quoted") {
      if (token.name === undefined) unknown = true
      else roles.push(token.name)
    } else if (!isSymbol(token, ",")) break
  }

  if (roles.length === 0 && !unknown) return { roles: ["public"], unknown: false }
  return { roles, unknown }
}

/**
 * The command the statement governs. Anything unrecognised — including a `FOR`
 * clause clipped away by truncation — falls back to `ALL`, the widest and so the
 * fail-closed reading.
 */
export const commandOf = (tokens: Token[]): PolicyCommand => {
  const clause = clauseIndex(tokens, "for")
  const command = tokens[clause + 1]
  return command?.kind === "word" &&
    ["all", "select", "insert", "update", "delete"].includes(command.text)
    ? (command.text as PolicyCommand)
    : "all"
}

/** RESTRICTIVE policies can only ever narrow access, so they are never a grant. */
export const isPermissive = (tokens: Token[]): boolean => {
  const as = clauseIndex(tokens, "as")
  return as === -1 || !isWord(tokens[as + 1], "restrictive")
}

/**
 * The tokens of a predicate, or why there are none. `malformed` covers a missing
 * or unclosed parenthesis and classifies as `uncertain`, which is fail-closed.
 */
export const predicateTokens = (
  tokens: Token[],
  clause: "using" | "with"
): Token[] | "absent" | "malformed" => {
  let index = clauseIndex(tokens, clause)
  if (index === -1) return "absent"
  if (clause === "with") {
    if (!isWord(tokens[index + 1], "check")) return "absent"
    index += 1
  }

  const open = index + 1
  if (!isOpen(tokens[open])) return "malformed"
  const close = matchingCloseParen(tokens, open)
  if (close === -1) return "malformed"
  return tokens.slice(open + 1, close)
}

export const predicateOf = (tokens: Token[], clause: "using" | "with"): PredicateClassification => {
  const slice = predicateTokens(tokens, clause)
  if (slice === "absent") return "absent"
  if (slice === "malformed") return "uncertain"
  return classifyPredicate(slice)
}

/**
 * Bound the statement that starts at `headerIndex`.
 *
 * It ends at the next depth-0 `;`. If none is reached within
 * MAX_STATEMENT_CHARS value characters of the header, or the stream runs out, or
 * an `unterminated` token appears, the statement is `truncated` — the
 * fail-closed reading, because the window may have ended after a scoped
 * predicate but before a tautological one.
 */
export const policyStatementAt = (
  tokens: Token[],
  headerIndex: number,
  valueLength: number
): PolicyStatement => {
  const header = tokens[headerIndex]
  const capEnd = header.range.start + MAX_STATEMENT_CHARS
  const clipped = valueLength - header.range.start > MAX_STATEMENT_CHARS

  const statement: Token[] = []
  let truncated = true
  let depth = 0

  for (let index = headerIndex; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.kind === "unterminated") {
      statement.push(token)
      break
    }
    if (token.range.end > capEnd) break
    if (depth === 0 && isSymbol(token, ";")) {
      truncated = false
      break
    }
    if (isOpen(token)) depth += 1
    else if (isClose(token)) depth = Math.max(0, depth - 1)
    statement.push(token)
  }

  return {
    header,
    tokens: statement,
    truncated,
    clipped,
    command: commandOf(statement),
    permissive: isPermissive(statement),
    grantees: granteesOf(statement),
    using: predicateOf(statement, "using"),
    check: predicateOf(statement, "with"),
  }
}

/**
 * True when the statement leaves at least one operation it governs
 * unconditionally open.
 *
 * PostgreSQL applies the two predicates to disjoint halves of a policy: `USING`
 * decides which existing rows are visible (SELECT, DELETE, and the read half of
 * UPDATE/ALL), `WITH CHECK` decides which new rows may be written (INSERT and
 * the write half of UPDATE/ALL). They are combined per-operation and never
 * ANDed across both halves: `FOR ALL TO anon USING (true) WITH CHECK (owner =
 * auth.uid())` scopes writes yet still hands every row to anonymous readers, and
 * an AND would have called that safe.
 *
 * A predicate that governs an operation but is absent counts as unconditional:
 * PostgreSQL stores no qual for it and filters nothing, and a statement clipped
 * at MAX_STATEMENT_CHARS loses its predicates the same way. When `WITH CHECK` is
 * omitted PostgreSQL reuses `USING` as the check, so the write half inherits it.
 */
const isUnconditional = (statement: PolicyStatement): boolean => {
  const constrainsAccess = (predicate: PredicateClassification): boolean =>
    predicate === "constant-false" || predicate === "constant-null" || predicate === "row-dependent"
  const readsUnconditionally = !constrainsAccess(statement.using)
  const writesUnconditionally =
    statement.check === "absent" ? readsUnconditionally : !constrainsAccess(statement.check)

  switch (statement.command) {
    case "select":
    case "delete":
      return readsUnconditionally
    case "insert":
      return writesUnconditionally
    default:
      // UPDATE and ALL span both halves, so neither predicate can mask the other.
      return readsUnconditionally || writesUnconditionally
  }
}

/**
 * A statement whose terminator was never found is treated as unconditional. The
 * window may have ended anywhere — including after a scoped `USING` but before
 * the `WITH CHECK (true)` that follows it — so a truncated statement cannot be
 * read as evidence that a predicate is scoped. Trust and RESTRICTIVE are still
 * judged on what was actually read: a `service_role` grant does not become
 * dangerous by being long.
 */
const clippedGranteeMayContinue = (statement: PolicyStatement): boolean => {
  if (!statement.truncated || !statement.clipped) return false
  if (clauseIndex(statement.tokens, "to") === -1) return false
  return (
    clauseIndex(statement.tokens, "using") === -1 && clauseIndex(statement.tokens, "with") === -1
  )
}

const hasUntrustedGrantee = (grantees: Grantees): boolean =>
  grantees.unknown || grantees.roles.some(role => UNTRUSTED_GRANTEES.includes(role))

export const isDangerous = (statement: PolicyStatement): boolean =>
  statement.permissive &&
  (statement.truncated || isUnconditional(statement)) &&
  (hasUntrustedGrantee(statement.grantees) || clippedGranteeMayContinue(statement))
