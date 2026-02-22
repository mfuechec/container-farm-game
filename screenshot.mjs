import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

console.log('Navigating to site...');
await page.goto('https://container-farm-game.vercel.app');
await page.waitForTimeout(2000);

// Try clicking hobby space to start plant hobby
const hobbySpace = page.locator('text=Hobby Space');
if (await hobbySpace.isVisible()) {
  console.log('Clicking Hobby Space...');
  await hobbySpace.click();
  await page.waitForTimeout(1500);
}

await page.screenshot({ path: 'screenshot-grow.png', fullPage: true });
console.log('Screenshot saved to screenshot-grow.png');

await browser.close();
