# Kitchen System — Implementation Handoff

> Everything Claude Code needs to build the kitchen system.

**Read first:** [KITCHEN.md](./KITCHEN.md) for full design spec.

---

## Summary

Build a cooking system where:
1. Players store homegrown ingredients + buy staples
2. Game auto-cooks daily meals from available ingredients
3. Recipes are discovered by having the right ingredients
4. Variety (unique meals/week) gives efficiency bonuses

---

## What Already Exists

### Balance Constants (`src/balance.ts`)
- `KITCHEN` — storageCapacity (15), takeoutCost ($12)
- `STAPLES` — 6 store-bought ingredients with prices/stack limits
- `RECIPES` — 15 recipes with tier, groceryValue, ingredient requirements
- `VARIETY_BONUS` — 3 tiers with efficiency bonuses

### Types (`src/kitchen/types.ts`)
- `FoodItem` — homegrown ingredient (existing, unchanged)
- `StapleItem` — store-bought ingredient (new)
- `MealLog` — record of a cooked meal (new)
- `RecipeId` — typed recipe keys (new)
- `KitchenState` — extended with staples, discoveredRecipes, mealHistory (updated)
- `getVarietyStatus()` — calculates current variety tier (new)
- `INITIAL_KITCHEN` — initial state (updated)

### Existing Patterns
- Engine logic lives in `src/engine/*.ts`
- Store is `src/store/gameStore.ts` (Zustand)
- Tick runs every second, advances `gameDay`
- Economy runs weekly (rent, income, groceries)
- Toast notifications via `src/ui/toast/`

---

## Architecture Decisions

### 1. New Engine File: `src/engine/kitchenEngine.ts`

Create with these functions:

```typescript
// Check if a recipe can be made with current inventory
canMakeRecipe(
  recipeId: RecipeId,
  storage: FoodItem[],
  staples: StapleItem[]
): boolean

// Get all recipes that could be discovered (have ingredients, not yet discovered)
getDiscoverableRecipes(
  storage: FoodItem[],
  staples: StapleItem[],
  discovered: RecipeId[]
): RecipeId[]

// Select best meal from discovered recipes that can be made
// Returns null if nothing can be made
selectBestMeal(
  discoveredRecipes: RecipeId[],
  storage: FoodItem[],
  staples: StapleItem[]
): RecipeId | null

// Consume ingredients for a recipe, return what was used
// Prioritize oldest (lowest freshness) homegrown items first
cookMeal(
  recipeId: RecipeId,
  storage: FoodItem[],
  staples: StapleItem[]
): {
  updatedStorage: FoodItem[],
  updatedStaples: StapleItem[],
  ingredientsUsed: { itemId: string, name: string, quantity: number }[]
}

// Resolve "any" ingredients to actual items from inventory
// _anyHerb, _anyMushroom, _anyHerbsDistinct, _anyMushroomsDistinct
resolveIngredients(
  requirements: Record<string, number>,
  storage: FoodItem[],
  staples: StapleItem[]
): Map<string, { source: 'storage' | 'staples', items: string[] }> | null
```

**Ingredient matching logic:**
- `basil: 2` → need 2+ basil in storage
- `_anyHerb: 1` → any herb (basil, mint, parsley, cilantro, chives)
- `_anyMushroom: 2` → any mushroom, qty 2+
- `_anyHerbsDistinct: 3` → 3 different herb types, 1 each
- `_anyMushroomsDistinct: 2` → 2 different mushroom types, 1 each

Herb IDs: `basil`, `mint`, `parsley`, `cilantro`, `chives`
Mushroom IDs: `oyster`, `shiitake`, `lions_mane`

### 2. Store Actions (in `gameStore.ts`)

Add these actions:

```typescript
// Buy staples from shop
buyStaple: (stapleId: keyof typeof STAPLES, quantity: number) => void
// Deduct money, add to kitchen.staples (stack if exists)

// Discover a recipe (called when conditions met)
discoverRecipe: (recipeId: RecipeId) => void
// Add to kitchen.discoveredRecipes, fire toast

// Cook daily meal (called from tick on day rollover)
cookDailyMeal: () => void
// 1. Check for new recipe discoveries, fire toasts
// 2. Select best available meal
// 3. Consume ingredients
// 4. Log meal to mealHistory
// 5. If no meal possible, log takeout

// Reset weekly meal tracking (called from economy tick)
resetWeeklyMeals: () => void
// Clear mealHistory, update weekStartDay
```

### 3. Tick Integration

In the `tick()` action, add:

```typescript
// On day rollover (when Math.floor(newDay) > Math.floor(oldDay))
if (dayRolledOver) {
  get().cookDailyMeal();
}
```

### 4. Economy Integration

Grocery savings calculation needs to account for:
- Meals cooked this week → sum of groceryValue
- Takeout meals → add takeoutCost
- Final grocery bill = `weeklyGroceryBase - mealSavings + takeoutCosts`

### 5. Efficiency Bonus Integration

The variety bonus affects growth speed. In plant/mushroom growth calculations:

```typescript
const varietyStatus = getVarietyStatus(kitchen.mealHistory, kitchen.weekStartDay, gameDay);
const efficiencyMultiplier = 1 + varietyStatus.efficiencyBonus;
// Apply to growth rate
```

---

## New UI Components

### `src/kitchen/components/StapleShop.tsx`

Modal or panel to buy staples:
- List all 6 staples with prices
- Show current quantity owned
- Buy button (disabled if can't afford or at stack limit)
- Total cost display

### `src/kitchen/components/RecipeBook.tsx`

Grid/list of recipes:
- Discovered recipes: show name, emoji, ingredients, grocery value
- Undiscovered recipes: show "???" or silhouette, maybe hint at tier
- Indicate which recipes can be made right now

### `src/kitchen/components/MealHistory.tsx`

This week's meals:
- List of meals cooked (emoji + name + savings)
- "Takeout" entries shown differently
- Current variety status prominently displayed

### `src/kitchen/components/VarietyStatus.tsx`

Compact display of current bonus:
- Show meal icons for this week (🍽️ per unique meal)
- Tier name + emoji if qualified
- Bonus amount (+10% efficiency)

---

## Toast Notifications

**Recipe discovered:**
```
🍝 New Recipe: Pesto Pasta!
```

**Daily meal (subtle, not blocking):**
```
🍽️ Tonight: Mushroom Risotto — Saved $15
```

**Variety tier reached:**
```
🌟 Thriving! 5 unique meals — +10% efficiency
```

**Takeout fallback:**
```
🥡 Ordered takeout — $12
```

---

## Testing Priorities

1. **Ingredient matching** — especially "any" and "distinct" patterns
2. **Recipe discovery** — triggers correctly when ingredients available
3. **Meal selection** — picks highest value, handles ties
4. **Ingredient consumption** — correct quantities, oldest first
5. **Variety calculation** — resets weekly, counts unique correctly
6. **Economy integration** — savings applied correctly to grocery bill

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/engine/kitchenEngine.ts` | CREATE — all cooking logic |
| `src/store/gameStore.ts` | MODIFY — add actions, integrate tick |
| `src/kitchen/components/StapleShop.tsx` | CREATE |
| `src/kitchen/components/RecipeBook.tsx` | CREATE |
| `src/kitchen/components/MealHistory.tsx` | CREATE |
| `src/kitchen/components/VarietyStatus.tsx` | CREATE |
| `src/kitchen/PantryView.tsx` | MODIFY — integrate new components |
| `tests/engine/kitchenEngine.test.ts` | CREATE — unit tests |

---

## Out of Scope (Not This PR)

- Cook to sell (Phase 2)
- Kitchen upgrades (Phase 2)
- Recipe mastery (Phase 2)
- Farmers market staple deals (can add later)

---

## Questions? 

If anything is unclear, check:
1. `docs/KITCHEN.md` — full design spec
2. `src/balance.ts` — all the numbers
3. `src/kitchen/types.ts` — type definitions
4. `docs/ARCHITECTURE.md` — codebase patterns

Or ask Mark.
