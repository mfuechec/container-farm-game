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

export const INITIAL_ECONOMY: EconomyState = {
  money: 500,
  weeklyRent: 375,         // $1500/month
  weeklyGroceryBase: 250,  // $1000/month
  weeklyIncome: 750,       // $1500 biweekly
};

/**
 * Get rent amount (flat rate, no scaling)
 */
export function getRentForWeek(_week: number): number {
  return 375;  // $1500/month
}

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  timestamp: number;
}
