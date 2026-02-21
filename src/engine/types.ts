/**
 * Core type definitions for Side Hustle Simulator
 */

// =============================================================================
// TIME
// =============================================================================

/** 1 real hour = 1 game day */
export const REAL_MS_PER_GAME_DAY = 60 * 60 * 1000; // 1 hour in ms

export interface GameTime {
  /** Total game days elapsed since start */
  totalDays: number;
  /** Current day of the month (1-30) */
  dayOfMonth: number;
  /** Current month (1-12) */
  month: number;
  /** Current year */
  year: number;
}

// =============================================================================
// ECONOMY
// =============================================================================

export interface PlayerEconomy {
  money: number;
  totalEarnings: number;
  totalSpent: number;
}

export interface HousingTier {
  id: number;
  name: string;
  slots: number;
  rentPerDay: number;
  unlockSavings: number;
  requiresQuitJob?: boolean;
}

export const HOUSING_TIERS: HousingTier[] = [
  { id: 1, name: 'Studio Apartment', slots: 1, rentPerDay: 50, unlockSavings: 0 },
  { id: 2, name: '1BR Apartment', slots: 2, rentPerDay: 100, unlockSavings: 5000 },
  { id: 3, name: '2BR Apartment', slots: 4, rentPerDay: 175, unlockSavings: 15000 },
  { id: 4, name: 'Small House', slots: 6, rentPerDay: 300, unlockSavings: 40000 },
  { id: 5, name: 'Large House', slots: 10, rentPerDay: 500, unlockSavings: 100000, requiresQuitJob: true },
];

export interface Job {
  name: string;
  dailyIncome: number;
  active: boolean;
}

export const STARTER_JOB: Job = {
  name: 'Office Drone',
  dailyIncome: 45, // Covers ~90% of starter rent
  active: true,
};

// =============================================================================
// BUSINESSES
// =============================================================================

export type BusinessType = 
  | 'herbs'
  | 'mushrooms'
  | 'shrimp'
  | 'woodworking'
  | 'candles'
  | 'coffee';

export interface BusinessConfig {
  type: BusinessType;
  name: string;
  description: string;
  slotsRequired: number;
  setupCost: number;
  dailyUpkeep: number;
}

export interface BusinessState {
  id: string;
  type: BusinessType;
  installedAt: number; // game day
  data: unknown; // Business-specific state
}

export interface Business {
  config: BusinessConfig;
  state: BusinessState;
  
  /** Called every tick with delta time in ms */
  tick(deltaMs: number, gameTime: GameTime): void;
  
  /** Get available actions for UI */
  getActions(): BusinessAction[];
  
  /** Serialize for save */
  serialize(): unknown;
  
  /** Deserialize from save */
  deserialize(data: unknown): void;
  
  /** Get daily upkeep cost (can vary based on state) */
  getDailyUpkeep(): number;
  
  /** React component for rendering */
  Component: React.ComponentType<{ business: Business }>;
}

export interface BusinessAction {
  id: string;
  label: string;
  description?: string;
  cost?: number;
  disabled?: boolean;
  disabledReason?: string;
  execute: () => void;
}

// =============================================================================
// SYNERGIES / EVENTS
// =============================================================================

export type ByproductType = 
  | 'compost'
  | 'coffee_grounds'
  | 'fish_waste'
  | 'herb_scent'
  | 'wood_container';

export interface Byproduct {
  type: ByproductType;
  amount: number;
  sourceBusinessId: string;
}

export interface GameEvent {
  type: string;
  payload: unknown;
  timestamp: number;
}

// =============================================================================
// SAVE DATA
// =============================================================================

export interface GameSave {
  version: number;
  timestamp: number;
  realTimeAtSave: number;
  
  time: GameTime;
  
  player: {
    money: number;
    totalEarnings: number;
    housingTier: number;
    job: Job;
  };
  
  businesses: {
    [id: string]: {
      type: BusinessType;
      installedAt: number;
      data: unknown;
    };
  };
  
  unlocks: string[];
  achievements: string[];
}

export const SAVE_VERSION = 1;
export const STARTING_MONEY = 2000;
