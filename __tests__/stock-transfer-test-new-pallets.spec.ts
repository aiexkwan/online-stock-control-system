import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration from environment variables
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || process.env.SYS_LOGIN || '';
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || process.env.SYS_PASSWORD || '';

// Supabase client for database verification
const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate required environment variables
if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Test credentials not found. Please set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env.test.local');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials not found. Please set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY in .env.test.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Updated test data with new pallet numbers
const testTransfers = [
  {
    destination: 'Fold Mill',
    operator: '5997',
    pallet: '110825/22',  // Keep first one as it worked
    description: 'Transfer to Fold Mill with operator 5997'
  },
  {
    destination: 'Production',
    operator: '6001',
    pallet: '110825/18',  // Changed from /21 to /18
    description: 'Transfer to Production with operator 6001'
  },
  {
    destination: 'Fold Mill',
    operator: '5963',
    pallet: '110825/17',  // Changed from /20 to /17
    description: 'Transfer to Fold Mill with operator 5963'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/16',  // Changed from /19 to /16
    description: 'Transfer to PipeLine with operator 5997'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/6',   // Changed from /8 to /6
    description: 'Transfer to PipeLine with operator 5997 (pallet 6)'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/5',   // Changed from /7 to /5
    description: 'Transfer to PipeLine with operator 5997 (pallet 5)'
  }
];

test.describe('Stock Transfer Tests - Bug Investigation', () => {
  test('Test transfers with error tracking', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes
    
    // Login
    console.log('=== STOCK TRANSFER BUG INVESTIGATION TEST ===');
    console.log('Testing for "Invalid Transfer" error despite successful transfers\n');
    
    console.log('Logging into system...');
    await page.goto(`${BASE_URL}/main-login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15000 });
    console.log('✓ Login successful\n');
    
    // Navigate to Stock Transfer
    console.log('Navigating to Stock Transfer...');
    await page.waitForTimeout(2000);
    
    const operationTab = await page.getByRole('button', { name: 'Operation', exact: true }).first();
    await operationTab.click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: 'Stock Transfer', exact: true }).click();
    console.log('✓ Stock Transfer card opened\n');
    await page.waitForTimeout(2000);
    
    // Execute transfers
    console.log('=== EXECUTING TRANSFERS WITH ERROR TRACKING ===\n');
    
    let errorCount = 0;
    let successCount = 0;
    
    for (let i = 0; i < testTransfers.length; i++) {
      const transfer = testTransfers[i];
      console.log(`--- Transfer ${i + 1}/6: ${transfer.description} ---`);
      
      try {
        // Check initial location
        const { data: initialData } = await supabase
          .from('record_history')
          .select('loc')
          .eq('plt_num', transfer.pallet)
          .order('time', { ascending: false })
          .limit(1);
        
        const initialLocation = initialData?.[0]?.loc || 'Unknown';
        console.log(`  Initial location: ${initialLocation}`);
        
        // Select destination
        console.log(`  Selecting: ${transfer.destination}`);
        const destinationElement = await page.getByText(transfer.destination, { exact: true }).first();
        await destinationElement.click();
        await page.waitForTimeout(500);
        
        // Enter operator
        console.log(`  Operator: ${transfer.operator}`);
        const operatorInput = await page.getByPlaceholder(/clock number|operator/i).first();
        await operatorInput.clear();
        await operatorInput.fill(transfer.operator);
        await page.waitForTimeout(1500);
        
        // Enter pallet and search
        console.log(`  Pallet: ${transfer.pallet}`);
        const palletInput = await page.getByPlaceholder(/pallet|scan/i).first();
        await palletInput.clear();
        await palletInput.fill(transfer.pallet);
        await page.waitForTimeout(500);
        
        // Click search button
        const searchButton = await page.getByRole('button').filter({ has: page.locator('svg') }).last();
        await searchButton.click();
        console.log('  Searching...');
        
        // Wait and check for error overlay
        await page.waitForTimeout(3000);
        
        // Check for error overlay
        const errorOverlay = await page.locator('text="Invalid Transfer"').first();
        const hasError = await errorOverlay.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (hasError) {
          console.log('  ⚠️ ERROR OVERLAY DETECTED: "Invalid Transfer"');
          errorCount++;
          
          // Get error details
          const errorDetails = await page.locator('text=/Details:.*|already at location|Voided/').first();
          if (await errorDetails.isVisible({ timeout: 500 }).catch(() => false)) {
            const details = await errorDetails.textContent();
            console.log(`  Error details: ${details}`);
          }
          
          // Click confirm to close error
          const confirmButton = await page.locator('button:has-text("Confirm")').first();
          if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await confirmButton.click();
            console.log('  Closed error overlay');
          }
        }
        
        // Check database regardless of UI error
        const { data: updatedData } = await supabase
          .from('record_history')
          .select('loc, action')
          .eq('plt_num', transfer.pallet)
          .order('time', { ascending: false })
          .limit(1);
        
        if (updatedData && updatedData.length > 0) {
          const latest = updatedData[0];
          if (latest.loc === transfer.destination && latest.action === 'Stock Transfer') {
            console.log(`  ✅ DATABASE: Transfer successful to ${latest.loc}`);
            successCount++;
          } else {
            console.log(`  ❌ DATABASE: Still at ${latest.loc}`);
          }
        }
        
        // Clear input for next transfer
        await palletInput.clear();
        console.log('');
        
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log(`Successful transfers in database: ${successCount}/${testTransfers.length}`);
    console.log(`Error overlays shown: ${errorCount}/${testTransfers.length}`);
    
    if (errorCount > 0 && successCount > 0) {
      console.log('\n🐛 BUG CONFIRMED: Successful transfers are showing "Invalid Transfer" errors');
      console.log('This indicates a frontend validation issue or incorrect error handling.');
    }
    
    // Final database check
    console.log('\n=== FINAL DATABASE VERIFICATION ===');
    for (const transfer of testTransfers) {
      const { data } = await supabase
        .from('record_history')
        .select('plt_num, loc, action')
        .eq('plt_num', transfer.pallet)
        .order('time', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        const record = data[0];
        const status = record.loc === transfer.destination ? '✓' : '✗';
        console.log(`${status} ${transfer.pallet}: ${record.loc} (Expected: ${transfer.destination})`);
      }
    }
    
    await page.screenshot({ path: 'bug-investigation-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved as bug-investigation-screenshot.png');
  });
});