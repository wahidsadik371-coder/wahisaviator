// LRU cache + memoize utilities for hot paths.
// Avoids per-frame allocations and recomputations.

export class LRUCache<K, V> {
  private readonly map = new Map<K, V>();
  constructor(private readonly max: number = 100) {}

  get(k: K): V | undefined {
    const v = this.map.get(k);
    if (v === undefined) return undefined;
    // Move to most-recent position.
    this.map.delete(k);
    this.map.set(k, v);
    return v;
  }

  set(k: K, v: V): void {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(k, v);
  }

  has(k: K): boolean { return this.map.has(k); }
  clear(): void { this.map.clear(); }
  get size(): number { return this.map.size; }
}

/** Memoize a function with a TTL (ms). Cache key is JSON.stringify(args). */
export function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  opts: { ttlMs?: number; maxSize?: number } = {}
): (...args: Args) => R {
  const { ttlMs = 60_000, maxSize = 100 } = opts;
  const cache = new LRUCache<string, { value: R; expires: number }>(maxSize);
  return (...args: Args): R => {
    const key = JSON.stringify(args);
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    const value = fn(...args);
    cache.set(key, { value, expires: Date.now() + ttlMs });
    return value;
  };
}
