/**
 * Graph-based plant growth simulation
 */

import { Plant, Environment, TraitKey, TRAITS, TraitState } from '../types';

interface EvalParams {
  base?: number;
  modGene?: number;
  lo?: number;
  hi?: number;
  bonus?: number;
  penalty?: number;
  threshold?: number;
  mult?: number;
}

interface SimEdge {
  source: string;
  target: string;
  eval: string;
  params: EvalParams;
  desc: string;
}

/**
 * Calculate stress from environment value (0-100)
 * Stress = distance from optimal (50)
 */
function stress(v: number): number {
  return Math.abs(v - 50) / 50;
}

/**
 * Edge evaluators for the simulation graph
 */
const EVALUATORS: Record<string, (s: number, g: number, p: EvalParams) => number> = {
  stress_penalty: (s, g, p) => -(s * (p.base || 0) * (1 - g / (p.modGene || 999))),
  
  threshold_bonus: (s, g, p) => {
    if (s > (p.lo || 0) && s < (p.hi || 1)) {
      return (p.bonus || 0) * (1 - g / (p.modGene || 999));
    }
    if (s >= (p.hi || 1)) return -(s * (p.penalty || 0));
    return 0;
  },
  
  linear_penalty: (s, _g, p) => -(s * (p.base || 0)),
  
  low_stress_bonus: (s, _g, p) => 
    s < (p.threshold || 0) ? (p.bonus || 0) : -(s * (p.penalty || 0)),
  
  genetic_shield: (s, g, p) => -(s * (p.base || 0) * (1 - g / 100)),
  
  avg_stress: (s, g, p) => 
    s < (p.threshold || 0) 
      ? s * (p.bonus || 0) 
      : -(s * (p.penalty || 0) * (1 - g / (p.modGene || 999))),
  
  hp_threshold: (s, _g, p) => Math.max(0, s - (p.threshold || 0)) * (p.mult || 0),
};

/**
 * Simulation graph - defines how environment affects traits
 */
const SIM_GRAPH: SimEdge[] = [
  // Flavor Intensity
  { source: "nutrients", target: "flavorIntensity", eval: "threshold_bonus",
    params: { lo: 0.1, hi: 0.5, bonus: 0.1, modGene: 200, penalty: 0.2 },
    desc: "Mild nutrient stress concentrates flavor" },
  { source: "water", target: "flavorIntensity", eval: "threshold_bonus",
    params: { lo: 0.1, hi: 0.4, bonus: 0.08, modGene: 999, penalty: 0.15 },
    desc: "Mild water deficit intensifies flavor" },
  { source: "temperature", target: "flavorIntensity", eval: "threshold_bonus",
    params: { lo: 0.1, hi: 0.5, bonus: 0.05, modGene: 999, penalty: 0.15 },
    desc: "Moderate warmth helps" },

  // Growth Speed
  { source: "nutrients", target: "growthSpeed", eval: "linear_penalty",
    params: { base: 0.15 }, desc: "Nutrient stress slows growth" },
  { source: "water", target: "growthSpeed", eval: "linear_penalty",
    params: { base: 0.15 }, desc: "Water stress slows growth" },
  { source: "light", target: "growthSpeed", eval: "linear_penalty",
    params: { base: 0.15 }, desc: "Light stress slows growth" },

  // Yield
  { source: "nutrients", target: "yield", eval: "stress_penalty",
    params: { base: 0.4, modGene: 200 }, desc: "Nutrient stress reduces yield" },
  { source: "water", target: "yield", eval: "stress_penalty",
    params: { base: 0.3, modGene: 250 }, desc: "Water stress reduces yield" },
  { source: "light", target: "yield", eval: "low_stress_bonus",
    params: { threshold: 0.15, bonus: 0.05, penalty: 0 }, desc: "Good light boosts yield" },

  // Hardiness
  { source: "temperature", target: "hardiness", eval: "genetic_shield",
    params: { base: 0.3 }, desc: "Temp stress hurts hardiness" },

  // Appearance
  { source: "water", target: "appearance", eval: "stress_penalty",
    params: { base: 0.2, modGene: -200 }, desc: "Water stress hurts appearance" },
  { source: "nutrients", target: "appearance", eval: "stress_penalty",
    params: { base: 0.15, modGene: -200 }, desc: "Nutrient stress hurts appearance" },
  { source: "light", target: "appearance", eval: "low_stress_bonus",
    params: { threshold: 0.2, bonus: 0.06, penalty: 0.1 }, desc: "Good light enhances appearance" },

  // Shelf Life
  { source: "_avg_nwt", target: "shelfLife", eval: "avg_stress",
    params: { threshold: 0.3, bonus: 0.1, penalty: 0.15, modGene: 150 },
    desc: "Low stress improves shelf life" },

  // Health Damage
  { source: "temperature", target: "health", eval: "hp_threshold",
    params: { threshold: 0.5, mult: 20 }, desc: "Extreme temp damages HP" },
  { source: "water", target: "health", eval: "hp_threshold",
    params: { threshold: 0.6, mult: 15 }, desc: "Extreme water damages HP" },
  { source: "nutrients", target: "health", eval: "hp_threshold",
    params: { threshold: 0.7, mult: 10 }, desc: "Extreme nutrients damages HP" },
];

interface GraphResult {
  mods: Record<string, number>;
  hpDamage: number;
  stresses: Record<string, number>;
  hardinessShield: number;
}

/**
 * Evaluate the simulation graph for a plant in an environment
 */
export function evaluateGraph(env: Environment, plant: Plant): GraphResult {
  const stresses: Record<string, number> = {
    light: stress(env.light),
    temperature: stress(env.temperature),
    nutrients: stress(env.nutrients),
    water: stress(env.water),
    _avg_nwt: 0
  };
  stresses._avg_nwt = (stresses.nutrients + stresses.water + stresses.temperature) / 3;

  const mods: Record<string, number> = {};
  let hpDmg = 0;
  
  for (const t of TRAITS) mods[t] = 0;

  for (const edge of SIM_GRAPH) {
    const s = stresses[edge.source] || 0;
    const g = (plant.traits as any)[edge.target]?.genetic || 0;
    const fn = EVALUATORS[edge.eval];
    const delta = fn(s, g, edge.params);
    
    if (edge.target === "health") {
      hpDmg += delta;
    } else {
      mods[edge.target] += delta;
    }
  }

  // Hardiness shields HP damage
  const hardGen = plant.traits.hardiness?.genetic || 0;
  const hardExp = 1 + mods.hardiness;
  const shield = Math.max(0, Math.min(0.5, hardGen * Math.max(0, hardExp) / 200));
  hpDmg = hpDmg * (1 - shield);

  return { mods, hpDamage: hpDmg, stresses, hardinessShield: shield };
}

/**
 * Grow plants by one day tick
 */
export function growOnce(plants: Plant[], env: Environment): Plant[] {
  return plants.map(p => {
    if (p.health <= 0) return p;
    
    const ge = evaluateGraph(env, p);
    const nt: Record<TraitKey, TraitState> = {} as any;
    
    for (const t of TRAITS) {
      const newExp = Math.max(0, Math.min(1.3, 1 + ge.mods[t]));
      nt[t] = { ...p.traits[t], expression: newExp };
    }
    
    const hd = ge.hpDamage;
    const gt = nt.growthSpeed;
    const inc = (0.01 + (gt.genetic / 100) * gt.expression * 0.09) * Math.max(0, p.health - hd) / 100;
    
    return {
      ...p,
      traits: nt,
      health: Math.max(0, Math.round(p.health - hd)),
      growthStage: Math.min(1, p.growthStage + inc),
      age: p.age + 1
    };
  });
}
