// Cosmetics panel — grid of hovercraft color variants.
// Locked cosmetics show their unlock requirement.

import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { COSMETICS, isCosmeticUnlocked, rarityColor } from "@/lib/cosmetics";
import { Icon } from "./icons";

export function CosmeticsPanel() {
  const unlocked = useGameStore((s) => s.unlockedCosmetics);
  const active = useGameStore((s) => s.activeCosmetics);
  const equip = useGameStore((s) => s.equipCosmetic);
  const level = useGameStore((s) => s.level);
  const achievements = useGameStore((s) => s.achievements);
  const balance = useGameStore((s) => s.balance);
  const missionsCompleted = useGameStore((s) => s.completedMissionIds.length);

  const state = { level, achievements, coins: balance, missionsCompleted };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-center text-xs">
        <span className="font-bold text-cyan-300">{unlocked.length}</span>
        <span className="text-white/50"> / {COSMETICS.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {COSMETICS.map((c) => {
          const isUnlocked = unlocked.includes(c.id) || isCosmeticUnlocked(c, state);
          const isActive = active.hovercraftId === c.id;
          return (
            <motion.div
              key={c.id}
              whileHover={{ scale: 1.02 }}
              className={`relative overflow-hidden rounded-xl border p-3 ${
                isActive
                  ? "border-cyan-400 bg-cyan-400/10"
                  : isUnlocked
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-white/5 bg-white/[0.01] opacity-60"
              }`}
            >
              <div
                className="mb-2 h-12 w-full rounded-lg"
                style={{
                  background: c.palette.hull === "rainbow"
                    ? "linear-gradient(90deg, #f87171, #fbbf24, #34d399, #22d3ee, #a78bfa, #f472b6)"
                    : `linear-gradient(135deg, ${c.palette.hull}, ${c.palette.accent})`,
                }}
              />
              <div className="text-xs font-bold text-white/90">{c.name}</div>
              <div className="mt-0.5 flex items-center gap-1">
                <span
                  className="rounded px-1 text-[8px] font-bold uppercase"
                  style={{ color: rarityColor(c.rarity), background: `${rarityColor(c.rarity)}22` }}
                >
                  {c.rarity}
                </span>
              </div>
              {isUnlocked ? (
                <button
                  onClick={() => equip(c.id)}
                  disabled={isActive}
                  className={`tap-target mt-2 w-full rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    isActive
                      ? "bg-cyan-400/30 text-cyan-200"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {isActive ? "Equipped ✓" : "Equip"}
                </button>
              ) : (
                <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-white/40">
                  <Icon name="sparkles" className="h-3 w-3" />
                  Lvl {c.unlockRequirement.value}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
