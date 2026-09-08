/**
 * Every bound the offline RLS-recipe guard enforces, in one place.
 *
 * Each constant has a breach test. Breaching a bound is never silent: it either
 * forces the fail-closed `truncated` reading of a policy statement, or produces
 * a reported `unsupported dynamic SQL` site, or collapses a value to Unknown.
 */

/** Skip anything too large to be a hand-written runbook or migration. */
export const MAX_SCANNED_BYTES = 2 * 1024 * 1024

/**
 * How far past `CREATE POLICY` to read when no statement terminator is found.
 * Truncation is deliberately fail-closed: a clipped statement is classified
 * unconditional outright, because the window may have ended after a scoped
 * predicate but before a tautological one, and gets reported rather than
 * silently skipped. Padding a predicate past this limit is therefore not a way
 * around the guard.
 */
export const MAX_STATEMENT_CHARS = 800

/** How deep procedural bodies and folded `EXECUTE` texts may nest. */
export const MAX_NESTING_DEPTH = 4

/** How large a constant-folded dynamic SQL string may grow. */
export const MAX_EVALUATED_CHARS = 65536

/** How many arguments a foldable `format()` call may take. */
export const MAX_FORMAT_ARGS = 64

/** How many PL/pgSQL variable names one body may track before all lookups go Unknown. */
export const MAX_TRACKED_VARIABLES = 256

/** How deep predicate classification may recurse before answering `uncertain`. */
export const MAX_EXPRESSION_DEPTH = 64
