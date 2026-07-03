// XP & leveling system.
// XP gained per round, win, big multiplier, achievement.
// Level curve is exponential: level N requires base * mult^(N-1) XP.

import { GAME } from "./constants";

export function calculateLevel(totalXP: number): number {
  if (totalXP < GAME.LEVEL_XP_BASE) return 1;
  // Solve base * (mult^n - 1) / (mult - 1) = totalXP for n.
  const { LEVEL_XP_BASE, LEVEL_XP_MULTIPLIER } = GAME;
  let level = 1;
  let required = LEVEL_XP_BASE;
  let cumulative = 0;
  while (cumulative + required <= totalXP && level < 999) {
    cumulative += required;
    level++;
    required = Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_MULTIPLIER, level - 1));
  }
  return level;
}

export function calculateXPForLevel(level: number): number {
  return Math.floor(GAME.LEVEL_XP_BASE * Math.pow(GAME.LEVEL_XP_MULTIPLIER, level - 1));
}

export function calculateLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0..1
} {
  const currentLevel = calculateLevel(totalXP);
  let cumulative = 0;
  for (let l = 1; l < currentLevel; l++) {
    cumulative += calculateXPForLevel(l);
  }
  const currentLevelXP = totalXP - cumulative;
  const nextLevelXP = calculateXPForLevel(currentLevel);
  const progress = Math.min(1, currentLevelXP / nextLevelXP);
  return { currentLevel, currentLevelXP, nextLevelXP, progress };
}

const TITLES = [
  { min: 1, title: "Novice", icon: "🌱" },
  { min: 5, title: "Cadet", icon: "✈️" },
  { min: 10, title: "Pilot", icon: "🛩️" },
  { min: 20, title: "Ace", icon: "🏅" },
  { min: 35, title: "Veteran", icon: "🎖️" },
  { min: 50, title: "Captain", icon: "⭐" },
  { min: 75, title: "Legend", icon: "👑" },
  { min: 100, title: "Mythic", icon: "🔥" },
];

export function getLevelTitle(level: number): { title: string; icon: string } {
  let result = TITLES[0];
  for (const t of TITLES) {
    if (level >= t.min) result = t;
  }
  return { title: result.title, icon: result.icon };
}

export function getLevelReward(level: number): { coins: number; title: string; icon: string } {
  const { title, icon } = getLevelTitle(level);
  // Reward = 1000 * level, scaled.
  const coins = Math.floor(1000 * level * (1 + level * 0.1));
  return { coins, title, icon };
}

export function xpForAction(action: "round" | "win" | "big_mult" | "achievement" | "daily"): number {
  const map = {
    round: GAME.XP_PER_ROUND_PLAYED,
    win: GAME.XP_PER_WIN,
    big_mult: GAME.XP_PER_BIG_MULTIPLIER,
    achievement: GAME.XP_PER_ACHIEVEMENT,
    daily: 50,
  } as const;
  return map[action];
}
