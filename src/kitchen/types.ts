/**
 * Kitchen System
 * 
 * Shared storage for food items from any hobby.
 * Provides bonuses and reduces grocery bill.
 */

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
  sourceHobby: string;         // e.g., 'plants', 'mushrooms'
  sourceType: string;          // e.g., 'basil', 'oyster'
}

export interface KitchenState {
  storage: FoodItem[];
  capacity: number;
}

export const INITIAL_KITCHEN: KitchenState = {
  storage: [],
  capacity: 8,  // Unique items only - variety matters
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
