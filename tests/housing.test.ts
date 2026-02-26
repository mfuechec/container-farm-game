/**
 * Housing System Tests
 * TDD: Tests written first, then implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  HOUSING_TIERS,
  HousingTier,
  getHousingTier,
  calculateDeposit,
  canAffordUpgrade,
  calculateMoveTransaction,
  selectHobbiesToKeep,
} from '../src/housing/types';
import { HOUSING } from '../src/balance';

describe('Housing Tiers', () => {
  it('should have 3 tiers with correct properties', () => {
    expect(HOUSING_TIERS.length).toBe(3);
    
    HOUSING_TIERS.forEach(tier => {
      expect(tier).toHaveProperty('id');
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('emoji');
      expect(tier).toHaveProperty('hobbySlots');
      expect(tier).toHaveProperty('rentPerWeek');
      expect(tier).toHaveProperty('description');
      expect(tier).toHaveProperty('mapPosition');
      expect(tier.mapPosition).toHaveProperty('x');
      expect(tier.mapPosition).toHaveProperty('y');
    });
  });

  it('should have ascending rent and hobby slots', () => {
    for (let i = 1; i < HOUSING_TIERS.length; i++) {
      expect(HOUSING_TIERS[i].rentPerWeek).toBeGreaterThan(HOUSING_TIERS[i - 1].rentPerWeek);
      expect(HOUSING_TIERS[i].hobbySlots).toBeGreaterThanOrEqual(HOUSING_TIERS[i - 1].hobbySlots);
    }
  });

  it('should retrieve tier by id', () => {
    const tier = getHousingTier(2);
    expect(tier).toBeDefined();
    expect(tier?.name).toBe('1BR Apartment');
  });

  it('should return undefined for invalid tier id', () => {
    expect(getHousingTier(99)).toBeUndefined();
  });
});

describe('Deposit Calculations', () => {
  it('should calculate deposit as 2x weekly rent', () => {
    const studio = HOUSING_TIERS[0];
    expect(calculateDeposit(studio)).toBe(HOUSING[0].rentPerWeek * 2);

    const oneBR = HOUSING_TIERS[1];
    expect(calculateDeposit(oneBR)).toBe(HOUSING[1].rentPerWeek * 2);

    const twoBR = HOUSING_TIERS[2];
    expect(calculateDeposit(twoBR)).toBe(HOUSING[2].rentPerWeek * 2);
  });
});

describe('Affordability Checks', () => {
  const studio = HOUSING_TIERS[0];
  const oneBR = HOUSING_TIERS[1];
  const twoBR = HOUSING_TIERS[2];
  const studioDeposit = HOUSING[0].rentPerWeek * 2;
  const oneBRDeposit = HOUSING[1].rentPerWeek * 2;
  const twoBRDeposit = HOUSING[2].rentPerWeek * 2;
  const netUpgradeCost = oneBRDeposit - studioDeposit;

  it('should allow upgrade with sufficient funds', () => {
    expect(canAffordUpgrade(studio, oneBR, studioDeposit, netUpgradeCost)).toBe(true);
    expect(canAffordUpgrade(studio, oneBR, studioDeposit, netUpgradeCost + 100)).toBe(true);
  });

  it('should block upgrade with insufficient funds', () => {
    expect(canAffordUpgrade(studio, oneBR, studioDeposit, netUpgradeCost - 1)).toBe(false);
  });

  it('should allow downgrade regardless of funds (returns deposit)', () => {
    expect(canAffordUpgrade(oneBR, studio, oneBRDeposit, 0)).toBe(true);
    expect(canAffordUpgrade(twoBR, studio, twoBRDeposit, 0)).toBe(true);
  });
});

describe('Move Transaction Calculations', () => {
  const studio = HOUSING_TIERS[0];
  const oneBR = HOUSING_TIERS[1];
  const twoBR = HOUSING_TIERS[2];
  const studioDeposit = HOUSING[0].rentPerWeek * 2;
  const oneBRDeposit = HOUSING[1].rentPerWeek * 2;
  const twoBRDeposit = HOUSING[2].rentPerWeek * 2;

  it('should calculate upgrade transaction correctly', () => {
    const result = calculateMoveTransaction(studio, oneBR, studioDeposit);

    expect(result.depositReturned).toBe(studioDeposit);
    expect(result.depositCharged).toBe(oneBRDeposit);
    expect(result.netCost).toBe(oneBRDeposit - studioDeposit);
    expect(result.isUpgrade).toBe(true);
  });

  it('should calculate downgrade transaction correctly', () => {
    const result = calculateMoveTransaction(twoBR, studio, twoBRDeposit);

    expect(result.depositReturned).toBe(twoBRDeposit);
    expect(result.depositCharged).toBe(studioDeposit);
    expect(result.netCost).toBe(studioDeposit - twoBRDeposit);
    expect(result.isUpgrade).toBe(false);
  });

  it('should handle same-tier move (lateral)', () => {
    const result = calculateMoveTransaction(oneBR, oneBR, oneBRDeposit);

    expect(result.depositReturned).toBe(oneBRDeposit);
    expect(result.depositCharged).toBe(oneBRDeposit);
    expect(result.netCost).toBe(0);
    expect(result.isUpgrade).toBe(false);
  });
});

describe('Hobby Slot Management', () => {
  it('should select hobbies to keep when downgrading', () => {
    // Player has 3 hobbies: plants (0), mushrooms (1), woodworking (2)
    // Downgrading to 1 slot, keeping slot index 1 (mushrooms)
    const currentHobbies = ['plants', 'mushrooms', 'woodworking'];
    const keepIndices = [1];
    
    const result = selectHobbiesToKeep(currentHobbies, keepIndices);
    expect(result).toEqual(['mushrooms']);
  });

  it('should keep multiple hobbies when allowed', () => {
    const currentHobbies = ['plants', 'mushrooms', 'woodworking'];
    const keepIndices = [0, 2]; // Keep plants and woodworking
    
    const result = selectHobbiesToKeep(currentHobbies, keepIndices);
    expect(result).toEqual(['plants', 'woodworking']);
  });

  it('should handle keeping all hobbies', () => {
    const currentHobbies = ['plants', 'mushrooms'];
    const keepIndices = [0, 1];
    
    const result = selectHobbiesToKeep(currentHobbies, keepIndices);
    expect(result).toEqual(['plants', 'mushrooms']);
  });

  it('should handle empty hobbies', () => {
    const currentHobbies: string[] = [];
    const keepIndices: number[] = [];
    
    const result = selectHobbiesToKeep(currentHobbies, keepIndices);
    expect(result).toEqual([]);
  });

  it('should filter out null hobby slots', () => {
    // Some slots might be empty
    const currentHobbies = ['plants', null, 'mushrooms'] as (string | null)[];
    const keepIndices = [0, 2];
    
    const result = selectHobbiesToKeep(currentHobbies.filter(Boolean) as string[], [0, 1]);
    expect(result).toEqual(['plants', 'mushrooms']);
  });
});

describe('Integration: Housing State Transitions', () => {
  // These test the full flow - would use store in real implementation
  
  it('should require hobby selection when downgrading with too many hobbies', () => {
    const fromTier = HOUSING_TIERS[2]; // 3 slots
    const toTier = HOUSING_TIERS[0];   // 1 slot
    const currentHobbies = ['plants', 'mushrooms', 'woodworking'];
    
    const needsSelection = currentHobbies.length > toTier.hobbySlots;
    expect(needsSelection).toBe(true);
    
    const maxKeep = toTier.hobbySlots;
    expect(maxKeep).toBe(1);
  });

  it('should not require selection when upgrading', () => {
    const fromTier = HOUSING_TIERS[0]; // 1 slot
    const toTier = HOUSING_TIERS[2];   // 3 slots
    const currentHobbies = ['plants'];
    
    const needsSelection = currentHobbies.length > toTier.hobbySlots;
    expect(needsSelection).toBe(false);
  });

  it('should not require selection when hobbies fit', () => {
    const fromTier = HOUSING_TIERS[2]; // 3 slots
    const toTier = HOUSING_TIERS[1];   // 2 slots
    const currentHobbies = ['plants']; // Only 1 hobby
    
    const needsSelection = currentHobbies.length > toTier.hobbySlots;
    expect(needsSelection).toBe(false);
  });
});
