// Reusable framer-motion variants + spring presets.

import type { Transition, Variants } from "framer-motion";

export const springPresets = {
  soft: { type: "spring", stiffness: 200, damping: 26 } as Transition,
  snappy: { type: "spring", stiffness: 320, damping: 32 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 18 } as Transition,
  slow: { type: "spring", stiffness: 120, damping: 20 } as Transition,
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export const pulseGlow: Variants = {
  idle: { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0)" },
  active: {
    boxShadow: [
      "0 0 0 0 rgba(34, 211, 238, 0.6)",
      "0 0 20px 6px rgba(34, 211, 238, 0.3)",
      "0 0 0 0 rgba(34, 211, 238, 0)",
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
};
