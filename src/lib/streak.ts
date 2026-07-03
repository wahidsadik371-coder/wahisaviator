// Daily streak system.
// Consecutive daily bonus claims grow a multiplier; missing 2+ days resets.

import { dayKey } from "./format";
import type { DailyStreak } from "./types";
import { GAME } from "./constants";

export function emptyStreak(): DailyStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastClaimDate: null,
    streakMultiplier: 1,
    streakHistory: [],
  };
}

/** Days between two dayKey strings (b - a). 0 = same day, negative = past. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function calculateStreakBonus(streak: number): number {
  const mult = 1 + Math.min(streak, 10) * GAME.STREAK_BONUS_INCREMENT;
  return Math.min(mult, GAME.STREAK_BONUS_CAP);
}

export function getStreakStatus(
  lastClaimDate: string | null
): { active: boolean; daysSinceLastClaim: number } {
  if (!lastClaimDate) return { active: false, daysSinceLastClaim: Infinity };
  const diff = daysBetween(lastClaimDate, dayKey());
  return { active: diff === 1, daysSinceLastClaim: diff };
}

export function shouldBreakStreak(lastClaimDate: string): boolean {
  return daysBetween(lastClaimDate, dayKey()) >= GAME.STREAK_BREAK_PENALTY_DAYS;
}

/** Apply a new claim to the streak state. Returns updated streak. */
export function applyClaim(streak: DailyStreak, today: string = dayKey()): DailyStreak {
  const status = getStreakStatus(streak.lastClaimDate);
  let newCurrent = 1;
  if (status.active) newCurrent = streak.currentStreak + 1;
  else if (streak.lastClaimDate === today) newCurrent = streak.currentStreak; // re-claim same day (shouldn't happen)
  else if (status.daysSinceLastClaim >= GAME.STREAK_BREAK_PENALTY_DAYS) newCurrent = 1;
  else newCurrent = 1; // missed 1 day = reset (could be lenient if desired)

  const newMult = calculateStreakBonus(newCurrent);
  const newLongest = Math.max(streak.longestStreak, newCurrent);
  const entry = { date: today, claimed: true, bonusMultiplier: newMult };
  const newHistory = [...streak.streakHistory, entry].slice(-30);

  return {
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastClaimDate: today,
    streakMultiplier: newMult,
    streakHistory: newHistory,
  };
}
