/**
 * Combo Configuration
 * 
 * Data-driven combo definitions. Adding new combos = adding data, not code.
 */

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
    bonus: { type: 'groceryMultiplier', value: 1.5, scope: 'combo-items' },
  },
  {
    id: 'fresh_duo',
    name: 'Fresh Duo',
    emoji: '✨',
    description: 'Bright, fresh flavors together',
    trigger: { type: 'kitchen', requiredItems: ['mint', 'cilantro'] },
    bonus: { type: 'freshnessMultiplier', value: 1.3, scope: 'combo-items' },
  },
  {
    id: 'kitchen_staples',
    name: 'Kitchen Staples',
    emoji: '👨‍🍳',
    description: 'Well-stocked kitchen',
    trigger: { type: 'kitchen', requiredItems: ['basil', 'mint', 'parsley'], minCount: 3 },
    bonus: { type: 'groceryMultiplier', value: 1.2, scope: 'all-items' },
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
    bonus: { type: 'groceryMultiplier', value: 1.25, scope: 'all-items' },
  },
  
  // Garden combos - reward companion planting
  {
    id: 'companion_basil_parsley',
    name: 'Companion Planting',
    emoji: '🤝',
    description: 'Basil and parsley grow well together',
    trigger: { type: 'garden', requiredItems: ['basil', 'parsley'] },
    bonus: { type: 'growthMultiplier', value: 1.15, scope: 'combo-items' },
  },
  {
    id: 'companion_mint_chives',
    name: 'Garden Friends',
    emoji: '💚',
    description: 'Mint and chives complement each other',
    trigger: { type: 'garden', requiredItems: ['mint', 'chives'] },
    bonus: { type: 'growthMultiplier', value: 1.1, scope: 'combo-items' },
  },
  {
    id: 'herb_garden',
    name: 'Herb Garden',
    emoji: '🌿',
    description: 'A diverse garden thrives',
    trigger: { type: 'garden', requiredItems: ['basil', 'mint', 'parsley', 'cilantro'], minCount: 4 },
    bonus: { type: 'yieldBonus', value: 1, scope: 'all-items' },  // +1 yield
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
