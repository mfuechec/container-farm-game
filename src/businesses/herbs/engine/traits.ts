/**
 * Trait definitions and display utilities
 */

import { TraitKey, TRAITS } from '../types';
import { Theme } from '../../../theme';

/**
 * Trait labels for display
 */
export const TRAIT_LABELS: Record<TraitKey, string> = {
  flavorIntensity: "Flavor",
  growthSpeed: "Growth",
  yield: "Yield",
  hardiness: "Hardy",
  appearance: "Looks",
  shelfLife: "Shelf Life"
};

/**
 * Vague descriptions for each trait level (0-20, 20-40, etc.)
 */
export const VAGUE_DESCRIPTIONS: Record<TraitKey, string[]> = {
  flavorIntensity: ["bland", "mild", "moderate", "strong", "intense"],
  growthSpeed: ["v.slow", "slow", "average", "fast", "v.fast"],
  yield: ["sparse", "low", "moderate", "good", "abundant"],
  hardiness: ["fragile", "delicate", "average", "tough", "v.hardy"],
  appearance: ["poor", "plain", "decent", "attractive", "stunning"],
  shelfLife: ["wilts", "short", "average", "keeps", "durable"]
};

/**
 * Get trait colors from theme
 */
export function getTraitColors(theme: Theme): Record<TraitKey, string> {
  return theme.traits;
}

/**
 * Get vague description for a trait value
 */
export function getVagueDescription(trait: TraitKey, value: number): string {
  const descs = VAGUE_DESCRIPTIONS[trait];
  return descs[Math.min(4, Math.floor(value / 20))];
}

export { TRAITS };
