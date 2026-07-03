// Game mode variants — Classic, Turbo, Practice.

import type { GameMode } from "./types";
import { GAME_MODES } from "./constants";

export const ALL_MODES: GameMode[] = Object.values(GAME_MODES);

export function getModeById(id: string): GameMode {
  return ALL_MODES.find((m) => m.id === id) ?? GAME_MODES.classic;
}

export function isModeAvailable(modeId: string, level: number): boolean {
  if (modeId === "classic") return true;
  if (modeId === "turbo") return level >= 5;
  if (modeId === "practice") return true;
  return false;
}
