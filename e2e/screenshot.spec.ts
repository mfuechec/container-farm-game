import { test } from '@playwright/test';

test('capture grow area', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Try clicking hobby space to start plant hobby
  const hobbySpace = page.getByText('Hobby Space', { exact: true });
  if (await hobbySpace.isVisible()) {
    await hobbySpace.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: 'screenshot-grow.png', fullPage: true });
  console.log('Screenshot saved');
});
