/**
 * Farmers market system
 */

import { HarvestItem, MarketCategory, MarketDemand, TraitKey } from '../types';
import { RNG } from './rng';
import { harvestTraitScore } from './harvest';

/**
 * Market category definitions
 */
export const MARKET_CATEGORIES: MarketCategory[] = [
  { name: "Fresh Greens", demandTraits: ["yield", "appearance"], icon: "🥬" },
  { name: "Gourmet Herbs", demandTraits: ["flavorIntensity", "appearance"], icon: "🌿" },
  { name: "Bulk Produce", demandTraits: ["yield", "shelfLife"], icon: "📦" },
  { name: "Artisan Herbs", demandTraits: ["flavorIntensity", "shelfLife"], icon: "✨" },
];

/**
 * Generate random market demand for the day
 */
export function generateMarketDemand(rng: RNG): MarketDemand {
  const cat = MARKET_CATEGORIES[Math.floor(rng() * MARKET_CATEGORIES.length)];
  const priceMultiplier = 0.7 + rng() * 0.8;
  const competition = 0.3 + rng() * 0.7;
  
  return {
    category: cat,
    priceMultiplier,
    competition,
    crowded: competition > 0.6
  };
}

/**
 * Calculate price for an item given current demand
 */
export function marketPrice(item: HarvestItem, demand: MarketDemand): number {
  const sc = harvestTraitScore(item);
  
  let relevance = 0;
  for (const t of demand.category.demandTraits) {
    relevance += item.traits[t].genetic * item.traits[t].expression;
  }
  relevance = relevance / (demand.category.demandTraits.length * 100);
  
  const base = 2 + sc.overall * 13;
  const freshBonus = item.freshness;
  const competitionPenalty = 1 - demand.competition * 0.4;
  
  return Math.round(base * demand.priceMultiplier * freshBonus * competitionPenalty * (0.5 + relevance) * 100) / 100;
}

/**
 * Calculate sell chance based on reputation
 */
export function calcSellChance(rep: number): number {
  return Math.min(1, 0.3 + rep * 0.007);
}
