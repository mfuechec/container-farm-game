/**
 * Time Engine Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDeltaDays,
  calculateGameDay,
  processTick,
  skipTime,
  getTimeInfo,
  MS_PER_GAME_DAY,
  MS_PER_GAME_WEEK,
  TickInput,
} from '../../src/engine/timeEngine';

describe('calculateDeltaDays', () => {
  it('calculates days from milliseconds', () => {
    const lastTick = 0;
    const currentTime = MS_PER_GAME_DAY;
    expect(calculateDeltaDays(lastTick, currentTime)).toBe(1);
  });

  it('handles fractional days', () => {
    const lastTick = 0;
    const currentTime = MS_PER_GAME_DAY / 2;
    expect(calculateDeltaDays(lastTick, currentTime)).toBe(0.5);
  });

  it('returns 0 when no time passed', () => {
    expect(calculateDeltaDays(1000, 1000)).toBe(0);
  });
});

describe('calculateGameDay', () => {
  it('starts at day 1', () => {
    const start = 0;
    expect(calculateGameDay(start, start)).toBe(1);
  });

  it('increments by 1 per game day', () => {
    const start = 0;
    expect(calculateGameDay(start, MS_PER_GAME_DAY)).toBe(2);
    expect(calculateGameDay(start, MS_PER_GAME_DAY * 6)).toBe(7);
  });
});

describe('getTimeInfo', () => {
  it('returns correct day and week for day 1', () => {
    const info = getTimeInfo(1);
    expect(info.day).toBe(1);
    expect(info.week).toBe(1);
    expect(info.dayOfWeek).toBe(1);
    expect(info.dayName).toBe('Mon');
  });

  it('returns correct info for day 8 (start of week 2)', () => {
    const info = getTimeInfo(8);
    expect(info.day).toBe(8);
    expect(info.week).toBe(2);
    expect(info.dayOfWeek).toBe(1);
    expect(info.dayName).toBe('Mon');
  });

  it('returns correct info for day 7 (end of week 1)', () => {
    const info = getTimeInfo(7);
    expect(info.day).toBe(7);
    expect(info.week).toBe(1);
    expect(info.dayOfWeek).toBe(7);
    expect(info.dayName).toBe('Sun');
  });
});

describe('processTick', () => {
  const baseInput: TickInput = {
    lastTick: 0,
    currentTime: MS_PER_GAME_DAY,
    gameStartTime: 0,
    plants: {},
    pots: [],
    harvest: [],
    lightCoverage: 2,
    kitchen: { capacity: 5, storage: [] },
    economy: {
      money: 100,
      weeklyRent: 50,
      weeklyGroceryBase: 30,
    },
    rentPerWeek: 50,
    groceryBase: 30,
    lastRentPaid: 0,
  };

  it('advances game day', () => {
    const result = processTick(baseInput);
    expect(result.gameDay).toBe(2);
  });

  it('updates lastTick', () => {
    const result = processTick(baseInput);
    expect(result.lastTick).toBe(baseInput.currentTime);
  });

  it('returns unchanged state when no time passed', () => {
    const input = { ...baseInput, currentTime: 0 };
    const result = processTick(input);
    expect(result.plants).toBe(input.plants);
    expect(result.economy).toBe(input.economy);
  });

  it('grows plants over time', () => {
    const input: TickInput = {
      ...baseInput,
      plants: {
        'plant-1': {
          id: 'plant-1',
          typeId: 'basil',
          growthProgress: 0,
          stage: 'seed',
          plantedAt: 0,
        },
      },
      pots: [{ id: 'pot-1', slot: 0, typeId: 'basic', plant: 'plant-1' }],
    };
    const result = processTick(input);
    expect(result.plants['plant-1'].growthProgress).toBeGreaterThan(0);
  });

  it('processes rent when week passes', () => {
    const input: TickInput = {
      ...baseInput,
      currentTime: MS_PER_GAME_WEEK,
      lastRentPaid: 0,
    };
    const result = processTick(input);
    expect(result.economy.money).toBeLessThan(100);
    expect(result.events.some(e => e.type === 'rent_paid')).toBe(true);
  });

  it('emits plant_ready event when plant matures', () => {
    const input: TickInput = {
      ...baseInput,
      plants: {
        'plant-1': {
          id: 'plant-1',
          typeId: 'basil',
          growthProgress: 0.99,
          stage: 'growing',
          plantedAt: 0,
        },
      },
      pots: [{ id: 'pot-1', slot: 0, typeId: 'basic', plant: 'plant-1' }],
    };
    const result = processTick(input);
    expect(result.events.some(e => e.type === 'plant_ready')).toBe(true);
  });
});

describe('skipTime', () => {
  it('advances by specified days', () => {
    const input: TickInput = {
      lastTick: 0,
      currentTime: 0,
      gameStartTime: 0,
      plants: {},
      pots: [],
      harvest: [],
      lightCoverage: 2,
      kitchen: { capacity: 5, storage: [] },
      economy: {
        money: 100,
        weeklyRent: 50,
        weeklyGroceryBase: 30,
      },
      rentPerWeek: 50,
      groceryBase: 30,
      lastRentPaid: 0,
    };
    const result = skipTime(input, 7);
    expect(result.gameDay).toBe(8); // Started at day 1, skipped 7
  });
});
