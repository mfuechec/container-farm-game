# Side Hustle Simulator — Game Design

> A cozy real-time idle game about turning hobbies into freedom.

*For technical implementation details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
*For balance values and tuning, see [BALANCE.md](./BALANCE.md).*

---

## The Fantasy

You're stuck in a dead-end day job. Your paycheck barely covers rent. But you have a little apartment, a windowsill, and a dream.

You start small — a few pots of basil, maybe some mushrooms growing in a closet. You sell at the farmers market on weekends. You eat better because you grow your own herbs. Slowly, you build something.

The goal isn't to become a farming mogul. It's **escape velocity** — the moment your side hustles earn enough that you can quit your job and live on your own terms.

---

## Core Experience

### The Feeling

**Cozy productivity.** The game runs in real time in a browser tab or desktop window. Check in, make decisions, harvest, sell, plant — then let it run. Come back later. See what grew.

It's the satisfaction of:
- Watching seedlings become harvestable plants
- Discovering that certain herbs give you combo bonuses together
- Finally affording that bigger apartment
- Realizing you haven't needed to buy groceries in weeks

### The Rhythm

| Frequency | Player Action |
|-----------|---------------|
| Every few minutes | Quick check — anything ready? |
| Once an hour | Harvest, replant, maybe sell |
| Once a day | Check finances, plan upgrades |
| Once a week | Housing decisions, big purchases |

The game respects your time. No punishment for being away. Just gentle progress.

### Time Scale

Real time maps to game time: **1 real hour = 1 game day**. Leave for a day, return to a month of growth.

---

## Progression

### The Arc

**Early Game:** Learn the ropes
- One hobby (container herbs)
- Barely breaking even
- Discover your first combo
- Save for a second hobby slot

**Mid Game:** Build momentum
- Multiple hobbies that synergize
- Bigger apartment
- Market days = real income
- Kitchen full of fresh ingredients

**Late Game:** Make the leap
- Multiple revenue streams
- Considering quitting the day job
- Can you survive without the safety net?

### Upgrade Paths

**Vertical:** Make existing hobbies better
- Better equipment (lights, tables, environmental controls)
- More variety (new plant types, mushroom strains)
- Higher quality harvests

**Horizontal:** Add new hobbies
- Unlock hobby slots through housing upgrades
- Each hobby has unique mechanics
- Hobbies synergize with each other

---

## Hobbies

### 🌱 Container Farm (Herbs)

The starter hobby. Grow herbs on a table with pots and lights.

**The Loop:** Buy seeds → Plant → Wait → Harvest → Use/Sell/Store

**What makes it interesting:**
- Different herbs with different growth times and values
- Equipment upgrades unlock more capacity
- Combo bonuses reward smart choices
- Multiple paths: eat them, sell them, or store them

### 🍄 Mushroom Farm

Faster cycles, different mechanics. Grow gourmet mushrooms in grow bags.

**The Loop:** Buy spawn → Inoculate bags → Maintain humidity → Harvest

**What makes it different:**
- Environment matters (humidity, temperature)
- Multiple harvests per bag until exhausted
- Faster than plants, but needs attention
- Different customer base

### 🔮 Future Hobbies

| Hobby | Fantasy | What's Different |
|-------|---------|------------------|
| Shrimp Tank | Aquaculture | Long cycle, ecosystem management |
| Candle Making | Artisan crafts | Use herbs for scents, creative combos |
| Woodworking | Handmade goods | Custom orders, reputation |
| Coffee Roasting | Specialty food | Timing-based skill challenge |

---

## Systems

### Synergies

Hobbies create byproducts that help other hobbies:

- **Herb scraps → Compost → Mushroom boost**
- **Spent substrate → Fertilizer → Plant boost**

This rewards diversification. Running multiple hobbies is better than specializing.

### Combos

Strategic choices unlock bonus effects:

**Kitchen Combos** (storing items together):
- *Italian Herbs* 🇮🇹 — Basil + Parsley → Better grocery savings
- *Full Pantry* 🏆 — Many herb types → Bonus to everything

**Garden Combos** (growing plants together):
- *Companion Planting* 🤝 — Certain pairs → Faster growth
- *Herb Garden* 🌿 — Variety → Better yields

Discovering combos feels like finding secrets. A toast pops up when you unlock one.

### The Kitchen

Your kitchen is where hobbies become lifestyle:

- **Pantry:** Store ingredients from hobbies + bought staples
- **Daily Meals:** Game auto-generates dinner from what's available
- **Grocery Savings:** Home-grown herbs = lower food bills
- **Variety Bonus:** Diverse ingredients = better meals

The kitchen makes your hobbies matter beyond money. You're actually living better.

### The Market

Farmers market days let you sell at premium prices:

- **Wholesale:** Sell anytime for quick cash (lower prices)
- **Market Day:** Premium prices, but only when it's open
- **Stall Rentals:** Pay for more frequent market access

Creates anticipation: "Will my harvest be ready before market day?"

---

## Housing

Your apartment is your constraint and your goal:

| Tier | Vibe | What it unlocks |
|------|------|-----------------|
| Studio | Cramped, but hopeful | 2 hobbies |
| Small Apt | Breathing room | 3 hobbies |
| 1BR | Feels like home | 4 hobbies |
| 2BR | Room for ambition | 6 hobbies |
| House | Living the dream | 10+ hobbies |

**Moving up:** Pay deposit, get more space, more potential.

**Moving down:** Sometimes necessary. Choose which hobbies to keep.

---

## Economy

### The Balance

You start barely breaking even:
- Day job covers most expenses
- Hobbies provide the margin to get ahead
- Growing your own food reduces costs
- Selling at market generates income

### Failure

If you hit $0:
- Soft reset (not game over)
- Downgrade to starter apartment
- Keep one hobby of your choice
- Keep all knowledge and unlocks

Failure is a setback, not an ending.

---

## Tone & Aesthetics

### Visual Style
- Clean, minimal UI
- Soft colors, rounded corners
- Top-down apartment blueprint view
- Cute but not cartoonish

### Audio
- Subtle clicks for interactions
- Satisfying sounds for harvests and sales
- No spam, no annoying alerts

### Voice
- Short, warm, slightly witty
- Celebrates small wins
- Gentle with setbacks
- No corporate speak

---

## What This Game Isn't

- **Not a farming sim** — You're in an apartment, not on a farm
- **Not a clicker** — Time passes whether you click or not
- **Not stressful** — Failure is recoverable
- **Not pay-to-win** — No microtransactions, no energy timers
- **Not endless** — There's a goal (quitting your job)

---

## Open Questions

1. **After quitting the job:** What's the endgame? Prestige? New challenges?

2. **Social elements:** NPCs? Neighbors? Trading with friends?

3. **Seasons:** Holiday events? Seasonal crops? Special markets?

4. **Story:** Light narrative beats? Or pure sandbox?

---

## Success Criteria

The game is working when players:
- Check in throughout the day (without feeling forced)
- Feel satisfied by small progress
- Experiment with combos and synergies
- Care about their little apartment
- Feel proud when they finally quit the day job
