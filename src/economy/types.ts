/**
 * Economy System
 * 
 * Handles all money flow: income, expenses, transactions.
 * Shared across all game systems.
 */

export interface EconomyState {
  money: number;
  weeklyRent: number;
  weeklyGroceryBase: number;
  weeklyIncome: number;
}

import { ECONOMY, HOUSING } from '../balance';

export const INITIAL_ECONOMY: EconomyState = {
  money: ECONOMY.startingMoney,
  weeklyRent: HOUSING[0].rentPerWeek,
  weeklyGroceryBase: ECONOMY.weeklyGroceryBase,
  weeklyIncome: ECONOMY.weeklyIncome,
};

/**
 * Get rent amount (flat rate, no scaling)
 */
export function getRentForWeek(_week: number): number {
  return HOUSING[0].rentPerWeek;
}

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  timestamp: number;
}
