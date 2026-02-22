/**
 * Harvest system - managing picked plants
 */

import { Plant, HarvestItem, TraitScore } from '../types';
import { mkId } from './plants';

/**
 * Calculate trait scores for a harvested item
 */
export function harvestTraitScore(h: HarvestItem): TraitScore {
  const f = h.traits.flavorIntensity.genetic * h.traits.flavorIntensity.expression;
  const y = h.traits.yield.genetic * h.traits.yield.expression;
  const a = h.traits.appearance.genetic * h.traits.appearance.expression;
  const s = h.traits.shelfLife.genetic * h.traits.shelfLife.expression;
  
  return {
    flavor: f,
    yield: y,
    appearance: a,
    shelfLife: s,
    overall: (f * 0.3 + y * 0.25 + a * 0.3 + s * 0.15) / 100
  };
}

/**
 * Harvest a plant into a shelf item
 */
export function harvestPlant(plant: Plant, currentDay: number): HarvestItem {
  const maxFresh = 3 + (plant.traits.shelfLife.genetic * plant.traits.shelfLife.expression / 100) * 7;
  
  return {
    id: mkId("h"),
    plantId: plant.id,
    traits: { ...plant.traits },
    generation: plant.generation,
    health: plant.health,
    harvestDay: currentDay,
    freshness: 1.0,
    maxFreshDays: Math.round(maxFresh),
    daysOnShelf: 0
  };
}

/**
 * Age harvest items by one day (call each tick)
 * Returns items that are still fresh (freshness > 0 or dried)
 */
export function ageHarvest(items: HarvestItem[]): HarvestItem[] {
  return items
    .map(h => {
      if (h.dried) return h;
      const nd = h.daysOnShelf + 1;
      const fresh = Math.max(0, 1 - nd / h.maxFreshDays);
      return { ...h, daysOnShelf: nd, freshness: fresh };
    })
    .filter(h => h.freshness > 0 || h.dried);
}

/**
 * Convert a fresh item to dried (no more decay)
 */
export function dryHarvestItem(item: HarvestItem): HarvestItem {
  return {
    ...item,
    dried: true,
    freshness: 1.0,
    maxFreshDays: 999,
    daysOnShelf: 0
  };
}
