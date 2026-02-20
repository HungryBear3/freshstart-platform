// Completely bare page - no layout, no providers, no dependencies
export const dynamic = 'force-dynamic'

export default function TestBarePage() {
  return (
    <html>
      <head>
        <title>Bare Test</title>
      </head>
      <body style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>Bare Test Page - No Dependencies</h1>
        <p>If you see this, Next.js routing works.</p>
      </body>
    </html>
  )
}
