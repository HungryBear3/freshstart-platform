import * as React from "react";
import "./_components/styles.css";

// Standalone layout for the v2 preview redesign. Intentionally does NOT
// nest the production /app layout — v2 is a parallel route and must not
// inherit the in-flight homepage chrome. The root html/body already comes
// from app/layout.tsx so we just return children here.

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
