// Cosmetics system — COLOR VARIANTS ONLY per user scope.
// Same hovercraft geometry, different color palettes.
// Unlocks based on level / achievement / coins / missions.

import type { Cosmetic, CosmeticPalette } from "./types";

export const COSMETIC_PALETTES: CosmeticPalette[] = [
  // Common
  { id: "default", name: "Standard Issue", hull: "#a5b4fc", accent: "#22d3ee", flame: "#fb923c", rarity: "common" },
  { id: "crimson", name: "Crimson Drift", hull: "#f87171", accent: "#fbbf24", flame: "#fb923c", rarity: "common" },
  { id: "emerald", name: "Verdant Glide", hull: "#34d399", accent: "#a3e635", flame: "#fb923c", rarity: "common" },
  { id: "amber", name: "Solar Burn", hull: "#fbbf24", accent: "#f97316", flame: "#ef4444", rarity: "common" },
  // Rare
  { id: "violet", name: "Void Walker", hull: "#a78bfa", accent: "#c084fc", flame: "#f472b6", rarity: "rare" },
  { id: "ocean", name: "Deep Tide", hull: "#22d3ee", accent: "#2dd4bf", flame: "#06b6d4", rarity: "rare" },
  { id: "rose", name: "Rose Quartz", hull: "#f472b6", accent: "#fb7185", flame: "#fbbf24", rarity: "rare" },
  // Epic
  { id: "aurora", name: "Aurora Shift", hull: "#a3e635", accent: "#22d3ee", flame: "#a78bfa", rarity: "epic" },
  { id: "phoenix", name: "Phoenix Rise", hull: "#f97316", accent: "#fbbf24", flame: "#ef4444", rarity: "epic" },
  { id: "frost", name: "Frost Byte", hull: "#67e8f9", accent: "#bfdbfe", flame: "#c7d2fe", rarity: "epic" },
  // Legendary
  { id: "prismatic", name: "Prismatic Core", hull: "rainbow", accent: "rainbow", flame: "rainbow", rarity: "legendary" },
  { id: "golden", name: "Golden God", hull: "#fbbf24", accent: "#fcd34d", flame: "#fde68a", rarity: "legendary" },
];

export const COSMETICS: Cosmetic[] = COSMETIC_PALETTES.map((p) => ({
  id: p.id,
  name: p.name,
  type: "hovercraft" as const,
  palette: p,
  unlockRequirement:
    p.rarity === "common" ? { type: "level" as const, value: 1 }
    : p.rarity === "rare" ? { type: "level" as const, value: 5 }
    : p.rarity === "epic" ? { type: "level" as const, value: 15 }
    : { type: "level" as const, value: 30 },
  rarity: p.rarity,
}));

export interface CosmeticUnlockState {
  level: number;
  achievements: string[];
  coins: number;
  missionsCompleted: number;
}

export function isCosmeticUnlocked(cosmetic: Cosmetic, state: CosmeticUnlockState): boolean {
  switch (cosmetic.unlockRequirement.type) {
    case "level": return state.level >= cosmetic.unlockRequirement.value;
    case "achievement": return state.achievements.length >= cosmetic.unlockRequirement.value;
    case "coins": return state.coins >= cosmetic.unlockRequirement.value;
    case "mission": return state.missionsCompleted >= cosmetic.unlockRequirement.value;
    default: return false;
  }
}

export function getUnlockableCosmetics(state: CosmeticUnlockState): Cosmetic[] {
  return COSMETICS.filter((c) => isCosmeticUnlocked(c, state));
}

export function getLockedCosmetics(state: CosmeticUnlockState): Cosmetic[] {
  return COSMETICS.filter((c) => !isCosmeticUnlocked(c, state));
}

export function getCosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function rarityColor(rarity: string): string {
  switch (rarity) {
    case "common": return "#9ca3af";
    case "rare": return "#60a5fa";
    case "epic": return "#c084fc";
    case "legendary": return "#fbbf24";
    default: return "#9ca3af";
  }
}
