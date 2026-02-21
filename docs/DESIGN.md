# Side Hustle Simulator — Core Design Document

> A cozy real-time idle game about running home businesses to escape the 9-to-5.

## Vision

Players start broke with a day job that barely covers rent. They run side businesses (hobbies) from their apartment to build income, upgrade their living situation, and eventually go full-time on their passion. The game runs in real-time — leave it open, come back later, make decisions.

**Vibe:** Cozy, chill, satisfying. Like having a little world running on the side of your monitor.

**Target:** Steam release via Tauri (Rust + React)

---

## Core Mechanics

### Time System

| Real Time | Game Time |
|-----------|-----------|
| 1 hour | 1 day |
| 24 hours | ~24 days (~1 month) |
| 1 week | ~168 days (~6 months) |

- Game runs continuously while open
- Progress pauses when closed (no offline progress for v1)
- Future: offline progress calculation on resume

### Economy

**Income Sources:**
- Day job: Fixed daily income (barely covers rent)
- Businesses: Variable income from selling goods

**Expenses:**
- Rent: Daily, scales with apartment size
- Business upkeep: Per-business daily costs
- Supplies: One-time purchases for production

**Starting State:**
- $2,000 savings
- Starter apartment (2-3 hobby slots)
- Day job covering ~90% of rent

**Failure State:**
- If savings hit $0: Soft reset
- Downgrade to starter apartment
- Keep one business (player's choice)
- Keep all knowledge/unlocks

### Housing & Space

| Tier | Name | Hobby Slots | Rent/day | Unlock |
|------|------|-------------|----------|--------|
| 1 | Studio | 2 | $50 | Start |
| 2 | 1BR Apartment | 4 | $100 | $5k savings |
| 3 | 2BR Apartment | 6 | $175 | $15k savings |
| 4 | Small House | 10 | $300 | $40k savings |
| 5 | Large House | 16 | $500 | $100k + quit job |

### Job System

**Day Job:**
- Provides stable income
- Limits available "energy" or time for hobbies
- Quitting unlocks:
  - More time/energy for businesses
  - Advanced business mechanics
  - Tier 5 housing
  - Risk: no safety net income

**Quit Condition:** Requires $X savings + $Y daily passive income

---

## Business System

### Shared Architecture

Every business implements:

```typescript
interface Business {
  id: string;
  name: string;
  type: BusinessType;
  
  // Space
  slotsRequired: number;
  
  // Economy
  setupCost: number;
  dailyUpkeep: number;
  
  // State
  state: BusinessState;
  
  // Lifecycle
  tick(deltaTime: number): void;
  getActions(): Action[];
  serialize(): SaveData;
  deserialize(data: SaveData): void;
}
```

### Business Types (Planned)

| Business | Cycle | Complexity | Synergies |
|----------|-------|------------|-----------|
| Container Herbs | 7-14 days | Medium | → Compost |
| Mushroom Farm | 3-5 days | Low | → Herb compost, ← Coffee grounds |
| Shrimp Tank | 30+ days | High | → Fish waste fertilizer |
| Woodworking | On-demand | Medium | → Containers, furniture |
| Candle Making | 1-2 days | Low | ← Herb scents |
| Coffee Roasting | 2-3 days | Medium | → Grounds for mushrooms |

### Synergy System

Businesses can produce "byproducts" that other businesses consume:

```typescript
interface Byproduct {
  type: 'compost' | 'grounds' | 'waste' | 'scent' | 'container';
  amount: number;
  source: BusinessId;
}

// Event bus pattern
eventBus.emit('byproduct', { type: 'grounds', amount: 5, source: 'coffee-1' });
eventBus.on('byproduct', (bp) => {
  if (bp.type === 'grounds' && this.type === 'mushroom') {
    this.addBoost(bp.amount);
  }
});
```

---

## Save System

### Auto-save

- Save every 60 seconds
- Save on tab blur / minimize
- Save on quit

### Save Format

```typescript
interface GameSave {
  version: number;
  timestamp: number;
  
  player: {
    money: number;
    housingTier: number;
    hasJob: boolean;
    totalEarnings: number;
    totalDaysPlayed: number;
  };
  
  businesses: {
    [id: string]: BusinessSaveData;
  };
  
  unlocks: string[];
  achievements: string[];
}
```

### Steam Cloud

- Saves sync to Steam Cloud
- Conflict resolution: newest timestamp wins

---

## Technical Architecture

### Stack

```
┌─────────────────────────────────────┐
│         Tauri Shell (Rust)          │
│  - System tray + notifications      │
│  - Steamworks SDK                   │
│  - Window management                │
│  - File system access               │
└─────────────────────────────────────┘
                 │
                 │  IPC (JSON)
                 ▼
┌─────────────────────────────────────┐
│       React Frontend (TS)           │
│  - UI components                    │
│  - Business-specific views          │
│  - Responsive layout                │
└─────────────────────────────────────┘
                 │
                 │  State
                 ▼
┌─────────────────────────────────────┐
│       Game Engine (TS)              │
│  - Tick loop (requestAnimationFrame)│
│  - Business registry                │
│  - Event bus                        │
│  - Save/load                        │
│  - Economy calculations             │
└─────────────────────────────────────┘
```

### File Structure

```
/src
  /engine
    tick.ts           # Main game loop
    economy.ts        # Money, rent, expenses
    events.ts         # Event bus for synergies
    save.ts           # Save/load logic
  /businesses
    /herbs
      index.ts        # Container Farm business
      components/     # React components
    /mushrooms
      index.ts
      components/
  /ui
    Home.tsx          # Main hub view
    Business.tsx      # Business wrapper
    Header.tsx        # Money, time, etc.
  /tauri
    tray.rs           # System tray
    steam.rs          # Steamworks integration
```

---

## Development Phases

### Phase 0: Foundation (Current)
- [x] Container Farm prototype
- [ ] Tauri scaffold
- [ ] Shared game engine (tick, save, events)
- [ ] Home view with business slots
- [ ] Day job + rent + economy basics

### Phase 1: Core Loop
- [ ] Housing upgrades
- [ ] Second business (Mushrooms)
- [ ] Synergy: mushroom waste → herb compost
- [ ] Soft failure + recovery
- [ ] Steam build + tray icon

### Phase 2: Depth
- [ ] Third business (Woodworking or Shrimp)
- [ ] Quit job mechanic
- [ ] Achievements
- [ ] Steam Cloud saves

### Phase 3: Polish
- [ ] Sound design
- [ ] Notifications ("Herbs ready!")
- [ ] Tutorial / onboarding
- [ ] Steam Deck UI

### Phase 4+: Multiplayer Economy
- [ ] Player marketplace
- [ ] Supply/demand pricing
- [ ] Trading

---

## Open Questions

1. **Energy/Time System:** Should hobbies require "energy" that regenerates? Or just real-time waiting?

2. **Prestige/Reset:** Is there a prestige mechanic? Start over with bonuses?

3. **Seasonal Events:** Farmer's markets, holidays, special crops?

4. **NPCs/Customers:** Named recurring customers with preferences?

---

## Appendix: Container Farm (Current State)

The herb farming business is already built with:
- 6 genetic traits per plant
- 4 environment controls
- Graph-based simulation (17 edges)
- Breeding system
- Market/reputation system
- Contracts

See `/container-farm.jsx` and `/DESIGN.md` for full spec.
