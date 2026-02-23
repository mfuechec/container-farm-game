# Architecture: Game Logic vs UI Separation

## Goal
Enable major UI overhauls (different renderer, framework, or platform) without rewriting game logic.

## Current State (Feb 2025)
```
src/
├── store/gameStore.ts    ← State + Logic mixed together
├── hobbies/plants/
│   ├── types.ts          ← Type definitions (good)
│   ├── equipment.ts      ← Equipment data (good)
│   ├── PlantHobby.tsx    ← UI component
│   └── GrowCanvas.tsx    ← PixiJS renderer
├── engine/
│   ├── events.ts         ← EventBus (good, but unused)
│   └── types.ts          ← Some types
└── Game.tsx              ← Main UI shell
```

**Problem:** Plant growth, harvesting, economy logic is inside Zustand store actions.

## Target Architecture
```
src/
├── engine/                    ← PURE GAME LOGIC (no React, no Zustand)
│   ├── types.ts               ← All game types
│   ├── plantEngine.ts         ← Plant growth, harvest, yields
│   ├── economyEngine.ts       ← Money, rent, pricing, expenses
│   ├── kitchenEngine.ts       ← Storage, decay, bonuses
│   ├── timeEngine.ts          ← Day/week progression, tick logic
│   └── index.ts               ← Unified engine API
│
├── store/                     ← STATE MANAGEMENT (thin layer)
│   └── gameStore.ts           ← Holds state, calls engine functions
│
├── ui/                        ← REACT COMPONENTS (rendering only)
│   ├── views/
│   │   ├── ApartmentView.tsx
│   │   ├── PlantHobbyView.tsx
│   │   └── KitchenView.tsx
│   ├── components/            ← Reusable UI components
│   └── renderers/
│       └── GrowCanvas.tsx     ← PixiJS (swappable)
│
└── App.tsx                    ← Entry point
```

## Key Principles

### 1. Engine is Pure Functions
```typescript
// engine/plantEngine.ts
export function calculateGrowth(
  plant: PlantInstance,
  deltaDays: number,
  lightBoost: number,
  kitchenBonus: number
): PlantInstance {
  // Pure calculation, no side effects
  const newProgress = Math.min(1, plant.growthProgress + ...);
  return { ...plant, growthProgress: newProgress, stage: getStage(newProgress) };
}

export function calculateHarvest(
  plant: PlantInstance,
  yieldMultiplier: number
): HarvestedPlant {
  // Pure calculation
}
```

### 2. Store Calls Engine
```typescript
// store/gameStore.ts
tick: () => {
  const state = get();
  
  // Engine calculates new state
  const newPlants = timeEngine.tickPlants(state.plantHobby.plants, deltaDays, ...);
  const newKitchen = kitchenEngine.decayItems(state.kitchen, deltaDays);
  const newEconomy = economyEngine.processWeeklyExpenses(state.economy, ...);
  
  // Store just updates
  set({ 
    plantHobby: { ...state.plantHobby, plants: newPlants },
    kitchen: newKitchen,
    economy: newEconomy,
  });
}
```

### 3. UI Only Renders
```typescript
// ui/views/PlantHobbyView.tsx
export function PlantHobbyView() {
  // Read from store
  const plants = useGameStore(s => s.plantHobby.plants);
  const harvest = useGameStore(s => s.harvestPlant);
  
  // Dispatch actions (doesn't know how they work)
  const handleHarvest = (plantId: string) => harvest(plantId);
  
  // Just render
  return <GrowCanvas plants={plants} onHarvest={handleHarvest} />;
}
```

## Benefits

1. **Testable Logic**: Engine functions can be unit tested without React/DOM
2. **Swappable Renderer**: Replace PixiJS with Three.js, Canvas2D, or terminal
3. **Framework Agnostic**: Core logic works with React, Vue, Svelte, or native
4. **Multiplayer Ready**: Engine can run on server for authoritative simulation
5. **Save/Load**: Engine state is serializable, UI state is transient

## Migration Plan

### Phase 1: Extract Plant Logic
- [ ] Create `engine/plantEngine.ts` with growth/harvest functions
- [ ] Update store to call engine functions
- [ ] Add unit tests for engine

### Phase 2: Extract Economy
- [ ] Create `engine/economyEngine.ts`
- [ ] Move rent, pricing, expense logic
- [ ] Add unit tests

### Phase 3: Extract Kitchen
- [ ] Create `engine/kitchenEngine.ts`
- [ ] Move decay, bonus calculations

### Phase 4: Unified Tick
- [ ] Create `engine/timeEngine.ts`
- [ ] Single tick function that advances all systems
- [ ] Store.tick() just calls engine.tick()

## Testing Strategy

```
tests/
├── engine/                    ← Unit tests (fast, no browser)
│   ├── plantEngine.test.ts
│   ├── economyEngine.test.ts
│   └── kitchenEngine.test.ts
├── store/                     ← Integration tests
│   └── gameStore.test.ts
└── e2e/                       ← Playwright tests (full gameplay)
    └── gameplay.spec.ts
```

Run with:
```bash
npm run test:unit      # Vitest for engine tests
npm run test:e2e       # Playwright for full gameplay
```
