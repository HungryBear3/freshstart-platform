// Test page that completely bypasses root layout
// This will help us determine if the issue is in root layout/providers
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// This page doesn't use the root layout at all
export default function TestRootPage() {
  return (
    <html lang="en">
      <head>
        <title>Root Test</title>
        <meta charSet="utf-8" />
      </head>
      <body style={{ padding: "2rem", fontFamily: "system-ui", margin: 0 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          ✅ Root Layout Bypass Test
        </h1>
        <p>If you see this, the issue is in the root layout or providers.</p>
        <p>URL: /test-root</p>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Timestamp: {new Date().toISOString()}
        </p>
      </body>
    </html>
  )
}
