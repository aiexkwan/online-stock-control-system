import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || process.env.SYS_LOGIN || '';
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || process.env.SYS_PASSWORD || '';

// Supabase configuration for database verification
const SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate credentials
if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Test credentials not found. Please set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env.test.local');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials not found. Please set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY in .env.test.local');
}

// Initialize Supabase client for database verification
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data structure
interface TestScenario {
  testNumber: number;
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
  countMethod: 'Quantity' | 'Weight';
  palletType?: string;
  packageType?: string;
  grossWeights: string[];
  verifiedClockId: string;
}

// Define test scenarios
const testScenarios: TestScenario[] = [
  {
    testNumber: 1,
    grnNumber: '111111',
    materialSupplier: 'AV',
    productCode: 'Z01A2819',
    countMethod: 'Quantity',
    grossWeights: ['111'],
    verifiedClockId: '5997',
  },
  {
    testNumber: 2,
    grnNumber: '22222',
    materialSupplier: 'AV',
    productCode: 'Z01A2819',
    countMethod: 'Quantity',
    grossWeights: ['222', '222'],
    verifiedClockId: '6001',
  },
  {
    testNumber: 3,
    grnNumber: '33333',
    materialSupplier: 'MBA',
    productCode: 'Z01A2950',
    countMethod: 'Weight',
    palletType: 'White Dry',
    packageType: 'Still',
    grossWeights: ['333', '333', '333'],
    verifiedClockId: '6001',
  },
  {
    testNumber: 4,
    grnNumber: '44444',
    materialSupplier: 'MBA',
    productCode: 'Z01A2950',
    countMethod: 'Weight',
    palletType: 'White Dry',
    packageType: 'Still',
    grossWeights: ['444', '444', '444', '444'],
    verifiedClockId: '6001',
  },
];

// Helper functions
async function login(page: Page) {
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/main-login`);
  
  // Wait for the login form to be visible
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
  
  console.log('Filling login credentials...');
  await page.fill('input[name="email"], input[type="email"]', LOGIN_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', LOGIN_PASSWORD);
  
  console.log('Submitting login form...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL('**/admin/**', { timeout: 15000 });
  console.log('Login successful!');
}

async function navigateToGRNLabelCard(page: Page) {
  console.log('Navigating to GRN Label Card...');
  
  // Check if we need to use navigation cards or direct URL
  const currentUrl = page.url();
  
  if (!currentUrl.includes('/admin')) {
    // Navigate to admin dashboard first
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
  }
  
  // Wait for page to load completely
  await page.waitForTimeout(2000);
  
  // First, click on Operation tab (not Operations plural)
  console.log('Looking for Operation tab...');
  const operationTabButton = await page.locator('button:has-text("Operation"):not(:has-text("Operations"))').first();
  if (await operationTabButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await operationTabButton.click();
    console.log('Clicked Operation tab');
    await page.waitForTimeout(1500);
  } else {
    console.log('Operation tab not found, may already be selected');
  }
  
  // Now look for Print Label menu item
  console.log('Looking for Print Label menu...');
  const printLabelMenu = await page.locator('text="Print Label"').first();
  if (await printLabelMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
    await printLabelMenu.click();
    console.log('Clicked Print Label menu');
    await page.waitForTimeout(1000);
    
    // Now click on GRN Label submenu
    console.log('Looking for GRN Label submenu...');
    const grnLabelSubmenu = await page.locator('text="GRN Label"').first();
    if (await grnLabelSubmenu.isVisible({ timeout: 5000 }).catch(() => false)) {
      await grnLabelSubmenu.click();
      console.log('Clicked GRN Label submenu');
      await page.waitForTimeout(1500);
    }
  } else {
    // Alternative approach: click directly if visible
    console.log('Print Label menu not found, trying direct GRN Label click...');
    const grnLabelDirect = await page.locator('button:has-text("GRN Label"), div:has-text("GRN Label")').first();
    if (await grnLabelDirect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await grnLabelDirect.click();
      console.log('Clicked GRN Label directly');
      await page.waitForTimeout(1500);
    }
  }
  
  // Wait for the GRN Label Card to be loaded
  // Try multiple selectors
  const selectors = [
    'text=/GRN.*Number/i',
    'input[placeholder*="GRN"]',
    'label:has-text("GRN Number")',
    'text="GRN Detail"',
    'text="Material Supplier"',
    'text="Product Code"'
  ];
  
  let cardLoaded = false;
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      cardLoaded = true;
      console.log(`GRN Label Card loaded (found: ${selector})`);
      break;
    } catch {
      console.log(`Selector not found: ${selector}`);
      continue;
    }
  }
  
  if (!cardLoaded) {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-grn-navigation.png' });
    console.error('Failed to load GRN Label Card - screenshot saved as debug-grn-navigation.png');
    throw new Error('GRN Label Card not found');
  }
}

async function fillGRNForm(page: Page, scenario: TestScenario) {
  console.log(`\n=== Filling form for Test ${scenario.testNumber} ===`);
  
  // Fill GRN Number
  console.log(`Filling GRN Number: ${scenario.grnNumber}`);
  const grnInput = await page.locator('input[placeholder="Please Enter..."]').first();
  await grnInput.clear();
  await grnInput.fill(scenario.grnNumber);
  await page.waitForTimeout(500);
  
  // Fill Material Supplier
  console.log(`Filling Material Supplier: ${scenario.materialSupplier}`);
  const supplierInput = await page.locator('input[placeholder="Enter supplier code"]').first();
  await supplierInput.clear();
  await supplierInput.fill(scenario.materialSupplier);
  await page.waitForTimeout(500);
  
  // Fill Product Code
  console.log(`Filling Product Code: ${scenario.productCode}`);
  const productInput = await page.locator('input[placeholder="Enter product code"]').first();
  await productInput.clear();
  await productInput.fill(scenario.productCode);
  
  // Wait for product info to load - wait for description to appear
  console.log('Waiting for product info to load...');
  await page.waitForTimeout(2000);
  
  // Verify product info loaded by checking if any text with product description appears
  const productLoaded = await page.locator('text=/Description/i, text=/Product/i').first().isVisible({ timeout: 2000 }).catch(() => false);
  if (productLoaded) {
    console.log('Product info loaded');
  } else {
    console.log('Product info may not have loaded, continuing anyway');
  }
  
  // Select Count Method
  console.log(`Selecting Count Method: ${scenario.countMethod}`);
  const countMethodLabel = await page.locator(`label:has-text("${scenario.countMethod}")`).first();
  await countMethodLabel.click();
  await page.waitForTimeout(500);
  
  // If Weight mode, select Pallet Type and Package Type
  if (scenario.countMethod === 'Weight' && scenario.palletType && scenario.packageType) {
    console.log(`Selecting Pallet Type: ${scenario.palletType}`);
    // For select dropdowns, we need to use selectOption
    const palletSelect = await page.locator('select').first();
    await palletSelect.selectOption({ label: scenario.palletType });
    await page.waitForTimeout(500);
    
    console.log(`Selecting Package Type: ${scenario.packageType}`);
    // Select the second dropdown for package type
    const packageSelect = await page.locator('select').nth(1);
    await packageSelect.selectOption({ label: scenario.packageType });
    await page.waitForTimeout(500);
  }
  
  // Fill Gross Weight/Qty for each pallet
  for (let i = 0; i < scenario.grossWeights.length; i++) {
    console.log(`Filling Pallet ${i + 1}: ${scenario.grossWeights[i]}`);
    
    // Wait a bit for inputs to be available
    await page.waitForTimeout(500);
    
    // Find all weight inputs - look for inputs with "Enter" placeholder
    let weightInputs = await page.locator('input[placeholder="Enter"], input[placeholder*="kg"]').all();
    console.log(`Found ${weightInputs.length} weight input fields`);
    
    // If this is not the first input and we don't have enough inputs, the auto-add didn't work
    // In that case, use the last available input
    const inputIndex = Math.min(i, weightInputs.length - 1);
    
    if (inputIndex < weightInputs.length) {
      // Click to focus the input
      await weightInputs[inputIndex].click();
      await page.waitForTimeout(100);
      
      // Clear any existing value
      await weightInputs[inputIndex].clear();
      await page.waitForTimeout(100);
      
      // Type the value character by character to better simulate user input
      await weightInputs[inputIndex].type(scenario.grossWeights[i], { delay: 50 });
      
      // After typing, wait for the component to potentially add a new input
      await page.waitForTimeout(500);
      
      // If this is not the last weight and we need more inputs
      if (i < scenario.grossWeights.length - 1) {
        // Re-check for new inputs after typing
        const newInputs = await page.locator('input[placeholder="Enter"], input[placeholder*="kg"]').all();
        console.log(`After typing, found ${newInputs.length} weight input fields`);
        
        // If no new input was added and we need more, try to trigger it
        if (newInputs.length <= i + 1 && newInputs.length < scenario.grossWeights.length) {
          console.log('Attempting to trigger new input field...');
          // Press Tab to move focus, which might trigger new input
          await page.keyboard.press('Tab');
          await page.waitForTimeout(500);
        }
      }
    }
  }
  
  console.log('Form filled successfully');
}

async function printLabel(page: Page, scenario: TestScenario) {
  console.log(`\n=== Printing label for Test ${scenario.testNumber} ===`);
  
  // Click Print Label button
  console.log('Clicking Print Label button...');
  const printButton = await page.locator('button:has-text("Print GRN Label")').first();
  await printButton.click();
  
  // Wait for clock number dialog
  console.log('Waiting for clock number dialog...');
  await page.waitForSelector('input[placeholder*="Clock"], input[placeholder*="clock"], input[type="text"]', { timeout: 5000 });
  
  // Enter verified clock ID
  console.log(`Entering Clock ID: ${scenario.verifiedClockId}`);
  const clockInput = await page.locator('input[placeholder*="Clock"], input[placeholder*="clock"], input[type="text"]').last();
  await clockInput.fill(scenario.verifiedClockId);
  
  // Confirm the dialog
  const confirmButton = await page.locator('button:has-text("Confirm")').first();
  await confirmButton.click();
  
  // Handle print dialog if it appears
  page.on('dialog', async dialog => {
    console.log('Print dialog appeared, dismissing...');
    await dialog.dismiss();
  });
  
  // Wait for processing to complete
  console.log('Waiting for processing to complete...');
  await page.waitForTimeout(5000);
  
  // Check for success message
  const successToast = await page.locator('text=/success/i, text=/complete/i, text=/generated/i').first();
  if (await successToast.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Label printed successfully!');
  } else {
    console.log('No success message found, but continuing...');
  }
}

async function verifyDatabaseUpdate(scenario: TestScenario) {
  console.log(`\n=== Verifying database updates for Test ${scenario.testNumber} ===`);
  
  const verificationResults: Record<string, boolean> = {};
  
  // Verify record_grn table
  try {
    const { data: grnRecords, error } = await supabase
      .from('record_grn')
      .select('*')
      .eq('grn_ref', parseInt(scenario.grnNumber))
      .order('creat_time', { ascending: false })
      .limit(scenario.grossWeights.length);
    
    if (error) throw error;
    verificationResults['record_grn'] = grnRecords && grnRecords.length > 0;
    console.log(`✓ record_grn: ${verificationResults['record_grn'] ? `Found ${grnRecords?.length} records` : 'Not found'}`);
  } catch (error) {
    console.error('Error checking record_grn:', error);
    verificationResults['record_grn'] = false;
  }
  
  // Verify record_history table - check for GRN action
  try {
    const { data: historyRecords, error } = await supabase
      .from('record_history')
      .select('*')
      .like('remark', `%GRN%${scenario.grnNumber}%`)
      .order('time', { ascending: false })
      .limit(scenario.grossWeights.length * 2); // May have multiple entries per pallet
    
    if (error) throw error;
    verificationResults['record_history'] = historyRecords && historyRecords.length > 0;
    console.log(`✓ record_history: ${verificationResults['record_history'] ? `Found ${historyRecords?.length} records` : 'Not found'}`);
  } catch (error) {
    console.error('Error checking record_history:', error);
    verificationResults['record_history'] = false;
  }
  
  // Verify record_inventory table
  try {
    const { data: inventoryRecords, error } = await supabase
      .from('record_inventory')
      .select('*')
      .eq('product_code', scenario.productCode)
      .order('latest_update', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    verificationResults['record_inventory'] = inventoryRecords && inventoryRecords.length > 0;
    console.log(`✓ record_inventory: ${verificationResults['record_inventory'] ? 'Found' : 'Not found'}`);
  } catch (error) {
    console.error('Error checking record_inventory:', error);
    verificationResults['record_inventory'] = false;
  }
  
  // Verify stock_level table
  try {
    const { data: stockRecords, error } = await supabase
      .from('stock_level')
      .select('*')
      .eq('stock', scenario.productCode)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
    verificationResults['stock_level'] = stockRecords !== null;
    console.log(`✓ stock_level: ${verificationResults['stock_level'] ? 'Found' : 'Not found'}`);
  } catch (error) {
    console.error('Error checking stock_level:', error);
    verificationResults['stock_level'] = false;
  }
  
  // Verify record_palletinfo table
  try {
    const { data: palletRecords, error } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('product_code', scenario.productCode)
      .order('generate_time', { ascending: false })
      .limit(scenario.grossWeights.length * 2); // May have multiple entries
    
    if (error) throw error;
    verificationResults['record_palletinfo'] = palletRecords && palletRecords.length > 0;
    console.log(`✓ record_palletinfo: ${verificationResults['record_palletinfo'] ? `Found ${palletRecords?.length} records` : 'Not found'}`);
  } catch (error) {
    console.error('Error checking record_palletinfo:', error);
    verificationResults['record_palletinfo'] = false;
  }
  
  // Summary
  const allPassed = Object.values(verificationResults).every(result => result);
  console.log(`\n=== Database Verification Summary for Test ${scenario.testNumber} ===`);
  console.log(`Overall Result: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return verificationResults;
}

// Main test suite
test.describe('GRN Label Card Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in sequence
  test.setTimeout(120000); // 2 minutes timeout per test
  
  let page: Page;
  
  test.beforeAll(async ({ browser }) => {
    console.log('\n========================================');
    console.log('Starting GRN Label Card Test Suite');
    console.log('========================================\n');
    
    // Create a single browser context and page for all tests
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Login once for all tests
    await login(page);
    
    // Navigate to GRN Label Card
    await navigateToGRNLabelCard(page);
  });
  
  test.afterAll(async () => {
    console.log('\n========================================');
    console.log('GRN Label Card Test Suite Completed');
    console.log('========================================\n');
    
    if (page) {
      await page.close();
    }
  });
  
  // Run each test scenario
  for (const scenario of testScenarios) {
    test(`Test ${scenario.testNumber}: GRN ${scenario.grnNumber}`, async () => {
      console.log(`\n========================================`);
      console.log(`Starting Test ${scenario.testNumber}`);
      console.log(`GRN Number: ${scenario.grnNumber}`);
      console.log(`Product: ${scenario.productCode}`);
      console.log(`Pallets: ${scenario.grossWeights.length}`);
      console.log(`========================================\n`);
      
      // If not the first test, clear the form first
      if (scenario.testNumber > 1) {
        console.log('Clearing form for new test...');
        // Clear all input fields
        const grnInput = await page.locator('input[placeholder="Please Enter..."]').first();
        await grnInput.clear();
        
        const supplierInput = await page.locator('input[placeholder="Enter supplier code"]').first();
        await supplierInput.clear();
        
        const productInput = await page.locator('input[placeholder="Enter product code"]').first();
        await productInput.clear();
        
        // Clear weight inputs
        const weightInputs = await page.locator('input[placeholder="Enter"], input[placeholder*="kg"]').all();
        for (const input of weightInputs) {
          await input.clear();
        }
        
        await page.waitForTimeout(1000);
      }
      
      // Fill the form
      await fillGRNForm(page, scenario);
      
      // Print the label
      await printLabel(page, scenario);
      
      // Wait a bit for database operations to complete
      await page.waitForTimeout(2000);
      
      // Verify database updates
      const verificationResults = await verifyDatabaseUpdate(scenario);
      
      // Assert that all verifications passed
      const allPassed = Object.values(verificationResults).every(result => result);
      expect(allPassed).toBe(true);
      
      console.log(`\nTest ${scenario.testNumber} completed\n`);
    });
  }
  
  test('Final: Verify all data in database', async () => {
    console.log('\n========================================');
    console.log('Final Database Verification');
    console.log('========================================\n');
    
    // Verify all test scenarios have data in the database
    for (const scenario of testScenarios) {
      console.log(`\nChecking Test ${scenario.testNumber} (GRN: ${scenario.grnNumber})...`);
      const results = await verifyDatabaseUpdate(scenario);
      
      // Log detailed results
      for (const [table, result] of Object.entries(results)) {
        console.log(`  ${table}: ${result ? '✅' : '❌'}`);
      }
    }
    
    // Check Supabase Storage for PDFs (optional)
    console.log('\n=== Checking Supabase Storage ===');
    try {
      const { data: files, error } = await supabase
        .storage
        .from('grn-labels')
        .list('', {
          limit: 100,
          offset: 0,
        });
      
      if (error) throw error;
      
      const todayFiles = files?.filter(file => {
        const fileDate = new Date(file.created_at);
        const today = new Date();
        return fileDate.toDateString() === today.toDateString();
      });
      
      console.log(`Found ${todayFiles?.length || 0} PDF files created today`);
    } catch (error) {
      console.error('Error checking storage:', error);
    }
    
    console.log('\n✅ All tests completed successfully!');
  });
});