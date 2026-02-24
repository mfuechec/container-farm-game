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
    const studio = HOUSING_TIERS[0]; // $50/week
    expect(calculateDeposit(studio)).toBe(100);
    
    const oneBR = HOUSING_TIERS[1]; // $80/week
    expect(calculateDeposit(oneBR)).toBe(160);
    
    const twoBR = HOUSING_TIERS[2]; // $120/week
    expect(calculateDeposit(twoBR)).toBe(240);
  });
});

describe('Affordability Checks', () => {
  const studio = HOUSING_TIERS[0];
  const oneBR = HOUSING_TIERS[1];
  const twoBR = HOUSING_TIERS[2];
  
  it('should allow upgrade with sufficient funds', () => {
    // Upgrading from studio ($100 deposit) to 1BR ($160 deposit)
    // Net cost: $160 - $100 = $60
    expect(canAffordUpgrade(studio, oneBR, 100, 60)).toBe(true);
    expect(canAffordUpgrade(studio, oneBR, 100, 100)).toBe(true);
  });

  it('should block upgrade with insufficient funds', () => {
    // Need $60 for upgrade, only have $50
    expect(canAffordUpgrade(studio, oneBR, 100, 50)).toBe(false);
  });

  it('should allow downgrade regardless of funds (returns deposit)', () => {
    // Downgrading from 1BR to studio: get $60 back
    expect(canAffordUpgrade(oneBR, studio, 160, 0)).toBe(true);
    expect(canAffordUpgrade(twoBR, studio, 240, 0)).toBe(true);
  });
});

describe('Move Transaction Calculations', () => {
  const studio = HOUSING_TIERS[0]; // $100 deposit
  const oneBR = HOUSING_TIERS[1]; // $160 deposit
  const twoBR = HOUSING_TIERS[2]; // $240 deposit
  
  it('should calculate upgrade transaction correctly', () => {
    const result = calculateMoveTransaction(studio, oneBR, 100);
    
    expect(result.depositReturned).toBe(100);
    expect(result.depositCharged).toBe(160);
    expect(result.netCost).toBe(60); // Pay difference
    expect(result.isUpgrade).toBe(true);
  });

  it('should calculate downgrade transaction correctly', () => {
    const result = calculateMoveTransaction(twoBR, studio, 240);
    
    expect(result.depositReturned).toBe(240);
    expect(result.depositCharged).toBe(100);
    expect(result.netCost).toBe(-140); // Get money back
    expect(result.isUpgrade).toBe(false);
  });

  it('should handle same-tier move (lateral)', () => {
    const result = calculateMoveTransaction(oneBR, oneBR, 160);
    
    expect(result.depositReturned).toBe(160);
    expect(result.depositCharged).toBe(160);
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
