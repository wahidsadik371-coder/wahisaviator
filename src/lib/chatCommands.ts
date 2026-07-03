// Chat commands system — /roll, /stats, /level, /help, /mute.
// Anti-spam: 1 message per 2 seconds. Basic profanity filter.

import type { useGameStore } from "@/store/useGameStore";

type StoreInstance = typeof useGameStore;

const PROFANITY = ["fuck", "shit", "bitch", "asshole", "dick", "cunt", "pussy"];
const PROFANITY_REPLACEMENT = "🤬";

export function filterProfanity(text: string): string {
  let out = text;
  for (const w of PROFANITY) {
    const re = new RegExp(`\\b${w}\\b`, "gi");
    out = out.replace(re, PROFANITY_REPLACEMENT);
  }
  return out;
}

export interface CommandResult {
  reply?: string; // bot reply shown in chat
  error?: string;
}

const RATE_LIMIT_MS = 2000;
const lastMessageTs: Map<string, number> = new Map();

export function rateLimited(userId: string): boolean {
  const now = Date.now();
  const last = lastMessageTs.get(userId) ?? 0;
  if (now - last < RATE_LIMIT_MS) return true;
  lastMessageTs.set(userId, now);
  return false;
}

export interface CommandContext {
  store: StoreInstance;
}

const COMMANDS: Record<string, (args: string[], ctx: CommandContext) => CommandResult> = {
  help: () => ({
    reply: "Commands: /help, /stats, /level, /roll, /mute <user>, /streak",
  }),
  stats: (_a, ctx) => {
    const s = ctx.store.getState().stats;
    return {
      reply: `Rounds: ${s.roundsPlayed} · Wins: ${s.wins} · Losses: ${s.losses} · Best: ${s.bestMultiplier.toFixed(2)}x`,
    };
  },
  level: (_a, ctx) => {
    const s = ctx.store.getState();
    return {
      reply: `Level ${s.level} · ${s.totalXP} XP`,
    };
  },
  streak: (_a, ctx) => {
    const s = ctx.store.getState().dailyStreak;
    return {
      reply: `Daily streak: ${s.currentStreak} (best ${s.longestStreak}) · ${s.streakMultiplier.toFixed(2)}x bonus`,
    };
  },
  roll: (args) => {
    const max = parseInt(args[0] ?? "100", 10) || 100;
    return { reply: `🎲 You rolled ${Math.floor(Math.random() * max) + 1} (1-${max})` };
  },
  mute: (args) => {
    if (!args[0]) return { error: "Usage: /mute <username>" };
    return { reply: `Muted ${args[0]} (local only)` };
  },
};

export function parseCommand(text: string, ctx: CommandContext): CommandResult | null {
  if (!text.startsWith("/")) return null;
  const [cmd, ...args] = text.slice(1).split(/\s+/);
  const handler = COMMANDS[cmd.toLowerCase()];
  if (!handler) return { error: `Unknown command: /${cmd}` };
  return handler(args, ctx);
}

export function validateMessage(text: string): { ok: boolean; error?: string; filtered: string } {
  if (text.length > 120) return { ok: false, error: "Message too long (120 chars max)", filtered: text };
  if (text.length === 0) return { ok: false, error: "Empty message", filtered: text };
  // Basic link filtering
  if (/https?:\/\//i.test(text)) return { ok: false, error: "Links not allowed in demo chat", filtered: text };
  return { ok: true, filtered: filterProfanity(text) };
}
