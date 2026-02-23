/**
 * Gameplay Integration Tests
 * 
 * Run with: npx playwright test tests/gameplay.spec.ts
 * Uses headed mode for canvas interactions.
 */

import { test, expect, Page } from '@playwright/test';

// Helper to click on canvas at relative position
async function clickCanvas(page: Page, xPercent: number, yPercent: number) {
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  await page.mouse.click(
    box.x + box.width * xPercent,
    box.y + box.height * yPercent
  );
}

test.describe('Gameplay Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('https://container-farm-game.vercel.app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('can start a new game and see apartment', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Studio/i })).toBeVisible();
    await expect(page.getByText('Day 1')).toBeVisible();
    await expect(page.getByText('$100')).toBeVisible();
  });

  test('can start Container Farm hobby', async ({ page }) => {
    // Click on hobby space
    await page.getByText('Hobby Space').click();
    
    // Select Container Farm
    await page.getByText('Container Farm').first().click();
    
    // Should be in the farm view
    await expect(page.getByText('🌱 Container Farm')).toBeVisible();
    await expect(page.getByRole('button', { name: 'grow' })).toBeVisible();
  });

  test('can buy a pot', async ({ page }) => {
    // Start farm
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    
    // Initial money
    await expect(page.getByText('$100')).toBeVisible();
    
    // Click on empty slot in canvas to buy pot
    await clickCanvas(page, 0.35, 0.65);
    
    // Money should decrease by $5
    await expect(page.getByText('$95')).toBeVisible();
  });

  test('can plant a seed', async ({ page }) => {
    // Start farm and buy pot
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    await clickCanvas(page, 0.35, 0.65);
    
    // Click pot again to open plant menu
    await clickCanvas(page, 0.35, 0.65);
    
    // Should see plant selection modal
    await expect(page.getByText('Plant a seed')).toBeVisible();
    
    // Select Basil
    await page.getByText('Basil').click();
    
    // Modal should close, plant should be growing
    await expect(page.getByText('Plant a seed')).not.toBeVisible();
  });

  test('plants grow over time', async ({ page }) => {
    // Start farm, buy pot, plant seed
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    await clickCanvas(page, 0.35, 0.65);
    await clickCanvas(page, 0.35, 0.65);
    await page.getByText('Basil').click();
    
    // Skip several days
    for (let i = 0; i < 7; i++) {
      await page.getByRole('button', { name: '+1 Day' }).click();
    }
    
    // Plant should be harvestable (Basil takes 7 days)
    // Check for "harvest!" text or harvestable indicator
    await expect(page.locator('text=harvest')).toBeVisible({ timeout: 5000 });
  });

  test('can harvest and sell plants', async ({ page }) => {
    // Start farm, buy pot, plant seed
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    await clickCanvas(page, 0.35, 0.65);
    await clickCanvas(page, 0.35, 0.65);
    await page.getByText('Basil').click();
    
    // Skip to maturity
    await page.getByRole('button', { name: '+1 Week' }).click();
    
    // Click harvestable plant
    await clickCanvas(page, 0.35, 0.65);
    
    // Go to harvest tab
    await page.getByRole('button', { name: 'harvest' }).click();
    
    // Should see harvested basil
    await expect(page.getByText(/Basil.*×/)).toBeVisible();
    
    // Sell it
    const sellButton = page.getByRole('button', { name: /💰.*\$/ });
    await sellButton.click();
    
    // Harvest should be gone, money increased
    await expect(page.getByText(/Basil.*×/)).not.toBeVisible();
  });

  test('rent is deducted weekly', async ({ page }) => {
    // Check initial money
    await expect(page.getByText('$100')).toBeVisible();
    
    // Skip a week
    await page.getByRole('button', { name: '+1 Week' }).click();
    
    // Rent ($50) should be deducted
    await expect(page.getByText('$50')).toBeVisible();
  });

  test('shop items can be purchased', async ({ page }) => {
    // Start farm
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    
    // Go to shop
    await page.getByRole('button', { name: 'shop' }).click();
    
    // Buy Mint seeds ($4)
    await page.getByRole('button', { name: '$4' }).first().click();
    
    // Money should decrease
    await expect(page.getByText('$96')).toBeVisible();
    
    // Should have Mint seeds now
    await expect(page.getByText(/Mint.*×1/)).toBeVisible();
  });
});

test.describe('Kitchen Storage', () => {
  test('can store harvest in kitchen', async ({ page }) => {
    // Setup: start farm, grow plant, harvest
    await page.getByText('Hobby Space').click();
    await page.getByText('Container Farm').first().click();
    await clickCanvas(page, 0.35, 0.65);
    await clickCanvas(page, 0.35, 0.65);
    await page.getByText('Basil').click();
    await page.getByRole('button', { name: '+1 Week' }).click();
    await clickCanvas(page, 0.35, 0.65);
    
    // Go to harvest tab
    await page.getByRole('button', { name: 'harvest' }).click();
    
    // Click Keep button instead of Sell
    await page.getByRole('button', { name: /🏠 Keep/ }).click();
    
    // Go back to apartment
    await page.getByRole('button', { name: '← Back' }).click();
    
    // Check kitchen
    await page.getByText('Kitchen').click();
    
    // Should see stored basil
    await expect(page.getByText(/Basil/)).toBeVisible();
  });
});
