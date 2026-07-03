// Lightweight boot loader shown for the first ~350ms after mount so the
// user never sees a blank arena while fonts, Web Audio context, and the
// first engine snapshot settle. Purely cosmetic — no business logic.

import { motion } from "framer-motion";

import { APP } from "@/lib/constants";
import { NovaLogo } from "./icons";

export function AppBootLoader() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`${APP.NAME} is loading`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#05060f]"
    >
      <div className="flex flex-col items-center gap-4">
        <NovaLogo className="h-16 w-16 animate-spin-slow drop-glow-cyan" />
        <div className="font-display text-lg font-black tracking-widest text-white glow-cyan">
          {APP.NAME.toUpperCase()}
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
          Initializing engine…
        </div>
      </div>
    </motion.div>
  );
}
