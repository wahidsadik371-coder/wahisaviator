// Inline SVG icon set. Each entry is a list of <path d="…"> strings, rendered
// inside a single <svg> wrapper with sensible defaults.
//
// FIX: Tightened typing — the props are now `SVGProps<SVGSVGElement>` only
// (no implicit `any` from spreading unknown attributes). The Icon component
// also defaults `strokeWidth` to 2 in a way that lets callers override it
// without TypeScript complaining.

import type { SVGProps } from "react";

export type IconName =
  | "settings"
  | "volume"
  | "mute"
  | "chat"
  | "trophy"
  | "clock"
  | "chart"
  | "gift"
  | "x"
  | "plus"
  | "minus"
  | "zap"
  | "users"
  | "check"
  | "reset"
  | "flame"
  | "sparkles"
  | "play"
  | "wallet";

const PATHS: Record<IconName, readonly string[]> = {
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    "M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-2.7.6 1.6 1.6 0 0 0-1.55 1.24A2 2 0 0 1 9 22a2 2 0 0 1-1.94-1.55 1.6 1.6 0 0 0-1.04-1.1 1.6 1.6 0 0 0-1.66.26l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .26-1.66 1.6 1.6 0 0 0-1.1-1.04A2 2 0 0 1 0 12a2 2 0 0 1 1.55-1.94 1.6 1.6 0 0 0 1.1-1.04 1.6 1.6 0 0 0-.26-1.66l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32 1.6 1.6 0 0 0 .97-1.45V3a2 2 0 0 1 4 0v.06a1.6 1.6 0 0 0 2.55 1.28 1.6 1.6 0 0 0 .06-.06l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77 1.6 1.6 0 0 0 1.45.97H21a2 2 0 0 1 0 4h-.06a1.6 1.6 0 0 0-1.45.97Z",
  ],
  volume: [
    "M11 5 6 9H3v6h3l5 4V5Z",
    "M16 9a4 4 0 0 1 0 6",
    "M18.5 6.5a8 8 0 0 1 0 11",
  ],
  mute: ["M11 5 6 9H3v6h3l5 4V5Z", "M22 9l-5 6M17 9l5 6"],
  chat: [
    "M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z",
  ],
  trophy: [
    "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z",
    "M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3",
  ],
  clock: ["M12 7v5l3 2", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
  chart: ["M4 20V10M10 20V4M16 20v-7M22 20H2"],
  gift: [
    "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S11 2 8.5 2 6 5 12 7ZM12 7s1-5 3.5-5S18 5 12 7Z",
  ],
  x: ["M18 6 6 18M6 6l12 12"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  zap: ["M13 2 4 14h7l-1 8 9-12h-7l1-8Z"],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  ],
  check: ["M20 6 9 17l-5-5"],
  reset: [
    "M3 12a9 9 0 1 0 3-6.7L3 8",
    "M3 3v5h5",
  ],
  flame: ["M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1.5.7-2.8 1.5-3.7C9 9 12 8 12 2Z"],
  sparkles: [
    "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z",
    "M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z",
  ],
  play: ["M6 4l14 8-14 8V4Z"],
  wallet: [
    "M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5",
    "M16 12h.01",
  ],
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Original brand mark: a "nova" star-burst hovercraft emblem. */
export function NovaLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="novaG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path
        d="M24 2 29 18 46 24 29 30 24 46 19 30 2 24 19 18 24 2Z"
        fill="url(#novaG)"
        opacity="0.95"
      />
      <path
        d="M24 14 26.5 21.5 34 24 26.5 26.5 24 34 21.5 26.5 14 24 21.5 21.5 24 14Z"
        fill="#060814"
      />
      <circle cx="24" cy="24" r="3.1" fill="url(#novaG)" />
    </svg>
  );
}
