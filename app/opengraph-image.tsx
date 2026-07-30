import { ImageResponse } from "next/og"

// Site-wide default Open Graph + Twitter share image. Next 14 file
// convention: living at app/opengraph-image.tsx auto-applies to every
// route that doesn't override metadata.openGraph.images. The same image
// is reused for twitter:image when layout sets twitter.card =
// "summary_large_image".
//
// Pure SSR generation — no runtime dependencies, no static asset pipeline.
// The build embeds this as a static-ish endpoint per route.
export const runtime = "edge"
export const alt = "FreshStart IL — Illinois divorce form preparation."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b1538 0%, #1e1b4b 50%, #312e81 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
            fontSize: "24px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.45)",
            }}
          />
          FreshStart IL
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-0.02em",
          }}
        >
          We prepare your forms. You file them.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            opacity: 0.8,
            lineHeight: 1.3,
            maxWidth: "880px",
          }}
        >
          Illinois uncontested-divorce form drafts and filing guidance — $149 one-time,
          60 days of service access, no subscription.
        </div>
      </div>
    ),
    { ...size },
  )
}
