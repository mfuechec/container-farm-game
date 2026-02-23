/**
 * Economy Engine Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  processRent,
  processGroceries,
  addMoney,
  spendMoney,
  canAfford,
  calculateWeeklyExpenses,
  calculateRunway,
  processWeeklyExpenses,
  isRentDue,
} from '../../src/engine/economyEngine';
import { EconomyState } from '../../src/economy/types';

const baseEconomy: EconomyState = {
  money: 100,
  weeklyRent: 50,
  weeklyGroceryBase: 30,
};

describe('processRent', () => {
  it('deducts rent from money', () => {
    const result = processRent(baseEconomy, 50);
    expect(result.money).toBe(50);
  });

  it('can go negative', () => {
    const result = processRent(baseEconomy, 150);
    expect(result.money).toBe(-50);
  });

  it('preserves other economy fields', () => {
    const result = processRent(baseEconomy, 50);
    expect(result.weeklyRent).toBe(baseEconomy.weeklyRent);
    expect(result.weeklyGroceryBase).toBe(baseEconomy.weeklyGroceryBase);
  });
});

describe('processGroceries', () => {
  it('deducts groceries minus savings', () => {
    const result = processGroceries(baseEconomy, 30, 10);
    expect(result.money).toBe(80); // 100 - (30 - 10)
  });

  it('savings can reduce cost to zero', () => {
    const result = processGroceries(baseEconomy, 30, 50);
    expect(result.money).toBe(100); // No cost
  });
});

describe('addMoney', () => {
  it('adds money to balance', () => {
    const result = addMoney(baseEconomy, 50);
    expect(result.money).toBe(150);
  });
});

describe('spendMoney', () => {
  it('deducts money when affordable', () => {
    const result = spendMoney(baseEconomy, 30);
    expect(result).not.toBeNull();
    expect(result!.money).toBe(70);
  });

  it('returns null when not affordable', () => {
    const result = spendMoney(baseEconomy, 150);
    expect(result).toBeNull();
  });

  it('allows debt when specified', () => {
    const result = spendMoney(baseEconomy, 150, true);
    expect(result).not.toBeNull();
    expect(result!.money).toBe(-50);
  });
});

describe('canAfford', () => {
  it('returns true when affordable', () => {
    expect(canAfford(baseEconomy, 50)).toBe(true);
    expect(canAfford(baseEconomy, 100)).toBe(true);
  });

  it('returns false when not affordable', () => {
    expect(canAfford(baseEconomy, 101)).toBe(false);
  });
});

describe('calculateWeeklyExpenses', () => {
  it('sums rent and groceries', () => {
    expect(calculateWeeklyExpenses(50, 30, 0)).toBe(80);
  });

  it('subtracts grocery savings', () => {
    expect(calculateWeeklyExpenses(50, 30, 10)).toBe(70);
  });

  it('caps grocery cost at zero', () => {
    expect(calculateWeeklyExpenses(50, 30, 50)).toBe(50);
  });
});

describe('calculateRunway', () => {
  it('returns Infinity when sustainable', () => {
    expect(calculateRunway(100, 50, 60)).toBe(Infinity);
  });

  it('calculates weeks until bankruptcy', () => {
    // $100, $50/week expenses, no income = 2 weeks = 14 days
    expect(calculateRunway(100, 50, 0)).toBe(14);
  });
});

describe('isRentDue', () => {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  it('returns false if less than a week passed', () => {
    const lastPaid = 1000;
    const now = lastPaid + msPerWeek - 1;
    expect(isRentDue(lastPaid, now, msPerWeek)).toBe(false);
  });

  it('returns true if a week or more passed', () => {
    const lastPaid = 1000;
    const now = lastPaid + msPerWeek;
    expect(isRentDue(lastPaid, now, msPerWeek)).toBe(true);
  });
});

describe('processWeeklyExpenses', () => {
  it('processes both rent and groceries', () => {
    const result = processWeeklyExpenses(baseEconomy, 50, 30, 10);
    // 100 - 50 (rent) - 20 (groceries - savings) = 30
    expect(result.money).toBe(30);
  });
});
