/**
 * Equipment System - Phase 1
 *
 * Equipment determines your growing capabilities.
 * Tables have pot slots, lights provide coverage.
 */

import { TABLES, LIGHTS, POTS } from '../../balance';

export interface TableType {
  id: string;
  name: string;
  emoji: string;
  potSlots: number;          // How many pots fit
  seedStorage: number;       // How many seeds can be stored
  cost: number;
  width: number;             // Visual width in grid units
  height: number;            // Visual height in grid units
  description: string;
}

export interface LightType {
  id: string;
  name: string;
  emoji: string;
  coverage: number;          // How many pot slots it covers
  growthBoost: number;       // Multiplier (1.0 = normal, 1.5 = 50% faster)
  cost: number;
  description: string;
}

export interface PotType {
  id: string;
  name: string;
  emoji: string;
  growthModifier: number;    // Affects growth speed
  yieldModifier: number;     // Affects harvest amount
  cost: number;
  description: string;
}

// Phase 1: Start with basics, unlock more later
export const TABLE_TYPES: TableType[] = [
  {
    id: 'small_desk',
    name: 'Small Desk',
    emoji: '🪑',
    width: 2,
    height: 2,
    description: 'A corner of your desk. Room for a few pots.',
    ...TABLES.small_desk,
  },
  {
    id: 'potting_bench',
    name: 'Potting Bench',
    emoji: '🪵',
    width: 4,
    height: 2,
    description: 'Dedicated workspace. Serious growing potential.',
    ...TABLES.potting_bench,
  },
  {
    id: 'grow_shelf',
    name: 'Grow Shelf',
    emoji: '📚',
    width: 3,
    height: 3,
    description: 'Vertical space. Maximum efficiency.',
    ...TABLES.grow_shelf,
  },
  {
    id: 'grow_tent',
    name: 'Grow Tent',
    emoji: '⛺',
    width: 4,
    height: 4,
    description: 'Full indoor setup. Professional grade growing.',
    ...TABLES.grow_tent,
  },
];

export const LIGHT_TYPES: LightType[] = [
  {
    id: 'desk_lamp',
    name: 'Desk Lamp',
    emoji: '💡',
    description: 'Basic lamp. Covers a couple pots.',
    ...LIGHTS.desk_lamp,
  },
  {
    id: 'clip_light',
    name: 'Clip Light',
    emoji: '🔦',
    description: 'Flexible LED. Better coverage and growth.',
    ...LIGHTS.clip_light,
  },
  {
    id: 'led_panel',
    name: 'LED Panel',
    emoji: '✨',
    description: 'Full spectrum panel. Serious growing power.',
    ...LIGHTS.led_panel,
  },
  {
    id: 'led_array',
    name: 'LED Array',
    emoji: '🌟',
    description: 'Multi-panel setup. Maximum coverage and growth.',
    ...LIGHTS.led_array,
  },
];

export const POT_TYPES: PotType[] = [
  {
    id: 'basic_pot',
    name: 'Basic Pot',
    emoji: '🪴',
    description: 'Simple terracotta. Gets the job done.',
    ...POTS.basic_pot,
  },
  {
    id: 'self_watering',
    name: 'Self-Watering Pot',
    emoji: '💧',
    description: 'Built-in reservoir. Slightly faster growth.',
    ...POTS.self_watering,
  },
  {
    id: 'large_planter',
    name: 'Large Planter',
    emoji: '🏺',
    description: 'More root space. Slower but bigger harvests.',
    ...POTS.large_planter,
  },
];

// Player's equipment state
export interface EquipmentState {
  table: TableType;
  light: LightType;
  pots: PotInstance[];       // Pots placed in slots
}

export interface PotInstance {
  id: string;
  typeId: string;
  slot: number;              // Which table slot (0-indexed)
  plant: string | null;      // Plant instance ID, or null if empty
}

/**
 * Get equipment type by ID
 */
export function getTableType(id: string): TableType | undefined {
  return TABLE_TYPES.find(t => t.id === id);
}

export function getLightType(id: string): LightType | undefined {
  return LIGHT_TYPES.find(l => l.id === id);
}

export function getPotType(id: string): PotType | undefined {
  return POT_TYPES.find(p => p.id === id);
}

/**
 * Check if a slot has light coverage
 */
export function slotHasLight(slot: number, lightCoverage: number): boolean {
  // Lights cover slots from left to right (0, 1, 2...)
  return slot < lightCoverage;
}

let _potId = 0;
export function generatePotId(): string {
  return `pot_${++_potId}_${Date.now()}`;
}
