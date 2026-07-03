// Achievement definitions + evaluation logic.

import type { Achievement } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_flight", name: "First Flight", desc: "Place your very first bet.", icon: "🚀" },
  { id: "first_win", name: "Lift Off", desc: "Cash out a winning bet.", icon: "✅" },
  { id: "high_roller", name: "High Roller", desc: "Wager 5,000+ coins in one bet.", icon: "💰" },
  { id: "whale", name: "Whale", desc: "Wager 25,000+ coins in one bet.", icon: "🐋" },
  { id: "lucky_seven", name: "Lucky Seven", desc: "Cash out at 7x or higher.", icon: "🍀" },
  { id: "diamond_hands", name: "Diamond Hands", desc: "Cash out at 20x or higher.", icon: "💎" },
  { id: "moonshot", name: "Moonshot", desc: "Witness a 50x+ crash.", icon: "🌙" },
  { id: "millionaire", name: "Tycoon", desc: "Hold 1,000,000 coins.", icon: "👑" },
  { id: "comeback", name: "Comeback Kid", desc: "Recover to 10,000 after dropping under 1,000.", icon: "🔥" },
  { id: "veteran", name: "Veteran", desc: "Play 100 rounds.", icon: "🎖️" },
  { id: "streak3", name: "Hot Streak", desc: "Win 3 cash-outs in a row.", icon: "⚡" },
  { id: "generous", name: "Power Player", desc: "Claim free coins 5 times.", icon: "🎁" },
];

export interface AchievementContext {
  betsPlaced: number;
  wins: number;
  winStreak: number;
  biggestBet: number;
  bestMultiplier: number;
  highestCrashSeen: number;
  balance: number;
  minBalanceSeen: number;
  roundsPlayed: number;
  freeCoinsClaimed: number;
}

/** Returns the full list of achievement ids that should be unlocked. */
export function evaluateAchievements(ctx: AchievementContext): string[] {
  const out: string[] = [];
  if (ctx.betsPlaced >= 1) out.push("first_flight");
  if (ctx.wins >= 1) out.push("first_win");
  if (ctx.biggestBet >= 5000) out.push("high_roller");
  if (ctx.biggestBet >= 25000) out.push("whale");
  if (ctx.bestMultiplier >= 7) out.push("lucky_seven");
  if (ctx.bestMultiplier >= 20) out.push("diamond_hands");
  if (ctx.highestCrashSeen >= 50) out.push("moonshot");
  if (ctx.balance >= 1_000_000) out.push("millionaire");
  if (ctx.minBalanceSeen < 1000 && ctx.balance >= 10000) out.push("comeback");
  if (ctx.roundsPlayed >= 100) out.push("veteran");
  if (ctx.winStreak >= 3) out.push("streak3");
  if (ctx.freeCoinsClaimed >= 5) out.push("generous");
  return out;
}
