import { isCanonicalFreshStartHost } from "@/lib/analytics/ga4-client"
import { isValidGaClientId } from "@/lib/analytics/ga4-cookies"

type TrustedPurchaseInput = {
  host: string | null | undefined
  gaClientId: string | null | undefined
  gaSessionId?: number
  gaSessionNumber?: number
  stripeSessionId: string
  fetchImpl?: typeof fetch
}

export async function sendTrustedGa4Purchase({
  host,
  gaClientId,
  gaSessionId,
  gaSessionNumber,
  stripeSessionId,
  fetchImpl = fetch,
}: TrustedPurchaseInput): Promise<boolean> {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const apiSecret = process.env.GA4_API_SECRET
  if (process.env.NODE_ENV !== "production") return false
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false
  if (process.env.NEXT_PUBLIC_ENABLE_TRACKING !== "true") return false
  if (!isCanonicalFreshStartHost(host)) return false
  if (!measurementId || !apiSecret) return false
  if (!isValidGaClientId(gaClientId)) return false
  if (gaSessionId !== undefined && (!Number.isSafeInteger(gaSessionId) || gaSessionId <= 0 || gaSessionId > 2_147_483_647)) {
    return false
  }
  if (gaSessionNumber !== undefined && (!Number.isSafeInteger(gaSessionNumber) || gaSessionNumber <= 0 || gaSessionNumber > 2_147_483_647)) {
    return false
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2000)

  try {
    const response = await fetchImpl(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          client_id: gaClientId,
          events: [{
            name: "purchase",
            params: {
              currency: "USD",
              transaction_id: stripeSessionId,
              value: 149,
              ...(gaSessionId ? { ga_session_id: gaSessionId } : {}),
              ...(gaSessionNumber ? { ga_session_number: gaSessionNumber } : {}),
              items: [{
                item_id: "freshstart-il-one-time-60-day",
                item_name: "Fresh Start one-time 60-day service access",
                price: 149,
                quantity: 1,
              }],
            },
          }],
        }),
      },
    )
    return response.ok === true
  } catch (cause) {
    console.error("[GA4] Purchase send failed", {
      reason: controller.signal.aborted || (cause instanceof Error && cause.name === "AbortError")
        ? "timeout"
        : "provider_error",
    })
    return false
  } finally {
    clearTimeout(timer)
  }
}
