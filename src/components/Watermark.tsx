// Branding watermarks for Wahid Sadik.
// - A faint repeating diagonal text overlay across the whole viewport.
// - A small "Made by" corner badge.
// All purely decorative (pointer-events: none) and respects the animations
// setting so it can be hidden on low-power devices.

import { APP } from "@/lib/constants";
import { useGameStore } from "@/store/useGameStore";

/** Full-viewport repeating diagonal watermark, very low opacity. */
export function WatermarkOverlay() {
  const animations = useGameStore((s) => s.settings.animations);
  if (!animations) return null;

  const text = `${APP.DEVELOPER} · ${APP.NAME}`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='240'>` +
    `<text x='0' y='128' transform='rotate(-22)' fill='white' ` +
    `font-family='Arial, Helvetica, sans-serif' font-size='22' ` +
    `font-weight='700' letter-spacing='2'>${text}</text></svg>`;
  const bg = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] select-none mix-blend-overlay"
      style={{
        backgroundImage: bg,
        backgroundRepeat: "repeat",
        opacity: 0.5,
      }}
    />
  );
}

/** Compact "Made by Wahid Sadik" pill badge. */
export function MadeByBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-200/80 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
      Made by {APP.DEVELOPER}
    </div>
  );
}

/** Subtle corner credit stamp for the arena surface. */
export function DevStamp() {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
      <span className="font-sans font-bold text-xs font-bold uppercase tracking-[0.25em] text-white/25">
        {APP.NAME}
      </span>
      <span className="text-xs font-medium uppercase tracking-widest text-white/15">
        © {APP.YEAR} · {APP.DEVELOPER}
      </span>
    </div>
  );
}
