/**
 * CC-05 B3 — closed-schema readers shared by the packet request and the packet
 * verifier.
 *
 * The blocked schema walked lists with `forEach` (which skips holes) and read
 * fields as `value[key]` (which finds inherited ones), so `new Array(1)` and
 * prototype-supplied fields passed as validated. These readers look only at
 * OWN DATA properties:
 *
 *   - a list is a real array whose every index 0..length-1 is an own data
 *     property — a hole is a violation — with no other own keys;
 *   - an object is an ordinary or null-prototype object whose every declared
 *     field is an own data property, with no undeclared keys;
 *   - a getter is refused and never invoked;
 *   - each value is read exactly once into a fresh copy. Callers build from
 *     that copy, never from the input, so nothing can change between the check
 *     and the use.
 *
 * Violations are reported as (path, code) and never carry a value. No I/O.
 */

export type Report = (path: string, code: string) => void
export type Reader<T = unknown> = (value: unknown, path: string, report: Report) => T
export type Check = (value: unknown) => string | null

/** Ordinary or null-prototype object. Arrays, class instances and boxed values are not. */
export function isDataObject(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

type Own = { value: unknown } | "missing" | "accessor"

function ownData(o: object, key: string): Own {
  const d = Object.getOwnPropertyDescriptor(o, key)
  if (!d) return "missing"
  return "value" in d ? { value: d.value } : "accessor"
}

/** A scalar field: `check` returns a code or null; the value passes through. */
export const leaf =
  (check: Check): Reader =>
  (v, path, report) => {
    const code = check(v)
    if (code) report(path, code)
    return v
  }

export interface FieldSpec {
  read: Reader
  optional?: boolean
}

/** A closed object. Returns a fresh ordinary copy of the declared fields, or null. */
export function shape(
  fields: Record<string, Reader | FieldSpec>
): Reader<Record<string, unknown> | null> {
  const specs = Object.entries(fields).map(([k, f]) =>
    typeof f === "function" ? { key: k, read: f, optional: false } : { key: k, ...f }
  )
  const declared = new Set(specs.map(s => s.key))
  return (v, path, report) => {
    if (!isDataObject(v)) {
      report(path, "not_object")
      return null
    }
    if (Reflect.ownKeys(v).some(k => typeof k !== "string" || !declared.has(k))) {
      report(path, "unknown_key")
    }
    const copy: Record<string, unknown> = {}
    for (const { key, read, optional } of specs) {
      const own = ownData(v, key)
      if (own === "missing") {
        if (!optional) report(`${path}.${key}`, "missing")
        continue
      }
      if (own === "accessor") {
        report(`${path}.${key}`, "accessor")
        continue
      }
      copy[key] = read(own.value, `${path}.${key}`, report)
    }
    return copy
  }
}

/** A dense list of at most `max` elements. Returns a fresh copy, or null. */
export function list(each: Reader, max: number): Reader<unknown[] | null> {
  return (v, path, report) => {
    if (!Array.isArray(v) || Object.getPrototypeOf(v) !== Array.prototype) {
      report(path, "not_array")
      return null
    }
    const length = ownData(v, "length")
    const n = typeof length === "object" ? length.value : undefined
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
      report(path, "not_array")
      return null
    }
    // Checked before any walk, so a huge sparse length costs nothing.
    if (n > max) {
      report(path, "too_long")
      return null
    }
    const isIndex = (k: string | symbol) =>
      typeof k === "string" && /^(0|[1-9]\d*)$/.test(k) && Number(k) < n
    if (Reflect.ownKeys(v).some(k => k !== "length" && !isIndex(k))) report(path, "unknown_key")
    const copy: unknown[] = []
    for (let i = 0; i < n; i++) {
      const own = ownData(v, String(i))
      if (own === "missing") report(`${path}[${i}]`, "hole")
      else if (own === "accessor") report(`${path}[${i}]`, "accessor")
      else copy.push(each(own.value, `${path}[${i}]`, report))
    }
    return copy
  }
}

export const isString: Check = v => (typeof v === "string" ? null : "not_string")
export const isBoolean: Check = v => (typeof v === "boolean" ? null : "not_boolean")
export const oneOf = (vocab: Iterable<string>): Check => {
  const allowed: ReadonlySet<string> = new Set(vocab)
  return v => (typeof v === "string" && allowed.has(v) ? null : "not_in_vocabulary")
}
export const exactly =
  (expected: string | number | boolean | null): Check =>
  v =>
    v === expected ? null : "not_pinned_value"
export const boundedInt =
  (min: number, max: number): Check =>
  v =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? null : "out_of_range"
export const matches =
  (re: RegExp, code: string): Check =>
  v =>
    typeof v === "string" && re.test(v) ? null : code
