import { firefox } from 'playwright';

(async () => {
  const browser = await firefox.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto('https://container-farm-game.vercel.app');
  await page.waitForTimeout(2000);

  // Click on Hobby Space to start the plant hobby
  const hobbySpace = page.locator('text=Hobby Space');
  if (await hobbySpace.isVisible()) {
    await hobbySpace.click();
    await page.waitForTimeout(1000);
  }

  // Take screenshot
  await page.screenshot({ path: 'screenshot-grow.png', fullPage: true });
  console.log('Screenshot saved to screenshot-grow.png');

  await browser.close();
})();
