/**
 * Kitchen Cooking Engine Tests
 *
 * Tests for ingredient resolution, recipe discovery, meal selection,
 * and ingredient consumption.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveIngredients,
  canMakeRecipe,
  getDiscoverableRecipes,
  selectBestMeal,
  cookRecipe,
  calculateMealSavings,
  HERB_IDS,
  MUSHROOM_IDS,
} from '../../src/engine/kitchenEngine';
import { FoodItem, StapleItem, RecipeId, MealLog, getVarietyStatus } from '../../src/kitchen/types';
import { KITCHEN } from '../../src/balance';

// =============================================================================
// TEST HELPERS
// =============================================================================

let nextId = 1;

function makeFoodItem(overrides: Partial<FoodItem> & { sourceType: string }): FoodItem {
  const defaultId = `food-${nextId++}`;
  return {
    id: defaultId,
    name: overrides.name ?? overrides.sourceType,
    emoji: '🌿',
    quantity: 2,
    freshness: 1.0,
    maxFreshDays: 7,
    storedAt: 0,
    groceryValue: 3,
    sourceHobby: 'plants',
    ...overrides,
  };
}

function makeStaple(
  stapleId: StapleItem['stapleId'],
  quantity: number
): StapleItem {
  const id = `staple-${nextId++}`;
  return {
    id,
    stapleId,
    name: stapleId,
    emoji: '🍽️',
    quantity,
  };
}

// =============================================================================
// resolveIngredients
// =============================================================================

describe('resolveIngredients', () => {
  describe('specific ingredients', () => {
    it('resolves a single specific herb from storage', () => {
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 3 })];
      const result = resolveIngredients({ basil: 2 }, storage, []);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0]).toMatchObject({ id: 'basil', quantity: 2, source: 'storage' });
    });

    it('resolves a staple ingredient', () => {
      const staples = [makeStaple('pasta', 5)];
      const result = resolveIngredients({ pasta: 1 }, [], staples);
      expect(result).not.toBeNull();
      expect(result![0]).toMatchObject({ id: 'pasta', quantity: 1, source: 'staples' });
    });

    it('returns null when insufficient quantity', () => {
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
      const result = resolveIngredients({ basil: 2 }, storage, []);
      expect(result).toBeNull();
    });

    it('returns null when ingredient missing entirely', () => {
      const result = resolveIngredients({ basil: 1 }, [], []);
      expect(result).toBeNull();
    });

    it('resolves multiple specific ingredients', () => {
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 2 })];
      const staples = [
        makeStaple('pasta', 3),
        makeStaple('olive_oil', 2),
        makeStaple('garlic', 4),
      ];
      const result = resolveIngredients(
        { basil: 2, pasta: 1, olive_oil: 1, garlic: 1 },
        storage,
        staples
      );
      expect(result).not.toBeNull();
      expect(result).toHaveLength(4);
    });
  });

  describe('_anyHerb wildcard', () => {
    it('matches any single herb', () => {
      const storage = [makeFoodItem({ sourceType: 'mint', quantity: 3 })];
      const result = resolveIngredients({ _anyHerb: 1 }, storage, []);
      expect(result).not.toBeNull();
      expect(result![0]).toMatchObject({ id: 'mint', quantity: 1 });
    });

    it('can pull from multiple herb types to satisfy quantity', () => {
      const storage = [
        makeFoodItem({ sourceType: 'basil', quantity: 1 }),
        makeFoodItem({ sourceType: 'mint', quantity: 1 }),
      ];
      const result = resolveIngredients({ _anyHerb: 2 }, storage, []);
      expect(result).not.toBeNull();
      const total = result!.reduce((sum, r) => sum + r.quantity, 0);
      expect(total).toBe(2);
    });

    it('returns null if no herbs available', () => {
      const storage = [makeFoodItem({ sourceType: 'oyster', quantity: 5 })];
      const result = resolveIngredients({ _anyHerb: 1 }, storage, []);
      expect(result).toBeNull();
    });

    it('does not use mushrooms for _anyHerb', () => {
      const storage = [makeFoodItem({ sourceType: 'shiitake', quantity: 10 })];
      const result = resolveIngredients({ _anyHerb: 1 }, storage, []);
      expect(result).toBeNull();
    });
  });

  describe('_anyMushroom wildcard', () => {
    it('matches any mushroom type', () => {
      const storage = [makeFoodItem({ sourceType: 'oyster', quantity: 3 })];
      const result = resolveIngredients({ _anyMushroom: 2 }, storage, []);
      expect(result).not.toBeNull();
      expect(result![0]).toMatchObject({ id: 'oyster', quantity: 2 });
    });

    it('does not use herbs for _anyMushroom', () => {
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 10 })];
      const result = resolveIngredients({ _anyMushroom: 1 }, storage, []);
      expect(result).toBeNull();
    });
  });

  describe('_anyHerbsDistinct wildcard', () => {
    it('requires N different herb types', () => {
      const storage = [
        makeFoodItem({ sourceType: 'basil', quantity: 2 }),
        makeFoodItem({ sourceType: 'mint', quantity: 2 }),
        makeFoodItem({ sourceType: 'parsley', quantity: 2 }),
      ];
      const result = resolveIngredients({ _anyHerbsDistinct: 3 }, storage, []);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      const ids = result!.map(r => r.id);
      expect(new Set(ids).size).toBe(3);
      // Each should be quantity 1
      for (const r of result!) {
        expect(r.quantity).toBe(1);
      }
    });

    it('fails if not enough distinct types', () => {
      const storage = [
        makeFoodItem({ sourceType: 'basil', quantity: 10 }),
        makeFoodItem({ sourceType: 'mint', quantity: 10 }),
      ];
      const result = resolveIngredients({ _anyHerbsDistinct: 3 }, storage, []);
      expect(result).toBeNull();
    });
  });

  describe('_anyMushroomsDistinct wildcard', () => {
    it('requires N different mushroom types', () => {
      const storage = [
        makeFoodItem({ sourceType: 'oyster', quantity: 2 }),
        makeFoodItem({ sourceType: 'shiitake', quantity: 2 }),
      ];
      const result = resolveIngredients({ _anyMushroomsDistinct: 2 }, storage, []);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      const ids = result!.map(r => r.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  describe('mixed requirements', () => {
    it('resolves a complex recipe (garden_pasta)', () => {
      // garden_pasta: _anyHerbsDistinct: 2, _anyMushroom: 1, pasta: 1, olive_oil: 1
      const storage = [
        makeFoodItem({ sourceType: 'basil', quantity: 2 }),
        makeFoodItem({ sourceType: 'cilantro', quantity: 1 }),
        makeFoodItem({ sourceType: 'oyster', quantity: 3 }),
      ];
      const staples = [
        makeStaple('pasta', 5),
        makeStaple('olive_oil', 3),
      ];
      const result = resolveIngredients(
        { _anyHerbsDistinct: 2, _anyMushroom: 1, pasta: 1, olive_oil: 1 },
        storage,
        staples
      );
      expect(result).not.toBeNull();
    });

    it('shared resource: specific + wildcard competing for same ingredient', () => {
      // basil: 2 + _anyHerb: 1 with only 3 basil available
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 3 })];
      const result = resolveIngredients({ basil: 2, _anyHerb: 1 }, storage, []);
      expect(result).not.toBeNull();
      const totalBasil = result!.filter(r => r.id === 'basil').reduce((s, r) => s + r.quantity, 0);
      expect(totalBasil).toBe(3);
    });

    it('fails when specific leaves nothing for wildcard', () => {
      // basil: 2 + _anyHerb: 1 with only 2 basil, no other herbs
      const storage = [makeFoodItem({ sourceType: 'basil', quantity: 2 })];
      const result = resolveIngredients({ basil: 2, _anyHerb: 1 }, storage, []);
      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// canMakeRecipe
// =============================================================================

describe('canMakeRecipe', () => {
  it('returns true for herb_oil with ingredients', () => {
    // herb_oil: _anyHerb: 1, olive_oil: 1
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
    const staples = [makeStaple('olive_oil', 1)];
    expect(canMakeRecipe('herb_oil' as RecipeId, storage, staples)).toBe(true);
  });

  it('returns false when missing staple', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
    expect(canMakeRecipe('herb_oil' as RecipeId, storage, [])).toBe(false);
  });

  it('works for pesto_pasta (specific + staples)', () => {
    // pesto_pasta: basil: 2, pasta: 1, olive_oil: 1, garlic: 1
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 2 })];
    const staples = [
      makeStaple('pasta', 1),
      makeStaple('olive_oil', 1),
      makeStaple('garlic', 1),
    ];
    expect(canMakeRecipe('pesto_pasta' as RecipeId, storage, staples)).toBe(true);
  });

  it('returns false for pesto_pasta with only 1 basil', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
    const staples = [
      makeStaple('pasta', 1),
      makeStaple('olive_oil', 1),
      makeStaple('garlic', 1),
    ];
    expect(canMakeRecipe('pesto_pasta' as RecipeId, storage, staples)).toBe(false);
  });

  it('works for full_garden_feast (complex)', () => {
    // _anyHerbsDistinct: 3, _anyMushroomsDistinct: 2, pasta: 1, cheese: 1, tomatoes: 1
    const storage = [
      makeFoodItem({ sourceType: 'basil', quantity: 1 }),
      makeFoodItem({ sourceType: 'mint', quantity: 1 }),
      makeFoodItem({ sourceType: 'parsley', quantity: 1 }),
      makeFoodItem({ sourceType: 'oyster', quantity: 1 }),
      makeFoodItem({ sourceType: 'shiitake', quantity: 1 }),
    ];
    const staples = [
      makeStaple('pasta', 1),
      makeStaple('cheese', 1),
      makeStaple('tomatoes', 1),
    ];
    expect(canMakeRecipe('full_garden_feast' as RecipeId, storage, staples)).toBe(true);
  });
});

// =============================================================================
// getDiscoverableRecipes
// =============================================================================

describe('getDiscoverableRecipes', () => {
  it('returns recipes that can be made but are not discovered', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 5 })];
    const staples = [
      makeStaple('olive_oil', 5),
      makeStaple('garlic', 5),
      makeStaple('pasta', 5),
      makeStaple('tomatoes', 5),
    ];
    const discovered: RecipeId[] = [];
    const result = getDiscoverableRecipes(storage, staples, discovered);

    // Should include herb_oil at minimum (basil + olive_oil)
    expect(result).toContain('herb_oil');
    // Should include pesto_pasta (basil: 2, pasta, olive_oil, garlic)
    expect(result).toContain('pesto_pasta');
  });

  it('excludes already discovered recipes', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 5 })];
    const staples = [makeStaple('olive_oil', 5)];
    const discovered: RecipeId[] = ['herb_oil' as RecipeId];
    const result = getDiscoverableRecipes(storage, staples, discovered);
    expect(result).not.toContain('herb_oil');
  });

  it('returns empty when no recipes possible', () => {
    const result = getDiscoverableRecipes([], [], []);
    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// selectBestMeal
// =============================================================================

describe('selectBestMeal', () => {
  it('selects the highest value recipe that can be made', () => {
    // herb_oil: groceryValue 8, pesto_pasta: groceryValue 14
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 5 })];
    const staples = [
      makeStaple('olive_oil', 5),
      makeStaple('garlic', 5),
      makeStaple('pasta', 5),
    ];
    const discovered: RecipeId[] = ['herb_oil' as RecipeId, 'pesto_pasta' as RecipeId];
    const result = selectBestMeal(discovered, storage, staples);
    expect(result).toBe('pesto_pasta');
  });

  it('falls back to lower value when best cannot be made', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
    const staples = [makeStaple('olive_oil', 1)];
    // pesto_pasta needs basil: 2 — not enough
    const discovered: RecipeId[] = ['herb_oil' as RecipeId, 'pesto_pasta' as RecipeId];
    const result = selectBestMeal(discovered, storage, staples);
    expect(result).toBe('herb_oil');
  });

  it('returns null when nothing can be made', () => {
    const discovered: RecipeId[] = ['herb_oil' as RecipeId];
    const result = selectBestMeal(discovered, [], []);
    expect(result).toBeNull();
  });

  it('returns null with empty discovered list', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 10 })];
    const result = selectBestMeal([], storage, []);
    expect(result).toBeNull();
  });
});

// =============================================================================
// cookRecipe
// =============================================================================

describe('cookRecipe', () => {
  it('consumes storage ingredients', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 3, freshness: 0.8 })];
    const staples = [makeStaple('olive_oil', 2)];
    const result = cookRecipe('herb_oil' as RecipeId, storage, staples);

    expect(result).not.toBeNull();
    // basil: consumed 1, so 2 remaining
    expect(result!.updatedStorage[0].quantity).toBe(2);
    // olive_oil: consumed 1, so 1 remaining
    expect(result!.updatedStaples[0].quantity).toBe(1);
    expect(result!.ingredientsUsed.length).toBeGreaterThan(0);
  });

  it('removes depleted items from storage', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 1 })];
    const staples = [makeStaple('olive_oil', 1)];
    const result = cookRecipe('herb_oil' as RecipeId, storage, staples);

    expect(result).not.toBeNull();
    expect(result!.updatedStorage).toHaveLength(0);
    expect(result!.updatedStaples).toHaveLength(0);
  });

  it('returns null when recipe cannot be made', () => {
    const result = cookRecipe('herb_oil' as RecipeId, [], []);
    expect(result).toBeNull();
  });

  it('prioritizes oldest (lowest freshness) items first', () => {
    const storage = [
      makeFoodItem({ id: 'old-basil', sourceType: 'basil', quantity: 1, freshness: 0.3 }),
      makeFoodItem({ id: 'fresh-basil', sourceType: 'basil', quantity: 1, freshness: 0.9 }),
    ];
    const staples = [
      makeStaple('pasta', 1),
      makeStaple('olive_oil', 1),
      makeStaple('garlic', 1),
    ];
    // pesto_pasta needs basil: 2
    const result = cookRecipe('pesto_pasta' as RecipeId, storage, staples);
    expect(result).not.toBeNull();

    // Both basil items should be used, but old one first
    const basilUsed = result!.ingredientsUsed.filter(u => u.name === 'basil');
    expect(basilUsed.length).toBe(2);
    expect(basilUsed[0].itemId).toBe('old-basil');
    expect(basilUsed[1].itemId).toBe('fresh-basil');
  });

  it('does not mutate the original arrays', () => {
    const storage = [makeFoodItem({ sourceType: 'basil', quantity: 3 })];
    const staples = [makeStaple('olive_oil', 2)];
    const origStorageQty = storage[0].quantity;
    const origStapleQty = staples[0].quantity;

    cookRecipe('herb_oil' as RecipeId, storage, staples);

    expect(storage[0].quantity).toBe(origStorageQty);
    expect(staples[0].quantity).toBe(origStapleQty);
  });

  it('handles mushroom_risotto (wildcards + staples)', () => {
    // _anyMushroom: 2, rice: 1, cheese: 1, garlic: 1
    const storage = [makeFoodItem({ sourceType: 'oyster', quantity: 3 })];
    const staples = [
      makeStaple('rice', 2),
      makeStaple('cheese', 2),
      makeStaple('garlic', 2),
    ];
    const result = cookRecipe('mushroom_risotto' as RecipeId, storage, staples);
    expect(result).not.toBeNull();
    expect(result!.updatedStorage[0].quantity).toBe(1); // 3 - 2
    expect(result!.updatedStaples.find(s => s.stapleId === 'rice')!.quantity).toBe(1);
  });
});

// =============================================================================
// calculateMealSavings
// =============================================================================

function makeMealLog(overrides: Partial<MealLog>): MealLog {
  return {
    id: `meal-${nextId++}`,
    recipeId: 'herb_oil' as RecipeId,
    recipeName: 'Herb Oil',
    emoji: '🫒',
    cookedAt: 5,
    grocerySavings: 8,
    ingredientsUsed: [],
    ...overrides,
  };
}

describe('calculateMealSavings', () => {
  it('sums grocery savings from cooked meals', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, grocerySavings: 8 }),
      makeMealLog({ cookedAt: 3, grocerySavings: 14 }),
    ];
    const result = calculateMealSavings(meals, 1);
    expect(result.mealSavings).toBe(22);
    expect(result.takeoutCosts).toBe(0);
  });

  it('counts takeout costs', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, recipeId: null, grocerySavings: 0 }),
      makeMealLog({ cookedAt: 3, recipeId: null, grocerySavings: 0 }),
    ];
    const result = calculateMealSavings(meals, 1);
    expect(result.mealSavings).toBe(0);
    expect(result.takeoutCosts).toBe(KITCHEN.takeoutCost * 2);
  });

  it('ignores meals before weekStartDay', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 1, grocerySavings: 8 }),  // before week
      makeMealLog({ cookedAt: 5, grocerySavings: 14 }), // in week
    ];
    const result = calculateMealSavings(meals, 3);
    expect(result.mealSavings).toBe(14);
  });

  it('handles mixed cooked and takeout', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, grocerySavings: 10 }),
      makeMealLog({ cookedAt: 3, recipeId: null, grocerySavings: 0 }),
      makeMealLog({ cookedAt: 4, grocerySavings: 15 }),
    ];
    const result = calculateMealSavings(meals, 1);
    expect(result.mealSavings).toBe(25);
    expect(result.takeoutCosts).toBe(KITCHEN.takeoutCost);
  });

  it('returns zeros for empty history', () => {
    const result = calculateMealSavings([], 0);
    expect(result.mealSavings).toBe(0);
    expect(result.takeoutCosts).toBe(0);
  });
});

// =============================================================================
// getVarietyStatus
// =============================================================================

describe('getVarietyStatus', () => {
  it('returns no tier with 0 meals', () => {
    const result = getVarietyStatus([], 0, 5);
    expect(result.uniqueMealsThisWeek).toBe(0);
    expect(result.tierName).toBeNull();
    expect(result.efficiencyBonus).toBe(0);
  });

  it('counts unique recipes only', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: 'herb_oil' as RecipeId }), // duplicate
      makeMealLog({ cookedAt: 4, recipeId: 'pesto_pasta' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 0, 5);
    expect(result.uniqueMealsThisWeek).toBe(2);
  });

  it('excludes takeout from unique count', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: null }), // takeout
      makeMealLog({ cookedAt: 4, recipeId: 'pesto_pasta' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 0, 5);
    expect(result.uniqueMealsThisWeek).toBe(2);
  });

  it('reaches Well-Fed tier at 3 unique meals', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 2, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: 'pesto_pasta' as RecipeId }),
      makeMealLog({ cookedAt: 4, recipeId: 'simple_salad' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 0, 5);
    expect(result.tierName).toBe('Well-Fed');
    expect(result.efficiencyBonus).toBe(0.05);
  });

  it('reaches Thriving tier at 5 unique meals', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 1, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 2, recipeId: 'pesto_pasta' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: 'simple_salad' as RecipeId }),
      makeMealLog({ cookedAt: 4, recipeId: 'herb_rice' as RecipeId }),
      makeMealLog({ cookedAt: 5, recipeId: 'mushroom_risotto' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 0, 6);
    expect(result.tierName).toBe('Thriving');
    expect(result.efficiencyBonus).toBe(0.10);
  });

  it('reaches Gourmet Week at 7 unique meals', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 1, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 2, recipeId: 'pesto_pasta' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: 'simple_salad' as RecipeId }),
      makeMealLog({ cookedAt: 4, recipeId: 'herb_rice' as RecipeId }),
      makeMealLog({ cookedAt: 5, recipeId: 'mushroom_risotto' as RecipeId }),
      makeMealLog({ cookedAt: 6, recipeId: 'caprese_salad' as RecipeId }),
      makeMealLog({ cookedAt: 7, recipeId: 'tabbouleh' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 0, 8);
    expect(result.tierName).toBe('Gourmet Week');
    expect(result.efficiencyBonus).toBe(0.15);
    expect(result.discoveryBonus).toBe(2.0);
  });

  it('only counts meals after weekStartDay', () => {
    const meals: MealLog[] = [
      makeMealLog({ cookedAt: 1, recipeId: 'herb_oil' as RecipeId }),
      makeMealLog({ cookedAt: 2, recipeId: 'pesto_pasta' as RecipeId }),
      makeMealLog({ cookedAt: 3, recipeId: 'simple_salad' as RecipeId }),
      // Week reset at day 4
      makeMealLog({ cookedAt: 5, recipeId: 'herb_oil' as RecipeId }),
    ];
    const result = getVarietyStatus(meals, 4, 6);
    expect(result.uniqueMealsThisWeek).toBe(1); // only herb_oil after day 4
    expect(result.tierName).toBeNull();
  });
});
