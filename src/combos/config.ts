/**
 * Combo Configuration
 *
 * Data-driven combo definitions. Adding new combos = adding data, not code.
 * Bonus values come from src/balance.ts.
 */

import { COMBO_VALUES } from '../balance';

export type ComboTrigger = 'kitchen' | 'garden' | 'both';
export type BonusType = 'groceryMultiplier' | 'growthMultiplier' | 'yieldBonus' | 'freshnessMultiplier';
export type BonusScope = 'combo-items' | 'all-items' | 'flat';

export interface ComboDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  
  // What triggers this combo
  trigger: {
    type: ComboTrigger;
    requiredItems: string[];  // plant type IDs
    minCount?: number;        // for "any X" combos (uses minCount of requiredItems)
  };
  
  // What bonus it provides
  bonus: {
    type: BonusType;
    value: number;            // multiplier (1.5 = +50%) or flat amount
    scope: BonusScope;
  };
}

/**
 * All combo definitions
 * 
 * Kitchen combos: Triggered when items are stored in kitchen
 * Garden combos: Triggered when plants are growing together
 */
export const COMBOS: ComboDefinition[] = [
  // Kitchen combos - reward strategic storing
  {
    id: 'italian_herbs',
    name: 'Italian Herbs',
    emoji: '🇮🇹',
    description: 'Classic pasta combination',
    trigger: { type: 'kitchen', requiredItems: ['basil', 'parsley'] },
    bonus: COMBO_VALUES.italian_herbs,
  },
  {
    id: 'fresh_duo',
    name: 'Fresh Duo',
    emoji: '✨',
    description: 'Bright, fresh flavors together',
    trigger: { type: 'kitchen', requiredItems: ['mint', 'cilantro'] },
    bonus: COMBO_VALUES.fresh_duo,
  },
  {
    id: 'kitchen_staples',
    name: 'Kitchen Staples',
    emoji: '👨‍🍳',
    description: 'Well-stocked kitchen',
    trigger: { type: 'kitchen', requiredItems: ['basil', 'mint', 'parsley'], minCount: 3 },
    bonus: COMBO_VALUES.kitchen_staples,
  },
  {
    id: 'full_pantry',
    name: 'Full Pantry',
    emoji: '🏆',
    description: 'Master gardener status',
    trigger: {
      type: 'kitchen',
      requiredItems: ['basil', 'mint', 'parsley', 'cilantro', 'chives'],
    },
    bonus: COMBO_VALUES.full_pantry,
  },

  // Garden combos - reward companion planting
  {
    id: 'companion_basil_parsley',
    name: 'Companion Planting',
    emoji: '🤝',
    description: 'Basil and parsley grow well together',
    trigger: { type: 'garden', requiredItems: ['basil', 'parsley'] },
    bonus: COMBO_VALUES.companion_basil_parsley,
  },
  {
    id: 'companion_mint_chives',
    name: 'Garden Friends',
    emoji: '💚',
    description: 'Mint and chives complement each other',
    trigger: { type: 'garden', requiredItems: ['mint', 'chives'] },
    bonus: COMBO_VALUES.companion_mint_chives,
  },
  {
    id: 'herb_garden',
    name: 'Herb Garden',
    emoji: '🌿',
    description: 'A diverse garden thrives',
    trigger: { type: 'garden', requiredItems: ['basil', 'mint', 'parsley', 'cilantro'], minCount: 4 },
    bonus: COMBO_VALUES.herb_garden,
  },
];

/**
 * Get combo by ID
 */
export function getCombo(id: string): ComboDefinition | undefined {
  return COMBOS.find(c => c.id === id);
}

/**
 * Get all kitchen combos
 */
export function getKitchenCombos(): ComboDefinition[] {
  return COMBOS.filter(c => c.trigger.type === 'kitchen' || c.trigger.type === 'both');
}

/**
 * Get all garden combos
 */
export function getGardenCombos(): ComboDefinition[] {
  return COMBOS.filter(c => c.trigger.type === 'garden' || c.trigger.type === 'both');
}
