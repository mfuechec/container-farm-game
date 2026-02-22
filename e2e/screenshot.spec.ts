import { test } from '@playwright/test';

test('capture grow area', async ({ page }) => {
  await page.goto('https://container-farm-game.vercel.app');
  await page.waitForTimeout(2000);
  
  // Try clicking hobby space to start plant hobby
  const hobbySpace = page.locator('text=Hobby Space');
  if (await hobbySpace.isVisible()) {
    await hobbySpace.click();
    await page.waitForTimeout(1500);
  }
  
  await page.screenshot({ path: 'screenshot-grow.png', fullPage: true });
  console.log('Screenshot saved');
});
