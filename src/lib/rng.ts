// Provably-fair round generation — HMAC-SHA256 based, matching real crash
// sites (Bustabit/Stake/Roobet architecture).
//
// THREE-PART SEED SYSTEM:
//   crash_point = hashToCrashPoint(HMAC-SHA256(serverSeed, clientSeed:nonce))
//
//   - serverSeed: Generated once per "epoch" (every 100 rounds). SHA-256 hash
//     shown as commitment BEFORE any rounds use it. Raw seed revealed AFTER
//     the epoch ends, so players can verify.
//   - clientSeed: Player-provided or auto-generated. Stays constant within an
//     epoch. Player can change it (forces new server seed commitment).
//   - nonce: Integer starting at 0, increments each round, resets on rotation.
//
// This creates a CHAIN — each round uses the same server+client seeds but a
// different nonce. The sequence is deterministic given the seeds, so players
// can verify after the server seed is revealed.
//
// ENTROPY: HMAC-SHA256 produces 256-bit hashes. We extract 52 bits (13 hex
// chars) for the float, giving ~4.5 × 10^15 distinct values (vs the old
// FNV-1a's ~5,281). This eliminates the "repetitive multipliers" problem.
//
// CAP: 1,000,000x (effectively invisible — 0.0000009% hit rate).

const CAP = 1_000_000;

// ============================================================
// HMAC-SHA256 via Web Crypto API (async, cryptographic)
// ============================================================

/** Compute HMAC-SHA256(key, message) and return the digest as hex. */
export async function hmacSha256(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** SHA-256 hash of a string, returned as hex. Used for server seed commitment. */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================
// Crash point derivation (Bustabit formula, 52-bit precision)
// ============================================================

/**
 * Convert an HMAC-SHA256 hex digest to a crash point.
 * Extracts the first 13 hex chars (52 bits) for maximum float precision.
 * Uses the same 0.99/(1-r) formula as Bustabit.
 */
export function hashToCrashPoint(hash: string): number {
  // 13 hex chars = 52 bits. 2^52 = 4,503,599,627,370,496.
  const r = parseInt(hash.slice(0, 13), 16) / 4503599627370496;
  // Bustabit formula: 0.99 / (1 - r). The 0.99 creates the house edge.
  const result = Math.floor((100 * 0.99) / (1 - r)) / 100;
  return Math.max(1.0, Math.min(result, CAP));
}

// ============================================================
// FNV-1a fallback (synchronous, for insecure contexts where Web Crypto
// is unavailable — e.g. HTTP without HTTPS, or very old browsers)
// ============================================================

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Synchronous fallback crash point — used only if Web Crypto is unavailable. */
export function crashFromSeedSync(seed: string): number {
  const h = fnv1a("crash:" + seed);
  if (h % 33 === 0) return 1.0;
  const r = h / 4294967296;
  const result = Math.floor((100 * 0.99) / (1 - r)) / 100;
  return Math.max(1.0, Math.min(result, CAP));
}

/** Synchronous commitment hash fallback. */
export function commitmentHashSync(seed: string): string {
  const parts: string[] = [];
  for (let block = 0; block < 5; block++) {
    parts.push(fnv1a(seed + ":" + block + ":nova").toString(16).padStart(8, "0"));
  }
  return parts.join("").slice(0, 40);
}

// ============================================================
// Seed management
// ============================================================

/** Cryptographically-strong random hex string. */
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a new server seed (32 random bytes = 64 hex chars). */
export function generateServerSeed(): string {
  return randomHex(32);
}

/** Generate a new client seed (8 random bytes = 16 hex chars). */
export function generateClientSeed(): string {
  return randomHex(8);
}

export interface ServerSeedEpoch {
  /** The raw server seed (kept private — not shown in UI until revealed). */
  serverSeed: string;
  /** SHA-256 hash of the server seed (shown as commitment). */
  serverSeedHash: string;
  /** Current nonce within this epoch. */
  nonce: number;
  /** Round ID when this epoch started. */
  startRound: number;
}

export interface RevealedServerSeed {
  seed: string;
  hash: string;
  nonceRange: [number, number];
  rounds: number;
  revealedAt: number;
}

export interface RoundSeed {
  seed: string;
  hash: string;
  crashPoint: number;
}

/**
 * Generate a complete new seed epoch: new server seed + commitment hash.
 * The nonce starts at 0. Client seed is provided separately.
 */
export async function createSeedEpoch(startRound: number): Promise<ServerSeedEpoch> {
  const serverSeed = generateServerSeed();
  const serverSeedHash = await sha256Hex(serverSeed);
  return {
    serverSeed,
    serverSeedHash,
    nonce: 0,
    startRound,
  };
}

/**
 * Compute the crash point for a given server seed, client seed, and nonce.
 * Uses HMAC-SHA256 for cryptographic security.
 */
export async function computeCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const message = `${clientSeed}:${nonce}`;
  const hash = await hmacSha256(serverSeed, message);
  return hashToCrashPoint(hash);
}

/**
 * Verify a past round: given a revealed server seed, client seed, and nonce,
 * recompute the crash point. This is the "provably fair" verification.
 */
export async function verifyRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ crashPoint: number; hash: string }> {
  const message = `${clientSeed}:${nonce}`;
  const hash = await hmacSha256(serverSeed, message);
  return { crashPoint: hashToCrashPoint(hash), hash };
}

// ============================================================
// Legacy compatibility (for old save states)
// ============================================================

/** @deprecated Use computeCrashPoint instead. Kept for backward compat. */
export function crashFromSeed(seed: string): number {
  return crashFromSeedSync(seed);
}

/** @deprecated Use sha256Hex instead. Kept for backward compat. */
export function commitmentHash(seed: string): string {
  return commitmentHashSync(seed);
}

/** @deprecated Use createSeedEpoch instead. Kept for backward compat. */
export function generateRound(): RoundSeed {
  const seed = randomHex(16);
  return {
    seed,
    hash: commitmentHashSync(seed),
    crashPoint: crashFromSeedSync(seed),
  };
}
