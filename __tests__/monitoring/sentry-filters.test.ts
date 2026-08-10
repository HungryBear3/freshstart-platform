import {
  filterKnownSentryNoise,
  isSyntheticBrowserEventPromiseRejection,
} from "@/lib/monitoring/sentry-filters"

describe("Sentry noise filters", () => {
  const syntheticBrowserEventPromiseRejection = {
    exception: {
      values: [
        {
          type: "Event",
          value: "Event `Event` (type=error) captured as promise rejection",
          mechanism: {
            type: "auto.browser.global_handlers.onunhandledrejection",
            synthetic: true,
            handled: false,
          },
        },
      ],
    },
  }

  it("drops the known synthetic browser Event promise-rejection noise", () => {
    expect(
      isSyntheticBrowserEventPromiseRejection(
        syntheticBrowserEventPromiseRejection,
      ),
    ).toBe(true)
    expect(filterKnownSentryNoise(syntheticBrowserEventPromiseRejection)).toBeNull()
  })

  it("keeps real promise rejections and normal exceptions", () => {
    const realErrorEvent = {
      exception: {
        values: [
          {
            type: "TypeError",
            value: "Cannot read properties of undefined",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              synthetic: false,
              handled: false,
            },
          },
        ],
      },
    }

    expect(isSyntheticBrowserEventPromiseRejection(realErrorEvent)).toBe(false)
    expect(filterKnownSentryNoise(realErrorEvent)).toBe(realErrorEvent)
  })

  it("does not broadly suppress similar browser Event errors", () => {
    const differentBrowserEvent = {
      exception: {
        values: [
          {
            type: "Event",
            value: "Event `Event` (type=load) captured as promise rejection",
            mechanism: {
              type: "auto.browser.global_handlers.onunhandledrejection",
              synthetic: true,
              handled: false,
            },
          },
        ],
      },
    }

    expect(isSyntheticBrowserEventPromiseRejection(differentBrowserEvent)).toBe(
      false,
    )
    expect(filterKnownSentryNoise(differentBrowserEvent)).toBe(
      differentBrowserEvent,
    )
  })
})
