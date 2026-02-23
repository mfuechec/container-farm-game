/**
 * Mushroom Hobby - Types
 * 
 * Growing mushrooms. Faster cycle than plants, different mechanics.
 * Focus on humidity/darkness vs light/water.
 */

import { FoodItem } from '../../kitchen/types';

export interface MushroomType {
  id: string;
  name: string;
  emoji: string;
  daysToMature: number;      // Total days from inoculation to harvest
  yieldAmount: number;       // Base yield in oz
  sellPrice: number;         // Per oz
  spawnCost: number;         // Cost to buy spawn
  color: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Environment preferences
  preferredHumidity: [number, number];  // Min-max range (%)
  preferredTemp: [number, number];      // Min-max range (°F)
  needsFreshAir: boolean;
  
  // Kitchen integration
  groceryValue: number;
  maxFreshDays: number;
  kitchenBonus?: {
    type: 'growth' | 'yield' | 'freshness';
    amount: number;
  };
}

export const MUSHROOM_TYPES: MushroomType[] = [
  {
    id: 'oyster',
    name: 'Oyster Mushroom',
    emoji: '🍄',
    daysToMature: 3,         // Fast! 3 game days (3 real hours)
    yieldAmount: 4,
    sellPrice: 8,
    spawnCost: 8,
    color: '#E8DFD0',
    description: 'Beginner-friendly. Fast growth, forgiving conditions.',
    difficulty: 'easy',
    preferredHumidity: [70, 90],
    preferredTemp: [60, 75],
    needsFreshAir: true,
    groceryValue: 4,
    maxFreshDays: 5,
    kitchenBonus: { type: 'freshness', amount: 1.15 },
  },
  {
    id: 'shiitake',
    name: 'Shiitake',
    emoji: '🍄',
    daysToMature: 4,
    yieldAmount: 3,
    sellPrice: 12,
    spawnCost: 12,
    color: '#8B4513',
    description: 'Classic culinary mushroom. Needs consistent humidity.',
    difficulty: 'medium',
    preferredHumidity: [75, 85],
    preferredTemp: [55, 70],
    needsFreshAir: true,
    groceryValue: 5,
    maxFreshDays: 7,
    kitchenBonus: { type: 'yield', amount: 1.1 },
  },
  {
    id: 'lions_mane',
    name: "Lion's Mane",
    emoji: '🦁',
    daysToMature: 5,
    yieldAmount: 2,
    sellPrice: 18,
    spawnCost: 15,
    color: '#FFFFF0',
    description: 'Premium gourmet. Picky about conditions but high value.',
    difficulty: 'hard',
    preferredHumidity: [80, 90],
    preferredTemp: [60, 68],
    needsFreshAir: true,
    groceryValue: 8,
    maxFreshDays: 4,
    kitchenBonus: { type: 'growth', amount: 1.2 },
  },
];

/**
 * Mushroom growth stages - faster cycle than plants
 */
export type MushroomStage = 
  | 'inoculation'    // 0-10% - spawn just added
  | 'colonization'   // 10-60% - mycelium spreading through substrate
  | 'pinning'        // 60-80% - small pins forming
  | 'fruiting'       // 80-100% - mushrooms growing
  | 'harvestable';   // 100% - ready to pick

export interface MushroomInstance {
  id: string;
  typeId: string;
  plantedAt: number;           // Timestamp
  growthProgress: number;      // 0-1
  stage: MushroomStage;
  bagSlot: number;             // Which grow bag slot
  synergyBoost: number;        // Bonus from plant compost (0-0.3 typically)
  environmentScore: number;    // Average environment quality during growth (0-1)
}

export interface HarvestedMushroom {
  id: string;
  typeId: string;
  quantity: number;           // Yield in oz
  harvestedAt: number;
  freshness: number;          // 0-1
}

// Equipment types
export interface GrowBagType {
  id: string;
  name: string;
  emoji: string;
  capacity: number;           // How many mushroom slots
  humidityBonus: number;      // Modifier to humidity maintenance
  cost: number;
  description: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  emoji: string;
  bonus: {
    humidity?: number;
    temperature?: number;
    freshAir?: boolean;
  };
  cost: number;
  description: string;
}

export const GROW_BAG_TYPES: GrowBagType[] = [
  {
    id: 'basic_bag',
    name: 'Basic Grow Bag',
    emoji: '🛍️',
    capacity: 1,
    humidityBonus: 0,
    cost: 5,
    description: 'Simple substrate bag. Gets the job done.',
  },
  {
    id: 'filter_bag',
    name: 'Filter Patch Bag',
    emoji: '🎒',
    capacity: 1,
    humidityBonus: 0.1,
    cost: 10,
    description: 'Better air exchange. Healthier mycelium.',
  },
  {
    id: 'monotub',
    name: 'Monotub',
    emoji: '📦',
    capacity: 3,
    humidityBonus: 0.2,
    cost: 35,
    description: 'Large growing chamber. Multiple bags, better humidity.',
  },
];

export const EQUIPMENT_TYPES: EquipmentType[] = [
  {
    id: 'spray_bottle',
    name: 'Spray Bottle',
    emoji: '💧',
    bonus: { humidity: 5 },
    cost: 0,                  // Starter - free
    description: 'Manual misting. Basic humidity control.',
  },
  {
    id: 'humidifier',
    name: 'Humidifier',
    emoji: '🌫️',
    bonus: { humidity: 15 },
    cost: 30,
    description: 'Automatic humidity. Much better conditions.',
  },
  {
    id: 'dark_tent',
    name: 'Dark Tent',
    emoji: '🎪',
    bonus: { humidity: 10, temperature: -5 },
    cost: 50,
    description: 'Enclosed growing space. Consistent dark and cool.',
  },
  {
    id: 'fae_fan',
    name: 'FAE Fan',
    emoji: '💨',
    bonus: { freshAir: true },
    cost: 25,
    description: 'Fresh Air Exchange. Prevents CO2 buildup.',
  },
];

// Grow bag instance (placed in hobby)
export interface GrowBagInstance {
  id: string;
  typeId: string;
  slot: number;
  mushroom: string | null;    // Mushroom instance ID
}

// Helper functions
export function getMushroomType(id: string): MushroomType | undefined {
  return MUSHROOM_TYPES.find(m => m.id === id);
}

export function getGrowBagType(id: string): GrowBagType | undefined {
  return GROW_BAG_TYPES.find(b => b.id === id);
}

export function getEquipmentType(id: string): EquipmentType | undefined {
  return EQUIPMENT_TYPES.find(e => e.id === id);
}

/**
 * Get mushroom stage based on growth progress
 */
export function getMushroomStage(progress: number): MushroomStage {
  if (progress < 0.10) return 'inoculation';
  if (progress < 0.60) return 'colonization';
  if (progress < 0.80) return 'pinning';
  if (progress < 1.00) return 'fruiting';
  return 'harvestable';
}

/**
 * Create a new mushroom instance
 */
export function createMushroomInstance(typeId: string, bagSlot: number): MushroomInstance {
  return {
    id: generateMushroomId(),
    typeId,
    plantedAt: Date.now(),
    growthProgress: 0,
    stage: 'inoculation',
    bagSlot,
    synergyBoost: 0,
    environmentScore: 1.0,    // Start at perfect
  };
}

/**
 * Calculate final yield based on conditions during growth
 */
export function calculateMushroomYield(mushroom: MushroomInstance): number {
  const type = getMushroomType(mushroom.typeId);
  if (!type) return 0;
  
  // Base yield modified by environment score
  // Minimum 50% yield even with poor conditions
  const envFactor = 0.5 + (mushroom.environmentScore * 0.5);
  
  return type.yieldAmount * envFactor;
}

/**
 * Convert harvested mushroom to kitchen food item
 */
export function harvestToFoodItem(harvest: HarvestedMushroom): FoodItem | null {
  const mushroomType = getMushroomType(harvest.typeId);
  if (!mushroomType) return null;
  
  return {
    id: harvest.id,
    name: mushroomType.name,
    emoji: mushroomType.emoji,
    quantity: harvest.quantity,
    freshness: harvest.freshness,
    maxFreshDays: mushroomType.maxFreshDays,
    storedAt: Date.now(),
    groceryValue: mushroomType.groceryValue,
    bonus: mushroomType.kitchenBonus,
    sourceHobby: 'mushrooms',
    sourceType: mushroomType.id,
  };
}

// ID generation
let _mushroomId = 0;
export function generateMushroomId(): string {
  return `mushroom_${++_mushroomId}_${Date.now()}`;
}

let _harvestId = 0;
export function generateHarvestId(): string {
  return `mharvest_${++_harvestId}_${Date.now()}`;
}

let _bagId = 0;
export function generateBagId(): string {
  return `bag_${++_bagId}_${Date.now()}`;
}
