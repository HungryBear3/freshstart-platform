# Error Tracking Setup

## Sentry Integration

### Installation

```bash
npm install @sentry/nextjs
```

### Setup

1. **Create Sentry account** at https://sentry.io
2. **Create a new project** (Next.js)
3. **Get your DSN** from project settings
4. **Add to environment variables**:
   ```bash
   SENTRY_DSN=your-sentry-dsn-here
   ```

### Initialize Sentry

Sentry will be automatically initialized when `SENTRY_DSN` is set.

### Usage

```typescript
import { errorTracker } from "@/lib/monitoring/error-tracking"

// Capture an error
try {
  // some code
} catch (error) {
  errorTracker.captureError(error, {
    userId: user.id,
    path: "/api/endpoint",
  })
}

// Capture a message
errorTracker.captureMessage("Something happened", "warning", {
  userId: user.id,
})

// Set user context
errorTracker.setUser({
  id: user.id,
  email: user.email,
  name: user.name,
})
```

### Next.js Integration

For full Next.js integration, run:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Install Sentry SDK
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.js`

### Alternative: Console Logging

If Sentry is not configured, errors will be logged to console. This is suitable for development.

## Other Error Tracking Options

### LogRocket
- Session replay and error tracking
- Installation: `npm install logrocket`
- Setup: https://docs.logrocket.com/docs/nextjs

### Bugsnag
- Error tracking and monitoring
- Installation: `npm install @bugsnag/js @bugsnag/plugin-react`
- Setup: https://docs.bugsnag.com/platforms/javascript/react

### Rollbar
- Error tracking and monitoring
- Installation: `npm install rollbar`
- Setup: https://docs.rollbar.com/docs/nextjs
