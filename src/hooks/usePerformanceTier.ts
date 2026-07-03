import { useEffect, useState } from "react";
import { getDeviceCapabilities, type PerformanceTier } from "@/utils/performance";

/** Live-reactive performance tier. Updates if the user toggles reduced-motion. */
export function usePerformanceTier(): {
  tier: PerformanceTier;
  isMobile: boolean;
  prefersReducedMotion: boolean;
} {
  const caps = getDeviceCapabilities();
  const [tier, setTier] = useState<PerformanceTier>(caps.tier);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setTier(mql.matches ? "low" : caps.tier);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [caps.tier]);

  return { tier, isMobile: caps.isMobile, prefersReducedMotion: caps.prefersReducedMotion };
}
