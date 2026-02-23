/**
 * Plant Engine - Pure game logic for plant growth and harvesting
 * 
 * NO React, NO Zustand, NO side effects.
 * Just pure functions that calculate state transitions.
 */

import {
  PlantInstance,
  HarvestedPlant,
  PlantType,
  GrowthStage,
  PLANT_TYPES,
  getPlantType,
} from '../hobbies/plants/types';

/**
 * Get growth stage from progress (0-1)
 */
export function getGrowthStage(progress: number): GrowthStage {
  if (progress >= 1) return 'harvestable';
  if (progress >= 0.6) return 'growing';
  if (progress >= 0.2) return 'sprout';
  return 'seed';
}

/**
 * Calculate plant growth for a time delta
 * 
 * @param plant - Current plant state
 * @param deltaDays - Time passed in game days
 * @param lightBoost - Multiplier from grow light (1.0 = no boost)
 * @param kitchenBonus - Multiplier from kitchen storage (1.0 = no bonus)
 * @returns New plant state
 */
export function calculateGrowth(
  plant: PlantInstance,
  deltaDays: number,
  lightBoost: number = 1.0,
  kitchenBonus: number = 1.0
): PlantInstance {
  // Already harvestable? No change
  if (plant.stage === 'harvestable') {
    return plant;
  }

  const plantType = getPlantType(plant.typeId);
  if (!plantType) return plant;

  // Calculate growth increment
  const baseGrowthPerDay = 1 / plantType.daysToMature;
  const totalBoost = lightBoost * kitchenBonus;
  const growthIncrement = baseGrowthPerDay * deltaDays * totalBoost;

  // Apply growth
  const newProgress = Math.min(1, plant.growthProgress + growthIncrement);
  const newStage = getGrowthStage(newProgress);

  return {
    ...plant,
    growthProgress: newProgress,
    stage: newStage,
  };
}

/**
 * Calculate harvest result when collecting a mature plant
 * 
 * @param plant - Plant to harvest (should be harvestable)
 * @param yieldMultiplier - Bonus from pot type, etc.
 * @returns Harvested plant data, or null if not harvestable
 */
export function calculateHarvest(
  plant: PlantInstance,
  yieldMultiplier: number = 1.0
): HarvestedPlant | null {
  if (plant.stage !== 'harvestable') {
    return null;
  }

  const plantType = getPlantType(plant.typeId);
  if (!plantType) return null;

  const baseYield = plantType.yieldAmount;
  const finalYield = Math.round(baseYield * yieldMultiplier);

  return {
    id: `harvest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    typeId: plant.typeId,
    quantity: finalYield,
    freshness: 1.0, // Fresh from harvest
    harvestedAt: Date.now(),
  };
}

/**
 * Calculate sell price for harvested plants (legacy - use specific price functions)
 * 
 * @param harvest - Harvested plant data
 * @returns Sell price in dollars
 */
export function calculateSellPrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  if (!plantType) return 0;

  // Price = base price × quantity × freshness
  const rawPrice = plantType.sellPrice * harvest.quantity * harvest.freshness;
  
  // Round to 1 decimal place
  return Math.round(rawPrice * 10) / 10;
}

/**
 * Calculate wholesale price (50% of base, no freshness bonus)
 */
export function calculateWholesalePrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  if (!plantType) return 0;

  const rawPrice = plantType.sellPrice * harvest.quantity * 0.5;
  return Math.round(rawPrice * 10) / 10;
}

/**
 * Calculate farmers market price (100% base + freshness bonus)
 * Freshness bonus: 90% at 0.5 freshness, 110% at 1.0 freshness
 */
export function calculateMarketPrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  if (!plantType) return 0;

  const freshnessBonus = 0.9 + (harvest.freshness * 0.2);
  const rawPrice = plantType.sellPrice * harvest.quantity * freshnessBonus;
  return Math.round(rawPrice * 10) / 10;
}

/**
 * Calculate dried herb price (75% of base, no freshness factor)
 */
export function calculateDriedPrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  if (!plantType) return 0;

  const rawPrice = plantType.sellPrice * harvest.quantity * 0.75;
  return Math.round(rawPrice * 10) / 10;
}

/**
 * Decay freshness over time
 * 
 * @param freshness - Current freshness (0-1)
 * @param deltaDays - Time passed
 * @param decayRate - How fast it decays (default 0.1 per day = 10 days to spoil)
 * @returns New freshness value
 */
export function decayFreshness(
  freshness: number,
  deltaDays: number,
  decayRate: number = 0.1
): number {
  return Math.max(0, freshness - (deltaDays * decayRate));
}

/**
 * Process all plants for a tick
 * 
 * @param plants - Record of all plants
 * @param deltaDays - Time passed
 * @param getLightBoost - Function to get light boost for a plant
 * @param kitchenBonus - Global kitchen bonus
 * @returns Updated plants record
 */
export function tickPlants(
  plants: Record<string, PlantInstance>,
  deltaDays: number,
  getLightBoost: (plantId: string) => number,
  kitchenBonus: number = 1.0
): Record<string, PlantInstance> {
  const result: Record<string, PlantInstance> = {};

  for (const [id, plant] of Object.entries(plants)) {
    const lightBoost = getLightBoost(id);
    result[id] = calculateGrowth(plant, deltaDays, lightBoost, kitchenBonus);
  }

  return result;
}

/**
 * Process harvest freshness decay
 */
export function tickHarvest(
  harvest: HarvestedPlant[],
  deltaDays: number
): HarvestedPlant[] {
  return harvest
    .map(h => ({
      ...h,
      freshness: decayFreshness(h.freshness, deltaDays),
    }))
    .filter(h => h.freshness > 0); // Remove spoiled items
}

/**
 * Check if a plant type seed can be planted in a pot
 */
export function canPlant(
  seedCount: number,
  potHasPlant: boolean
): boolean {
  return seedCount > 0 && !potHasPlant;
}

/**
 * Create a new plant instance when planting a seed
 */
export function createPlant(
  typeId: string,
  potSlot: number,
  hasLight: boolean
): PlantInstance {
  return {
    id: `plant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    typeId,
    growthProgress: 0,
    stage: 'seed',
    plantedAt: Date.now(),
    potSlot,
    hasLight,
  };
}
