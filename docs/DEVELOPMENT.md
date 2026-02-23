# Development Guide

## Mobile-First Rules

**All UI must work at 375px width (iPhone SE).** Test on mobile before declaring done.

### Responsive Guidelines

1. **No hardcoded pixel widths for containers**
   - ❌ `width: 800px`
   - ✅ `width: 100%` or `max-width: 800px`

2. **Use % or viewport units for responsive elements**
   - ❌ `margin-left: 200px`
   - ✅ `margin-left: 5%` or `padding: clamp(8px, 2vw, 24px)`

3. **Canvas/PixiJS components must accept dynamic dimensions**
   - Pass `width` and `height` as props, not hardcoded values
   - Use `ResizeObserver` or parent container size
   - Example: `<GrowCanvas width={containerWidth} height={200} />`

4. **Test at 375px before declaring done**
   - Storybook: Use viewport addon (iPhone SE is default)
   - Smoke test: `npm run smoke` tests both desktop and mobile
   - Manual: Chrome DevTools → Toggle device toolbar → iPhone SE

### Storybook Viewports

The project uses custom mobile viewports (configured in `.storybook/preview.ts`):
- **iPhone SE (375px)** - Default, smallest supported
- **iPhone 14 (390px)** - Common modern phone
- **iPad (768px)** - Tablet breakpoint
- **Desktop (1280px)** - Full desktop

Stories should include mobile variants for layout-sensitive components.

### Smoke Test

The smoke test (`npm run smoke`) runs at both viewport sizes:
- Desktop (1280px): Core functionality
- Mobile (375px): Same tests + overflow/layout checks

---

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
node tests.js
```

## Project Structure

```
/src
  /engine           # Core game systems
    types.ts        # Type definitions
    events.ts       # Event bus for cross-system communication
    tick.ts         # Main game loop (requestAnimationFrame)
    save.ts         # Save/load system
    economy.ts      # Money, rent, job, housing
    index.ts        # Engine initialization
    
  /businesses       # Business implementations
    /herbs          # Container Farm (existing)
    /mushrooms      # (planned)
    
  /ui               # React components
    Home.tsx        # Main hub view
    Business.tsx    # Business wrapper
    
/docs
  DESIGN.md         # Game design document
  DEVELOPMENT.md    # This file
```

## Engine Architecture

### Time System
- 1 real hour = 1 game day
- Game runs continuously via `requestAnimationFrame`
- Time is tracked in milliseconds, converted to game days

### Event Bus
The event bus enables loose coupling between systems:

```typescript
import { onNewDay, onByproduct, emitNotification } from './engine';

// Subscribe to events
onNewDay((event) => {
  console.log(`New day: ${event.day}/${event.month}/${event.year}`);
});

// Emit events
emitNotification({
  type: 'success',
  title: 'Harvest Ready!',
  message: 'Your herbs are ready to harvest.',
});
```

### Save System
- Auto-saves every 60 seconds
- Saves on tab blur and before unload
- Uses localStorage (will integrate with Tauri/Steam Cloud)

```typescript
import { save, load, reset, exportSave, importSave } from './engine';

// Manual save/load
save();
const saveData = load();

// Export for backup
const json = exportSave();

// Import from backup
importSave(json);
```

### Economy
```typescript
import { 
  getMoney, 
  addMoney, 
  spendMoney, 
  canAfford,
  getHousing,
  upgradeHousing,
  getJob,
  quitJob
} from './engine';

// Check balance
if (canAfford(500)) {
  spendMoney(500, 'Bought supplies', 'herbs-1');
}

// Add income
addMoney(200, 'Sold herbs at market', 'herbs-1');
```

## Adding a New Business

1. Create folder: `src/businesses/[name]/`
2. Implement the `Business` interface from `src/engine/types.ts`
3. Register with the business manager
4. Create React components for the UI

```typescript
// src/businesses/mushrooms/index.ts
import { Business, BusinessConfig, BusinessState } from '../../engine/types';

export const mushroomConfig: BusinessConfig = {
  type: 'mushrooms',
  name: 'Mushroom Farm',
  description: 'Grow gourmet mushrooms in containers',
  slotsRequired: 1,
  setupCost: 200,
  dailyUpkeep: 5,
};

export class MushroomBusiness implements Business {
  config = mushroomConfig;
  state: BusinessState;
  
  constructor(id: string) {
    this.state = {
      id,
      type: 'mushrooms',
      installedAt: 0,
      data: { /* mushroom-specific state */ },
    };
  }
  
  tick(deltaMs: number, gameTime: GameTime): void {
    // Update mushroom growth
  }
  
  getActions(): BusinessAction[] {
    return [
      { id: 'water', label: 'Water', execute: () => this.water() },
      { id: 'harvest', label: 'Harvest', execute: () => this.harvest() },
    ];
  }
  
  // ... rest of implementation
}
```

## Dev Console Commands

Open browser console and use these globals:

```javascript
// Time
__skipDay()       // Fast-forward 1 day
__skipWeek()      // Fast-forward 7 days
__skipMonth()     // Fast-forward 30 days

// Money
__addMoney(1000, 'Cheat')
__getMoney()

// Housing
__upgradeHousing()

// Save
__save()
__load()
__reset()
__exportSave()
__importSave(json)
```

## Testing with Playwright

We have Playwright MCP configured for visual testing:

```bash
# Via mcporter
mcporter call playwright browser_navigate url="http://localhost:5173"
mcporter call playwright browser_take_screenshot type=png filename="test.png"
mcporter call playwright browser_click ref="e52"  # Click by element ref
```

## Tauri Setup (Desktop Build)

Requires Rust. On your development machine:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Initialize Tauri in project
cargo tauri init

# Run desktop app
cargo tauri dev

# Build for release
cargo tauri build
```

## Steam Integration

When ready for Steam:

1. Create Steamworks account & app
2. Add `steamworks-rs` to Tauri dependencies
3. Implement achievements, cloud saves
4. Test with Steam client
5. Submit for review

See [Steamworks Documentation](https://partner.steamgames.com/doc/home)
