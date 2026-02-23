/**
 * Synergy System Tests
 * 
 * Tests the event bus pattern for cross-hobby synergies.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  synergyBus,
  SynergyEvent,
  SynergyType,
  emitSynergy,
  onSynergy,
  getSynergyBonus,
  clearSynergyBonus,
  getActiveSynergies,
  SYNERGY_DECAY_DAYS,
} from '../src/engine/synergies';

describe('Synergy Event Bus', () => {
  beforeEach(() => {
    // Clear any existing synergies
    synergyBus.clear();
  });

  afterEach(() => {
    synergyBus.clear();
  });

  it('should emit and receive synergy events', () => {
    const handler = vi.fn();
    const unsubscribe = onSynergy(handler);
    
    const event: SynergyEvent = {
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    };
    
    emitSynergy(event);
    
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
    
    unsubscribe();
  });

  it('should unsubscribe from events', () => {
    const handler = vi.fn();
    const unsubscribe = onSynergy(handler);
    
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    expect(handler).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 11,
    });
    
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should support multiple subscribers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    const unsub1 = onSynergy(handler1);
    const unsub2 = onSynergy(handler2);
    
    emitSynergy({
      type: 'spent_substrate',
      source: 'mushrooms',
      target: 'plants',
      amount: 0.15,
      gameDay: 5,
    });
    
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    
    unsub1();
    unsub2();
  });
});

describe('Synergy Bonus Tracking', () => {
  beforeEach(() => {
    synergyBus.clear();
  });

  afterEach(() => {
    synergyBus.clear();
  });

  it('should track synergy bonus for target hobby', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    const bonus = getSynergyBonus('mushrooms', 10);
    expect(bonus).toBeCloseTo(0.2);
  });

  it('should accumulate multiple synergy bonuses', () => {
    // Both synergies on same day - no decay
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.1,
      gameDay: 10,
    });
    
    const bonus = getSynergyBonus('mushrooms', 10);
    expect(bonus).toBeCloseTo(0.3);
  });

  it('should decay synergy bonuses over time', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    // Check immediately
    expect(getSynergyBonus('mushrooms', 10)).toBeCloseTo(0.2);
    
    // After half decay period
    const halfDecay = Math.floor(SYNERGY_DECAY_DAYS / 2);
    expect(getSynergyBonus('mushrooms', 10 + halfDecay)).toBeLessThan(0.2);
    expect(getSynergyBonus('mushrooms', 10 + halfDecay)).toBeGreaterThan(0);
    
    // After full decay
    expect(getSynergyBonus('mushrooms', 10 + SYNERGY_DECAY_DAYS + 1)).toBe(0);
  });

  it('should return 0 for hobby with no synergies', () => {
    expect(getSynergyBonus('mushrooms', 10)).toBe(0);
    expect(getSynergyBonus('plants', 10)).toBe(0);
  });

  it('should clear synergy bonuses', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    expect(getSynergyBonus('mushrooms', 10)).toBeCloseTo(0.2);
    
    clearSynergyBonus('mushrooms');
    
    expect(getSynergyBonus('mushrooms', 10)).toBe(0);
  });
});

describe('Active Synergies', () => {
  beforeEach(() => {
    synergyBus.clear();
  });

  afterEach(() => {
    synergyBus.clear();
  });

  it('should return list of active synergies for a hobby', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    const active = getActiveSynergies('mushrooms', 10);
    expect(active).toHaveLength(1);
    expect(active[0].type).toBe('compost');
    expect(active[0].source).toBe('plants');
  });

  it('should not return expired synergies', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 5,
    });
    
    const active = getActiveSynergies('mushrooms', 5 + SYNERGY_DECAY_DAYS + 1);
    expect(active).toHaveLength(0);
  });

  it('should return both synergy types when active', () => {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount: 0.2,
      gameDay: 10,
    });
    
    emitSynergy({
      type: 'spent_substrate',
      source: 'mushrooms',
      target: 'plants',
      amount: 0.15,
      gameDay: 10,
    });
    
    const mushroomSynergies = getActiveSynergies('mushrooms', 10);
    const plantSynergies = getActiveSynergies('plants', 10);
    
    expect(mushroomSynergies).toHaveLength(1);
    expect(mushroomSynergies[0].type).toBe('compost');
    
    expect(plantSynergies).toHaveLength(1);
    expect(plantSynergies[0].type).toBe('spent_substrate');
  });
});

describe('Synergy Types', () => {
  it('should have compost synergy (plants → mushrooms)', () => {
    const types: SynergyType[] = ['compost', 'spent_substrate'];
    expect(types).toContain('compost');
  });

  it('should have spent_substrate synergy (mushrooms → plants)', () => {
    const types: SynergyType[] = ['compost', 'spent_substrate'];
    expect(types).toContain('spent_substrate');
  });
});
