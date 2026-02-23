/**
 * Mushroom Growth Tests
 * 
 * Tests mushroom stage transitions, yield calculations, and environmental factors.
 */

import { describe, it, expect } from 'vitest';
import {
  MushroomInstance,
  MushroomStage,
  MUSHROOM_TYPES,
  getMushroomType,
  getMushroomStage,
  generateMushroomId,
  calculateMushroomYield,
  createMushroomInstance,
} from '../src/hobbies/mushrooms/types';
import {
  calculateMushroomGrowth,
  getStageRequiredDays,
  isEnvironmentOptimal,
} from '../src/engine/mushroomEngine';

describe('Mushroom Types', () => {
  it('should have correct mushroom types defined', () => {
    expect(MUSHROOM_TYPES).toHaveLength(3);
    expect(MUSHROOM_TYPES.map(m => m.id)).toEqual(['oyster', 'shiitake', 'lions_mane']);
  });

  it('should get mushroom type by id', () => {
    const oyster = getMushroomType('oyster');
    expect(oyster).toBeDefined();
    expect(oyster!.name).toBe('Oyster Mushroom');
    expect(oyster!.difficulty).toBe('easy');
    
    const unknown = getMushroomType('unknown');
    expect(unknown).toBeUndefined();
  });

  it('oyster should have fastest growth cycle', () => {
    const oyster = getMushroomType('oyster')!;
    const shiitake = getMushroomType('shiitake')!;
    const lionsMane = getMushroomType('lions_mane')!;
    
    expect(oyster.daysToMature).toBeLessThan(shiitake.daysToMature);
    expect(shiitake.daysToMature).toBeLessThan(lionsMane.daysToMature);
  });
});

describe('Mushroom Stages', () => {
  it('should return correct stage based on progress', () => {
    expect(getMushroomStage(0)).toBe('inoculation');
    expect(getMushroomStage(0.05)).toBe('inoculation');
    expect(getMushroomStage(0.15)).toBe('colonization');
    expect(getMushroomStage(0.5)).toBe('colonization');
    expect(getMushroomStage(0.65)).toBe('pinning');
    expect(getMushroomStage(0.75)).toBe('pinning');
    expect(getMushroomStage(0.85)).toBe('fruiting');
    expect(getMushroomStage(0.95)).toBe('fruiting');
    expect(getMushroomStage(1.0)).toBe('harvestable');
  });

  it('should have 5 distinct stages', () => {
    const stages: MushroomStage[] = ['inoculation', 'colonization', 'pinning', 'fruiting', 'harvestable'];
    const progressPoints = [0, 0.2, 0.65, 0.85, 1.0];
    
    progressPoints.forEach((progress, i) => {
      expect(getMushroomStage(progress)).toBe(stages[i]);
    });
  });
});

describe('Mushroom Growth', () => {
  it('should grow mushroom over time', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    const oyster = getMushroomType('oyster')!;
    
    // Grow for 1 day with optimal conditions
    const grown = calculateMushroomGrowth(mushroom, 1, { humidity: 85, temperature: 70, freshAir: true });
    
    // Expected progress: 1 day / daysToMature
    const expectedProgress = 1 / oyster.daysToMature;
    expect(grown.growthProgress).toBeCloseTo(expectedProgress, 2);
  });

  it('should apply synergy boost to growth', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    const boosted = { ...mushroom, synergyBoost: 0.2 }; // 20% boost from compost
    
    const normal = calculateMushroomGrowth(mushroom, 1, { humidity: 85, temperature: 70, freshAir: true });
    const withBoost = calculateMushroomGrowth(boosted, 1, { humidity: 85, temperature: 70, freshAir: true });
    
    expect(withBoost.growthProgress).toBeGreaterThan(normal.growthProgress);
    expect(withBoost.growthProgress).toBeCloseTo(normal.growthProgress * 1.2, 3);
  });

  it('should slow growth with suboptimal humidity', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    
    const optimal = calculateMushroomGrowth(mushroom, 1, { humidity: 85, temperature: 70, freshAir: true });
    const lowHumidity = calculateMushroomGrowth(mushroom, 1, { humidity: 50, temperature: 70, freshAir: true });
    
    expect(lowHumidity.growthProgress).toBeLessThan(optimal.growthProgress);
  });

  it('should update stage when progress thresholds are crossed', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    const oyster = getMushroomType('oyster')!;
    
    // Grow for enough days to reach colonization
    const daysToColonization = Math.ceil(oyster.daysToMature * 0.15);
    const grown = calculateMushroomGrowth(mushroom, daysToColonization, { humidity: 85, temperature: 70, freshAir: true });
    
    expect(grown.stage).toBe('colonization');
  });
});

describe('Environment Factors', () => {
  it('should recognize optimal conditions', () => {
    expect(isEnvironmentOptimal({ humidity: 85, temperature: 70, freshAir: true })).toBe(true);
    expect(isEnvironmentOptimal({ humidity: 75, temperature: 68, freshAir: true })).toBe(true);
  });

  it('should recognize suboptimal humidity', () => {
    expect(isEnvironmentOptimal({ humidity: 50, temperature: 70, freshAir: true })).toBe(false);
    expect(isEnvironmentOptimal({ humidity: 95, temperature: 70, freshAir: true })).toBe(false);
  });

  it('should recognize suboptimal temperature', () => {
    expect(isEnvironmentOptimal({ humidity: 85, temperature: 50, freshAir: true })).toBe(false);
    expect(isEnvironmentOptimal({ humidity: 85, temperature: 90, freshAir: true })).toBe(false);
  });

  it('should recognize lack of fresh air', () => {
    expect(isEnvironmentOptimal({ humidity: 85, temperature: 70, freshAir: false })).toBe(false);
  });
});

describe('Yield Calculation', () => {
  it('should calculate yield based on environment history', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    const fullGrown: MushroomInstance = {
      ...mushroom,
      growthProgress: 1.0,
      stage: 'harvestable',
      environmentScore: 1.0, // Perfect conditions throughout
    };
    
    const oyster = getMushroomType('oyster')!;
    const yield_ = calculateMushroomYield(fullGrown);
    
    expect(yield_).toBeCloseTo(oyster.yieldAmount, 1);
  });

  it('should reduce yield with poor environment score', () => {
    const mushroom = createMushroomInstance('oyster', 0);
    const poorConditions: MushroomInstance = {
      ...mushroom,
      growthProgress: 1.0,
      stage: 'harvestable',
      environmentScore: 0.5, // 50% optimal conditions
    };
    
    const oyster = getMushroomType('oyster')!;
    const yield_ = calculateMushroomYield(poorConditions);
    
    // Yield should be reduced proportionally
    expect(yield_).toBeLessThan(oyster.yieldAmount);
    expect(yield_).toBeGreaterThan(oyster.yieldAmount * 0.4); // At least 40% of max
  });
});

describe('ID Generation', () => {
  it('should generate unique mushroom IDs', () => {
    const id1 = generateMushroomId();
    const id2 = generateMushroomId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^mushroom_\d+_\d+$/);
  });
});
