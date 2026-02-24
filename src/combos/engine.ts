/**
 * Combo Engine
 * 
 * Pure functions for combo detection and bonus calculation.
 * No side effects, no store dependencies.
 */

import { ComboDefinition, COMBOS, getKitchenCombos, getGardenCombos } from './config';

export interface ActiveCombo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bonusDescription: string;
  bonus: ComboDefinition['bonus'];
}

/**
 * Check if a single combo is active given the current items
 */
function isComboActive(
  combo: ComboDefinition,
  itemTypeIds: string[]
): boolean {
  const { requiredItems, minCount } = combo.trigger;
  
  if (minCount !== undefined) {
    // "Any X of these" combo - need at least minCount of the required items
    const matchCount = requiredItems.filter(req => itemTypeIds.includes(req)).length;
    return matchCount >= minCount;
  } else {
    // "All of these" combo - need all required items
    return requiredItems.every(req => itemTypeIds.includes(req));
  }
}

/**
 * Format bonus as human-readable string
 */
function formatBonusDescription(bonus: ComboDefinition['bonus']): string {
  const percent = Math.round((bonus.value - 1) * 100);
  const scope = bonus.scope === 'combo-items' ? 'these items' : 'all items';
  
  switch (bonus.type) {
    case 'groceryMultiplier':
      return `+${percent}% grocery savings for ${scope}`;
    case 'growthMultiplier':
      return `+${percent}% growth speed for ${scope}`;
    case 'freshnessMultiplier':
      return `+${percent}% freshness duration for ${scope}`;
    case 'yieldBonus':
      return `+${bonus.value} yield for ${scope}`;
    default:
      return `Bonus active`;
  }
}

/**
 * Convert combo definition to active combo
 */
function toActiveCombo(combo: ComboDefinition): ActiveCombo {
  return {
    id: combo.id,
    name: combo.name,
    emoji: combo.emoji,
    description: combo.description,
    bonusDescription: formatBonusDescription(combo.bonus),
    bonus: combo.bonus,
  };
}

/**
 * Detect all active kitchen combos
 */
export function detectKitchenCombos(kitchenItemTypeIds: string[]): ActiveCombo[] {
  return getKitchenCombos()
    .filter(combo => isComboActive(combo, kitchenItemTypeIds))
    .map(toActiveCombo);
}

/**
 * Detect all active garden combos
 */
export function detectGardenCombos(gardenPlantTypeIds: string[]): ActiveCombo[] {
  return getGardenCombos()
    .filter(combo => isComboActive(combo, gardenPlantTypeIds))
    .map(toActiveCombo);
}

/**
 * Detect all active combos (both kitchen and garden)
 */
export function detectAllCombos(
  kitchenItemTypeIds: string[],
  gardenPlantTypeIds: string[]
): { kitchen: ActiveCombo[]; garden: ActiveCombo[] } {
  return {
    kitchen: detectKitchenCombos(kitchenItemTypeIds),
    garden: detectGardenCombos(gardenPlantTypeIds),
  };
}

/**
 * Detect NEW combos that weren't previously active
 * Used to trigger toast notifications
 */
export function detectNewCombos(
  previousCombos: ActiveCombo[],
  currentCombos: ActiveCombo[]
): ActiveCombo[] {
  const previousIds = new Set(previousCombos.map(c => c.id));
  return currentCombos.filter(c => !previousIds.has(c.id));
}

/**
 * Calculate grocery bonus for an item
 */
export function calculateGroceryBonus(
  baseValue: number,
  itemTypeId: string,
  activeCombos: ActiveCombo[]
): number {
  let multiplier = 1;
  
  for (const combo of activeCombos) {
    if (combo.bonus.type !== 'groceryMultiplier') continue;
    
    const comboConfig = COMBOS.find(c => c.id === combo.id);
    if (!comboConfig) continue;
    
    // Check if this item benefits from the combo
    const appliesToItem = combo.bonus.scope === 'all-items' ||
      comboConfig.trigger.requiredItems.includes(itemTypeId);
    
    if (appliesToItem) {
      multiplier *= combo.bonus.value;
    }
  }
  
  return baseValue * multiplier;
}

/**
 * Calculate growth bonus for a plant
 */
export function calculateGrowthBonus(
  plantTypeId: string,
  activeCombos: ActiveCombo[]
): number {
  let multiplier = 1;
  
  for (const combo of activeCombos) {
    if (combo.bonus.type !== 'growthMultiplier') continue;
    
    const comboConfig = COMBOS.find(c => c.id === combo.id);
    if (!comboConfig) continue;
    
    const appliesToPlant = combo.bonus.scope === 'all-items' ||
      comboConfig.trigger.requiredItems.includes(plantTypeId);
    
    if (appliesToPlant) {
      multiplier *= combo.bonus.value;
    }
  }
  
  return multiplier;
}

/**
 * Calculate yield bonus for a harvest
 */
export function calculateYieldBonus(
  plantTypeId: string,
  activeCombos: ActiveCombo[]
): number {
  let bonus = 0;
  
  for (const combo of activeCombos) {
    if (combo.bonus.type !== 'yieldBonus') continue;
    
    const comboConfig = COMBOS.find(c => c.id === combo.id);
    if (!comboConfig) continue;
    
    const appliesToPlant = combo.bonus.scope === 'all-items' ||
      comboConfig.trigger.requiredItems.includes(plantTypeId);
    
    if (appliesToPlant) {
      bonus += combo.bonus.value;
    }
  }
  
  return bonus;
}

/**
 * Calculate freshness bonus for an item
 */
export function calculateFreshnessBonus(
  itemTypeId: string,
  activeCombos: ActiveCombo[]
): number {
  let multiplier = 1;
  
  for (const combo of activeCombos) {
    if (combo.bonus.type !== 'freshnessMultiplier') continue;
    
    const comboConfig = COMBOS.find(c => c.id === combo.id);
    if (!comboConfig) continue;
    
    const appliesToItem = combo.bonus.scope === 'all-items' ||
      comboConfig.trigger.requiredItems.includes(itemTypeId);
    
    if (appliesToItem) {
      multiplier *= combo.bonus.value;
    }
  }
  
  return multiplier;
}
