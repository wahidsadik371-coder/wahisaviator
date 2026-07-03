// Shared domain types for the Wahid's Aviator crash game.
// Extended for Phases 1-10 (streaks, missions, XP, cosmetics, shop, themes, etc.)

export type Phase = "waiting" | "running" | "crashed";

/** High-frequency engine state exposed to React (throttled) and Canvas (per-frame). */
export interface EngineSnapshot {
  phase: Phase;
  multiplier: number;
  elapsedMs: number;
  countdownMs: number;
  crashPoint: number;
  roundId: number;
  seedHash: string;
  revealedSeed: string | null;
}

export type BetLife = "queued" | "active" | "won" | "lost";

export interface ActiveBet {
  amount: number;
  roundId: number;
  status: BetLife;
  cashedAt: number | null;
  payout: number;
  autoTarget: number | null;
}

export interface RoundRecord {
  id: number;
  crashPoint: number;
  ts: number;
  youCashed: number | null;
  /** true if the player had an active (not queued) bet this round but
   *  didn't cash out before the crash. Used by HistoryStrip to show ✗. */
  youLost?: boolean;
  /** The amount the player wagered this round, if any. */
  youBetAmount?: number;
}

export interface BetRecord {
  roundId: number;
  amount: number;
  multiplier: number | null;
  payout: number;
  ts: number;
  win: boolean;
}

export interface Stats {
  roundsPlayed: number;
  betsPlaced: number;
  totalWagered: number;
  totalReturned: number;
  wins: number;
  losses: number;
  biggestWin: number;
  bestMultiplier: number;
  biggestBet: number;
  highestCrashSeen: number;
}

export interface BalancePoint {
  t: number;
  b: number;
}

export interface ChatMessage {
  id: number;
  user: string;
  color: string;
  text: string;
  ts: number;
  you?: boolean;
  replyTo?: number;
  reactions?: Record<string, number>;
}

export interface LeaderEntry {
  id: number;
  name: string;
  color: string;
  wagered: number;
  won: number;
  bets: number;
  online: boolean;
}

export interface Settings {
  sound: boolean;
  volume: number;
  animations: boolean;
  performanceMode: boolean;
  showParticles: boolean;
  analytics?: boolean;
  theme?: string;
  reducedMotion?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface BetConfig {
  amount: number;
  autoBet: boolean;
  autoCashoutEnabled: boolean;
  autoCashoutTarget: number;
}

// ---------- Phase 2: Economy ----------

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
  streakMultiplier: number;
  streakHistory: { date: string; claimed: boolean; bonusMultiplier: number }[];
}

export type MissionType =
  | "rounds_played"
  | "wins"
  | "multiplier_reached"
  | "coins_wagered"
  | "profit"
  | "streak"
  | "cashout_before_crash";

export interface MissionTemplate {
  id: string;
  category: "daily" | "weekly" | "special";
  description: string;
  target: number;
  reward: number;
  type: MissionType;
  difficulty: "easy" | "medium" | "hard";
}

export interface Mission extends MissionTemplate {
  templateId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  assignedDate: string;
}

export type CosmeticRarity = "common" | "rare" | "epic" | "legendary";

export interface CosmeticPalette {
  id: string;
  name: string;
  hull: string; // hex color or "rainbow"
  accent: string;
  flame: string;
  rarity: CosmeticRarity;
}

export interface Cosmetic {
  id: string;
  name: string;
  type: "hovercraft";
  palette: CosmeticPalette;
  unlockRequirement: { type: "level" | "achievement" | "coins" | "mission"; value: number };
  rarity: CosmeticRarity;
}

export interface ActiveCosmetics {
  hovercraftId: string;
}

export interface ShopItem {
  id: string;
  name: string;
  type: "cosmetic" | "boost" | "special";
  price: number;
  currency: "coins" | "xp";
  limited: boolean;
  quantity?: number;
  expiresAt?: number;
  cosmeticId?: string;
  effect?: string;
  durationMs?: number;
  assignedDate: string;
}

// ---------- Phase 3: Social ----------

export interface Friend {
  id: string;
  name: string;
  color: string;
  online: boolean;
  lastSeen: number;
  stats: { level: number; wins: number; bestMultiplier: number };
  favoriteCosmetic?: string;
}

// ---------- Phase 4: Game features ----------

export interface BettingStrategy {
  id: string;
  name: string;
  description: string;
  type: "martingale" | "fibonacci" | "dalembert" | "paroli" | "custom";
  config: {
    baseAmount: number;
    onWin: "reset" | "increase" | "maintain";
    onLoss: "increase" | "reset" | "maintain";
    winMultiplier: number;
    lossMultiplier: number;
    maxSteps: number;
    stopOnProfit: number;
    stopOnLoss: number;
  };
}

export interface ConditionalRule {
  id: string;
  triggerMultiplier: number;
  action: "cashout_partial" | "cashout_all" | "increase_bet";
  value: number; // percentage 0-100 or amount
  enabled: boolean;
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  countdownMs: number;
  multiplierGrowthRate: number;
  minBet: number;
  maxBet: number;
  crashHoldMs: number;
  features: readonly ("auto_bet" | "conditional" | "split_bet")[];
}

export interface Tournament {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  entryFee: number;
  prizePool: number;
  participants: number;
  rules: { maxBets: number; minMultiplier: number };
  leaderboard: { name: string; score: number; color: string }[];
  status: "upcoming" | "active" | "completed";
  rewards: { rank: number; prize: number }[];
}

// ---------- Phase 5: Educational ----------

export interface ReplayData {
  roundId: number;
  crashPoint: number;
  multiplierHistory: { t: number; m: number }[];
  bets: { amount: number; cashedAt: number | null; win: boolean }[];
  ts: number;
}

// ---------- Phase 6: Themes ----------

export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    panel: string;
    accent: string;
    text: string;
    glow: string;
  };
}

// ---------- Phase 8: Security ----------

export interface IntegrityRecord {
  checksum: string;
  ts: number;
  balanceAtCheck: number;
}

// ---------- Phase 10: Events ----------

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startMonth: number; // 0-indexed
  endMonth: number;
  themeColor: string;
  particleEffect?: "snow" | "hearts" | "fireworks" | "leaves" | "default";
}
