/**
 * Equipment System - Phase 1
 * 
 * Equipment determines your growing capabilities.
 * Tables have pot slots, lights provide coverage.
 */

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
    potSlots: 4,
    seedStorage: 10,
    cost: 0,                 // Starter - free
    width: 2,
    height: 2,
    description: 'A corner of your desk. Room for a few pots.',
  },
  {
    id: 'potting_bench',
    name: 'Potting Bench',
    emoji: '🪵',
    potSlots: 8,
    seedStorage: 20,
    cost: 150,
    width: 4,
    height: 2,
    description: 'Dedicated workspace. Serious growing potential.',
  },
  {
    id: 'grow_shelf',
    name: 'Grow Shelf',
    emoji: '📚',
    potSlots: 12,
    seedStorage: 30,
    cost: 350,
    width: 3,
    height: 3,
    description: 'Vertical space. Maximum efficiency.',
  },
  {
    id: 'grow_tent',
    name: 'Grow Tent',
    emoji: '⛺',
    potSlots: 16,
    seedStorage: 50,
    cost: 600,
    width: 4,
    height: 4,
    description: 'Full indoor setup. Professional grade growing.',
  },
];

export const LIGHT_TYPES: LightType[] = [
  {
    id: 'desk_lamp',
    name: 'Desk Lamp',
    emoji: '💡',
    coverage: 2,
    growthBoost: 1.0,
    cost: 0,                 // Starter - free
    description: 'Basic lamp. Covers a couple pots.',
  },
  {
    id: 'clip_light',
    name: 'Clip Light',
    emoji: '🔦',
    coverage: 4,
    growthBoost: 1.2,
    cost: 75,
    description: 'Flexible LED. Better coverage and growth.',
  },
  {
    id: 'led_panel',
    name: 'LED Panel',
    emoji: '✨',
    coverage: 8,
    growthBoost: 1.5,
    cost: 200,
    description: 'Full spectrum panel. Serious growing power.',
  },
  {
    id: 'led_array',
    name: 'LED Array',
    emoji: '🌟',
    coverage: 16,
    growthBoost: 1.8,
    cost: 450,
    description: 'Multi-panel setup. Maximum coverage and growth.',
  },
];

export const POT_TYPES: PotType[] = [
  {
    id: 'basic_pot',
    name: 'Basic Pot',
    emoji: '🪴',
    growthModifier: 1.0,
    yieldModifier: 1.0,
    cost: 25,
    description: 'Simple terracotta. Gets the job done.',
  },
  {
    id: 'self_watering',
    name: 'Self-Watering Pot',
    emoji: '💧',
    growthModifier: 1.1,
    yieldModifier: 1.0,
    cost: 75,
    description: 'Built-in reservoir. Slightly faster growth.',
  },
  {
    id: 'large_planter',
    name: 'Large Planter',
    emoji: '🏺',
    growthModifier: 0.9,
    yieldModifier: 1.3,
    cost: 100,
    description: 'More root space. Slower but bigger harvests.',
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
