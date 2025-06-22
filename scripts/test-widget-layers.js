const puppeteer = require('puppeteer');

async function testWidgetLayers() {
  console.log('🔍 Testing widget layer issue...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();
    
    // Quick login
    await page.goto('http://localhost:3000/main-login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'akwan@pennineindustries.com');
    await page.type('input[type="password"]', 'X315Y316');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to admin
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clear dashboard
    console.log('🧹 Clearing dashboard...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editBtn = buttons.find(btn => btn.textContent?.includes('Edit Dashboard'));
      if (editBtn) editBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(btn => btn.textContent?.includes('Reset Dashboard'));
      if (resetBtn) resetBtn.click();
    });
    page.once('dialog', async dialog => await dialog.accept());
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Test 1: Add widget and check for duplicates
    console.log('\n📦 Test 1: Adding widget...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
      if (addBtn) addBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.p-4'));
      if (buttons[0]) buttons[0].click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for duplicate layers
    let layerInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const contentContainers = document.querySelectorAll('.grid-stack-item-content');
      const widgetContainers = document.querySelectorAll('.widget-container');
      const reactRoots = document.querySelectorAll('[data-reactroot]');
      
      // Check for duplicate widget content
      const widgetIds = Array.from(widgets).map(w => w.getAttribute('gs-id'));
      const uniqueIds = new Set(widgetIds);
      
      return {
        gridStackItems: widgets.length,
        contentContainers: contentContainers.length,
        widgetContainers: widgetContainers.length,
        reactRoots: reactRoots.length,
        widgetIds,
        hasDuplicateIds: widgetIds.length !== uniqueIds.size,
        details: Array.from(widgets).map(w => ({
          id: w.getAttribute('gs-id'),
          hasContent: w.querySelector('.grid-stack-item-content') !== null,
          contentChildren: w.querySelector('.grid-stack-item-content')?.children.length || 0
        }))
      };
    });

    console.log('\nLayer analysis:');
    console.log(`  Grid stack items: ${layerInfo.gridStackItems}`);
    console.log(`  Content containers: ${layerInfo.contentContainers}`);
    console.log(`  Widget containers: ${layerInfo.widgetContainers}`);
    console.log(`  Has duplicate IDs: ${layerInfo.hasDuplicateIds ? '❌' : '✅'}`);
    console.log(`  Single layer: ${layerInfo.gridStackItems === 1 ? '✅' : '❌'}`);
    
    console.log('\nWidget details:');
    layerInfo.details.forEach((w, i) => {
      console.log(`  Widget ${i + 1}:`);
      console.log(`    ID: ${w.id}`);
      console.log(`    Has content: ${w.hasContent ? '✅' : '❌'}`);
      console.log(`    Content children: ${w.contentChildren}`);
    });

    // Test 2: Delete widget
    console.log('\n🗑️ Test 2: Deleting widget...');
    const deleteClicked = await page.evaluate(() => {
      const deleteBtn = document.querySelector('.widget-remove-btn');
      if (deleteBtn) {
        deleteBtn.click();
        return true;
      }
      return false;
    });
    console.log(`  Delete button clicked: ${deleteClicked ? '✅' : '❌'}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if properly deleted
    layerInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      const orphanedContent = document.querySelectorAll('.grid-stack > .widget-container');
      const orphanedReactRoots = document.querySelectorAll('.grid-stack > [data-reactroot]');
      
      return {
        remainingWidgets: widgets.length,
        orphanedContent: orphanedContent.length,
        orphanedReactRoots: orphanedReactRoots.length,
        gridChildren: document.querySelector('.grid-stack')?.children.length || 0
      };
    });

    console.log('\nAfter deletion:');
    console.log(`  Remaining widgets: ${layerInfo.remainingWidgets}`);
    console.log(`  Orphaned content: ${layerInfo.orphanedContent}`);
    console.log(`  Orphaned React roots: ${layerInfo.orphanedReactRoots}`);
    console.log(`  Grid children: ${layerInfo.gridChildren}`);
    console.log(`  Clean deletion: ${layerInfo.remainingWidgets === 0 && layerInfo.orphanedContent === 0 ? '✅' : '❌'}`);

    // Test 3: Add multiple widgets
    console.log('\n📦 Test 3: Adding multiple widgets...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent?.includes('Add Widget'));
        if (addBtn) addBtn.click();
      });
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.evaluate((index) => {
        const buttons = Array.from(document.querySelectorAll('button.p-4'));
        if (buttons[index % buttons.length]) {
          buttons[index % buttons.length].click();
        }
      }, i);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Final check
    const finalInfo = await page.evaluate(() => {
      const widgets = document.querySelectorAll('.grid-stack-item');
      return {
        count: widgets.length,
        allHaveContent: Array.from(widgets).every(w => 
          w.querySelector('.widget-container') !== null
        ),
        noDuplicates: widgets.length === new Set(Array.from(widgets).map(w => 
          w.getAttribute('gs-id')
        )).size
      };
    });

    console.log('\nFinal state:');
    console.log(`  Total widgets: ${finalInfo.count}`);
    console.log(`  All have content: ${finalInfo.allHaveContent ? '✅' : '❌'}`);
    console.log(`  No duplicate IDs: ${finalInfo.noDuplicates ? '✅' : '❌'}`);
    console.log(`  Expected 3 widgets: ${finalInfo.count === 3 ? '✅' : '❌'}`);

    await page.screenshot({ 
      path: '/tmp/widget-layers-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to /tmp/widget-layers-test.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔄 Keeping browser open...');
    await new Promise(() => {});
  }
}

testWidgetLayers();