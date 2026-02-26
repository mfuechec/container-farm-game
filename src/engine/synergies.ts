/**
 * Synergy System - Event Bus for Cross-Hobby Bonuses
 * 
 * Hobbies can produce byproducts that boost other hobbies:
 * - Plants harvest → Compost → Mushroom substrate boost
 * - Mushroom spent substrate → Plant fertilizer boost
 * 
 * Synergies decay over time if not renewed.
 */

export type SynergyType = 'compost' | 'spent_substrate';
export type HobbyType = 'plants' | 'mushrooms';

export interface SynergyEvent {
  type: SynergyType;
  source: HobbyType;
  target: HobbyType;
  amount: number;            // Boost amount (0.1 = 10% boost)
  gameDay: number;           // When it was created
}

import { SYNERGIES } from '../balance';

// Synergy bonuses decay over this many days
export const SYNERGY_DECAY_DAYS = SYNERGIES.decayDays;

// How synergies work:
// - Plant harvest generates compost (amount based on quantity)
// - Compost gives mushrooms a growth speed boost
// - Mushroom harvest generates spent substrate
// - Spent substrate gives plants a yield boost

type SynergyHandler = (event: SynergyEvent) => void;

class SynergyBus {
  private handlers: Set<SynergyHandler> = new Set();
  private activeSynergies: SynergyEvent[] = [];

  /**
   * Subscribe to synergy events
   */
  on(handler: SynergyHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Emit a synergy event (and store it)
   */
  emit(event: SynergyEvent): void {
    // Store the synergy
    this.activeSynergies.push(event);
    
    // Notify handlers
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch (e) {
        console.error('[Synergies] Handler error:', e);
      }
    });
  }

  /**
   * Get total synergy bonus for a hobby at a given game day
   * Accounts for decay over time
   */
  getBonus(targetHobby: HobbyType, currentGameDay: number): number {
    return this.activeSynergies
      .filter(s => s.target === targetHobby)
      .reduce((total, synergy) => {
        const daysSince = currentGameDay - synergy.gameDay;
        
        // Fully decayed
        if (daysSince > SYNERGY_DECAY_DAYS) return total;
        
        // Linear decay
        const decayFactor = 1 - (daysSince / SYNERGY_DECAY_DAYS);
        return total + (synergy.amount * decayFactor);
      }, 0);
  }

  /**
   * Get list of active (non-expired) synergies for a hobby
   */
  getActive(targetHobby: HobbyType, currentGameDay: number): SynergyEvent[] {
    return this.activeSynergies.filter(s => {
      if (s.target !== targetHobby) return false;
      const daysSince = currentGameDay - s.gameDay;
      return daysSince <= SYNERGY_DECAY_DAYS;
    });
  }

  /**
   * Clear synergies for a specific hobby
   */
  clearFor(targetHobby: HobbyType): void {
    this.activeSynergies = this.activeSynergies.filter(s => s.target !== targetHobby);
  }

  /**
   * Clear all synergies and handlers
   */
  clear(): void {
    this.handlers.clear();
    this.activeSynergies = [];
  }

  /**
   * Prune old synergies (call periodically to save memory)
   */
  prune(currentGameDay: number): void {
    this.activeSynergies = this.activeSynergies.filter(s => {
      const daysSince = currentGameDay - s.gameDay;
      return daysSince <= SYNERGY_DECAY_DAYS;
    });
  }

  /**
   * Serialize for save
   */
  serialize(): SynergyEvent[] {
    return [...this.activeSynergies];
  }

  /**
   * Restore from save
   */
  deserialize(synergies: SynergyEvent[]): void {
    this.activeSynergies = [...synergies];
  }
}

// Singleton instance
export const synergyBus = new SynergyBus();

// =============================================================================
// TYPED HELPERS
// =============================================================================

/**
 * Emit a synergy event
 */
export function emitSynergy(event: SynergyEvent): void {
  synergyBus.emit(event);
}

/**
 * Subscribe to synergy events
 */
export function onSynergy(handler: SynergyHandler): () => void {
  return synergyBus.on(handler);
}

/**
 * Get total synergy bonus for a hobby
 */
export function getSynergyBonus(targetHobby: HobbyType, currentGameDay: number): number {
  return synergyBus.getBonus(targetHobby, currentGameDay);
}

/**
 * Clear synergy bonuses for a hobby
 */
export function clearSynergyBonus(targetHobby: HobbyType): void {
  synergyBus.clearFor(targetHobby);
}

/**
 * Get list of active synergies for a hobby
 */
export function getActiveSynergies(targetHobby: HobbyType, currentGameDay: number): SynergyEvent[] {
  return synergyBus.getActive(targetHobby, currentGameDay);
}

// =============================================================================
// SYNERGY CALCULATIONS
// =============================================================================

/**
 * Calculate compost synergy from plant harvest
 * @param harvestQuantity Amount of plants harvested
 * @returns Synergy boost amount (0.1 = 10% mushroom growth boost)
 */
export function calculateCompostSynergy(harvestQuantity: number): number {
  return Math.min(SYNERGIES.compost.cap, harvestQuantity * SYNERGIES.compost.perHarvest);
}

/**
 * Calculate spent substrate synergy from mushroom harvest
 * @param harvestQuantity Amount of mushrooms harvested (oz)
 * @returns Synergy boost amount (0.1 = 10% plant yield boost)
 */
export function calculateSubstrateSynergy(harvestQuantity: number): number {
  return Math.min(SYNERGIES.spentSubstrate.cap, harvestQuantity * SYNERGIES.spentSubstrate.perOz);
}

/**
 * Emit compost synergy from plant harvest
 */
export function emitCompostFromPlants(harvestQuantity: number, gameDay: number): void {
  const amount = calculateCompostSynergy(harvestQuantity);
  if (amount > 0) {
    emitSynergy({
      type: 'compost',
      source: 'plants',
      target: 'mushrooms',
      amount,
      gameDay,
    });
  }
}

/**
 * Emit spent substrate synergy from mushroom harvest
 */
export function emitSubstrateFromMushrooms(harvestQuantity: number, gameDay: number): void {
  const amount = calculateSubstrateSynergy(harvestQuantity);
  if (amount > 0) {
    emitSynergy({
      type: 'spent_substrate',
      source: 'mushrooms',
      target: 'plants',
      amount,
      gameDay,
    });
  }
}
