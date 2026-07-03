// Emote picker — grid of emotes for chat.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { EMOTES, EMOTE_CATEGORIES, getRecentEmotes, pushRecent, searchEmotes } from "@/lib/emotes";
import { Icon } from "./icons";

export function EmotePicker({
  onPick,
  onClose,
}: {
  onPick: (emote: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<typeof EMOTE_CATEGORIES[number]>("reactions");
  const [query, setQuery] = useState("");

  const recent = getRecentEmotes();
  const list = query ? searchEmotes(query) : EMOTES.filter((e) => e.category === category);

  const handlePick = (char: string, id: string) => {
    pushRecent(id);
    onPick(char);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="glass-strong absolute bottom-full left-0 z-30 mb-2 w-72 rounded-2xl p-3"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400/50"
          />
          <button
            onClick={onClose}
            aria-label="Close emote picker"
            className="grid h-7 w-7 place-items-center rounded-lg text-white/40 hover:bg-white/10"
          >
            <Icon name="x" className="h-3 w-3" />
          </button>
        </div>

        {!query && recent.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-[9px] font-semibold uppercase text-white/40">Recent</div>
            <div className="flex flex-wrap gap-1">
              {recent.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handlePick(e.char, e.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-lg hover:bg-white/10"
                  title={e.name}
                >
                  {e.char}
                </button>
              ))}
            </div>
          </div>
        )}

        {!query && (
          <div className="mb-2 flex gap-1">
            {EMOTE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-bold capitalize transition ${
                  category === c ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-white/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="grid max-h-48 grid-cols-7 gap-1 overflow-y-auto nice-scroll">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => handlePick(e.char, e.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-lg hover:bg-white/10"
              title={e.name}
            >
              {e.char}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
