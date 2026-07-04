// Shop panel — daily rotating items purchasable with coins.
//
// FIX: Previously `useGameStore((s) => s.purchaseHistory.map((p) => p.itemId))`
// created a new array on every render → Zustand saw a "change" every time →
// infinite re-render loop → "Maximum update depth exceeded" → black screen.
// Now we select the raw array (stable reference) and derive with useMemo.

import { useMemo } from "react";
import { motion } from "framer-motion";

import { useGameStore } from "@/store/useGameStore";
import { formatCoins } from "@/lib/format";
import { Icon } from "./icons";

export function ShopPanel() {
  const items = useGameStore((s) => s.shopItems);
  const balance = useGameStore((s) => s.balance);
  // Select the raw array — stable reference, only changes on actual update.
  const purchaseHistory = useGameStore((s) => s.purchaseHistory);
  const purchase = useGameStore((s) => s.purchaseShopItem);
  const refresh = useGameStore((s) => s.refreshShop);

  // Derive owned item IDs with useMemo so it only recomputes when
  // purchaseHistory actually changes (new purchase pushed).
  const owned = useMemo(
    () => new Set(purchaseHistory.map((p) => p.itemId)),
    [purchaseHistory]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Balance</div>
          <div className="font-mono text-base font-bold text-white glow-cyan">{formatCoins(balance)}</div>
        </div>
        <button
          onClick={refresh}
          className="tap-target rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/20"
        >
          <Icon name="reset" className="mr-1 inline h-3 w-3" />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.length === 0 && (
          <div className="col-span-2 py-8 text-center text-sm text-white/30">
            Shop refreshes daily. Come back tomorrow!
          </div>
        )}
        {items.map((item) => {
          const isOwned = owned.has(item.id);
          const canAfford = balance >= item.price;
          const soldOut = item.limited && (item.quantity ?? 0) <= 0;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl border p-3 ${
                isOwned ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="mb-1 flex items-center gap-1">
                {item.limited && (
                  <span className="rounded bg-rose-400/20 px-1 text-xs font-bold uppercase text-rose-300">
                    Limited
                  </span>
                )}
                <span className="text-xs uppercase text-white/40">{item.type}</span>
              </div>
              <div className="text-xs font-bold text-white/90">{item.name}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`font-mono text-sm font-bold ${canAfford ? "text-amber-300" : "text-rose-400"}`}>
                  {formatCoins(item.price)}
                </span>
                {isOwned ? (
                  <span className="text-xs text-emerald-300">Owned ✓</span>
                ) : (
                  <button
                    onClick={() => purchase(item.id)}
                    disabled={!canAfford || soldOut}
                    className="tap-target rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-30"
                  >
                    {soldOut ? "Sold out" : "Buy"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
