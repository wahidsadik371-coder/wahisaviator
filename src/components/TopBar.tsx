// Sticky top bar: brand, online count, animated balance, free-coins button,
// daily bonus, and settings.
//
// MOBILE (< sm = 640px): SINGLE compact row — logo + truncated title +
//   balance pill + free-coins + settings. Daily bonus moves into the
//   balance pill area. Total height target: ~56px (vs 120px before).
//   This reclaims ~64px of vertical space for the arena.
//
// DESKTOP (≥ sm): two-row layout as before.

import { useAnimatedNumber } from "@/hooks";
import { GAME } from "@/lib/constants";
import { dayKey, formatCoins } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import { Icon, NovaLogo } from "./icons";

export function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const balance = useGameStore((s) => s.balance);
  const online = useGameStore((s) => s.onlineCount);
  const lastDaily = useGameStore((s) => s.lastDailyClaim);
  const addFreeCoins = useGameStore((s) => s.addFreeCoins);
  const claimDaily = useGameStore((s) => s.claimDaily);

  const animated = useAnimatedNumber(balance, 600);
  const dailyAvailable = dayKey() !== lastDaily;

  return (
    <header className="safe-top safe-x sticky top-0 z-30 border-b border-white/10 bg-[#070a18]/85 backdrop-blur-xl">
      {/* ===== MOBILE: single compact row ===== */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:hidden">
        <NovaLogo className="h-7 w-7 shrink-0  " />
        <div className="min-w-0 flex-1 leading-none">
          <div className="truncate font-sans font-bold text-sm font-black tracking-wide text-white">
            WAHID'S<span className="text-cyan-400"> AVIATOR</span>
          </div>
          {/* Compact balance row */}
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-xs" aria-hidden="true">🪙</span>
            <span className="font-mono text-xs font-bold tabular text-white glow-cyan">
              {formatCoins(animated)}
            </span>
          </div>
        </div>

        {/* Daily bonus — compact icon only */}
        <button
          onClick={claimDaily}
          aria-label={dailyAvailable ? "Claim daily bonus" : "Daily bonus claimed"}
          aria-disabled={!dailyAvailable}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
            dailyAvailable
              ? "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300 "
              : "border-white/10 bg-white/5 text-white/40"
          }`}
        >
          <Icon name="gift" className="h-4 w-4" />
          {dailyAvailable && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-fuchsia-400" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 focus-visible:outline-cyan-400"
        >
          <Icon name="settings" className="h-4 w-4" />
        </button>

        {/* Free coins — compact, icon + amount */}
        <button
          onClick={addFreeCoins}
          aria-label={`Claim ${formatCoins(GAME.FREE_COINS_AMOUNT)} free coins`}
          className="flex shrink-0 items-center gap-1 overflow-hidden rounded-lg bg-gradient-to-br from-lime-300 to-emerald-500 px-2 py-2 font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:from-lime-200 hover:to-emerald-400 active:scale-95  focus-visible:outline-cyan-400"
        >
          <Icon name="sparkles" className="h-4 w-4" />
          <span className="font-sans font-bold text-xs">+{formatCoins(GAME.FREE_COINS_AMOUNT)}</span>
        </button>
      </div>

      {/* ===== DESKTOP: two-row layout (sm and up) ===== */}
      <div className="hidden px-4 py-2.5 sm:block">
        {/* Row 1: brand + settings */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <NovaLogo className="h-9 w-9 shrink-0  " />
            <div className="min-w-0 leading-none">
              <div className="truncate font-sans font-bold text-lg font-black tracking-wide text-white">
                WAHID'S<span className="text-cyan-400"> AVIATOR</span>
              </div>
              <div className="hidden text-xs font-semibold uppercase tracking-[0.25em] text-white/35 sm:block">
                by Wahid Sadik · Demo Play Money
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 lg:flex"
              aria-label={`${online.toLocaleString()} players online`}
              role="status"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
              <Icon name="users" className="h-4 w-4 text-white/60" />
              <span className="font-mono font-semibold tabular">
                {online.toLocaleString()}
              </span>
            </div>

            <button
              onClick={claimDaily}
              aria-label={dailyAvailable ? "Claim daily bonus" : "Daily bonus claimed"}
              aria-disabled={!dailyAvailable}
              className={`tap-target relative grid h-11 w-11 place-items-center rounded-xl border transition focus-visible:outline-cyan-400 ${
                dailyAvailable
                  ? "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300 "
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Icon name="gift" className="h-5 w-5" />
              {dailyAvailable && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-fuchsia-400 ring-2 ring-[#070a18]" />
              )}
            </button>

            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="tap-target grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400"
            >
              <Icon name="settings" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Row 2: balance + free coins */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2"
            aria-label={`Balance: ${formatCoins(animated)} coins`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 text-sm shadow-inner" aria-hidden="true">
              🪙
            </span>
            <div className="min-w-0 leading-none">
              <div className="font-mono text-base font-bold tabular text-white glow-cyan sm:text-lg">
                {formatCoins(animated)}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">
                Coins
              </div>
            </div>
          </div>

          <button
            onClick={addFreeCoins}
            aria-label={`Claim ${formatCoins(GAME.FREE_COINS_AMOUNT)} free coins`}
            className="tap-target relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 px-4 py-2.5 font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:from-lime-200 hover:to-emerald-400 active:scale-95  focus-visible:outline-cyan-400"
          >
            <Icon name="sparkles" className="relative h-5 w-5" />
            <span className="relative font-sans font-bold text-sm">
              +{formatCoins(GAME.FREE_COINS_AMOUNT)}
            </span>
            <span className="relative hidden text-xs font-black uppercase tracking-wider opacity-80 sm:block">
              Free
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
