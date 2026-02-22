/**
 * Plant creation, breeding, and seed management
 */

import { Plant, Seed, TraitKey, TRAITS, TraitState } from '../types';
import { RNG, rr, rg } from './rng';

let _id = 0;

/**
 * Generate a unique ID with prefix
 */
export function mkId(prefix: string): string {
  _id++;
  return prefix + _id;
}

/**
 * Create a new plant from genetics
 */
export function mkPlant(gen: Record<string, number>, gn: number = 0): Plant {
  return {
    id: mkId("p"),
    traits: Object.fromEntries(
      TRAITS.map(t => [t, { genetic: gen[t], expression: 1 }])
    ) as Record<TraitKey, TraitState>,
    health: 100,
    growthStage: 0,
    age: 0,
    markedForBreeding: false,
    seedsCollected: false,
    generation: gn
  };
}

/**
 * Create a store-bought seed with random genetics (20-55 range)
 */
export function mkStoreSeed(rng: RNG): Seed {
  return {
    id: mkId("s"),
    genetics: Object.fromEntries(
      TRAITS.map(t => [t, Math.round(rr(rng, 20, 55))])
    ),
    generation: 0,
    parentId: null,
    source: "store",
    name: ""
  };
}

/**
 * Collect seeds from a mature plant
 */
export function collectSeeds(plant: Plant, rng: RNG): Seed[] {
  if (plant.growthStage < 0.8) return [];
  
  const n = 2 + Math.floor(rng() * 3);
  return Array.from({ length: n }, (): Seed => ({
    id: mkId("s"),
    genetics: Object.fromEntries(
      TRAITS.map(t => [
        t,
        Math.round(Math.max(0, Math.min(100, rg(rng, plant.traits[t].genetic, 5))))
      ])
    ),
    generation: plant.generation + 1,
    parentId: plant.id,
    source: "collected",
    name: ""
  }));
}

/**
 * Breed two plants to create offspring seeds
 */
export function breedSeeds(p1: Plant, p2: Plant, rng: RNG): Seed[] {
  if (p1.growthStage < 0.8 || p2.growthStage < 0.8) return [];
  
  const n = 4 + Math.floor(rng() * 3);
  const maxGen = Math.max(p1.generation, p2.generation);
  
  return Array.from({ length: n }, (): Seed => {
    const g: Record<string, number> = {};
    for (const t of TRAITS) {
      const w = 0.3 + rng() * 0.4;
      g[t] = Math.round(
        Math.max(0, Math.min(100, rg(rng, p1.traits[t].genetic * w + p2.traits[t].genetic * (1 - w), 8)))
      );
    }
    return {
      id: mkId("s"),
      genetics: g,
      generation: maxGen + 1,
      parentId: null,
      source: "bred",
      name: ""
    };
  });
}

/**
 * Create a plant from a seed
 */
export function plantSeed(seed: Seed): Plant {
  return mkPlant(seed.genetics, seed.generation);
}

/**
 * Sort seeds by a key
 */
export function sortSeeds(seeds: Seed[], key: string, dir: "asc" | "desc"): Seed[] {
  const getValue = (s: Seed): number => {
    if (key === "generation") return s.generation;
    if (key === "overall") {
      return TRAITS.reduce((a, t) => a + s.genetics[t], 0) / TRAITS.length;
    }
    return s.genetics[key] || 0;
  };
  
  return seeds.slice().sort((a, b) => 
    dir === "asc" ? getValue(a) - getValue(b) : getValue(b) - getValue(a)
  );
}
