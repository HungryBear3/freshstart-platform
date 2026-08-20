/**
 * @jest-environment node
 */
import { sendTrustedGa4Purchase } from "@/lib/analytics/ga4-measurement-protocol"

describe("trusted GA4 purchase send", () => {
  const oldEnv = process.env

  beforeEach(() => {
    process.env = {
      ...oldEnv,
      NODE_ENV: "production",
      NEXT_PUBLIC_ENABLE_TRACKING: "true",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123XYZ",
      GA4_API_SECRET: "secret_123",
    }
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = oldEnv
    jest.restoreAllMocks()
  })

  it("refuses preview and noncanonical hosts without calling fetch", async () => {
    const fetchMock = jest.fn()

    await expect(sendTrustedGa4Purchase({
      host: "freshstart-preview-123.vercel.app",
      gaClientId: "123.456",
      stripeSessionId: "cs_123",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    await expect(sendTrustedGa4Purchase({
      host: "staging.freshstart-il.com",
      gaClientId: "123.456",
      stripeSessionId: "cs_123",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("refuses preview deployments and operator opt-out without calling fetch", async () => {
    const fetchMock = jest.fn()

    process.env.VERCEL_ENV = "preview"
    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123.456",
      stripeSessionId: "cs_123",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    process.env.VERCEL_ENV = "production"
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "false"
    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123.456",
      stripeSessionId: "cs_123",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("contains provider exceptions and clears the timeout path", async () => {
    jest.useFakeTimers()
    const fetchMock = jest.fn((_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))
    }))

    const pending = sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123.456",
      stripeSessionId: "cs_123",
      fetchImpl: fetchMock,
    })

    jest.advanceTimersByTime(2000)
    await expect(pending).resolves.toBe(false)
    expect(console.error).toHaveBeenCalledWith("[GA4] Purchase send failed", { reason: "timeout" })
    jest.useRealTimers()
  })

  it("builds the exact trusted purchase payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })

    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123456789.987654321",
      gaSessionId: 1724123456,
      gaSessionNumber: 7,
      stripeSessionId: "cs_test_paid",
      fetchImpl: fetchMock,
    })).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("measurement_id=G-ABC123XYZ")
    expect(String(url)).toContain("api_secret=secret_123")
    expect(init.method).toBe("POST")
    expect(String(init.body)).toBe(
      JSON.stringify({
        client_id: "123456789.987654321",
        events: [{
          name: "purchase",
          params: {
            currency: "USD",
            transaction_id: "cs_test_paid",
            value: 149,
            ga_session_id: 1724123456,
            ga_session_number: 7,
            items: [{
              item_id: "freshstart-il-one-time-60-day",
              item_name: "Fresh Start one-time 60-day service access",
              price: 149,
              quantity: 1,
            }],
          },
        }],
      }),
    )
  })

  it("rejects malformed or oversized signed GA metadata before payload assembly", async () => {
    const fetchMock = jest.fn()

    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: `123456789.${"9".repeat(300)}`,
      stripeSessionId: "cs_test_paid",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123456789.987654321",
      gaSessionId: Number.MAX_SAFE_INTEGER,
      gaSessionNumber: 7,
      stripeSessionId: "cs_test_paid",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123456789.987654321",
      gaSessionId: 1724123456,
      gaSessionNumber: 0,
      stripeSessionId: "cs_test_paid",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("logs only a static provider error reason", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("token=secret&email=user@example.com"))

    await expect(sendTrustedGa4Purchase({
      host: "www.freshstart-il.com",
      gaClientId: "123456789.987654321",
      stripeSessionId: "cs_test_paid",
      fetchImpl: fetchMock,
    })).resolves.toBe(false)

    expect(console.error).toHaveBeenCalledWith("[GA4] Purchase send failed", { reason: "provider_error" })
  })
})
