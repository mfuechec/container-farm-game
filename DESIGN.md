# Container Farm: Simulation System Design

## Overview

This document defines every interaction between plant traits, environment variables, and game systems. It serves as the authoritative spec — the engine should implement exactly what's here, and tests should verify against it.

### Design Principles

1. **Every trait should matter.** If a trait exists, it should influence outcomes in ways the player can discover and exploit.
2. **Every environmental variable should create tradeoffs.** Moving a slider shouldn't be "good" or "bad" — it should benefit some things while hurting others.
3. **A plant's own genetics should determine its sensitivity.** A plant bred for high yield should be more resilient to conditions that threaten yield.
4. **The player should be able to reason about the system.** Interactions should be intuitive enough that you can form hypotheses and test them.

---

## Traits

| Trait | Key | Role | Why It Matters |
|-------|-----|------|----------------|
| Flavor Intensity | `flavorIntensity` | Product quality | Premium pricing, restaurant contracts |
| Growth Speed | `growthSpeed` | Time to maturity | Staggering production, meeting deadlines |
| Yield | `yield` | Output volume | Market volume, bulk contracts |
| Hardiness | `hardiness` | Stress resistance | Survives suboptimal conditions, risk tolerance |
| Appearance | `appearance` | Visual quality | Market premium, visual-focused clients |
| Shelf Life | `shelfLife` | Post-harvest duration | Timing flexibility, freshness at market |

Each trait has two values:
- **Genetic** (0–100): Innate potential, set at seed creation, inherited through breeding.
- **Expression** (0.0–1.3): How much of the genetic potential is realized given current conditions. 1.0 = full expression, >1.0 = environmental bonus, <1.0 = environmental penalty.

**Effective value** = `genetic × expression`

---

## Environment Variables

All environment variables range 0–100. The **ideal** value is 50 (zero stress). Stress increases linearly as you move away from 50.

```
stress(value) = |value - 50| / 50
```

| Variable | Key | Stress at 0 | Stress at 50 | Stress at 100 |
|----------|-----|-------------|--------------|---------------|
| Light | `light` | 100% | 0% | 100% |
| Temperature | `temperature` | 100% | 0% | 100% |
| Nutrients | `nutrients` | 100% | 0% | 100% |
| Water | `water` | 100% | 0% | 100% |

---

## Interaction Matrix

This is the core of the simulation. Each cell describes how an environment variable affects a trait's expression.

### Expression Modifiers (applied each tick)

| Trait \ Env | Light | Temperature | Nutrients | Water |
|---|---|---|---|---|
| **flavorIntensity** | — | Moderate heat boosts (+), extreme hurts (−) | Mild deficiency boosts (+), extreme hurts (−) | Mild deficit boosts (+), excess hurts (−) |
| **growthSpeed** | Low light slows (−) | Extreme slows (−) | Deficiency slows (−) | Deficiency slows (−) |
| **yield** | Low light reduces (−) | — | Strong effect (−) | Strong effect (−) |
| **appearance** | Low light dulls (−) | Extreme damages (−) | Excess hurts (−) | Excess or deficit hurts (−) |
| **hardiness** | — | Stress reduces, but high hardiness gene resists | — | — |
| **shelfLife** | — | Low avg stress boosts (+), high avg hurts (−) | (part of avg) | (part of avg) |

### Formulas

For each trait, the expression modifier `em` starts at 1.0 and is adjusted:

```
FLAVOR INTENSITY:
  nutrient_stress = stress(nutrients)
  water_stress = stress(water)
  temp_stress = stress(temperature)
  
  // Nutrient effect: mild stress concentrates flavors, extreme destroys them
  if nutrient_stress > 0.1 and nutrient_stress < 0.5:
    em += 0.1 × (1 - flavorIntensity_genetic/200)   // NEW: low-flavor plants benefit more
  else if nutrient_stress >= 0.5:
    em -= nutrient_stress × 0.2
  
  // Water effect: mild deficit intensifies, excess dilutes
  if water_stress > 0.1 and water_stress < 0.4:
    em += 0.08
  else if water_stress >= 0.4:
    em -= water_stress × 0.15
  
  // Temperature: moderate warmth helps, extreme hurts
  if temp_stress > 0.1 and temp_stress < 0.4:
    em += 0.05
  else if temp_stress >= 0.5:
    em -= temp_stress × 0.15
  
  Clamp: [0.0, 1.3]

GROWTH SPEED:
  em -= (nutrient_stress + water_stress + light_stress) × 0.15
  // Growth speed genetic affects the *growth increment*, not expression
  // (see Growth Rate section)
  
  Clamp: [0.0, 1.3]

YIELD:
  // Plants with higher yield genetics are more nutrient-efficient
  nutrient_penalty = nutrient_stress × 0.4 × (1 - yield_genetic/200)    // NEW
  water_penalty = water_stress × 0.3 × (1 - yield_genetic/250)          // NEW
  em -= nutrient_penalty + water_penalty
  
  // Good light boosts yield slightly
  if light_stress < 0.15:
    em += 0.05
  
  Clamp: [0.0, 1.3]

HARDINESS:
  // High hardiness genetic resists temperature stress
  em -= temp_stress × 0.3 × (1 - hardiness_genetic/100)
  
  Clamp: [0.0, 1.3]

APPEARANCE:
  // High appearance genetics are more delicate (inverted sensitivity!)
  fragility = 0.5 + (appearance_genetic/200)                             // NEW: 0.5–1.0
  em -= water_stress × 0.2 × fragility
  em -= nutrient_stress × 0.15 × fragility
  // Good light enhances appearance
  if light_stress < 0.2:
    em += 0.06
  else:
    em -= light_stress × 0.1
  
  Clamp: [0.0, 1.3]

SHELF LIFE:
  avg_stress = (nutrient_stress + water_stress + temp_stress) / 3
  // Healthy growing conditions = better cellular structure = longer shelf life
  if avg_stress < 0.3:
    em += avg_stress × 0.1
  else:
    em -= avg_stress × 0.15 × (1 - shelfLife_genetic/150)               // NEW: high shelfLife resists
  
  Clamp: [0.0, 1.3]
```

### Health Damage (HP loss per tick)

Health damage is separate from expression — it represents physical damage to the plant.

```
hp_damage = 0
hp_damage += max(0, temp_stress - 0.5) × 20
hp_damage += max(0, water_stress - 0.6) × 15
hp_damage += max(0, nutrient_stress - 0.7) × 10

// NEW: Hardiness reduces HP damage
hardiness_shield = hardiness_genetic × hardiness_expression / 100
hp_damage = hp_damage × (1 - hardiness_shield × 0.5)

new_health = max(0, round(health - hp_damage))
```

Key thresholds:
- Temperature starts damaging at stress > 50% (values < 25 or > 75)
- Water starts damaging at stress > 60% (values < 20 or > 80)  
- Nutrients start damaging at stress > 70% (values < 15 or > 85)
- High hardiness can reduce incoming HP damage by up to 50%

### Growth Rate

Growth rate per tick is determined by the growthSpeed trait:

```
base_rate = 0.01
speed_bonus = (growthSpeed_genetic / 100) × growthSpeed_expression × 0.09
health_factor = max(0, health - hp_damage) / 100

growth_increment = (base_rate + speed_bonus) × health_factor
new_growth = min(1.0, growthStage + growth_increment)
```

A plant with growthSpeed=100 in ideal conditions grows at `0.01 + 0.09 = 0.10` per tick (10 ticks to mature).
A plant with growthSpeed=10 grows at `0.01 + 0.009 = 0.019` per tick (~53 ticks to mature).

---

## Breeding

When two mature plants (growthStage ≥ 0.8) breed:

```
offspring_count = 4 + floor(random() × 3)   // 4–6 seeds
offspring_generation = max(parent1.gen, parent2.gen) + 1

For each trait in offspring:
  weight = 0.3 + random() × 0.4             // 0.3–0.7 blend
  midpoint = parent1.trait × weight + parent2.trait × (1 - weight)
  value = gaussian(midpoint, stddev=8)       // mutation noise
  clamp to [0, 100]
```

**Design intent:** Breeding averages the parents with noise. Two 80-trait parents won't reliably produce 80+ offspring — there's regression toward the mean and variance. You need sustained selective pressure across generations.

### Seed Collection

Collecting seeds from a single mature plant:

```
seed_count = 2 + floor(random() × 3)        // 2–4 seeds
For each trait:
  value = gaussian(parent.trait.genetic, stddev=5)   // less variance than breeding
  clamp to [0, 100]
generation = parent.generation + 1
```

---

## Harvest & Freshness

When a plant is harvested, it becomes a shelf item:

```
max_fresh_days = 3 + (shelfLife_genetic × shelfLife_expression / 100) × 7
// Range: 3 days (shelfLife=0) to 10 days (shelfLife=100, perfect expression)

freshness = 1.0 at harvest
freshness -= 1/max_fresh_days per day
// Item is removed when freshness reaches 0
```

**Design intent:** shelfLife trait directly controls how long you can hold harvested produce. Low shelfLife means you must sell immediately. High shelfLife gives flexibility to wait for a good market day.

---

## Market Pricing

At each market day, demand is generated:

```
category = random from [Fresh Greens, Gourmet Herbs, Bulk Produce, Artisan Herbs]
price_multiplier = 0.7 + random() × 0.8     // 0.7–1.5
competition = 0.3 + random() × 0.7          // 0.3–1.0
crowded = competition > 0.6
```

Price per item:

```
// Trait scores
overall = (flavor×0.30 + yield×0.25 + appearance×0.30 + shelfLife×0.15) / 100
  where each = genetic × expression

// How well does this item match today's demand?
relevance = avg(item.trait[t].genetic × expression for t in demand.traits) / 100

// Base price from quality
base = 2 + overall × 13

// Modifiers
price = base × price_multiplier × freshness × (1 - competition × 0.4) × (0.5 + relevance)
```

**Design intent:** Price rewards quality, freshness, and demand matching. A stunning herb at a gourmet market day sells for 5–10× what a mediocre wilted plant does. Competition is random and uncontrollable — some weeks are just bad.

---

## Economic Pressure

```
daily_upkeep = $4
starting_money = $250
market_interval = 7 days
runway = 250 / 4 = 62.5 days ≈ 8–9 market cycles
```

The player must generate revenue from markets (and eventually contracts) to sustain operations. At minimum, each market cycle must net > $28 ($4 × 7 days) to break even.

---

## Environmental Tradeoff Strategies

These are the emergent strategies the system should support:

### Flavor Farming
- Nutrients at 35–40 (mild stress → flavor boost)
- Water at 35–40 (mild deficit → intensity boost)
- Risk: Yield and appearance suffer. Need fewer, higher-value sales.

### Speed Farming  
- All variables at 50 (zero stress, max growth speed)
- Boring but reliable. Good for quick turnarounds and meeting deadlines.
- Optimal for staggered production rhythms.

### Stress Testing
- Push temperature to edges to test hardiness genetics
- Deliberately harsh conditions to identify which seedlings survive
- Burns some plants but identifies the strongest breeders.

### Appearance Optimization
- Light and nutrients near 50, water carefully controlled
- Light at 45–50 gives small appearance bonus
- Water deviation punished more for high-appearance genetics (fragility)

---

## Test Specification

Tests should verify each interaction from the matrix above. Organized by system:

### Stress Function
- `stress(50) = 0`
- `stress(0) = 1`, `stress(100) = 1`
- `stress(25) = 0.5`
- Symmetry: `stress(50-x) = stress(50+x)`

### Expression: Flavor
- Nutrients at 35 (stress 0.3) → flavor expression > 1.0
- Nutrients at 10 (stress 0.8) → flavor expression < 1.0
- Nutrients at 50 → flavor expression = 1.0
- NEW: Plant with low flavor genetic benefits more from mild stress than high flavor genetic

### Expression: Yield
- Nutrients at 10, water at 10 → yield expression < 1.0
- NEW: High yield genetic plant has higher yield expression than low yield plant under same stress
- Good light (stress < 0.15) → slight yield boost

### Expression: Appearance  
- Water stress → appearance drops
- NEW: High appearance genetic drops MORE under stress (fragility)
- Good light → slight appearance boost

### Expression: Hardiness
- High hardiness gene → less expression loss from temp stress
- Hardiness 100 → immune to temp stress on expression

### Expression: Shelf Life
- Low overall stress → slight shelf life boost
- High stress → shelf life drops
- NEW: High shelfLife genetic resists stress better

### Expression: Growth Speed
- Light/nutrient/water stress reduce expression
- Growth speed genetic directly scales growth increment

### Health
- Ideal conditions: no HP loss
- Temp > 75 or < 25: HP damage
- Water > 80 or < 20: HP damage
- Nutrients > 85 or < 15: HP damage
- NEW: High hardiness reduces HP damage (up to 50% shield)
- Sufficient stress kills plant (HP → 0)
- Dead plants don't change

### Growth
- High growthSpeed gene grows faster
- Damaged health slows growth
- Dead plants stop growing

### Breeding
- Requires 2 mature plants (≥ 0.8 growth)
- Produces 4–6 seeds
- Generation increments
- Offspring traits blend parents with noise
- Immature plants can't breed

### Harvest & Freshness
- High shelfLife gene → longer max fresh days
- Freshness decays linearly each day
- Items removed at freshness 0

### Market
- Fresh items sell for more than stale
- Premium traits sell for more
- Crowded markets reduce prices
- Demand category affects relevance pricing
- Price multiplier scales correctly

### Economy
- Upkeep creates finite runway
- Market interval < bankruptcy horizon
- Single harvest can cover upkeep
