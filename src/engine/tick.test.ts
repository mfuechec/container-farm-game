/**
 * Unit tests for tick.ts (game loop and time system)
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { REAL_MS_PER_GAME_DAY } from './types';

// Create a fresh GameLoop for each test
class TestableGameLoop {
  private state = {
    running: false,
    lastTickTime: 0,
    accumulatedMs: 0,
    gameTime: {
      totalDays: 0,
      dayOfMonth: 1,
      month: 1,
      year: 1,
    },
  };
  private callbacks = new Set<(deltaMs: number, gameTime: any) => void>();
  private lastDayEmitted = 0;

  register(callback: (deltaMs: number, gameTime: any) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  start(): void {
    this.state.running = true;
    this.lastDayEmitted = Math.floor(this.state.gameTime.totalDays);
  }

  stop(): void {
    this.state.running = false;
  }

  isRunning(): boolean {
    return this.state.running;
  }

  getGameTime() {
    return { ...this.state.gameTime };
  }

  getAccumulatedMs(): number {
    return this.state.accumulatedMs;
  }

  setAccumulatedMs(ms: number): void {
    this.state.accumulatedMs = ms;
    this.state.gameTime = this.calculateGameTime(ms / REAL_MS_PER_GAME_DAY);
    this.lastDayEmitted = Math.floor(this.state.gameTime.totalDays);
  }

  fastForward(gameDays: number): void {
    const additionalMs = gameDays * REAL_MS_PER_GAME_DAY;
    this.state.accumulatedMs += additionalMs;
    this.state.gameTime = this.calculateGameTime(this.state.accumulatedMs / REAL_MS_PER_GAME_DAY);
  }

  // Simulate a tick with given delta
  simulateTick(deltaMs: number): { dayEvents: number[] } {
    const dayEvents: number[] = [];
    
    this.state.accumulatedMs += deltaMs;
    const totalGameMs = this.state.accumulatedMs;
    const newTotalDays = totalGameMs / REAL_MS_PER_GAME_DAY;
    
    this.state.gameTime = this.calculateGameTime(newTotalDays);

    const currentDayInt = Math.floor(newTotalDays);
    if (currentDayInt > this.lastDayEmitted) {
      for (let day = this.lastDayEmitted + 1; day <= currentDayInt; day++) {
        dayEvents.push(day);
      }
      this.lastDayEmitted = currentDayInt;
    }

    this.callbacks.forEach(callback => {
      callback(deltaMs, this.state.gameTime);
    });

    return { dayEvents };
  }

  private calculateGameTime(totalDays: number) {
    const daysPerMonth = 30;
    const monthsPerYear = 12;
    const daysPerYear = daysPerMonth * monthsPerYear;

    const year = Math.floor(totalDays / daysPerYear) + 1;
    const dayOfYear = totalDays % daysPerYear;
    const month = Math.floor(dayOfYear / daysPerMonth) + 1;
    const dayOfMonth = Math.floor(dayOfYear % daysPerMonth) + 1;

    return {
      totalDays,
      dayOfMonth,
      month,
      year,
    };
  }
}

describe('GameLoop - Time Calculation', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
  });

  it('should start at day 1, month 1, year 1', () => {
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBe(0);
    expect(time.dayOfMonth).toBe(1);
    expect(time.month).toBe(1);
    expect(time.year).toBe(1);
  });

  it('should convert 1 hour real time to 1 game day', () => {
    gameLoop.setAccumulatedMs(REAL_MS_PER_GAME_DAY);
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBe(1);
    expect(time.dayOfMonth).toBe(2); // Day 2 of month 1
  });

  it('should handle month rollover at day 30', () => {
    gameLoop.setAccumulatedMs(30 * REAL_MS_PER_GAME_DAY);
    const time = gameLoop.getGameTime();
    expect(time.dayOfMonth).toBe(1); // Day 1 of month 2
    expect(time.month).toBe(2);
    expect(time.year).toBe(1);
  });

  it('should handle year rollover at month 12', () => {
    gameLoop.setAccumulatedMs(360 * REAL_MS_PER_GAME_DAY); // 12 months * 30 days
    const time = gameLoop.getGameTime();
    expect(time.dayOfMonth).toBe(1);
    expect(time.month).toBe(1);
    expect(time.year).toBe(2);
  });

  it('should track partial days correctly', () => {
    gameLoop.setAccumulatedMs(REAL_MS_PER_GAME_DAY / 2); // Half a day
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBeCloseTo(0.5, 5);
    expect(time.dayOfMonth).toBe(1); // Still day 1
  });

  it('should calculate time for arbitrary values', () => {
    // 1 year + 2 months + 15 days = 360 + 60 + 15 = 435 days
    gameLoop.setAccumulatedMs(435 * REAL_MS_PER_GAME_DAY);
    const time = gameLoop.getGameTime();
    expect(time.year).toBe(2);
    expect(time.month).toBe(3);
    expect(time.dayOfMonth).toBe(16); // totalDays=435, dayOfYear=75, day=75%30+1=16
  });
});

describe('GameLoop - Running State', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
  });

  it('should not be running initially', () => {
    expect(gameLoop.isRunning()).toBe(false);
  });

  it('should be running after start', () => {
    gameLoop.start();
    expect(gameLoop.isRunning()).toBe(true);
  });

  it('should stop when stop called', () => {
    gameLoop.start();
    gameLoop.stop();
    expect(gameLoop.isRunning()).toBe(false);
  });
});

describe('GameLoop - Fast Forward', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
    gameLoop.start();
  });

  it('should skip forward 1 day', () => {
    gameLoop.fastForward(1);
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBeCloseTo(1, 5);
  });

  it('should skip forward 7 days', () => {
    gameLoop.fastForward(7);
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBeCloseTo(7, 5);
  });

  it('should skip forward 30 days (1 month)', () => {
    gameLoop.fastForward(30);
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBeCloseTo(30, 5);
    expect(time.month).toBe(2);
  });

  it('should accumulate multiple fast forwards', () => {
    gameLoop.fastForward(5);
    gameLoop.fastForward(10);
    gameLoop.fastForward(15);
    const time = gameLoop.getGameTime();
    expect(time.totalDays).toBeCloseTo(30, 5);
  });
});

describe('GameLoop - Tick Callbacks', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
    gameLoop.start();
  });

  it('should call registered callbacks on tick', () => {
    const callback = vi.fn();
    gameLoop.register(callback);
    
    gameLoop.simulateTick(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1000, expect.any(Object));
  });

  it('should pass delta and game time to callbacks', () => {
    const callback = vi.fn();
    gameLoop.register(callback);
    
    gameLoop.simulateTick(REAL_MS_PER_GAME_DAY / 4); // Quarter day
    
    expect(callback).toHaveBeenCalledWith(
      REAL_MS_PER_GAME_DAY / 4,
      expect.objectContaining({
        totalDays: expect.any(Number),
        dayOfMonth: expect.any(Number),
        month: expect.any(Number),
        year: expect.any(Number),
      })
    );
  });

  it('should unregister callbacks correctly', () => {
    const callback = vi.fn();
    const unregister = gameLoop.register(callback);
    
    gameLoop.simulateTick(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    
    unregister();
    
    gameLoop.simulateTick(1000);
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should call multiple callbacks', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();
    
    gameLoop.register(callback1);
    gameLoop.register(callback2);
    gameLoop.register(callback3);
    
    gameLoop.simulateTick(1000);
    
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });
});

describe('GameLoop - Day Events', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
    gameLoop.start();
  });

  it('should emit day event when crossing day boundary', () => {
    const result = gameLoop.simulateTick(REAL_MS_PER_GAME_DAY);
    expect(result.dayEvents).toContain(1);
  });

  it('should not emit day event within same day', () => {
    const result = gameLoop.simulateTick(REAL_MS_PER_GAME_DAY / 2);
    expect(result.dayEvents).toHaveLength(0);
  });

  it('should emit multiple day events for large time skip', () => {
    const result = gameLoop.simulateTick(REAL_MS_PER_GAME_DAY * 5);
    expect(result.dayEvents).toEqual([1, 2, 3, 4, 5]);
  });

  it('should continue emitting from last day', () => {
    gameLoop.simulateTick(REAL_MS_PER_GAME_DAY * 2); // Days 1, 2
    const result = gameLoop.simulateTick(REAL_MS_PER_GAME_DAY * 2); // Days 3, 4
    expect(result.dayEvents).toEqual([3, 4]);
  });
});

describe('GameLoop - Save/Restore', () => {
  let gameLoop: TestableGameLoop;

  beforeEach(() => {
    gameLoop = new TestableGameLoop();
  });

  it('should get accumulated ms', () => {
    gameLoop.setAccumulatedMs(12345);
    expect(gameLoop.getAccumulatedMs()).toBe(12345);
  });

  it('should restore time from accumulated ms', () => {
    const originalMs = 5 * REAL_MS_PER_GAME_DAY; // 5 days
    gameLoop.setAccumulatedMs(originalMs);
    
    expect(gameLoop.getAccumulatedMs()).toBe(originalMs);
    expect(gameLoop.getGameTime().totalDays).toBeCloseTo(5, 5);
  });

  it('should sync lastDayEmitted when restoring', () => {
    // Set to day 10
    gameLoop.setAccumulatedMs(10 * REAL_MS_PER_GAME_DAY);
    gameLoop.start();
    
    // Next tick should not emit days 1-10
    const result = gameLoop.simulateTick(REAL_MS_PER_GAME_DAY);
    expect(result.dayEvents).toEqual([11]); // Only day 11
  });
});
