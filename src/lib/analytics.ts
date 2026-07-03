// Player-facing analytics: derived insights from stats.

import type { Stats, BetRecord, BalancePoint } from "./types";

export interface PlayerInsights {
  winRate: number;
  averageCashout: number;
  riskScore: number; // 0-100, higher = riskier
  percentile: number; // 0-100, vs "average player"
  totalProfit: number;
  bestStreak: number;
  recommendation: string;
}

export function computeInsights(stats: Stats, betHistory: BetRecord[], _balanceGraph: BalancePoint[]): PlayerInsights {
  const decided = stats.wins + stats.losses;
  const winRate = decided ? (stats.wins / decided) * 100 : 0;
  const winningBets = betHistory.filter((b) => b.win && b.multiplier);
  const averageCashout = winningBets.length > 0
    ? winningBets.reduce((s, b) => s + (b.multiplier ?? 0), 0) / winningBets.length
    : 0;
  const totalProfit = stats.totalReturned - stats.totalWagered;

  // Risk score: higher avg cashout + lower win rate = riskier player
  const riskScore = Math.min(100, Math.max(0,
    (averageCashout * 5) + (100 - winRate) * 0.5
  ));

  // Percentile: based on best multiplier + total profit
  const percentile = Math.min(99, Math.max(1,
    Math.floor(stats.bestMultiplier * 2 + (totalProfit > 0 ? 10 : 0))
  ));

  let recommendation = "Keep playing to unlock more achievements!";
  if (winRate < 30 && decided > 10) {
    recommendation = "Try lowering your cashout target to improve win rate.";
  } else if (averageCashout > 5 && winRate < 50) {
    recommendation = "You're going for big multipliers — consider mixing in some safe 2x cashouts.";
  } else if (totalProfit > 10000) {
    recommendation = "Great run! Consider banking some profits by playing conservatively.";
  } else if (decided > 50) {
    recommendation = "Veteran player! Try the new missions and tournaments.";
  }

  return {
    winRate,
    averageCashout,
    riskScore,
    percentile,
    totalProfit,
    bestStreak: 0, // would need streak history
    recommendation,
  };
}

export function profitOverTime(graph: BalancePoint[]): { t: number; profit: number }[] {
  if (graph.length < 2) return [];
  const baseline = graph[0].b;
  return graph.map((p) => ({ t: p.t, profit: p.b - baseline }));
}
