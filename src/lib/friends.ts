// Friend system — simulated AI friends with online status, stats, activity feed.

import type { Friend } from "./types";

const ADJ = ["Neo", "Cyber", "Pixel", "Quantum", "Astro", "Lunar", "Solar", "Nebula", "Turbo", "Mega", "Ultra", "Plasma", "Nova", "Echo", "Volt"];
const NOUN = ["Pilot", "Rider", "Hunter", "Wolf", "Falcon", "Viper", "Rex", "Byte", "Spark", "Comet", "Rogue", "Ace", "Nomad", "Specter"];
const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb7185", "#60a5fa", "#c084fc"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

let friendIdSeq = 1;
export function generateFriend(): Friend {
  const name = pick(ADJ) + pick(NOUN) + Math.floor(Math.random() * 99);
  return {
    id: `friend_${friendIdSeq++}_${Date.now()}`,
    name,
    color: pick(COLORS),
    online: Math.random() < 0.6,
    lastSeen: Date.now() - Math.floor(Math.random() * 86_400_000),
    stats: {
      level: Math.floor(Math.random() * 50) + 1,
      wins: Math.floor(Math.random() * 500),
      bestMultiplier: Math.floor(Math.random() * 100 * 100) / 100,
    },
  };
}

export function generateInitialFriends(count: number = 5): Friend[] {
  return Array.from({ length: count }, generateFriend);
}

export function onlineFriends(friends: Friend[]): Friend[] {
  return friends.filter((f) => f.online);
}

export function sortFriendsByLevel(friends: Friend[]): Friend[] {
  return [...friends].sort((a, b) => b.stats.level - a.stats.level);
}
