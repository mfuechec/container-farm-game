# Side Hustle Simulator — Technical Architecture

> Implementation guide for the game engine, state management, and codebase structure.

*For game design and creative direction, see [GAME_DESIGN.md](./GAME_DESIGN.md).*
*For balance values and tuning, see [BALANCE.md](./BALANCE.md).*

---

## Overview

**Stack:** React + TypeScript + Vite
**State:** Zustand with localStorage persistence  
**Rendering:** PixiJS (for grow canvas), React (for UI)  
**Styling:** Inline styles with theme object  
**Testing:** Storybook + Chromatic (visual regression)  
**Target:** Steam via Tauri (future), currently web-only

**Live Demo:** [container-farm-game.vercel.app](https://container-farm-game.vercel.app)

---

## Time System

Game time advances in real-time via a tick loop:

| Constant | Value |
|----------|-------|
| Tick interval | 1000ms (1 tick/second) |
| Game day | 3,600,000ms (1 real hour) |
| Ratio | 1 real hour = 1 game day |

```typescript
// In Game.tsx
useEffect(() => {
  const interval = setInterval(() => {
    useGameStore.getState().tick();
  }, TICK_INTERVAL);
  return () => clearInterval(interval);
}, []);
```

The `tick()` action in the store handles:
- Advancing `gameDay` (fractional)
- Plant growth calculations
- Mushroom growth calculations
- Kitchen freshness decay
- Synergy decay
- Weekly economy events (rent, income, groceries)

---

## State Management

### Zustand Store

Single global store (`src/store/gameStore.ts`) with all game state:

```typescript
interface GameState {
  // Core
  view: ViewType;
  gameDay: number;           // Fractional game day
  
  // Systems
  apartment: ApartmentState;
  economy: EconomyState;
  kitchen: KitchenState;
  pantry: PantryState;
  market: MarketState;
  
  // Hobbies
  plantHobby: PlantHobbyState;
  mushroomHobby: MushroomHobbyState;
  
  // Today's meal (computed daily)
  todaysMeal: Meal | null;
}
```

**Persistence:** Zustand's `persist` middleware auto-saves to localStorage.

**Actions:** All mutations go through store actions (e.g., `buySeeds`, `harvestPlant`, `upgradeHousing`).

**Selectors:** Derived state uses selectors (e.g., `selectYieldMultiplier`, `selectMushroomSynergyBonus`).

### State Slices

| Slice | Purpose | Key Fields |
|-------|---------|------------|
| `apartment` | Housing, hobby slots | `housing`, `hobbySlots`, `securityDeposit` |
| `economy` | Money flow | `money`, `weeklyRent`, `weeklyIncome` |
| `kitchen` | Item storage | `storage`, `capacity` |
| `pantry` | Ingredients, meals | `items`, `mealHistory` |
| `market` | Farmers market | `rentalTier`, `lastMarketDay` |
| `plantHobby` | Herb growing | `table`, `light`, `pots`, `plants`, `seeds`, `harvest` |
| `mushroomHobby` | Mushroom growing | `growBags`, `mushrooms`, `spawn`, `harvest`, `equipment` |

---

## Engine Modules

Game logic lives in `/src/engine/`:

### `index.ts` — Tick System
- Exports `MS_PER_GAME_DAY` constant
- Provides `TickInput` interface for tick calculations
- Core engine orchestration

### `plantEngine.ts` — Plant Growth
- Growth stage calculations (sprout → growing → mature → harvestable)
- Light bonus calculations
- Yield calculations with synergy bonuses

### `mushroomEngine.ts` — Mushroom Growth
- Environment-based growth (humidity, temperature)
- Flush cycle tracking
- Harvest calculations

### `pantryEngine.ts` — Meal System
- Ingredient definitions (`INGREDIENTS`)
- Meal generation algorithm
- Satisfaction scoring

### `synergies.ts` — Cross-Hobby Bonuses
Event bus pattern for hobby interactions:

```typescript
// When plants are harvested
emitCompostFromPlants(harvestQuantity, gameDay);

// Mushrooms check for bonus
const bonus = getSynergyBonus('mushrooms', gameDay);
```

Synergies decay linearly over 7 game days.

### `audio.ts` — Sound Effects
Simple audio manager with mute support:
```typescript
audio.play('click');
audio.toggleMute();
```

---

## Combo System

Data-driven combo definitions in `/src/combos/config.ts`:

```typescript
interface ComboDefinition {
  id: string;
  name: string;
  emoji: string;
  trigger: {
    type: 'kitchen' | 'garden';
    requiredItems: string[];
  };
  bonus: {
    type: 'groceryMultiplier' | 'growthMultiplier' | 'yieldBonus';
    value: number;
    scope: 'combo-items' | 'all-items';
  };
}
```

Detection runs in `Game.tsx`, triggers toast notifications on discovery.

---

## Rendering

### GrowCanvas (PixiJS)

`/src/hobbies/plants/GrowCanvas.tsx` renders the plant growing area:
- Uses `@pixi/react` for React integration
- Responsive sizing via ResizeObserver
- Renders table, pots, plants, lights
- Click detection for slot interactions

### React UI

Everything else is standard React:
- Theme system (`/src/theme.ts`) with light/dark modes
- Toast notifications (`/src/ui/toast/`)
- Modal patterns for menus

---

## File Structure

```
/src
  /engine
    index.ts              # Tick loop, time constants
    audio.ts              # Sound effects
    plantEngine.ts        # Plant growth math
    mushroomEngine.ts     # Mushroom growth math
    pantryEngine.ts       # Meal generation
    synergies.ts          # Cross-hobby event bus
    
  /store
    gameStore.ts          # Zustand store (1200+ lines)
    
  /hobbies
    /plants
      PlantHobby.tsx      # Orchestrator component
      GrowCanvas.tsx      # PixiJS canvas
      types.ts            # Plant definitions
      equipment.ts        # Tables, lights, pots
      /components
        PlantShop.tsx
        PlantMenu.tsx
        HarvestManager.tsx
    /mushrooms
      MushroomHobby.tsx
      types.ts
      /components
        MushroomShop.tsx
        GrowBags.tsx
        MushroomHarvest.tsx
        SpawnMenu.tsx
      
  /apartment
    ApartmentView.tsx     # Main hub
    types.ts
    
  /housing
    CityMap.tsx           # Housing selection
    HousingPreview.tsx    # Move confirmation
    HobbySelectModal.tsx  # Downgrade picker
    types.ts
    
  /kitchen
    PantryView.tsx        # Kitchen UI
    types.ts
    pantryStore.ts
    
  /market
    types.ts              # Rental tiers, pricing
    
  /combos
    config.ts             # Combo definitions
    engine.ts             # Detection logic
    index.ts              # Exports
    
  /ui
    /toast                # Toast notification system
    
  /stories
    *.stories.tsx         # Storybook stories
    
  Game.tsx                # Main game component
  App.tsx                 # Providers (theme, toast)
  theme.ts                # Light/dark themes
```

---

## Development Status

### ✅ Phase 0: Foundation
- [x] Container Farm prototype with PixiJS
- [x] Game engine (tick, save, events)
- [x] Apartment view with hobby slots
- [x] Zustand state with persistence

### ✅ Phase 1: Core Loop
- [x] Economy system (rent, income, groceries)
- [x] Plant growth and harvesting
- [x] Kitchen storage with freshness
- [x] Mushroom Farm (second hobby)
- [x] Synergy system
- [x] Combo system
- [x] Housing system (city map, moving)
- [x] Market system
- [x] Pantry with auto-meals
- [x] Toast notifications
- [x] Audio system

### 🔄 Phase 2: Polish (Current)
- [x] Theme toggle (dark/light)
- [x] Mute button
- [x] Storybook component library
- [x] Chromatic visual testing
- [ ] Desktop notifications
- [ ] Tutorial/onboarding
- [ ] More content (plants, mushrooms)
- [ ] Achievements

### 📋 Phase 3: Steam Prep
- [ ] Tauri scaffold
- [ ] System tray
- [ ] Steamworks integration
- [ ] Steam Cloud saves
- [ ] Controller support

### 💡 Phase 4+: Future
- [ ] Third hobby
- [ ] Quit job mechanic
- [ ] Multiplayer/trading
- [ ] Seasonal events

---

## Dev Commands

```bash
# Development
npm run dev           # Vite dev server (localhost:5173)

# Storybook
npm run storybook     # Component dev (localhost:6006)

# Testing
npm run chromatic     # Visual regression (needs token)

# Build
npm run build         # Production build
npm run preview       # Preview production build

# Deploy
vercel --prod         # Deploy to Vercel
```

---

## Key Patterns

### Adding a New Hobby

1. Create `/src/hobbies/[name]/` with:
   - `types.ts` — Type definitions
   - `[Name]Hobby.tsx` — Orchestrator component
   - `/components/` — Sub-components

2. Add state slice to `gameStore.ts`:
   - Define interface
   - Add to `GameState`
   - Create initial state
   - Add actions

3. Add to hobby selector in `Game.tsx`

4. Add synergy connections in `synergies.ts` if applicable

### Adding a New Combo

1. Add definition to `/src/combos/config.ts`:
```typescript
{
  id: 'new_combo',
  name: 'New Combo',
  emoji: '✨',
  trigger: { type: 'kitchen', requiredItems: ['item1', 'item2'] },
  bonus: { type: 'groceryMultiplier', value: 1.2, scope: 'combo-items' },
}
```

Detection and toast notification happen automatically.

### Adding a Plant Type

1. Add to `PLANT_TYPES` in `/src/hobbies/plants/types.ts`
2. Add seed to shop in `/src/hobbies/plants/components/PlantShop.tsx`
3. (Optional) Add combos involving it

---

## Performance Notes

- Tick runs every second — keep `tick()` fast
- PixiJS canvas only re-renders on state changes
- `useShallow` prevents unnecessary React re-renders
- Large state (1200+ line store) — consider splitting if it grows more
