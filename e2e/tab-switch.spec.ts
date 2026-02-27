import { test, expect } from '@playwright/test';

/**
 * Seed game state into localStorage so we start with:
 * - Plant hobby active in slot 0
 * - Potting bench table (8 slots)
 * - View set to hobby-plants
 */
function seedGameState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const state = {
      state: {
        apartment: {
          housing: {
            id: 1,
            name: 'Studio',
            hobbySlots: 1,
            rentPerWeek: 375,
            emoji: '\u{1F3E0}',
            hasKitchen: true,
            description: 'Cozy studio apartment. One hobby space.',
            mapPosition: { x: 25, y: 70 },
          },
          hobbySlots: [{ index: 0, hobby: 'plants' }],
          securityDeposit: 100,
        },
        economy: { money: 500, totalEarned: 0, totalSpent: 0 },
        plantHobby: {
          table: {
            id: 'potting_bench',
            name: 'Potting Bench',
            emoji: '\u{1FAB5}',
            width: 4,
            height: 2,
            description: 'Dedicated workspace. Serious growing potential.',
            potSlots: 8,
            seedStorage: 20,
            cost: 150,
          },
          light: {
            id: 'desk_lamp',
            name: 'Desk Lamp',
            emoji: '\u{1F4A1}',
            description: 'Basic lamp. Covers a couple pots.',
            coverage: 2,
            growthBoost: 1.0,
            cost: 0,
          },
          pots: [],
          plants: {},
          seeds: { basil: 3 },
          harvest: [],
        },
        view: 'hobby-plants',
        selectedSlot: 0,
        gameDay: 1,
        lastTick: Date.now(),
        gameStartTime: Date.now(),
        lastRentPaid: Date.now(),
      },
      version: 0,
    };
    localStorage.setItem('side-hustle-game', JSON.stringify(state));
  });
}

test('tab switch preserves single canvas and correct width', async ({ page }) => {
  // Seed state and load the app
  await page.goto('/');
  await seedGameState(page);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // We should now be in hobby-plants view with grow tab active
  // Wait for the canvas to appear (PixiJS init)
  await page.waitForSelector('canvas', { timeout: 10000 });

  // Verify: exactly 1 canvas on the grow tab
  const canvasCountBefore = await page.locator('canvas').count();
  expect(canvasCountBefore).toBe(1);

  // Switch to shop tab
  const shopTab = page.getByRole('button', { name: /shop/i });
  await shopTab.click();
  await page.waitForTimeout(500);

  // Verify: canvas is gone on shop tab
  const canvasCountShop = await page.locator('canvas').count();
  expect(canvasCountShop).toBe(0);

  // Switch back to grow tab
  const growTab = page.getByRole('button', { name: /grow/i });
  await growTab.click();

  // Wait for PixiJS to reinitialize the canvas
  await page.waitForSelector('canvas', { timeout: 10000 });

  // Assert: exactly 1 canvas (no duplicates from race condition)
  const canvasCountAfter = await page.locator('canvas').count();
  expect(canvasCountAfter).toBe(1);

  // Assert: canvas container width > 400px (not collapsed to 280px minimum)
  const containerWidth = await page.locator('canvas').first().evaluate((el) => {
    const container = el.parentElement;
    return container ? container.clientWidth : 0;
  });
  expect(containerWidth).toBeGreaterThan(400);
});
