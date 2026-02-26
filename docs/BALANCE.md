# Side Hustle Simulator — Balance Guide

> Design rationale, feel targets, and analysis for tuning the game economy.

**Source of truth for all numbers: [`src/balance.ts`](../src/balance.ts)**
Do not hardcode balance values in game systems or tests — import from `balance.ts`.

*For game design context, see [GAME_DESIGN.md](./GAME_DESIGN.md).*
*For implementation details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*

---

## Weekly Budget

| Item | Value | Monthly |
|------|-------|---------|
| Day Job Income | $750 | $3,000 |
| Rent (Studio) | $375 | $1,500 |
| Groceries | $250 | $1,000 |
| **Net (before hobbies)** | **$125** | **$500** |

The player's margin is thin by design — $125/week surplus means every purchase feels significant in early game, and hobbies are the only path to meaningful income growth.

---

## Housing

3 tiers: Studio (1 hobby slot), 1BR (2 slots), 2BR (3 slots).

Rent scales faster than hobby income initially, creating genuine tension around upgrades. Moving up requires confidence that the extra slot will pay for itself.

| Tier | Rent/wk | Deposit (2x rent) | Extra weekly cost vs Studio |
|------|---------|--------------------|-----------------------------|
| Studio | $375 | $750 | — |
| 1BR | $500 | $1,000 | +$125 |
| 2BR | $700 | $1,400 | +$325 |

Upgrading to 1BR doubles the player's expenses above groceries ($125 surplus becomes $0 net from day job alone). This forces reliance on hobby income — which is exactly the intended pressure.

---

## Plant Economics

Each herb has a distinct niche. No single plant should dominate both selling and kitchen strategies.

| Plant | Days | Yield | Sell | Seed | Profit | $/Day | Niche |
|-------|------|-------|------|------|--------|-------|-------|
| Basil | 7 | 2 | $28 | $22 | $34 | $4.86 | All-rounder, combo enabler |
| Mint | 5 | 2 | $20 | $15 | $25 | $5.00 | Fast cycle, short shelf life (4d) |
| Parsley | 10 | 2 | $40 | $30 | $50 | $5.00 | Slow but highest value, best grocery savings |
| Cilantro | 6 | 2 | $30 | $25 | $35 | $5.83 | Best raw $/day, but wilts fast (4d) |
| Chives | 8 | 4 | $15 | $20 | $40 | $5.00 | Bulk yield, 14d shelf life — storage play |

**$/day range: $4.86 - $5.83** (compressed spread is intentional — no herb should be strictly dominant)

### Grocery Savings (per harvest cycle)

Storing herbs in the kitchen reduces weekly groceries. This is the "store vs sell" tension.

| Plant | Grocery Value/unit | Savings/cycle | Savings $/day |
|-------|-------------------|---------------|---------------|
| Basil | $15 | $30 | $4.29 |
| Mint | $8 | $16 | $3.20 |
| Parsley | $22 | $44 | $4.40 |
| Cilantro | $15 | $30 | $5.00 |
| Chives | $10 | $40 | $5.00 |

**Key tradeoff:** Selling cilantro earns $5.83/day; storing it saves $5.00/day. The sell-vs-store decision is close enough to matter. Mint is the clearest "sell don't store" herb; parsley is the clearest "store don't sell" herb.

---

## Mushroom Economics

Mushrooms offer a second income stream with different mechanics (humidity/temperature management, flushes, difficulty tiers).

| Mushroom | Days | Yield (oz) | Sell/oz | Spawn | Profit | $/Day | Difficulty |
|----------|------|-----------|---------|-------|--------|-------|------------|
| Oyster | 3 | 4 | $8 | $8 | $24 | $8.00 | Easy |
| Shiitake | 4 | 3 | $12 | $12 | $24 | $6.00 | Medium |
| Lion's Mane | 5 | 2 | $18 | $15 | $21 | $4.20 | Hard |

Mushrooms are higher $/day than plants but require equipment investment and active management (humidity/temp). Lion's Mane has the lowest $/day but highest sell price per oz — it rewards market timing and premium channels.

---

## Equipment Progression

### Plant Equipment

**Tables** (pot capacity): Small Desk (4 free) -> Potting Bench (8, $150) -> Grow Shelf (12, $350) -> Grow Tent (16, $600)

**Lights** (growth speed): Desk Lamp (free, 1.0x) -> Clip Light ($75, 1.2x) -> LED Panel ($200, 1.5x) -> LED Array ($450, 1.8x)

**Pots**: Basic ($25, baseline) -> Self-Watering ($75, 1.1x growth) -> Large Planter ($100, 0.9x growth but 1.3x yield)

Large Planter is an intentional tradeoff — slower growth for more yield. Not a strict upgrade.

### Mushroom Equipment

**Grow Bags**: Basic ($5) -> Filter Bag ($10, +10% humidity) -> Monotub ($35, 3 capacity, +20% humidity)

**Tools**: Spray Bottle (free) -> Humidifier ($30, +15 humidity) -> Dark Tent ($50, +10 humidity, -5 temp) -> FAE Fan ($25, fresh air)

---

## Market System

| Rental | Cost | Frequency | Weekly Cost |
|--------|------|-----------|-------------|
| Weekly | $50 | 7 days | $50/wk |
| Bi-weekly | $70 | 14 days | $35/wk |
| Monthly | $100 | 28 days | $25/wk |

Monthly is most cost-efficient but requires holding inventory longer (freshness decay risk). Weekly is safest but most expensive.

Wholesale multiplier: 0.6x (always available).
Market multiplier: 1.5x (market days only).

---

## Combos

### Kitchen Combos

| Combo | Required | Bonus | Scope |
|-------|----------|-------|-------|
| Italian Herbs | Basil + Parsley | +50% grocery savings | Those items |
| Fresh Duo | Mint + Cilantro | +30% freshness | Those items |
| Kitchen Staples | 3+ herb types | +20% grocery savings | All items |
| Full Pantry | All 5 herbs | +25% grocery savings | All items |

### Garden Combos

| Combo | Required | Bonus | Scope |
|-------|----------|-------|-------|
| Companion Planting | Basil + Parsley | +15% growth | Those items |
| Garden Friends | Mint + Chives | +10% growth | Those items |
| Herb Garden | 4+ herb types | +1 yield bonus | All items |

Combos reward diversification. A monoculture of the "best" herb will always underperform a combo-enabled mixed garden.

---

## Synergies

Cross-hobby bonuses that reward running both plants and mushrooms:

| Source | Target | Rate | Cap | Decay |
|--------|--------|------|-----|-------|
| Plant harvest -> Compost | Mushroom growth | +5% per harvest | 30% | 7 days |
| Mushroom harvest -> Substrate | Plant yield | +3% per oz | 25% | 7 days |

Synergies decay linearly over 7 days, encouraging consistent production in both hobbies rather than binge-harvesting.

---

## Balance Philosophy

### Core Tensions

1. **Sell vs Store** — Selling earns cash now. Storing reduces weekly groceries. Neither should always win.
2. **Upgrade vs Save** — Equipment costs real money but increases earning capacity. Overinvesting leaves you broke.
3. **Specialize vs Diversify** — Monoculture is simpler but combo bonuses reward variety.
4. **Wholesale vs Market** — Guaranteed income vs premium prices on market days.
5. **Fast vs Slow herbs** — Quick cycles (mint, cilantro) give flexibility; slow herbs (parsley, chives) give better value.

### Feel Targets

- **Week 1-2:** Tight. Every purchase is weighed carefully. First harvest feels like a breakthrough.
- **Week 3-4:** First upgrade decisions. Player starts seeing the hobby ecosystem take shape.
- **Week 5-8:** Breathing room. Multiple income streams active. Upgrade paths feel meaningful.
- **Week 8+:** Focus shifts from survival to optimization. Housing upgrade becomes viable.
- **Week 12+:** "Quit the day job" territory — hobby income exceeds day job necessity.

### Red Flags to Watch For

- Player can't survive Week 1 with reasonable play
- Optimal strategy is to never buy upgrades
- One herb/mushroom strictly dominates all others
- Market is always better than wholesale (or vice versa)
- Synergies are ignorable (bonus too small) or mandatory (bonus too large)
- Housing upgrade always/never makes economic sense

---

## Testing

Run the full test suite to verify balance changes don't break game logic:

```bash
npx vitest run --config vitest.config.ts
```

Tests import from `src/balance.ts` so updated values are automatically tested.

### Manual Playtesting Checklist

1. Fresh save, play Week 1-4 — verify solvency without perfect play
2. Try "sell everything" strategy — should work but feel suboptimal
3. Try "store everything" strategy — should save money but feel cash-poor
4. Verify first equipment upgrade is achievable by Week 2
5. Verify housing upgrade requires meaningful savings (~Week 8+)

---

## Changelog

### 2025-02-25 — Balance Refactor
- Created `src/balance.ts` as single source of truth
- All game systems now import from balance.ts (no hardcoded values)
- **Mint nerf:** yield 3->2, sellPrice 25->20, groceryValue 10->8, freshDays 5->4, seedCost 20->15
- **Basil adjustment:** sellPrice 30->28, seedCost 25->22
- **Parsley buff:** groceryValue 20->22
- Compressed herb $/day spread from $0.60-$1.40 to $4.86-$5.83
- Updated all tests to use balance constants instead of hardcoded values

### 2025-02-25 — Initial Documentation
- Documented housing tiers, market system, synergies
- Added combo bonuses section
- Aligned with GAME_DESIGN.md and ARCHITECTURE.md

### 2025-02-22
- Initial balance pass
- Grace period removed (simplified to flat rent)
- Starting money set to $500
