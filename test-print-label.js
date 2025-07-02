const puppeteer = require('puppeteer');

// Test configuration
const config = {
  loginId: 'akwan@pennineindustries.com',
  password: 'X315Y316',
  clockNumber: '5997',
  tests: [
    { productCode: 'MEP9090150', speed: 'normal', testNumber: 1 },
    { productCode: 'ME4328150', speed: 'normal', testNumber: 2 },
    { productCode: 'MEL4545A', speed: 'fast', testNumber: 3 },
    { productCode: 'MEL6060A', speed: 'fast', testNumber: 4 },
    { productCode: 'MEL4545A', speed: 'normal', testNumber: 5 },    
    { productCode: 'MEP9090150', speed: 'fast', testNumber: 6 }
  ],
  palletCount: '4'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to handle print dialog automatically
async function handlePrintDialog(page) {
  console.log('🖨️  Waiting for potential print dialog...');
  
  try {
    // Wait for print dialog to appear (PDF generation)
    await page.waitForSelector('iframe[src*="print-label-pdf"]', { timeout: 3000 });
    console.log('✅ PDF print dialog detected');
    
    // Wait a moment for PDF generation
    await delay(2000);
    
    // Look for print confirmation buttons
    const confirmPrintButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => 
        btn.textContent.includes('Print') || 
        btn.textContent.includes('確認') ||
        btn.textContent.includes('Confirm') ||
        btn.textContent.includes('OK')
      ).map(btn => btn.textContent)
    );
    
    if (confirmPrintButtons.length > 0) {
      console.log('🖨️  Found print confirmation buttons:', confirmPrintButtons);
      
      // Try to click print/confirm button
      const printConfirmButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Print') || 
          btn.textContent.includes('確認') ||
          btn.textContent.includes('Confirm') ||
          btn.textContent.includes('OK')
        );
      });
      
      if (printConfirmButton && printConfirmButton.asElement()) {
        await printConfirmButton.click();
        console.log('✅ Clicked print confirmation button');
        await delay(1000);
      }
    }
    
    // Handle browser print dialog (if any)
    await page.evaluate(() => {
      // Simulate Ctrl+P if print dialog is expected
      if (window.print) {
        console.log('Triggering browser print...');
        // Don't actually call window.print() to avoid real printing
        // window.print();
      }
    });
    
    return true;
  } catch (error) {
    console.log('ℹ️  No print dialog detected or timeout reached');
    return false;
  }
}

// Function to auto-confirm system print dialogs using keyboard shortcuts
async function autoConfirmPrint(page) {
  console.log('⌨️  Sending Enter key to confirm any system print dialogs...');
  
  try {
    // Wait a moment for any system dialogs to appear
    await delay(1500);
    
    // Send Enter key to confirm print (works for most system print dialogs)
    await page.keyboard.press('Enter');
    console.log('✅ Sent Enter key for print confirmation');
    
    await delay(500);
    
    // Alternative: Send Escape if we want to cancel instead
    // await page.keyboard.press('Escape');
    
    return true;
  } catch (error) {
    console.log('⚠️  Could not send print confirmation keys:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('Starting Print Label Test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless mode
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/main-login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Login
    console.log('Logging in...');
    await page.type('input[type="email"]', config.loginId);
    await page.type('input[type="password"]', config.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Navigate to print-label page
    console.log('Navigating to print-label page...');
    await page.goto('http://localhost:3000/print-label', { waitUntil: 'networkidle2' });
    await delay(2000); // Give page time to fully load
    
    // Wait for product code input with more flexible selector
    try {
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });
      console.log('Page loaded successfully');
    } catch (e) {
      console.log('Failed to find input field, checking page content...');
      const content = await page.content();
      console.log('Page title:', await page.title());
      throw e;
    }
    
    // Run tests
    for (const test of config.tests) {
      console.log(`\n--- Test ${test.testNumber}: ${test.productCode} (${test.speed} speed) ---`);
      
      // Find the first text input (should be product code)
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length === 0) {
        throw new Error('No text inputs found on page');
      }
      
      // Clear previous values
      const productInput = inputs[0];
      await productInput.click({ clickCount: 3 }); // Triple click to select all
      await page.keyboard.press('Backspace'); // Clear
      
      // Enter product code
      console.log(`Entering product code: ${test.productCode}`);
      await productInput.type(test.productCode);
      
      // Trigger search (Tab or Enter)
      await page.keyboard.press('Tab');
      
      // Wait for search to complete
      if (test.speed === 'normal') {
        await delay(2000); // Normal speed - wait for search
      } else {
        await delay(500); // Fast speed - minimal wait
      }
      
      // Check for error message
      await delay(500); // Wait for error to appear
      const errorElements = await page.$$('.text-red-500');
      if (errorElements.length > 0) {
        for (const errorEl of errorElements) {
          const errorText = await page.evaluate(el => el.textContent, errorEl);
          console.log(`Error found: "${errorText}"`);
        }
      } else {
        console.log('No error - product found successfully');
      }
      
      // Enter pallet count (find the count input - usually the 3rd text input)
      await delay(500); // Small delay to ensure inputs are rendered
      const allInputs = await page.$$('input[type="text"]');
      if (allInputs.length >= 3) {
        const countInput = allInputs[2]; // Assuming: product code, quantity, count
        await countInput.click({ clickCount: 3 });
        await countInput.type(config.palletCount);
        console.log(`Entered pallet count: ${config.palletCount}`);
      } else {
        console.log('Count input not found, skipping...');
      }
      
      // Leave operator clock number empty (already empty by default)
      
      // Click print button (find button containing "Print" text)
      const printButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Print'));
      });
      
      if (printButton && printButton.asElement()) {
        console.log('Clicking Print Label button...');
        await printButton.click();
        
        // Wait for clock number dialog
        await delay(1000);
        try {
          // Look for clock number input in dialog
          const dialogInputs = await page.$$('input[type="text"]');
          const clockInput = dialogInputs[dialogInputs.length - 1]; // Usually the last input
          
          if (clockInput) {
            console.log(`Entering clock number: ${config.clockNumber}`);
            await clockInput.click();
            await clockInput.type(config.clockNumber);
            
            // Find and click confirm button
            const confirmButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(btn => btn.textContent.includes('Confirm'));
            });
            
            if (confirmButton && confirmButton.asElement()) {
              await confirmButton.click();
              console.log('Confirmed clock number');
              
              // Handle print dialog after confirming clock number
              console.log('🖨️  Handling print process...');
              
              // Method 1: Handle web-based print dialog
              const printDialogHandled = await handlePrintDialog(page);
              
              // Method 2: Auto-confirm system print dialog
              await autoConfirmPrint(page);
              
              if (printDialogHandled) {
                console.log('✅ Print dialog was handled successfully');
              } else {
                console.log('ℹ️  No web print dialog found, system dialog may have been handled');
              }
            }
          }
        } catch (e) {
          console.log('Clock number dialog handling failed:', e.message);
        }
        
        // Wait for print process completion
        console.log('⏳ Waiting for print process to complete...');
        if (test.speed === 'normal') {
          await delay(8000); // Normal speed - wait longer for print completion
        } else {
          await delay(4000); // Fast speed - moderate wait for print completion
        }
        
        // Check for success/error messages
        const toastMessages = await page.$$eval('[role="status"]', elements => 
          elements.map(el => el.textContent)
        );
        if (toastMessages.length > 0) {
          console.log('Toast messages:', toastMessages);
        }
        
      } else {
        console.log('Print button not found!');
      }
      
      // Small delay between tests
      if (test.testNumber < config.tests.length) {
        console.log('Waiting before next test...');
        await delay(3000);
      }
    }
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Keep browser open for inspection
    console.log('\nPress Ctrl+C to close browser and exit...');
    await delay(300000); // Keep open for 5 minutes
    await browser.close();
  }
}

// Run the test
runTest().catch(console.error);