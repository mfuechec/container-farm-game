/**
 * Time Engine - Unified tick processing for all game systems
 * 
 * NO React, NO Zustand, NO side effects.
 * Coordinates plant growth, kitchen decay, and economy.
 */

import * as plantEngine from './plantEngine';
import * as economyEngine from './economyEngine';
import * as kitchenEngine from './kitchenEngine';
import { PlantInstance, HarvestedPlant } from '../hobbies/plants/types';
import { PotInstance } from '../hobbies/plants/equipment';
import { KitchenState, KitchenBonus, getVarietyStatus } from '../kitchen/types';
import { EconomyState } from '../economy/types';

// Time constants
export const MS_PER_GAME_DAY = 60 * 60 * 1000; // 1 hour real = 1 day game
export const MS_PER_GAME_WEEK = MS_PER_GAME_DAY * 7;
export const DAYS_PER_WEEK = 7;

/**
 * Calculate how many game days have passed
 */
export function calculateDeltaDays(
  lastTick: number,
  currentTime: number,
  msPerDay: number = MS_PER_GAME_DAY
): number {
  const elapsed = currentTime - lastTick;
  return elapsed / msPerDay;
}

/**
 * Calculate current game day from start time
 */
export function calculateGameDay(
  startTime: number,
  currentTime: number,
  msPerDay: number = MS_PER_GAME_DAY
): number {
  return 1 + (currentTime - startTime) / msPerDay;
}

/**
 * Input state for a full tick
 */
export interface TickInput {
  // Time
  lastTick: number;
  currentTime: number;
  gameStartTime: number;
  
  // Plants
  plants: Record<string, PlantInstance>;
  pots: PotInstance[];
  harvest: HarvestedPlant[];
  lightCoverage: number;
  
  // Kitchen
  kitchen: KitchenState;
  
  // Economy
  economy: EconomyState;
  rentPerWeek: number;
  groceryBase: number;
  weeklyIncome: number;
  
  // Last rent payment time
  lastRentPaid: number;
}

/**
 * Output state from a full tick
 */
export interface TickOutput {
  plants: Record<string, PlantInstance>;
  harvest: HarvestedPlant[];
  kitchen: KitchenState;
  economy: EconomyState;
  gameDay: number;
  lastTick: number;
  lastRentPaid: number;
  events: TickEvent[];
}

/**
 * Events that occurred during tick (for UI notifications)
 */
export interface TickEvent {
  type: 'plant_ready' | 'item_spoiled' | 'rent_paid' | 'plant_stage_change';
  data: any;
}

/**
 * Process a full game tick
 * 
 * This is the main entry point for time-based updates.
 * Call this every second (or whenever time advances).
 */
export function processTick(input: TickInput): TickOutput {
  const events: TickEvent[] = [];
  const deltaDays = calculateDeltaDays(input.lastTick, input.currentTime);
  
  if (deltaDays <= 0) {
    // No time passed, return unchanged
    return {
      plants: input.plants,
      harvest: input.harvest,
      kitchen: input.kitchen,
      economy: input.economy,
      gameDay: calculateGameDay(input.gameStartTime, input.currentTime),
      lastTick: input.currentTime,
      lastRentPaid: input.lastRentPaid,
      events: [],
    };
  }

  // 1. Get kitchen bonuses (affects plant growth)
  const kitchenBonuses = kitchenEngine.getActiveKitchenBonuses(input.kitchen.storage);
  const kitchenGrowthBonus = kitchenEngine.getBonusMultiplier(kitchenBonuses, 'growth');

  // 1b. Get variety bonus from weekly meal diversity
  const currentGameDay = calculateGameDay(input.gameStartTime, input.currentTime);
  const varietyStatus = getVarietyStatus(
    input.kitchen.mealHistory,
    input.kitchen.weekStartDay,
    currentGameDay
  );
  const growthBonus = kitchenGrowthBonus * (1 + varietyStatus.efficiencyBonus);

  // 2. Process plant growth
  const getLightBoost = (plantId: string): number => {
    const pot = input.pots.find(p => p.plant === plantId);
    if (!pot) return 1.0;
    const hasLight = pot.slot < input.lightCoverage;
    return hasLight ? 1.2 : 1.0; // 20% boost if under light
  };
  
  const newPlants: Record<string, PlantInstance> = {};
  for (const [id, plant] of Object.entries(input.plants)) {
    const oldStage = plant.stage;
    const updated = plantEngine.calculateGrowth(
      plant,
      deltaDays,
      getLightBoost(id),
      growthBonus
    );
    newPlants[id] = updated;
    
    // Track stage changes
    if (updated.stage !== oldStage) {
      events.push({
        type: updated.stage === 'harvestable' ? 'plant_ready' : 'plant_stage_change',
        data: { plantId: id, oldStage, newStage: updated.stage },
      });
    }
  }

  // 3. Process harvest freshness decay
  const newHarvest = plantEngine.tickHarvest(input.harvest, deltaDays);
  const spoiledCount = input.harvest.length - newHarvest.length;
  if (spoiledCount > 0) {
    events.push({ type: 'item_spoiled', data: { count: spoiledCount, location: 'harvest' } });
  }

  // 4. Process kitchen decay
  const newKitchen = kitchenEngine.tickKitchen(input.kitchen, deltaDays);
  const kitchenSpoiled = input.kitchen.storage.length - newKitchen.storage.length;
  if (kitchenSpoiled > 0) {
    events.push({ type: 'item_spoiled', data: { count: kitchenSpoiled, location: 'kitchen' } });
  }

  // 5. Process weekly finances (if a week has passed)
  let newEconomy = input.economy;
  let newLastRentPaid = input.lastRentPaid;
  const currentWeek = Math.ceil(currentGameDay / 7);
  
  if (economyEngine.isRentDue(input.lastRentPaid, input.currentTime, MS_PER_GAME_WEEK)) {
    const rent = economyEngine.getRentForWeek(currentWeek);
    // Storage-based savings (raw ingredient value)
    const storageSavings = kitchenEngine.calculateGrocerySavings(newKitchen.storage);
    // Meal-based savings (cooked meals reduce groceries, takeout adds cost)
    const { mealSavings, takeoutCosts } = kitchenEngine.calculateMealSavings(
      newKitchen.mealHistory,
      newKitchen.weekStartDay
    );
    const totalSavings = storageSavings + mealSavings;
    const groceryCost = Math.max(0, input.groceryBase - totalSavings) + takeoutCosts;

    newEconomy = economyEngine.processWeeklyExpenses(
      input.economy,
      rent,
      input.groceryBase,
      totalSavings - takeoutCosts, // net savings (takeout handled in groceryCost)
      input.weeklyIncome
    );
    // Deduct takeout costs separately (processWeeklyExpenses doesn't know about them)
    if (takeoutCosts > 0) {
      newEconomy = { ...newEconomy, money: newEconomy.money - takeoutCosts };
    }
    newLastRentPaid = input.currentTime;

    const netChange = input.weeklyIncome - rent - groceryCost;
    events.push({
      type: 'rent_paid',
      data: {
        income: input.weeklyIncome,
        rent,
        groceries: groceryCost,
        savings: totalSavings,
        mealSavings,
        takeoutCosts,
        netChange,
        week: currentWeek,
      },
    });
  }

  return {
    plants: newPlants,
    harvest: newHarvest,
    kitchen: newKitchen,
    economy: newEconomy,
    gameDay: calculateGameDay(input.gameStartTime, input.currentTime),
    lastTick: input.currentTime,
    lastRentPaid: newLastRentPaid,
    events,
  };
}

/**
 * Skip time by a number of days
 * Processes multiple ticks to simulate time passing
 */
export function skipTime(
  input: TickInput,
  daysToSkip: number
): TickOutput {
  const msToSkip = daysToSkip * MS_PER_GAME_DAY;
  return processTick({
    ...input,
    currentTime: input.currentTime + msToSkip,
  });
}

/**
 * Get time info for display
 */
export function getTimeInfo(gameDay: number): {
  day: number;
  week: number;
  dayOfWeek: number;
  dayName: string;
} {
  const day = Math.floor(gameDay);
  const week = Math.floor((day - 1) / 7) + 1;
  const dayOfWeek = ((day - 1) % 7) + 1;
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return {
    day,
    week,
    dayOfWeek,
    dayName: dayNames[dayOfWeek - 1],
  };
}
