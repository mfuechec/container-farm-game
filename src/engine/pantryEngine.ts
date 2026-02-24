/**
 * Pantry & Meal System
 * 
 * Phase 1: Auto-cook - harvest goes to pantry, game generates daily meals
 */

// =============================================================================
// TYPES
// =============================================================================

export type IngredientCategory = 'herb' | 'mushroom' | 'staple' | 'vegetable' | 'protein';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  icon: string;
  shelfLife: number;          // Days before spoiling (Infinity for staples)
  basePrice: number;
  flavorTags: string[];
}

export interface PantryItem {
  ingredientId: string;
  quantity: number;
  harvestedAt: number;        // Game day
  source: 'grown' | 'bought';
}

export interface Meal {
  id: string;
  name: string;
  ingredients: string[];      // ingredientIds
  cookedAt: number;           // Game day
  satisfaction: number;       // 1-5
  isNew: boolean;             // First time making this combo
}

export interface PantryState {
  items: PantryItem[];
  mealHistory: Meal[];
  totalMealsCooked: number;
}

// =============================================================================
// INGREDIENT DATABASE
// =============================================================================

export const INGREDIENTS: Record<string, Ingredient> = {
  // Herbs (from plant hobby)
  basil: {
    id: 'basil',
    name: 'Basil',
    category: 'herb',
    icon: '🌿',
    shelfLife: 5,
    basePrice: 2,
    flavorTags: ['aromatic', 'fresh', 'italian'],
  },
  cilantro: {
    id: 'cilantro',
    name: 'Cilantro',
    category: 'herb',
    icon: '🌿',
    shelfLife: 4,
    basePrice: 2,
    flavorTags: ['aromatic', 'fresh', 'mexican'],
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    category: 'herb',
    icon: '🌿',
    shelfLife: 5,
    basePrice: 2,
    flavorTags: ['aromatic', 'fresh', 'cool'],
  },
  rosemary: {
    id: 'rosemary',
    name: 'Rosemary',
    category: 'herb',
    icon: '🌿',
    shelfLife: 7,
    basePrice: 2,
    flavorTags: ['aromatic', 'woody', 'savory'],
  },
  thyme: {
    id: 'thyme',
    name: 'Thyme',
    category: 'herb',
    icon: '🌿',
    shelfLife: 7,
    basePrice: 2,
    flavorTags: ['aromatic', 'earthy', 'savory'],
  },

  // Mushrooms (from mushroom hobby)
  oyster: {
    id: 'oyster',
    name: 'Oyster Mushroom',
    category: 'mushroom',
    icon: '🍄',
    shelfLife: 5,
    basePrice: 4,
    flavorTags: ['earthy', 'umami', 'delicate'],
  },
  shiitake: {
    id: 'shiitake',
    name: 'Shiitake',
    category: 'mushroom',
    icon: '🍄',
    shelfLife: 7,
    basePrice: 5,
    flavorTags: ['earthy', 'umami', 'rich'],
  },
  lionsmane: {
    id: 'lionsmane',
    name: "Lion's Mane",
    category: 'mushroom',
    icon: '🍄',
    shelfLife: 5,
    basePrice: 6,
    flavorTags: ['seafood', 'delicate', 'umami'],
  },

  // Staples (always available to buy)
  rice: {
    id: 'rice',
    name: 'Rice',
    category: 'staple',
    icon: '🍚',
    shelfLife: Infinity,
    basePrice: 1,
    flavorTags: ['neutral', 'filling'],
  },
  pasta: {
    id: 'pasta',
    name: 'Pasta',
    category: 'staple',
    icon: '🍝',
    shelfLife: Infinity,
    basePrice: 1,
    flavorTags: ['neutral', 'filling'],
  },
  eggs: {
    id: 'eggs',
    name: 'Eggs',
    category: 'protein',
    icon: '🥚',
    shelfLife: 14,
    basePrice: 2,
    flavorTags: ['rich', 'protein', 'versatile'],
  },
  garlic: {
    id: 'garlic',
    name: 'Garlic',
    category: 'vegetable',
    icon: '🧄',
    shelfLife: 30,
    basePrice: 0.5,
    flavorTags: ['pungent', 'savory', 'aromatic'],
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    category: 'vegetable',
    icon: '🧅',
    shelfLife: 30,
    basePrice: 0.5,
    flavorTags: ['savory', 'sweet', 'aromatic'],
  },
  butter: {
    id: 'butter',
    name: 'Butter',
    category: 'staple',
    icon: '🧈',
    shelfLife: 21,
    basePrice: 1,
    flavorTags: ['rich', 'creamy'],
  },
  oliveoil: {
    id: 'oliveoil',
    name: 'Olive Oil',
    category: 'staple',
    icon: '🫒',
    shelfLife: Infinity,
    basePrice: 1,
    flavorTags: ['rich', 'mediterranean'],
  },
};

export const STAPLE_IDS = ['rice', 'pasta', 'eggs', 'garlic', 'onion', 'butter', 'oliveoil'];

// =============================================================================
// PANTRY OPERATIONS
// =============================================================================

let state: PantryState = {
  items: [],
  mealHistory: [],
  totalMealsCooked: 0,
};

export function getPantryState(): PantryState {
  return { ...state, items: [...state.items], mealHistory: [...state.mealHistory] };
}

export function resetPantry(): void {
  state = {
    items: [],
    mealHistory: [],
    totalMealsCooked: 0,
  };
}

/**
 * Add ingredient to pantry (from harvest or purchase)
 */
export function addToPantry(
  ingredientId: string,
  quantity: number,
  gameDay: number,
  source: 'grown' | 'bought'
): void {
  const existing = state.items.find(
    item => item.ingredientId === ingredientId && item.source === source
  );

  if (existing) {
    existing.quantity += quantity;
    // Update harvest date to newest (simplification)
    existing.harvestedAt = gameDay;
  } else {
    state.items.push({
      ingredientId,
      quantity,
      harvestedAt: gameDay,
      source,
    });
  }
}

/**
 * Remove ingredient from pantry
 */
export function removeFromPantry(ingredientId: string, quantity: number): boolean {
  const item = state.items.find(i => i.ingredientId === ingredientId);
  if (!item || item.quantity < quantity) return false;

  item.quantity -= quantity;
  if (item.quantity <= 0) {
    state.items = state.items.filter(i => i !== item);
  }
  return true;
}

/**
 * Get freshness of a pantry item (0-1)
 */
export function getFreshness(item: PantryItem, currentDay: number): number {
  const ingredient = INGREDIENTS[item.ingredientId];
  if (!ingredient || ingredient.shelfLife === Infinity) return 1;

  const age = currentDay - item.harvestedAt;
  const freshness = 1 - (age / ingredient.shelfLife);
  return Math.max(0, Math.min(1, freshness));
}

/**
 * Check what's about to spoil
 */
export function getSpoilingSoon(currentDay: number, withinDays: number = 2): PantryItem[] {
  return state.items.filter(item => {
    const ingredient = INGREDIENTS[item.ingredientId];
    if (!ingredient || ingredient.shelfLife === Infinity) return false;

    const daysLeft = ingredient.shelfLife - (currentDay - item.harvestedAt);
    return daysLeft <= withinDays && daysLeft > 0;
  });
}

// =============================================================================
// MEAL GENERATION
// =============================================================================

/**
 * Generate a meal name from ingredients
 */
export function generateMealName(ingredientIds: string[], freshness: number): string {
  const ingredients = ingredientIds.map(id => INGREDIENTS[id]).filter(Boolean);

  // Find base (staple/protein)
  const base = ingredients.find(i => i.category === 'staple' || i.category === 'protein');
  const toppings = ingredients.filter(i => i.category !== 'staple');

  // Freshness adjective
  let adjective = '';
  if (freshness >= 0.8) {
    adjective = Math.random() > 0.5 ? 'Fresh ' : 'Garden ';
  } else if (freshness < 0.5) {
    adjective = 'Day-old ';
  }

  // Build name
  const toppingNames = toppings.slice(0, 2).map(t => t.name.split(' ')[0]);
  const baseName = base?.name || 'Bowl';

  if (toppingNames.length === 0) {
    return `${adjective}Plain ${baseName}`;
  }

  return `${adjective}${toppingNames.join(' ')} ${baseName}`;
}

/**
 * Check if this meal combination has been made before (last 7 days)
 */
function isMealNew(ingredientIds: string[]): boolean {
  const sorted = [...ingredientIds].sort().join(',');
  const recentMeals = state.mealHistory.slice(-7);

  return !recentMeals.some(meal => {
    const mealSorted = [...meal.ingredients].sort().join(',');
    return mealSorted === sorted;
  });
}

/**
 * Calculate meal satisfaction (1-5)
 */
export function calculateSatisfaction(
  ingredientIds: string[],
  pantryItems: PantryItem[],
  currentDay: number
): number {
  let score = 2; // Base

  // Check freshness and source
  let hasHomegrown = false;
  let hasFresh = false;
  let hasWilted = false;

  for (const id of ingredientIds) {
    const item = pantryItems.find(p => p.ingredientId === id);
    if (item) {
      const freshness = getFreshness(item, currentDay);
      if (item.source === 'grown') hasHomegrown = true;
      if (freshness >= 0.8) hasFresh = true;
      if (freshness < 0.5) hasWilted = true;
    }
  }

  if (hasFresh) score += 1;
  if (hasHomegrown) score += 1;
  if (isMealNew(ingredientIds)) score += 1;
  if (hasWilted) score -= 1;

  // Check if same as yesterday
  const lastMeal = state.mealHistory[state.mealHistory.length - 1];
  if (lastMeal) {
    const lastSorted = [...lastMeal.ingredients].sort().join(',');
    const currentSorted = [...ingredientIds].sort().join(',');
    if (lastSorted === currentSorted) score -= 1;
  }

  return Math.max(1, Math.min(5, score));
}

/**
 * Auto-select ingredients for a meal from pantry
 * Prioritizes: spoiling soon > home-grown > variety
 */
export function autoSelectMeal(currentDay: number): string[] | null {
  const available = state.items.filter(i => i.quantity > 0);
  if (available.length === 0) return null;

  // Need at least a base
  const bases = available.filter(i => {
    const ing = INGREDIENTS[i.ingredientId];
    return ing?.category === 'staple' || ing?.category === 'protein';
  });

  if (bases.length === 0) return null;

  // Pick a base (prefer variety)
  const recentBases = state.mealHistory.slice(-3).flatMap(m => m.ingredients);
  const freshBase = bases.find(b => !recentBases.includes(b.ingredientId)) || bases[0];

  // Pick 1-2 toppings, prioritizing spoiling soon
  const toppings = available.filter(i => {
    const ing = INGREDIENTS[i.ingredientId];
    return ing?.category !== 'staple' && i.ingredientId !== freshBase.ingredientId;
  });

  // Sort by: spoiling soon first, then home-grown
  toppings.sort((a, b) => {
    const freshnessA = getFreshness(a, currentDay);
    const freshnessB = getFreshness(b, currentDay);
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

/**
 * Cook a meal (consumes ingredients, records history)
 */
export function cookMeal(ingredientIds: string[], currentDay: number): Meal | null {
  // Verify all ingredients available
  for (const id of ingredientIds) {
    const item = state.items.find(i => i.ingredientId === id);
    if (!item || item.quantity < 1) return null;
  }

  // Calculate average freshness for name
  let totalFreshness = 0;
  const items = ingredientIds.map(id => state.items.find(i => i.ingredientId === id)!);
  for (const item of items) {
    totalFreshness += getFreshness(item, currentDay);
  }
  const avgFreshness = totalFreshness / items.length;

  // Create meal
  const meal: Meal = {
    id: `meal-${Date.now()}`,
    name: generateMealName(ingredientIds, avgFreshness),
    ingredients: ingredientIds,
    cookedAt: currentDay,
    satisfaction: calculateSatisfaction(ingredientIds, items, currentDay),
    isNew: isMealNew(ingredientIds),
  };

  // Consume ingredients
  for (const id of ingredientIds) {
    removeFromPantry(id, 1);
  }

  // Record history
  state.mealHistory.push(meal);
  state.totalMealsCooked++;

  // Keep only last 30 days
  if (state.mealHistory.length > 30) {
    state.mealHistory = state.mealHistory.slice(-30);
  }

  return meal;
}

// =============================================================================
// VARIETY TRACKING
// =============================================================================

export interface VarietyStats {
  uniqueIngredientsThisWeek: number;
  uniqueMealsThisWeek: number;
  currentStreak: number;          // Days with different meals
  suggestion?: string;
}

export function getVarietyStats(currentDay: number): VarietyStats {
  const weekMeals = state.mealHistory.filter(m => currentDay - m.cookedAt < 7);

  const uniqueIngredients = new Set(weekMeals.flatMap(m => m.ingredients));
  const uniqueMealCombos = new Set(
    weekMeals.map(m => [...m.ingredients].sort().join(','))
  );

  // Calculate streak
  let streak = 0;
  const sorted = [...state.mealHistory].reverse();
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = [...sorted[i].ingredients].sort().join(',');
    const previous = [...sorted[i + 1].ingredients].sort().join(',');
    if (current !== previous) {
      streak++;
    } else {
      break;
    }
  }

  // Generate suggestion
  let suggestion: string | undefined;

  const spoiling = getSpoilingSoon(currentDay);
  if (spoiling.length > 0) {
    const item = INGREDIENTS[spoiling[0].ingredientId];
    suggestion = `Your ${item?.name} is getting old — use it tonight!`;
  } else if (weekMeals.length >= 3) {
    // Check for repetition
    const lastThree = weekMeals.slice(-3);
    const bases = lastThree.map(m => {
      const baseId = m.ingredients.find(id => {
        const ing = INGREDIENTS[id];
        return ing?.category === 'staple';
      });
      return baseId;
    });
    if (bases[0] && bases[0] === bases[1] && bases[1] === bases[2]) {
      const baseName = INGREDIENTS[bases[0]]?.name || 'that';
      suggestion = `You've had ${baseName} 3 days in a row — switch it up?`;
    }
  }

  return {
    uniqueIngredientsThisWeek: uniqueIngredients.size,
    uniqueMealsThisWeek: uniqueMealCombos.size,
    currentStreak: streak,
    suggestion,
  };
}

// =============================================================================
// SAVE/LOAD
// =============================================================================

export function serializePantry(): PantryState {
  return { ...state };
}

export function deserializePantry(saved: PantryState): void {
  state = {
    items: saved.items || [],
    mealHistory: saved.mealHistory || [],
    totalMealsCooked: saved.totalMealsCooked || 0,
  };
}
