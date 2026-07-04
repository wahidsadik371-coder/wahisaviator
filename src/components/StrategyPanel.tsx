// Strategy panel — select/configure auto-betting strategies.

import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { STRATEGY_PRESETS } from "@/lib/strategies";
import { formatCoins } from "@/lib/format";
import { Icon } from "./icons";

export function StrategyPanel() {
  const active = useGameStore((s) => s.activeStrategy);
  const stratState = useGameStore((s) => s.strategyState);
  const setStrategy = useGameStore((s) => s.setStrategy);
  const clearStrategy = useGameStore((s) => s.clearStrategy);

  return (
    <div className="space-y-3">
      {active && stratState && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">{active.name}</div>
              <div className="mt-0.5 text-xs text-white/50">{active.description}</div>
            </div>
            <button
              onClick={clearStrategy}
              className="tap-target rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
            >
              Stop
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-black/20 p-1.5">
              <div className="text-white/40">Next bet</div>
              <div className="font-mono font-bold text-white">{formatCoins(stratState.currentAmount)}</div>
            </div>
            <div className="rounded-lg bg-black/20 p-1.5">
              <div className="text-white/40">Profit</div>
              <div className={`font-mono font-bold ${stratState.totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {stratState.totalProfit >= 0 ? "+" : ""}{formatCoins(stratState.totalProfit)}
              </div>
            </div>
            <div className="rounded-lg bg-black/20 p-1.5">
              <div className="text-white/40">Step</div>
              <div className="font-mono font-bold text-white">{stratState.currentStep}/{active.config.maxSteps}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {STRATEGY_PRESETS.map((s) => (
          <motion.button
            key={s.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => setStrategy(s.id)}
            disabled={active?.id === s.id}
            className={`tap-target w-full rounded-xl border p-3 text-left transition ${
              active?.id === s.id
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white/90">{s.name}</span>
              <span className="text-xs uppercase text-white/40">{s.type}</span>
            </div>
            <div className="mt-0.5 text-xs text-white/50">{s.description}</div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-white/40">
              <span>Base: {formatCoins(s.config.baseAmount)}</span>
              <span>Stop profit: {formatCoins(s.config.stopOnProfit)}</span>
              <span>Stop loss: {formatCoins(s.config.stopOnLoss)}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-2.5 text-xs text-amber-200/80">
        <Icon name="sparkles" className="mr-1 inline h-3 w-3" />
        No strategy beats the house edge. These manage bet sizes, not odds.
      </div>
    </div>
  );
}
