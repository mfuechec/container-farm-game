/**
 * Market System - Types
 * 
 * Farmers market and wholesale selling.
 */

export type MarketRentalTier = 'weekly' | 'biweekly' | 'monthly' | null;

export interface MarketRentalInfo {
  tier: Exclude<MarketRentalTier, null>;
  cost: number;          // Cost per rental period
  frequencyDays: number; // How often market occurs
  label: string;
}

export const MARKET_RENTALS: Record<Exclude<MarketRentalTier, null>, MarketRentalInfo> = {
  weekly: {
    tier: 'weekly',
    cost: 50,
    frequencyDays: 7,
    label: 'Weekly',
  },
  biweekly: {
    tier: 'biweekly',
    cost: 70,
    frequencyDays: 14,
    label: 'Bi-weekly',
  },
  monthly: {
    tier: 'monthly',
    cost: 100,
    frequencyDays: 28,
    label: 'Monthly',
  },
};

export interface MarketState {
  rentalTier: MarketRentalTier;
  lastMarketDay: number;  // Game day of last market (0 if never)
}

export const INITIAL_MARKET: MarketState = {
  rentalTier: null,
  lastMarketDay: 0,
};

/**
 * Check if today is a market day
 * Market stays open for the entire day once it opens
 */
export function isMarketDay(
  currentDay: number,
  rentalTier: MarketRentalTier,
  lastMarketDay: number
): boolean {
  if (!rentalTier) return false;
  
  const rental = MARKET_RENTALS[rentalTier];
  const daysSinceLastMarket = currentDay - lastMarketDay;
  
  // Market is open if: it's been enough days since last market, OR we're still on the same market day
  return daysSinceLastMarket >= rental.frequencyDays || currentDay === lastMarketDay;
}

/**
 * Get next market day
 */
export function getNextMarketDay(
  currentDay: number,
  rentalTier: MarketRentalTier,
  lastMarketDay: number
): number | null {
  if (!rentalTier) return null;
  
  const rental = MARKET_RENTALS[rentalTier];
  return lastMarketDay + rental.frequencyDays;
}

/**
 * Get rental cost for this week (prorated if applicable)
 * For simplicity, we charge weekly cost equivalent
 */
export function getWeeklyRentalCost(rentalTier: MarketRentalTier): number {
  if (!rentalTier) return 0;
  
  const rental = MARKET_RENTALS[rentalTier];
  // Convert to weekly cost
  return (rental.cost / rental.frequencyDays) * 7;
}
