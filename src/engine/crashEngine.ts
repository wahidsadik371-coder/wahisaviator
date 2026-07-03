// Simulated server-authoritative crash engine.
//
// In a production deployment this logic would live on a Node/Socket.io server
// and broadcast snapshots to clients. Because this app ships as a static
// single-file bundle, the "server" is emulated in-browser: it generates a
// provably-fair crash point per round, runs the round clock on a 60fps rAF
// loop, and exposes a snapshot. React subscribes via a throttled notifier
// (≈20fps) while the Canvas reads the full-precision values every frame.

import { GAME, multiplierAt } from "@/lib/constants";
import { generateRound, type RoundSeed } from "@/lib/rng";
import type { EngineSnapshot, Phase } from "@/lib/types";

type Listener = () => void;

export interface EngineCallbacks {
  onWaitingStart?: (roundId: number, seedHash: string) => void;
  onLaunch?: (roundId: number, seedHash: string) => void;
  onCrash?: (snap: EngineSnapshot) => void;
  onTick?: (snap: EngineSnapshot) => void;
  onCountdownSecond?: (secondsLeft: number) => void;
}

const EMIT_INTERVAL_MS = 48; // ≈20fps for React-facing updates

class CrashEngine {
  private readonly snap: EngineSnapshot = {
    phase: "waiting",
    multiplier: 1,
    elapsedMs: 0,
    countdownMs: GAME.COUNTDOWN_MS,
    crashPoint: 1,
    roundId: 1,
    seedHash: "",
    revealedSeed: null,
  };

  private readonly listeners = new Set<Listener>();
  private raf = 0;
  private last = 0;
  private lastEmit = 0;
  private lastCountdownSecond = -1;
  private phaseStart = 0;
  private crashedAt = 0;
  private nextRound: RoundSeed;
  /** True once callbacks have been wired by App. Used as a precondition for start(). */
  private callbacksWired = false;

  /** Wire up game-side reactions (bet settlement, sounds, chat, etc.). */
  cb: EngineCallbacks = {};

  constructor() {
    this.nextRound = generateRound();
    this.snap.roundId = 1;
    this.snap.seedHash = this.nextRound.hash;
    this.snap.crashPoint = this.nextRound.crashPoint;
  }

  getSnapshot(): EngineSnapshot {
    return this.snap;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastEmit < EMIT_INTERVAL_MS) return;
    this.lastEmit = now;
    this.listeners.forEach((l) => l());
  }

  /**
   * Mark callbacks as wired. App must call this BEFORE start() so the engine
   * can guarantee onWaitingStart / onLaunch / onCrash will fire on the very
   * first round. This eliminates the original race where start() ran
   * beginWaiting() before cb was assigned.
   */
  markCallbacksWired(): void {
    this.callbacksWired = true;
  }

  /**
   * Start the rAF loop. Refuses to run if callbacks are not yet wired, and
   * is idempotent so StrictMode double-mounts in dev are safe.
   *
   * We deliberately keep the engine rAF loop running even when the tab is
   * hidden — the loop itself is cheap (no rendering, just timer math) and
   * the engine must keep advancing rounds so that returning to the tab
   * does not show a frozen countdown. Canvas-heavy components use the
   * shared useCanvasAnimation hook which DOES pause its own rAF on
   * visibilitychange.
   */
  start(): void {
    if (this.raf) return; // already running
    if (!this.callbacksWired) {
      // Defensive: should never happen because App calls markCallbacksWired()
      // first. If it does, we surface a console warning rather than silently
      // launching a round whose callbacks will never fire.
      console.warn("[CrashEngine] start() called before callbacks were wired.");
      return;
    }
    this.last = performance.now();
    this.beginWaiting(this.last);
    this.raf = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private beginWaiting(now: number): void {
    this.snap.phase = "waiting";
    this.snap.multiplier = 1;
    this.snap.elapsedMs = 0;
    this.snap.countdownMs = GAME.COUNTDOWN_MS;
    this.snap.seedHash = this.nextRound.hash;
    this.snap.crashPoint = this.nextRound.crashPoint;
    this.snap.revealedSeed = null;
    this.phaseStart = now;
    this.lastCountdownSecond = -1;
    this.cb.onWaitingStart?.(this.snap.roundId, this.snap.seedHash);
    this.emit(true);
  }

  private beginRunning(now: number): void {
    this.snap.phase = "running";
    this.snap.multiplier = 1;
    this.snap.elapsedMs = 0;
    this.phaseStart = now;
    this.cb.onLaunch?.(this.snap.roundId, this.snap.seedHash);
    this.emit(true);
  }

  private beginCrash(now: number): void {
    this.snap.phase = "crashed";
    this.snap.multiplier = this.snap.crashPoint;
    this.snap.revealedSeed = this.nextRound.seed;
    this.crashedAt = now;
    this.cb.onCrash?.(this.snap);
    this.emit(true);
  }

  private loop = (ts: number): void => {
    this.last = ts;
    const phaseElapsed = ts - this.phaseStart;
    const phase = this.snap.phase;

    if (phase === "waiting") {
      const remaining = Math.max(0, GAME.COUNTDOWN_MS - phaseElapsed);
      this.snap.countdownMs = remaining;
      const secLeft = Math.ceil(remaining / 1000);
      if (secLeft !== this.lastCountdownSecond && secLeft >= 0) {
        this.lastCountdownSecond = secLeft;
        this.cb.onCountdownSecond?.(secLeft);
      }
      if (remaining <= 0) {
        this.beginRunning(ts);
      } else {
        this.emit();
      }
    } else if (phase === "running") {
      this.snap.elapsedMs = phaseElapsed;
      this.snap.multiplier = multiplierAt(phaseElapsed);
      this.cb.onTick?.(this.snap);
      if (this.snap.multiplier >= this.snap.crashPoint) {
        this.beginCrash(ts);
      } else {
        this.emit();
      }
    } else {
      // crashed — state is static, so we don't spam React with emits.
      if (ts - this.crashedAt >= GAME.CRASH_HOLD_MS) {
        this.snap.roundId += 1;
        this.nextRound = generateRound();
        this.beginWaiting(ts);
      }
    }

    this.raf = requestAnimationFrame(this.loop);
  };
}

export const engine = new CrashEngine();
export type { Phase };
