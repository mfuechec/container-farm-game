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
}

export const INITIAL_ECONOMY: EconomyState = {
  money: 100,
  weeklyRent: 50,
  weeklyGroceryBase: 50,
};

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  timestamp: number;
}
