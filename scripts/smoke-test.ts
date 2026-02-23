/**
 * Post-deployment smoke test
 * Verifies the live site works without JS errors
 * 
 * Usage: npx tsx scripts/smoke-test.ts [url]
 * Default URL: https://container-farm-game.vercel.app
 */

import { chromium, ConsoleMessage } from '@playwright/test';

const BASE_URL = process.argv[2] || 'https://container-farm-game.vercel.app';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

async function runSmokeTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const consoleErrors: string[] = [];
  
  console.log(`\n🔥 Smoke testing: ${BASE_URL}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
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
    });
  } catch (e) {
    results.push({ name: 'Homepage loads', passed: false, error: String(e) });
  }
  
  // Test 2: Main UI elements present
  try {
    const header = await page.locator('h1, h2').first().textContent();
    const hasHeader = header !== null && header.length > 0;
    results.push({
      name: 'UI elements render',
      passed: hasHeader,
    });
  } catch (e) {
    results.push({ name: 'UI elements render', passed: false, error: String(e) });
  }
  
  // Test 3: Can navigate to hobby selector
  try {
    // Click on hobby space
    await page.getByText(/Hobby Space|Click to start/i).click();
    await page.waitForTimeout(500);
    const hasSelector = await page.getByText(/Container Farm|Mushroom/i).isVisible();
    results.push({
      name: 'Hobby selector works',
      passed: hasSelector,
    });
  } catch (e) {
    results.push({ name: 'Hobby selector works', passed: false, error: String(e) });
  }
  
  // Test 4: Can start Container Farm
  try {
    await page.getByText('Container Farm').click();
    await page.waitForTimeout(500);
    const inFarm = await page.getByText(/grow|harvest|shop/i).first().isVisible();
    results.push({
      name: 'Container Farm starts',
      passed: inFarm,
    });
  } catch (e) {
    results.push({ name: 'Container Farm starts', passed: false, error: String(e) });
  }
  
  // Test 5: Can navigate back and start Mushroom Farm
  try {
    await page.getByText('← Back').click();
    await page.waitForTimeout(300);
    await page.getByText(/Hobby Space|Click to start/i).click();
    await page.waitForTimeout(300);
    
    // Check if mushroom farm is available (not "Coming soon")
    const mushroomOption = page.getByText('Mushroom Farm');
    const isClickable = await mushroomOption.isEnabled();
    
    if (isClickable) {
      await mushroomOption.click();
      await page.waitForTimeout(500);
      const inMushroom = await page.getByText(/humidity|grow bags/i).isVisible();
      results.push({
        name: 'Mushroom Farm starts',
        passed: inMushroom,
      });
    } else {
      results.push({
        name: 'Mushroom Farm starts',
        passed: false,
        error: 'Mushroom Farm not yet implemented',
      });
    }
  } catch (e) {
    results.push({ name: 'Mushroom Farm starts', passed: false, error: String(e) });
  }
  
  // Test 6: No console errors (excluding WebGL)
  results.push({
    name: 'No JS errors',
    passed: consoleErrors.length === 0,
    error: consoleErrors.length > 0 ? consoleErrors.join('; ') : undefined,
  });
  
  await browser.close();
  
  return results;
}

async function main() {
  try {
    const results = await runSmokeTests();
    
    console.log('═══════════════════════════════════════════');
    console.log('  Smoke Test Results');
    console.log('═══════════════════════════════════════════\n');
    
    let allPassed = true;
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   └─ ${result.error}`);
      }
      if (!result.passed) allPassed = false;
    }
    
    console.log('\n═══════════════════════════════════════════');
    if (allPassed) {
      console.log('✅ All smoke tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some smoke tests failed');
      process.exit(1);
    }
  } catch (e) {
    console.error('Smoke test crashed:', e);
    process.exit(1);
  }
}

main();
