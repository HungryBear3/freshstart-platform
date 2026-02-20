// Test page that uses root layout but tries to avoid Providers issues
export const dynamic = 'force-dynamic'

export default function TestNoProvidersPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Test Without Providers</h1>
      <p>This page uses the root layout but should still work even if Providers fails.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
