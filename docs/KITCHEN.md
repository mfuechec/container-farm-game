# Side Hustle Simulator — Kitchen System Spec

> Transform ingredients into meals. Save money. Eat well.

*For balance values, see [BALANCE.md](./BALANCE.md).*
*For overall design context, see [GAME_DESIGN.md](./GAME_DESIGN.md).*

---

## Overview

The kitchen is where the **Store** path pays off. Players who store ingredients instead of selling them get:

1. **Grocery savings** — meals made from homegrown ingredients reduce weekly grocery bill
2. **Recipe discovery** — finding new recipes is a progression system
3. **Variety bonus** — eating diverse meals boosts hobby efficiency

### Core Flow

```
Harvest → Store → Kitchen Storage
                      ↓
           Daily Auto-Meal (consumes ingredients)
                      ↓
           Grocery Savings + Variety Bonus
```

### Design Goals

- **Visible payoff** for storing instead of selling
- **Discovery dopamine** from unlocking recipes
- **Light engagement** — auto-cooks by default, no micromanagement required
- **Clear feedback** — player sees what they ate and what they saved

---

## Ingredients

### Homegrown (from hobbies)

| Type | Source | Notes |
|------|--------|-------|
| Basil | Plants | Italian cuisine staple |
| Mint | Plants | Fresh, pairs with sweet/savory |
| Parsley | Plants | Versatile, high grocery value |
| Cilantro | Plants | Bold flavor, short shelf life |
| Chives | Plants | Mild onion flavor, long shelf life |
| Oyster Mushroom | Mushrooms | Mild, easy to grow |
| Shiitake | Mushrooms | Rich umami |
| Lion's Mane | Mushrooms | Premium, "meaty" texture |

### Store-Bought Staples

| Staple | Price | Stack Limit | Notes |
|--------|-------|-------------|-------|
| Pasta | $3 | 10 | Italian dishes |
| Rice | $3 | 10 | Asian/risotto dishes |
| Tomatoes | $4 | 8 | Fresh, salads/sauces |
| Garlic | $2 | 12 | Used in almost everything |
| Olive Oil | $5 | 6 | Essential fat |
| Cheese | $6 | 6 | Most expensive, big payoff |

**Farmers Market Deals:** When visiting the market, 30-40% chance of a deal on one random staple. Creates "should I stock up?" decisions.

---

## Storage

### Capacity

**MVP:** 15 slots (items stack within type)

- Each ingredient type = 1 slot
- 5 basil = 1 slot with quantity 5
- Max 15 different ingredient types stored simultaneously

With 8 homegrown + 6 staples = 14 types, player can almost stock everything. Light pressure to prioritize.

### Freshness

Homegrown ingredients decay per their `maxFreshDays` value (from balance.ts):
- Items at 0 freshness are removed
- Staples don't decay (shelf-stable)

### UI

Storage view shows:
- Each ingredient type with quantity and freshness bar
- "Buy Staples" button → shop modal
- Current capacity: "12/15 slots"

---

## Recipes

### Discovery

**Trigger:** Having all required ingredients in storage (don't need to cook it)

**Notification:** Toast on discovery
> "🍝 New Recipe Discovered: Pesto Pasta!"

**Recipe Book:** UI showing all recipes (discovered = visible, undiscovered = silhouette/locked)

### Recipe List (15 at launch)

#### Tier 1 — Simple
*1 homegrown + 1-2 staples | Grocery value: $6-8*

| Recipe | Ingredients | Grocery Value |
|--------|-------------|---------------|
| Herb Oil | Any herb (1) + Olive Oil (1) | $8 |
| Garlic Mushrooms | Any mushroom (1) + Garlic (1) + Olive Oil (1) | $7 |
| Simple Salad | Any herb (1) + Tomatoes (1) + Olive Oil (1) | $6 |

#### Tier 2 — Standard
*1-2 homegrown + 2-3 staples | Grocery value: $10-15*

| Recipe | Ingredients | Grocery Value |
|--------|-------------|---------------|
| Pesto Pasta | Basil (2) + Pasta (1) + Olive Oil (1) + Garlic (1) | $14 |
| Herb Rice | Any herb (1) + Rice (1) + Garlic (1) | $10 |
| Mushroom Risotto | Any mushroom (2) + Rice (1) + Cheese (1) + Garlic (1) | $15 |
| Caprese Salad | Basil (2) + Tomatoes (2) + Cheese (1) | $12 |
| Tabbouleh | Parsley (2) + Tomatoes (1) + Olive Oil (1) | $11 |
| Mushroom Pasta | Any mushroom (2) + Pasta (1) + Garlic (1) + Olive Oil (1) | $13 |

#### Tier 3 — Complex
*2+ homegrown + 2-3 staples | Grocery value: $18-25*

| Recipe | Ingredients | Grocery Value |
|--------|-------------|---------------|
| Italian Herb Pasta | Basil (1) + Parsley (1) + Pasta (1) + Tomatoes (1) + Garlic (1) | $22 |
| Herb Mushroom Risotto | Any herb (1) + Any mushroom (1) + Rice (1) + Cheese (1) | $20 |
| Garden Pasta | Any 2 different herbs (1 each) + Any mushroom (1) + Pasta (1) + Olive Oil (1) | $19 |
| Chimichurri Bowl | Parsley (1) + Cilantro (1) + Rice (1) + Garlic (1) + Olive Oil (1) | $18 |

#### Tier 4 — Gourmet
*Specific/rare combos | Grocery value: $28-35*

| Recipe | Ingredients | Grocery Value |
|--------|-------------|---------------|
| Lion's Mane "Steak" | Lion's Mane (2) + Garlic (1) + Olive Oil (1) + Any herb (1) | $28 |
| Full Garden Feast | 3+ different herbs (1 each) + 2+ different mushrooms (1 each) + Pasta (1) + Cheese (1) + Tomatoes (1) | $35 |

### "Any" Ingredients

Some recipes accept "any herb" or "any mushroom":
- Engine picks from available inventory
- Prioritizes oldest (closest to expiring) first
- Displays actual ingredient used in meal log

---

## Daily Meals

### Auto-Cooking

Each game day, the kitchen automatically prepares one meal:

1. **Check discovered recipes** — filter to those with sufficient ingredients
2. **Pick best available** — highest grocery value that can be made
3. **Consume ingredients** — deduct from storage
4. **Log the meal** — add to weekly meal history
5. **Apply savings** — reduce this week's grocery bill

### Fallback: No Valid Meal

If storage is empty or no recipe can be made:
> "Ordered takeout — $12"

Takeout cost is flat penalty, applied to weekly groceries.

### Meal Display

Daily notification (unobtrusive):
> "🍽️ Tonight: Mushroom Risotto (shiitake + rice + cheese + garlic)"
> "Saved $15 on groceries"

Weekly summary in economy view:
> "Meals this week: 5 home-cooked, 2 takeout"
> "Grocery savings: $62"

---

## Variety Bonus

### Tracking

Count unique recipes cooked in the current week (resets weekly with economy tick).

### Tiers

| Unique Meals | Tier Name | Bonus |
|--------------|-----------|-------|
| 0-2 | — | None |
| 3-4 | Well-Fed 🍽️ | +5% hobby efficiency |
| 5-6 | Thriving 🌟 | +10% hobby efficiency |
| 7 | Gourmet Week 👨‍🍳 | +15% efficiency + 2x recipe discovery chance |

### Efficiency Effect

"Hobby efficiency" applies to:
- **Plants:** Growth speed multiplier
- **Mushrooms:** Flush speed multiplier

### Visibility

Status bar or weekly summary:
> "This week: 🍽️🍽️🍽️🍽️🍽️ (5 unique meals)"
> "Status: Thriving (+10% efficiency)"

---

## Integration Points

### With Economy System

- Grocery savings reduce `weeklyGroceries` in economy tick
- Takeout penalty adds to `weeklyGroceries`
- Variety bonus affects hobby output calculations

### With Plant Hobby

- Harvested plants can go to kitchen storage (existing flow)
- Variety bonus affects `growthSpeed` multiplier

### With Mushroom Hobby

- Harvested mushrooms can go to kitchen storage
- Variety bonus affects flush timing

### With Combos (existing system)

Kitchen combos (Italian Herbs, Fresh Duo, etc.) remain as storage-based bonuses. Recipe system is additive, not replacement.

---

## UI Components Needed

1. **Storage View** — grid of stored ingredients with quantities, freshness bars
2. **Staple Shop Modal** — buy store-bought ingredients
3. **Recipe Book** — discovered vs locked recipes, ingredient requirements
4. **Daily Meal Toast** — "Tonight's dinner" notification
5. **Weekly Meal Summary** — in economy/status view
6. **Variety Status Indicator** — current tier + bonus

---

## Future Considerations (Not MVP)

- **Cook to Sell** — prepare meals to sell at market (higher value than raw)
- **Kitchen Upgrades** — larger storage, better auto-cook logic
- **Special Requests** — NPCs ask for specific meals (quests)
- **Recipe Mastery** — cooking same dish improves its value over time
- **Player Economy** — trade recipes or meals with other players

---

## Open Questions for Implementation

1. **Recipe data structure** — how to represent "any herb" in code?
2. **Discovery trigger timing** — check on every storage change, or periodic?
3. **Meal selection algorithm** — tiebreaker when multiple recipes have same value?
4. **Toast/notification UX** — how prominent should daily meal be?

---

## Changelog

### 2026-02-26 — Initial Spec
- Defined 6 staples, 15 recipes across 4 tiers
- Variety bonus: +5/10/15% at 3/5/7 unique meals
- Storage: 15 slots, stacking
- Auto-cooking with highest-value selection
