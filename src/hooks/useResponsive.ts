// Mobile / touch / viewport detection hooks.
//
// - useIsMobile: true when viewport width < `lg` breakpoint (1024px by default
//   in Tailwind). Uses matchMedia so it updates live without polling.
// - useViewportSize: returns { width, height } in CSS pixels; useful for
//   canvas components that need to recompute layout on rotate.
// - useSafeAreaInsets: returns the env(safe-area-inset-*) values so
//   bottom-sheet UI can avoid the iOS home indicator and notches.
//
// All three are SSR-safe (return defaults during render, then sync to real
// values in an effect — React 19 will reconcile without a flash because the
// initial server render is for desktop defaults and the mobile re-render
// happens before paint on devices that need it).

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return size;
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Reads the env(safe-area-inset-*) values from the document. These are
 * populated by iOS Safari when the viewport meta includes
 * `viewport-fit=cover`. Returns zeros on browsers that don't support it.
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  useEffect(() => {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;top:env(safe-area-inset-top);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);left:env(safe-area-inset-left);pointer-events:none;visibility:hidden;";
    document.body.appendChild(div);
    const read = () => {
      const cs = getComputedStyle(div);
      setInsets({
        top: parseFloat(cs.top) || 0,
        right: parseFloat(cs.right) || 0,
        bottom: parseFloat(cs.bottom) || 0,
        left: parseFloat(cs.left) || 0,
      });
    };
    read();
    window.addEventListener("orientationchange", read, { passive: true });
    return () => {
      window.removeEventListener("orientationchange", read);
      document.body.removeChild(div);
    };
  }, []);
  return insets;
}
