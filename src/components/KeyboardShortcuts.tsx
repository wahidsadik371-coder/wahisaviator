// Keyboard shortcuts handler.
// Mounts once at app root. Useful shortcuts only — no decorative easter eggs.

import { useEffect } from "react";

import { useGameStore } from "@/store/useGameStore";
import { sound } from "@/lib/sound";

export function KeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const store = useGameStore.getState();

      switch (e.key.toLowerCase()) {
        case "b":
          if (!e.ctrlKey && !e.metaKey) {
            store.toggleAutoBet();
          }
          break;
        case "c":
          if (!e.ctrlKey && !e.metaKey) {
            store.setAutoCashoutEnabled(!store.betConfig.autoCashoutEnabled);
            sound.play("click");
          }
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) return; // don't intercept Ctrl+S
          break;
        case " ":
          // Space: place bet or cashout
          e.preventDefault();
          if (store.activeBet?.status === "active") {
            store.cashOut();
          } else if (!store.activeBet && store.settings) {
            store.placeBet();
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
