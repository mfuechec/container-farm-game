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

// =============================================================================
// KITCHEN
// =============================================================================

export const KITCHEN = {
  storageCapacity: 15,       // Max ingredient types (items stack)
  takeoutCost: 12,           // Penalty when no meal can be made
} as const;

// =============================================================================
// STAPLES (store-bought ingredients)
// =============================================================================

export const STAPLES = {
  pasta:      { name: 'Pasta',      emoji: '🍝', price: 3, stackLimit: 10 },
  rice:       { name: 'Rice',       emoji: '🍚', price: 3, stackLimit: 10 },
  tomatoes:   { name: 'Tomatoes',   emoji: '🍅', price: 4, stackLimit: 8  },
  garlic:     { name: 'Garlic',     emoji: '🧄', price: 2, stackLimit: 12 },
  olive_oil:  { name: 'Olive Oil',  emoji: '🫒', price: 5, stackLimit: 6  },
  cheese:     { name: 'Cheese',     emoji: '🧀', price: 6, stackLimit: 6  },
} as const;

// =============================================================================
// RECIPES
// =============================================================================

/**
 * Ingredient requirements:
 * - Specific: { basil: 2 } — needs exactly basil
 * - Any herb: { _anyHerb: 1 } — any herb works
 * - Any mushroom: { _anyMushroom: 1 } — any mushroom works
 * - Any X different herbs: { _anyHerbsDistinct: 2 } — needs 2 different herbs
 */
export const RECIPES = {
  // Tier 1 — Simple ($6-8)
  herb_oil: {
    name: 'Herb Oil',
    emoji: '🫒',
    tier: 1,
    groceryValue: 8,
    ingredients: { _anyHerb: 1, olive_oil: 1 },
  },
  garlic_mushrooms: {
    name: 'Garlic Mushrooms',
    emoji: '🍄',
    tier: 1,
    groceryValue: 7,
    ingredients: { _anyMushroom: 1, garlic: 1, olive_oil: 1 },
  },
  simple_salad: {
    name: 'Simple Salad',
    emoji: '🥗',
    tier: 1,
    groceryValue: 6,
    ingredients: { _anyHerb: 1, tomatoes: 1, olive_oil: 1 },
  },

  // Tier 2 — Standard ($10-15)
  pesto_pasta: {
    name: 'Pesto Pasta',
    emoji: '🍝',
    tier: 2,
    groceryValue: 14,
    ingredients: { basil: 2, pasta: 1, olive_oil: 1, garlic: 1 },
  },
  herb_rice: {
    name: 'Herb Rice',
    emoji: '🍚',
    tier: 2,
    groceryValue: 10,
    ingredients: { _anyHerb: 1, rice: 1, garlic: 1 },
  },
  mushroom_risotto: {
    name: 'Mushroom Risotto',
    emoji: '🍄',
    tier: 2,
    groceryValue: 15,
    ingredients: { _anyMushroom: 2, rice: 1, cheese: 1, garlic: 1 },
  },
  caprese_salad: {
    name: 'Caprese Salad',
    emoji: '🍅',
    tier: 2,
    groceryValue: 12,
    ingredients: { basil: 2, tomatoes: 2, cheese: 1 },
  },
  tabbouleh: {
    name: 'Tabbouleh',
    emoji: '🥗',
    tier: 2,
    groceryValue: 11,
    ingredients: { parsley: 2, tomatoes: 1, olive_oil: 1 },
  },
  mushroom_pasta: {
    name: 'Mushroom Pasta',
    emoji: '🍝',
    tier: 2,
    groceryValue: 13,
    ingredients: { _anyMushroom: 2, pasta: 1, garlic: 1, olive_oil: 1 },
  },

  // Tier 3 — Complex ($18-25)
  italian_herb_pasta: {
    name: 'Italian Herb Pasta',
    emoji: '🇮🇹',
    tier: 3,
    groceryValue: 22,
    ingredients: { basil: 1, parsley: 1, pasta: 1, tomatoes: 1, garlic: 1 },
  },
  herb_mushroom_risotto: {
    name: 'Herb Mushroom Risotto',
    emoji: '🍚',
    tier: 3,
    groceryValue: 20,
    ingredients: { _anyHerb: 1, _anyMushroom: 1, rice: 1, cheese: 1 },
  },
  garden_pasta: {
    name: 'Garden Pasta',
    emoji: '🌿',
    tier: 3,
    groceryValue: 19,
    ingredients: { _anyHerbsDistinct: 2, _anyMushroom: 1, pasta: 1, olive_oil: 1 },
  },
  chimichurri_bowl: {
    name: 'Chimichurri Bowl',
    emoji: '🥣',
    tier: 3,
    groceryValue: 18,
    ingredients: { parsley: 1, cilantro: 1, rice: 1, garlic: 1, olive_oil: 1 },
  },

  // Tier 4 — Gourmet ($28-35)
  lions_mane_steak: {
    name: "Lion's Mane Steak",
    emoji: '🦁',
    tier: 4,
    groceryValue: 28,
    ingredients: { lions_mane: 2, garlic: 1, olive_oil: 1, _anyHerb: 1 },
  },
  full_garden_feast: {
    name: 'Full Garden Feast',
    emoji: '👨‍🍳',
    tier: 4,
    groceryValue: 35,
    ingredients: { _anyHerbsDistinct: 3, _anyMushroomsDistinct: 2, pasta: 1, cheese: 1, tomatoes: 1 },
  },
} as const;

// =============================================================================
// VARIETY BONUS
// =============================================================================

export const VARIETY_BONUS = {
  tiers: [
    { minMeals: 3, name: 'Well-Fed',     emoji: '🍽️', efficiencyBonus: 0.05, discoveryBonus: 1.0 },
    { minMeals: 5, name: 'Thriving',     emoji: '🌟', efficiencyBonus: 0.10, discoveryBonus: 1.0 },
    { minMeals: 7, name: 'Gourmet Week', emoji: '👨‍🍳', efficiencyBonus: 0.15, discoveryBonus: 2.0 },
  ],
} as const;
