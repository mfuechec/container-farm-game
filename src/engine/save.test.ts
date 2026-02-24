/**
 * Unit tests for save.ts
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { STARTING_MONEY, STARTER_JOB, SAVE_VERSION } from './types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock gameLoop
vi.mock('./tick', () => ({
  gameLoop: {
    getGameTime: () => ({ totalDays: 5, dayOfMonth: 6, month: 1, year: 1 }),
    getAccumulatedMs: () => 18000000, // 5 hours = 5 game days
    setAccumulatedMs: vi.fn(),
    isRunning: () => true,
  },
}));

import {
  getPlayerState,
  updatePlayerState,
  registerBusinessState,
  updateBusinessState,
  removeBusinessState,
  addUnlock,
  hasUnlock,
  addAchievement,
  createSave,
  save,
  load,
  reset,
  exportSave,
  importSave,
  hasSave,
  onSaveLoaded,
} from './save';

describe('Save - Player State', () => {
  beforeEach(() => {
    reset();
    localStorageMock.clear();
  });

  it('should return default player state', () => {
    const state = getPlayerState();
    expect(state.money).toBe(STARTING_MONEY);
    expect(state.totalEarnings).toBe(0);
    expect(state.housingTier).toBe(1);
    expect(state.job).toEqual(STARTER_JOB);
  });

  it('should update player state partially', () => {
    updatePlayerState({ money: 5000 });
    const state = getPlayerState();
    expect(state.money).toBe(5000);
    expect(state.housingTier).toBe(1); // unchanged
  });

  it('should update multiple fields', () => {
    updatePlayerState({ 
      money: 10000, 
      totalEarnings: 8000,
      housingTier: 2 
    });
    const state = getPlayerState();
    expect(state.money).toBe(10000);
    expect(state.totalEarnings).toBe(8000);
    expect(state.housingTier).toBe(2);
  });

  it('should return a copy of state (immutable)', () => {
    const state1 = getPlayerState();
    state1.money = 999999;
    const state2 = getPlayerState();
    expect(state2.money).toBe(STARTING_MONEY); // unchanged
  });
});

describe('Save - Business State', () => {
  beforeEach(() => {
    reset();
  });

  it('should register business state', () => {
    registerBusinessState('herbs-1', 'herbs', 5, { plants: [] });
    const saveData = createSave();
    expect(saveData.businesses['herbs-1']).toBeDefined();
    expect(saveData.businesses['herbs-1'].type).toBe('herbs');
  });

  it('should update business state', () => {
    registerBusinessState('herbs-1', 'herbs', 5, { plants: [] });
    updateBusinessState('herbs-1', { plants: [{ id: 1 }] });
    const saveData = createSave();
    expect(saveData.businesses['herbs-1'].data).toEqual({ plants: [{ id: 1 }] });
  });

  it('should remove business state', () => {
    registerBusinessState('herbs-1', 'herbs', 5, { plants: [] });
    removeBusinessState('herbs-1');
    const saveData = createSave();
    expect(saveData.businesses['herbs-1']).toBeUndefined();
  });

  it('should handle multiple businesses', () => {
    registerBusinessState('herbs-1', 'herbs', 1, { count: 10 });
    registerBusinessState('mushrooms-1', 'mushrooms', 3, { spores: 5 });
    const saveData = createSave();
    expect(Object.keys(saveData.businesses)).toHaveLength(2);
  });
});

describe('Save - Unlocks and Achievements', () => {
  beforeEach(() => {
    reset();
  });

  it('should add and check unlocks', () => {
    expect(hasUnlock('mushrooms')).toBe(false);
    addUnlock('mushrooms');
    expect(hasUnlock('mushrooms')).toBe(true);
  });

  it('should persist unlocks in save', () => {
    addUnlock('mushrooms');
    addUnlock('coffee');
    const saveData = createSave();
    expect(saveData.unlocks).toContain('mushrooms');
    expect(saveData.unlocks).toContain('coffee');
  });

  it('should add achievements', () => {
    addAchievement('first_sale');
    const saveData = createSave();
    expect(saveData.achievements).toContain('first_sale');
  });
});

describe('Save - Create Save', () => {
  beforeEach(() => {
    reset();
  });

  it('should create save with correct version', () => {
    const saveData = createSave();
    expect(saveData.version).toBe(SAVE_VERSION);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const saveData = createSave();
    const after = Date.now();
    expect(saveData.timestamp).toBeGreaterThanOrEqual(before);
    expect(saveData.timestamp).toBeLessThanOrEqual(after);
  });

  it('should include game time', () => {
    const saveData = createSave();
    expect(saveData.time).toEqual({
      totalDays: 5,
      dayOfMonth: 6,
      month: 1,
      year: 1,
    });
  });

  it('should include real time at save', () => {
    const saveData = createSave();
    expect(saveData.realTimeAtSave).toBe(18000000);
  });
});

describe('Save - Persistence', () => {
  beforeEach(() => {
    reset();
    localStorageMock.clear();
  });

  it('should save to localStorage', () => {
    updatePlayerState({ money: 5000 });
    save();
    expect(localStorageMock.getItem('sidehustle_save')).not.toBeNull();
  });

  it('should load from localStorage', () => {
    updatePlayerState({ money: 7500, housingTier: 2 });
    save();
    
    // Save the localStorage content before reset
    const savedJson = localStorageMock.getItem('sidehustle_save');
    
    reset(); // Clear in-memory state (also clears localStorage)
    
    // Restore localStorage manually for the load test
    localStorageMock.setItem('sidehustle_save', savedJson!);
    
    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded?.player.money).toBe(7500);
    expect(loaded?.player.housingTier).toBe(2);
  });

  it('should restore player state on load', () => {
    updatePlayerState({ money: 12000 });
    save();
    
    // Save the localStorage content before reset
    const savedJson = localStorageMock.getItem('sidehustle_save');
    
    reset();
    
    // Restore localStorage manually
    localStorageMock.setItem('sidehustle_save', savedJson!);
    
    load();
    
    const state = getPlayerState();
    expect(state.money).toBe(12000);
  });

  it('should return null when no save exists', () => {
    localStorageMock.clear();
    const loaded = load();
    expect(loaded).toBeNull();
  });

  it('should check if save exists', () => {
    expect(hasSave()).toBe(false);
    save();
    expect(hasSave()).toBe(true);
  });
});

describe('Save - Reset', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should reset player state to defaults', () => {
    updatePlayerState({ money: 50000, housingTier: 4 });
    reset();
    
    const state = getPlayerState();
    expect(state.money).toBe(STARTING_MONEY);
    expect(state.housingTier).toBe(1);
  });

  it('should clear localStorage', () => {
    save();
    expect(hasSave()).toBe(true);
    reset();
    expect(hasSave()).toBe(false);
  });

  it('should clear businesses', () => {
    registerBusinessState('test-1', 'herbs', 1, {});
    reset();
    const saveData = createSave();
    expect(Object.keys(saveData.businesses)).toHaveLength(0);
  });

  it('should clear unlocks', () => {
    addUnlock('test');
    reset();
    expect(hasUnlock('test')).toBe(false);
  });
});

describe('Save - Export/Import', () => {
  beforeEach(() => {
    reset();
    localStorageMock.clear();
  });

  it('should export save as JSON', () => {
    updatePlayerState({ money: 9999 });
    const json = exportSave();
    const parsed = JSON.parse(json);
    expect(parsed.player.money).toBe(9999);
  });

  it('should format export with indentation', () => {
    const json = exportSave();
    expect(json).toContain('\n'); // Pretty printed
  });

  it('should import valid JSON', () => {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      realTimeAtSave: 0,
      time: { totalDays: 0, dayOfMonth: 1, month: 1, year: 1 },
      player: {
        money: 25000,
        totalEarnings: 20000,
        housingTier: 3,
        job: STARTER_JOB,
      },
      businesses: {},
      unlocks: ['mushrooms'],
      achievements: [],
    };
    
    const result = importSave(JSON.stringify(saveData));
    expect(result).toBe(true);
    expect(getPlayerState().money).toBe(25000);
    expect(hasUnlock('mushrooms')).toBe(true);
  });

  it('should reject invalid JSON', () => {
    const result = importSave('not valid json {{{');
    expect(result).toBe(false);
  });
});

describe('Save - Load Callbacks', () => {
  beforeEach(() => {
    reset();
    localStorageMock.clear();
  });

  it('should call registered callbacks on load', () => {
    const callback = vi.fn();
    onSaveLoaded(callback);
    
    save();
    const savedJson = localStorageMock.getItem('sidehustle_save');
    reset();
    localStorageMock.setItem('sidehustle_save', savedJson!);
    load();
    
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should pass save data to callbacks', () => {
    const callback = vi.fn();
    onSaveLoaded(callback);
    
    updatePlayerState({ money: 3333 });
    save();
    const savedJson = localStorageMock.getItem('sidehustle_save');
    reset();
    localStorageMock.setItem('sidehustle_save', savedJson!);
    load();
    
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        player: expect.objectContaining({ money: 3333 })
      })
    );
  });

  it('should unregister callbacks', () => {
    const callback = vi.fn();
    const unregister = onSaveLoaded(callback);
    
    save();
    const savedJson = localStorageMock.getItem('sidehustle_save');
    reset();
    localStorageMock.setItem('sidehustle_save', savedJson!);
    load();
    expect(callback).toHaveBeenCalledTimes(1);
    
    unregister();
    
    save();
    const savedJson2 = localStorageMock.getItem('sidehustle_save');
    reset();
    localStorageMock.setItem('sidehustle_save', savedJson2!);
    load();
    expect(callback).toHaveBeenCalledTimes(1); // Still 1
  });
});
