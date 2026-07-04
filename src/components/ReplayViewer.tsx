// Replay viewer — list of recent rounds with crash point + replay button.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { formatMult, timeAgo } from "@/lib/format";
import { Icon } from "./icons";

export function ReplayViewer() {
  const replays = useGameStore((s) => s.replayData);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {replays.length === 0 && (
        <div className="grid place-items-center py-8 text-center text-sm text-white/30">
          <Icon name="clock" className="mb-2 h-8 w-8 text-white/20" />
          No replays yet. Play some rounds!
        </div>
      )}
      {replays.map((r, i) => (
        <div key={r.roundId} className="rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
          <button
            onClick={() => setSelected(selected === i ? null : i)}
            className="flex w-full items-center gap-2 text-left"
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
              r.crashPoint >= 2 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
            }`}>
              <Icon name="play" className="h-3 w-3" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs text-white/70">Round #{r.roundId}</div>
              <div className="text-xs text-white/30">{timeAgo(r.ts)} ago</div>
            </div>
            <span className={`font-mono text-sm font-bold ${
              r.crashPoint >= 2 ? "text-emerald-300" : "text-rose-300"
            }`}>
              {formatMult(r.crashPoint)}
            </span>
          </button>
          <AnimatePresence>
            {selected === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-lg bg-black/20 p-2 text-xs text-white/60">
                  <div>Crashed at: <span className="font-mono text-rose-300">{formatMult(r.crashPoint)}</span></div>
                  <div>Bets recorded: {r.bets.length}</div>
                  <div className="mt-1 text-xs text-white/40">
                    Full frame-by-frame replay coming in a future update.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
