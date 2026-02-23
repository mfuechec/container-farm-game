/**
 * GrowCanvas Animations - Pure calculation functions
 * 
 * These are testable pure functions that calculate animation values.
 * The actual rendering happens in GrowCanvas using these values.
 */

// Animation configuration
export const ANIMATION_CONFIG = {
  leafSway: {
    amplitude: 3,        // Max pixel offset
    frequency: 0.002,    // Oscillation speed (radians per ms)
    phaseVariation: 1.5, // Random phase offset per leaf
  },
  lightFlicker: {
    minAlpha: 0.5,      // More visible flicker (was 0.85)
    maxAlpha: 1.0,
    frequency: 0.004,   // Slightly faster for more lively effect
    noiseScale: 0.25,   // More random variation for organic feel
  },
  growthPulse: {
    duration: 500,      // ms
    maxScale: 1.15,     // Peak scale during pulse
    glowAlpha: 0.6,     // Glow intensity at peak
  },
  harvestParticles: {
    count: 12,
    speed: 2,           // pixels per frame
    spread: Math.PI,    // Radians of spread (180 degrees up)
    lifetime: 800,      // ms
    gravity: 0.05,      // Downward acceleration
    colors: [0x4CAF50, 0x81C784, 0xFFD54F, 0xFFF176], // Green + gold sparkles
  },
};

/**
 * Calculate leaf sway offset for a given time and leaf index
 * Returns x offset in pixels
 */
export function calcLeafSway(
  elapsed: number,
  leafIndex: number,
  config = ANIMATION_CONFIG.leafSway
): number {
  const phase = leafIndex * config.phaseVariation;
  return Math.sin(elapsed * config.frequency + phase) * config.amplitude;
}

/**
 * Calculate light alpha for flicker effect
 * Uses sine wave + noise for organic feel
 */
export function calcLightFlicker(
  elapsed: number,
  config = ANIMATION_CONFIG.lightFlicker
): number {
  const base = Math.sin(elapsed * config.frequency);
  // Pseudo-noise using faster sine
  const noise = Math.sin(elapsed * config.frequency * 7.3) * config.noiseScale;
  const normalized = Math.max(0, Math.min(1, (base + noise + 1) / 2)); // Clamp 0-1
  return config.minAlpha + normalized * (config.maxAlpha - config.minAlpha);
}

/**
 * Calculate growth pulse scale and glow
 * Returns { scale, glowAlpha } based on progress through pulse
 */
export function calcGrowthPulse(
  progressMs: number,
  config = ANIMATION_CONFIG.growthPulse
): { scale: number; glowAlpha: number; complete: boolean } {
  if (progressMs >= config.duration) {
    return { scale: 1, glowAlpha: 0, complete: true };
  }
  
  const progress = progressMs / config.duration;
  // Ease out quad for smooth pulse
  const eased = 1 - (1 - progress) * (1 - progress);
  // Peak at 0.3, then fall
  const pulsePhase = Math.sin(progress * Math.PI);
  
  return {
    scale: 1 + (config.maxScale - 1) * pulsePhase,
    glowAlpha: config.glowAlpha * pulsePhase,
    complete: false,
  };
}

/**
 * Particle state for harvest burst
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  alpha: number;
  size: number;
  age: number;
}

/**
 * Create initial particles for harvest burst
 */
export function createHarvestParticles(
  originX: number,
  originY: number,
  config = ANIMATION_CONFIG.harvestParticles
): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < config.count; i++) {
    // Angle from -spread/2 to spread/2, centered upward (-PI/2)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * config.spread;
    const speed = config.speed * (0.5 + Math.random() * 0.5);
    
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 1,
      size: 3 + Math.random() * 3,
      age: 0,
    });
  }
  
  return particles;
}

/**
 * Update particles for one frame
 * Returns updated particles (filters out dead ones)
 */
export function updateParticles(
  particles: Particle[],
  deltaMs: number,
  config = ANIMATION_CONFIG.harvestParticles
): Particle[] {
  return particles
    .map(p => {
      const newAge = p.age + deltaMs;
      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + config.gravity,
        age: newAge,
        alpha: Math.max(0, 1 - newAge / config.lifetime),
      };
    })
    .filter(p => p.age < config.lifetime);
}

/**
 * Animation state manager for a GrowCanvas instance
 */
export interface AnimationState {
  startTime: number;
  activePulses: Map<string, number>;  // plantId -> startTime
  activeParticles: Map<string, Particle[]>;  // plantId -> particles
}

export function createAnimationState(): AnimationState {
  return {
    startTime: Date.now(),
    activePulses: new Map(),
    activeParticles: new Map(),
  };
}

/**
 * Trigger a growth pulse for a plant
 */
export function triggerGrowthPulse(state: AnimationState, plantId: string): void {
  state.activePulses.set(plantId, Date.now());
}

/**
 * Trigger harvest particles for a plant
 */
export function triggerHarvestParticles(
  state: AnimationState,
  plantId: string,
  x: number,
  y: number
): void {
  state.activeParticles.set(plantId, createHarvestParticles(x, y));
}
