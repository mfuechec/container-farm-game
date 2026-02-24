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
  money: 100,
  weeklyRent: 50,          // Flat rent
  weeklyGroceryBase: 25,   // Base groceries, herbs reduce this
  weeklyIncome: 60,        // Day job covers rent, hobby covers groceries
};

/**
 * Get rent amount (flat rate, no scaling)
 */
export function getRentForWeek(_week: number): number {
  return 50;  // Flat $50/week
}

export interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  timestamp: number;
}
