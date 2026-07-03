// Memoized selectors for common store slices. Prevents re-renders when
// unrelated state changes.
//
// Usage in components:
//   const balance = useGameStore(selectors.balance);
//   const { wins, losses } = useGameStore(selectors.winLoss);

import type { GameStore } from "./useGameStore";

type State = GameStore;

export const selectors = {
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
  netProfit: (s: State) => s.stats.totalReturned - s.stats.totalWagered,
  canPlaceBet: (s: State) =>
    !s.activeBet && s.balance >= 10,
} as const;
