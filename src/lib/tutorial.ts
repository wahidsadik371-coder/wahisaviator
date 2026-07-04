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
    title: "The Cockpit",
    description: "Place a bet during countdown. Cash out before the crash. That's the game.",
    action: "next",
  },
  {
    id: "place_bet",
    title: "Place Your Bet",
    description: "Set your bet with +/- or presets. Hit Place Bet during the countdown.",
    target: '[aria-label*="Place bet"]',
    action: "place_bet",
  },
  {
    id: "cashout",
    title: "Cash Out",
    description: "The multiplier rises. Hit Cash Out to lock in. Wait too long, lose it all.",
    target: '[aria-label*="Cash out"]',
    action: "cashout",
  },
  {
    id: "history",
    title: "Read the History",
    description: "The strip shows recent flights. Patterns emerge, but the house always wins.",
    action: "next",
  },
  {
    id: "auto",
    title: "Auto-Bet & Auto-Cashout",
    description: "Automate your strategy. Set a target multiplier and let it ride.",
    action: "next",
  },
  {
    id: "bonus",
    title: "Daily Drop",
    description: "Claim daily coins. Tap +50K anytime you run low.",
    action: "claim_bonus",
  },
  {
    id: "done",
    title: "Ready to Fly",
    description: "That's it. The rest you'll pick up as you go.",
    action: "next",
  },
];
