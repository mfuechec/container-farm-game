/**
 * Kitchen System - Phase 1
 * 
 * Store harvested plants for personal use.
 * Reduces grocery bill and provides bonuses.
 */

import { HarvestedPlant, getPlantType } from '../plants/types';

export interface KitchenState {
  storage: HarvestedPlant[];  // What's in the kitchen
  capacity: number;           // Max items (start with 5)
  weeklyGroceryBase: number;  // Base grocery bill per week
}

export const INITIAL_KITCHEN: KitchenState = {
  storage: [],
  capacity: 5,
  weeklyGroceryBase: 50,     // $50/week base grocery cost
};

/**
 * Calculate weekly grocery savings from stored plants
 */
export function calculateGrocerySavings(storage: HarvestedPlant[]): number {
  let savings = 0;
  
  for (const item of storage) {
    const plantType = getPlantType(item.typeId);
    if (plantType) {
      // Savings based on quantity and freshness
      savings += plantType.groceryValue * item.quantity * item.freshness;
    }
  }
  
  return Math.round(savings * 10) / 10;
}

/**
 * Get active bonuses from kitchen stock
 */
export interface KitchenBonus {
  type: 'growth' | 'yield' | 'freshness';
  amount: number;
  source: string;  // Plant name providing the bonus
}

export function getActiveKitchenBonuses(storage: HarvestedPlant[]): KitchenBonus[] {
  const bonuses: KitchenBonus[] = [];
  
  for (const item of storage) {
    if (item.freshness <= 0 || item.quantity <= 0) continue;
    
    const plantType = getPlantType(item.typeId);
    if (plantType?.kitchenBonus) {
      bonuses.push({
        type: plantType.kitchenBonus.type,
        amount: plantType.kitchenBonus.amount,
        source: plantType.name,
      });
    }
  }
  
  return bonuses;
}

/**
 * Calculate combined growth multiplier from kitchen bonuses
 */
export function getGrowthMultiplier(bonuses: KitchenBonus[]): number {
  let multiplier = 1.0;
  for (const bonus of bonuses) {
    if (bonus.type === 'growth') {
      multiplier *= bonus.amount;
    }
  }
  return multiplier;
}

/**
 * Calculate combined yield multiplier from kitchen bonuses
 */
export function getYieldMultiplier(bonuses: KitchenBonus[]): number {
  let multiplier = 1.0;
  for (const bonus of bonuses) {
    if (bonus.type === 'yield') {
      multiplier *= bonus.amount;
    }
  }
  return multiplier;
}

/**
 * Decay kitchen items over time
 * Called each game tick
 */
export function decayKitchenItems(storage: HarvestedPlant[], daysPassed: number): HarvestedPlant[] {
  const decayRate = 0.1; // 10% per day
  
  return storage
    .map(item => ({
      ...item,
      freshness: Math.max(0, item.freshness - (decayRate * daysPassed)),
    }))
    .filter(item => item.freshness > 0 || item.quantity > 0);
}

/**
 * Consume items from kitchen (auto-consumption)
 * Returns updated storage and amount consumed
 */
export function consumeKitchenItems(
  storage: HarvestedPlant[], 
  daysPassed: number
): { storage: HarvestedPlant[]; consumed: number } {
  const consumptionRate = 0.2; // Consume 0.2 units per day
  let totalConsumed = 0;
  let toConsume = consumptionRate * daysPassed;
  
  const newStorage = storage.map(item => {
    if (toConsume <= 0) return item;
    
    const consume = Math.min(item.quantity, toConsume);
    toConsume -= consume;
    totalConsumed += consume;
    
    return {
      ...item,
      quantity: item.quantity - consume,
    };
  }).filter(item => item.quantity > 0);
  
  return { storage: newStorage, consumed: totalConsumed };
}
