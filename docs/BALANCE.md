# Side Hustle Simulator — Balance Guide

> Tuning values for economy, progression, and game feel.

*For game design context, see [GAME_DESIGN.md](./GAME_DESIGN.md).*
*For implementation details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*

---

## Current Values

### Starting State

| Item | Value | Monthly Equivalent |
|------|-------|-------------------|
| Starting Money | $500 | — |
| Weekly Income (Day Job) | $750 | $3,000 |
| Weekly Rent | $375 | $1,500 |
| Weekly Groceries | $250 | $1,000 |
| **Net Weekly (before hobbies)** | **+$125** | **$500** |

Player starts with a small buffer and marginal savings from their day job alone.

### Housing Tiers

| Tier | Name | Hobby Slots | Weekly Rent | Deposit | Unlock |
|------|------|-------------|-------------|---------|--------|
| 1 | Studio | 2 | $188 | $750 | Start |
| 2 | Small Apt | 3 | $250 | $1,000 | $2k savings |
| 3 | 1BR Apt | 4 | $375 | $1,500 | $5k savings |
| 4 | 2BR Apt | 6 | $500 | $2,000 | $10k savings |

*Note: Current implementation uses flat $375/week rent. Housing-based rent not yet implemented.*

---

## Plant Economics

### Herb Types

| Plant | Growth (days) | Yield | Sell Price | Revenue | Seed Cost | Profit | $/Day |
|-------|---------------|-------|------------|---------|-----------|--------|-------|
| Basil | 7 | 2 | $4 | $8 | $3 | $5 | $0.71 |
| Mint | 5 | 3 | $3 | $9 | $2 | $7 | $1.40 |
| Parsley | 10 | 2 | $5 | $10 | $4 | $6 | $0.60 |
| Cilantro | 6 | 2 | $4 | $8 | $3 | $5 | $0.83 |
| Chives | 8 | 4 | $2 | $8 | $3 | $5 | $0.63 |

**Best $/day:** Mint (fast cycle, good yield)
**Best total profit:** Mint ($7 per harvest)

### Equipment Costs

| Item | Cost | Effect |
|------|------|--------|
| Basic Pot | $10 | Unlocks 1 grow slot |
| Clamp Light | $25 | +20% growth speed (1 pot) |
| LED Panel | $75 | +40% growth speed (4 pots) |
| Large Table | $50 | Unlocks 2 additional pot slots |

### Wholesale vs Market

| Channel | Multiplier | Availability |
|---------|------------|--------------|
| Wholesale | 0.6x | Always |
| Farmers Market | 1.5-2.0x | Market days only |

---

## Mushroom Economics

### Mushroom Types

| Mushroom | Growth (days) | Yield (oz) | Sell Price | Flushes |
|----------|---------------|------------|------------|---------|
| Oyster | 3 | 4 | $3/oz | 3 |
| Lion's Mane | 5 | 3 | $6/oz | 2 |
| Shiitake | 7 | 5 | $4/oz | 2 |

### Equipment Costs

| Item | Cost | Effect |
|------|------|--------|
| Grow Bag | $8 | 1 mushroom slot |
| Spray Bottle | Free | Basic humidity |
| Humidifier | $40 | +15% growth speed |
| Fruiting Chamber | $100 | Optimal environment |

---

## Market System

### Rental Tiers

| Tier | Cost | Frequency | Weekly Cost |
|------|------|-----------|-------------|
| Weekly | $50 | Every 7 days | $50 |
| Bi-weekly | $70 | Every 14 days | $35 |
| Monthly | $100 | Every 28 days | $25 |

**Strategy:** Monthly rental is most efficient, but requires holding harvest longer.

---

## Kitchen & Grocery Savings

### Herb Storage Value

Each herb stored in kitchen reduces weekly grocery bill:

| Herb | Grocery Savings/unit |
|------|---------------------|
| Basil | $2 |
| Mint | $2 |
| Parsley | $2 |
| Cilantro | $2 |
| Chives | $1.50 |

### Combo Bonuses

| Combo | Trigger | Bonus |
|-------|---------|-------|
| Italian Herbs 🇮🇹 | Basil + Parsley in kitchen | +50% savings (those items) |
| Fresh Duo ✨ | Mint + Cilantro in kitchen | +30% freshness |
| Kitchen Staples 👨‍🍳 | 3+ herb types | +20% savings (all) |
| Full Pantry 🏆 | 5+ herb types | +25% savings (all) |

---

## Synergy Bonuses

### Cross-Hobby Effects

| Source | Target | Bonus | Cap | Decay |
|--------|--------|-------|-----|-------|
| Plant harvest | Mushroom growth | +5% per harvest | 30% | 7 days |
| Mushroom harvest | Plant yield | +3% per oz | 25% | 7 days |

---

## Progression Targets

### Early Game (Week 1-2)

| Milestone | Target | How |
|-----------|--------|-----|
| First harvest | Day 5-7 | Plant mint (fastest) |
| Second pot | Day 7 | $10 from savings |
| First light upgrade | Week 2 | $25 from harvests |

### Mid Game (Week 3-6)

| Milestone | Target | How |
|-----------|--------|-----|
| Full starter table | Week 3 | All pot slots filled |
| Market stall rental | Week 4 | $50-100 for first rental |
| Second hobby (mushrooms) | Week 4-5 | Housing upgrade or efficient savings |
| Kitchen combos active | Week 5 | Strategic herb storage |

### Late Game (Week 7+)

| Milestone | Target | How |
|-----------|--------|-----|
| Synergies active | Week 7+ | Both hobbies producing |
| Housing upgrade | Week 8-10 | $2k+ savings |
| Quit job viable | Week 12+ | Passive income > expenses |

---

## Balance Philosophy

### Core Tensions

1. **Sell vs Store:** Selling makes money now. Storing saves money over time.
2. **Upgrade vs Save:** Equipment costs money but increases earning potential.
3. **Specialize vs Diversify:** Focus on one hobby or spread across many?
4. **Wholesale vs Market:** Quick cash or wait for market day?

### Feel Targets

- **Early game:** Tight. Every decision matters. Bankruptcy is possible but avoidable.
- **Mid game:** Breathing room. Upgrade decisions feel meaningful.
- **Late game:** Comfortable. Focus shifts from survival to optimization.

### Red Flags

- ❌ Player can't survive Week 1 with reasonable play
- ❌ Optimal strategy is to never buy upgrades
- ❌ One hobby strictly dominates all others
- ❌ Market is always better than wholesale (or vice versa)
- ❌ Synergies are ignorable

---

## Testing

### Simulation Script

```bash
npx tsx scripts/simulate-balance.ts
```

### Manual Testing

1. Fresh save, play through Week 1-4
2. Verify solvency without perfect play
3. Verify upgrades feel achievable
4. Test both "sell everything" and "store everything" strategies
5. Confirm both strategies are viable but different

---

## Changelog

### 2025-02-25
- Updated to reflect current implementation
- Documented housing tiers, market system, synergies
- Added combo bonuses section
- Aligned with GAME_DESIGN.md and ARCHITECTURE.md

### 2025-02-22
- Initial balance pass
- Grace period removed (simplified to flat rent)
- Starting money increased to $500
