/**
 * Balance Constants — Single Source of Truth
 *
 * ALL tuning values live here. Game systems import from this file.
 * When adjusting balance, edit here — not in individual type files.
 *
 * See docs/BALANCE.md for design rationale and feel targets.
 */

// =============================================================================
// ECONOMY
// =============================================================================

export const ECONOMY = {
  startingMoney: 500,
  weeklyIncome: 750,        // Day job pay ($3000/month)
  weeklyGroceryBase: 250,   // Base grocery bill ($1000/month)
} as const;

// =============================================================================
// HOUSING
// =============================================================================

export const HOUSING = [
  { id: 1, name: 'Studio',         hobbySlots: 1, rentPerWeek: 375 },  // $1500/month
  { id: 2, name: '1BR Apartment',  hobbySlots: 2, rentPerWeek: 500 },  // $2000/month
  { id: 3, name: '2BR Apartment',  hobbySlots: 3, rentPerWeek: 700 },  // $2800/month
] as const;

// =============================================================================
// MARKET
// =============================================================================

export const MARKET = {
  wholesaleMultiplier: 0.6,
  marketMultiplier: 1.5,     // Base market premium (before demand variance)
  rentals: {
    weekly:   { cost: 50,  frequencyDays: 7  },
    biweekly: { cost: 70,  frequencyDays: 14 },
    monthly:  { cost: 100, frequencyDays: 28 },
  },
} as const;

// =============================================================================
// PLANTS
// =============================================================================

/**
 * Plant balance — each herb should have a distinct niche:
 * - Basil: All-rounder, combo enabler (Italian Herbs + Kitchen Staples)
 * - Mint: Fast cycle, high yield, but low value per unit and short shelf life
 * - Parsley: Slow but highest per-unit value and grocery savings
 * - Cilantro: Mid-speed, yield bonus in kitchen, very short shelf life
 * - Chives: High yield, long shelf life, lowest price — bulk/storage play
 */
export const PLANTS = {
  basil: {
    daysToMature: 7,
    yieldAmount: 2,
    sellPrice: 28,
    seedCost: 22,
    groceryValue: 15,
    maxFreshDays: 7,
    kitchenBonus: { type: 'growth' as const, amount: 1.1 },
  },
  mint: {
    daysToMature: 5,
    yieldAmount: 2,           // Reduced from 3 — was too dominant
    sellPrice: 20,            // Reduced from 25 — fast cycle is the advantage
    seedCost: 15,
    groceryValue: 8,          // Reduced from 10 — less grocery impact
    maxFreshDays: 4,          // Reduced from 5 — wilts fast, pressure to sell/use quickly
    kitchenBonus: { type: 'freshness' as const, amount: 1.2 },
  },
  parsley: {
    daysToMature: 10,
    yieldAmount: 2,
    sellPrice: 40,
    seedCost: 30,
    groceryValue: 22,         // Increased from 20 — reward for patience
    maxFreshDays: 10,
  },
  cilantro: {
    daysToMature: 6,
    yieldAmount: 2,
    sellPrice: 30,
    seedCost: 25,
    groceryValue: 15,
    maxFreshDays: 4,
    kitchenBonus: { type: 'yield' as const, amount: 1.15 },
  },
  chives: {
    daysToMature: 8,
    yieldAmount: 4,
    sellPrice: 15,
    seedCost: 20,
    groceryValue: 10,
    maxFreshDays: 14,
  },
} as const;

// =============================================================================
// PLANT EQUIPMENT
// =============================================================================

export const TABLES = {
  small_desk:     { potSlots: 4,  seedStorage: 10, cost: 0   },
  potting_bench:  { potSlots: 8,  seedStorage: 20, cost: 150 },
  grow_shelf:     { potSlots: 12, seedStorage: 30, cost: 350 },
  grow_tent:      { potSlots: 16, seedStorage: 50, cost: 600 },
} as const;

export const LIGHTS = {
  desk_lamp:  { coverage: 2,  growthBoost: 1.0, cost: 0   },
  clip_light: { coverage: 4,  growthBoost: 1.2, cost: 75  },
  led_panel:  { coverage: 8,  growthBoost: 1.5, cost: 200 },
  led_array:  { coverage: 16, growthBoost: 1.8, cost: 450 },
} as const;

export const POTS = {
  basic_pot:      { growthModifier: 1.0, yieldModifier: 1.0, cost: 25  },
  self_watering:  { growthModifier: 1.1, yieldModifier: 1.0, cost: 75  },
  large_planter:  { growthModifier: 0.9, yieldModifier: 1.3, cost: 100 },
} as const;

// =============================================================================
// MUSHROOMS
// =============================================================================

export const MUSHROOMS = {
  oyster: {
    daysToMature: 3,
    yieldAmount: 4,
    sellPrice: 8,
    spawnCost: 8,
    groceryValue: 4,
    maxFreshDays: 5,
    difficulty: 'easy' as const,
    preferredHumidity: [70, 90] as [number, number],
    preferredTemp: [60, 75] as [number, number],
    kitchenBonus: { type: 'freshness' as const, amount: 1.15 },
  },
  shiitake: {
    daysToMature: 4,
    yieldAmount: 3,
    sellPrice: 12,
    spawnCost: 12,
    groceryValue: 5,
    maxFreshDays: 7,
    difficulty: 'medium' as const,
    preferredHumidity: [75, 85] as [number, number],
    preferredTemp: [55, 70] as [number, number],
    kitchenBonus: { type: 'yield' as const, amount: 1.1 },
  },
  lions_mane: {
    daysToMature: 5,
    yieldAmount: 2,
    sellPrice: 18,
    spawnCost: 15,
    groceryValue: 8,
    maxFreshDays: 4,
    difficulty: 'hard' as const,
    preferredHumidity: [80, 90] as [number, number],
    preferredTemp: [60, 68] as [number, number],
    kitchenBonus: { type: 'growth' as const, amount: 1.2 },
  },
} as const;

// =============================================================================
// MUSHROOM EQUIPMENT
// =============================================================================

export const GROW_BAGS = {
  basic_bag:   { capacity: 1, humidityBonus: 0,   cost: 5  },
  filter_bag:  { capacity: 1, humidityBonus: 0.1, cost: 10 },
  monotub:     { capacity: 3, humidityBonus: 0.2, cost: 35 },
} as const;

export const MUSHROOM_EQUIPMENT = {
  spray_bottle: { bonus: { humidity: 5 },                     cost: 0  },
  humidifier:   { bonus: { humidity: 15 },                    cost: 30 },
  dark_tent:    { bonus: { humidity: 10, temperature: -5 },   cost: 50 },
  fae_fan:      { bonus: { freshAir: true as const },         cost: 25 },
} as const;

// =============================================================================
// COMBOS
// =============================================================================

export const COMBO_VALUES = {
  italian_herbs:            { type: 'groceryMultiplier' as const, value: 1.5,  scope: 'combo-items' as const },
  fresh_duo:                { type: 'freshnessMultiplier' as const, value: 1.3, scope: 'combo-items' as const },
  kitchen_staples:          { type: 'groceryMultiplier' as const, value: 1.2,  scope: 'all-items' as const },
  full_pantry:              { type: 'groceryMultiplier' as const, value: 1.25, scope: 'all-items' as const },
  companion_basil_parsley:  { type: 'growthMultiplier' as const, value: 1.15, scope: 'combo-items' as const },
  companion_mint_chives:    { type: 'growthMultiplier' as const, value: 1.1,  scope: 'combo-items' as const },
  herb_garden:              { type: 'yieldBonus' as const, value: 1, scope: 'all-items' as const },
} as const;

// =============================================================================
// SYNERGIES
// =============================================================================

export const SYNERGIES = {
  decayDays: 7,
  compost: {
    perHarvest: 0.05,        // Boost per plant harvested
    cap: 0.30,               // Max 30% mushroom growth boost
  },
  spentSubstrate: {
    perOz: 0.03,             // Boost per oz mushroom harvested
    cap: 0.25,               // Max 25% plant yield boost
  },
} as const;
