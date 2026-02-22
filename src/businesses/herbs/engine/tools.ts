/**
 * Tools system - equipment for measuring plant traits
 */

import { Tool, TraitKey } from '../types';
import { RNG, rg } from './rng';

/**
 * Available tools to purchase
 */
export const TOOLS: Tool[] = [
  {
    id: "refractometer",
    name: "Refractometer",
    cost: 50,
    reveals: ["flavorIntensity"],
    prec: 0.7,
    desc: "Measures Brix for flavor intensity."
  },
  {
    id: "digitalScale",
    name: "Digital Scale",
    cost: 30,
    reveals: ["yield"],
    prec: 0.8,
    desc: "Weighs biomass per plant."
  },
  {
    id: "phMeter",
    name: "pH/EC Meter",
    cost: 40,
    reveals: ["hardiness", "growthSpeed"],
    prec: 0.5,
    desc: "Tests nutrient uptake efficiency."
  },
  {
    id: "chlorophyllMeter",
    name: "SPAD Meter",
    cost: 120,
    reveals: ["growthSpeed", "yield"],
    prec: 0.75,
    desc: "Reads leaf chlorophyll density."
  },
  {
    id: "microscope",
    name: "Microscope",
    cost: 150,
    reveals: ["flavorIntensity", "appearance"],
    prec: 0.8,
    desc: "Reveals trichome density."
  },
  {
    id: "colorimeter",
    name: "Colorimeter",
    cost: 200,
    reveals: ["appearance"],
    prec: 0.9,
    desc: "Measures exact color values."
  },
  {
    id: "nirSpectrometer",
    name: "NIR Spectrometer",
    cost: 500,
    reveals: ["flavorIntensity", "yield", "hardiness", "shelfLife"],
    prec: 0.92,
    desc: "Near-infrared analysis."
  },
];

export interface RevealLevel {
  level: "hidden" | "vague" | "approx" | "precise";
  prec: number;
}

/**
 * Get reveal level for a trait based on owned tools
 */
export function getReveal(trait: TraitKey, ownedTools: string[]): RevealLevel {
  const sensoryTraits: TraitKey[] = ["appearance", "flavorIntensity", "yield"];
  
  let best = 0;
  for (const toolId of ownedTools) {
    const t = TOOLS.find(x => x.id === toolId);
    if (t && t.reveals.includes(trait)) {
      best = Math.max(best, t.prec);
    }
  }
  
  if (best >= 0.85) return { level: "precise", prec: best };
  if (best >= 0.6) return { level: "approx", prec: best };
  if (best > 0 || sensoryTraits.includes(trait)) {
    return { level: "vague", prec: Math.max(best, 0.2) };
  }
  return { level: "hidden", prec: 0 };
}

/**
 * Observe a trait value with some noise based on precision
 */
export function observe(genetic: number, expression: number, prec: number, rng: RNG): number {
  return Math.round(
    Math.max(0, Math.min(100, rg(rng, genetic * expression, (1 - prec) * 25)))
  );
}
