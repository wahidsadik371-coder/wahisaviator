// Missions panel — shows active daily/weekly missions with progress bars + claim buttons.

import { useState } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { formatCoins } from "@/lib/format";
import { Icon } from "./icons";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function MissionsPanel() {
  const daily = useGameStore((s) => s.activeDailyMissions);
  const weekly = useGameStore((s) => s.activeWeeklyMissions);
  const claimMission = useGameStore((s) => s.claimMission);
  const refresh = useGameStore((s) => s.refreshMissions);
  const [tab, setTab] = useState<"daily" | "weekly">("daily");

  const missions = tab === "daily" ? daily : weekly;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("daily")}
          className={`tap-target flex-1 rounded-xl px-3 py-2 text-xs font-bold transition ${tab === "daily" ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-white/50"}`}
        >
          Daily ({daily.filter((m) => m.completed && !m.claimed).length})
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`tap-target flex-1 rounded-xl px-3 py-2 text-xs font-bold transition ${tab === "weekly" ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-white/50"}`}
        >
          Weekly ({weekly.filter((m) => m.completed && !m.claimed).length})
        </button>
        <button
          onClick={refresh}
          aria-label="Refresh missions"
          className="tap-target grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/60 hover:bg-white/10"
        >
          <Icon name="reset" className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {missions.length === 0 && (
          <div className="py-8 text-center text-sm text-white/30">
            No {tab} missions yet. Refresh to generate.
          </div>
        )}
        {missions.map((m) => (
          <motion.div
            key={m.id}
            variants={staggerItem}
            className={`rounded-xl border p-3 transition ${
              m.claimed
                ? "border-white/5 bg-white/[0.02] opacity-50"
                : m.completed
                ? "border-emerald-400/40 bg-emerald-400/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white/90">{m.description}</span>
                  <DifficultyBadge difficulty={m.difficulty} />
                </div>
                <div className="mt-1 text-xs text-white/40">
                  Reward: <span className="font-mono text-amber-300">{formatCoins(m.reward)} coins</span>
                </div>
              </div>
              {m.completed && !m.claimed && (
                <button
                  onClick={() => claimMission(m.id)}
                  className="tap-target rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-emerald-950 hover:bg-emerald-400"
                >
                  Claim
                </button>
              )}
              {m.claimed && <span className="text-xs text-white/30">Claimed ✓</span>}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full rounded-full transition-all ${m.completed ? "bg-emerald-400" : "bg-cyan-400"}`}
                style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
              />
            </div>
            <div className="mt-1 text-right text-xs font-mono text-white/40">
              {Math.min(m.progress, m.target).toLocaleString()} / {m.target.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) {
  const colors = {
    easy: "bg-emerald-400/20 text-emerald-300",
    medium: "bg-amber-400/20 text-amber-300",
    hard: "bg-rose-400/20 text-rose-300",
  };
  return (
    <span className={`rounded px-1 py-0.5 text-xs font-bold uppercase ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}
