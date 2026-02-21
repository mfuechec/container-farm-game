/**
 * Save/Load system
 * 
 * Handles persistence to localStorage (web) and will integrate with
 * Tauri file system / Steam Cloud when wrapped.
 */

import { GameSave, SAVE_VERSION, STARTING_MONEY, STARTER_JOB, GameTime } from './types';
import { gameLoop } from './tick';

const SAVE_KEY = 'sidehustle_save';
const AUTO_SAVE_INTERVAL = 60 * 1000; // 60 seconds

export interface SaveManager {
  save(): GameSave;
  load(): GameSave | null;
  reset(): void;
  exportSave(): string;
  importSave(json: string): boolean;
}

// Game state that other modules will register with
let playerState = {
  money: STARTING_MONEY,
  totalEarnings: 0,
  housingTier: 1,
  job: { ...STARTER_JOB },
};

let businessStates: Map<string, { type: string; installedAt: number; data: unknown }> = new Map();
let unlocks: Set<string> = new Set();
let achievements: Set<string> = new Set();

// Callbacks for when save is loaded
type LoadCallback = (save: GameSave) => void;
const loadCallbacks: Set<LoadCallback> = new Set();

/**
 * Register a callback to be called when a save is loaded
 */
export function onSaveLoaded(callback: LoadCallback): () => void {
  loadCallbacks.add(callback);
  return () => loadCallbacks.delete(callback);
}

/**
 * Update player state (called by game systems)
 */
export function updatePlayerState(updates: Partial<typeof playerState>): void {
  playerState = { ...playerState, ...updates };
}

/**
 * Get current player state
 */
export function getPlayerState(): typeof playerState {
  return { ...playerState };
}

/**
 * Register a business's state for saving
 */
export function registerBusinessState(
  id: string, 
  type: string, 
  installedAt: number, 
  data: unknown
): void {
  businessStates.set(id, { type, installedAt, data });
}

/**
 * Update a business's state
 */
export function updateBusinessState(id: string, data: unknown): void {
  const existing = businessStates.get(id);
  if (existing) {
    businessStates.set(id, { ...existing, data });
  }
}

/**
 * Remove a business's state
 */
export function removeBusinessState(id: string): void {
  businessStates.delete(id);
}

/**
 * Add an unlock
 */
export function addUnlock(unlock: string): void {
  unlocks.add(unlock);
}

/**
 * Check if something is unlocked
 */
export function hasUnlock(unlock: string): boolean {
  return unlocks.has(unlock);
}

/**
 * Add an achievement
 */
export function addAchievement(achievement: string): void {
  achievements.add(achievement);
  // TODO: Emit event for Steam achievement
}

/**
 * Create a save object from current state
 */
export function createSave(): GameSave {
  const gameTime = gameLoop.getGameTime();
  const accumulatedMs = gameLoop.getAccumulatedMs();
  
  const businessData: GameSave['businesses'] = {};
  businessStates.forEach((state, id) => {
    businessData[id] = {
      type: state.type as any,
      installedAt: state.installedAt,
      data: state.data,
    };
  });

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    realTimeAtSave: accumulatedMs,
    time: gameTime,
    player: {
      money: playerState.money,
      totalEarnings: playerState.totalEarnings,
      housingTier: playerState.housingTier,
      job: playerState.job,
    },
    businesses: businessData,
    unlocks: Array.from(unlocks),
    achievements: Array.from(achievements),
  };
}

/**
 * Save to storage
 */
export function save(): GameSave {
  const saveData = createSave();
  
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('Game saved at', new Date().toISOString());
  } catch (e) {
    console.error('Failed to save game:', e);
  }
  
  return saveData;
}

/**
 * Load from storage
 */
export function load(): GameSave | null {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return null;
    
    const saveData = JSON.parse(json) as GameSave;
    
    // Version migration could go here
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} vs ${SAVE_VERSION}`);
      // For now, just try to load it anyway
    }
    
    // Restore state
    playerState = {
      money: saveData.player.money,
      totalEarnings: saveData.player.totalEarnings,
      housingTier: saveData.player.housingTier,
      job: saveData.player.job,
    };
    
    businessStates.clear();
    Object.entries(saveData.businesses).forEach(([id, state]) => {
      businessStates.set(id, state);
    });
    
    unlocks = new Set(saveData.unlocks);
    achievements = new Set(saveData.achievements);
    
    // Restore game time
    gameLoop.setAccumulatedMs(saveData.realTimeAtSave);
    
    // Notify listeners
    loadCallbacks.forEach(cb => cb(saveData));
    
    console.log('Game loaded from', new Date(saveData.timestamp).toISOString());
    return saveData;
    
  } catch (e) {
    console.error('Failed to load save:', e);
    return null;
  }
}

/**
 * Reset to new game
 */
export function reset(): void {
  playerState = {
    money: STARTING_MONEY,
    totalEarnings: 0,
    housingTier: 1,
    job: { ...STARTER_JOB },
  };
  businessStates.clear();
  unlocks.clear();
  achievements.clear();
  gameLoop.setAccumulatedMs(0);
  
  localStorage.removeItem(SAVE_KEY);
  console.log('Game reset');
}

/**
 * Export save as JSON string (for backup/sharing)
 */
export function exportSave(): string {
  return JSON.stringify(createSave(), null, 2);
}

/**
 * Import save from JSON string
 */
export function importSave(json: string): boolean {
  try {
    const saveData = JSON.parse(json) as GameSave;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    load();
    return true;
  } catch (e) {
    console.error('Failed to import save:', e);
    return false;
  }
}

/**
 * Check if a save exists
 */
export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// =============================================================================
// AUTO-SAVE
// =============================================================================

let autoSaveInterval: number | null = null;

export function startAutoSave(): void {
  if (autoSaveInterval) return;
  
  autoSaveInterval = window.setInterval(() => {
    if (gameLoop.isRunning()) {
      save();
    }
  }, AUTO_SAVE_INTERVAL);
  
  // Also save on visibility change (tab blur)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameLoop.isRunning()) {
      save();
    }
  });
  
  // Save before unload
  window.addEventListener('beforeunload', () => {
    if (gameLoop.isRunning()) {
      save();
    }
  });
}

export function stopAutoSave(): void {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// =============================================================================
// DEV TOOLS
// =============================================================================

if (typeof window !== 'undefined') {
  (window as any).__save = save;
  (window as any).__load = load;
  (window as any).__reset = reset;
  (window as any).__exportSave = exportSave;
  (window as any).__importSave = importSave;
}
