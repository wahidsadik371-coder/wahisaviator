// Horizontal strip of recent crash multipliers.
//
// The crash multiplier (e.g. "2.48x") is the primary display. A tiny ✓/✗
// badge appears on pills where the player bet, so they can see their
// win/loss at a glance. The badge is subtle (8px, 60% opacity) so the
// multiplier remains the focus.
//
// FIX: Removed scroll-snap and auto-scroll that could "freeze" the strip
// on some browsers. The strip is now a plain horizontal scroll container
// — new pills appear on the left (newest first) and are immediately visible.

import { formatMult } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import type { RoundRecord } from "@/lib/types";

function tierColor(m: number): string {
  if (m >= 50) return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  if (m >= 10) return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  if (m >= 2) return "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300";
  return "border-rose-400/40 bg-rose-400/10 text-rose-300";
}

/** Pill style: crash multiplier is ALWAYS primary. Win/loss badges are subtle. */
function pillStyle(r: RoundRecord): { cls: string; badge: string | null } {
  if (r.youCashed !== null && r.youCashed !== undefined && r.youCashed > 0) {
    return { cls: `${tierColor(r.crashPoint)} ring-1 ring-emerald-400/50`, badge: "✓" };
  }
  if (r.youLost) {
    return { cls: `${tierColor(r.crashPoint)} ring-1 ring-rose-400/50`, badge: "✗" };
  }
  return { cls: tierColor(r.crashPoint), badge: null };
}

export function HistoryStrip() {
  const history = useGameStore((s) => s.history);

  return (
    <div className="glass no-callout flex items-center gap-2 rounded-2xl p-2 lg:p-2.5">
      <span className="hidden shrink-0 px-1 text-xs font-semibold uppercase tracking-wider text-white/40 sm:block">
        Recent
      </span>
      {/* Plain horizontal scroll — no scroll-snap, no auto-scroll.
          Newest pill (index 0) is always visible on the left. */}
      <div className="no-scrollbar nice-scroll flex flex-1 items-center gap-1.5 overflow-x-auto">
        {history.length === 0 && (
          <span className="px-2 text-sm text-white/30">
            Awaiting first launch…
          </span>
        )}
        {history.map((r) => {
          const { cls, badge } = pillStyle(r);
          return (
            <span
              key={`${r.id}-${r.ts}`}
              className={`flex shrink-0 items-center gap-0.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${cls}`}
              title={
                r.youCashed
                  ? `You cashed out at ${formatMult(r.youCashed)}`
                  : r.youLost
                  ? `You bet and lost — crashed at ${formatMult(r.crashPoint)}`
                  : `Crashed at ${formatMult(r.crashPoint)}`
              }
            >
              {badge && <span className="text-[8px] leading-none opacity-60">{badge}</span>}
              {formatMult(r.crashPoint)}
            </span>
          );
        })}
      </div>
      {history.length > 0 && (
        <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-white/40">
          {history.length}
        </span>
      )}
    </div>
  );
}
