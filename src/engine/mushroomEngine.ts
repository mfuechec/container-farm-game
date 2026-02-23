/**
 * Mushroom Engine - Pure growth calculations
 * 
 * Handles mushroom growth, environment factors, and yield calculations.
 * All functions are pure - no side effects.
 */

import {
  MushroomInstance,
  MushroomType,
  HarvestedMushroom,
  getMushroomType,
  getMushroomStage,
  generateHarvestId,
} from '../hobbies/mushrooms/types';

// Environment conditions for mushroom growth
export interface MushroomEnvironment {
  humidity: number;           // 0-100%
  temperature: number;        // °F
  freshAir: boolean;          // Has FAE (fresh air exchange)
}

// Default environment (player starts with basic conditions)
export const DEFAULT_ENVIRONMENT: MushroomEnvironment = {
  humidity: 70,
  temperature: 68,
  freshAir: false,
};

/**
 * Check if environment is optimal for mushroom growth
 * Humidity: 60-90% is optimal
 * Temperature: 55-75°F is optimal
 * Fresh air: Required
 */
export function isEnvironmentOptimal(env: MushroomEnvironment): boolean {
  const humidityOk = env.humidity >= 60 && env.humidity <= 90;
  const temperatureOk = env.temperature >= 55 && env.temperature <= 75;
  const freshAirOk = env.freshAir;
  
  return humidityOk && temperatureOk && freshAirOk;
}

/**
 * Calculate environment quality score (0-1)
 * Used to affect growth speed and final yield
 */
export function calculateEnvironmentScore(env: MushroomEnvironment, mushroomType: MushroomType): number {
  const [minHumid, maxHumid] = mushroomType.preferredHumidity;
  const [minTemp, maxTemp] = mushroomType.preferredTemp;
  
  // Humidity score (0-1)
  let humidityScore = 1;
  if (env.humidity < minHumid) {
    humidityScore = Math.max(0, 1 - (minHumid - env.humidity) / 30);
  } else if (env.humidity > maxHumid) {
    humidityScore = Math.max(0, 1 - (env.humidity - maxHumid) / 20);
  }
  
  // Temperature score (0-1)
  let tempScore = 1;
  if (env.temperature < minTemp) {
    tempScore = Math.max(0, 1 - (minTemp - env.temperature) / 20);
  } else if (env.temperature > maxTemp) {
    tempScore = Math.max(0, 1 - (env.temperature - maxTemp) / 20);
  }
  
  // Fresh air is critical for pinning and fruiting
  const freshAirScore = env.freshAir || mushroomType.needsFreshAir === false ? 1 : 0.6;
  
  // Combined score (weighted average)
  return (humidityScore * 0.4 + tempScore * 0.3 + freshAirScore * 0.3);
}

/**
 * Get the number of days required for each stage
 */
export function getStageRequiredDays(mushroomType: MushroomType): {
  inoculation: number;
  colonization: number;
  pinning: number;
  fruiting: number;
} {
  const total = mushroomType.daysToMature;
  return {
    inoculation: total * 0.10,
    colonization: total * 0.50,  // Colonization is the longest phase
    pinning: total * 0.20,
    fruiting: total * 0.20,
  };
}

/**
 * Calculate mushroom growth over a period
 * 
 * @param mushroom Current mushroom state
 * @param days Number of game days elapsed
 * @param environment Current growing conditions
 * @returns Updated mushroom state (new object, pure function)
 */
export function calculateMushroomGrowth(
  mushroom: MushroomInstance,
  days: number,
  environment: MushroomEnvironment
): MushroomInstance {
  const mushroomType = getMushroomType(mushroom.typeId);
  if (!mushroomType) return mushroom;
  
  // Can't grow past harvestable
  if (mushroom.stage === 'harvestable') return mushroom;
  
  // Calculate environment effect
  const envScore = calculateEnvironmentScore(environment, mushroomType);
  
  // Base growth per day
  const baseGrowthPerDay = 1 / mushroomType.daysToMature;
  
  // Apply modifiers
  const synergyMod = 1 + mushroom.synergyBoost;
  const envMod = 0.5 + (envScore * 0.5); // 50-100% based on environment
  
  const effectiveGrowth = baseGrowthPerDay * days * synergyMod * envMod;
  
  // Update progress
  const newProgress = Math.min(1, mushroom.growthProgress + effectiveGrowth);
  
  // Update running average of environment score
  // Weighted towards recent conditions
  const newEnvScore = mushroom.growthProgress < 0.01
    ? envScore
    : (mushroom.environmentScore * 0.7) + (envScore * 0.3);
  
  return {
    ...mushroom,
    growthProgress: newProgress,
    stage: getMushroomStage(newProgress),
    environmentScore: newEnvScore,
  };
}

/**
 * Process growth for all mushrooms
 */
export function processMushroomGrowth(
  mushrooms: Record<string, MushroomInstance>,
  days: number,
  environment: MushroomEnvironment
): Record<string, MushroomInstance> {
  const updated: Record<string, MushroomInstance> = {};
  
  for (const [id, mushroom] of Object.entries(mushrooms)) {
    updated[id] = calculateMushroomGrowth(mushroom, days, environment);
  }
  
  return updated;
}

/**
 * Calculate harvest result
 */
export function calculateHarvest(mushroom: MushroomInstance): HarvestedMushroom | null {
  if (mushroom.stage !== 'harvestable') return null;
  
  const mushroomType = getMushroomType(mushroom.typeId);
  if (!mushroomType) return null;
  
  // Base yield modified by environment quality during growth
  const envFactor = 0.5 + (mushroom.environmentScore * 0.5);
  const quantity = mushroomType.yieldAmount * envFactor;
  
  return {
    id: generateHarvestId(),
    typeId: mushroom.typeId,
    quantity: Math.round(quantity * 10) / 10,
    harvestedAt: Date.now(),
    freshness: 1.0,
  };
}

/**
 * Apply synergy boost to mushroom from plant compost
 */
export function applyCompostBoost(
  mushroom: MushroomInstance,
  boostAmount: number
): MushroomInstance {
  // Cap total synergy boost at 30%
  const newBoost = Math.min(0.3, mushroom.synergyBoost + boostAmount);
  
  return {
    ...mushroom,
    synergyBoost: newBoost,
  };
}

/**
 * Calculate freshness decay for harvested mushrooms
 * Mushrooms decay faster than herbs
 */
export function calculateMushroomFreshness(
  harvest: HarvestedMushroom,
  currentTime: number
): number {
  const mushroomType = getMushroomType(harvest.typeId);
  if (!mushroomType) return harvest.freshness;
  
  const msPerDay = 60 * 60 * 1000; // 1 hour = 1 game day
  const daysSinceHarvest = (currentTime - harvest.harvestedAt) / msPerDay;
  
  // Linear decay over maxFreshDays
  const freshness = Math.max(0, 1 - (daysSinceHarvest / mushroomType.maxFreshDays));
  
  return Math.round(freshness * 100) / 100;
}

/**
 * Update freshness for all harvested mushrooms
 */
export function updateHarvestFreshness(
  harvest: HarvestedMushroom[],
  currentTime: number
): HarvestedMushroom[] {
  return harvest.map(h => ({
    ...h,
    freshness: calculateMushroomFreshness(h, currentTime),
  })).filter(h => h.freshness > 0); // Remove completely spoiled
}
