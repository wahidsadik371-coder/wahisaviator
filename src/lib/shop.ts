// Virtual shop — daily rotating items purchasable with coins or XP.
// Items are cosmetics + boosts (XP multiplier, luck charm, etc).

import type { ShopItem } from "./types";
import { COSMETIC_PALETTES } from "./cosmetics";
import { dayKey } from "./format";

const BOOST_DEFS = [
  { id: "boost_xp_2x_24h", name: "2x XP Booster (24h)", type: "boost" as const, price: 5000, currency: "coins" as const, effect: "xp_2x", durationMs: 86_400_000 },
  { id: "boost_xp_3x_1h", name: "3x XP Flash (1h)", type: "boost" as const, price: 8000, currency: "coins" as const, effect: "xp_3x", durationMs: 3_600_000 },
  { id: "boost_luck_1h", name: "Lucky Charm (1h)", type: "boost" as const, price: 12000, currency: "coins" as const, effect: "luck", durationMs: 3_600_000 },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

export function generateDailyShop(level: number): ShopItem[] {
  const items: ShopItem[] = [];
  // Pick 4 cosmetics from those the player can use at their level
  const availableCosmetics = COSMETIC_PALETTES.filter((p) => {
    const req = p.rarity === "common" ? 1 : p.rarity === "rare" ? 5 : p.rarity === "epic" ? 15 : 30;
    return level >= req;
  });
  for (const c of pickRandom(availableCosmetics, 4)) {
    const price = c.rarity === "common" ? 2000 : c.rarity === "rare" ? 8000 : c.rarity === "epic" ? 20000 : 50000;
    items.push({
      id: `cosmetic_${c.id}`,
      name: c.name,
      type: "cosmetic",
      price,
      currency: "coins",
      limited: false,
      cosmeticId: c.id,
      assignedDate: dayKey(),
    });
  }
  // Pick 2 boosts
  for (const b of pickRandom(BOOST_DEFS, 2)) {
    items.push({
      id: b.id,
      name: b.name,
      type: "boost",
      price: b.price,
      currency: b.currency,
      limited: true,
      quantity: 1,
      effect: b.effect,
      durationMs: b.durationMs,
      assignedDate: dayKey(),
    });
  }
  return items;
}

export function shopNeedsRefresh(lastShopDate: string | null): boolean {
  return lastShopDate !== dayKey();
}

export function validatePurchase(
  item: ShopItem,
  balance: number,
  alreadyOwned: string[]
): { ok: boolean; error?: string } {
  if (alreadyOwned.includes(item.id)) return { ok: false, error: "Already owned" };
  if (item.currency === "coins" && balance < item.price) return { ok: false, error: "Not enough coins" };
  if (item.limited && (item.quantity ?? 0) <= 0) return { ok: false, error: "Sold out" };
  return { ok: true };
}
