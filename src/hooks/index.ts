// Reusable React hooks.

import { useEffect, useReducer, useRef, useState } from "react";

import { engine } from "@/engine/crashEngine";
import type { EngineSnapshot } from "@/lib/types";

export { useCanvasAnimation, ParticlePool } from "./useCanvasAnimation";
export type { CanvasSize } from "./useCanvasAnimation";
export { useIsMobile, useViewportSize, useSafeAreaInsets } from "./useResponsive";
export type { SafeAreaInsets } from "./useResponsive";

/** Subscribe to the engine's throttled snapshot updates. */
export function useEngineState(): EngineSnapshot {
  const [, force] = useReducer((c: number) => (c + 1) & 0xffff, 0);
  useEffect(() => engine.subscribe(force), []);
  // Return a shallow clone so React's reconciler always sees a fresh object
  // reference and never skips a render because the engine mutated the
  // snapshot in place.
  return { ...engine.getSnapshot() };
}

/** Stable setInterval that always calls the latest callback. */
export function useInterval(callback: () => void, ms: number): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** Smoothly animate a displayed number toward its target value. */
export function useAnimatedNumber(target: number, duration = 700): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  displayRef.current = display;
  const rafRef = useRef(0);
  const fromRef = useRef(target);
  const startRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = displayRef.current;
    startRef.current = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
