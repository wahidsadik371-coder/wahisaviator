// Friends panel — list of simulated friends with online status + stats.

import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { Icon } from "./icons";

export function FriendsPanel() {
  const friends = useGameStore((s) => s.friends);
  const addFriend = useGameStore((s) => s.addFriend);
  const removeFriend = useGameStore((s) => s.removeFriend);

  const sorted = [...friends].sort((a, b) => Number(b.online) - Number(a.online));
  const onlineCount = friends.filter((f) => f.online).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Friends online</div>
          <div className="font-mono text-sm font-bold text-emerald-300">
            {onlineCount} / {friends.length}
          </div>
        </div>
        <button
          onClick={addFriend}
          className="tap-target rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
        >
          <Icon name="plus" className="mr-1 inline h-3 w-3" />
          Add
        </button>
      </div>
      <div className="space-y-1.5">
        {sorted.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${f.online ? "bg-emerald-400" : "bg-white/20"}`}
              title={f.online ? "Online" : "Offline"}
            />
            <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-white/85">{f.name}</div>
              <div className="text-xs text-white/40">
                Lvl {f.stats.level} · {f.stats.wins} wins · best {f.stats.bestMultiplier.toFixed(2)}x
              </div>
            </div>
            <button
              onClick={() => removeFriend(f.id)}
              aria-label={`Remove ${f.name}`}
              className="tap-target grid h-7 w-7 place-items-center rounded-lg text-white/30 hover:bg-rose-500/20 hover:text-rose-300"
            >
              <Icon name="x" className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
