// Tournament panel — shows upcoming/active tournaments + leaderboard.

import { useState } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { formatCoins } from "@/lib/format";
import { formatTimeUntil } from "@/lib/tournaments";
import { Icon } from "./icons";

export function TournamentPanel() {
  const tournaments = useGameStore((s) => s.tournaments);
  const refresh = useGameStore((s) => s.refreshTournaments);
  const [filter, setFilter] = useState<"all" | "upcoming" | "active">("all");

  const filtered = filter === "all" ? tournaments : tournaments.filter((t) => t.status === filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["all", "active", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tap-target flex-1 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase transition ${
              filter === f ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-white/50"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={refresh}
          aria-label="Refresh tournaments"
          className="tap-target grid h-8 w-8 place-items-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10"
        >
          <Icon name="reset" className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">
            No {filter} tournaments.
          </div>
        )}
        {filtered.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-bold text-white/90">{t.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                  <span className={`rounded px-1.5 py-0.5 font-bold uppercase ${
                    t.status === "active" ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-white/40">
                    {t.status === "upcoming" ? `Starts in ${formatTimeUntil(t.startTime)}` : `Ends in ${formatTimeUntil(t.endTime)}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40">Prize pool</div>
                <div className="font-mono text-sm font-bold text-amber-300">{formatCoins(t.prizePool)}</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-lg bg-black/20 p-1.5">
                <div className="text-white/40">Entry</div>
                <div className="font-mono text-white">{formatCoins(t.entryFee)}</div>
              </div>
              <div className="rounded-lg bg-black/20 p-1.5">
                <div className="text-white/40">Players</div>
                <div className="font-mono text-white">{t.participants}</div>
              </div>
              <div className="rounded-lg bg-black/20 p-1.5">
                <div className="text-white/40">Min mult</div>
                <div className="font-mono text-white">{t.rules.minMultiplier}x</div>
              </div>
            </div>

            <div className="mt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase text-white/40">Top 5</div>
              <div className="space-y-0.5">
                {t.leaderboard.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className={`w-4 text-center font-bold ${i === 0 ? "text-amber-300" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-white/40"}`}>
                      {i + 1}
                    </span>
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    <span className="flex-1 truncate text-white/80">{p.name}</span>
                    <span className="font-mono text-cyan-300">{formatCoins(p.score)}</span>
                  </div>
                ))}
              </div>
            </div>

            {t.status === "upcoming" && (
              <button className="tap-target mt-2 w-full rounded-lg bg-cyan-500/20 py-1.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/30">
                Register (Coming soon)
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
