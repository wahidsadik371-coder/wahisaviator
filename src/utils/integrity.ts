// State integrity checks — detect tampering with persisted state.

import type { Stats } from "@/lib/types";

/** Compute a simple checksum of the state (FNV-1a, non-cryptographic). */
export function stateChecksum(state: unknown): string {
  const json = JSON.stringify(state);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export interface IntegrityIssue {
  type: "balance" | "stats" | "achievements";
  message: string;
}

export function validateStateIntegrity(state: {
  balance: number;
  stats: Stats;
  achievements: string[];
  totalXP: number;
  level: number;
}): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  // Impossible balance changes (more than 100M is suspicious for a demo)
  if (state.balance > 100_000_000) {
    issues.push({ type: "balance", message: "Balance exceeds reasonable threshold" });
  }
  if (state.balance < 0) {
    issues.push({ type: "balance", message: "Negative balance detected" });
  }
  // Stats inconsistency
  if (state.stats.wins > state.stats.betsPlaced) {
    issues.push({ type: "stats", message: "Wins exceed bets placed" });
  }
  if (state.stats.losses > state.stats.roundsPlayed) {
    issues.push({ type: "stats", message: "Losses exceed rounds played" });
  }
  // Level/XP mismatch
  const expectedLevel = Math.floor(Math.log(state.totalXP / 1000 + 1) / Math.log(1.5)) + 1;
  if (Math.abs(state.level - expectedLevel) > 2) {
    issues.push({ type: "achievements", message: "Level/XP mismatch" });
  }
  return issues;
}
