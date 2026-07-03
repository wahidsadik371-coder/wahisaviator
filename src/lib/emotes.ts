// Emote system — text-based emotes for chat.

export interface Emote {
  id: string;
  char: string;
  name: string;
  category: "reactions" | "celebrations" | "memes";
}

export const EMOTES: Emote[] = [
  // Reactions
  { id: "lol", char: "😂", name: "LOL", category: "reactions" },
  { id: "cry", char: "😭", name: "Cry", category: "reactions" },
  { id: "thinking", char: "🤔", name: "Thinking", category: "reactions" },
  { id: "wow", char: "😮", name: "Wow", category: "reactions" },
  { id: "angry", char: "😠", name: "Angry", category: "reactions" },
  { id: "love", char: "❤️", name: "Love", category: "reactions" },
  { id: "fire", char: "🔥", name: "Fire", category: "reactions" },
  { id: "clap", char: "👏", name: "Clap", category: "reactions" },
  // Celebrations
  { id: "party", char: "🎉", name: "Party", category: "celebrations" },
  { id: "rocket", char: "🚀", name: "Rocket", category: "celebrations" },
  { id: "trophy", char: "🏆", name: "Trophy", category: "celebrations" },
  { id: "diamond", char: "💎", name: "Diamond", category: "celebrations" },
  { id: "moon", char: "🌙", name: "Moon", category: "celebrations" },
  { id: "star", char: "⭐", name: "Star", category: "celebrations" },
  { id: "crown", char: "👑", name: "Crown", category: "celebrations" },
  { id: "money", char: "💰", name: "Money", category: "celebrations" },
  // Memes
  { id: "skull", char: "💀", name: "Skull", category: "memes" },
  { id: "eyes", char: "👀", name: "Eyes", category: "memes" },
  { id: "salute", char: "🫡", name: "Salute", category: "memes" },
  { id: "prayer", char: "🙏", name: "Prayer", category: "memes" },
  { id: "shrug", char: "🤷", name: "Shrug", category: "memes" },
  { id: "facepalm", char: "🤦", name: "Facepalm", category: "memes" },
  { id: "nerd", char: "🤓", name: "Nerd", category: "memes" },
  { id: "robot", char: "🤖", name: "Robot", category: "memes" },
];

export const EMOTE_CATEGORIES = ["reactions", "celebrations", "memes"] as const;

const recentEmotes: string[] = [];
export function pushRecent(emoteId: string): void {
  const idx = recentEmotes.indexOf(emoteId);
  if (idx !== -1) recentEmotes.splice(idx, 1);
  recentEmotes.unshift(emoteId);
  if (recentEmotes.length > 8) recentEmotes.pop();
}

export function getRecentEmotes(): Emote[] {
  return recentEmotes
    .map((id) => EMOTES.find((e) => e.id === id))
    .filter((e): e is Emote => !!e);
}

export function searchEmotes(query: string): Emote[] {
  const q = query.toLowerCase();
  return EMOTES.filter((e) => e.name.toLowerCase().includes(q) || e.id.includes(q));
}
