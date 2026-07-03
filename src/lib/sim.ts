// Simulated social layer: fake online players, leaderboard, and live chat.
// All data is generated client-side — no network calls.

import type { ChatMessage, LeaderEntry } from "./types";

const ADJ = [
  "Neo", "Cyber", "Hyper", "Void", "Pixel", "Quantum", "Astro", "Lunar",
  "Solar", "Nebula", "Turbo", "Mega", "Ultra", "Dark", "Plasma", "Nova",
  "Echo", "Volt", "Frost", "Blaze", "Onyx", "Crimson", "Ghost", "Phantom",
];

const NOUN = [
  "Pilot", "Rider", "Drifter", "Hunter", "Wolf", "Falcon", "Viper", "Rex",
  "Byte", "Spark", "Comet", "Rogue", "Ace", "Nomad", "Specter", "Runner",
  "Striker", "Phantom", "Reaper", "Scout", "Maverick", "Glider", "Pulse", "Flux",
];

const COLORS = [
  "#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb7185",
  "#60a5fa", "#c084fc", "#4ade80", "#f97316", "#e879f9", "#2dd4bf",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeName(): string {
  const base = pick(ADJ) + pick(NOUN);
  const suffix = Math.random() < 0.5 ? String(Math.floor(Math.random() * 99)) : "";
  return base + suffix;
}

export function randomColor(): string {
  return pick(COLORS);
}

let leaderId = 1;
export function generateLeaderboard(count: number): LeaderEntry[] {
  const entries: LeaderEntry[] = [];
  for (let i = 0; i < count; i++) {
    const wagered = Math.floor(500 + Math.random() * 4_000_000);
    entries.push({
      id: leaderId++,
      name: makeName(),
      color: pick(COLORS),
      wagered,
      won: Math.floor(wagered * (0.4 + Math.random() * 1.6)),
      bets: Math.floor(20 + Math.random() * 8000),
      online: Math.random() < 0.7,
    });
  }
  return entries.sort((a, b) => b.won - a.won);
}

// Chat templates. {m} is replaced with a random multiplier for flavor.
const LOW_CRASH = [
  "rip 😭", "called it", "knew i should've cashed", "brutal", "1.0x again? 💀",
  "instant crash smh", "house always wins", "down bad", "not like this",
];
const MID = [
  "gg", "nice", "decent run", "got my 2x ✌️", "out at {m}, happy", "ez",
  "patience pays", "smh should've held", "locked in profits",
];
const HIGH = [
  "LETS GOOO 🚀", "{m}?? insane", "diamond hands 💎", "to the moon 🌙",
  "big win!!", "w player", "{m} cashout let's go", "I'm rich 😎", "ape strong",
];
const GENERIC = [
  "anyone else riding?", "feeling lucky", "auto cashout at 2x 🤝", "gl all",
  "this is rigged 😂", "who's going big", "last one was close", "let it ride",
  "new high maybe?", "yolo time", "slow start today", " vibes ✨",
];

function line(pool: string[], m: string): string {
  return pick(pool).replace("{m}", m);
}

let chatId = 1;
export function makeChat(
  pool: "low" | "mid" | "high" | "generic",
  mult: number
): ChatMessage {
  const m = mult.toFixed(2) + "x";
  const text =
    pool === "low"
      ? line(LOW_CRASH, m)
      : pool === "mid"
      ? line(MID, m)
      : pool === "high"
      ? line(HIGH, m)
      : line(GENERIC, m);
  return {
    id: chatId++,
    user: makeName(),
    color: randomColor(),
    text,
    ts: Date.now(),
  };
}

export function seedChat(count: number): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (let i = 0; i < count; i++) {
    out.push(makeChat("generic", 2));
  }
  return out;
}

export function baselineOnline(): number {
  return Math.floor(1400 + Math.random() * 600);
}
