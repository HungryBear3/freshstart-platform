// Shared FreshStart-IL placeholder logo (wordmark + gradient mark).
// Real production logo SVG is deferred — see _DEFERRED_ITEMS.md.
import * as React from "react";

let gradientCounter = 0;

export function Logo({ idSuffix }: { idSuffix?: string } = {}) {
  const gradId = `fs-logo-grad-${idSuffix ?? ++gradientCounter}`;
  return (
    <span className="fs-logo">
      <svg viewBox="0 0 32 32" className="fs-logo-mark" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <path
          d="M16 3 C 22 7, 26 12, 26 18 C 26 24, 21 29, 16 29 C 11 29, 6 24, 6 18 C 6 12, 10 7, 16 3 Z"
          fill={`url(#${gradId})`}
        />
        <path
          d="M12 16 L15 19 L21 13"
          stroke="#fff"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="fs-logo-wm">
        Fresh<span className="fs-logo-accent">Start</span>
        <span className="fs-logo-il">IL</span>
      </span>
    </span>
  );
}
