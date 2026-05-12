import * as React from "react";

let gradientCounter = 0;

export function Logo({ idSuffix }: { idSuffix?: string } = {}) {
  const suffix = idSuffix ?? `${++gradientCounter}`;
  const markId = `fs-logo-mark-${suffix}`;
  const sunId = `fs-logo-sun-${suffix}`;

  return (
    <span className="fs-logo" aria-label="FreshStart IL">
      <svg viewBox="0 0 40 40" className="fs-logo-mark" aria-hidden="true">
        <defs>
          <linearGradient id={markId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id={sunId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="#111A2E" stroke="#263451" strokeWidth="1.5" />
        <path
          d="M8.5 31 C12.5 23.5 19 16.5 32 11"
          fill="none"
          stroke={`url(#${markId})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path d="M15 7 h11 l5 5 v19 c0 1.6-1.3 2.9-2.9 2.9H15c-1.6 0-2.9-1.3-2.9-2.9V9.9C12.1 8.3 13.4 7 15 7z" fill="#F8FAFC" />
        <path d="M26 7 v5 h5" fill="#DBEAFE" />
        <path d="M26 7 v5 h5" fill="none" stroke="#93C5FD" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M16.5 22 h9.5" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 22 A4.9 4.9 0 0 1 27.8 22" fill="none" stroke={`url(#${sunId})`} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16.8 27 l2.7 2.5 l7-7.2" fill="none" stroke="#3B82F6" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="fs-logo-wm">
        FreshStart
        <span className="fs-logo-il">IL</span>
      </span>
    </span>
  );
}
