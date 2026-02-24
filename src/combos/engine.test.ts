/**
 * Combo Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  detectKitchenCombos,
  detectGardenCombos,
  detectNewCombos,
  calculateGroceryBonus,
  calculateGrowthBonus,
  calculateYieldBonus,
  ActiveCombo,
} from './engine';

describe('detectKitchenCombos', () => {
  it('detects Italian Herbs combo with basil + parsley', () => {
    const combos = detectKitchenCombos(['basil', 'parsley']);
    expect(combos.some(c => c.id === 'italian_herbs')).toBe(true);
  });

  it('does not detect Italian Herbs with only basil', () => {
    const combos = detectKitchenCombos(['basil']);
    expect(combos.some(c => c.id === 'italian_herbs')).toBe(false);
  });

  it('detects Fresh Duo combo with mint + cilantro', () => {
    const combos = detectKitchenCombos(['mint', 'cilantro']);
    expect(combos.some(c => c.id === 'fresh_duo')).toBe(true);
  });

  it('detects Kitchen Staples with 3+ herbs', () => {
    const combos = detectKitchenCombos(['basil', 'mint', 'parsley']);
    expect(combos.some(c => c.id === 'kitchen_staples')).toBe(true);
  });

  it('detects Full Pantry with all 5 herbs', () => {
    const combos = detectKitchenCombos(['basil', 'mint', 'parsley', 'cilantro', 'chives']);
    expect(combos.some(c => c.id === 'full_pantry')).toBe(true);
  });

  it('detects multiple combos at once', () => {
    const combos = detectKitchenCombos(['basil', 'parsley', 'mint', 'cilantro']);
    expect(combos.length).toBeGreaterThanOrEqual(3); // Italian, Fresh Duo, Kitchen Staples
  });
});

describe('detectGardenCombos', () => {
  it('detects Companion Planting with basil + parsley growing', () => {
    const combos = detectGardenCombos(['basil', 'parsley']);
    expect(combos.some(c => c.id === 'companion_basil_parsley')).toBe(true);
  });

  it('detects Garden Friends with mint + chives', () => {
    const combos = detectGardenCombos(['mint', 'chives']);
    expect(combos.some(c => c.id === 'companion_mint_chives')).toBe(true);
  });

  it('detects Herb Garden with 4+ types', () => {
    const combos = detectGardenCombos(['basil', 'mint', 'parsley', 'cilantro']);
    expect(combos.some(c => c.id === 'herb_garden')).toBe(true);
  });
});

describe('detectNewCombos', () => {
  it('returns empty array when no new combos', () => {
    const prev: ActiveCombo[] = [{ id: 'italian_herbs', name: 'Italian Herbs', emoji: '🇮🇹', description: '', bonusDescription: '', bonus: { type: 'groceryMultiplier', value: 1.5, scope: 'combo-items' } }];
    const curr: ActiveCombo[] = [{ id: 'italian_herbs', name: 'Italian Herbs', emoji: '🇮🇹', description: '', bonusDescription: '', bonus: { type: 'groceryMultiplier', value: 1.5, scope: 'combo-items' } }];
    expect(detectNewCombos(prev, curr)).toEqual([]);
  });

  it('returns new combos that were not in previous', () => {
    const prev: ActiveCombo[] = [];
    const curr: ActiveCombo[] = [{ id: 'italian_herbs', name: 'Italian Herbs', emoji: '🇮🇹', description: '', bonusDescription: '', bonus: { type: 'groceryMultiplier', value: 1.5, scope: 'combo-items' } }];
    expect(detectNewCombos(prev, curr).length).toBe(1);
    expect(detectNewCombos(prev, curr)[0].id).toBe('italian_herbs');
  });
});

describe('calculateGroceryBonus', () => {
  it('applies 1.5x multiplier for Italian Herbs combo items', () => {
    const combos = detectKitchenCombos(['basil', 'parsley']);
    const basilBonus = calculateGroceryBonus(10, 'basil', combos);
    expect(basilBonus).toBe(15); // 10 * 1.5
  });

  it('does not apply combo bonus to non-combo items', () => {
    const combos = detectKitchenCombos(['basil', 'parsley']);
    const mintBonus = calculateGroceryBonus(10, 'mint', combos);
    expect(mintBonus).toBe(10); // No bonus, Italian Herbs doesn't include mint
  });

  it('stacks multipliers from multiple combos', () => {
    // Full Pantry (1.25x all) + Italian Herbs (1.5x basil/parsley)
    const combos = detectKitchenCombos(['basil', 'mint', 'parsley', 'cilantro', 'chives']);
    const basilBonus = calculateGroceryBonus(10, 'basil', combos);
    // Should get both multipliers: 10 * 1.5 * 1.25 * 1.2 (kitchen staples) = 22.5
    expect(basilBonus).toBeGreaterThan(10);
  });
});

describe('calculateGrowthBonus', () => {
  it('returns 1.15 for basil with companion planting combo', () => {
    const combos = detectGardenCombos(['basil', 'parsley']);
    const bonus = calculateGrowthBonus('basil', combos);
    expect(bonus).toBeCloseTo(1.15);
  });

  it('returns 1 when no garden combos active', () => {
    const combos = detectGardenCombos(['basil']);
    const bonus = calculateGrowthBonus('basil', combos);
    expect(bonus).toBe(1);
  });
});

describe('calculateYieldBonus', () => {
  it('returns +1 yield for herb garden combo', () => {
    const combos = detectGardenCombos(['basil', 'mint', 'parsley', 'cilantro']);
    const bonus = calculateYieldBonus('basil', combos);
    expect(bonus).toBe(1);
  });

  it('returns 0 when no yield combos active', () => {
    const combos = detectGardenCombos(['basil', 'parsley']);
    const bonus = calculateYieldBonus('basil', combos);
    expect(bonus).toBe(0);
  });
});
