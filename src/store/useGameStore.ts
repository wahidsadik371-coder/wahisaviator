// Central game store (Zustand + persist). Owns all persistent player state and
// reacts to engine events (launch / tick / crash) to settle bets.
//
// EXTENDED for Phases 1-10:
//   - Daily streaks (Phase 2.1)
//   - Missions (Phase 2.2)
//   - XP & levels (Phase 2.3)
//   - Cosmetics (Phase 2.4)
//   - Shop (Phase 2.5)
//   - Friends (Phase 3.2)
//   - Strategies / game modes / tournaments (Phase 4)
//   - Replays (Phase 5.4)
//   - Themes (Phase 6.2)
//   - Tutorial / onboarding (Phase 6.5)
//   - Easter eggs / seasonal events (Phase 10)
//
// All new state is added to the same store per the prompt's instruction
// ("DO NOT create separate stores yet — enhance the existing useGameStore").
// Selectors in src/store/selectors.ts provide memoized access to slices.

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { engine } from "@/engine/crashEngine";
import { generateClientSeed } from "@/lib/rng";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
} from "@/lib/achievements";
import { GAME } from "@/lib/constants";
import { clamp, dayKey } from "@/lib/format";
import { sound } from "@/lib/sound";
import {
  baselineOnline,
  generateLeaderboard,
  makeChat,
  seedChat,
} from "@/lib/sim";
import { monitoring } from "@/lib/monitoring";
import { applyClaim, emptyStreak } from "@/lib/streak";
import {
  generateDailyMissions,
  generateWeeklyMissions,
  evaluateMissionProgress,
} from "@/lib/missions";
import {
  calculateLevel,
  getLevelTitle,
  xpForAction,
} from "@/lib/levels";
import {
  COSMETICS,
  getCosmeticById,
  isCosmeticUnlocked,
} from "@/lib/cosmetics";
import {
  generateDailyShop,
  shopNeedsRefresh,
  validatePurchase,
} from "@/lib/shop";
import { generateInitialFriends } from "@/lib/friends";
import { STRATEGY_PRESETS, initStrategyState, nextBetAfterWin, nextBetAfterLoss, shouldStop, type StrategyState } from "@/lib/strategies";
import { getModeById } from "@/lib/gameModes";
import { generateTournamentSchedule } from "@/lib/tournaments";
import { applyTheme } from "@/lib/themes";
import { getActiveEvent } from "@/lib/events";
import type {
  ActiveBet,
  BalancePoint,
  BetConfig,
  BetRecord,
  BettingStrategy,
  ChatMessage,
  ConditionalRule,
  DailyStreak,
  EngineSnapshot,
  Friend,
  LeaderEntry,
  Mission,
  RoundRecord,
  Settings,
  ShopItem,
  Stats,
  Tournament,
  ReplayData,
  ActiveCosmetics,
} from "@/lib/types";

export type ToastKind = "win" | "achievement" | "info" | "daily";

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface FloatCoin {
  id: number;
  amount: number;
}

export interface GameStore {
  // --- persistent ---
  balance: number;
  stats: Stats;
  history: RoundRecord[];
  betHistory: BetRecord[];
  achievements: string[];
  betConfig: BetConfig;
  settings: Settings;
  lastDailyClaim: string | null;
  minBalanceSeen: number;
  freeCoinsClaimed: number;
  balanceGraph: BalancePoint[];
  winStreak: number;
  /**
   * Persisted snapshot of an unresolved bet (wagered amount only). Set
   * whenever a bet is placed/queued/activated, cleared when the bet
   * resolves (won/lost/cancelled). On reload, if this is non-zero we
   * refund it to balance — see init() for the rationale.
   */
  pendingWager: number;

  // --- Phase 2: Economy ---
  dailyStreak: DailyStreak;
  activeDailyMissions: Mission[];
  activeWeeklyMissions: Mission[];
  completedMissionIds: string[];
  lastMissionRefresh: string | null;
  totalXP: number;
  level: number;
  unlockedCosmetics: string[];
  activeCosmetics: ActiveCosmetics;
  shopItems: ShopItem[];
  lastShopDate: string | null;
  purchaseHistory: { itemId: string; date: string; price: number }[];
  activeBoosts: { effect: string; expiresAt: number }[];

  // --- Phase 3: Social ---
  friends: Friend[];
  displayName: string;
  mutedUsers: string[];

  // --- Phase 4: Game features ---
  activeStrategy: BettingStrategy | null;
  strategyState: StrategyState | null;
  conditionalRules: ConditionalRule[];
  activeGameMode: string;
  tournaments: Tournament[];

  // --- Phase 5: Educational ---
  replayData: ReplayData[];
  tutorialCompleted: boolean;
  tutorialStep: number;
  contextualTipsEnabled: boolean;
  shownContextualTips: string[];

  // --- Phase 6: UI/UX ---
  activeTheme: string;
  konamiActivated: boolean;

  // --- Phase 8: Security ---
  integrityRecords: { checksum: string; ts: number }[];

  // --- Phase 10: Events ---
  activeEvent: string | null;
  seenEventIds: string[];

  // --- Provably Fair (Phase: RNG Overhaul) ---
  clientSeed: string;
  previousServerSeeds: { seed: string; hash: string; nonceRange: [number, number]; rounds: number; revealedAt: number }[];

  // --- live (non-persistent) ---
  activeBet: ActiveBet | null;
  chat: ChatMessage[];
  leaderboard: LeaderEntry[];
  onlineCount: number;
  toasts: Toast[];
  floats: FloatCoin[];
  lastWin: { amount: number; multiplier: number } | null;
  confettiToken: number;
  seeded: boolean;

  // --- lifecycle ---
  init: () => void;
  onLaunch: (roundId: number) => void;
  onCrash: (snap: EngineSnapshot) => void;
  checkAutoCashout: (multiplier: number) => void;

  // --- betting ---
  placeBet: () => void;
  cancelBet: () => void;
  cashOut: (multiplier?: number) => void;
  setBetAmount: (v: number) => void;
  adjustBet: (delta: number) => void;
  setBetPreset: (op: "half" | "double" | "max" | "min") => void;
  toggleAutoBet: () => void;
  setAutoCashoutEnabled: (v: boolean) => void;
  setAutoCashoutTarget: (v: number) => void;

  // --- economy ---
  addFreeCoins: () => void;
  claimDaily: () => void;
  dailyAvailable: () => boolean;

  // --- social ---
  postChat: (text: string) => void;
  tickSocial: () => void;

  // --- settings / misc ---
  setSound: (v: boolean) => void;
  setVolume: (v: number) => void;
  toggleAnimations: () => void;
  togglePerformance: () => void;
  toggleParticles: () => void;
  resetProgress: () => void;

  // --- transient ui ---
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  addFloat: (amount: number) => void;
  removeFloat: (id: number) => void;
  _syncAchievements: () => void;

  // --- Phase 2: Economy actions ---
  refreshMissions: () => void;
  claimMission: (missionId: string) => void;
  checkMissionProgress: () => void;
  addXP: (amount: number) => void;
  equipCosmetic: (cosmeticId: string) => void;
  unlockCosmetic: (cosmeticId: string) => void;
  refreshShop: () => void;
  purchaseShopItem: (itemId: string) => void;
  getStreakInfo: () => { currentStreak: number; longestStreak: number; multiplier: number };

  // --- Phase 3: Social actions ---
  addFriend: () => void;
  removeFriend: (friendId: string) => void;
  setDisplayName: (name: string) => void;
  muteUser: (username: string) => void;
  unmuteUser: (username: string) => void;
  reactToMessage: (messageId: number, emoji: string) => void;

  // --- Phase 4: Game actions ---
  setStrategy: (strategyId: string | null) => void;
  updateStrategyConfig: (config: Partial<BettingStrategy["config"]>) => void;
  clearStrategy: () => void;
  addConditionalRule: (rule: Omit<ConditionalRule, "id">) => void;
  removeConditionalRule: (ruleId: string) => void;
  toggleConditionalRule: (ruleId: string) => void;
  setGameMode: (modeId: string) => void;
  refreshTournaments: () => void;

  // --- Phase 5: Educational actions ---
  recordReplay: (data: ReplayData) => void;
  completeTutorial: () => void;
  setTutorialStep: (step: number) => void;
  resetTutorial: () => void;
  toggleContextualTips: () => void;
  markContextualTipShown: (tipId: string) => void;

  // --- Phase 6: UI/UX actions ---
  setTheme: (themeId: string) => void;
  setKonami: (v: boolean) => void;

  // --- Phase 8: Security actions ---
  recordIntegrity: (checksum: string) => void;

  // --- Phase 10: Events actions ---
  setActiveEvent: (eventId: string | null) => void;
  markEventSeen: (eventId: string) => void;

  // --- Provably Fair actions (RNG Overhaul) ---
  setClientSeed: (seed: string) => void;
  rotateServerSeed: () => void;
  onSeedEpochEnd: (epoch: { serverSeed: string; serverSeedHash: string; nonce: number; startRound: number }) => void;
  getProvablyFairState: () => {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    previousSeeds: { seed: string; hash: string; nonceRange: [number, number]; rounds: number }[];
  };
}

const DEFAULT_STATS: Stats = {
  roundsPlayed: 0,
  betsPlaced: 0,
  totalWagered: 0,
  totalReturned: 0,
  wins: 0,
  losses: 0,
  biggestWin: 0,
  bestMultiplier: 0,
  biggestBet: 0,
  highestCrashSeen: 0,
};

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  volume: 0.6,
  animations: true,
  performanceMode: false,
  showParticles: true,
};

const DEFAULT_BET_CONFIG: BetConfig = {
  amount: 100,
  autoBet: false,
  autoCashoutEnabled: false,
  autoCashoutTarget: 2,
};

let toastSeq = 1;
let floatSeq = 1;
let youChatSeq = 1;

function clampBet(v: number): number {
  return clamp(Math.round(v), GAME.MIN_BET, GAME.MAX_BET);
}

function pushPoint(balance: number, graph: BalancePoint[]): BalancePoint[] {
  const next = [...graph, { t: Date.now(), b: balance }];
  return next.slice(-GAME.BALANCE_GRAPH_POINTS);
}

function computeAchievements(s: GameStore): {
  list: string[];
  newly: string[];
} {
  const ctx = {
    betsPlaced: s.stats.betsPlaced,
    wins: s.stats.wins,
    winStreak: s.winStreak,
    biggestBet: s.stats.biggestBet,
    bestMultiplier: s.stats.bestMultiplier,
    highestCrashSeen: s.stats.highestCrashSeen,
    balance: s.balance,
    minBalanceSeen: s.minBalanceSeen,
    roundsPlayed: s.stats.roundsPlayed,
    freeCoinsClaimed: s.freeCoinsClaimed,
  };
  const list = evaluateAchievements(ctx);
  const newly = list.filter((id) => !s.achievements.includes(id));
  return { list, newly };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      balance: GAME.STARTING_BALANCE,
      stats: { ...DEFAULT_STATS },
      history: [],
      betHistory: [],
      achievements: [],
      betConfig: { ...DEFAULT_BET_CONFIG },
      settings: { ...DEFAULT_SETTINGS },
      lastDailyClaim: null,
      minBalanceSeen: GAME.STARTING_BALANCE,
      freeCoinsClaimed: 0,
      balanceGraph: [{ t: Date.now(), b: GAME.STARTING_BALANCE }],
      winStreak: 0,
      pendingWager: 0,

      // Phase 2 defaults
      dailyStreak: emptyStreak(),
      activeDailyMissions: [],
      activeWeeklyMissions: [],
      completedMissionIds: [],
      lastMissionRefresh: null,
      totalXP: 0,
      level: 1,
      unlockedCosmetics: ["default"], // default hovercraft always unlocked
      activeCosmetics: { hovercraftId: "default" },
      shopItems: [],
      lastShopDate: null,
      purchaseHistory: [],
      activeBoosts: [],

      // Phase 3 defaults
      friends: [],
      displayName: "You",
      mutedUsers: [],

      // Phase 4 defaults
      activeStrategy: null,
      strategyState: null,
      conditionalRules: [],
      activeGameMode: "classic",
      tournaments: [],

      // Phase 5 defaults
      replayData: [],
      tutorialCompleted: false,
      tutorialStep: 0,
      contextualTipsEnabled: true,
      shownContextualTips: [],

      // Phase 6 defaults
      activeTheme: "cyber",
      konamiActivated: false,

      // Phase 8 defaults
      integrityRecords: [],

      // Phase 10 defaults
      activeEvent: null,
      seenEventIds: [],

      // Provably Fair defaults
      clientSeed: "",
      previousServerSeeds: [],

      activeBet: null,
      chat: [],
      leaderboard: [],
      onlineCount: baselineOnline(),
      toasts: [],
      floats: [],
      lastWin: null,
      confettiToken: 0,
      seeded: false,

      init: () => {
        if (get().seeded) return;
        sound.setEnabled(get().settings.sound);
        sound.setVolume(get().settings.volume);

        // FIX (reload-during-round bug): activeBet is intentionally NOT
        // persisted (it's transient), so if the user reloads while a bet
        // was queued or active, the wagered amount was already deducted
        // from the persisted balance but the bet itself was lost. We can't
        // know whether it would have won, so we refund the principal —
        // the user gets their stake back. Stats (betsPlaced, totalWagered)
        // are NOT rolled back because that would skew analytics; the
        // refunded amount is added back as a net-positive balance event.
        // (Without persistence of activeBet, this is the only correct fix.
        // A future server-backed version would reconcile via roundId.)
        const st = get();
        if (st.pendingWager > 0) {
          const refund = st.pendingWager;
          set((s) => ({
            balance: s.balance + refund,
            balanceGraph: pushPoint(s.balance + refund, s.balanceGraph),
            pendingWager: 0,
            activeBet: null,
          }));
        }

        set({
          seeded: true,
          chat: seedChat(14),
          leaderboard: generateLeaderboard(GAME.LEADERBOARD_SIZE),
          onlineCount: baselineOnline(),
          minBalanceSeen: Math.min(get().minBalanceSeen, get().balance),
        });

        // Phase 2: Seed missions + shop if not yet refreshed today
        const today = dayKey();
        const st2 = get();
        if (st2.lastMissionRefresh !== today) {
          set({
            activeDailyMissions: generateDailyMissions(),
            activeWeeklyMissions: generateWeeklyMissions(),
            lastMissionRefresh: today,
          });
        }
        if (shopNeedsRefresh(st2.lastShopDate)) {
          set({
            shopItems: generateDailyShop(st2.level),
            lastShopDate: today,
          });
        }
        // Phase 3: Seed initial friends
        if (st2.friends.length === 0) {
          set({ friends: generateInitialFriends(5) });
        }
        // Phase 4: Seed tournaments
        if (st2.tournaments.length === 0) {
          set({ tournaments: generateTournamentSchedule() });
        }
        // Phase 6: Apply saved theme
        applyTheme(st2.activeTheme);
        // Phase 10: Detect active seasonal event
        const event = getActiveEvent();
        if (event && st2.activeEvent !== event.id) {
          set({ activeEvent: event.id });
        }
        // Phase 1: Mark session start
        monitoring.breadcrumb("session", "init", { balance: st2.balance, level: st2.level });
      },

      onLaunch: (roundId) => {
        sound.play("launch");
        const ab = get().activeBet;
        if (ab && ab.roundId === roundId && ab.status === "queued") {
          set({
            activeBet: { ...ab, status: "active" },
          });
        }
      },

      checkAutoCashout: (multiplier) => {
        const { activeBet, betConfig } = get();
        if (
          activeBet &&
          activeBet.status === "active" &&
          betConfig.autoCashoutEnabled &&
          multiplier >= betConfig.autoCashoutTarget
        ) {
          get().cashOut(betConfig.autoCashoutTarget);
        }
      },

      cashOut: (multiplier) => {
        const ab = get().activeBet;
        if (!ab || ab.status !== "active") return;
        const m = multiplier ?? engine.getSnapshot().multiplier;
        const payout = Math.round(ab.amount * m);
        set((s) => ({
          balance: s.balance + payout,
          minBalanceSeen: Math.min(s.minBalanceSeen, s.balance + payout),
          balanceGraph: pushPoint(s.balance + payout, s.balanceGraph),
          pendingWager: 0, // bet resolved — no longer refundable on reload
          activeBet: {
            ...ab,
            status: "won",
            cashedAt: m,
            payout,
          },
          stats: {
            ...s.stats,
            totalReturned: s.stats.totalReturned + payout,
            wins: s.stats.wins + 1,
            bestMultiplier: Math.max(s.stats.bestMultiplier, m),
            biggestWin: Math.max(s.stats.biggestWin, payout),
          },
          winStreak: s.winStreak + 1,
          lastWin: { amount: payout, multiplier: m },
          betHistory: [
            {
              roundId: ab.roundId,
              amount: ab.amount,
              multiplier: m,
              payout,
              ts: Date.now(),
              win: true,
            },
            ...s.betHistory,
          ].slice(0, GAME.BET_HISTORY_LIMIT),
          confettiToken:
            m >= GAME.CONFETTI_WIN_MULT ? s.confettiToken + 1 : s.confettiToken,
        }));
        if (m >= GAME.CONFETTI_WIN_MULT) sound.play("win");
        else sound.play("cashout");
        if (payout >= GAME.BIG_WIN_THRESHOLD) {
          get().pushToast({
            kind: "win",
            title: "Big Win!",
            subtitle: `+${payout.toLocaleString()} coins @ ${m.toFixed(2)}x`,
            icon: "🎉",
          });
        }
        // Phase 2: Award XP for the win
        const xpGain = m >= 10 ? xpForAction("big_mult") : xpForAction("win");
        get().addXP(xpGain);
        // Phase 1: Breadcrumb for error context
        monitoring.breadcrumb("bet", "cashout", { multiplier: m, payout, xp: xpGain });
        monitoring.trackBet();
        // Phase 4: Update strategy state if active
        const strat = get().activeStrategy;
        if (strat && get().strategyState) {
          const newState = nextBetAfterWin(strat, get().strategyState!);
          const profit = payout - ab.amount;
          set({
            strategyState: {
              ...newState,
              totalProfit: newState.totalProfit + profit,
              history: [...newState.history, { bet: ab.amount, won: true, amount: payout }].slice(-50),
            },
          });
          // Auto-adjust bet for next round
          set((s) => ({
            betConfig: { ...s.betConfig, amount: clampBet(get().strategyState!.currentAmount) },
          }));
        }
        get()._syncAchievements();
        get().checkMissionProgress();
      },

      onCrash: (snap) => {
        const cp = snap.crashPoint;
        sound.play("crash");
        const ab = get().activeBet;
        const youCashed = ab && ab.roundId === snap.roundId ? ab.cashedAt : null;
        // Track whether the player had an active bet that LOST (didn't cash
        // out before crash). This lets HistoryStrip show ✗ vs neutral.
        const youLost = !!(ab && ab.roundId === snap.roundId && ab.status === "active");
        const youBetAmount = ab && ab.roundId === snap.roundId ? ab.amount : undefined;

        set((s) => ({
          history: [
            { id: snap.roundId, crashPoint: cp, ts: Date.now(), youCashed, youLost, youBetAmount },
            ...s.history,
          ].slice(0, GAME.HISTORY_LIMIT),
          stats: {
            ...s.stats,
            roundsPlayed: s.stats.roundsPlayed + 1,
            highestCrashSeen: Math.max(s.stats.highestCrashSeen, cp),
          },
        }));

        if (
          ab &&
          ab.roundId === snap.roundId &&
          ab.status !== "queued"
        ) {
          if (ab.status === "active") {
            set((s) => ({
              activeBet: { ...ab, status: "lost" },
              stats: { ...s.stats, losses: s.stats.losses + 1 },
              winStreak: 0,
              pendingWager: 0, // bet resolved — no longer refundable
              betHistory: [
                {
                  roundId: ab.roundId,
                  amount: ab.amount,
                  multiplier: null,
                  payout: 0,
                  ts: Date.now(),
                  win: false,
                },
                ...s.betHistory,
              ].slice(0, GAME.BET_HISTORY_LIMIT),
            }));
          }
          // Clear resolved bet (won or lost).
          // Note: pendingWager is cleared in cashOut()/onCrash above so the
          // refund-on-reload invariant holds. Won bets already cleared it.
          set({ activeBet: null });
        }

        // Simulated chat reactions.
        const pool = cp < 1.5 ? "low" : cp < 8 ? "mid" : "high";
        const count = pool === "mid" ? 1 : 2;
        set((s) => {
          const additions: ChatMessage[] = [];
          for (let i = 0; i < count; i++) additions.push(makeChat(pool, cp));
          return { chat: [...additions, ...s.chat].slice(0, 60) };
        });

        // Drift online count slightly each round.
        set((s) => ({
          onlineCount: clamp(
            s.onlineCount + Math.floor((Math.random() - 0.5) * 10),
            900,
            2600
          ),
        }));

        get()._syncAchievements();

        // Phase 1: Track round + breadcrumb
        monitoring.trackRound();
        monitoring.breadcrumb("round", "crash", { roundId: snap.roundId, crashPoint: cp });

        // Phase 2: Award XP for playing a round
        get().addXP(xpForAction("round"));
        get().checkMissionProgress();

        // Phase 5: Record replay (last 20)
        const replay: ReplayData = {
          roundId: snap.roundId,
          crashPoint: cp,
          multiplierHistory: [], // would be populated by engine if we hooked tick
          bets: [],
          ts: Date.now(),
        };
        set((s) => ({
          replayData: [replay, ...s.replayData].slice(0, 20),
        }));

        // Phase 4: Update strategy state if active and bet was lost.
        // BUG FIX: Previously read `get().activeBet` here, but the bet was
        // already cleared (set to null) earlier in this handler. That made
        // `ab2?.amount ?? 0` always evaluate to 0, so every strategy loss
        // was recorded as 0 coins lost — breaking Martingale/Fibonacci
        // progression and the stopOnLoss safety check.
        // FIX: Use the `ab` variable captured at the START of onCrash,
        // before the bet was cleared. This preserves the actual bet amount
        // for strategy loss tracking.
        const strat = get().activeStrategy;
        if (strat && get().strategyState && ab && ab.roundId === snap.roundId && ab.status === "active") {
          const lostAmount = ab.amount;
          const newState = nextBetAfterLoss(strat, get().strategyState!);
          set({
            strategyState: {
              ...newState,
              totalLoss: newState.totalLoss + lostAmount,
              history: [...newState.history, { bet: lostAmount, won: false, amount: 0 }].slice(-50),
            },
          });
          const stop = shouldStop(strat, get().strategyState!);
          if (stop.stop) {
            get().pushToast({
              kind: "info",
              title: "Strategy stopped",
              subtitle: stop.reason,
              icon: "🛑",
            });
            set({ activeStrategy: null, strategyState: null });
          } else {
            set((s) => ({
              betConfig: { ...s.betConfig, amount: clampBet(get().strategyState!.currentAmount) },
            }));
          }
        }

        // Auto-bet: re-queue the same wager for the next round.
        if (get().betConfig.autoBet) {
          get().placeBet();
        }
      },

      placeBet: () => {
        const s = get();
        if (s.activeBet) return;
        const snap = engine.getSnapshot();
        const target =
          snap.phase === "waiting" ? snap.roundId : snap.roundId + 1;
        const amount = clampBet(
          Math.min(s.betConfig.amount, Math.max(GAME.MIN_BET, s.balance))
        );
        if (s.balance < GAME.MIN_BET) {
          get().pushToast({
            kind: "info",
            title: "Not enough coins",
            subtitle: "Grab free coins to keep playing!",
            icon: "🪙",
          });
          return;
        }
        set((st) => ({
          balance: st.balance - amount,
          minBalanceSeen: Math.min(st.minBalanceSeen, st.balance - amount),
          balanceGraph: pushPoint(st.balance - amount, st.balanceGraph),
          stats: {
            ...st.stats,
            betsPlaced: st.stats.betsPlaced + 1,
            totalWagered: st.stats.totalWagered + amount,
            biggestBet: Math.max(st.stats.biggestBet, amount),
          },
          pendingWager: amount, // persisted so a reload can refund it
          activeBet: {
            amount,
            roundId: target,
            status: "queued",
            cashedAt: null,
            payout: 0,
            autoTarget: st.betConfig.autoCashoutEnabled
              ? st.betConfig.autoCashoutTarget
              : null,
          },
        }));
        sound.play("bet");
        get()._syncAchievements();
      },

      cancelBet: () => {
        const ab = get().activeBet;
        if (!ab || ab.status !== "queued") return;
        set((st) => ({
          balance: st.balance + ab.amount,
          balanceGraph: pushPoint(st.balance + ab.amount, st.balanceGraph),
          pendingWager: 0,
          activeBet: null,
        }));
        sound.play("click");
      },

      setBetAmount: (v) => {
        set((s) => ({ betConfig: { ...s.betConfig, amount: clampBet(v) } }));
      },

      adjustBet: (delta) => {
        set((s) => ({
          betConfig: {
            ...s.betConfig,
            amount: clampBet(s.betConfig.amount + delta),
          },
        }));
      },

      setBetPreset: (op) => {
        set((s) => {
          const cur = s.betConfig.amount;
          let next = cur;
          if (op === "half") next = cur / 2;
          else if (op === "double") next = cur * 2;
          else if (op === "max") next = Math.min(GAME.MAX_BET, s.balance);
          else if (op === "min") next = GAME.MIN_BET;
          return { betConfig: { ...s.betConfig, amount: clampBet(next) } };
        });
        sound.play("click");
      },

      toggleAutoBet: () => {
        const next = !get().betConfig.autoBet;
        set((s) => ({ betConfig: { ...s.betConfig, autoBet: next } }));
        sound.play("click");
        if (next && !get().activeBet) get().placeBet();
      },

      setAutoCashoutEnabled: (v) => {
        set((s) => ({
          betConfig: { ...s.betConfig, autoCashoutEnabled: v },
        }));
        sound.play("click");
      },

      setAutoCashoutTarget: (v) => {
        set((s) => ({
          betConfig: {
            ...s.betConfig,
            autoCashoutTarget: clamp(v, 1.01, 1000),
          },
        }));
      },

      addFreeCoins: () => {
        const amount = GAME.FREE_COINS_AMOUNT;
        set((s) => ({
          balance: s.balance + amount,
          freeCoinsClaimed: s.freeCoinsClaimed + 1,
          balanceGraph: pushPoint(s.balance + amount, s.balanceGraph),
        }));
        get().addFloat(amount);
        sound.play("coin");
        get()._syncAchievements();
      },

      claimDaily: () => {
        if (!get().dailyAvailable()) return;
        // Phase 2: Apply streak multiplier
        const newStreak = applyClaim(get().dailyStreak);
        const baseAmount = Math.floor(
          GAME.DAILY_BONUS_MIN +
            Math.random() * (GAME.DAILY_BONUS_MAX - GAME.DAILY_BONUS_MIN)
        );
        const amount = Math.floor(baseAmount * newStreak.streakMultiplier);
        set((s) => ({
          balance: s.balance + amount,
          lastDailyClaim: dayKey(),
          dailyStreak: newStreak,
          balanceGraph: pushPoint(s.balance + amount, s.balanceGraph),
        }));
        get().addFloat(amount);
        sound.play("achievement");
        get().pushToast({
          kind: "daily",
          title: "Daily Bonus!",
          subtitle: `+${amount.toLocaleString()} coins · ${newStreak.currentStreak} day streak (${newStreak.streakMultiplier.toFixed(2)}x)`,
          icon: newStreak.currentStreak >= 7 ? "🔥" : "📅",
        });
        // Phase 2: Award XP for daily claim
        get().addXP(xpForAction("daily"));
        get()._syncAchievements();
        monitoring.breadcrumb("economy", "daily_claim", { amount, streak: newStreak.currentStreak });
      },

      dailyAvailable: () => dayKey() !== get().lastDailyClaim,

      postChat: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          chat: [
            {
              id: youChatSeq++,
              user: "You",
              color: "#22d3ee",
              text: trimmed,
              ts: Date.now(),
              you: true,
            },
            ...s.chat,
          ].slice(0, 60),
        }));
      },

      tickSocial: () => {
        set((s) => ({
          onlineCount: clamp(
            s.onlineCount + Math.floor((Math.random() - 0.5) * 8),
            900,
            2600
          ),
        }));
        if (Math.random() < 0.3) {
          set((s) => ({
            chat: [makeChat("generic", 2), ...s.chat].slice(0, 60),
          }));
        }
        if (Math.random() < 0.25) {
          set((s) => {
            const lb = [...s.leaderboard];
            const i = Math.floor(Math.random() * lb.length);
            const drift = Math.floor((Math.random() - 0.45) * 50000);
            lb[i] = { ...lb[i], won: Math.max(0, lb[i].won + drift) };
            return { leaderboard: lb };
          });
        }
      },

      setSound: (v) => {
        set((s) => ({ settings: { ...s.settings, sound: v } }));
        sound.setEnabled(v);
        if (v) sound.play("click");
      },

      setVolume: (v) => {
        set((s) => ({ settings: { ...s.settings, volume: v } }));
        sound.setVolume(v);
      },

      toggleAnimations: () => {
        set((s) => ({
          settings: { ...s.settings, animations: !s.settings.animations },
        }));
        sound.play("click");
      },

      togglePerformance: () => {
        set((s) => ({
          settings: {
            ...s.settings,
            performanceMode: !s.settings.performanceMode,
          },
        }));
        sound.play("click");
      },

      toggleParticles: () => {
        set((s) => ({
          settings: { ...s.settings, showParticles: !s.settings.showParticles },
        }));
        sound.play("click");
      },

      resetProgress: () => {
        set({
          balance: GAME.STARTING_BALANCE,
          stats: { ...DEFAULT_STATS },
          history: [],
          betHistory: [],
          achievements: [],
          betConfig: { ...DEFAULT_BET_CONFIG },
          lastDailyClaim: null,
          minBalanceSeen: GAME.STARTING_BALANCE,
          freeCoinsClaimed: 0,
          balanceGraph: [{ t: Date.now(), b: GAME.STARTING_BALANCE }],
          winStreak: 0,
          pendingWager: 0,
          activeBet: null,
          lastWin: null,
          // Phase 2 reset
          dailyStreak: emptyStreak(),
          totalXP: 0,
          level: 1,
          unlockedCosmetics: ["default"],
          activeCosmetics: { hovercraftId: "default" },
          activeDailyMissions: generateDailyMissions(),
          activeWeeklyMissions: generateWeeklyMissions(),
          completedMissionIds: [],
          shopItems: generateDailyShop(1),
          purchaseHistory: [],
          activeBoosts: [],
          // Phase 3 reset
          friends: generateInitialFriends(5),
          mutedUsers: [],
          // Phase 4 reset
          activeStrategy: null,
          strategyState: null,
          conditionalRules: [],
          activeGameMode: "classic",
          tournaments: generateTournamentSchedule(),
          // Phase 5 reset
          replayData: [],
          tutorialCompleted: false,
          tutorialStep: 0,
          shownContextualTips: [],
          // Provably Fair reset
          clientSeed: "",
          previousServerSeeds: [],
        });
        sound.play("click");
      },

      pushToast: (t) => {
        const id = toastSeq++;
        set((s) => ({ toasts: [{ ...t, id }, ...s.toasts].slice(0, 4) }));
      },

      dismissToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      },

      addFloat: (amount) => {
        const id = floatSeq++;
        set((s) => ({ floats: [...s.floats, { id, amount }] }));
        setTimeout(() => get().removeFloat(id), 1600);
      },

      removeFloat: (id) => {
        set((s) => ({ floats: s.floats.filter((f) => f.id !== id) }));
      },

      // Internal helper kept on the store for easy access from other actions.
      // (Prefixed with `_` to signal it is not part of the public API; do
      // not call from components — only from other store actions that need
      // to re-evaluate achievements after a state change.)
      _syncAchievements: () => {
        const s = get();
        const { list, newly } = computeAchievements(s);
        if (newly.length === 0) return;
        set({ achievements: list });
        newly.forEach((id) => {
          const a = ACHIEVEMENTS.find((x) => x.id === id);
          if (a) {
            sound.play("achievement");
            get().pushToast({
              kind: "achievement",
              title: "Achievement Unlocked",
              subtitle: a.name,
              icon: a.icon,
            });
            // Phase 2: Award XP for achievement
            get().addXP(xpForAction("achievement"));
            // Phase 2: Unlock cosmetics that require achievement count
            const cosmeticState = {
              level: get().level,
              achievements: list,
              coins: get().balance,
              missionsCompleted: get().completedMissionIds.length,
            };
            for (const c of COSMETICS) {
              if (isCosmeticUnlocked(c, cosmeticState) && !get().unlockedCosmetics.includes(c.id)) {
                get().unlockCosmetic(c.id);
              }
            }
          }
        });
      },

      // ============= PHASE 2: ECONOMY ACTIONS =============

      refreshMissions: () => {
        const today = dayKey();
        set({
          activeDailyMissions: generateDailyMissions(),
          activeWeeklyMissions: generateWeeklyMissions(),
          lastMissionRefresh: today,
        });
        sound.play("click");
      },

      claimMission: (missionId) => {
        const s = get();
        const mission = [...s.activeDailyMissions, ...s.activeWeeklyMissions].find(
          (m) => m.id === missionId && m.completed && !m.claimed
        );
        if (!mission) return;
        set((st) => ({
          balance: st.balance + mission.reward,
          balanceGraph: pushPoint(st.balance + mission.reward, st.balanceGraph),
          completedMissionIds: [...st.completedMissionIds, missionId],
          activeDailyMissions: st.activeDailyMissions.map((m) =>
            m.id === missionId ? { ...m, claimed: true } : m
          ),
          activeWeeklyMissions: st.activeWeeklyMissions.map((m) =>
            m.id === missionId ? { ...m, claimed: true } : m
          ),
        }));
        get().addFloat(mission.reward);
        sound.play("coin");
        get().addXP(mission.reward / 10);
        get().pushToast({
          kind: "win",
          title: "Mission Complete!",
          subtitle: `+${mission.reward.toLocaleString()} coins`,
          icon: "🎯",
        });
      },

      checkMissionProgress: () => {
        const s = get();
        const ctx = {
          stats: s.stats,
          winStreak: s.winStreak,
          netProfit: s.stats.totalReturned - s.stats.totalWagered,
        };
        const updatedDaily = s.activeDailyMissions.map((m) =>
          evaluateMissionProgress(m, ctx)
        );
        const updatedWeekly = s.activeWeeklyMissions.map((m) =>
          evaluateMissionProgress(m, ctx)
        );
        // Notify newly completed
        const newlyCompleted = [
          ...updatedDaily.filter((m) => m.completed && !s.activeDailyMissions.find((om) => om.id === m.id)?.completed),
          ...updatedWeekly.filter((m) => m.completed && !s.activeWeeklyMissions.find((om) => om.id === m.id)?.completed),
        ];
        set({ activeDailyMissions: updatedDaily, activeWeeklyMissions: updatedWeekly });
        newlyCompleted.forEach((m) => {
          get().pushToast({
            kind: "info",
            title: "Mission Complete!",
            subtitle: `${m.description} — claim your reward!`,
            icon: "🎯",
          });
          sound.play("achievement");
        });
      },

      addXP: (amount) => {
        const s = get();
        const newTotal = s.totalXP + amount;
        const newLevel = calculateLevel(newTotal);
        const leveledUp = newLevel > s.level;
        set({ totalXP: newTotal, level: newLevel });
        if (leveledUp) {
          sound.play("achievement");
          const { title, icon } = getLevelTitle(newLevel);
          get().pushToast({
            kind: "achievement",
            title: `Level Up! → ${newLevel}`,
            subtitle: `${title} ${icon} · +${1000 * newLevel} coins bonus`,
            icon: icon,
          });
          // Level-up coin bonus
          set((st) => ({
            balance: st.balance + 1000 * newLevel,
            balanceGraph: pushPoint(st.balance + 1000 * newLevel, st.balanceGraph),
          }));
          // Unlock cosmetics for new level
          const cosmeticState = {
            level: newLevel,
            achievements: s.achievements,
            coins: get().balance,
            missionsCompleted: s.completedMissionIds.length,
          };
          for (const c of COSMETICS) {
            if (isCosmeticUnlocked(c, cosmeticState) && !get().unlockedCosmetics.includes(c.id)) {
              get().unlockCosmetic(c.id);
            }
          }
          // Refresh shop with new level
          set({ shopItems: generateDailyShop(newLevel), lastShopDate: dayKey() });
          monitoring.breadcrumb("level", "level_up", { level: newLevel, title });
        }
      },

      equipCosmetic: (cosmeticId) => {
        // Check if the cosmetic is unlocked — either it's in the
        // unlockedCosmetics array, OR it meets the unlock requirement
        // (level/achievement/coins/missions). The array may not include
        // cosmetics that were auto-unlocked by reaching a level but never
        // explicitly added by the _syncAchievements path.
        const s = get();
        const cosmetic = getCosmeticById(cosmeticId);
        if (!cosmetic) return;
        const unlockState = {
          level: s.level,
          achievements: s.achievements,
          coins: s.balance,
          missionsCompleted: s.completedMissionIds.length,
        };
        const isUnlocked = s.unlockedCosmetics.includes(cosmeticId) ||
          isCosmeticUnlocked(cosmetic, unlockState);
        if (!isUnlocked) return;
        // Auto-add to unlockedCosmetics if it wasn't there (keeps the array
        // in sync with the actual unlock state).
        if (!s.unlockedCosmetics.includes(cosmeticId)) {
          set((st) => ({ unlockedCosmetics: [...st.unlockedCosmetics, cosmeticId] }));
        }
        set({ activeCosmetics: { hovercraftId: cosmeticId } });
        sound.play("click");
      },

      unlockCosmetic: (cosmeticId) => {
        if (get().unlockedCosmetics.includes(cosmeticId)) return;
        set((s) => ({ unlockedCosmetics: [...s.unlockedCosmetics, cosmeticId] }));
        const c = getCosmeticById(cosmeticId);
        if (c) {
          get().pushToast({
            kind: "achievement",
            title: "Cosmetic Unlocked!",
            subtitle: `${c.name} (${c.rarity})`,
            icon: "🎨",
          });
        }
      },

      refreshShop: () => {
        set({
          shopItems: generateDailyShop(get().level),
          lastShopDate: dayKey(),
        });
        sound.play("click");
      },

      purchaseShopItem: (itemId) => {
        const s = get();
        const item = s.shopItems.find((i) => i.id === itemId);
        if (!item) return;
        const owned = s.purchaseHistory.map((p) => p.itemId);
        const validation = validatePurchase(item, s.balance, owned);
        if (!validation.ok) {
          get().pushToast({
            kind: "info",
            title: "Purchase failed",
            subtitle: validation.error,
            icon: "❌",
          });
          return;
        }
        set((st) => ({
          balance: st.balance - item.price,
          balanceGraph: pushPoint(st.balance - item.price, st.balanceGraph),
          purchaseHistory: [
            { itemId: item.id, date: dayKey(), price: item.price },
            ...st.purchaseHistory,
          ].slice(0, 100),
          shopItems: st.shopItems.map((i) =>
            i.id === itemId && i.limited ? { ...i, quantity: Math.max(0, (i.quantity ?? 0) - 1) } : i
          ),
        }));
        // Apply item effects
        if (item.type === "cosmetic" && item.cosmeticId) {
          get().unlockCosmetic(item.cosmeticId);
          get().equipCosmetic(item.cosmeticId);
        } else if (item.type === "boost" && item.effect && item.durationMs) {
          set((st) => ({
            activeBoosts: [
              ...st.activeBoosts,
              { effect: item.effect!, expiresAt: Date.now() + item.durationMs! },
            ],
          }));
        }
        sound.play("coin");
        get().pushToast({
          kind: "win",
          title: "Purchase Successful!",
          subtitle: item.name,
          icon: "🛍️",
        });
        monitoring.breadcrumb("economy", "purchase", { itemId, price: item.price });
      },

      getStreakInfo: () => {
        const s = get().dailyStreak;
        return {
          currentStreak: s.currentStreak,
          longestStreak: s.longestStreak,
          multiplier: s.streakMultiplier,
        };
      },

      // ============= PHASE 3: SOCIAL ACTIONS =============

      addFriend: () => {
        // Imported lazily to avoid circular dep
        import("@/lib/friends").then(({ generateFriend }) => {
          const friend = generateFriend();
          set((s) => ({ friends: [friend, ...s.friends].slice(0, 50) }));
          sound.play("click");
          get().pushToast({
            kind: "info",
            title: "Friend added!",
            subtitle: friend.name,
            icon: "👥",
          });
        });
      },

      removeFriend: (friendId) => {
        set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) }));
        sound.play("click");
      },

      setDisplayName: (name) => {
        const trimmed = name.trim().slice(0, 20);
        if (trimmed) set({ displayName: trimmed });
      },

      muteUser: (username) => {
        set((s) => ({ mutedUsers: [...new Set([...s.mutedUsers, username])] }));
      },

      unmuteUser: (username) => {
        set((s) => ({ mutedUsers: s.mutedUsers.filter((u) => u !== username) }));
      },

      reactToMessage: (messageId, emoji) => {
        set((s) => ({
          chat: s.chat.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = { ...m.reactions };
            reactions[emoji] = (reactions[emoji] ?? 0) + 1;
            return { ...m, reactions };
          }),
        }));
      },

      // ============= PHASE 4: GAME ACTIONS =============

      setStrategy: (strategyId) => {
        if (!strategyId) {
          set({ activeStrategy: null, strategyState: null });
          return;
        }
        const strat = STRATEGY_PRESETS.find((s) => s.id === strategyId);
        if (!strat) return;
        set({
          activeStrategy: strat,
          strategyState: initStrategyState(strat),
          betConfig: { ...get().betConfig, amount: clampBet(strat.config.baseAmount) },
        });
        sound.play("click");
        get().pushToast({
          kind: "info",
          title: "Strategy active",
          subtitle: strat.name,
          icon: "📊",
        });
      },

      updateStrategyConfig: (config) => {
        const strat = get().activeStrategy;
        if (!strat) return;
        set({ activeStrategy: { ...strat, config: { ...strat.config, ...config } } });
      },

      clearStrategy: () => {
        set({ activeStrategy: null, strategyState: null });
        sound.play("click");
      },

      addConditionalRule: (rule) => {
        const id = `rule_${Date.now()}`;
        set((s) => ({
          conditionalRules: [...s.conditionalRules, { ...rule, id }],
        }));
        sound.play("click");
      },

      removeConditionalRule: (ruleId) => {
        set((s) => ({
          conditionalRules: s.conditionalRules.filter((r) => r.id !== ruleId),
        }));
      },

      toggleConditionalRule: (ruleId) => {
        set((s) => ({
          conditionalRules: s.conditionalRules.map((r) =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      setGameMode: (modeId) => {
        const mode = getModeById(modeId);
        set({ activeGameMode: mode.id });
        sound.play("click");
        get().pushToast({
          kind: "info",
          title: "Game mode",
          subtitle: mode.name,
          icon: "🎮",
        });
      },

      refreshTournaments: () => {
        import("@/lib/tournaments").then(({ generateTournamentSchedule }) => {
          set({ tournaments: generateTournamentSchedule() });
        });
        sound.play("click");
      },

      // ============= PHASE 5: EDUCATIONAL ACTIONS =============

      recordReplay: (data) => {
        set((s) => ({ replayData: [data, ...s.replayData].slice(0, 20) }));
      },

      completeTutorial: () => {
        set({ tutorialCompleted: true });
        // Bonus reward
        set((s) => ({
          balance: s.balance + 5000,
          balanceGraph: pushPoint(s.balance + 5000, s.balanceGraph),
        }));
        get().addFloat(5000);
        sound.play("achievement");
        get().pushToast({
          kind: "win",
          title: "Tutorial Complete!",
          subtitle: "+5,000 coins bonus",
          icon: "🎓",
        });
      },

      setTutorialStep: (step) => {
        set({ tutorialStep: step });
      },

      resetTutorial: () => {
        set({ tutorialCompleted: false, tutorialStep: 0, shownContextualTips: [] });
      },

      toggleContextualTips: () => {
        set((s) => ({ contextualTipsEnabled: !s.contextualTipsEnabled }));
        sound.play("click");
      },

      markContextualTipShown: (tipId) => {
        set((s) => ({
          shownContextualTips: [...new Set([...s.shownContextualTips, tipId])],
        }));
      },

      // ============= PHASE 6: UI/UX ACTIONS =============

      setTheme: (themeId) => {
        set({ activeTheme: themeId });
        applyTheme(themeId);
        sound.play("click");
      },

      setKonami: (v) => {
        set({ konamiActivated: v });
        if (v) {
          sound.play("win");
          get().pushToast({
            kind: "info",
            title: "🎉 Party Mode Activated!",
            subtitle: "Konami code unlocked — extra effects enabled",
            icon: "🎊",
          });
        }
      },

      // ============= PHASE 8: SECURITY ACTIONS =============

      recordIntegrity: (checksum) => {
        set((s) => ({
          integrityRecords: [
            ...s.integrityRecords.slice(-9),
            { checksum, ts: Date.now() },
          ],
        }));
      },

      // ============= PHASE 10: EVENTS ACTIONS =============

      setActiveEvent: (eventId) => {
        set({ activeEvent: eventId });
      },

      markEventSeen: (eventId) => {
        set((s) => ({
          seenEventIds: [...new Set([...s.seenEventIds, eventId])],
        }));
      },

      // ============= PROVABLY FAIR ACTIONS (RNG Overhaul) =============

      setClientSeed: (seed) => {
        const trimmed = seed.trim().slice(0, 64) || generateClientSeed();
        set({ clientSeed: trimmed });
        // Force engine to rotate server seed with the new client seed
        engine.setClientSeed(trimmed);
        sound.play("click");
      },

      rotateServerSeed: () => {
        engine.rotateServerSeed();
        sound.play("click");
      },

      onSeedEpochEnd: (epoch) => {
        // Save the revealed server seed for verification
        set((s) => ({
          previousServerSeeds: [
            {
              seed: epoch.serverSeed,
              hash: epoch.serverSeedHash,
              nonceRange: [0, epoch.nonce] as [number, number],
              rounds: epoch.nonce,
              revealedAt: Date.now(),
            },
            ...s.previousServerSeeds,
          ].slice(0, 10),
        }));
      },

      getProvablyFairState: () => {
        const epochInfo = engine.getEpochInfo();
        return {
          serverSeedHash: epochInfo?.hash ?? "",
          clientSeed: engine.getClientSeed(),
          nonce: epochInfo?.nonce ?? 0,
          previousSeeds: get().previousServerSeeds.map((s) => ({
            seed: s.seed,
            hash: s.hash,
            nonceRange: s.nonceRange,
            rounds: s.rounds,
          })),
        };
      },
    }),
    {
      name: GAME.STORAGE_KEY,
      version: 4,
      // Migration: v1→v2 pendingWager. v2→v3 Phase 2-10 state. v3→v4 adds
      // provably-fair seed system (clientSeed, previousServerSeeds).
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const p = persisted as Record<string, unknown>;
        if (version < 2 && !("pendingWager" in p)) {
          p.pendingWager = 0;
        }
        if (version < 3) {
          if (!("dailyStreak" in p)) p.dailyStreak = { currentStreak: 0, longestStreak: 0, lastClaimDate: null, streakMultiplier: 1, streakHistory: [] };
          if (!("totalXP" in p)) p.totalXP = 0;
          if (!("level" in p)) p.level = 1;
          if (!("unlockedCosmetics" in p)) p.unlockedCosmetics = ["default"];
          if (!("activeCosmetics" in p)) p.activeCosmetics = { hovercraftId: "default" };
          if (!("completedMissionIds" in p)) p.completedMissionIds = [];
          if (!("purchaseHistory" in p)) p.purchaseHistory = [];
          if (!("activeBoosts" in p)) p.activeBoosts = [];
          if (!("mutedUsers" in p)) p.mutedUsers = [];
          if (!("displayName" in p)) p.displayName = "You";
          if (!("activeStrategy" in p)) p.activeStrategy = null;
          if (!("strategyState" in p)) p.strategyState = null;
          if (!("conditionalRules" in p)) p.conditionalRules = [];
          if (!("activeGameMode" in p)) p.activeGameMode = "classic";
          if (!("tutorialCompleted" in p)) p.tutorialCompleted = false;
          if (!("tutorialStep" in p)) p.tutorialStep = 0;
          if (!("contextualTipsEnabled" in p)) p.contextualTipsEnabled = true;
          if (!("shownContextualTips" in p)) p.shownContextualTips = [];
          if (!("activeTheme" in p)) p.activeTheme = "cyber";
          if (!("konamiActivated" in p)) p.konamiActivated = false;
          if (!("integrityRecords" in p)) p.integrityRecords = [];
          if (!("seenEventIds" in p)) p.seenEventIds = [];
        }
        if (version < 4) {
          if (!("clientSeed" in p)) p.clientSeed = "";
          if (!("previousServerSeeds" in p)) p.previousServerSeeds = [];
        }
        return p;
      },
      partialize: (s) => ({
        // Original
        balance: s.balance,
        stats: s.stats,
        history: s.history,
        betHistory: s.betHistory,
        achievements: s.achievements,
        betConfig: s.betConfig,
        settings: s.settings,
        lastDailyClaim: s.lastDailyClaim,
        minBalanceSeen: s.minBalanceSeen,
        freeCoinsClaimed: s.freeCoinsClaimed,
        balanceGraph: s.balanceGraph,
        winStreak: s.winStreak,
        pendingWager: s.pendingWager,
        // Phase 2
        dailyStreak: s.dailyStreak,
        activeDailyMissions: s.activeDailyMissions,
        activeWeeklyMissions: s.activeWeeklyMissions,
        completedMissionIds: s.completedMissionIds,
        lastMissionRefresh: s.lastMissionRefresh,
        totalXP: s.totalXP,
        level: s.level,
        unlockedCosmetics: s.unlockedCosmetics,
        activeCosmetics: s.activeCosmetics,
        shopItems: s.shopItems,
        lastShopDate: s.lastShopDate,
        purchaseHistory: s.purchaseHistory,
        activeBoosts: s.activeBoosts,
        // Phase 3
        friends: s.friends,
        displayName: s.displayName,
        mutedUsers: s.mutedUsers,
        // Phase 4
        activeStrategy: s.activeStrategy,
        strategyState: s.strategyState,
        conditionalRules: s.conditionalRules,
        activeGameMode: s.activeGameMode,
        // Phase 5
        replayData: s.replayData,
        tutorialCompleted: s.tutorialCompleted,
        tutorialStep: s.tutorialStep,
        contextualTipsEnabled: s.contextualTipsEnabled,
        shownContextualTips: s.shownContextualTips,
        // Phase 6
        activeTheme: s.activeTheme,
        konamiActivated: s.konamiActivated,
        // Phase 8
        integrityRecords: s.integrityRecords,
        // Phase 10
        seenEventIds: s.seenEventIds,
        // Provably Fair
        clientSeed: s.clientSeed,
        previousServerSeeds: s.previousServerSeeds,
      }),
    }
  )
);
