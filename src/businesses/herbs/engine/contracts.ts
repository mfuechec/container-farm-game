/**
 * Contract system
 */

import { Contract, HarvestItem, TraitKey } from '../types';
import { RNG, rr } from './rng';
import { mkId } from './plants';

interface Client {
  name: string;
  focus: TraitKey[];
  descs: string[];
}

/**
 * Available contract clients
 */
const CLIENTS: Client[] = [
  {
    name: "The Oak Table Bistro",
    focus: ["flavorIntensity", "appearance"],
    descs: ["We need herbs with bold flavor.", "Our chef wants vibrant herbs."]
  },
  {
    name: "Green Bowl Co.",
    focus: ["yield", "shelfLife"],
    descs: ["We need reliable bulk supply.", "Our salad bar needs fresh produce."]
  },
  {
    name: "Chef Martinez",
    focus: ["flavorIntensity", "hardiness"],
    descs: ["Only the most intense flavors.", "Bring me something extraordinary."]
  },
  {
    name: "Riverside Market",
    focus: ["yield", "growthSpeed"],
    descs: ["Affordable, fresh greens.", "We need fast-growing crops."]
  },
  {
    name: "Sakura Omakase",
    focus: ["appearance", "flavorIntensity"],
    descs: ["Every leaf must be perfect.", "Exquisite micro-herbs needed."]
  },
];

/**
 * Generate a new contract
 */
export function mkContract(rng: RNG, diff: number): Contract {
  const cl = CLIENTS[Math.floor(rng() * CLIENTS.length)];
  const th = 35 + diff * 8 + Math.round(rr(rng, -5, 10));
  
  const req: Array<{ trait: TraitKey; minValue: number }> = [
    { trait: cl.focus[0], minValue: Math.min(95, th) }
  ];
  
  if (diff >= 2) {
    req.push({ trait: cl.focus[1], minValue: Math.min(90, th - 5) });
  }
  
  return {
    id: mkId("c"),
    clientName: cl.name,
    description: cl.descs[Math.floor(rng() * cl.descs.length)],
    quantity: Math.max(2, Math.round(2 + diff * 1.2 + rr(rng, -1, 1))),
    deadline: Math.max(15, Math.round(40 - diff * 4 + rr(rng, -5, 5))),
    reward: Math.round(80 + diff * 60 + rr(rng, -20, 30)),
    traitRequirements: req,
    status: "active"
  };
}

/**
 * Check if a contract can be fulfilled with current shelf items
 */
export function checkContractWithShelf(contract: Contract, shelf: HarvestItem[]): {
  success: boolean;
  qualifying: HarvestItem[];
  shortfall: number;
} {
  const qual = shelf.filter(h => {
    if (h.freshness < 0.2) return false;
    return contract.traitRequirements.every(
      r => h.traits[r.trait].genetic * h.traits[r.trait].expression >= r.minValue
    );
  });
  
  return {
    success: qual.length >= contract.quantity,
    qualifying: qual,
    shortfall: Math.max(0, contract.quantity - qual.length)
  };
}
