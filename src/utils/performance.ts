// Device capability detection + adaptive performance tier.
// Auto-degrades particle/shadow load on low-end devices.

export type PerformanceTier = "high" | "medium" | "low";

interface DeviceCapabilities {
  cores: number;
  memory: number; // GB, 0 if unknown
  isMobile: boolean;
  tier: PerformanceTier;
  prefersReducedMotion: boolean;
}

function detect(): DeviceCapabilities {
  if (typeof navigator === "undefined") {
    return { cores: 8, memory: 8, isMobile: false, tier: "high", prefersReducedMotion: false };
  }
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  let tier: PerformanceTier = "high";
  if (isMobile || cores <= 4 || memory <= 2) tier = "medium";
  if (isMobile && (cores <= 2 || memory <= 1)) tier = "low";
  if (prefersReducedMotion) tier = "low";

  return { cores, memory, isMobile, tier, prefersReducedMotion };
}

let _caps: DeviceCapabilities | null = null;
export function getDeviceCapabilities(): DeviceCapabilities {
  if (!_caps) _caps = detect();
  return _caps;
}

export function getPerformanceTier(): PerformanceTier {
  return getDeviceCapabilities().tier;
}
