// Daily bonus popup. Appears once per day (and once per session) when claimable.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { GAME } from "@/lib/constants";
import { dayKey, formatCoins } from "@/lib/format";
import { useGameStore } from "@/store/useGameStore";
import { Icon } from "./icons";

const SESSION_KEY = "nova-daily-seen";

export function DailyBonusModal() {
  const lastDaily = useGameStore((s) => s.lastDailyClaim);
  const claimDaily = useGameStore((s) => s.claimDaily);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    setSeen(sessionStorage.getItem(SESSION_KEY) === "1");
  }, []);

  const available = dayKey() !== lastDaily;
  const show = available && !seen;

  const close = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setSeen(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-bonus-title"
          aria-describedby="daily-bonus-desc"
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="glass-strong relative w-full max-w-sm overflow-hidden rounded-3xl p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-3xl" />
            <div className="relative">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-violet-600 text-3xl shadow-lg shadow-fuchsia-500/40 ">
                <Icon name="gift" className="h-8 w-8 text-white" />
              </div>
              <h2 id="daily-bonus-title" className="font-sans font-bold text-xl font-black text-white">
                Daily Drop
              </h2>
              <p id="daily-bonus-desc" className="mt-1 text-sm text-white/55">
                Claim your daily coins.
              </p>
              <div className="my-5 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 py-4">
                <div className="font-sans font-bold text-3xl font-black text-fuchsia-300 ">
                  {formatCoins(GAME.DAILY_BONUS_MIN)}–
                  {formatCoins(GAME.DAILY_BONUS_MAX)}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/40">
                  Free coins
                </div>
              </div>
              <button
                onClick={() => {
                  claimDaily();
                  close();
                }}
                className="w-full rounded-2xl bg-gradient-to-br from-fuchsia-400 to-violet-600 py-3 font-sans font-bold font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:opacity-90 active:scale-95"
              >
                Claim
              </button>
              <button
                onClick={close}
                className="mt-2 text-xs text-white/40 hover:text-white/70"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
