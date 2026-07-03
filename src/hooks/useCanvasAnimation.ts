// Shared hook for canvas-based animation components.
//
// Consolidates the cleanup patterns that CrashArena, Background, and Confetti
// each reimplemented (with subtle bugs). Provides:
//
//   1. An AbortController that survives StrictMode double-mount in dev —
//      every listener is registered with { signal } so a single
//      controller.abort() tears them all down atomically.
//   2. A ResizeObserver (preferred) or window resize fallback, debounced via
//      requestAnimationFrame so we do not thrash on continuous drag-resize.
//   3. A visibilitychange listener that pauses the rAF loop entirely when
//      the tab is hidden (saves CPU/battery on mobile).
//   4. A guarded rAF driver that auto-cancels on unmount.
//
// The hook is intentionally framework-light: callers receive a stable canvas
// ref, a 2D context (or null), and a width/height in CSS pixels. They then
// register their per-frame draw callback with `setFrame`.

import { useCallback, useEffect, useRef, useState } from "react";

export interface CanvasSize {
  w: number;
  h: number;
  dpr: number;
}

interface UseCanvasOptions {
  /**
   * If true (default), the canvas backing store is sized to devicePixelRatio
   * and the context is pre-scaled. Set to false for full-viewport fixed-size
   * canvases (e.g. Confetti) where DPR scaling is not desired.
   */
  scaleToDpr?: boolean;
  /**
   * Cap on devicePixelRatio. Defaults to 2 — beyond that the extra pixels
   * are not perceptible but cost fill-rate.
   */
  maxDpr?: number;
  /**
   * If true, the rAF loop is paused entirely when document.visibilityState
   * becomes "hidden". Defaults to true.
   */
  pauseWhenHidden?: boolean;
  /**
   * If true, attach a ResizeObserver to the canvas element itself. Set to
   * false for full-viewport fixed canvases that should track window size
   * instead. Defaults to true.
   */
  observeCanvas?: boolean;
}

export function useCanvasAnimation<TCtx extends CanvasRenderingContext2D>(
  opts: UseCanvasOptions = {}
) {
  const {
    scaleToDpr = true,
    maxDpr = 2,
    pauseWhenHidden = true,
    observeCanvas = true,
  } = opts;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<TCtx | null>(null);
  const [size, setSize] = useState<CanvasSize>({ w: 0, h: 0, dpr: 1 });
  const frameRef = useRef<((dt: number, ts: number) => void) | null>(null);
  const visibleRef = useRef(true);

  /** Register the per-frame draw callback. Stable across renders. */
  const setFrame = useCallback((fn: ((dt: number, ts: number) => void) | null) => {
    frameRef.current = fn;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c2d = canvas.getContext("2d") as TCtx | null;
    if (!c2d) {
      // eslint-disable-next-line no-console
      console.warn("[useCanvasAnimation] 2D context unavailable.");
      return;
    }
    setCtx(c2d);

    // Single source of truth for cleanup — abort fires once on unmount and
    // atomically removes every listener registered with this signal.
    const controller = new AbortController();
    const { signal } = controller;

    const computeSize = () => {
      let w: number;
      let h: number;
      if (observeCanvas) {
        const rect = canvas.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
      } else {
        w = window.innerWidth;
        h = window.innerHeight;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      if (scaleToDpr) {
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        canvas.width = Math.max(1, Math.floor(w));
        canvas.height = Math.max(1, Math.floor(h));
      }
      setSize({ w, h, dpr });
    };

    // Initial size, then observe. Debounce resize via rAF so a drag-resize
    // does not re-create the backing store 60 times per second.
    computeSize();
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(computeSize);
    };

    if (observeCanvas) {
      const ro = new ResizeObserver(onResize);
      ro.observe(canvas);
      signal.addEventListener("abort", () => ro.disconnect());
    } else {
      window.addEventListener("resize", onResize, { signal });
    }

    // Visibility-aware rAF loop.
    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    if (pauseWhenHidden) {
      document.addEventListener("visibilitychange", onVisibility, { signal });
      visibleRef.current = document.visibilityState === "visible";
    }

    let raf = 0;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = Math.min(64, ts - last);
      last = ts;
      // Always advance the clock so dt does not spike after the tab regains
      // focus, but skip the per-frame work if paused.
      if (!pauseWhenHidden || visibleRef.current) {
        frameRef.current?.(dt, ts);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Cleanup: abort all listeners + cancel rAF in one shot.
    return () => {
      controller.abort();
      if (raf) cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      frameRef.current = null;
    };
  }, [scaleToDpr, maxDpr, pauseWhenHidden, observeCanvas]);

  return { canvasRef, ctx, size, setFrame };
}

/**
 * Minimal object pool — avoids per-frame allocation of particle objects in
 * hot canvas loops. Objects are returned to the pool in `release()` and
 * reused in `acquire()` without GC churn.
 */
export class ParticlePool<T> {
  private free: T[] = [];
  private readonly make: () => T;
  private readonly reset: (obj: T) => void;

  constructor(make: () => T, reset: (obj: T) => void, prewarm = 0) {
    this.make = make;
    this.reset = reset;
    for (let i = 0; i < prewarm; i++) this.free.push(make());
  }

  acquire(): T {
    return this.free.pop() ?? this.make();
  }

  release(obj: T): void {
    this.reset(obj);
    this.free.push(obj);
  }

  releaseAll(arr: T[]): void {
    for (const o of arr) this.release(o);
    arr.length = 0;
  }
}
