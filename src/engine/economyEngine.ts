/**
 * Economy Engine - Pure game logic for money, rent, and expenses
 * 
 * NO React, NO Zustand, NO side effects.
 */

import { EconomyState } from '../economy/types';

/**
 * Get rent amount (flat rate)
 * NOTE: This is a fallback. Actual rent comes from housing tier.
 */
export function getRentForWeek(_week: number): number {
  return 375;  // Default to studio rent ($1500/month)
}

/**
 * Process weekly rent payment
 * 
 * @param economy - Current economy state
 * @param rentAmount - Weekly rent to deduct
 * @returns Updated economy state
 */
export function processRent(
  economy: EconomyState,
  rentAmount: number
): EconomyState {
  return {
    ...economy,
    money: economy.money - rentAmount,
  };
}

/**
 * Process weekly grocery expenses (reduced by kitchen storage)
 * 
 * @param economy - Current economy state
 * @param baseGroceries - Base grocery cost
 * @param savings - Amount saved from kitchen storage
 * @returns Updated economy state
 */
export function processGroceries(
  economy: EconomyState,
  baseGroceries: number,
  savings: number
): EconomyState {
  const actualCost = Math.max(0, baseGroceries - savings);
  return {
    ...economy,
    money: economy.money - actualCost,
  };
}

/**
 * Add money (from selling harvest, etc.)
 */
export function addMoney(
  economy: EconomyState,
  amount: number
): EconomyState {
  return {
    ...economy,
    money: economy.money + amount,
  };
}

/**
 * Spend money (buying seeds, equipment, etc.)
 * Returns null if insufficient funds
 */
export function spendMoney(
  economy: EconomyState,
  amount: number,
  allowDebt: boolean = false
): EconomyState | null {
  if (!allowDebt && economy.money < amount) {
    return null;
  }
  return {
    ...economy,
    money: economy.money - amount,
  };
}

/**
 * Check if player can afford a purchase
 */
export function canAfford(economy: EconomyState, amount: number): boolean {
  return economy.money >= amount;
}

/**
 * Calculate total weekly expenses
 */
export function calculateWeeklyExpenses(
  rentPerWeek: number,
  groceryBase: number,
  grocerySavings: number
): number {
  return rentPerWeek + Math.max(0, groceryBase - grocerySavings);
}

/**
 * Calculate days until bankruptcy (negative balance)
 * Returns Infinity if player has enough for 52+ weeks
 */
export function calculateRunway(
  currentMoney: number,
  weeklyExpenses: number,
  weeklyIncome: number = 0
): number {
  const netWeekly = weeklyIncome - weeklyExpenses;
  
  if (netWeekly >= 0) {
    return Infinity; // Sustainable
  }
  
  const weeksLeft = Math.floor(currentMoney / Math.abs(netWeekly));
  return weeksLeft * 7; // Convert to days
}

/**
 * Process all weekly finances (income - expenses)
 */
export function processWeeklyExpenses(
  economy: EconomyState,
  rentAmount: number,
  groceryBase: number,
  grocerySavings: number,
  weeklyIncome: number = 0
): EconomyState {
  const groceryCost = Math.max(0, groceryBase - grocerySavings);
  const totalExpenses = rentAmount + groceryCost;
  const netChange = weeklyIncome - totalExpenses;
  
  return {
    ...economy,
    money: economy.money + netChange,
  };
}

/**
 * Check if a week has passed since last rent payment
 */
export function isRentDue(
  lastRentPaid: number,
  currentTime: number,
  msPerWeek: number
): boolean {
  return (currentTime - lastRentPaid) >= msPerWeek;
}
