# Selling System Design

## Overview
Replace instant sell button with spatial selling mechanics:
- **Wholesale truck** - Always available, 50% price
- **Farmers market** - Rental-based, 100% price + freshness bonus
- **Drying rack** - Equipment to extend herb life for stockpiling

## Phase 1: Wholesale Truck

### Mechanics
- Visual truck icon on harvest screen
- Drag harvest items to truck to sell
- Instant sale at 50% of base price
- No freshness bonus

### Implementation
1. Add wholesale price calculation to plantEngine
2. Add `sellWholesale(harvestId)` action to store
3. Replace sell button with truck visual in PlantHobby
4. Drag-drop interaction (or click for MVP)

## Phase 2: Farmers Market

### Rental Tiers
| Tier | Cost | Frequency | Days |
|------|------|-----------|------|
| Weekly | $15/wk | Every 7 days | Day 7, 14, 21... |
| Bi-weekly | $10/2wk | Every 14 days | Day 14, 28... |
| Monthly | $20/mo | Every 28 days | Day 28, 56... |

### Mechanics
- Player selects rental tier (or none)
- Rental cost deducted with weekly expenses
- On market day: stall appears in UI
- Drag items to stall to sell at full price
- Market lasts 1 game day
- After market day: stall disappears

### State
```typescript
interface MarketState {
  rentalTier: 'weekly' | 'biweekly' | 'monthly' | null;
  lastMarketDay: number; // game day of last market
}
```

### Implementation
1. Add MarketState to game state
2. Add rental selector UI (in shop or apartment)
3. Add market day calculation logic
4. Add market stall visual (appears/disappears)
5. Add `sellAtMarket(harvestId)` action
6. Deduct rental from weekly expenses

## Phase 3: Drying Rack

### Equipment
- Cost: $40
- Location: Appears in grow area when purchased

### Mechanics
- Click drying rack to open drying UI
- Select fresh harvest to dry
- Drying takes 1-2 game days
- Dried herbs:
  - Freshness decay 5x slower
  - Sell price 75% of fresh equivalent
  - New item type or flag on HarvestedPlant

### State
```typescript
interface DryingRack {
  owned: boolean;
  drying: {
    harvestId: string;
    startDay: number;
    completionDay: number;
  }[];
  capacity: number; // how many can dry at once
}
```

## UI Changes

### Harvest Tab (Current)
- List of harvested items
- [Keep] [Sell $X] buttons

### Harvest Tab (New)
- Harvest tray with items
- Wholesale truck (always visible) - drag target
- Market stall (market days only) - drag target
- Drying rack (if owned) - drag target

## Price Calculations

```typescript
function getWholesalePrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  return plantType.sellPrice * harvest.quantity * 0.5; // 50%
}

function getMarketPrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  const freshnessBonus = 1 + (harvest.freshness - 0.5) * 0.2; // 90-110%
  return plantType.sellPrice * harvest.quantity * freshnessBonus;
}

function getDriedPrice(harvest: HarvestedPlant): number {
  const plantType = getPlantType(harvest.typeId);
  return plantType.sellPrice * harvest.quantity * 0.75; // 75%
}
```

## Migration
- Existing `sellHarvest` action becomes `sellWholesale`
- No breaking changes to existing save data
- Market state defaults to null (no rental)
