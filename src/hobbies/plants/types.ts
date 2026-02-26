/**
 * Plant Hobby - Types
 * 
 * Growing plants as a hobby. Produces food items.
 */

import { FoodItem } from '../../kitchen/types';
import { PLANTS } from '../../balance';

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  daysToMature: number;
  yieldAmount: number;
  sellPrice: number;
  seedCost: number;
  color: string;
  description: string;
  
  // What it produces when harvested (for kitchen)
  groceryValue: number;
  maxFreshDays: number;
  kitchenBonus?: {
    type: 'growth' | 'yield' | 'freshness';
    amount: number;
  };
}

export const PLANT_TYPES: PlantType[] = [
  {
    id: 'basil',
    name: 'Basil',
    emoji: '🌿',
    color: '#4CAF50',
    description: 'Fast-growing kitchen staple. Boosts plant growth.',
    ...PLANTS.basil,
  },
  {
    id: 'mint',
    name: 'Mint',
    emoji: '🌱',
    color: '#81C784',
    description: 'Spreads quickly. Keeps things fresh longer.',
    ...PLANTS.mint,
  },
  {
    id: 'parsley',
    name: 'Parsley',
    emoji: '🪴',
    color: '#66BB6A',
    description: 'Slow but valuable. Great for groceries.',
    ...PLANTS.parsley,
  },
  {
    id: 'cilantro',
    name: 'Cilantro',
    emoji: '🌾',
    color: '#AED581',
    description: 'Bolts fast. Boosts harvest yields.',
    ...PLANTS.cilantro,
  },
  {
    id: 'chives',
    name: 'Chives',
    emoji: '🧅',
    color: '#9CCC65',
    description: 'High yield, lower price per unit.',
    ...PLANTS.chives,
  },
];

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'harvestable';

export interface PlantInstance {
  id: string;
  typeId: string;
  plantedAt: number;
  growthProgress: number;
  stage: GrowthStage;
  hasLight: boolean;
  potSlot: number;
}

// Harvested plant before deciding sell/store
export interface HarvestedPlant {
  id: string;
  typeId: string;
  quantity: number;
  harvestedAt: number;
  freshness: number;
}

export function getPlantType(id: string): PlantType | undefined {
  return PLANT_TYPES.find(p => p.id === id);
}

export function getGrowthStage(progress: number): GrowthStage {
  if (progress < 0.1) return 'seed';
  if (progress < 0.3) return 'sprout';
  if (progress < 0.7) return 'growing';
  if (progress < 1.0) return 'mature';
  return 'harvestable';
}

/**
 * Convert harvested plant to kitchen food item
 */
export function harvestToFoodItem(harvest: HarvestedPlant): FoodItem | null {
  const plantType = getPlantType(harvest.typeId);
  if (!plantType) return null;
  
  return {
    id: harvest.id,
    name: plantType.name,
    emoji: plantType.emoji,
    quantity: harvest.quantity,
    freshness: harvest.freshness,
    maxFreshDays: plantType.maxFreshDays,
    storedAt: Date.now(),
    groceryValue: plantType.groceryValue,
    bonus: plantType.kitchenBonus,
    sourceHobby: 'plants',
    sourceType: plantType.id,
  };
}

let _plantId = 0;
export function generatePlantId(): string {
  return `plant_${++_plantId}_${Date.now()}`;
}

let _harvestId = 0;
export function generateHarvestId(): string {
  return `harvest_${++_harvestId}_${Date.now()}`;
}
