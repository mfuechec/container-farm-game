/**
 * Animation Functions Tests
 * 
 * Tests the pure calculation functions used for GrowCanvas animations.
 */

import { describe, it, expect } from 'vitest';
import {
  calcLeafSway,
  calcLightFlicker,
  calcGrowthPulse,
  createHarvestParticles,
  updateParticles,
  createAnimationState,
  triggerGrowthPulse,
  triggerHarvestParticles,
  ANIMATION_CONFIG,
} from '../../src/hobbies/plants/animations';

describe('calcLeafSway', () => {
  it('returns 0 at time 0 for leaf index 0', () => {
    // sin(0) = 0
    const offset = calcLeafSway(0, 0);
    expect(offset).toBe(0);
  });

  it('oscillates within amplitude bounds', () => {
    const { amplitude } = ANIMATION_CONFIG.leafSway;
    
    // Test many time values
    for (let t = 0; t < 10000; t += 100) {
      const offset = calcLeafSway(t, 0);
      expect(Math.abs(offset)).toBeLessThanOrEqual(amplitude);
    }
  });

  it('different leaf indices have different phases', () => {
    const time = 1000;
    const offset0 = calcLeafSway(time, 0);
    const offset1 = calcLeafSway(time, 1);
    const offset2 = calcLeafSway(time, 2);
    
    // They shouldn't all be the same
    expect(offset0).not.toBe(offset1);
    expect(offset1).not.toBe(offset2);
  });

  it('changes over time', () => {
    const offset1 = calcLeafSway(0, 0);
    const offset2 = calcLeafSway(500, 0);
    const offset3 = calcLeafSway(1000, 0);
    
    // At least one should be different (sine wave changes)
    expect(offset1 === offset2 && offset2 === offset3).toBe(false);
  });
});

describe('calcLightFlicker', () => {
  it('returns value within min/max alpha bounds', () => {
    const { minAlpha, maxAlpha } = ANIMATION_CONFIG.lightFlicker;
    
    for (let t = 0; t < 10000; t += 50) {
      const alpha = calcLightFlicker(t);
      expect(alpha).toBeGreaterThanOrEqual(minAlpha - 0.01); // Small tolerance for noise
      expect(alpha).toBeLessThanOrEqual(maxAlpha + 0.01);
    }
  });

  it('varies over time', () => {
    const values = new Set<number>();
    for (let t = 0; t < 5000; t += 100) {
      values.add(Math.round(calcLightFlicker(t) * 100));
    }
    // Should have multiple distinct values
    expect(values.size).toBeGreaterThan(5);
  });
});

describe('calcGrowthPulse', () => {
  it('returns scale 1 and complete true when past duration', () => {
    const { duration } = ANIMATION_CONFIG.growthPulse;
    const result = calcGrowthPulse(duration + 100);
    
    expect(result.scale).toBe(1);
    expect(result.glowAlpha).toBe(0);
    expect(result.complete).toBe(true);
  });

  it('returns scale > 1 during pulse', () => {
    const { duration } = ANIMATION_CONFIG.growthPulse;
    // Check at midpoint where pulse should be near peak
    const result = calcGrowthPulse(duration * 0.5);
    
    expect(result.scale).toBeGreaterThan(1);
    expect(result.complete).toBe(false);
  });

  it('has glow during pulse', () => {
    const { duration } = ANIMATION_CONFIG.growthPulse;
    const result = calcGrowthPulse(duration * 0.3);
    
    expect(result.glowAlpha).toBeGreaterThan(0);
  });

  it('scale peaks then returns toward 1', () => {
    const { duration } = ANIMATION_CONFIG.growthPulse;
    
    const early = calcGrowthPulse(duration * 0.1);
    const mid = calcGrowthPulse(duration * 0.5);
    const late = calcGrowthPulse(duration * 0.9);
    
    // Mid should have higher scale than early and late
    expect(mid.scale).toBeGreaterThan(early.scale);
    expect(mid.scale).toBeGreaterThan(late.scale);
  });
});

describe('createHarvestParticles', () => {
  it('creates correct number of particles', () => {
    const particles = createHarvestParticles(100, 100);
    expect(particles.length).toBe(ANIMATION_CONFIG.harvestParticles.count);
  });

  it('particles start at origin', () => {
    const particles = createHarvestParticles(50, 75);
    particles.forEach(p => {
      expect(p.x).toBe(50);
      expect(p.y).toBe(75);
    });
  });

  it('particles have initial velocities', () => {
    const particles = createHarvestParticles(100, 100);
    
    // At least some should have non-zero velocity
    const hasVelocity = particles.some(p => p.vx !== 0 || p.vy !== 0);
    expect(hasVelocity).toBe(true);
  });

  it('particles have valid colors from config', () => {
    const particles = createHarvestParticles(100, 100);
    const validColors = ANIMATION_CONFIG.harvestParticles.colors;
    
    particles.forEach(p => {
      expect(validColors).toContain(p.color);
    });
  });

  it('particles start with full alpha and age 0', () => {
    const particles = createHarvestParticles(100, 100);
    particles.forEach(p => {
      expect(p.alpha).toBe(1);
      expect(p.age).toBe(0);
    });
  });
});

describe('updateParticles', () => {
  it('moves particles based on velocity', () => {
    const particles = createHarvestParticles(100, 100);
    const updated = updateParticles(particles, 16); // ~60fps frame
    
    // Positions should change
    const moved = updated.some((p, i) => 
      p.x !== particles[i].x || p.y !== particles[i].y
    );
    expect(moved).toBe(true);
  });

  it('applies gravity to vy', () => {
    const particles = createHarvestParticles(100, 100);
    const initialVy = particles[0].vy;
    
    // Update multiple frames
    let current = particles;
    for (let i = 0; i < 10; i++) {
      current = updateParticles(current, 16);
    }
    
    // Gravity should have increased vy (made more positive/downward)
    expect(current[0].vy).toBeGreaterThan(initialVy);
  });

  it('reduces alpha over time', () => {
    const particles = createHarvestParticles(100, 100);
    const updated = updateParticles(particles, 200);
    
    updated.forEach(p => {
      expect(p.alpha).toBeLessThan(1);
    });
  });

  it('removes particles past lifetime', () => {
    const particles = createHarvestParticles(100, 100);
    const { lifetime } = ANIMATION_CONFIG.harvestParticles;
    
    // Update past lifetime
    const dead = updateParticles(particles, lifetime + 100);
    expect(dead.length).toBe(0);
  });

  it('keeps particles alive within lifetime', () => {
    const particles = createHarvestParticles(100, 100);
    const { lifetime } = ANIMATION_CONFIG.harvestParticles;
    
    const alive = updateParticles(particles, lifetime * 0.5);
    expect(alive.length).toBe(particles.length);
  });
});

describe('AnimationState', () => {
  it('createAnimationState initializes empty state', () => {
    const state = createAnimationState();
    
    expect(state.activePulses.size).toBe(0);
    expect(state.activeParticles.size).toBe(0);
    expect(state.startTime).toBeLessThanOrEqual(Date.now());
  });

  it('triggerGrowthPulse adds pulse for plant', () => {
    const state = createAnimationState();
    triggerGrowthPulse(state, 'plant-1');
    
    expect(state.activePulses.has('plant-1')).toBe(true);
    expect(state.activePulses.get('plant-1')).toBeLessThanOrEqual(Date.now());
  });

  it('triggerHarvestParticles creates particles at position', () => {
    const state = createAnimationState();
    triggerHarvestParticles(state, 'plant-2', 150, 200);
    
    expect(state.activeParticles.has('plant-2')).toBe(true);
    const particles = state.activeParticles.get('plant-2')!;
    expect(particles.length).toBe(ANIMATION_CONFIG.harvestParticles.count);
    expect(particles[0].x).toBe(150);
    expect(particles[0].y).toBe(200);
  });
});
