type SentryExceptionValue = {
  type?: unknown
  value?: unknown
  mechanism?: {
    type?: unknown
    synthetic?: unknown
    handled?: unknown
  }
}

type SentryLikeEvent = {
  exception?: {
    values?: SentryExceptionValue[]
  }
}

const SYNTHETIC_BROWSER_EVENT_REJECTION_VALUE =
  "Event `Event` (type=error) captured as promise rejection"
const SYNTHETIC_BROWSER_EVENT_REJECTION_MECHANISM =
  "auto.browser.global_handlers.onunhandledrejection"

export function isSyntheticBrowserEventPromiseRejection(
  event: unknown,
): boolean {
  const sentryEvent = event as SentryLikeEvent | null | undefined
  const exceptionValues = sentryEvent?.exception?.values

  if (!Array.isArray(exceptionValues)) {
    return false
  }

  return exceptionValues.some((exception) => {
    return (
      exception?.type === "Event" &&
      exception?.value === SYNTHETIC_BROWSER_EVENT_REJECTION_VALUE &&
      exception?.mechanism?.type ===
        SYNTHETIC_BROWSER_EVENT_REJECTION_MECHANISM &&
      exception?.mechanism?.synthetic === true &&
      exception?.mechanism?.handled === false
    )
  })
}

export function filterKnownSentryNoise<T>(event: T): T | null {
  if (isSyntheticBrowserEventPromiseRejection(event)) {
    return null
  }

  return event
}
