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
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#05060f]"
    >
      <div className="flex flex-col items-center gap-3">
        <NovaLogo className="h-12 w-12" />
        <div className="font-sans text-sm font-bold tracking-wide text-white">
          {APP.NAME.toUpperCase()}
        </div>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" />
        </div>
      </div>
    </motion.div>
  );
}
