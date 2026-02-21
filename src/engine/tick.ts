/**
 * Main game tick loop
 * 
 * Runs continuously using requestAnimationFrame, calculating delta time
 * and updating all game systems.
 */

import { GameTime, REAL_MS_PER_GAME_DAY, Business } from './types';
import { emitNewDay } from './events';

export interface TickState {
  running: boolean;
  lastTickTime: number;
  gameTime: GameTime;
  accumulatedMs: number;
}

export type TickCallback = (deltaMs: number, gameTime: GameTime) => void;

class GameLoop {
  private state: TickState;
  private callbacks: Set<TickCallback> = new Set();
  private animationFrameId: number | null = null;
  private lastDayEmitted: number = 0;

  constructor() {
    this.state = {
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
  }

  /**
   * Register a callback to be called every tick
   */
  register(callback: TickCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.state.running) return;
    
    this.state.running = true;
    this.state.lastTickTime = performance.now();
    this.lastDayEmitted = Math.floor(this.state.gameTime.totalDays);
    this.tick();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.state.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main tick function
   */
  private tick = (): void => {
    if (!this.state.running) return;

    const now = performance.now();
    const deltaMs = now - this.state.lastTickTime;
    this.state.lastTickTime = now;

    // Accumulate time and calculate game days
    this.state.accumulatedMs += deltaMs;
    
    // Convert accumulated real time to game days
    const totalGameMs = this.state.accumulatedMs;
    const newTotalDays = totalGameMs / REAL_MS_PER_GAME_DAY;
    
    // Update game time
    this.state.gameTime = this.calculateGameTime(newTotalDays);

    // Emit new day event if we crossed a day boundary
    const currentDayInt = Math.floor(newTotalDays);
    if (currentDayInt > this.lastDayEmitted) {
      for (let day = this.lastDayEmitted + 1; day <= currentDayInt; day++) {
        const time = this.calculateGameTime(day);
        emitNewDay({
          day: time.dayOfMonth,
          month: time.month,
          year: time.year,
        });
      }
      this.lastDayEmitted = currentDayInt;
    }

    // Call all registered callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(deltaMs, this.state.gameTime);
      } catch (e) {
        console.error('Error in tick callback:', e);
      }
    });

    // Schedule next tick
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Calculate game time from total days
   */
  private calculateGameTime(totalDays: number): GameTime {
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

  /**
   * Get current game time
   */
  getGameTime(): GameTime {
    return { ...this.state.gameTime };
  }

  /**
   * Get accumulated milliseconds (for save/restore)
   */
  getAccumulatedMs(): number {
    return this.state.accumulatedMs;
  }

  /**
   * Set accumulated milliseconds (for save/restore)
   */
  setAccumulatedMs(ms: number): void {
    this.state.accumulatedMs = ms;
    this.state.gameTime = this.calculateGameTime(ms / REAL_MS_PER_GAME_DAY);
    this.lastDayEmitted = Math.floor(this.state.gameTime.totalDays);
  }

  /**
   * Fast-forward time (for testing)
   * This triggers day events for each day skipped
   */
  fastForward(gameDays: number): void {
    const additionalMs = gameDays * REAL_MS_PER_GAME_DAY;
    // Don't use setAccumulatedMs because it updates lastDayEmitted
    // We want the tick loop to discover the change and emit events
    this.state.accumulatedMs += additionalMs;
    this.state.gameTime = this.calculateGameTime(this.state.accumulatedMs / REAL_MS_PER_GAME_DAY);
    // Note: lastDayEmitted is NOT updated here, so next tick will emit newDay events
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.state.running;
  }
}

// Singleton instance
export const gameLoop = new GameLoop();

// =============================================================================
// DEBUG / DEV TOOLS
// =============================================================================

/** Skip forward one game day (for testing) */
export const skipDay = () => gameLoop.fastForward(1);

/** Skip forward one game week (for testing) */
export const skipWeek = () => gameLoop.fastForward(7);

/** Skip forward one game month (for testing) */
export const skipMonth = () => gameLoop.fastForward(30);

// Expose to window for dev console
if (typeof window !== 'undefined') {
  (window as any).__gameLoop = gameLoop;
  (window as any).__skipDay = skipDay;
  (window as any).__skipWeek = skipWeek;
  (window as any).__skipMonth = skipMonth;
}
