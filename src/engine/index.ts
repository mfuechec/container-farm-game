/**
 * Game Engine - Unified export of all pure game logic
 * 
 * Usage:
 *   import { engine } from './engine';
 *   
 *   // Process a game tick
 *   const result = engine.time.processTick(input);
 *   
 *   // Calculate plant growth
 *   const newPlant = engine.plants.calculateGrowth(plant, days, boost);
 *   
 *   // Check if player can afford something
 *   const canBuy = engine.economy.canAfford(economy, 50);
 */

import * as plantEngine from './plantEngine';
import * as economyEngine from './economyEngine';
import * as kitchenEngine from './kitchenEngine';
import * as timeEngine from './timeEngine';

// Re-export individual engines
export { plantEngine, economyEngine, kitchenEngine, timeEngine };

// Unified engine object for convenience
export const engine = {
  plants: plantEngine,
  economy: economyEngine,
  kitchen: kitchenEngine,
  time: timeEngine,
} as const;

// Re-export commonly used types
export type { TickInput, TickOutput, TickEvent } from './timeEngine';

// Re-export time constants
export {
  MS_PER_GAME_DAY,
  MS_PER_GAME_WEEK,
  DAYS_PER_WEEK,
} from './timeEngine';

// Default export
export default engine;
