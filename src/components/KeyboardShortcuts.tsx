// Keyboard shortcuts handler + Konami code easter egg.
// Mounts once at app root.

import { useEffect } from "react";

import { useGameStore } from "@/store/useGameStore";
import { sound } from "@/lib/sound";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function KeyboardShortcuts() {
  useEffect(() => {
    let konamiIdx = 0;
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const store = useGameStore.getState();

      // Konami code
      const expected = KONAMI[konamiIdx];
      if (e.key === expected || e.key.toLowerCase() === expected) {
        konamiIdx++;
        if (konamiIdx === KONAMI.length) {
          store.setKonami(true);
          konamiIdx = 0;
        }
      } else {
        konamiIdx = e.key === KONAMI[0] ? 1 : 0;
      }

      // Shortcuts
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
        case "h":
          // Toggle history visibility (could be a setting)
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
