/**
 * Plant Visual Configuration
 * 
 * Maps plant types to their visual properties.
 * Separated from game logic for clean architecture.
 */

import { LeafShape } from './leafShapes';

export interface PlantVisual {
  leafShape: LeafShape;
  leafColor: number;
  stemColor: number;
  leafCount: { min: number; max: number };  // Based on growth
  stemHeight: { min: number; max: number }; // Based on growth
  leafSize: { min: number; max: number };   // Based on growth
  flowerColor?: number;                      // When harvestable
}

/**
 * Visual configuration for each plant type
 */
export const PLANT_VISUALS: Record<string, PlantVisual> = {
  basil: {
    leafShape: 'rounded',
    leafColor: 0x4CAF50,
    stemColor: 0x2E7D32,
    leafCount: { min: 2, max: 8 },
    stemHeight: { min: 15, max: 45 },
    leafSize: { min: 8, max: 16 },
    flowerColor: 0xE8F5E9,
  },
  mint: {
    leafShape: 'serrated',
    leafColor: 0x81C784,
    stemColor: 0x558B2F,
    leafCount: { min: 2, max: 10 },
    stemHeight: { min: 12, max: 40 },
    leafSize: { min: 6, max: 14 },
    flowerColor: 0xE1BEE7,
  },
  parsley: {
    leafShape: 'feathery',
    leafColor: 0x66BB6A,
    stemColor: 0x33691E,
    leafCount: { min: 3, max: 12 },
    stemHeight: { min: 20, max: 55 },
    leafSize: { min: 10, max: 20 },
    flowerColor: 0xFFF9C4,
  },
  cilantro: {
    leafShape: 'fan',
    leafColor: 0xAED581,
    stemColor: 0x7CB342,
    leafCount: { min: 2, max: 8 },
    stemHeight: { min: 15, max: 50 },
    leafSize: { min: 8, max: 18 },
    flowerColor: 0xFFFFFF,
  },
  chives: {
    leafShape: 'blade',
    leafColor: 0x9CCC65,
    stemColor: 0x689F38,
    leafCount: { min: 3, max: 12 },
    stemHeight: { min: 25, max: 60 },
    leafSize: { min: 6, max: 12 },
    flowerColor: 0xCE93D8,
  },
};

/**
 * Get visual config for a plant type
 */
export function getPlantVisual(typeId: string): PlantVisual {
  return PLANT_VISUALS[typeId] ?? PLANT_VISUALS.basil;  // Default to basil
}

/**
 * Interpolate between min and max based on growth (0-1)
 */
export function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * Math.min(Math.max(t, 0), 1);
}

/**
 * Get interpolated values based on growth progress
 */
export function getGrowthValues(visual: PlantVisual, growth: number) {
  return {
    leafCount: Math.floor(lerp(visual.leafCount.min, visual.leafCount.max, growth)),
    stemHeight: lerp(visual.stemHeight.min, visual.stemHeight.max, growth),
    leafSize: lerp(visual.leafSize.min, visual.leafSize.max, growth),
  };
}
