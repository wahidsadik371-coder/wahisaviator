// Dev tools — debug overlay + console commands. Dev-only.

import { monitoring } from "@/lib/monitoring";

declare global {
  interface Window {
    __DEBUG__?: {
      addCoins: (n: number) => void;
      setMultiplier: (n: number) => void;
      triggerCrash: () => void;
      unlockAllAchievements: () => void;
      resetEverything: () => void;
      getState: () => unknown;
      getErrors: () => unknown;
      getBreadcrumbs: () => unknown;
    };
  }
}

export function installDevTools(getStore: {
  getState: () => any;
  setState: (s: any) => void;
}): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;

  window.__DEBUG__ = {
    addCoins: (n) => {
      const store = getStore.getState();
      getStore.setState({ ...store, balance: store.balance + n });
      // eslint-disable-next-line no-console
      console.log(`[dev] added ${n} coins. New balance: ${store.balance + n}`);
    },
    setMultiplier: (n) => {
      // eslint-disable-next-line no-console
      console.log(`[dev] multiplier override requested: ${n}x (not implemented in single-file build)`);
    },
    triggerCrash: () => {
      // eslint-disable-next-line no-console
      console.log("[dev] crash trigger requested (not implemented in single-file build)");
    },
    unlockAllAchievements: () => {
      const store = getStore.getState();
      getStore.setState({
        ...store,
        achievements: ["first_flight", "first_win", "high_roller", "whale", "lucky_seven", "diamond_hands", "moonshot", "millionaire", "comeback", "veteran", "streak3", "generous"],
      });
      // eslint-disable-next-line no-console
      console.log("[dev] unlocked all achievements");
    },
    resetEverything: () => {
      localStorage.removeItem("nova-rush-save-v1");
      location.reload();
    },
    getState: () => getStore.getState(),
    getErrors: () => monitoring.getErrors(),
    getBreadcrumbs: () => monitoring.getBreadcrumbs(),
  };

  // eslint-disable-next-line no-console
  console.info("[dev] __DEBUG__ installed. Try window.__DEBUG__.addCoins(100000)");
}
