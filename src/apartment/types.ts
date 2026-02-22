/**
 * Apartment System - Types
 * 
 * Housing, rooms, and hobby spaces.
 */

export interface HousingTier {
  id: number;
  name: string;
  emoji: string;
  hobbySlots: number;
  rentPerWeek: number;
  hasKitchen: boolean;
  description: string;
}

export const HOUSING_TIERS: HousingTier[] = [
  {
    id: 1,
    name: 'Studio',
    emoji: '🏠',
    hobbySlots: 1,
    rentPerWeek: 50,
    hasKitchen: true,
    description: 'Cozy studio apartment. One hobby space.',
  },
  {
    id: 2,
    name: '1BR Apartment',
    emoji: '🏢',
    hobbySlots: 2,
    rentPerWeek: 80,
    hasKitchen: true,
    description: 'More room to grow. Two hobby spaces.',
  },
  {
    id: 3,
    name: '2BR Apartment',
    emoji: '🏡',
    hobbySlots: 3,
    rentPerWeek: 120,
    hasKitchen: true,
    description: 'Dedicated hobby room. Three spaces.',
  },
];

export type HobbyType = 'plants' | 'mushrooms' | 'woodworking' | null;

export interface HobbySlot {
  index: number;
  hobby: HobbyType;
}

export interface ApartmentState {
  housing: HousingTier;
  hobbySlots: HobbySlot[];
}

export const INITIAL_APARTMENT: ApartmentState = {
  housing: HOUSING_TIERS[0],
  hobbySlots: [{ index: 0, hobby: null }],
};

export function getHousingTier(id: number): HousingTier | undefined {
  return HOUSING_TIERS.find(h => h.id === id);
}
