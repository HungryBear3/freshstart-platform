/**
 * The predicate lattice, plus the token-structure walkers it shares with the
 * clause model.
 *
 * Semantics are ported unchanged from the cycle-2 detector. The only mechanical
 * differences are forced by the lexer: `::` is one symbol token, comparison
 * operators are single tokens, and — the point of the port — every parenthesis
 * walker goes through `isOpen`/`isClose`, so a literal or quoted `)` can no
 * longer close a predicate early.
 */
import { MAX_EXPRESSION_DEPTH } from "./bounds"
import { type Token, isClose, isOpen, isSymbol, isWord, literalValue } from "./lexer"

export type PredicateClassification =
  | "absent"
  | "constant-true"
  | "constant-false"
  | "constant-null"
  | "row-dependent"
  | "uncertain"

/** The comparable text of a token, or undefined for kinds that carry no name. */
const comparableText = (token: Token): string | undefined => {
  switch (token.kind) {
    case "word":
    case "number":
    case "symbol":
      return token.text
    case "quoted":
      return token.name
    case "literal":
      return token.decoded?.value
    default:
      return undefined
  }
}

export const topLevelWordIndex = (tokens: Token[], word: string, start = 0): number => {
  let depth = 0
  for (let index = start; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) depth += 1
    else if (isClose(tokens[index])) depth = Math.max(0, depth - 1)
    else if (depth === 0 && isWord(tokens[index], word)) return index
  }
  return -1
}

export const matchingCloseParen = (tokens: Token[], open: number): number => {
  let depth = 0
  for (let index = open; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) depth += 1
    else if (isClose(tokens[index])) {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

export const withoutWrappingParentheses = (tokens: Token[]): Token[] => {
  let unwrapped = tokens
  while (
    unwrapped.length > 0 &&
    isOpen(unwrapped[0]) &&
    matchingCloseParen(unwrapped, 0) === unwrapped.length - 1
  ) {
    unwrapped = unwrapped.slice(1, -1)
  }
  return unwrapped
}

const topLevelWordPositions = (tokens: Token[], word: string): number[] => {
  const positions: number[] = []
  let depth = 0
  let betweenDepth = 0
  for (let index = 0; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) depth += 1
    else if (isClose(tokens[index])) depth = Math.max(0, depth - 1)
    else if (depth === 0 && isWord(tokens[index], "between")) betweenDepth += 1
    else if (depth === 0 && word === "and" && isWord(tokens[index], "and") && betweenDepth > 0) {
      betweenDepth -= 1
    } else if (depth === 0 && isWord(tokens[index], word)) positions.push(index)
  }
  return positions
}

const topLevelSymbolPositions = (tokens: Token[], symbol: string): number[] => {
  const positions: number[] = []
  let depth = 0
  for (let index = 0; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) depth += 1
    else if (isClose(tokens[index])) depth = Math.max(0, depth - 1)
    else if (depth === 0 && isSymbol(tokens[index], symbol)) positions.push(index)
  }
  return positions
}

const splitAtPositions = (tokens: Token[], positions: number[]): Token[][] => {
  const parts: Token[][] = []
  let start = 0
  for (const position of positions) {
    parts.push(tokens.slice(start, position))
    start = position + 1
  }
  parts.push(tokens.slice(start))
  return parts
}

const tokensEqual = (left: Token[], right: Token[]): boolean =>
  left.length === right.length &&
  left.every((token, index) => {
    if (token.kind !== right[index].kind) return false
    const text = comparableText(token)
    return text !== undefined && text === comparableText(right[index])
  })

type ScalarConstant = boolean | bigint | string | null

const CAST_TO_BOOLEAN = ["bool", "boolean"]

const constantValue = (tokens: Token[]): ScalarConstant | undefined => {
  const value = withoutWrappingParentheses(tokens)
  if (
    value.length === 3 &&
    isSymbol(value[1], "::") &&
    value[2].kind === "word" &&
    CAST_TO_BOOLEAN.includes(value[2].text)
  ) {
    return constantValue(value.slice(0, 1))
  }
  if (value.length !== 1) return undefined
  if (value[0].kind === "number") {
    // Keep integer comparison exact. Oversized integers remain uncertain and
    // therefore fail closed rather than imposing unbounded BigInt work.
    return value[0].text.length <= 256 ? BigInt(value[0].text) : undefined
  }
  if (value[0].kind === "literal") return literalValue(value[0])
  if (value[0].kind !== "word") return undefined
  if (value[0].text === "true") return true
  if (value[0].text === "false") return false
  if (value[0].text === "null") return null
  return undefined
}

const COMPARISON_OPERATORS = ["<=", ">=", "<>", "!=", "=", "<", ">"]

const comparisonAt = (tokens: Token[]): { index: number; operator: string } | null => {
  let depth = 0
  for (let index = 0; index < tokens.length; index += 1) {
    if (isOpen(tokens[index])) {
      depth += 1
      continue
    }
    if (isClose(tokens[index])) {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth !== 0) continue

    const token = tokens[index]
    if (token.kind === "symbol" && COMPARISON_OPERATORS.includes(token.text)) {
      return { index, operator: token.text }
    }
  }
  return null
}

const NON_ROW_WORDS = new Set([
  "and",
  "or",
  "not",
  "is",
  "true",
  "false",
  "null",
  "exists",
  "select",
  "from",
  "where",
  "with",
  "as",
  "auth",
  "uid",
  "current_setting",
  "text",
  "boolean",
  "date",
  "interval",
  "timestamp",
  "timestamptz",
  "current_date",
  "current_time",
  "current_timestamp",
  "localtime",
  "localtimestamp",
  "current_user",
  "session_user",
  "current_role",
  "current_catalog",
  "current_schema",
  "user",
  "between",
  "in",
  "distinct",
])

const hasDemonstrableRowReference = (tokens: Token[]): boolean =>
  tokens.some((token, index) => {
    // A quoted function call is a call, not a column. An `%I` hole is a bare
    // identifier and so still counts as a row reference.
    if (token.kind === "quoted") return !isOpen(tokens[index + 1])
    if (token.kind !== "word" || NON_ROW_WORDS.has(token.text)) return false
    if (isOpen(tokens[index + 1])) return false
    if (
      isSymbol(tokens[index + 1], ".") &&
      tokens[index + 2]?.kind === "word" &&
      isOpen(tokens[index + 3])
    ) {
      return false
    }
    if (isSymbol(tokens[index - 1], "::")) return false
    return true
  })

const hasScopedCallerReference = (tokens: Token[]): boolean =>
  tokens.some(
    (token, index) =>
      isWord(token, "auth") &&
      isSymbol(tokens[index + 1], ".") &&
      isWord(tokens[index + 2], "jwt") &&
      isOpen(tokens[index + 3])
  )

const isAuthJwtCall = (input: Token[]): boolean => {
  const tokens = withoutWrappingParentheses(input)
  return (
    tokens.length === 5 &&
    isWord(tokens[0], "auth") &&
    isSymbol(tokens[1], ".") &&
    isWord(tokens[2], "jwt") &&
    isOpen(tokens[3]) &&
    isClose(tokens[4])
  )
}

type NullCheck = { expression: Token[]; negated: boolean }

const nullCheckOf = (input: Token[]): NullCheck | null => {
  const tokens = withoutWrappingParentheses(input)
  const is = topLevelWordIndex(tokens, "is")
  if (is <= 0) return null
  let cursor = is + 1
  const negated = isWord(tokens[cursor], "not")
  if (negated) cursor += 1
  if (!isWord(tokens[cursor], "null") || cursor !== tokens.length - 1) return null
  return { expression: withoutWrappingParentheses(tokens.slice(0, is)), negated }
}

const hasExcludedMiddle = (branches: Token[][]): boolean =>
  branches.some((left, leftIndex) => {
    const leftCheck = nullCheckOf(left)
    if (!leftCheck) return false
    return branches.slice(leftIndex + 1).some(right => {
      const rightCheck = nullCheckOf(right)
      return (
        rightCheck !== null &&
        leftCheck.negated !== rightCheck.negated &&
        tokensEqual(leftCheck.expression, rightCheck.expression)
      )
    })
  })

const classify = (input: Token[], depth: number): PredicateClassification => {
  if (depth > MAX_EXPRESSION_DEPTH) return "uncertain"
  const nested = (part: Token[]) => classify(part, depth + 1)

  const tokens = withoutWrappingParentheses(input)
  if (tokens.length === 0) return "uncertain"

  if (isWord(tokens[0], "case")) {
    const when = topLevelWordIndex(tokens, "when", 1)
    const then = topLevelWordIndex(tokens, "then", when + 1)
    const else_ = topLevelWordIndex(tokens, "else", then + 1)
    const end = topLevelWordIndex(tokens, "end", Math.max(then, else_) + 1)
    if (when !== 1 || then === -1 || end !== tokens.length - 1) return "uncertain"

    const condition = nested(tokens.slice(when + 1, then))
    const whenTrue = nested(tokens.slice(then + 1, else_ === -1 ? end : else_))
    const whenFalse = else_ === -1 ? "constant-null" : nested(tokens.slice(else_ + 1, end))
    if (condition === "constant-true") return whenTrue
    if (condition === "constant-false" || condition === "constant-null") return whenFalse
    if (condition !== "row-dependent") return "uncertain"
    if (whenTrue === whenFalse) return whenTrue
    return [whenTrue, whenFalse].every(result =>
      ["constant-true", "constant-false", "constant-null", "row-dependent"].includes(result)
    )
      ? "row-dependent"
      : "uncertain"
  }

  const ors = topLevelWordPositions(tokens, "or")
  if (ors.length > 0) {
    const parts = splitAtPositions(tokens, ors)
    if (hasExcludedMiddle(parts)) return "constant-true"
    const branches = parts.map(nested)
    if (branches.some(branch => branch === "constant-true")) return "constant-true"
    if (branches.every(branch => branch === "constant-false")) return "constant-false"
    if (branches.every(branch => ["constant-false", "constant-null"].includes(branch))) {
      return "constant-null"
    }
    return branches.every(branch =>
      ["constant-false", "constant-null", "row-dependent"].includes(branch)
    )
      ? "row-dependent"
      : "uncertain"
  }

  const ands = topLevelWordPositions(tokens, "and")
  if (ands.length > 0) {
    const branches = splitAtPositions(tokens, ands).map(nested)
    if (branches.some(branch => branch === "constant-false")) return "constant-false"
    if (branches.every(branch => branch === "constant-true")) return "constant-true"
    if (
      branches.some(branch => branch === "constant-null") &&
      branches.every(branch => branch !== "uncertain")
    ) {
      return "constant-null"
    }
    return branches.every(branch => ["constant-true", "row-dependent"].includes(branch))
      ? "row-dependent"
      : "uncertain"
  }

  if (isWord(tokens[0], "not")) {
    const inner = nested(tokens.slice(1))
    if (inner === "constant-true") return "constant-false"
    if (inner === "constant-false") return "constant-true"
    if (inner === "constant-null") return "constant-null"
    return inner === "row-dependent" ? "row-dependent" : "uncertain"
  }

  if (
    tokens.length === 3 &&
    tokens[0].kind === "word" &&
    ["true", "false", "null"].includes(tokens[0].text) &&
    isSymbol(tokens[1], "::") &&
    isWord(tokens[2], "boolean")
  ) {
    return tokens[0].text === "true"
      ? "constant-true"
      : tokens[0].text === "false"
        ? "constant-false"
        : "constant-null"
  }

  const is = topLevelWordIndex(tokens, "is")
  if (is > 0) {
    const left = nested(tokens.slice(0, is))
    let cursor = is + 1
    const negated = isWord(tokens[cursor], "not")
    if (negated) cursor += 1

    const target = tokens[cursor]
    if (
      target?.kind === "word" &&
      ["true", "false", "null", "unknown"].includes(target.text) &&
      cursor === tokens.length - 1
    ) {
      if (target.text === "null" && isAuthJwtCall(tokens.slice(0, is))) {
        return negated ? "constant-true" : "constant-false"
      }
      if (left === "row-dependent") return "row-dependent"
      if (!["constant-true", "constant-false", "constant-null"].includes(left)) return "uncertain"
      const value = left === "constant-true" ? "true" : left === "constant-false" ? "false" : "null"
      const result = value === (target.text === "unknown" ? "null" : target.text)
      return result !== negated ? "constant-true" : "constant-false"
    }

    if (isWord(tokens[cursor], "distinct") && isWord(tokens[cursor + 1], "from")) {
      const rightTokens = tokens.slice(cursor + 2)
      const right = nested(rightTokens)
      if (left === "row-dependent" || right === "row-dependent") return "row-dependent"
      if (
        !["constant-true", "constant-false", "constant-null"].includes(left) ||
        !["constant-true", "constant-false", "constant-null"].includes(right)
      ) {
        return "uncertain"
      }
      const distinct = left !== right
      return distinct !== negated ? "constant-true" : "constant-false"
    }
  }

  if (tokens.length === 1 && isWord(tokens[0], "null")) return "constant-null"

  if (
    isWord(tokens[0], "coalesce") &&
    isOpen(tokens[1]) &&
    matchingCloseParen(tokens, 1) === tokens.length - 1
  ) {
    const inner = tokens.slice(2, -1)
    for (const argument of splitAtPositions(inner, topLevelSymbolPositions(inner, ","))) {
      const classification = nested(argument)
      if (classification === "constant-null") continue
      if (classification === "constant-true" || classification === "constant-false") {
        return classification
      }
      if (classification === "row-dependent") return "row-dependent"
      return "uncertain"
    }
    return "constant-null"
  }

  const constant = constantValue(tokens)
  if (constant === true) return "constant-true"
  if (constant === false) return "constant-false"

  const comparison = comparisonAt(tokens)
  if (comparison) {
    const left = tokens.slice(0, comparison.index)
    const right = tokens.slice(comparison.index + 1)
    const leftConstant = constantValue(left)
    const rightConstant = constantValue(right)

    if (leftConstant === null || rightConstant === null) return "constant-null"
    if (leftConstant !== undefined && rightConstant !== undefined) {
      if (typeof leftConstant !== typeof rightConstant) return "uncertain"
      let result: boolean
      if (comparison.operator === "=") result = leftConstant === rightConstant
      else if (comparison.operator === "!=" || comparison.operator === "<>") {
        result = leftConstant !== rightConstant
      } else if (
        (typeof leftConstant === "bigint" && typeof rightConstant === "bigint") ||
        (typeof leftConstant === "string" && typeof rightConstant === "string")
      ) {
        if (comparison.operator === "<") result = leftConstant < rightConstant
        else if (comparison.operator === "<=") result = leftConstant <= rightConstant
        else if (comparison.operator === ">") result = leftConstant > rightConstant
        else result = leftConstant >= rightConstant
      } else return "uncertain"
      return result ? "constant-true" : "constant-false"
    }

    return hasDemonstrableRowReference(tokens) || hasScopedCallerReference(tokens)
      ? "row-dependent"
      : "uncertain"
  }

  return hasDemonstrableRowReference(tokens) || hasScopedCallerReference(tokens)
    ? "row-dependent"
    : "uncertain"
}

export const classifyPredicate = (tokens: Token[]): PredicateClassification => classify(tokens, 0)
