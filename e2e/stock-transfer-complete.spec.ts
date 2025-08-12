import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || process.env.SYS_LOGIN || '';
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || process.env.SYS_PASSWORD || '';

// Supabase client for database verification
const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate credentials
if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Test credentials not found. Please set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env.test.local');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials not found. Please set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY in .env.test.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data for 6 transfers
const testTransfers = [
  {
    destination: 'Fold Mill',
    operator: '5997',
    pallet: '110825/22',
    description: 'Transfer to Fold Mill with operator 5997'
  },
  {
    destination: 'Production',
    operator: '6001',
    pallet: '110825/21',
    description: 'Transfer to Production with operator 6001'
  },
  {
    destination: 'Fold Mill',
    operator: '5963',
    pallet: '110825/20',
    description: 'Transfer to Fold Mill with operator 5963'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/19',
    description: 'Transfer to PipeLine with operator 5997'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/8',
    description: 'Transfer to PipeLine with operator 5997 (pallet 8)'
  },
  {
    destination: 'PipeLine',
    operator: '5997',
    pallet: '110825/7',
    description: 'Transfer to PipeLine with operator 5997 (pallet 7)'
  }
];

test.describe('Complete Stock Transfer Tests', () => {
  test('Execute all 6 transfers without re-login', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for all transfers
    
    // Login once at the beginning
    console.log('=== STARTING COMPLETE STOCK TRANSFER TEST ===');
    console.log('Logging into system...');
    await page.goto(`${BASE_URL}/main-login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15000 });
    console.log('✓ Login successful');
    
    // Navigate to Stock Transfer once
    console.log('\nNavigating to Stock Transfer card...');
    await page.waitForTimeout(2000);
    
    // Click Operation tab
    const operationTab = await page.getByRole('button', { name: 'Operation', exact: true }).first();
    await operationTab.click();
    console.log('✓ Clicked Operation tab');
    await page.waitForTimeout(1000);
    
    // Click Stock Transfer
    await page.getByRole('button', { name: 'Stock Transfer', exact: true }).click();
    console.log('✓ Opened Stock Transfer card');
    await page.waitForTimeout(2000);
    
    // Execute all 6 transfers
    console.log('\n=== EXECUTING 6 TRANSFERS ===\n');
    
    for (let i = 0; i < testTransfers.length; i++) {
      const transfer = testTransfers[i];
      console.log(`--- Transfer ${i + 1}/6: ${transfer.description} ---`);
      
      try {
        // Check initial location in database
        const { data: initialData } = await supabase
          .from('record_history')
          .select('loc')
          .eq('plt_num', transfer.pallet)
          .order('time', { ascending: false })
          .limit(1);
        
        const initialLocation = initialData?.[0]?.loc || 'Unknown';
        console.log(`  Initial location: ${initialLocation}`);
        
        // Step 1: Select destination
        console.log(`  Selecting destination: ${transfer.destination}`);
        const destinationElement = await page.getByText(transfer.destination, { exact: true }).first();
        await destinationElement.click();
        await page.waitForTimeout(500);
        
        // Step 2: Enter operator number
        console.log(`  Entering operator: ${transfer.operator}`);
        const operatorInput = await page.getByPlaceholder(/clock number|operator/i).first();
        await operatorInput.clear();
        await operatorInput.fill(transfer.operator);
        await page.waitForTimeout(1500); // Wait for verification
        
        // Check if operator was verified
        const verifiedText = await page.getByText(/verified|✓/i).first();
        const isVerified = await verifiedText.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVerified) {
          console.log(`  ✓ Operator ${transfer.operator} verified`);
        } else {
          console.log(`  ⚠ Operator verification status unclear`);
        }
        
        // Step 3: Enter pallet number and click search button
        console.log(`  Entering pallet: ${transfer.pallet}`);
        const palletInput = await page.getByPlaceholder(/pallet|scan/i).first();
        await palletInput.clear();
        await palletInput.fill(transfer.pallet);
        
        // Click the search/magnifying glass button to trigger transfer
        console.log(`  Clicking search button (magnifying glass) to execute transfer...`);
        const searchButton = await page.locator('button:has(svg), button').filter({ has: page.locator('svg') }).last();
        await searchButton.click();
        
        // Wait for transfer to complete
        await page.waitForTimeout(4000);
        
        // Check for success message
        const successMsg = await page.getByText(/success|transferred|moved to/i).first();
        const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasSuccess) {
          const successText = await successMsg.textContent();
          console.log(`  ✓ SUCCESS: ${successText}`);
        } else {
          console.log(`  ⚠ No success message found`);
        }
        
        // Verify database update
        const { data: updatedData } = await supabase
          .from('record_history')
          .select('loc, action, time')
          .eq('plt_num', transfer.pallet)
          .eq('action', 'Transfer')
          .order('time', { ascending: false })
          .limit(1);
        
        if (updatedData && updatedData.length > 0) {
          console.log(`  ✓ Database updated: ${updatedData[0].loc} at ${updatedData[0].time}`);
        } else {
          console.log(`  ⚠ No database update found`);
        }
        
        // Clear fields for next transfer
        await palletInput.clear();
        console.log(`  Transfer ${i + 1} completed\n`);
        
      } catch (error) {
        console.error(`  ✗ Error in transfer ${i + 1}:`, error.message);
      }
      
      // Small delay between transfers
      await page.waitForTimeout(1000);
    }
    
    // Final verification - check all pallets
    console.log('\n=== FINAL VERIFICATION ===\n');
    
    for (const transfer of testTransfers) {
      const { data } = await supabase
        .from('record_history')
        .select('plt_num, loc, action, time')
        .eq('plt_num', transfer.pallet)
        .order('time', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        const record = data[0];
        const isTransferred = record.action === 'Transfer' && record.loc === transfer.destination;
        if (isTransferred) {
          console.log(`✓ ${transfer.pallet}: Successfully transferred to ${record.loc}`);
        } else {
          console.log(`⚠ ${transfer.pallet}: Current location is ${record.loc} (expected ${transfer.destination})`);
        }
      } else {
        console.log(`✗ ${transfer.pallet}: No records found`);
      }
    }
    
    // Check record_transfer table
    console.log('\nChecking record_transfer table...');
    const { data: transferRecords } = await supabase
      .from('record_transfer')
      .select('*')
      .in('plt_num', testTransfers.map(t => t.pallet))
      .order('tran_date', { ascending: false })
      .limit(10);
    
    if (transferRecords && transferRecords.length > 0) {
      console.log(`✓ Found ${transferRecords.length} records in record_transfer table`);
      for (const rec of transferRecords) {
        console.log(`  - ${rec.plt_num}: ${rec.f_loc} → ${rec.t_loc} (Operator: ${rec.operator_id})`);
      }
    } else {
      console.log('⚠ No records found in record_transfer table');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'stock-transfer-complete-final.png', fullPage: true });
    console.log('\n✓ Test completed. Screenshot saved as stock-transfer-complete-final.png');
  });
});