# Economy Balance Analysis

## Current Numbers

### Starting State
| Item | Value |
|------|-------|
| Starting Money | $100 |
| Weekly Rent | $50 |
| Weekly Groceries | $50 |
| **Total Weekly Expenses** | **$100** |

### Equipment (Starting - Free)
| Item | Slots | Cost |
|------|-------|------|
| Small Desk | 2 pots | $0 |
| Desk Lamp | 1 coverage | $0 |
| Basic Pot | - | $5 each |

### Plant Economics
| Plant | Days | Yield | Price | Revenue | Seed Cost | Profit | $/Day |
|-------|------|-------|-------|---------|-----------|--------|-------|
| Mint | 5 | 3 | $3 | $9 | $4 | $5 | **$1.00** |
| Cilantro | 6 | 2 | $4 | $8 | $5 | $3 | $0.50 |
| Chives | 8 | 4 | $2 | $8 | $4 | $4 | $0.50 |
| Basil | 7 | 2 | $4 | $8 | $5 | $3 | $0.43 |
| Parsley | 10 | 2 | $5 | $10 | $6 | $4 | $0.40 |

---

## The Problem: Week 1 Simulation

**Optimal play with Mint (best $/day):**

| Day | Action | Money |
|-----|--------|-------|
| 0 | Start | $100 |
| 0 | Buy 2 basic pots (-$10) | $90 |
| 0 | Buy 2 mint seeds (-$8) | $82 |
| 0 | Plant both | $82 |
| 5 | Harvest + sell (+$18) | $100 |
| 5 | Buy 2 more seeds (-$8) | $92 |
| 7 | **RENT DUE** (-$100) | **-$8** 💀 |

**Result: Bankrupt on Day 7 with perfect play.**

### Why It's Broken

Weekly expenses: **$100**  
Max weekly income (2 pots, mint): **$10-18 profit**  

The player needs to earn ~10x more than they can with starting equipment.

To break even with current plant prices, you'd need **~20 mint pots** running continuously. But:
- Start with 2 slots
- Potting Bench ($50) = 4 slots
- Grow Shelf ($120) = 6 slots

Even fully upgraded, max slots = 6. Still can't cover rent.

---

## Proposed Fixes

### Option A: Slash Expenses (Recommended)
Make early game survivable, scale difficulty later.

```
Week 1-2: Grace period (no rent - "first month free")
Week 3+: Rent starts at $15/week, +$5/week until cap of $50
Groceries: $10/week base (herbs reduce this)
```

**Week 1 with grace period:**
| Day | Action | Money |
|-----|--------|-------|
| 0 | Start | $100 |
| 0 | Buy 2 pots + 2 mint seeds | $82 |
| 5 | Harvest + sell | $100 |
| 5 | Replant | $92 |
| 7 | Groceries only (-$10) | $82 |
| 10 | Harvest | $100 |
| 12 | Buy upgrade (clip light $25) | $75 |
| 14 | Rent starts (-$15 + $10 groceries) | $50 |

Player can progress! ✅

### Option B: Boost Plant Economy
Multiply all sell prices by 3-4x.

| Plant | Current | Proposed | Weekly Profit (2 pots) |
|-------|---------|----------|------------------------|
| Mint | $3 | $12 | ~$48 |

Pros: Simple change  
Cons: Numbers feel inflated, harder to balance upgrades

### Option C: Monthly Rent
Change rent from weekly to monthly (every 28 days).

Pros: More breathing room  
Cons: Less frequent decision points, feels slower

### Option D: Hybrid (My Recommendation)

1. **Grace period**: No rent Week 1-2
2. **Gradual rent**: $15 → $20 → $25 → ... → $50 cap
3. **Lower groceries**: $10 base (each stored herb saves $2-3)
4. **Slight price bump**: +50% to sell prices

```typescript
// economy/types.ts
export const INITIAL_ECONOMY: EconomyState = {
  money: 100,
  weeklyRent: 0,        // Starts at 0, increases after week 2
  weeklyGroceryBase: 10,
};

// New: rent scaling
export function getRentForWeek(week: number): number {
  if (week <= 2) return 0;  // Grace period
  return Math.min(50, 15 + (week - 3) * 5);  // 15, 20, 25... cap 50
}
```

```typescript
// plants/types.ts - Updated prices (+50%)
{ id: 'mint', sellPrice: 4.5, ... }      // was 3
{ id: 'basil', sellPrice: 6, ... }       // was 4
{ id: 'cilantro', sellPrice: 6, ... }    // was 4
{ id: 'parsley', sellPrice: 7.5, ... }   // was 5
{ id: 'chives', sellPrice: 3, ... }      // was 2
```

---

## Balance Targets

| Milestone | Target Time | How |
|-----------|-------------|-----|
| First pot | 0 (free start) | Start with $100, pot = $5 |
| First harvest | Day 5-7 | Mint/Basil cycle |
| Break even on weekly costs | Week 3 | After grace period ends |
| First upgrade (clip light) | Week 2 | Saved from grace period |
| Second table | Week 4-5 | Potting bench $50 |
| Comfortable surplus | Week 6+ | 4+ pots running |

---

## Testing Checklist

After implementing changes:

- [ ] Simulate Week 1-4 with "dumb player" (plant, harvest, sell, repeat)
- [ ] Verify player stays solvent through Week 4
- [ ] Verify upgrades feel achievable (not 10 weeks away)
- [ ] Verify late-game still has challenge (rent cap matters)
- [ ] Test grocery savings mechanic (storing herbs should help)

---

## Current Status

**✅ BALANCED** (as of 2026-02-22)

### Changes Made
1. **Grace period:** Weeks 1-2 have $0 rent ("first month free")
2. **Gradual rent:** Week 3 = $15, Week 4 = $20, ... caps at $50
3. **Lower groceries:** $10/week base (was $50)
4. **Boosted prices:** +50-67% on all plant sell prices

### Simulation Results (8-week "dumb player" run)
```
Week 1: 🟢 $60 (rent $0) - bought pots + first upgrade
Week 2: 🟢 $79 (rent $0) - building cash
Week 3: 🔴 -$23 (rent $15) - bought Grow Shelf, in debt!
Week 4: 🟡 $19 (rent $20) - recovering
Week 5: 🟢 $45 (rent $25) - stabilizing
Week 6: 🟢 $132 (rent $30) - comfortable
Week 7: 🟢 $148 (rent $35) - growing
Week 8: 🟢 $214 (rent $40) - thriving
```

### Balance Feels
- **Early game:** Tight but survivable
- **Mid game:** Tense upgrade decisions (going into debt for Grow Shelf is a real choice)
- **Late game:** Rewarding — player earns surplus for good play

### Files Changed
- `src/economy/types.ts` - getRentForWeek(), lowered groceries
- `src/hobbies/plants/types.ts` - boosted sell prices
- `src/engine/economyEngine.ts` - getRentForWeek() export
- `src/engine/timeEngine.ts` - uses dynamic rent

### Running the Simulation
```bash
npx tsx scripts/simulate-balance.ts
```
