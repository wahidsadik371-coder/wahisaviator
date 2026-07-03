// Seasonal events — detect current date and return active event.

import type { SeasonalEvent } from "./types";

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "halloween",
    name: "Halloween",
    description: "Spooky vibes — orange/purple theme, ghost particles.",
    startMonth: 9, // October (0-indexed)
    endMonth: 9,
    themeColor: "#f97316",
    particleEffect: "default",
  },
  {
    id: "winter",
    name: "Winter Holidays",
    description: "Snow particles, gift-themed bonuses.",
    startMonth: 11, // December
    endMonth: 0, // January
    themeColor: "#67e8f9",
    particleEffect: "snow",
  },
  {
    id: "newyear",
    name: "New Year",
    description: "Fireworks celebration!",
    startMonth: 0,
    endMonth: 0,
    themeColor: "#fbbf24",
    particleEffect: "fireworks",
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    description: "Heart particles, pink theme.",
    startMonth: 1, // February
    endMonth: 1,
    themeColor: "#f472b6",
    particleEffect: "hearts",
  },
  {
    id: "summer",
    name: "Summer Vibes",
    description: "Tropical colors, beach theme.",
    startMonth: 5, // June
    endMonth: 7, // August
    themeColor: "#fde68a",
    particleEffect: "default",
  },
];

export function getActiveEvent(date: Date = new Date()): SeasonalEvent | null {
  const month = date.getMonth();
  for (const ev of SEASONAL_EVENTS) {
    if (ev.startMonth <= ev.endMonth) {
      if (month >= ev.startMonth && month <= ev.endMonth) return ev;
    } else {
      // Wraps year-end (e.g., winter Dec-Jan)
      if (month >= ev.startMonth || month <= ev.endMonth) return ev;
    }
  }
  return null;
}
