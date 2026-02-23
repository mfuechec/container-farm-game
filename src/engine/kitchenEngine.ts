/**
 * Kitchen Engine - Pure game logic for food storage, decay, and bonuses
 * 
 * NO React, NO Zustand, NO side effects.
 * 
 * Note: Re-exports existing pure functions from kitchen/types.ts
 * and adds additional engine functions.
 */

import { 
  FoodItem, 
  KitchenBonus, 
  KitchenState,
  calculateGrocerySavings as _calculateGrocerySavings,
  getActiveKitchenBonuses as _getActiveKitchenBonuses,
  getBonusMultiplier as _getBonusMultiplier,
  decayKitchenItems,
} from '../kitchen/types';
import { getPlantType } from '../hobbies/plants/types';

// Re-export existing pure functions
export const calculateGrocerySavings = _calculateGrocerySavings;
export const getActiveKitchenBonuses = _getActiveKitchenBonuses;
export const getBonusMultiplier = _getBonusMultiplier;

/**
 * Decay all items in kitchen storage
 * Uses the item's maxFreshDays to determine decay rate
 */
export function decayStorageItems(
  items: FoodItem[],
  deltaDays: number
): FoodItem[] {
  return decayKitchenItems(items, deltaDays);
}

/**
 * Add item to kitchen storage
 * Returns null if kitchen is full
 */
export function addToStorage(
  kitchen: KitchenState,
  item: FoodItem
): KitchenState | null {
  if (kitchen.storage.length >= kitchen.capacity) {
    return null;
  }
  
  // Check if we can stack with existing item of same type
  const existingIndex = kitchen.storage.findIndex(
    s => s.sourceType === item.sourceType
  );
  
  if (existingIndex >= 0) {
    // Stack: combine quantities, average freshness
    const existing = kitchen.storage[existingIndex];
    const totalQty = existing.quantity + item.quantity;
    const avgFreshness = (
      (existing.freshness * existing.quantity) + 
      (item.freshness * item.quantity)
    ) / totalQty;
    
    const newStorage = [...kitchen.storage];
    newStorage[existingIndex] = {
      ...existing,
      quantity: totalQty,
      freshness: avgFreshness,
    };
    
    return { ...kitchen, storage: newStorage };
  }
  
  // Add new item
  return {
    ...kitchen,
    storage: [...kitchen.storage, item],
  };
}

/**
 * Remove item from kitchen storage
 */
export function removeFromStorage(
  kitchen: KitchenState,
  itemId: string
): KitchenState {
  return {
    ...kitchen,
    storage: kitchen.storage.filter(item => item.id !== itemId),
  };
}

// calculateGrocerySavings, getActiveKitchenBonuses, getBonusMultiplier 
// are re-exported from kitchen/types.ts above

/**
 * Check if kitchen has capacity for new item
 */
export function hasCapacity(kitchen: KitchenState): boolean {
  return kitchen.storage.length < kitchen.capacity;
}

/**
 * Get total items in kitchen
 */
export function getStorageCount(kitchen: KitchenState): number {
  return kitchen.storage.length;
}

/**
 * Process kitchen tick (decay items)
 */
export function tickKitchen(
  kitchen: KitchenState,
  deltaDays: number
): KitchenState {
  return {
    ...kitchen,
    storage: decayStorageItems(kitchen.storage, deltaDays),
  };
}

/**
 * Convert harvested plant to food item for storage
 */
export function harvestToFoodItem(
  harvestId: string,
  typeId: string,
  quantity: number,
  freshness: number
): FoodItem {
  const plantType = getPlantType(typeId);
  
  return {
    id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: plantType?.name ?? typeId,
    emoji: plantType?.emoji ?? '🌱',
    quantity,
    freshness,
    maxFreshDays: 14, // Default 2 weeks shelf life
    storedAt: Date.now(),
    groceryValue: plantType?.sellPrice ?? 2, // Use sell price as grocery value
    bonus: plantType?.kitchenBonus,
    sourceHobby: 'plants',
    sourceType: typeId,
  };
}
