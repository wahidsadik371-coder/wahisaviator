// Simulated server-authoritative crash engine.
//
// In a production deployment this logic would live on a Node/Socket.io server
// and broadcast snapshots to clients. Because this app ships as a static
// single-file bundle, the "server" is emulated in-browser.
//
// PROVABLY FAIR SYSTEM:
//   The engine uses a server-seed + client-seed + nonce system matching
//   real crash sites (Bustabit/Stake). The crash point is computed via
//   HMAC-SHA256 and stored in a PRIVATE field (#crashPoint) that DevTools
//   cannot easily read. The crash point is pre-computed asynchronously
//   during the "crashed" phase so it's ready when the next round starts.
//
// ANTI-CHEAT:
//   The crash point is never exposed on getSnapshot() or any public
//   property. Only the commitment hash (SHA-256 of the server seed) is
//   shown before the round. The raw server seed is revealed after the
//   epoch rotates.

import { GAME, multiplierAt } from "@/lib/constants";
import type { EngineSnapshot, Phase } from "@/lib/types";
import {
  computeCrashPoint,
  createSeedEpoch,
  generateClientSeed,
  type ServerSeedEpoch,
} from "@/lib/rng";

type Listener = () => void;

export interface EngineCallbacks {
  onWaitingStart?: (roundId: number, seedHash: string) => void;
  onLaunch?: (roundId: number, seedHash: string) => void;
  onCrash?: (snap: EngineSnapshot) => void;
  onTick?: (snap: EngineSnapshot) => void;
  onCountdownSecond?: (secondsLeft: number) => void;
  onSeedEpochEnd?: (epoch: ServerSeedEpoch) => void;
}

const EMIT_INTERVAL_MS = 48; // ≈20fps for React-facing updates
const SEED_ROTATION_INTERVAL = 100; // rotate server seed every 100 rounds

class CrashEngine {
  // PRIVATE: The crash point is stored here, not exposed publicly.
  // JS private fields (#) are not accessible via DevTools object inspection.
  #crashPoint: number = 1.0;
  #currentEpoch: ServerSeedEpoch | null = null;
  #clientSeed: string = "";
  #nextCrashPoint: number | null = null; // pre-computed for next round

  private readonly snap: EngineSnapshot = {
    phase: "waiting",
    multiplier: 1,
    elapsedMs: 0,
    countdownMs: GAME.COUNTDOWN_MS,
    crashPoint: 1, // NOTE: this is the REVEALED crash point after crash, not pre-round
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
  private callbacksWired = false;

  /** Wire up game-side reactions (bet settlement, sounds, chat, etc.). */
  cb: EngineCallbacks = {};

  constructor() {
    this.snap.roundId = 1;
  }

  getSnapshot(): EngineSnapshot {
    // Return a COPY so callers can't mutate the internal snapshot.
    // The crashPoint field shows the REVEALED crash point (after crash),
    // or 1.0 during waiting/running (the actual crash point is hidden).
    return { ...this.snap };
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

  markCallbacksWired(): void {
    this.callbacksWired = true;
  }

  /**
   * Initialize the engine with a client seed. Called by the store on init.
   * Generates the first server seed epoch if none exists.
   */
  async init(clientSeed: string, existingEpoch?: ServerSeedEpoch | null): Promise<void> {
    this.#clientSeed = clientSeed || generateClientSeed();
    if (existingEpoch) {
      this.#currentEpoch = existingEpoch;
    } else {
      this.#currentEpoch = await createSeedEpoch(this.snap.roundId);
    }
    this.snap.seedHash = this.#currentEpoch.serverSeedHash;
    // Pre-compute the first round's crash point
    await this.preComputeNextCrash();
  }

  /** Get the current client seed (for UI display). */
  getClientSeed(): string {
    return this.#clientSeed;
  }

  /** Set a new client seed (forces new server seed commitment). */
  async setClientSeed(seed: string): Promise<void> {
    this.#clientSeed = seed;
    // Force server seed rotation when client seed changes
    await this.rotateServerSeed();
  }

  /** Get the current server seed hash (commitment, for UI display). */
  getServerSeedHash(): string {
    return this.#currentEpoch?.serverSeedHash ?? "";
  }

  /** Get the current nonce (for UI display). */
  getNonce(): number {
    return this.#currentEpoch?.nonce ?? 0;
  }

  /** Get the current epoch info (for UI, without the raw server seed). */
  getEpochInfo(): { hash: string; nonce: number; startRound: number } | null {
    if (!this.#currentEpoch) return null;
    return {
      hash: this.#currentEpoch.serverSeedHash,
      nonce: this.#currentEpoch.nonce,
      startRound: this.#currentEpoch.startRound,
    };
  }

  /**
   * Rotate the server seed: reveal the current one, generate a new one.
   * Called every SEED_ROTATION_INTERVAL rounds, or when the client seed changes.
   */
  async rotateServerSeed(): Promise<ServerSeedEpoch | null> {
    if (!this.#currentEpoch) return null;
    const oldEpoch = this.#currentEpoch;
    // Generate new epoch
    this.#currentEpoch = await createSeedEpoch(this.snap.roundId);
    this.snap.seedHash = this.#currentEpoch.serverSeedHash;
    // Pre-compute the next crash point with the new epoch
    await this.preComputeNextCrash();
    // Notify the store so it can save the revealed seed
    this.cb.onSeedEpochEnd?.(oldEpoch);
    return oldEpoch;
  }

  /**
   * Pre-compute the crash point for the next round.
   * Called during the "crashed" phase so it's ready when the next round starts.
   */
  private async preComputeNextCrash(): Promise<void> {
    if (!this.#currentEpoch) return;
    const nonce = this.#currentEpoch.nonce;
    this.#nextCrashPoint = await computeCrashPoint(
      this.#currentEpoch.serverSeed,
      this.#clientSeed,
      nonce
    );
  }

  start(): void {
    if (this.raf) return;
    if (!this.callbacksWired) {
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
    this.snap.seedHash = this.#currentEpoch?.serverSeedHash ?? "";
    this.snap.revealedSeed = null;
    // DO NOT set snap.crashPoint here — it stays at the previous revealed
    // value (or 1.0). The actual crash point is in #crashPoint (private).
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
    this.snap.multiplier = this.#crashPoint;
    // NOW reveal the crash point in the snapshot (the round is over)
    this.snap.crashPoint = this.#crashPoint;
    // Reveal the server seed for this round's nonce (provably fair)
    if (this.#currentEpoch) {
      this.snap.revealedSeed = `${this.#currentEpoch.serverSeed}:${this.#clientSeed}:${this.#currentEpoch.nonce}`;
    }
    this.crashedAt = now;
    this.cb.onCrash?.(this.getSnapshot());
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
      this.cb.onTick?.(this.getSnapshot());
      if (this.snap.multiplier >= this.#crashPoint) {
        this.beginCrash(ts);
      } else {
        this.emit();
      }
    } else {
      // crashed — pre-compute the next round's crash point, then wait
      if (ts - this.crashedAt >= GAME.CRASH_HOLD_MS) {
        // Increment nonce
        if (this.#currentEpoch) {
          this.#currentEpoch.nonce++;
          // Check if we need to rotate the server seed
          if (this.#currentEpoch.nonce >= SEED_ROTATION_INTERVAL) {
            this.rotateServerSeed();
          }
        }
        // Use the pre-computed crash point (or compute synchronously as fallback)
        if (this.#nextCrashPoint !== null) {
          this.#crashPoint = this.#nextCrashPoint;
          this.#nextCrashPoint = null;
        }
        // Pre-compute the NEXT next crash point (for the round after this one)
        this.preComputeNextCrash();
        this.snap.roundId += 1;
        this.beginWaiting(ts);
      }
    }

    this.raf = requestAnimationFrame(this.loop);
  };
}

export const engine = new CrashEngine();
export type { Phase };
