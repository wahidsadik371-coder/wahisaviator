// Tutorial system — step-by-step onboarding.

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlight
  action?: "place_bet" | "cashout" | "claim_bonus" | "next";
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Wahid's Aviator!",
    description: "A free crash game using virtual coins. Watch the multiplier rise and cash out before it crashes!",
    action: "next",
  },
  {
    id: "place_bet",
    title: "Place Your First Bet",
    description: "Use the +/- buttons to set your bet, then tap 'Place Bet' during the countdown.",
    target: '[aria-label*="Place bet"]',
    action: "place_bet",
  },
  {
    id: "cashout",
    title: "Cash Out Before Crash!",
    description: "When the multiplier rises, hit 'Cash Out' to lock in your winnings. Wait too long and you lose!",
    target: '[aria-label*="Cash out"]',
    action: "cashout",
  },
  {
    id: "history",
    title: "Read the History",
    description: "The strip at top shows recent crash points. Use it to spot patterns (or just enjoy the show).",
    action: "next",
  },
  {
    id: "auto",
    title: "Auto-Bet & Auto-Cashout",
    description: "Enable these in the betting panel to automate your strategy. Set a target multiplier and let it ride.",
    action: "next",
  },
  {
    id: "bonus",
    title: "Daily Bonus & Free Coins",
    description: "Claim your daily bonus once per day, and tap '+50K Free' anytime you run low.",
    action: "claim_bonus",
  },
  {
    id: "achievements",
    title: "Unlock Achievements",
    description: "Check the Awards tab to see what you can unlock. Each one gives XP!",
    action: "next",
  },
  {
    id: "done",
    title: "You're Ready!",
    description: "Good luck out there, pilot. Remember: it's all for fun — no real money involved.",
    action: "next",
  },
];
