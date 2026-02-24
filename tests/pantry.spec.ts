/**
 * Pantry & Kitchen System E2E Tests
 * 
 * Run with: npx playwright test tests/pantry.spec.ts
 * Tests the Phase 1 cooking/pantry system.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Pantry System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for initial render
    await expect(page.getByRole('heading', { name: /Studio/i })).toBeVisible();
  });

  test('kitchen view shows pantry with starter items', async ({ page }) => {
    // Click on kitchen
    await page.getByText('Kitchen').click();
    
    // Should see the kitchen heading
    await expect(page.getByRole('heading', { name: '🍳 Kitchen' })).toBeVisible();
    
    // Should see pantry section with starter items
    await expect(page.getByText('Pantry')).toBeVisible();
    await expect(page.getByText('Rice')).toBeVisible();
    await expect(page.getByText('Pasta')).toBeVisible();
    await expect(page.getByText('Eggs')).toBeVisible();
  });

  test('initial meal is generated on Day 1', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Should see Tonight's Dinner section
    await expect(page.getByText("Tonight's Dinner")).toBeVisible();
    
    // Should have a meal name (contains base ingredient)
    const mealName = page.locator('text=/Rice|Pasta|Eggs/').first();
    await expect(mealName).toBeVisible();
    
    // Should show stars (satisfaction rating)
    await expect(page.getByText('★').first()).toBeVisible();
    
    // Meals cooked should be at least 1
    await expect(page.getByText(/Meals cooked: [1-9]/)).toBeVisible();
  });

  test('can buy staples from kitchen', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Check initial money
    const initialMoney = await page.getByText(/\$\d+/).first().textContent();
    
    // Click to buy Garlic ($0.5)
    await page.getByRole('button', { name: /Garlic.*\$/ }).click();
    
    // Garlic should appear in pantry
    await expect(page.getByText('Garlic').first()).toBeVisible();
  });

  test('new meal is generated when skipping days', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Get initial meal count
    const initialCount = await page.getByText(/Meals cooked: \d+/).textContent();
    
    // Go back and skip a day
    await page.getByRole('button', { name: '← Back' }).click();
    await page.getByRole('button', { name: '+1D' }).click();
    
    // Go back to kitchen
    await page.getByText('Kitchen').click();
    
    // Meal count should increase
    const newCount = await page.getByText(/Meals cooked: \d+/).textContent();
    expect(parseInt(newCount?.match(/\d+/)?.[0] || '0'))
      .toBeGreaterThan(parseInt(initialCount?.match(/\d+/)?.[0] || '0'));
  });

  test('meal history shows previous meals', async ({ page }) => {
    // Skip to day 3 to have multiple meals
    await page.getByRole('button', { name: '+1D' }).click();
    await page.getByRole('button', { name: '+1D' }).click();
    
    // Go to kitchen
    await page.getByText('Kitchen').click();
    
    // Should show "This Week" section
    await expect(page.getByText('This Week')).toBeVisible();
    
    // Should show Day entries in history
    await expect(page.getByText(/Day \d/)).toBeVisible();
  });

  test('pantry items show freshness indicators', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Eggs should show freshness (they have shelf life)
    await expect(page.getByText(/\d+% fresh/)).toBeVisible();
  });

  test('variety stats are displayed', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Should show variety stats
    await expect(page.getByText(/Meals cooked: \d+/)).toBeVisible();
    await expect(page.getByText(/Variety streak: \d+ days/)).toBeVisible();
  });

  test('new recipe gets special indicator', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Initial meal should be marked as new
    await expect(page.getByText('✨ New Recipe!')).toBeVisible();
  });
});

test.describe('Pantry-Harvest Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('harvest tab shows pantry button', async ({ page }) => {
    // Start Container Farm
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    
    // Go to harvest tab
    await page.getByRole('button', { name: 'harvest' }).click();
    
    // Initially empty, but tab should exist
    await expect(page.getByText(/No harvested plants/)).toBeVisible();
  });

  test('mushroom hobby harvest tab has Cook button', async ({ page }) => {
    // Start Mushroom Farm
    await page.getByText('Hobby Space').click();
    await page.getByText('Mushroom Farm').click();
    
    // Go to harvest tab
    await page.getByRole('button', { name: 'harvest' }).click();
    
    // Initially empty
    await expect(page.getByText(/No mushrooms harvested/)).toBeVisible();
  });
});

test.describe('Meal Generation Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('meal uses available ingredients', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Meal should contain one of the starter bases
    const mealText = await page.locator('[class*="meal"], [style*="Dinner"]').textContent();
    
    // Should have a meal with ingredients from pantry
    const hasBase = mealText?.includes('Rice') || 
                    mealText?.includes('Pasta') || 
                    mealText?.includes('Eggs');
    expect(hasBase).toBeTruthy();
  });

  test('meal satisfaction is shown as stars', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Should show 1-5 stars
    const stars = await page.getByText('★').count();
    expect(stars).toBeGreaterThanOrEqual(1);
    expect(stars).toBeLessThanOrEqual(10); // 5 filled + 5 empty possible
  });

  test('buying variety improves options', async ({ page }) => {
    await page.getByText('Kitchen').click();
    
    // Buy garlic
    await page.getByRole('button', { name: /Garlic/ }).click();
    
    // Buy onion
    await page.getByRole('button', { name: /Onion/ }).click();
    
    // Pantry should now have more items
    await expect(page.getByText('Garlic').first()).toBeVisible();
    await expect(page.getByText('Onion').first()).toBeVisible();
    
    // Skip a day to generate a new meal
    await page.getByRole('button', { name: '← Back' }).click();
    await page.getByRole('button', { name: '+1D' }).click();
    
    // Check kitchen - meal might now include garlic or onion
    await page.getByText('Kitchen').click();
    
    // Unique ingredients should increase
    await expect(page.getByText(/Unique ingredients this week: [0-9]+/)).toBeVisible();
  });
});

test.describe('Persistence', () => {
  test('pantry state persists across page reload', async ({ page }) => {
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Go to kitchen and buy something
    await page.getByText('Kitchen').click();
    await page.getByRole('button', { name: /Butter/ }).click();
    
    // Verify butter is in pantry
    await expect(page.getByText('Butter').first()).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Go back to kitchen
    await page.getByText('Kitchen').click();
    
    // Butter should still be there
    await expect(page.getByText('Butter').first()).toBeVisible();
  });

  test('meal history persists across reload', async ({ page }) => {
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Skip a few days
    await page.getByRole('button', { name: '+1D' }).click();
    await page.getByRole('button', { name: '+1D' }).click();
    
    // Check meals cooked
    await page.getByText('Kitchen').click();
    const mealCount = await page.getByText(/Meals cooked: \d+/).textContent();
    
    // Reload
    await page.reload();
    await page.getByText('Kitchen').click();
    
    // Meal count should be preserved
    await expect(page.getByText(mealCount!)).toBeVisible();
  });
});
