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
  StapleItem,
  RecipeId,
  MealLog,
  calculateGrocerySavings as _calculateGrocerySavings,
  getActiveKitchenBonuses as _getActiveKitchenBonuses,
  getBonusMultiplier as _getBonusMultiplier,
  decayKitchenItems,
} from '../kitchen/types';
import { RECIPES, STAPLES, KITCHEN } from '../balance';
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

// =============================================================================
// COOKING ENGINE
// =============================================================================

export const HERB_IDS = ['basil', 'mint', 'parsley', 'cilantro', 'chives'] as const;
export const MUSHROOM_IDS = ['oyster', 'shiitake', 'lions_mane'] as const;

type IngredientSource = 'storage' | 'staples';

interface ResolvedItem {
  source: IngredientSource;
  /** sourceType (for storage) or stapleId (for staples) */
  id: string;
  quantity: number;
}

/**
 * Build an inventory map: ingredientKey -> { source, total quantity }
 * Storage items keyed by sourceType, staples by stapleId.
 */
function buildInventory(
  storage: FoodItem[],
  staples: StapleItem[]
): Map<string, { source: IngredientSource; qty: number }> {
  const inv = new Map<string, { source: IngredientSource; qty: number }>();

  for (const item of storage) {
    const existing = inv.get(item.sourceType);
    if (existing) {
      existing.qty += item.quantity;
    } else {
      inv.set(item.sourceType, { source: 'storage', qty: item.quantity });
    }
  }

  for (const item of staples) {
    const existing = inv.get(item.stapleId);
    if (existing) {
      existing.qty += item.quantity;
    } else {
      inv.set(item.stapleId, { source: 'staples', qty: item.quantity });
    }
  }

  return inv;
}

/**
 * Resolve all ingredient requirements for a recipe against current inventory.
 * Returns a list of resolved items (what to consume) or null if impossible.
 *
 * Processes requirements in order: specific items first, then wildcards,
 * then distinct wildcards (most constrained last).
 */
export function resolveIngredients(
  requirements: Record<string, number>,
  storage: FoodItem[],
  staples: StapleItem[]
): ResolvedItem[] | null {
  // Work on a mutable copy of available quantities
  const inv = buildInventory(storage, staples);
  const result: ResolvedItem[] = [];

  // Sort keys: specific first, _any* second, _any*Distinct last
  const keys = Object.keys(requirements);
  const specific = keys.filter(k => !k.startsWith('_'));
  const anyWild = keys.filter(k => k.startsWith('_') && !k.endsWith('Distinct'));
  const distinctWild = keys.filter(k => k.endsWith('Distinct'));
  const ordered = [...specific, ...anyWild, ...distinctWild];

  for (const key of ordered) {
    const needed = requirements[key];

    if (!key.startsWith('_')) {
      // Specific ingredient
      const entry = inv.get(key);
      if (!entry || entry.qty < needed) return null;
      entry.qty -= needed;
      result.push({ source: entry.source, id: key, quantity: needed });
    } else if (key === '_anyHerb') {
      if (!resolveAny(HERB_IDS, needed, inv, result)) return null;
    } else if (key === '_anyMushroom') {
      if (!resolveAny(MUSHROOM_IDS, needed, inv, result)) return null;
    } else if (key === '_anyHerbsDistinct') {
      if (!resolveDistinct(HERB_IDS, needed, inv, result)) return null;
    } else if (key === '_anyMushroomsDistinct') {
      if (!resolveDistinct(MUSHROOM_IDS, needed, inv, result)) return null;
    } else {
      return null; // Unknown wildcard
    }
  }

  return result;
}

/**
 * Resolve "_anyX: N" — need N total from the pool (can be same type).
 * Picks from items with most stock first to preserve variety.
 */
function resolveAny(
  pool: readonly string[],
  needed: number,
  inv: Map<string, { source: IngredientSource; qty: number }>,
  result: ResolvedItem[]
): boolean {
  // Sort pool by descending available qty (use most-abundant first)
  const available = pool
    .map(id => ({ id, entry: inv.get(id) }))
    .filter((x): x is { id: string; entry: { source: IngredientSource; qty: number } } =>
      x.entry !== undefined && x.entry.qty > 0
    )
    .sort((a, b) => b.entry.qty - a.entry.qty);

  let remaining = needed;
  for (const { id, entry } of available) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, entry.qty);
    entry.qty -= take;
    remaining -= take;
    result.push({ source: entry.source, id, quantity: take });
  }

  return remaining === 0;
}

/**
 * Resolve "_anyXDistinct: N" — need N different types, 1 each.
 */
function resolveDistinct(
  pool: readonly string[],
  needed: number,
  inv: Map<string, { source: IngredientSource; qty: number }>,
  result: ResolvedItem[]
): boolean {
  const available = pool
    .map(id => ({ id, entry: inv.get(id) }))
    .filter((x): x is { id: string; entry: { source: IngredientSource; qty: number } } =>
      x.entry !== undefined && x.entry.qty > 0
    );

  if (available.length < needed) return false;

  // Take 1 of each from the first N available
  for (let i = 0; i < needed; i++) {
    const { id, entry } = available[i];
    entry.qty -= 1;
    result.push({ source: entry.source, id, quantity: 1 });
  }

  return true;
}

/**
 * Check if a recipe can be made with current inventory.
 */
export function canMakeRecipe(
  recipeId: RecipeId,
  storage: FoodItem[],
  staples: StapleItem[]
): boolean {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  return resolveIngredients(recipe.ingredients as Record<string, number>, storage, staples) !== null;
}

/**
 * Get all recipes that could be discovered right now
 * (have ingredients but not yet in discoveredRecipes).
 */
export function getDiscoverableRecipes(
  storage: FoodItem[],
  staples: StapleItem[],
  discovered: RecipeId[]
): RecipeId[] {
  const discoveredSet = new Set(discovered);
  const result: RecipeId[] = [];

  for (const id of Object.keys(RECIPES) as RecipeId[]) {
    if (discoveredSet.has(id)) continue;
    if (canMakeRecipe(id, storage, staples)) {
      result.push(id);
    }
  }

  return result;
}

/**
 * Select the best meal from discovered recipes that can currently be made.
 * "Best" = highest groceryValue. Returns null if nothing can be made.
 */
export function selectBestMeal(
  discoveredRecipes: RecipeId[],
  storage: FoodItem[],
  staples: StapleItem[]
): RecipeId | null {
  let bestId: RecipeId | null = null;
  let bestValue = -1;

  for (const id of discoveredRecipes) {
    const recipe = RECIPES[id];
    if (!recipe) continue;
    if (recipe.groceryValue <= bestValue) continue;
    if (canMakeRecipe(id, storage, staples)) {
      bestId = id;
      bestValue = recipe.groceryValue;
    }
  }

  return bestId;
}

/**
 * Cook a meal: consume ingredients from storage/staples.
 * Prioritizes oldest (lowest freshness) homegrown items first.
 */
export function cookRecipe(
  recipeId: RecipeId,
  storage: FoodItem[],
  staples: StapleItem[]
): {
  updatedStorage: FoodItem[];
  updatedStaples: StapleItem[];
  ingredientsUsed: { itemId: string; name: string; quantity: number }[];
} | null {
  const recipe = RECIPES[recipeId];
  if (!recipe) return null;

  const resolved = resolveIngredients(
    recipe.ingredients as Record<string, number>,
    storage,
    staples
  );
  if (!resolved) return null;

  // Clone arrays for mutation
  let updatedStorage = storage.map(item => ({ ...item }));
  let updatedStaples = staples.map(item => ({ ...item }));
  const ingredientsUsed: { itemId: string; name: string; quantity: number }[] = [];

  for (const item of resolved) {
    if (item.source === 'storage') {
      // Find matching storage items, sorted by freshness ascending (oldest first)
      const matching = updatedStorage
        .filter(s => s.sourceType === item.id && s.quantity > 0)
        .sort((a, b) => a.freshness - b.freshness);

      let remaining = item.quantity;
      for (const storageItem of matching) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, storageItem.quantity);
        storageItem.quantity -= take;
        remaining -= take;
        ingredientsUsed.push({
          itemId: storageItem.id,
          name: storageItem.name,
          quantity: take,
        });
      }

      // Remove depleted items
      updatedStorage = updatedStorage.filter(s => s.quantity > 0);
    } else {
      // Staples
      const stapleItem = updatedStaples.find(s => s.stapleId === item.id);
      if (stapleItem) {
        const take = Math.min(item.quantity, stapleItem.quantity);
        stapleItem.quantity -= take;
        ingredientsUsed.push({
          itemId: stapleItem.id,
          name: stapleItem.name,
          quantity: take,
        });
      }

      // Remove depleted staples
      updatedStaples = updatedStaples.filter(s => s.quantity > 0);
    }
  }

  return { updatedStorage, updatedStaples, ingredientsUsed };
}

/**
 * Calculate total grocery savings from this week's meals.
 * Returns { mealSavings, takeoutCosts } so the economy can compute:
 *   groceryBill = weeklyGroceryBase - mealSavings + takeoutCosts
 */
export function calculateMealSavings(
  mealHistory: MealLog[],
  weekStartDay: number,
  takeoutCost: number = KITCHEN.takeoutCost
): { mealSavings: number; takeoutCosts: number } {
  let mealSavings = 0;
  let takeoutCosts = 0;

  for (const meal of mealHistory) {
    if (meal.cookedAt < weekStartDay) continue;
    if (meal.recipeId === null) {
      takeoutCosts += takeoutCost;
    } else {
      mealSavings += meal.grocerySavings;
    }
  }

  return { mealSavings, takeoutCosts };
}
