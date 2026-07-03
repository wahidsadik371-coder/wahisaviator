// Themes — apply CSS custom properties to document root.

import type { Theme } from "./types";
import { THEMES } from "./constants";

export function getAllThemes(): readonly Theme[] {
  return THEMES;
}

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Apply a theme by setting CSS variables on :root. */
export function applyTheme(themeId: string): void {
  if (typeof document === "undefined") return;
  const theme = getThemeById(themeId);
  const root = document.documentElement;
  root.style.setProperty("--color-bg", theme.colors.bg);
  root.style.setProperty("--color-panel", theme.colors.panel);
  root.style.setProperty("--color-accent", theme.colors.accent);
  root.style.setProperty("--color-text-base", theme.colors.text);
  root.style.setProperty("--color-glow", theme.colors.glow);
  root.setAttribute("data-theme", theme.id);
}
