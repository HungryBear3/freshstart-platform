/**
 * The bounded constant evaluator for PL/pgSQL dynamic SQL.
 *
 * Anything this module cannot fold to a constant `Text` is blocked
 * unconditionally by the analyzer — never gated on a "mentions POLICY"
 * heuristic, because a header can be split across fragments
 * (`'CREATE POL' || v || 'ICY'`) and no substring gate survives that.
 *
 * Supported grammar:
 *
 *   expr := term ( '||' term )*        // and two literals whose gap holds a newline
 *   term := literal | number | variable | '(' expr ')'
 *         | term '::' (text|varchar|name)
 *         | 'format' '(' expr (',' arg)* ')'
 *   arg  := expr | 'null' | <anything else → Unknown>
 *
 * Only `format()` may produce a hole, and only for an unknown `%I`/`%L`
 * argument. Every other operand must be a hole-free constant: copying a holed
 * value would lose the record that a placeholder is unresolved, so it is
 * refused instead.
 */
import {
  MAX_EVALUATED_CHARS,
  MAX_EXPRESSION_DEPTH,
  MAX_FORMAT_ARGS,
  MAX_TRACKED_VARIABLES,
} from "./bounds"
import { type Token, isClose, isOpen, isSymbol, isWord, literalText, wordTextOf } from "./lexer"
import { TextAssembler, type Text, identityText } from "./source-text"
import { matchingCloseParen } from "./predicate"

export type Folded = { ok: true; text: Text } | { ok: false; reason: string }

/** Reasons never reach the failure output; the reported label is the kind alone. */
export const unfoldable = (reason: string): Folded => ({ ok: false, reason })

/**
 * Straight-line variable tracking for one procedural body.
 *
 * `straightLine` is set by the analyzer before each logical statement: true in
 * the DECLARE section and at the top level of the outermost BEGIN block, false
 * inside any nested block or after an EXCEPTION clause, where control flow can
 * reach a statement with a value this evaluator did not compute.
 */
export class VariableEnvironment {
  straightLine = true

  private readonly values = new Map<string, Folded>()
  private readonly assignedOnStraightLine = new Set<string>()

  constructor(private readonly assignmentCounts: Map<string, number>) {}

  private get tracking(): boolean {
    return this.assignmentCounts.size <= MAX_TRACKED_VARIABLES
  }

  assign(name: string, value: Folded): void {
    if (!this.tracking) return
    if (!this.straightLine) {
      this.values.set(name, unfoldable("assigned outside a straight-line position"))
      return
    }
    this.values.set(name, value)
    this.assignedOnStraightLine.add(name)
  }

  /**
   * An unmodelled procedural statement may write any tracked variable it
   * mentions (CALL arguments may be INOUT, for example). Forget those values
   * rather than trusting a stale constant after a construct we do not model.
   */
  invalidateReferenced(tokens: Token[]): void {
    if (!this.tracking) return
    const referenced = new Set(
      tokens.map(wordTextOf).filter((name): name is string => name !== undefined)
    )
    for (const name of this.values.keys()) {
      if (referenced.has(name)) {
        this.values.set(name, unfoldable("variable mentioned by an unsupported construct"))
      }
    }
  }

  lookup(name: string): Folded {
    if (!this.tracking) return unfoldable("too many tracked variables")
    const value = this.values.get(name)
    if (value === undefined) return unfoldable("unassigned variable")
    if (this.straightLine) return value
    // Off the straight line, a value is only knowable when the body assigns the
    // variable exactly once and that assignment was already folded.
    return this.assignmentCounts.get(name) === 1 && this.assignedOnStraightLine.has(name)
      ? value
      : unfoldable("variable may be reassigned")
  }
}

/** A folded value. `null` is tracked separately because `format()` treats it specially. */
type Value = { kind: "text"; text: Text } | { kind: "null" } | { kind: "unknown"; reason: string }

const unknown = (reason: string): Value => ({ kind: "unknown", reason })

/** Casts that cannot change a string's characters, and so may be folded away. */
const NO_OP_CASTS = ["text", "varchar", "name"]

/** Split at depth-0 occurrences of `symbol`. */
const splitTopLevel = (tokens: Token[], symbol: string): Token[][] => {
  const parts: Token[][] = []
  let current: Token[] = []
  let depth = 0

  for (const token of tokens) {
    if (depth === 0 && isSymbol(token, symbol)) {
      parts.push(current)
      current = []
      continue
    }
    if (isOpen(token)) depth += 1
    else if (isClose(token)) depth = Math.max(0, depth - 1)
    current.push(token)
  }

  parts.push(current)
  return parts
}

/**
 * Concatenation operands: depth-0 `||`, plus PostgreSQL's rule that two string
 * literals separated by whitespace containing a newline are one continued string.
 */
const concatOperands = (tokens: Token[], text: Text): Token[][] => {
  const parts: Token[][] = []
  let current: Token[] = []
  let depth = 0

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (depth === 0 && isSymbol(token, "||")) {
      parts.push(current)
      current = []
      continue
    }
    if (
      depth === 0 &&
      current.length > 0 &&
      token.kind === "literal" &&
      tokens[index - 1].kind === "literal" &&
      text.value.slice(tokens[index - 1].range.end, token.range.start).includes("\n")
    ) {
      parts.push(current)
      current = []
    }
    if (isOpen(token)) depth += 1
    else if (isClose(token)) depth = Math.max(0, depth - 1)
    current.push(token)
  }

  parts.push(current)
  return parts
}

const constantText = (value: Value): Text | undefined =>
  value.kind === "text" && value.text.holes.length === 0 ? value.text : undefined

const hasCapacity = (assembler: TextAssembler, characters: number): boolean =>
  characters <= MAX_EVALUATED_CHARS - assembler.length

const quotedLength = (source: Text, quote: string): number => {
  let length = source.value.length + 2
  for (const character of source.value) if (character === quote) length += 1
  return length
}

type Evaluate = (tokens: Token[], depth: number) => Value

/**
 * Substitute `args` into `template` per PostgreSQL's `format()` rules, keeping
 * every character's original source offset.
 */
const substitute = (template: Text, args: Value[]): Value => {
  const assembler = new TextAssembler()
  const { value } = template
  let sequential = 0
  let index = 0

  while (index < value.length) {
    if (value[index] !== "%") {
      if (!hasCapacity(assembler, 1)) return unknown("evaluated text too long")
      assembler.appendSlice(template, index, index + 1)
      index += 1
      continue
    }

    const origin = template.originAt(index)
    let cursor = index + 1

    if (value[cursor] === "%") {
      if (!hasCapacity(assembler, 1)) return unknown("evaluated text too long")
      assembler.appendRaw("%", origin)
      index = cursor + 1
      continue
    }

    let digits = ""
    while (/[0-9]/.test(value[cursor] ?? "")) {
      digits += value[cursor]
      cursor += 1
    }
    let position: number | undefined
    if (digits.length > 0) {
      // Flags and widths are not supported; only an explicit `n$` position is.
      if (value[cursor] !== "$") return unknown("unsupported format specification")
      position = Number(digits)
      cursor += 1
    }

    const conversion = value[cursor]
    if (conversion !== "s" && conversion !== "I" && conversion !== "L") {
      return unknown("unsupported format specification")
    }

    const argumentIndex = position === undefined ? sequential : position - 1
    if (argumentIndex < 0 || argumentIndex >= args.length) {
      return unknown("format argument index out of range")
    }
    // PostgreSQL resumes an unpositioned conversion after the argument most
    // recently consumed, including an explicitly positioned conversion.
    sequential = argumentIndex + 1
    const argument = args[argumentIndex]

    if (conversion === "s") {
      if (argument.kind === "unknown") return unknown("unbounded %s substitution")
      if (argument.kind === "text") {
        const constant = constantText(argument)
        if (!constant) return unknown("operand holds an unresolved placeholder")
        if (!hasCapacity(assembler, constant.value.length))
          return unknown("evaluated text too long")
        assembler.appendText(constant)
      }
      // A null `%s` renders as the empty string.
    } else if (argument.kind === "unknown") {
      if (!hasCapacity(assembler, 1)) return unknown("evaluated text too long")
      assembler.appendHole(conversion, origin)
    } else if (conversion === "I") {
      // PostgreSQL raises on a null identifier, so there is nothing to fold.
      if (argument.kind === "null") return unknown("null identifier")
      const constant = constantText(argument)
      if (!constant) return unknown("operand holds an unresolved placeholder")
      if (!hasCapacity(assembler, quotedLength(constant, '"'))) {
        return unknown("evaluated text too long")
      }
      assembler.appendRaw('"', origin)
      appendDoubling(assembler, constant, '"')
      assembler.appendRaw('"', origin)
    } else if (argument.kind === "null") {
      if (!hasCapacity(assembler, 4)) return unknown("evaluated text too long")
      assembler.appendRaw("NULL", origin)
    } else {
      const constant = constantText(argument)
      if (!constant) return unknown("operand holds an unresolved placeholder")
      if (!hasCapacity(assembler, quotedLength(constant, "'"))) {
        return unknown("evaluated text too long")
      }
      assembler.appendRaw("'", origin)
      appendDoubling(assembler, constant, "'")
      assembler.appendRaw("'", origin)
    }

    index = cursor + 1
  }

  return { kind: "text", text: assembler.build(template.originAt(value.length)) }
}

/** Append `source`, doubling every `quote` character, preserving origins. */
const appendDoubling = (assembler: TextAssembler, source: Text, quote: string): void => {
  for (let index = 0; index < source.value.length; index += 1) {
    assembler.appendSlice(source, index, index + 1)
    if (source.value[index] === quote) assembler.appendRaw(quote, source.originAt(index))
  }
}

const evaluateFormat = (tokens: Token[], depth: number, evaluate: Evaluate): Value => {
  const inner = tokens.slice(2, -1)
  const parts = splitTopLevel(inner, ",")
  if (parts.length - 1 > MAX_FORMAT_ARGS) return unknown("too many format arguments")

  const template = evaluate(parts[0], depth + 1)
  const constant = constantText(template)
  // A template that already holds a hole cannot be re-scanned for placeholders.
  if (!constant) return unknown("format template is not a constant")

  return substitute(
    constant,
    parts.slice(1).map(part => evaluate(part, depth + 1))
  )
}

const evaluateTerm = (
  input: Token[],
  depth: number,
  environment: VariableEnvironment,
  evaluate: Evaluate
): Value => {
  let tokens = input

  // Fold away trailing no-op casts; any other cast is not provably transparent.
  while (tokens.length >= 2 && isSymbol(tokens[tokens.length - 2], "::")) {
    const cast = wordTextOf(tokens[tokens.length - 1])
    if (cast === undefined || !NO_OP_CASTS.includes(cast)) return unknown("unsupported cast")
    tokens = tokens.slice(0, -2)
  }

  if (tokens.length === 0) return unknown("empty expression")

  if (isOpen(tokens[0]) && matchingCloseParen(tokens, 0) === tokens.length - 1) {
    return evaluate(tokens.slice(1, -1), depth + 1)
  }

  if (
    isWord(tokens[0], "format") &&
    isOpen(tokens[1]) &&
    matchingCloseParen(tokens, 1) === tokens.length - 1
  ) {
    return evaluateFormat(tokens, depth, evaluate)
  }

  if (tokens.length !== 1) return unknown("not a constant expression")
  const token = tokens[0]

  if (token.kind === "literal") {
    const decoded = literalText(token)
    if (!decoded) return unknown("unresolved literal placeholder")
    if (decoded.value.length > MAX_EVALUATED_CHARS) return unknown("evaluated text too long")
    return { kind: "text", text: decoded }
  }

  if (token.kind === "number") {
    return { kind: "text", text: identityText(token.text, token.span.start) }
  }

  if (token.kind === "word") {
    if (token.text === "null") return { kind: "null" }
    const looked = environment.lookup(token.text)
    if (!looked.ok) return unknown(looked.reason)
    return looked.text.value.length <= MAX_EVALUATED_CHARS
      ? { kind: "text", text: looked.text }
      : unknown("evaluated text too long")
  }

  return unknown("not a constant term")
}

const evaluateIn = (text: Text, environment: VariableEnvironment): Evaluate => {
  const evaluate: Evaluate = (tokens, depth) => {
    if (depth > MAX_EXPRESSION_DEPTH) return unknown("expression too deep")

    const operands = concatOperands(tokens, text)
    if (operands.length === 1) return evaluateTerm(tokens, depth, environment, evaluate)

    const assembler = new TextAssembler()
    let endOrigin = 0
    for (const operand of operands) {
      const constant = constantText(evaluateTerm(operand, depth, environment, evaluate))
      // `||` with a null or non-foldable operand yields nothing this guard can read.
      if (!constant) return unknown("non-constant concatenation operand")
      if (!hasCapacity(assembler, constant.value.length)) return unknown("evaluated text too long")
      assembler.appendText(constant)
      endOrigin = constant.originAt(constant.value.length)
    }
    return { kind: "text", text: assembler.build(endOrigin) }
  }
  return evaluate
}

/**
 * Fold a constant string expression that appears at `tokens` inside `text`.
 * `text` is needed only for the newline-continued-literal rule, which is a
 * property of the source gap between two literals.
 */
export const foldExpression = (
  tokens: Token[],
  environment: VariableEnvironment,
  text: Text
): Folded => {
  const value = evaluateIn(text, environment)(tokens, 0)
  if (value.kind === "null") return unfoldable("null is not executable SQL")
  if (value.kind === "unknown") return unfoldable(value.reason)
  if (value.text.value.length > MAX_EVALUATED_CHARS) return unfoldable("evaluated text too long")
  return { ok: true, text: value.text }
}
