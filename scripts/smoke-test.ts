/**
 * Post-deployment smoke test
 * Verifies the live site works without JS errors
 * Tests at both desktop (1280px) and mobile (375px) viewports
 * 
 * Usage: npx tsx scripts/smoke-test.ts [url]
 * Default URL: https://container-farm-game.vercel.app
 */

import { chromium, ConsoleMessage, BrowserContext, Page } from '@playwright/test';

const BASE_URL = process.argv[2] || 'https://container-farm-game.vercel.app';

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },  // iPhone SE
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  viewport?: 'desktop' | 'mobile';
}

async function runTestsForViewport(
  context: BrowserContext,
  viewport: 'desktop' | 'mobile'
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const consoleErrors: string[] = [];
  
  const page = await context.newPage();
  await page.setViewportSize(VIEWPORTS[viewport]);
  
  // Collect console errors
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !msg.text().includes('WebGL')) {
      consoleErrors.push(msg.text());
    }
  });
  
  // Test 1: Homepage loads
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const title = await page.title();
    results.push({
      name: 'Homepage loads',
      passed: title.includes('Side Hustle'),
      viewport,
    });
  } catch (e) {
    results.push({ name: 'Homepage loads', passed: false, error: String(e), viewport });
  }
  
  // Test 2: Main UI elements present
  try {
    const header = await page.locator('h1, h2').first().textContent();
    const hasHeader = header !== null && header.length > 0;
    results.push({
      name: 'UI elements render',
      passed: hasHeader,
      viewport,
    });
  } catch (e) {
    results.push({ name: 'UI elements render', passed: false, error: String(e), viewport });
  }
  
  // Test 3: No horizontal overflow (mobile-specific)
  if (viewport === 'mobile') {
    try {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = VIEWPORTS.mobile.width;
      const noOverflow = bodyWidth <= viewportWidth;
      results.push({
        name: 'No horizontal overflow',
        passed: noOverflow,
        error: noOverflow ? undefined : `Body width ${bodyWidth}px exceeds viewport ${viewportWidth}px`,
        viewport,
      });
    } catch (e) {
      results.push({ name: 'No horizontal overflow', passed: false, error: String(e), viewport });
    }
  }
  
  // Test 4: Can navigate to hobby selector
  try {
    await page.getByText(/Hobby Space|Click to start/i).click();
    await page.waitForTimeout(500);
    const hasSelector = await page.getByText(/Container Farm|Mushroom/i).isVisible();
    results.push({
      name: 'Hobby selector works',
      passed: hasSelector,
      viewport,
    });
  } catch (e) {
    results.push({ name: 'Hobby selector works', passed: false, error: String(e), viewport });
  }
  
  // Test 5: Can start Container Farm
  try {
    await page.getByText('Container Farm').click();
    await page.waitForTimeout(500);
    const inFarm = await page.getByText(/grow|harvest|shop/i).first().isVisible();
    results.push({
      name: 'Container Farm starts',
      passed: inFarm,
      viewport,
    });
  } catch (e) {
    results.push({ name: 'Container Farm starts', passed: false, error: String(e), viewport });
  }
  
  // Test 6: Canvas renders at correct size (mobile check)
  if (viewport === 'mobile') {
    try {
      const canvas = page.locator('canvas').first();
      const isVisible = await canvas.isVisible();
      if (isVisible) {
        const box = await canvas.boundingBox();
        const fitsViewport = box ? box.width <= VIEWPORTS.mobile.width : false;
        results.push({
          name: 'Canvas fits mobile viewport',
          passed: fitsViewport,
          error: fitsViewport ? undefined : `Canvas width ${box?.width}px exceeds viewport`,
          viewport,
        });
      } else {
        results.push({
          name: 'Canvas fits mobile viewport',
          passed: true,  // No canvas visible = not applicable
          viewport,
        });
      }
    } catch (e) {
      results.push({ name: 'Canvas fits mobile viewport', passed: false, error: String(e), viewport });
    }
  }
  
  // Test 7: No console errors (excluding WebGL)
  results.push({
    name: 'No JS errors',
    passed: consoleErrors.length === 0,
    error: consoleErrors.length > 0 ? consoleErrors.join('; ') : undefined,
    viewport,
  });
  
  await page.close();
  
  return results;
}

async function runSmokeTests(): Promise<{ desktop: TestResult[]; mobile: TestResult[] }> {
  console.log(`\n🔥 Smoke testing: ${BASE_URL}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Run desktop tests
  console.log('📺 Testing desktop viewport (1280px)...');
  const desktopResults = await runTestsForViewport(context, 'desktop');
  
  // Run mobile tests
  console.log('📱 Testing mobile viewport (375px)...');
  const mobileResults = await runTestsForViewport(context, 'mobile');
  
  await browser.close();
  
  return { desktop: desktopResults, mobile: mobileResults };
}

function printResults(label: string, results: TestResult[]): boolean {
  console.log(`\n  ${label}`);
  console.log('  ' + '─'.repeat(40));
  
  let allPassed = true;
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}`);
    if (result.error) {
      console.log(`     └─ ${result.error}`);
    }
    if (!result.passed) allPassed = false;
  }
  
  return allPassed;
}

async function main() {
  try {
    const { desktop, mobile } = await runSmokeTests();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('  Smoke Test Results');
    console.log('═══════════════════════════════════════════');
    
    const desktopPassed = printResults('📺 Desktop (1280px)', desktop);
    const mobilePassed = printResults('📱 Mobile (375px)', mobile);
    
    console.log('\n═══════════════════════════════════════════');
    
    if (desktopPassed && mobilePassed) {
      console.log('✅ All smoke tests passed!');
      process.exit(0);
    } else {
      if (!desktopPassed) console.log('❌ Desktop tests failed');
      if (!mobilePassed) console.log('❌ Mobile tests failed');
      process.exit(1);
    }
  } catch (e) {
    console.error('Smoke test crashed:', e);
    process.exit(1);
  }
}

main();
