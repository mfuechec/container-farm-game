/**
 * Kitchen System
 * 
 * Shared storage for food items from any hobby.
 * Provides bonuses, reduces grocery bill, and enables cooking.
 */

import { KITCHEN, RECIPES, STAPLES, VARIETY_BONUS } from '../balance';

// =============================================================================
// STORAGE
// =============================================================================

// Generic food item that any hobby can produce
export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  freshness: number;           // 0-1, decays over time
  maxFreshDays: number;        // How long before fully decayed
  storedAt: number;            // Timestamp
  
  // Economic value
  groceryValue: number;        // Weekly savings per unit
  
  // Optional bonus when stocked
  bonus?: {
    type: 'growth' | 'yield' | 'freshness' | 'energy';
    amount: number;            // Multiplier (1.1 = 10% boost)
  };
  
  // Source tracking
  sourceHobby: string;         // e.g., 'plants', 'mushrooms', 'store'
  sourceType: string;          // e.g., 'basil', 'oyster', 'pasta'
}

// Staple item (store-bought, doesn't decay)
export interface StapleItem {
  id: string;
  stapleId: keyof typeof STAPLES;
  name: string;
  emoji: string;
  quantity: number;
}

// =============================================================================
// RECIPES & MEALS
// =============================================================================

export type RecipeId = keyof typeof RECIPES;

// A cooked meal (logged in history)
export interface MealLog {
  id: string;
  recipeId: RecipeId | null;    // null = takeout
  recipeName: string;
  emoji: string;
  cookedAt: number;             // Game day (fractional)
  grocerySavings: number;       // How much this meal saved
  ingredientsUsed: {            // What was consumed
    itemId: string;
    name: string;
    quantity: number;
  }[];
}

// =============================================================================
// KITCHEN STATE
// =============================================================================

export interface KitchenState {
  // Storage
  storage: FoodItem[];          // Homegrown ingredients
  staples: StapleItem[];        // Store-bought ingredients
  capacity: number;             // Max unique ingredient types
  
  // Recipes
  discoveredRecipes: RecipeId[];
  
  // Meal tracking
  mealHistory: MealLog[];       // All meals this week
  weekStartDay: number;         // When current week started (for reset)
}

// =============================================================================
// VARIETY BONUS
// =============================================================================

export interface VarietyStatus {
  uniqueMealsThisWeek: number;
  tierName: string | null;
  tierEmoji: string | null;
  efficiencyBonus: number;      // 0.05 = +5%
  discoveryBonus: number;       // 2.0 = 2x discovery chance
}

export function getVarietyStatus(mealHistory: MealLog[], weekStartDay: number, currentDay: number): VarietyStatus {
  // Count unique recipes this week (excluding takeout)
  const thisWeekMeals = mealHistory.filter(m => m.cookedAt >= weekStartDay && m.recipeId !== null);
  const uniqueRecipes = new Set(thisWeekMeals.map(m => m.recipeId));
  const uniqueCount = uniqueRecipes.size;
  
  // Find highest matching tier
  let tierName: string | null = null;
  let tierEmoji: string | null = null;
  let efficiencyBonus = 0;
  let discoveryBonus = 1.0;
  
  for (const tier of VARIETY_BONUS.tiers) {
    if (uniqueCount >= tier.minMeals) {
      tierName = tier.name;
      tierEmoji = tier.emoji;
      efficiencyBonus = tier.efficiencyBonus;
      discoveryBonus = tier.discoveryBonus;
    }
  }
  
  return {
    uniqueMealsThisWeek: uniqueCount,
    tierName,
    tierEmoji,
    efficiencyBonus,
    discoveryBonus,
  };
}

export const INITIAL_KITCHEN: KitchenState = {
  storage: [],
  staples: [],
  capacity: KITCHEN.storageCapacity,
  discoveredRecipes: [],
  mealHistory: [],
  weekStartDay: 0,
};

/**
 * Calculate weekly grocery savings from stored items
 */
export function calculateGrocerySavings(storage: FoodItem[]): number {
  let savings = 0;
  for (const item of storage) {
    savings += item.groceryValue * item.quantity * item.freshness;
  }
  return Math.round(savings * 10) / 10;
}

/**
 * Get active bonuses from kitchen stock
 */
export interface KitchenBonus {
  type: 'growth' | 'yield' | 'freshness' | 'energy';
  amount: number;
  source: string;
}

export function getActiveKitchenBonuses(storage: FoodItem[]): KitchenBonus[] {
  const bonuses: KitchenBonus[] = [];
  
  for (const item of storage) {
    if (item.freshness <= 0 || item.quantity <= 0) continue;
    if (item.bonus) {
      bonuses.push({
        type: item.bonus.type,
        amount: item.bonus.amount,
        source: item.name,
      });
    }
  }
  
  return bonuses;
}

/**
 * Get multiplier for a specific bonus type
 */
export function getBonusMultiplier(bonuses: KitchenBonus[], type: KitchenBonus['type']): number {
  let multiplier = 1.0;
  for (const bonus of bonuses) {
    if (bonus.type === type) {
      multiplier *= bonus.amount;
    }
  }
  return multiplier;
}

/**
 * Decay kitchen items over time
 */
export function decayKitchenItems(storage: FoodItem[], daysPassed: number): FoodItem[] {
  return storage
    .map(item => {
      const decayRate = 1 / item.maxFreshDays;
      return {
        ...item,
        freshness: Math.max(0, item.freshness - (decayRate * daysPassed)),
      };
    })
    .filter(item => item.freshness > 0);
}
