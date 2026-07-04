// Profile modal — full player profile with stats, achievements, cosmetics.

import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { calculateLevelProgress, getLevelTitle } from "@/lib/levels";
import { formatCoins, formatMult } from "@/lib/format";
import { Icon } from "./icons";

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const stats = useGameStore((s) => s.stats);
  const achievements = useGameStore((s) => s.achievements);
  const totalXP = useGameStore((s) => s.totalXP);
  const displayName = useGameStore((s) => s.displayName);
  const setDisplayName = useGameStore((s) => s.setDisplayName);
  const unlockedCosmetics = useGameStore((s) => s.unlockedCosmetics);
  const activeCosmetics = useGameStore((s) => s.activeCosmetics);

  if (!open) return null;

  const progress = calculateLevelProgress(totalXP);
  const { title, icon } = getLevelTitle(progress.currentLevel);
  const pinnedAchievements = achievements.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-strong w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="profile-title" className="font-sans font-bold text-lg font-bold text-white">
            Player Profile
          </h2>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Display name */}
          <div>
            <label htmlFor="display-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/40">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
          </div>

          {/* Level + XP */}
          <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <div className="flex-1">
                <div className="text-xs uppercase text-white/40">Level {progress.currentLevel}</div>
                <div className="font-sans font-bold text-lg font-bold text-white">{title}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">Total XP</div>
                <div className="font-mono text-sm font-bold text-amber-300">{formatCoins(totalXP)}</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                style={{ width: `${progress.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <div className="text-xs uppercase text-white/40">Rounds</div>
              <div className="font-mono text-sm font-bold text-white">{stats.roundsPlayed}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <div className="text-xs uppercase text-white/40">Wins</div>
              <div className="font-mono text-sm font-bold text-emerald-300">{stats.wins}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <div className="text-xs uppercase text-white/40">Best</div>
              <div className="font-mono text-sm font-bold text-cyan-300">{formatMult(stats.bestMultiplier)}</div>
            </div>
          </div>

          {/* Pinned achievements */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
              Pinned achievements ({achievements.length}/{ACHIEVEMENTS.length})
            </div>
            <div className="flex gap-2">
              {pinnedAchievements.length === 0 && (
                <div className="text-xs text-white/30">No achievements yet — play to unlock!</div>
              )}
              {pinnedAchievements.map((id) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <div key={id} className="flex-1 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2 text-center">
                    <div className="text-xl">{a.icon}</div>
                    <div className="mt-0.5 truncate text-xs font-bold text-amber-300">{a.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active cosmetics */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
              Active cosmetic
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs">
              <span className="font-mono text-cyan-300">{activeCosmetics.hovercraftId}</span>
              <span className="ml-2 text-white/40">({unlockedCosmetics.length} unlocked)</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
