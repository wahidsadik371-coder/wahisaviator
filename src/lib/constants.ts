// Central game tuning constants.
// Extended for Phases 1-10.

/** App identity — every visible credit and watermark pulls from here. */
export const APP = {
  NAME: "Wahid's Aviator",
  NAME_SHORT: "Aviator",
  DEVELOPER: "Wahid Sadik",
  DEVELOPER_HANDLE: "Developer Wahid Sadik",
  TAGLINE: "Crafted by Wahid Sadik",
  YEAR: new Date().getFullYear(),
};

export const GAME = {
  STARTING_BALANCE: 10_000,
  FREE_COINS_AMOUNT: 50_000,
  DAILY_BONUS_MIN: 8_000,
  DAILY_BONUS_MAX: 25_000,
  COUNTDOWN_MS: 6_000,
  CRASH_HOLD_MS: 3_800,
  /** Exponential growth of the multiplier, per millisecond. */
  GROWTH_PER_MS: 0.00018,
  MAX_BET: 500_000,
  MIN_BET: 10,
  BET_STEP_PRESETS: [10, 50, 100, 500] as const,
  HISTORY_LIMIT: 40,
  BET_HISTORY_LIMIT: 60,
  BALANCE_GRAPH_POINTS: 60,
  LEADERBOARD_SIZE: 12,
  CONFETTI_WIN_MULT: 10,
  BIG_WIN_THRESHOLD: 25_000,
  /**
   * localStorage key for the persisted store. Kept as "nova-rush-save-v1"
   * for backward compatibility.
   */
  STORAGE_KEY: "nova-rush-save-v1",
  // Phase 2: Streaks
  STREAK_BONUS_BASE: 1.0,
  STREAK_BONUS_INCREMENT: 0.15,
  STREAK_BONUS_CAP: 3.0,
  STREAK_BREAK_PENALTY_DAYS: 2,
  // Phase 2: XP & Levels
  XP_PER_ROUND_PLAYED: 10,
  XP_PER_WIN: 25,
  XP_PER_BIG_MULTIPLIER: 50,
  XP_PER_ACHIEVEMENT: 100,
  XP_PER_DAILY: 50,
  LEVEL_XP_BASE: 1000,
  LEVEL_XP_MULTIPLIER: 1.5,
};

// ---------- Phase 2: Streaks (also exported as standalone for clarity) ----------

export const STREAK = {
  BONUS_BASE: 1.0,
  BONUS_INCREMENT: 0.15, // 15% more per consecutive day
  BONUS_CAP: 3.0, // max 3x bonus
  BREAK_PENALTY_DAYS: 2, // 2 days missed resets streak
} as const;

// Convenient aliases for streak.ts
export const STREAK_BONUS_BASE = STREAK.BONUS_BASE;
export const STREAK_BONUS_INCREMENT = STREAK.BONUS_INCREMENT;
export const STREAK_BONUS_CAP = STREAK.BONUS_CAP;
export const STREAK_BREAK_PENALTY_DAYS = STREAK.BREAK_PENALTY_DAYS;

// ---------- Phase 2: XP & Levels ----------

export const XP = {
  PER_ROUND_PLAYED: 10,
  PER_WIN: 25,
  PER_BIG_MULTIPLIER: 50,
  PER_ACHIEVEMENT: 100,
  PER_DAILY: 50,
  LEVEL_XP_BASE: 1000,
  LEVEL_XP_MULTIPLIER: 1.5,
} as const;

// Convenient aliases for levels.ts
export const XP_PER_ROUND_PLAYED = XP.PER_ROUND_PLAYED;
export const XP_PER_WIN = XP.PER_WIN;
export const XP_PER_BIG_MULTIPLIER = XP.PER_BIG_MULTIPLIER;
export const XP_PER_ACHIEVEMENT = XP.PER_ACHIEVEMENT;
export const LEVEL_XP_BASE = XP.LEVEL_XP_BASE;
export const LEVEL_XP_MULTIPLIER = XP.LEVEL_XP_MULTIPLIER;

// ---------- Phase 2: Missions ----------

export const MISSIONS = {
  DAILY_COUNT: 3,
  WEEKLY_COUNT: 5,
  REFRESH_HOUR_UTC: 0,
} as const;

// ---------- Phase 4: Game modes ----------

export const GAME_MODES = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Standard crash rules. 6s countdown, normal growth.",
    countdownMs: 6_000,
    multiplierGrowthRate: 0.00018,
    minBet: 10,
    maxBet: 500_000,
    crashHoldMs: 3_800,
    features: ["auto_bet", "conditional"] as const,
  },
  turbo: {
    id: "turbo",
    name: "Turbo",
    description: "Faster rounds. 3s countdown, rapid growth.",
    countdownMs: 3_000,
    multiplierGrowthRate: 0.00036,
    minBet: 10,
    maxBet: 100_000,
    crashHoldMs: 1_500,
    features: ["auto_bet"] as const,
  },
  practice: {
    id: "practice",
    name: "Practice",
    description: "Infinite free coins, no stats tracked.",
    countdownMs: 6_000,
    multiplierGrowthRate: 0.00018,
    minBet: 10,
    maxBet: 500_000,
    crashHoldMs: 3_800,
    features: ["auto_bet", "conditional"] as const,
  },
} as const;

// ---------- Phase 6: Themes ----------

export const THEMES = [
  {
    id: "cyber",
    name: "Cyber (Default)",
    colors: { bg: "#05060f", panel: "#0b1024", accent: "#22d3ee", text: "#e7ecff", glow: "#22d3ee" },
  },
  {
    id: "retro",
    name: "Retro Wave",
    colors: { bg: "#1a0a2e", panel: "#2d1b3d", accent: "#f472b6", text: "#fce7f3", glow: "#f472b6" },
  },
  {
    id: "minimal",
    name: "Minimal Dark",
    colors: { bg: "#0a0a0a", panel: "#1a1a1a", accent: "#ffffff", text: "#fafafa", glow: "#a3a3a3" },
  },
  {
    id: "nature",
    name: "Forest",
    colors: { bg: "#0a1a0e", panel: "#1a2d1f", accent: "#34d399", text: "#d1fae5", glow: "#34d399" },
  },
  {
    id: "highcontrast",
    name: "High Contrast",
    colors: { bg: "#000000", panel: "#0a0a0a", accent: "#ffff00", text: "#ffffff", glow: "#ffff00" },
  },
] as const;

/** Convert elapsed milliseconds since launch into the live multiplier. */
export function multiplierAt(elapsedMs: number): number {
  return Math.max(1, Math.exp(GAME.GROWTH_PER_MS * elapsedMs));
}
