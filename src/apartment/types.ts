/**
 * Apartment System - Types
 * 
 * Housing, rooms, and hobby spaces.
 * Note: Full housing types are in src/housing/types.ts
 */

import { HousingTier, HOUSING_TIERS, calculateDeposit } from '../housing/types';

// Re-export for backwards compatibility
export type { HousingTier };
export { HOUSING_TIERS, calculateDeposit };

export type HobbyType = 'plants' | 'mushrooms' | 'woodworking' | null;

export interface HobbySlot {
  index: number;
  hobby: HobbyType;
}

export interface ApartmentState {
  housing: HousingTier;
  hobbySlots: HobbySlot[];
  securityDeposit: number;
}

export const INITIAL_APARTMENT: ApartmentState = {
  housing: HOUSING_TIERS[0],
  hobbySlots: [{ index: 0, hobby: null }],
  securityDeposit: calculateDeposit(HOUSING_TIERS[0]), // $100 for studio
};

export function getHousingTier(id: number): HousingTier | undefined {
  return HOUSING_TIERS.find(h => h.id === id);
}
