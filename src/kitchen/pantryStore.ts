/**
 * Pantry Store Slice
 * 
 * Extends the game store with pantry state and actions.
 * This file provides the types and initial state for pantry integration.
 */

import { StateCreator } from 'zustand';
import {
  PantryState,
  PantryItem,
  Meal,
  INGREDIENTS,
  STAPLE_IDS,
  addToPantry,
  removeFromPantry,
  autoSelectMeal,
  cookMeal,
  getPantryState,
  resetPantry,
  deserializePantry,
  serializePantry,
} from '../engine/pantryEngine';

// Initial pantry state - start with some staples
export const INITIAL_PANTRY: PantryState = {
  items: [
    { ingredientId: 'rice', quantity: 5, harvestedAt: 1, source: 'bought' },
    { ingredientId: 'pasta', quantity: 5, harvestedAt: 1, source: 'bought' },
    { ingredientId: 'eggs', quantity: 6, harvestedAt: 1, source: 'bought' },
    { ingredientId: 'oliveoil', quantity: 2, harvestedAt: 1, source: 'bought' },
  ],
  mealHistory: [],
  totalMealsCooked: 0,
};

// Pantry slice interface
export interface PantrySlice {
  pantry: PantryState;
  todaysMeal: Meal | null;
  lastMealDay: number;
  
  // Actions
  addToPantryAction: (ingredientId: string, quantity: number, gameDay: number, source: 'grown' | 'bought') => void;
  buyStaple: (ingredientId: string) => boolean;
  processDailyMeal: (gameDay: number) => void;
}

/**
 * Create pantry slice for Zustand store
 */
export const createPantrySlice: StateCreator<
  PantrySlice & { economy: { money: number }; spendMoney: (amount: number) => boolean },
  [],
  [],
  PantrySlice
> = (set, get) => ({
  pantry: INITIAL_PANTRY,
  todaysMeal: null,
  lastMealDay: 0,
  
  addToPantryAction: (ingredientId, quantity, gameDay, source) => {
    set((state) => {
      // Find existing item or create new
      const existingIdx = state.pantry.items.findIndex(
        i => i.ingredientId === ingredientId && i.source === source
      );
      
      let newItems: PantryItem[];
      if (existingIdx >= 0) {
        // Update existing
        newItems = state.pantry.items.map((item, idx) => 
          idx === existingIdx 
            ? { ...item, quantity: item.quantity + quantity, harvestedAt: gameDay }
            : item
        );
      } else {
        // Add new
        newItems = [...state.pantry.items, {
          ingredientId,
          quantity,
          harvestedAt: gameDay,
          source,
        }];
      }
      
      return {
        pantry: { ...state.pantry, items: newItems },
      };
    });
  },
  
  buyStaple: (ingredientId) => {
    const ingredient = INGREDIENTS[ingredientId];
    if (!ingredient) return false;
    if (!STAPLE_IDS.includes(ingredientId)) return false;
    
    const state = get();
    if (!state.spendMoney(ingredient.basePrice)) return false;
    
    state.addToPantryAction(ingredientId, 1, Math.floor(Date.now() / 1000), 'bought');
    return true;
  },
  
  processDailyMeal: (gameDay) => {
    const state = get();
    const currentDay = Math.floor(gameDay);
    
    // Only cook once per day
    if (currentDay <= state.lastMealDay) return;
    
    // Use the pantry engine to auto-select and cook a meal
    const pantryState = state.pantry;
    
    // Find best meal from available ingredients
    const selectedIngredients = autoSelectMealFromState(pantryState.items, pantryState.mealHistory, currentDay);
    
    if (!selectedIngredients || selectedIngredients.length === 0) {
      // No meal possible
      set({ lastMealDay: currentDay, todaysMeal: null });
      return;
    }
    
    // Cook the meal
    const meal = cookMealFromState(
      selectedIngredients,
      pantryState,
      currentDay
    );
    
    if (meal) {
      set({
        lastMealDay: currentDay,
        todaysMeal: meal,
        pantry: {
          ...pantryState,
          items: consumeIngredients(pantryState.items, selectedIngredients),
          mealHistory: [...pantryState.mealHistory.slice(-29), meal],
          totalMealsCooked: pantryState.totalMealsCooked + 1,
        },
      });
    }
  },
});

// Helper: Auto-select meal from pantry state
function autoSelectMealFromState(
  items: PantryItem[],
  mealHistory: Meal[],
  currentDay: number
): string[] | null {
  const available = items.filter(i => i.quantity > 0);
  if (available.length === 0) return null;
  
  // Need at least a base (staple/protein)
  const bases = available.filter(i => {
    const ing = INGREDIENTS[i.ingredientId];
    return ing?.category === 'staple' || ing?.category === 'protein';
  });
  
  if (bases.length === 0) return null;
  
  // Pick a base (prefer variety - not used recently)
  const recentBases = mealHistory.slice(-3).flatMap(m => m.ingredients);
  const freshBase = bases.find(b => !recentBases.includes(b.ingredientId)) || bases[0];
  
  // Pick 1-2 toppings, prioritizing spoiling soon
  const toppings = available.filter(i => {
    const ing = INGREDIENTS[i.ingredientId];
    return ing?.category !== 'staple' && i.ingredientId !== freshBase.ingredientId;
  });
  
  // Sort by freshness (use oldest first)
  toppings.sort((a, b) => {
    const ingA = INGREDIENTS[a.ingredientId];
    const ingB = INGREDIENTS[b.ingredientId];
    if (!ingA || !ingB) return 0;
    
    const freshnessA = ingA.shelfLife === Infinity ? 1 : 
      Math.max(0, 1 - (currentDay - a.harvestedAt) / ingA.shelfLife);
    const freshnessB = ingB.shelfLife === Infinity ? 1 :
      Math.max(0, 1 - (currentDay - b.harvestedAt) / ingB.shelfLife);
    
    // Lower freshness = use first
    if (freshnessA !== freshnessB) return freshnessA - freshnessB;
    // Prefer home-grown
    if (a.source !== b.source) return a.source === 'grown' ? -1 : 1;
    return 0;
  });
  
  const selected = [freshBase.ingredientId];
  const toppingCount = Math.min(2, toppings.length);
  for (let i = 0; i < toppingCount; i++) {
    selected.push(toppings[i].ingredientId);
  }
  
  return selected;
}

// Helper: Generate meal name
function generateMealName(ingredientIds: string[], freshness: number): string {
  const ingredients = ingredientIds.map(id => INGREDIENTS[id]).filter(Boolean);
  
  const base = ingredients.find(i => i.category === 'staple' || i.category === 'protein');
  const toppings = ingredients.filter(i => i.category !== 'staple');
  
  let adjective = '';
  if (freshness >= 0.8) {
    adjective = Math.random() > 0.5 ? 'Fresh ' : 'Garden ';
  } else if (freshness < 0.5) {
    adjective = 'Day-old ';
  }
  
  const toppingNames = toppings.slice(0, 2).map(t => t.name.split(' ')[0]);
  const baseName = base?.name || 'Bowl';
  
  if (toppingNames.length === 0) {
    return `${adjective}Plain ${baseName}`;
  }
  
  return `${adjective}${toppingNames.join(' ')} ${baseName}`;
}

// Helper: Check if meal is new
function isMealNew(ingredientIds: string[], mealHistory: Meal[]): boolean {
  const sorted = [...ingredientIds].sort().join(',');
  const recentMeals = mealHistory.slice(-7);
  return !recentMeals.some(meal => {
    const mealSorted = [...meal.ingredients].sort().join(',');
    return mealSorted === sorted;
  });
}

// Helper: Calculate satisfaction
function calculateSatisfaction(
  ingredientIds: string[],
  items: PantryItem[],
  mealHistory: Meal[],
  currentDay: number
): number {
  let score = 2;
  
  let hasHomegrown = false;
  let hasFresh = false;
  let hasWilted = false;
  
  for (const id of ingredientIds) {
    const item = items.find(p => p.ingredientId === id);
    const ingredient = INGREDIENTS[id];
    if (item && ingredient) {
      const freshness = ingredient.shelfLife === Infinity ? 1 :
        Math.max(0, 1 - (currentDay - item.harvestedAt) / ingredient.shelfLife);
      
      if (item.source === 'grown') hasHomegrown = true;
      if (freshness >= 0.8) hasFresh = true;
      if (freshness < 0.5) hasWilted = true;
    }
  }
  
  if (hasFresh) score += 1;
  if (hasHomegrown) score += 1;
  if (isMealNew(ingredientIds, mealHistory)) score += 1;
  if (hasWilted) score -= 1;
  
  const lastMeal = mealHistory[mealHistory.length - 1];
  if (lastMeal) {
    const lastSorted = [...lastMeal.ingredients].sort().join(',');
    const currentSorted = [...ingredientIds].sort().join(',');
    if (lastSorted === currentSorted) score -= 1;
  }
  
  return Math.max(1, Math.min(5, score));
}

// Helper: Cook meal from state
function cookMealFromState(
  ingredientIds: string[],
  pantryState: PantryState,
  currentDay: number
): Meal | null {
  // Verify all ingredients available
  for (const id of ingredientIds) {
    const item = pantryState.items.find(i => i.ingredientId === id);
    if (!item || item.quantity < 1) return null;
  }
  
  // Calculate average freshness
  let totalFreshness = 0;
  for (const id of ingredientIds) {
    const item = pantryState.items.find(i => i.ingredientId === id);
    const ingredient = INGREDIENTS[id];
    if (item && ingredient) {
      const freshness = ingredient.shelfLife === Infinity ? 1 :
        Math.max(0, 1 - (currentDay - item.harvestedAt) / ingredient.shelfLife);
      totalFreshness += freshness;
    }
  }
  const avgFreshness = totalFreshness / ingredientIds.length;
  
  return {
    id: `meal-${currentDay}-${Date.now()}`,
    name: generateMealName(ingredientIds, avgFreshness),
    ingredients: ingredientIds,
    cookedAt: currentDay,
    satisfaction: calculateSatisfaction(ingredientIds, pantryState.items, pantryState.mealHistory, currentDay),
    isNew: isMealNew(ingredientIds, pantryState.mealHistory),
  };
}

// Helper: Consume ingredients from pantry
function consumeIngredients(items: PantryItem[], ingredientIds: string[]): PantryItem[] {
  return items
    .map(item => {
      if (ingredientIds.includes(item.ingredientId)) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    })
    .filter(item => item.quantity > 0);
}
