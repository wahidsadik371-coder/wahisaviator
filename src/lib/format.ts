// Small formatting + math helpers used across the UI.

export function formatCoins(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toLocaleString("en-US");
}

export function formatCoinsFull(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatMult(m: number): string {
  return m.toFixed(2) + "x";
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  return Math.floor(h / 24) + "d";
}

/** Deterministic-ish pseudo-random in [0,1) seeded by a number. */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Calendar-day key in the user's local timezone — used by the daily bonus
 * flow and the TopBar daily-availability check. Centralised here so the
 * three previous duplicates (TopBar, DailyBonusModal, useGameStore) all
 * share one definition.
 *
 * Format: "YYYY-M-D" (no zero-padding) — intentionally compact for use
 * as a localStorage value.
 */
export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
