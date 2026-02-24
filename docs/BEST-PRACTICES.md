# Best Practices

Lessons learned and patterns to follow in this codebase.

## React + Canvas/PixiJS

### Measuring DOM for Canvas Sizing

**Problem:** Canvas needs explicit pixel dimensions, but container size isn't known until after mount.

**Wrong approach:**
```tsx
// ❌ useEffect runs AFTER paint - causes visual "jump"
const [size, setSize] = useState({ width: 400, height: 200 }); // arbitrary default

useEffect(() => {
  const width = container.clientWidth;
  setSize({ width, height: width * 0.5 });
}, []);
```

**Correct approach:**
```tsx
// ✅ useLayoutEffect runs BEFORE paint - no flash
const [size, setSize] = useState<{ width: number; height: number } | null>(null);

useLayoutEffect(() => {
  const width = container.clientWidth;
  setSize({ width, height: width * 0.5 });
}, []);

// Don't render canvas until measured
return size && <Canvas width={size.width} height={size.height} />;
```

**Why:** `useLayoutEffect` runs synchronously after DOM mutations but before the browser paints. This prevents the "flash" of wrong dimensions.

**Also consider:**
- Reserve space with `minHeight` on container to prevent layout shift
- Use `ResizeObserver` for responsive resizing (can be in regular `useEffect` after initial measure)

### PixiJS Initialization

**Pattern:** Initialize PixiJS app once, resize/recreate scene on dimension changes.

```tsx
// Initialize app once
useEffect(() => {
  const app = new Application();
  await app.init({ width, height });
  appRef.current = app;
  return () => app.destroy();
}, []); // Empty deps - only on mount

// Handle resize separately
useEffect(() => {
  if (!appRef.current) return;
  appRef.current.renderer.resize(width, height);
  // Recreate scene with new dimensions
}, [width, height]);
```

**Why:** Creating/destroying the WebGL context is expensive. Resizing the renderer is cheap.

---

## State Management

### Single Source of Truth

**Problem:** Same data defined in multiple places gets out of sync.

**Example:** Rent was defined in:
- `INITIAL_ECONOMY.weeklyRent`
- `HOUSING_TIERS[].rentPerWeek`
- `getRentForWeek()` function

**Solution:** One authoritative source, everything else derives from it.

```tsx
// ✅ Housing tier is the source of truth
const rent = currentHousingTier.rentPerWeek;

// ❌ Don't duplicate
const WEEKLY_RENT = 50; // hardcoded elsewhere
```

---

## Testing

### Visual Regression

Use Chromatic/Storybook for canvas and layout components:
- Every visual component should have a story
- Snapshots catch unintended visual changes
- Viewport stories test responsive behavior

### Layout Shift Detection

Chrome DevTools → Performance → "Screenshots" checkbox → look for jumps in filmstrip.

Web Vitals: Check CLS (Cumulative Layout Shift) score.
