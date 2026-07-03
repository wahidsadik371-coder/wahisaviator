// Tournament system — simulated tournaments with AI participants.

import type { Tournament } from "./types";

const TOURNAMENT_NAMES = [
  "Weekly Crash Cup", "Aviator Championship", "Lunar Showdown",
  "Diamond League", "Phoenix Cup", "Midnight Madness",
  "Turbo Trials", "Legend's Arena",
];

const AI_NAMES = [
  "NeoPilot47", "CyberWolf99", "PixelAce", "QuantumRider", "AstroViper",
  "LunarNomad", "SolarFlare", "NebulaHunter", "TurboByte", "MegaPulse",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateLeaderboard() {
  return AI_NAMES.map((name) => ({
    name,
    score: Math.floor(Math.random() * 100000),
    color: pick(["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24"]),
  })).sort((a, b) => b.score - a.score);
}

export function generateTournament(daysFromNow: number, durationHours: number): Tournament {
  const now = Date.now();
  const start = now + daysFromNow * 86_400_000;
  const end = start + durationHours * 3_600_000;
  const participants = Math.floor(50 + Math.random() * 200);
  const prizePool = Math.floor(100_000 + Math.random() * 500_000);
  const rewards = [
    { rank: 1, prize: Math.floor(prizePool * 0.5) },
    { rank: 2, prize: Math.floor(prizePool * 0.25) },
    { rank: 3, prize: Math.floor(prizePool * 0.15) },
    { rank: 4, prize: Math.floor(prizePool * 0.07) },
    { rank: 5, prize: Math.floor(prizePool * 0.03) },
  ];
  const status: Tournament["status"] = daysFromNow <= 0 ? "active" : "upcoming";
  return {
    id: `tourn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: pick(TOURNAMENT_NAMES),
    startTime: start,
    endTime: end,
    entryFee: Math.floor(1000 + Math.random() * 5000),
    prizePool,
    participants,
    rules: { maxBets: 50, minMultiplier: 1.5 },
    leaderboard: generateLeaderboard(),
    status,
    rewards,
  };
}

export function generateTournamentSchedule(): Tournament[] {
  return [
    generateTournament(0, 24), // active now
    generateTournament(1, 24), // tomorrow
    generateTournament(3, 48), // 3 days from now
  ];
}

export function formatTimeUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "Started";
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${Math.floor((diff % 3_600_000) / 60_000)}m`;
  return `${Math.floor(diff / 60_000)}m`;
}
