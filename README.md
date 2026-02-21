# Container Farm 🌱

A container herb farming simulation game built as a single React component. Breed plants, optimize genetics, manage your shelf, and sell at the weekly farmers market.

## Play

Drop `container-farm.jsx` into any React environment that supports JSX artifacts (e.g. Claude.ai artifacts, or wrap it in a basic React app).

The game is a single self-contained component with zero dependencies beyond React.

## Gameplay

You run a small container herb farm. Each week, the farmers market opens and you can sell your harvest.

**Core loop:** Plant seeds → tune environment → harvest → sell or dry → breed the best → repeat.

### Mechanics

- **6 genetic traits** per plant: Flavor, Growth Speed, Yield, Hardiness, Appearance, Shelf Life
- **4 environment controls**: Light, Temperature, Nutrients, Water — each creates tradeoffs across traits
- **Graph-based simulation engine**: 17 edges define all trait-environment interactions with 7 evaluator types
- **Breeding**: Cross mature plants to produce seeds that inherit and recombine parent genetics
- **Tools**: Buy lab equipment to reveal hidden trait values with increasing precision
- **Freshness decay**: Harvested herbs lose value over time on the shelf
- **Herb drying**: Convert fresh herbs to dried (no decay, 40% value) to stockpile between markets
- **Reputation system**: Your market sell rate (30%–100%) depends on reputation built through consistent selling
- **Contracts**: Clients request specific trait thresholds for bonus payouts

### Keybinds

| Key | Action |
|-----|--------|
| `H` | Harvest all mature plants |
| `B` | Toggle breed mark on selected plant |
| `Shift+B` | Start breeding |
| `S` | Collect seeds from selected plant |

### Emergent Strategies

- **Flavor farming**: Mild nutrient/water stress concentrates flavor (accepts yield penalty)
- **Speed farming**: All variables at 50 — reliable but boring
- **Stress testing**: Harsh conditions to identify hardy breeders
- **Appearance optimization**: Careful light/water control, but high-appearance genetics are more fragile

## Architecture

The simulation runs on a **graph-based engine** where nodes represent environment variables and traits, and edges define influence relationships:

```
nutrients ──[stress_penalty]──→ yield
water ──[threshold_bonus]──→ flavorIntensity
temperature ──[genetic_shield]──→ hardiness
...17 edges total
```

Each edge has an evaluator type (e.g. `stress_penalty`, `threshold_bonus`, `low_stress_bonus`) with parameters that control sensitivity, thresholds, and genetic modulation. See [DESIGN.md](DESIGN.md) for the full specification.

## Files

| File | Description |
|------|-------------|
| `container-farm.jsx` | The game — single React component, ~1100 lines |
| `tests.js` | 142 tests covering graph engine, evaluators, genetics, economy |
| `DESIGN.md` | System design document — authoritative spec for all simulation mechanics |

## Tests

The test suite runs standalone with Node:

```bash
node tests.js
```

142 tests covering: graph structure validation, evaluator unit tests, genetic sensitivity, strategy verification, breeding, freshness, market pricing, and full integration cycles.

## Built With

- React (single component, no build step needed)
- Deterministic seeded PRNG for reproducible simulation
- Zero external dependencies

## License

MIT
