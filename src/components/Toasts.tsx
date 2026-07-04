// Toast notifications (wins, achievements, info) + floating "+amount" coins.

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { formatCoins } from "@/lib/format";
import { useGameStore, type Toast } from "@/store/useGameStore";

const KIND_STYLE: Record<Toast["kind"], string> = {
  win: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  achievement: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  info: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  daily: "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200",
};

function ToastCard({ t, onDone }: { t: Toast; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 3800);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`pointer-events-auto flex w-72 items-center gap-3 rounded-xl border px-3 py-2.5 backdrop-blur-xl ${KIND_STYLE[t.kind]}`}
    >
      <span className="text-2xl">{t.icon ?? "🔔"}</span>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold">{t.title}</div>
        {t.subtitle && (
          <div className="truncate text-xs opacity-80">{t.subtitle}</div>
        )}
      </div>
      <button
        onClick={onDone}
        className="ml-auto text-white/40 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}

export function Toasts() {
  const toasts = useGameStore((s) => s.toasts);
  const dismiss = useGameStore((s) => s.dismissToast);
  const floats = useGameStore((s) => s.floats);

  return (
    <>
      <div className="pointer-events-none fixed right-3 top-16 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastCard key={t.id} t={t} onDone={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      <div className="pointer-events-none fixed left-1/2 top-24 z-50">
        <AnimatePresence>
          {floats.map((f) => (
            <div
              key={f.id}
              className="animate-float-up absolute left-0 -translate-x-1/2 whitespace-nowrap font-sans font-bold text-3xl font-black text-lime-300 "
            >
              +{formatCoins(f.amount)} 🪙
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
