// Betting controls: amount input, quick presets, auto-bet / auto-cashout, and
// the primary Place / Cancel / Cash-out action button.
//
// LAYOUT STRATEGY: Base styles are DESKTOP (generous sizing). Mobile compact
// styles use `max-lg:` prefix (applies below 1024px). This ensures desktop
// always looks right without breakpoint bleed.
//
// MOBILE (<1024px): Single column. Action button ON TOP (thumb reach).
//   Compact padding, smaller fonts, tighter gaps.
// DESKTOP (≥1024px): 2-column grid. Amount controls on left, action button
//   + auto-bet on right (w-56). Generous padding, larger fonts.

import { useEffect, useRef, useState } from "react";
import { useEngineState } from "@/hooks";
import { GAME } from "@/lib/constants";
import { clamp, formatCoins } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import { Icon } from "./icons";

interface MainAction {
  label: string;
  sub: string;
  onClick: () => void;
  variant: "place" | "cancel" | "cashout" | "done" | "idle";
  disabled: boolean;
  ariaLabel: string;
}

const VARIANT_CLASS: Record<MainAction["variant"], string> = {
  place:
    "from-emerald-400 to-teal-500 text-emerald-950 shadow-emerald-500/30 hover:from-emerald-300 hover:to-teal-400",
  cancel:
    "from-rose-500 to-red-600 text-white shadow-rose-500/30 hover:from-rose-400 hover:to-red-500",
  cashout:
    "from-amber-300 to-orange-400 text-orange-950 shadow-amber-400/40 hover:from-amber-200 hover:to-orange-300 animate-pulse-glow",
  done: "from-slate-600 to-slate-700 text-white/70 shadow-none",
  idle: "from-slate-700 to-slate-800 text-white/40 shadow-none",
};

const DEBOUNCE_MS = 200;

function sanitizeBetInput(raw: number): number {
  if (!Number.isFinite(raw) || Number.isNaN(raw) || raw < 0) return GAME.MIN_BET;
  return clamp(Math.round(raw), GAME.MIN_BET, GAME.MAX_BET);
}

export function BettingPanel() {
  const betConfig = useGameStore((s) => s.betConfig);
  const balance = useGameStore((s) => s.balance);
  const setBetAmount = useGameStore((s) => s.setBetAmount);
  const setBetPreset = useGameStore((s) => s.setBetPreset);
  const toggleAutoBet = useGameStore((s) => s.toggleAutoBet);
  const setAutoCashoutEnabled = useGameStore((s) => s.setAutoCashoutEnabled);
  const setAutoCashoutTarget = useGameStore((s) => s.setAutoCashoutTarget);
  const placeBet = useGameStore((s) => s.placeBet);
  const cancelBet = useGameStore((s) => s.cancelBet);

  const [inputValue, setInputValue] = useState(String(betConfig.amount));
  const debounceRef = useRef<number>(0);

  useEffect(() => {
    setInputValue(String(betConfig.amount));
  }, [betConfig.amount]);

  const commitAmount = (raw: number) => {
    setBetAmount(sanitizeBetInput(raw));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    const parsed = Number(raw);
    if (raw === "" || Number.isNaN(parsed)) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => commitAmount(parsed), DEBOUNCE_MS);
  };

  const onInputBlur = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const parsed = Number(inputValue);
    const sanitized = sanitizeBetInput(parsed);
    setBetAmount(sanitized);
    setInputValue(String(sanitized));
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onInputBlur();
      placeBet();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelBet();
    }
  };

  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="glass safe-bottom shrink-0 rounded-2xl p-4 max-lg:p-2.5">
      {/* DESKTOP: 2-column grid. MOBILE: single column with action on top. */}
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] max-lg:gap-2">
        {/* === AMOUNT COLUMN (left on desktop, below action on mobile) === */}
        <div className="space-y-3 max-lg:order-2 max-lg:space-y-2">
          {/* Label + presets (½, 2×, Max) */}
          <div className="flex items-center justify-between">
            <span
              id="bet-amount-label"
              className="text-xs font-semibold uppercase tracking-wider text-white/40 max-lg:text-[9px]"
            >
              Bet amount
            </span>
            <div className="flex gap-1 max-lg:gap-0.5">
              {(["half", "double", "max"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setBetPreset(op)}
                  aria-label={`Set bet to ${op === "half" ? "half" : op === "double" ? "double" : "max"}`}
                  className="tap-target rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400 max-lg:px-1.5 max-lg:py-0.5 max-lg:text-[10px]"
                >
                  {op === "half" ? "½" : op === "double" ? "2×" : "Max"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input with +/- */}
          <div className="flex items-stretch gap-2 max-lg:gap-1">
            <button
              onClick={() => setBetAmount(betConfig.amount - GAME.MIN_BET)}
              aria-label="Decrease bet"
              className="tap-target flex w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 focus-visible:outline-cyan-400 max-lg:w-9"
            >
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={inputValue}
              min={GAME.MIN_BET}
              max={GAME.MAX_BET}
              step={GAME.MIN_BET}
              onChange={onInputChange}
              onBlur={onInputBlur}
              onKeyDown={onInputKeyDown}
              aria-labelledby="bet-amount-label"
              aria-describedby="bet-amount-hint"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center font-mono text-lg font-bold text-white outline-none transition focus:border-cyan-400/50 max-lg:px-2 max-lg:py-1.5 max-lg:text-sm"
            />
            <button
              onClick={() => setBetAmount(betConfig.amount + GAME.MIN_BET)}
              aria-label="Increase bet"
              className="tap-target flex w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 focus-visible:outline-cyan-400 max-lg:w-9"
            >
              <Icon name="plus" className="h-4 w-4" />
            </button>
          </div>

          <p id="bet-amount-hint" className="sr-only">
            Bet amount in coins. Minimum {GAME.MIN_BET}, maximum {GAME.MAX_BET}.
            Press Enter to place bet, Escape to cancel a queued bet.
          </p>

          {/* Quick bet presets — flex-wrap on desktop, single row on mobile */}
          <div className="flex flex-wrap gap-1.5 max-lg:gap-1">
            {GAME.BET_STEP_PRESETS.map((step) => (
              <button
                key={step}
                onClick={() => setBetAmount(betConfig.amount + step)}
                aria-label={`Add ${step} coins to bet`}
                className="tap-target rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-cyan-300 focus-visible:outline-cyan-400 max-lg:flex-1 max-lg:py-1 max-lg:text-[10px]"
              >
                +{step}
              </button>
            ))}
          </div>

          {/* Auto cashout row */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2.5 max-lg:gap-2 max-lg:p-1.5">
            <Toggle
              checked={betConfig.autoCashoutEnabled}
              onChange={setAutoCashoutEnabled}
              label="Auto Cashout"
            />
            <div className="ml-auto flex items-center gap-1.5">
              <label htmlFor="auto-cashout-target" className="sr-only">
                Auto cashout target multiplier
              </label>
              <input
                id="auto-cashout-target"
                type="number"
                step="0.1"
                min="1.01"
                max="1000"
                value={betConfig.autoCashoutTarget}
                disabled={!betConfig.autoCashoutEnabled}
                onChange={(e) =>
                  setAutoCashoutTarget(clamp(Number(e.target.value), 1.01, 1000))
                }
                className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-right font-mono text-sm text-white outline-none disabled:opacity-40 focus:border-cyan-400/50 max-lg:w-14 max-lg:py-1 max-lg:text-xs"
              />
              <span className="text-sm text-white/50 max-lg:text-xs" aria-hidden="true">x</span>
            </div>
          </div>
        </div>

        {/* === ACTION COLUMN (right on desktop, top on mobile) === */}
        <div className="flex flex-col justify-between gap-3 lg:w-56 max-lg:order-1 max-lg:gap-1.5">
          <BetActionButton balance={balance} amount={betConfig.amount} />
          <button
            onClick={toggleAutoBet}
            role="switch"
            aria-checked={betConfig.autoBet}
            aria-label="Toggle auto bet"
            className={`tap-target flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-cyan-400 max-lg:px-2 max-lg:py-1.5 max-lg:text-[11px] ${
              betConfig.autoBet
                ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            <Icon name="zap" className="h-4 w-4 max-lg:h-3 max-lg:w-3" />
            Auto Bet
            <span
              className={`ml-1 h-2 w-2 rounded-full max-lg:h-1.5 max-lg:w-1.5 ${
                betConfig.autoBet ? "bg-cyan-400" : "bg-white/20"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function BetActionButton({
  balance,
  amount,
}: {
  balance: number;
  amount: number;
}) {
  const snap = useEngineState();
  const activeBet = useGameStore((s) => s.activeBet);
  const placeBet = useGameStore((s) => s.placeBet);
  const cancelBet = useGameStore((s) => s.cancelBet);
  const cashOut = useGameStore((s) => s.cashOut);

  const potential =
    activeBet && activeBet.status === "active"
      ? Math.round(activeBet.amount * snap.multiplier)
      : 0;

  let main: MainAction;
  if (activeBet?.status === "active") {
    main = {
      label: "Cash Out",
      sub: "+ " + formatCoins(potential) + " 🪙",
      onClick: () => cashOut(),
      variant: "cashout",
      disabled: false,
      ariaLabel: `Cash out now for ${formatCoins(potential)} coins at ${snap.multiplier.toFixed(2)} times`,
    };
  } else if (activeBet?.status === "won") {
    main = {
      label: "Cashed Out",
      sub: "@ " + (activeBet.cashedAt ?? 1).toFixed(2) + "x",
      onClick: () => {},
      variant: "done",
      disabled: true,
      ariaLabel: `Already cashed out at ${(activeBet.cashedAt ?? 1).toFixed(2)} times`,
    };
  } else if (activeBet?.status === "queued") {
    main = {
      label: "Cancel",
      sub: formatCoins(activeBet.amount) + " queued",
      onClick: cancelBet,
      variant: "cancel",
      disabled: false,
      ariaLabel: `Cancel queued bet of ${formatCoins(activeBet.amount)} coins`,
    };
  } else if (snap.phase === "waiting") {
    main = {
      label: "Place Bet",
      sub: formatCoins(Math.min(amount, Math.max(GAME.MIN_BET, balance))),
      onClick: placeBet,
      variant: "place",
      disabled: balance < GAME.MIN_BET,
      ariaLabel: `Place bet of ${formatCoins(Math.min(amount, balance))} coins`,
    };
  } else {
    main = {
      label: "Waiting",
      sub: "next round",
      onClick: () => {},
      variant: "idle",
      disabled: true,
      ariaLabel: "Waiting for next round",
    };
  }

  return (
    <button
      onClick={main.onClick}
      disabled={main.disabled}
      aria-label={main.ariaLabel}
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-br px-6 py-5 text-center font-display text-xl font-black shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed focus-visible:outline-cyan-400 max-lg:px-3 max-lg:py-2.5 max-lg:text-base ${VARIANT_CLASS[main.variant]}`}
    >
      <span className="shimmer absolute inset-0" aria-hidden="true" />
      <span className="relative block">{main.label}</span>
      <span className="relative mt-0.5 block font-mono text-sm font-semibold opacity-90 max-lg:text-[11px]">
        {main.sub}
      </span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="tap-target flex items-center gap-2 focus-visible:outline-cyan-400"
      type="button"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-cyan-400/80" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      <span className="text-xs font-semibold text-white/70">{label}</span>
    </button>
  );
}
