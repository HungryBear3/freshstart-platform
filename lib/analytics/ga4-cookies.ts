const GA_CLIENT_ID_PATTERN = /^GA\d+\.\d+\.(\d+\.\d+)$/
const RAW_GA_CLIENT_ID_PATTERN = /^\d+\.\d+$/
const MAX_GA_CLIENT_ID_LENGTH = 128
const MAX_GA_INTEGER = 2_147_483_647

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function parsePositiveSafeInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > MAX_GA_INTEGER) return null
  return parsed
}

export function isValidGaClientId(value: string | null | undefined): value is string {
  return Boolean(value && value.length <= MAX_GA_CLIENT_ID_LENGTH && RAW_GA_CLIENT_ID_PATTERN.test(value))
}

export function parseGaPositiveInteger(value: string | null | undefined): number | null {
  return parsePositiveSafeInteger(value ?? undefined)
}

function measurementCookieName(measurementId: string | undefined): string | null {
  if (!measurementId) return null
  const trimmed = measurementId.trim().toUpperCase()
  if (!/^G-[A-Z0-9]+$/.test(trimmed)) return null
  return `_ga_${trimmed.slice(2)}`
}

export function parseGaIdentifiersFromCookieHeader(
  cookieHeader: string | null | undefined,
  measurementId: string | undefined,
): {
  gaClientId?: string
  gaSessionId?: number
  gaSessionNumber?: number
} {
  if (!cookieHeader) return {}

  const cookies = new Map<string, string>()
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const index = trimmed.indexOf("=")
    if (index <= 0) continue
    const name = trimmed.slice(0, index).trim()
    const decoded = safeDecode(trimmed.slice(index + 1).trim())
    if (decoded === null) return {}
    cookies.set(name, decoded)
  }

  const parsed: { gaClientId?: string; gaSessionId?: number; gaSessionNumber?: number } = {}
  const clientId = cookies.get("_ga")
  if (clientId) {
    const match = clientId.match(GA_CLIENT_ID_PATTERN)
    if (match && isValidGaClientId(match[1])) parsed.gaClientId = match[1]
  }

  const sessionCookie = cookies.get(measurementCookieName(measurementId) ?? "")
  if (!sessionCookie) return parsed

  const segments = sessionCookie.split(".")
  parsed.gaSessionId = parsePositiveSafeInteger(segments[2]) ?? undefined
  parsed.gaSessionNumber = parsePositiveSafeInteger(segments[3]) ?? undefined

  if (!parsed.gaSessionId) delete parsed.gaSessionId
  if (!parsed.gaSessionNumber) delete parsed.gaSessionNumber

  return parsed
}
