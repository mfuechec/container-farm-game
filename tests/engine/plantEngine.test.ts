/**
 * Plant Engine Unit Tests
 * 
 * Run with: npx vitest run tests/engine/plantEngine.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGrowth,
  calculateHarvest,
  calculateSellPrice,
  getGrowthStage,
  decayFreshness,
  canPlant,
  createPlant,
} from '../../src/engine/plantEngine';
import { PlantInstance, HarvestedPlant, PLANT_TYPES } from '../../src/hobbies/plants/types';

describe('getGrowthStage', () => {
  it('returns seed for low progress', () => {
    expect(getGrowthStage(0)).toBe('seed');
    expect(getGrowthStage(0.1)).toBe('seed');
    expect(getGrowthStage(0.19)).toBe('seed');
  });

  it('returns sprout for medium-low progress', () => {
    expect(getGrowthStage(0.2)).toBe('sprout');
    expect(getGrowthStage(0.4)).toBe('sprout');
    expect(getGrowthStage(0.59)).toBe('sprout');
  });

  it('returns growing for medium-high progress', () => {
    expect(getGrowthStage(0.6)).toBe('growing');
    expect(getGrowthStage(0.8)).toBe('growing');
    expect(getGrowthStage(0.99)).toBe('growing');
  });

  it('returns harvestable at 100%', () => {
    expect(getGrowthStage(1.0)).toBe('harvestable');
  });
});

describe('calculateGrowth', () => {
  const basePlant: PlantInstance = {
    id: 'test-plant',
    typeId: 'basil', // 7 days to mature
    growthProgress: 0,
    stage: 'seed',
    plantedAt: Date.now(),
  };

  it('grows plant by correct amount per day', () => {
    // Basil takes 7 days, so 1 day = ~14.3% growth
    const result = calculateGrowth(basePlant, 1);
    expect(result.growthProgress).toBeCloseTo(1 / 7, 2);
  });

  it('updates stage when crossing thresholds', () => {
    const result = calculateGrowth(basePlant, 2); // ~28% → sprout
    expect(result.stage).toBe('sprout');
  });

  it('applies light boost', () => {
    const withBoost = calculateGrowth(basePlant, 1, 1.5);
    const withoutBoost = calculateGrowth(basePlant, 1, 1.0);
    expect(withBoost.growthProgress).toBeGreaterThan(withoutBoost.growthProgress);
  });

  it('applies kitchen bonus', () => {
    const withBonus = calculateGrowth(basePlant, 1, 1.0, 1.2);
    const withoutBonus = calculateGrowth(basePlant, 1, 1.0, 1.0);
    expect(withBonus.growthProgress).toBeGreaterThan(withoutBonus.growthProgress);
  });

  it('caps growth at 100%', () => {
    const result = calculateGrowth(basePlant, 100); // Way more than needed
    expect(result.growthProgress).toBe(1);
    expect(result.stage).toBe('harvestable');
  });

  it('does not change harvestable plants', () => {
    const harvestablePlant: PlantInstance = {
      ...basePlant,
      growthProgress: 1,
      stage: 'harvestable',
    };
    const result = calculateGrowth(harvestablePlant, 1);
    expect(result.growthProgress).toBe(1);
  });
});

describe('calculateHarvest', () => {
  const maturePlant: PlantInstance = {
    id: 'test-plant',
    typeId: 'basil',
    growthProgress: 1,
    stage: 'harvestable',
    plantedAt: Date.now(),
  };

  it('returns harvest data for harvestable plant', () => {
    const result = calculateHarvest(maturePlant);
    expect(result).not.toBeNull();
    expect(result!.typeId).toBe('basil');
    expect(result!.freshness).toBe(1.0);
  });

  it('returns null for non-harvestable plant', () => {
    const immaturePlant: PlantInstance = {
      ...maturePlant,
      growthProgress: 0.5,
      stage: 'growing',
    };
    expect(calculateHarvest(immaturePlant)).toBeNull();
  });

  it('applies yield multiplier', () => {
    const normal = calculateHarvest(maturePlant, 1.0);
    const boosted = calculateHarvest(maturePlant, 1.5);
    expect(boosted!.quantity).toBeGreaterThan(normal!.quantity);
  });
});

describe('calculateSellPrice', () => {
  it('calculates price based on quantity and freshness', () => {
    const harvest: HarvestedPlant = {
      id: 'test',
      typeId: 'basil',
      quantity: 3,
      freshness: 1.0,
      harvestedAt: Date.now(),
    };
    // sellPrice × quantity × freshness
    const { sellPrice } = PLANT_TYPES.find(p => p.id === 'basil')!;
    expect(calculateSellPrice(harvest)).toBe(sellPrice * 3 * 1.0);
  });

  it('reduces price for lower freshness', () => {
    const fresh: HarvestedPlant = {
      id: 'test1',
      typeId: 'basil',
      quantity: 3,
      freshness: 1.0,
      harvestedAt: Date.now(),
    };
    const stale: HarvestedPlant = {
      id: 'test2',
      typeId: 'basil',
      quantity: 3,
      freshness: 0.5,
      harvestedAt: Date.now(),
    };
    expect(calculateSellPrice(stale)).toBeLessThan(calculateSellPrice(fresh));
  });
});

describe('decayFreshness', () => {
  it('reduces freshness over time', () => {
    expect(decayFreshness(1.0, 1, 0.1)).toBe(0.9);
    expect(decayFreshness(1.0, 5, 0.1)).toBe(0.5);
  });

  it('never goes below 0', () => {
    expect(decayFreshness(0.1, 10, 0.1)).toBe(0);
  });
});

describe('canPlant', () => {
  it('returns true when seeds available and pot empty', () => {
    expect(canPlant(3, false)).toBe(true);
  });

  it('returns false when no seeds', () => {
    expect(canPlant(0, false)).toBe(false);
  });

  it('returns false when pot has plant', () => {
    expect(canPlant(3, true)).toBe(false);
  });
});

describe('createPlant', () => {
  it('creates a new plant with correct initial state', () => {
    const plant = createPlant('basil');
    expect(plant.typeId).toBe('basil');
    expect(plant.growthProgress).toBe(0);
    expect(plant.stage).toBe('seed');
    expect(plant.id).toContain('plant-');
  });
});
