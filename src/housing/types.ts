/**
 * Housing System Types
 * 
 * Defines housing tiers, deposits, and move transactions.
 */

export interface MapPosition {
  x: number;
  y: number;
}

export interface HousingTier {
  id: number;
  name: string;
  emoji: string;
  hobbySlots: number;
  rentPerWeek: number;
  hasKitchen: boolean;
  description: string;
  mapPosition: MapPosition;
}

import { HOUSING } from '../balance';

export const HOUSING_TIERS: HousingTier[] = [
  {
    ...HOUSING[0],
    emoji: '🏠',
    hasKitchen: true,
    description: 'Cozy studio apartment. One hobby space.',
    mapPosition: { x: 25, y: 70 },
  },
  {
    ...HOUSING[1],
    emoji: '🏢',
    hasKitchen: true,
    description: 'More room to grow. Two hobby spaces.',
    mapPosition: { x: 50, y: 45 },
  },
  {
    ...HOUSING[2],
    emoji: '🏡',
    hasKitchen: true,
    description: 'Dedicated hobby room. Three spaces.',
    mapPosition: { x: 75, y: 25 },
  },
];

export interface MoveTransaction {
  depositReturned: number;
  depositCharged: number;
  netCost: number;
  isUpgrade: boolean;
}

/**
 * Get a housing tier by ID
 */
export function getHousingTier(id: number): HousingTier | undefined {
  return HOUSING_TIERS.find(h => h.id === id);
}

/**
 * Calculate security deposit (2x weekly rent)
 */
export function calculateDeposit(tier: HousingTier): number {
  return tier.rentPerWeek * 2;
}

/**
 * Check if player can afford to move to new housing
 */
export function canAffordUpgrade(
  currentTier: HousingTier,
  newTier: HousingTier,
  currentDeposit: number,
  playerMoney: number
): boolean {
  const transaction = calculateMoveTransaction(currentTier, newTier, currentDeposit);
  // If net cost is negative (downgrade), always affordable
  if (transaction.netCost <= 0) return true;
  return playerMoney >= transaction.netCost;
}

/**
 * Calculate the financial transaction for moving
 */
export function calculateMoveTransaction(
  fromTier: HousingTier,
  toTier: HousingTier,
  currentDeposit: number = 0
): MoveTransaction {
  // Ensure currentDeposit is a valid number
  const safeCurrentDeposit = currentDeposit ?? 0;
  const newDeposit = calculateDeposit(toTier);
  const isUpgrade = toTier.hobbySlots > fromTier.hobbySlots;
  
  return {
    depositReturned: safeCurrentDeposit,
    depositCharged: newDeposit,
    netCost: newDeposit - safeCurrentDeposit,
    isUpgrade,
  };
}

/**
 * Select which hobbies to keep when downgrading
 */
export function selectHobbiesToKeep(
  currentHobbies: string[],
  keepIndices: number[]
): string[] {
  return keepIndices
    .filter(i => i >= 0 && i < currentHobbies.length)
    .map(i => currentHobbies[i]);
}

/**
 * Check if hobby selection is needed for a move
 */
export function needsHobbySelection(
  activeHobbies: number,
  targetSlots: number
): boolean {
  return activeHobbies > targetSlots;
}
