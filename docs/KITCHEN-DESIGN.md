# Kitchen System Design

## Philosophy

The kitchen is the **heart** of the game. You grow things to eat them. Selling is secondary — it's what you do with the excess.

## Core Loop

```
Harvest → Pantry → Cook → Eat → (Sell excess)
```

## Data Model

### Ingredient

```typescript
type IngredientCategory = 'herb' | 'mushroom' | 'staple' | 'vegetable' | 'protein';

interface Ingredient {
  id: string;
  name: string;              // "Basil", "Oyster Mushroom", "Rice"
  category: IngredientCategory;
  icon: string;              // Emoji or sprite reference
  shelfLife: number;         // Days before spoiling (staples = Infinity)
  basePrice: number;         // What you'd pay at store, or sell value
  flavorTags: string[];      // ['savory', 'earthy', 'aromatic']
}
```

### Pantry Item (Ingredient in storage)

```typescript
interface PantryItem {
  ingredientId: string;
  quantity: number;
  harvestedAt: number;       // Game day harvested (for freshness)
  source: 'grown' | 'bought';
}
```

### Meal

```typescript
interface Meal {
  name: string;              // Generated: "Herb Mushroom Pasta"
  ingredients: string[];     // ingredientIds used
  cookedAt: number;          // Game day
  satisfaction: number;      // 1-5 based on variety, freshness, combo
}
```

### Kitchen State

```typescript
interface KitchenState {
  pantry: PantryItem[];
  mealHistory: Meal[];       // Last 30 days
  varietyStreak: number;     // Days in a row with unique meals
}
```

## Staples (Always Available to Buy)

| Name | Price/unit | Category | Flavor Tags |
|------|-----------|----------|-------------|
| Rice | $1 | staple | neutral |
| Pasta | $1 | staple | neutral |
| Eggs | $2 | protein | rich, neutral |
| Olive Oil | $1 | staple | rich |
| Garlic | $0.50 | vegetable | pungent, savory |
| Onion | $0.50 | vegetable | savory, sweet |
| Salt | $0.25 | staple | neutral |
| Butter | $1 | staple | rich |

## Meal Generation

### Simple Combining Rules

A meal needs:
- **1 Base** (staple): rice, pasta, eggs
- **1-3 Toppings** (anything else): herbs, mushrooms, vegetables

### Name Generation

```
[Adjective?] [Topping] [Topping?] [Base]

Examples:
- "Herb Pasta"
- "Garlic Mushroom Rice"
- "Fresh Basil Omelette"
- "Savory Mushroom Herb Pasta"
```

Adjective comes from freshness:
- 100-80% fresh: "Fresh", "Garden"
- 80-50%: (none)
- Below 50%: "Wilted", "Day-old"

### Satisfaction Score (1-5)

```
Base: 2
+1 if any ingredient is "fresh" (>80%)
+1 if using home-grown ingredient
+1 if new combination (not in last 7 days)
-1 if any ingredient is wilted (<50%)
-1 if repeated meal from yesterday

Cap at 1-5
```

## Variety Tracking

Track ingredients used over the last 7 days:

```typescript
function getVarietyScore(mealHistory: Meal[]): { 
  score: number;           // 0-100
  uniqueIngredients: number;
  suggestion?: string;     // "Try adding mushrooms!"
}
```

**Nudges (not penalties):**
- "You've had pasta 4 days in a row — how about rice?"
- "Your mushrooms are getting old — use them tonight!"
- "New combo unlocked: Herb Mushroom Pasta!"

## UI Layout

```
┌─────────────────────────────────────────────┐
│  🍳 KITCHEN                                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │ PANTRY          │  │ TONIGHT'S DINNER │  │
│  │                 │  │                  │  │
│  │ 🌿 Basil    x4  │  │   🍝             │  │
│  │ 🍄 Oyster   x2  │  │                  │  │
│  │ 🍚 Rice     x8  │  │ Fresh Herb Pasta │  │
│  │ 🍳 Eggs     x6  │  │                  │  │
│  │ 🧄 Garlic   x3  │  │ ⭐⭐⭐⭐☆         │  │
│  │                 │  │                  │  │
│  │ [Buy Staples]   │  │ "Smells amazing" │  │
│  └─────────────────┘  └──────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ THIS WEEK                               ││
│  │ Mon: Rice Bowl ⭐⭐⭐                    ││
│  │ Tue: Mushroom Pasta ⭐⭐⭐⭐              ││
│  │ Wed: Herb Omelette ⭐⭐⭐⭐ (new!)        ││
│  │ Thu: ? (tonight)                        ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

## Phase 1: Auto-Cook (Build First)

**No player interaction yet.** Just prove the concept feels right.

1. Harvest goes to pantry (not auto-sell)
2. Each day, game auto-selects a meal from available ingredients
3. Shows "Tonight's Dinner" with name + satisfaction
4. Tracks meal history
5. Gives soft nudges about variety

**What we're testing:**
- Does it feel different when harvest has a destination?
- Is the "what did I eat" display satisfying?
- Do variety nudges create natural goals?

## Phase 2: Player Cooking (Later)

- Drag ingredients to cooking area
- Discover "favorite meals" (save combinations)
- Recipe book fills out as you experiment
- Seasonal specials ("Winter Stew unlocked!")

## Phase 3: Selling Excess (Later)

- "Sell" button on pantry items
- Market only on certain days?
- Neighbors request specific things?
- Excess auto-composts if not used/sold

## Integration with Existing Systems

### Hobbies → Pantry
- Plant harvest → Pantry (herbs)
- Mushroom harvest → Pantry (mushrooms)
- Future hobbies add more ingredients

### Economy
- Buying staples costs money
- Selling excess earns money (less emphasis than before)
- Good meals could reduce "grocery budget" in weekly expenses?

### Synergies
- Kitchen bonus from mushroom compost still works
- Fresh ingredients from plant hobby → better meals
