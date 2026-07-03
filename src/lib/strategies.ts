// Betting strategies — auto-adjusting bet amounts based on outcome history.

import type { BettingStrategy } from "./types";

export const STRATEGY_PRESETS: BettingStrategy[] = [
  {
    id: "martingale",
    name: "Martingale",
    description: "Double bet after each loss, reset on win. High risk.",
    type: "martingale",
    config: {
      baseAmount: 100,
      onWin: "reset",
      onLoss: "increase",
      winMultiplier: 1,
      lossMultiplier: 2,
      maxSteps: 8,
      stopOnProfit: 5000,
      stopOnLoss: 10000,
    },
  },
  {
    id: "fibonacci",
    name: "Fibonacci",
    description: "Follow Fibonacci sequence on losses, step back 2 on wins.",
    type: "fibonacci",
    config: {
      baseAmount: 100,
      onWin: "maintain",
      onLoss: "increase",
      winMultiplier: 1,
      lossMultiplier: 1.618,
      maxSteps: 12,
      stopOnProfit: 5000,
      stopOnLoss: 10000,
    },
  },
  {
    id: "dalembert",
    name: "D'Alembert",
    description: "Increase by 1 unit on loss, decrease by 1 on win. Low risk.",
    type: "dalembert",
    config: {
      baseAmount: 100,
      onWin: "maintain",
      onLoss: "increase",
      winMultiplier: 1,
      lossMultiplier: 1,
      maxSteps: 20,
      stopOnProfit: 2000,
      stopOnLoss: 5000,
    },
  },
  {
    id: "paroli",
    name: "Paroli (Reverse Martingale)",
    description: "Double bet after each win, reset on loss. Ride hot streaks.",
    type: "paroli",
    config: {
      baseAmount: 100,
      onWin: "increase",
      onLoss: "reset",
      winMultiplier: 2,
      lossMultiplier: 1,
      maxSteps: 4,
      stopOnProfit: 10000,
      stopOnLoss: 2000,
    },
  },
];

export interface StrategyState {
  currentStep: number;
  currentAmount: number;
  totalProfit: number;
  totalLoss: number;
  history: { bet: number; won: boolean; amount: number }[];
}

export function initStrategyState(strategy: BettingStrategy): StrategyState {
  return {
    currentStep: 0,
    currentAmount: strategy.config.baseAmount,
    totalProfit: 0,
    totalLoss: 0,
    history: [],
  };
}

export function nextBetAfterWin(strategy: BettingStrategy, state: StrategyState): StrategyState {
  const c = strategy.config;
  let amount = state.currentAmount;
  if (c.onWin === "reset") amount = c.baseAmount;
  else if (c.onWin === "increase") amount = Math.floor(amount * c.winMultiplier);
  // maintain = no change
  return {
    ...state,
    currentStep: c.onWin === "reset" ? 0 : state.currentStep + 1,
    currentAmount: amount,
  };
}

export function nextBetAfterLoss(strategy: BettingStrategy, state: StrategyState): StrategyState {
  const c = strategy.config;
  let amount = state.currentAmount;
  if (c.onLoss === "reset") amount = c.baseAmount;
  else if (c.onLoss === "increase") amount = Math.floor(amount * c.lossMultiplier);
  return {
    ...state,
    currentStep: c.onLoss === "reset" ? 0 : state.currentStep + 1,
    currentAmount: amount,
  };
}

export function shouldStop(strategy: BettingStrategy, state: StrategyState): { stop: boolean; reason?: string } {
  if (state.totalProfit >= strategy.config.stopOnProfit) return { stop: true, reason: "Profit target reached" };
  if (state.totalLoss >= strategy.config.stopOnLoss) return { stop: true, reason: "Loss limit reached" };
  if (state.currentStep >= strategy.config.maxSteps) return { stop: true, reason: "Max steps reached" };
  return { stop: false };
}
