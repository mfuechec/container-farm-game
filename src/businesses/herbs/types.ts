/**
 * Type definitions for Container Farm
 */

export const TRAITS = ["flavorIntensity", "growthSpeed", "yield", "hardiness", "appearance", "shelfLife"] as const;
export type TraitKey = typeof TRAITS[number];

export interface TraitState {
  genetic: number;
  expression: number;
}

export interface Plant {
  id: string;
  traits: Record<TraitKey, TraitState>;
  health: number;
  growthStage: number;
  age: number;
  markedForBreeding: boolean;
  seedsCollected: boolean;
  generation: number;
}

export interface Seed {
  id: string;
  genetics: Record<string, number>;
  generation: number;
  parentId: string | null;
  source: "store" | "collected" | "bred";
  name: string;
}

export interface HarvestItem {
  id: string;
  plantId: string;
  traits: Record<TraitKey, TraitState>;
  generation: number;
  health: number;
  harvestDay: number;
  freshness: number;
  maxFreshDays: number;
  daysOnShelf: number;
  dried?: boolean;
}

export interface Contract {
  id: string;
  clientName: string;
  description: string;
  quantity: number;
  deadline: number;
  reward: number;
  traitRequirements: Array<{ trait: TraitKey; minValue: number }>;
  status: "active" | "completed" | "failed";
}

export interface Environment {
  light: number;
  temperature: number;
  nutrients: number;
  water: number;
}

export interface Tool {
  id: string;
  name: string;
  cost: number;
  reveals: TraitKey[];
  prec: number;
  desc: string;
}

export interface MarketCategory {
  name: string;
  demandTraits: TraitKey[];
  icon: string;
}

export interface MarketDemand {
  category: MarketCategory;
  priceMultiplier: number;
  competition: number;
  crowded: boolean;
}

export interface DryingItem {
  item: HarvestItem;
  daysLeft: number;
}

export interface TraitScore {
  flavor: number;
  yield: number;
  appearance: number;
  shelfLife: number;
  overall: number;
}
