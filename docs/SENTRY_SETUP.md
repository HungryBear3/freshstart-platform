# Sentry Error Tracking Setup

Sentry is integrated for error monitoring. Errors are captured when `SENTRY_DSN` (and optionally `NEXT_PUBLIC_SENTRY_DSN` for client) is set.

## Setup

1. **Create a Sentry account** at https://sentry.io
2. **Create a project** (choose Next.js)
3. **Add environment variables** to `.env.local` and Vercel:

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

The client DSN must be public (NEXT_PUBLIC_) for browser error capture.

## What's Captured

- **Client errors**: React errors, unhandled exceptions (via `instrumentation-client.ts`, `global-error.tsx`, `ErrorBoundary`)
- **Server errors**: API routes, Server Components (via `instrumentation.ts`, `sentry.server.config.ts`)
- **Edge errors**: Middleware (via `sentry.edge.config.ts`)
- **Request errors**: `onRequestError` in instrumentation

## Optional: Source Maps

For readable stack traces in Sentry, add to Vercel:

```env
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=sntrys_xxx
```

Then wrap `next.config.ts` with `withSentryConfig` from `@sentry/nextjs`. See [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) for full config.

## Development

Errors are **not** sent to Sentry in development (`NODE_ENV=development`). They are logged to console only.
