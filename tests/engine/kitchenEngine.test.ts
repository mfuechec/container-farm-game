/**
 * Kitchen Engine Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  decayStorageItems,
  addToStorage,
  removeFromStorage,
  calculateGrocerySavings,
  getActiveKitchenBonuses,
  getBonusMultiplier,
  hasCapacity,
  tickKitchen,
  harvestToFoodItem,
} from '../../src/engine/kitchenEngine';
import { FoodItem, KitchenState } from '../../src/kitchen/types';

const baseFoodItem: FoodItem = {
  id: 'food-1',
  name: 'Basil',
  emoji: '🌿',
  quantity: 2,
  freshness: 1.0,
  maxFreshDays: 7,
  storedAt: Date.now(),
  groceryValue: 3,
  bonus: { type: 'growth', amount: 1.1 },
  sourceHobby: 'plants',
  sourceType: 'basil',
};

const baseKitchen: KitchenState = {
  capacity: 5,
  storage: [],
  staples: [],
  discoveredRecipes: [],
  mealHistory: [],
  weekStartDay: 0,
};

describe('decayStorageItems', () => {
  it('reduces freshness over time', () => {
    const items = [{ ...baseFoodItem }]; // maxFreshDays: 7
    const result = decayStorageItems(items, 1);
    // 1/7 decay rate = ~0.143 decay per day
    // 1.0 - (1/7 * 1) ≈ 0.857
    expect(result[0].freshness).toBeCloseTo(1 - (1/7), 2);
  });

  it('removes items when freshness reaches 0', () => {
    const items = [{ ...baseFoodItem, freshness: 0.05 }];
    const result = decayStorageItems(items, 1, 0.1);
    expect(result.length).toBe(0);
  });

  it('keeps items with remaining freshness', () => {
    const items = [
      { ...baseFoodItem, freshness: 0.5 },
      { ...baseFoodItem, id: 'food-2', freshness: 0.1 },
    ];
    const result = decayStorageItems(items, 1, 0.1);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('food-1');
  });
});

describe('addToStorage', () => {
  it('adds new item to empty kitchen', () => {
    const result = addToStorage(baseKitchen, baseFoodItem);
    expect(result).not.toBeNull();
    expect(result!.storage.length).toBe(1);
  });

  it('stacks same type items', () => {
    const kitchen: KitchenState = {
      ...baseKitchen,
      storage: [baseFoodItem],
    };
    const newItem: FoodItem = {
      ...baseFoodItem,
      id: 'food-2',
      quantity: 3,
      freshness: 0.8,
    };
    const result = addToStorage(kitchen, newItem);
    expect(result!.storage.length).toBe(1);
    expect(result!.storage[0].quantity).toBe(5); // 2 + 3
  });

  it('returns null when at capacity', () => {
    const fullKitchen: KitchenState = {
      ...baseKitchen,
      capacity: 2,
      storage: [
        baseFoodItem,
        { ...baseFoodItem, id: 'food-2', sourceType: 'mint', name: 'Mint' },
      ],
    };
    const newItem: FoodItem = {
      ...baseFoodItem,
      id: 'food-3',
      sourceType: 'parsley',
      name: 'Parsley',
    };
    const result = addToStorage(fullKitchen, newItem);
    expect(result).toBeNull();
  });
});

describe('removeFromStorage', () => {
  it('removes item by id', () => {
    const kitchen: KitchenState = {
      ...baseKitchen,
      storage: [baseFoodItem],
    };
    const result = removeFromStorage(kitchen, 'food-1');
    expect(result.storage.length).toBe(0);
  });

  it('keeps other items', () => {
    const kitchen: KitchenState = {
      ...baseKitchen,
      storage: [
        baseFoodItem,
        { ...baseFoodItem, id: 'food-2' },
      ],
    };
    const result = removeFromStorage(kitchen, 'food-1');
    expect(result.storage.length).toBe(1);
    expect(result.storage[0].id).toBe('food-2');
  });
});

describe('calculateGrocerySavings', () => {
  it('calculates savings based on quantity, freshness, and groceryValue', () => {
    const items: FoodItem[] = [
      { ...baseFoodItem, quantity: 2, freshness: 1.0 }, // groceryValue: 3
    ];
    // groceryValue * quantity * freshness = 3 * 2 * 1.0 = 6
    expect(calculateGrocerySavings(items)).toBe(6);
  });

  it('reduces savings for stale items', () => {
    const fresh: FoodItem[] = [{ ...baseFoodItem, quantity: 2, freshness: 1.0 }];
    const stale: FoodItem[] = [{ ...baseFoodItem, quantity: 2, freshness: 0.5 }];
    expect(calculateGrocerySavings(stale)).toBeLessThan(
      calculateGrocerySavings(fresh)
    );
  });

  it('sums multiple items', () => {
    const items: FoodItem[] = [
      { ...baseFoodItem, quantity: 1, freshness: 1.0 }, // groceryValue: 3
      { ...baseFoodItem, id: 'food-2', quantity: 1, freshness: 1.0 }, // groceryValue: 3
    ];
    // 3 * 1 * 1 + 3 * 1 * 1 = 6
    expect(calculateGrocerySavings(items)).toBe(6);
  });
});

describe('hasCapacity', () => {
  it('returns true when storage has room', () => {
    expect(hasCapacity(baseKitchen)).toBe(true);
  });

  it('returns false when full', () => {
    const fullKitchen: KitchenState = {
      ...baseKitchen,
      capacity: 1,
      storage: [baseFoodItem],
    };
    expect(hasCapacity(fullKitchen)).toBe(false);
  });
});

describe('tickKitchen', () => {
  it('decays all items', () => {
    const kitchen: KitchenState = {
      ...baseKitchen,
      storage: [{ ...baseFoodItem, freshness: 1.0 }],
    };
    const result = tickKitchen(kitchen, 2);
    expect(result.storage[0].freshness).toBeLessThan(1.0);
  });
});

describe('harvestToFoodItem', () => {
  it('creates food item from harvest data', () => {
    const result = harvestToFoodItem('harvest-1', 'basil', 3, 0.9);
    expect(result.sourceType).toBe('basil');
    expect(result.quantity).toBe(3);
    expect(result.freshness).toBe(0.9);
    expect(result.name).toBe('Basil');
    expect(result.sourceHobby).toBe('plants');
  });
});
