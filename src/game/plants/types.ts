/**
 * Simplified Plant System - Phase 1
 * 
 * No genetics, just plant types with fixed stats.
 * Growth is visual and time-based.
 */

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  daysToMature: number;      // Real-time: 1 hour = 1 day
  yieldAmount: number;       // How much you harvest (1-3)
  sellPrice: number;         // Per unit when sold
  groceryValue: number;      // Weekly grocery savings when in kitchen
  kitchenBonus?: {
    type: 'growth' | 'yield' | 'freshness';
    amount: number;          // Multiplier (1.1 = 10% boost)
  };
  seedCost: number;
  color: string;             // For visual variety
  description: string;
}

export const PLANT_TYPES: PlantType[] = [
  {
    id: 'basil',
    name: 'Basil',
    emoji: '🌿',
    daysToMature: 7,
    yieldAmount: 2,
    sellPrice: 4,
    groceryValue: 3,
    kitchenBonus: { type: 'growth', amount: 1.1 },
    seedCost: 5,
    color: '#4CAF50',
    description: 'Fast-growing kitchen staple. Boosts plant growth when stocked.',
  },
  {
    id: 'mint',
    name: 'Mint',
    emoji: '🌱',
    daysToMature: 5,
    yieldAmount: 3,
    sellPrice: 3,
    groceryValue: 2,
    kitchenBonus: { type: 'freshness', amount: 1.2 },
    seedCost: 4,
    color: '#81C784',
    description: 'Spreads quickly. Keeps other herbs fresh longer.',
  },
  {
    id: 'parsley',
    name: 'Parsley',
    emoji: '🪴',
    daysToMature: 10,
    yieldAmount: 2,
    sellPrice: 5,
    groceryValue: 4,
    seedCost: 6,
    color: '#66BB6A',
    description: 'Slow but valuable. Great for reducing grocery bills.',
  },
  {
    id: 'cilantro',
    name: 'Cilantro',
    emoji: '🌾',
    daysToMature: 6,
    yieldAmount: 2,
    sellPrice: 4,
    groceryValue: 3,
    kitchenBonus: { type: 'yield', amount: 1.15 },
    seedCost: 5,
    color: '#AED581',
    description: 'Bolts fast in heat. Boosts harvest yields when stocked.',
  },
  {
    id: 'chives',
    name: 'Chives',
    emoji: '🧅',
    daysToMature: 8,
    yieldAmount: 4,
    sellPrice: 2,
    groceryValue: 2,
    seedCost: 4,
    color: '#9CCC65',
    description: 'Keeps giving. High yield, lower price per unit.',
  },
];

export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'harvestable';

export interface PlantInstance {
  id: string;
  typeId: string;
  plantedAt: number;         // Timestamp
  growthProgress: number;    // 0-1
  stage: GrowthStage;
  hasLight: boolean;         // Is it under a light?
  potSlot: number;           // Which slot on the table
}

export interface HarvestedPlant {
  id: string;
  typeId: string;
  quantity: number;
  harvestedAt: number;
  freshness: number;         // 0-1, decays over time
}

/**
 * Calculate growth stage from progress
 */
export function getGrowthStage(progress: number): GrowthStage {
  if (progress < 0.1) return 'seed';
  if (progress < 0.3) return 'sprout';
  if (progress < 0.7) return 'growing';
  if (progress < 1.0) return 'mature';
  return 'harvestable';
}

/**
 * Get plant type by ID
 */
export function getPlantType(id: string): PlantType | undefined {
  return PLANT_TYPES.find(p => p.id === id);
}

let _plantId = 0;
export function generatePlantId(): string {
  return `plant_${++_plantId}_${Date.now()}`;
}

let _harvestId = 0;
export function generateHarvestId(): string {
  return `harvest_${++_harvestId}_${Date.now()}`;
}
