# Improve Build & Verification Process

> Reduce reliance on manual testing by catching errors automatically.

**Priority:** High (prevents bugs like the harvest flow issue)
**Effort:** ~1-2 hours

---

## Current State

| Check | Pre-commit | CI | Notes |
|-------|------------|-----|-------|
| TypeScript | ✅ | ❌ | Only runs locally |
| Unit Tests | ❌ | ❌ | 293 tests exist but don't run automatically |
| E2E Tests | ❌ | ❌ | Only tab-switch, not core flows |
| Visual Regression | ❌ | ✅ | Chromatic runs on push |

**Problem:** Logic errors slip through because tests don't run in CI or pre-commit.

---

## Recommendations

### 1. Add CI Workflow for Tests

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - run: npm ci
      
      - name: TypeCheck
        run: npm run typecheck
      
      - name: Unit Tests
        run: npx vitest run --reporter=verbose
      
      - name: E2E Tests
        run: npx playwright test
```

### 2. Add Tests to Pre-commit

Update `.husky/pre-commit`:

```bash
#!/bin/sh
npm run typecheck
npx vitest run --reporter=dot
```

**Note:** Use `--reporter=dot` for speed. Full output in CI.

### 3. Add Integration Tests for Store Actions

Create `tests/store/gameStore.test.ts`:

```typescript
describe('gameStore', () => {
  describe('harvest flow', () => {
    it('stores plant harvest in kitchen storage', () => {
      // Plant → Harvest → Store → verify kitchen.storage has item
    });
    
    it('stores mushroom harvest in kitchen storage', () => {
      // Same for mushrooms
    });
  });
  
  describe('cooking flow', () => {
    it('cooks meal when ingredients available', () => {
      // Add ingredients → call cookDailyMeal → verify meal logged
    });
    
    it('falls back to takeout when no ingredients', () => {
      // Empty storage → cookDailyMeal → verify takeout logged
    });
    
    it('discovers recipes when ingredients present', () => {
      // Add basil + olive oil → cookDailyMeal → verify herb_oil discovered
    });
  });
  
  describe('economy integration', () => {
    it('applies meal savings to weekly grocery bill', () => {
      // Cook meals → trigger rent → verify grocery savings applied
    });
  });
});
```

### 4. Add E2E Test for Core Loop

Create `e2e/core-loop.spec.ts`:

```typescript
test('plant to meal flow', async ({ page }) => {
  // 1. Start game
  // 2. Plant a seed
  // 3. Skip time until harvestable
  // 4. Harvest
  // 5. Store in kitchen
  // 6. Skip to next day
  // 7. Verify meal was cooked (not takeout)
});
```

### 5. Add Test Coverage Reporting (Optional)

Update `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'tests', '**/*.stories.tsx'],
    },
  },
});
```

---

## Implementation Order

1. **CI workflow** — immediate value, catches errors on PR
2. **Pre-commit tests** — fast feedback loop
3. **Store integration tests** — catches wiring errors like harvest flow
4. **E2E core loop** — catches full-stack regressions

---

## Success Criteria

After implementation:
- [ ] `git push` triggers typecheck + unit tests + E2E
- [ ] PRs can't merge with failing tests
- [ ] Pre-commit rejects broken code locally
- [ ] Harvest→Cook flow has automated test coverage

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `.github/workflows/test.yml` | CREATE |
| `.husky/pre-commit` | MODIFY — add vitest |
| `tests/store/gameStore.test.ts` | CREATE |
| `e2e/core-loop.spec.ts` | CREATE |
| `vitest.config.ts` | MODIFY — add coverage (optional) |
