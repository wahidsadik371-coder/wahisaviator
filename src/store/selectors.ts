// Memoized selectors for common store slices. Prevents re-renders when
// unrelated state changes.
//
// IMPORTANT: Selectors that return PRIMITIVES (number, string, boolean) or
// stable references (the same object from state) are safe to use directly:
//   const balance = useGameStore(selectors.balance);
//
// Selectors that return NEW objects/arrays on every call (marked ⚠️ below)
// MUST be wrapped with `useShallow` from "zustand/react/shallow" to avoid
// infinite re-render loops:
//   import { useShallow } from "zustand/react/shallow";
//   const { totalXP, level } = useGameStore(useShallow(selectors.xp));
//
// Otherwise Zustand's default Object.is equality check sees a new object
// reference every time and re-renders on every store update.

import type { GameStore } from "./useGameStore";

type State = GameStore;

export const selectors = {
  // --- Primitive selectors (safe to use directly) ---
  balance: (s: State) => s.balance,
  online: (s: State) => s.onlineCount,
  activeBet: (s: State) => s.activeBet,
  betConfig: (s: State) => s.betConfig,
  settings: (s: State) => s.settings,
  chat: (s: State) => s.chat,
  leaderboard: (s: State) => s.leaderboard,
  history: (s: State) => s.history,
  betHistory: (s: State) => s.betHistory,
  achievements: (s: State) => s.achievements,
  stats: (s: State) => s.stats,
  dailyStreak: (s: State) => s.dailyStreak,
  totalXP: (s: State) => s.totalXP,
  level: (s: State) => s.level,
  netProfit: (s: State) => s.stats.totalReturned - s.stats.totalWagered,
  canPlaceBet: (s: State) => !s.activeBet && s.balance >= 10,

  // ⚠️ Object-returning selectors — wrap with useShallow:
  //   useGameStore(useShallow(selectors.xp))
  xp: (s: State) => ({ totalXP: s.totalXP, level: s.level }),
  missions: (s: State) => ({
    daily: s.activeDailyMissions,
    weekly: s.activeWeeklyMissions,
  }),
  cosmetics: (s: State) => ({
    unlocked: s.unlockedCosmetics,
    active: s.activeCosmetics,
  }),
  winLoss: (s: State) => ({ wins: s.stats.wins, losses: s.stats.losses }),
} as const;
