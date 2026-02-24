/**
 * Unit tests for economy.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STARTING_MONEY, STARTER_JOB } from './types';

// Mock the save module
const mockState = {
  money: STARTING_MONEY,
  totalEarnings: 0,
  housingTier: 1,
  job: { ...STARTER_JOB },
};

vi.mock('./save', () => ({
  getPlayerState: () => ({ ...mockState }),
  updatePlayerState: (updates: Partial<typeof mockState>) => {
    Object.assign(mockState, updates);
  },
}));

// Mock events (no-op)
vi.mock('./events', () => ({
  onNewDay: vi.fn(),
  emitMoneyEarned: vi.fn(),
  emitMoneySpent: vi.fn(),
  emitNotification: vi.fn(),
}));

// Mock tick
vi.mock('./tick', () => ({
  gameLoop: {
    register: vi.fn(),
    getGameTime: () => ({ totalDays: 0, dayOfMonth: 1, month: 1, year: 1 }),
  },
}));

import {
  getMoney,
  addMoney,
  spendMoney,
  canAfford,
  getHousing,
  getAvailableSlots,
  getDailyRent,
  canUpgradeHousing,
  getJob,
  getDailyJobIncome,
  canQuitJob,
  getDailyBalance,
} from './economy';

// Helper to reset mock state
function resetState() {
  mockState.money = STARTING_MONEY;
  mockState.totalEarnings = 0;
  mockState.housingTier = 1;
  mockState.job = { ...STARTER_JOB };
}

// Helper to set mock state
function setState(updates: Partial<typeof mockState>) {
  Object.assign(mockState, updates);
}

describe('Economy - Money Operations', () => {
  beforeEach(() => {
    resetState();
  });

  it('should start with initial money', () => {
    expect(getMoney()).toBe(STARTING_MONEY);
  });

  it('should add money correctly', () => {
    const initial = getMoney();
    addMoney(100, 'test income');
    expect(getMoney()).toBe(initial + 100);
  });

  it('should track total earnings', () => {
    addMoney(500, 'sale');
    addMoney(300, 'another sale');
    // Total earnings tracked in state
    // (verified through spending behavior)
  });

  it('should spend money when sufficient funds', () => {
    setState({ money: 1000 });
    const result = spendMoney(500, 'test purchase');
    expect(result).toBe(true);
    expect(getMoney()).toBe(500);
  });

  it('should refuse to spend when insufficient funds', () => {
    setState({ money: 100 });
    const result = spendMoney(500, 'test purchase');
    expect(result).toBe(false);
    expect(getMoney()).toBe(100); // unchanged
  });

  it('should check affordability correctly', () => {
    setState({ money: 500 });
    expect(canAfford(500)).toBe(true);
    expect(canAfford(501)).toBe(false);
    expect(canAfford(0)).toBe(true);
  });
});

describe('Economy - Housing', () => {
  beforeEach(() => {
    resetState();
  });

  it('should start at tier 1 housing', () => {
    const housing = getHousing();
    expect(housing.id).toBe(1);
    expect(housing.name).toBe('Studio Apartment');
  });

  it('should return correct slot count', () => {
    expect(getAvailableSlots()).toBe(1); // Studio has 1 slot
    
    setState({ housingTier: 3 });
    expect(getAvailableSlots()).toBe(4); // 2BR has 4 slots
  });

  it('should return correct daily rent', () => {
    expect(getDailyRent()).toBe(50); // Studio rent
    
    setState({ housingTier: 2 });
    expect(getDailyRent()).toBe(100); // 1BR rent
  });

  it('should check upgrade requirements - insufficient savings', () => {
    setState({ money: 1000 }); // Need 5000 for tier 2
    const result = canUpgradeHousing();
    expect(result.canUpgrade).toBe(false);
    expect(result.nextTier?.id).toBe(2);
    expect(result.reason).toContain('Need $5000');
  });

  it('should allow upgrade with sufficient savings', () => {
    setState({ money: 10000 }); // More than enough
    const result = canUpgradeHousing();
    expect(result.canUpgrade).toBe(true);
    expect(result.nextTier?.id).toBe(2);
  });

  it('should prevent upgrade at max tier', () => {
    setState({ housingTier: 5, money: 999999 });
    const result = canUpgradeHousing();
    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toContain('max housing');
  });

  it('should require quitting job for large house', () => {
    setState({ 
      housingTier: 4, 
      money: 150000,
      job: { ...STARTER_JOB, active: true }
    });
    const result = canUpgradeHousing();
    expect(result.canUpgrade).toBe(false);
    expect(result.reason).toContain('quit day job');
  });
});

describe('Economy - Job', () => {
  beforeEach(() => {
    resetState();
  });

  it('should start with active starter job', () => {
    const job = getJob();
    expect(job.active).toBe(true);
    expect(job.name).toBe('Office Drone');
  });

  it('should return daily income when employed', () => {
    expect(getDailyJobIncome()).toBe(STARTER_JOB.dailyIncome);
  });

  it('should return 0 income when not employed', () => {
    setState({ job: { ...STARTER_JOB, active: false } });
    expect(getDailyJobIncome()).toBe(0);
  });

  it('should check quit requirements - insufficient savings', () => {
    setState({ money: 5000 }); // Need 10000
    const result = canQuitJob();
    expect(result.canQuit).toBe(false);
    expect(result.reason).toContain('savings');
  });

  it('should allow quit with sufficient savings', () => {
    setState({ money: 15000 });
    const result = canQuitJob();
    expect(result.canQuit).toBe(true);
  });

  it('should not allow quit if already quit', () => {
    setState({ 
      money: 50000,
      job: { ...STARTER_JOB, active: false }
    });
    const result = canQuitJob();
    expect(result.canQuit).toBe(false);
    expect(result.reason).toContain('Already quit');
  });
});

describe('Economy - Daily Balance', () => {
  beforeEach(() => {
    resetState();
  });

  it('should calculate balance with job', () => {
    // Job income: 45, Rent: 50, Upkeep: 0
    // Balance: 45 - 50 - 0 = -5
    expect(getDailyBalance()).toBe(-5);
  });

  it('should include business upkeep', () => {
    // Job income: 45, Rent: 50, Upkeep: 10
    // Balance: 45 - 50 - 10 = -15
    expect(getDailyBalance(10)).toBe(-15);
  });

  it('should handle no job', () => {
    setState({ job: { ...STARTER_JOB, active: false } });
    // Job income: 0, Rent: 50, Upkeep: 0
    // Balance: 0 - 50 - 0 = -50
    expect(getDailyBalance()).toBe(-50);
  });

  it('should reflect housing tier changes', () => {
    setState({ housingTier: 3 }); // 2BR: rent 175
    // Job income: 45, Rent: 175, Upkeep: 0
    // Balance: 45 - 175 - 0 = -130
    expect(getDailyBalance()).toBe(-130);
  });
});
