# Cleanup: Remove Old Pantry System

> The new recipe-based kitchen system replaces the old pantry/meal system. This task removes the deprecated code.

**Priority:** Medium (not blocking, but creates confusion)
**Effort:** ~30 min

---

## Background

The kitchen system was implemented alongside the existing pantry system instead of replacing it. Now we have two parallel meal systems:

| System | Location | Status |
|--------|----------|--------|
| Old Pantry | `src/engine/pantryEngine.ts` | **DEPRECATED** — remove |
| New Kitchen | `src/engine/kitchenEngine.ts` | Active |

---

## Files to Modify/Delete

### Delete
- `src/engine/pantryEngine.ts`

### Modify

**`src/store/gameStore.ts`:**
- Remove `pantry: PantryState` from GameState
- Remove `todaysMeal: Meal` from GameState  
- Remove `lastMealDay: number` from GameState
- Remove `INITIAL_PANTRY` import and usage
- Remove `processDailyMeal()` action
- Remove `addToPantry()` action
- Remove `buyStaple()` action (old version — keep `buyKitchenStaple`)
- Remove `storePlantHarvestInPantry()` action
- Remove `storeMushroomHarvestInPantry()` action
- Remove `processDailyMeal()` calls from `tick()` and time skip
- Clean up imports

**`src/kitchen/PantryView.tsx`:**
- Remove old pantry UI (top section)
- Rename "Recipe Kitchen" section to just be the main content
- Remove `PantryState`, `Meal`, `INGREDIENTS`, `STAPLE_IDS` imports
- Remove props: `pantry`, `todaysMeal`, `onBuyStaple`
- Simplify to only use `kitchen` state

**`src/kitchen/pantryStore.ts`:**
- Delete if only used by old system, OR
- Keep if used elsewhere (check imports first)

---

## Testing

After removal:
1. Fresh game starts without errors
2. Harvesting plants → store in kitchen works
3. Daily meals cook via recipe system
4. Weekly economy applies meal savings correctly
5. Variety bonus displays and applies

---

## Notes

- Existing saves may have `pantry` state — Zustand should ignore unknown keys, but verify
- The old `INGREDIENTS` constant had different items than new `STAPLES` — no migration needed since they're independent
