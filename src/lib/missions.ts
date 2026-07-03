// Daily/weekly mission system.
// Missions are picked randomly from templates each day/week.
// Progress is checked after each round/bet/win.

import type { Mission, MissionTemplate, Stats } from "./types";
import { dayKey } from "./format";

export const MISSION_TEMPLATES: MissionTemplate[] = [
  // Daily — easy
  { id: "d_rounds_5", category: "daily", description: "Play 5 rounds", target: 5, reward: 500, type: "rounds_played", difficulty: "easy" },
  { id: "d_rounds_10", category: "daily", description: "Play 10 rounds", target: 10, reward: 1000, type: "rounds_played", difficulty: "easy" },
  { id: "d_win_1", category: "daily", description: "Win 1 bet", target: 1, reward: 500, type: "wins", difficulty: "easy" },
  { id: "d_win_3", category: "daily", description: "Win 3 bets", target: 3, reward: 1500, type: "wins", difficulty: "medium" },
  { id: "d_wager_5k", category: "daily", description: "Wager 5,000 coins total", target: 5000, reward: 800, type: "coins_wagered", difficulty: "easy" },
  { id: "d_wager_20k", category: "daily", description: "Wager 20,000 coins total", target: 20000, reward: 2500, type: "coins_wagered", difficulty: "medium" },
  { id: "d_mult_3", category: "daily", description: "Cash out at 3x or higher", target: 3, reward: 1000, type: "multiplier_reached", difficulty: "easy" },
  { id: "d_mult_10", category: "daily", description: "Cash out at 10x or higher", target: 10, reward: 3000, type: "multiplier_reached", difficulty: "hard" },
  { id: "d_profit_1k", category: "daily", description: "Net 1,000 coins profit", target: 1000, reward: 1200, type: "profit", difficulty: "medium" },
  { id: "d_streak_2", category: "daily", description: "Win 2 in a row", target: 2, reward: 2000, type: "streak", difficulty: "medium" },
  { id: "d_cashout_5", category: "daily", description: "Cash out 5 times", target: 5, reward: 1500, type: "cashout_before_crash", difficulty: "easy" },
  // Weekly — harder, bigger rewards
  { id: "w_rounds_50", category: "weekly", description: "Play 50 rounds this week", target: 50, reward: 5000, type: "rounds_played", difficulty: "medium" },
  { id: "w_rounds_100", category: "weekly", description: "Play 100 rounds this week", target: 100, reward: 10000, type: "rounds_played", difficulty: "hard" },
  { id: "w_win_15", category: "weekly", description: "Win 15 bets this week", target: 15, reward: 6000, type: "wins", difficulty: "medium" },
  { id: "w_win_30", category: "weekly", description: "Win 30 bets this week", target: 30, reward: 12000, type: "wins", difficulty: "hard" },
  { id: "w_wager_100k", category: "weekly", description: "Wager 100,000 coins this week", target: 100000, reward: 8000, type: "coins_wagered", difficulty: "medium" },
  { id: "w_mult_25", category: "weekly", description: "Cash out at 25x or higher", target: 25, reward: 15000, type: "multiplier_reached", difficulty: "hard" },
  { id: "w_profit_10k", category: "weekly", description: "Net 10,000 coins profit", target: 10000, reward: 10000, type: "profit", difficulty: "hard" },
  { id: "w_streak_5", category: "weekly", description: "Win 5 in a row", target: 5, reward: 12000, type: "streak", difficulty: "hard" },
  // Special event missions
  { id: "s_first_flight", category: "special", description: "Place your first bet", target: 1, reward: 1000, type: "rounds_played", difficulty: "easy" },
  { id: "s_millionaire", category: "special", description: "Hold 1,000,000 coins", target: 1_000_000, reward: 50000, type: "profit", difficulty: "hard" },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function generateDailyMissions(): Mission[] {
  return pickRandom(MISSION_TEMPLATES.filter((t) => t.category === "daily"), 3).map(fromTemplate);
}

export function generateWeeklyMissions(): Mission[] {
  return pickRandom(MISSION_TEMPLATES.filter((t) => t.category === "weekly"), 5).map(fromTemplate);
}

function fromTemplate(t: MissionTemplate): Mission {
  return {
    id: t.id,
    templateId: t.id,
    category: t.category,
    description: t.description,
    target: t.target,
    reward: t.reward,
    type: t.type,
    difficulty: t.difficulty,
    progress: 0,
    completed: false,
    claimed: false,
    assignedDate: dayKey(),
  };
}

export interface MissionContext {
  stats: Stats;
  winStreak: number;
  netProfit: number;
}

export function evaluateMissionProgress(mission: Mission, ctx: MissionContext): Mission {
  if (mission.completed) return mission;
  let progress = 0;
  switch (mission.type) {
    case "rounds_played": progress = ctx.stats.roundsPlayed; break;
    case "wins": progress = ctx.stats.wins; break;
    case "multiplier_reached": progress = ctx.stats.bestMultiplier; break;
    case "coins_wagered": progress = ctx.stats.totalWagered; break;
    case "profit": progress = Math.max(0, ctx.netProfit); break;
    case "streak": progress = ctx.winStreak; break;
    case "cashout_before_crash": progress = ctx.stats.wins; break;
  }
  const completed = progress >= mission.target;
  return { ...mission, progress: Math.min(progress, mission.target), completed };
}
