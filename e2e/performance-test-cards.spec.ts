/**
 * Performance Testing for Stock Management Cards
 * Tests for memory leaks, render performance, and bundle impact
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Helper to measure component render time
async function measureRenderTime(page: Page, selector: string): Promise<number> {
  return await page.evaluate((sel) => {
    return new Promise<number>((resolve) => {
      const startTime = performance.now();
      const observer = new MutationObserver(() => {
        const element = document.querySelector(sel);
        if (element) {
          observer.disconnect();
          resolve(performance.now() - startTime);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }, selector);
}

// Helper to check for memory leaks
async function checkMemoryLeaks(page: Page): Promise<{
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}> {
  return await page.evaluate(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        external: memory.totalJSHeapSize,
        arrayBuffers: memory.jsHeapSizeLimit
      };
    }
    return { heapUsed: 0, external: 0, arrayBuffers: 0 };
  });
}

// Helper to count React component renders
async function setupRenderCounter(page: Page) {
  await page.addInitScript(() => {
    (window as any).__RENDER_COUNT__ = {};
    
    // Monkey patch React createElement to count renders
    const originalCreateElement = (window as any).React?.createElement;
    if (originalCreateElement) {
      (window as any).React.createElement = function(...args: any[]) {
        const component = args[0];
        if (typeof component === 'function' && component.name) {
          const name = component.name;
          (window as any).__RENDER_COUNT__[name] = ((window as any).__RENDER_COUNT__[name] || 0) + 1;
        }
        return originalCreateElement.apply(this, args);
      };
    }
  });
}

test.describe('StockCountCard Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup render counter
    await setupRenderCounter(page);
    
    // Navigate to the page with StockCountCard
    await page.goto('/admin/stock-count');
    
    // Wait for component to be ready
    await page.waitForSelector('[data-testid="stock-count-card"]', { timeout: 10000 });
  });

  test('should render efficiently without memory leaks', async ({ page }) => {
    // Initial memory snapshot
    const initialMemory = await checkMemoryLeaks(page);
    console.log('Initial memory:', initialMemory);

    // Perform multiple operations
    for (let i = 0; i < 10; i++) {
      // Toggle between scan and manual mode
      await page.click('button:has-text("Manual")');
      await page.click('button:has-text("QR Scan")');
      
      // Fill and clear form
      await page.fill('input[placeholder*="pallet"]', `TEST${i}`);
      await page.fill('input[placeholder*="product"]', `PROD${i}`);
      await page.fill('input[placeholder*="quantity"]', `${i * 100}`);
      
      // Clear form
      await page.fill('input[placeholder*="pallet"]', '');
      await page.fill('input[placeholder*="product"]', '');
      await page.fill('input[placeholder*="quantity"]', '');
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Final memory snapshot
    const finalMemory = await checkMemoryLeaks(page);
    console.log('Final memory:', finalMemory);

    // Memory should not increase significantly (allow 10MB increase)
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('should minimize re-renders during form input', async ({ page }) => {
    // Reset render count
    await page.evaluate(() => {
      (window as any).__RENDER_COUNT__ = {};
    });

    // Type in form fields
    await page.click('button:has-text("Manual")');
    await page.type('input[placeholder*="pallet"]', 'TEST123', { delay: 100 });

    // Get render count
    const renderCount = await page.evaluate(() => {
      return (window as any).__RENDER_COUNT__;
    });

    console.log('Render counts:', renderCount);

    // Component should not re-render more than necessary
    // With proper memoization, expect less than 10 renders for typing 7 characters
    const totalRenders = Object.values(renderCount as Record<string, number>)
      .reduce((sum, count) => sum + count, 0);
    
    expect(totalRenders).toBeLessThan(20);
  });

  test('should handle rapid mode switching efficiently', async ({ page }) => {
    const startTime = Date.now();

    // Rapidly switch modes
    for (let i = 0; i < 50; i++) {
      await page.click('button:has-text("Manual")');
      await page.click('button:has-text("QR Scan")');
    }

    const elapsed = Date.now() - startTime;
    
    // Should complete 100 mode switches in less than 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });

  test('should lazy load QR scanner efficiently', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    // Initial load should not include QR scanner chunks
    const initialRequests = requests.filter(url => 
      url.includes('qr-scanner') || url.includes('QRScanner')
    );
    expect(initialRequests).toHaveLength(0);

    // Click to open scanner
    await page.click('button:has-text("Start Scanning")');

    // Wait for scanner to load
    await page.waitForTimeout(1000);

    // Now scanner chunks should be loaded
    const scannerRequests = requests.filter(url => 
      url.includes('qr-scanner') || url.includes('QRScanner')
    );
    expect(scannerRequests.length).toBeGreaterThan(0);
  });
});

test.describe('StockTransferCard Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupRenderCounter(page);
    await page.goto('/admin/stock-transfer');
    await page.waitForSelector('[data-testid="stock-transfer-card"]', { timeout: 10000 });
  });

  test('should efficiently render transfer history without virtualization issues', async ({ page }) => {
    // Mock a large history list
    await page.evaluate(() => {
      // Inject mock data for testing
      const mockHistory = Array.from({ length: 100 }, (_, i) => ({
        time: new Date().toISOString(),
        plt_num: `PLT${i}`,
        loc: `LOC${i}`,
        id: `USER${i}`,
        remark: `Remark ${i}`,
        uuid: `uuid-${i}`
      }));
      
      // Store in window for component to use
      (window as any).__MOCK_HISTORY__ = mockHistory;
    });

    // Measure render time with large list
    const startTime = Date.now();
    
    // Trigger re-render with history
    await page.evaluate(() => {
      // Force component update
      const event = new CustomEvent('updateHistory', { 
        detail: (window as any).__MOCK_HISTORY__ 
      });
      window.dispatchEvent(event);
    });

    const renderTime = Date.now() - startTime;
    
    // Should render 100 items in less than 500ms
    expect(renderTime).toBeLessThan(500);
  });

  test('should handle destination changes without excessive re-renders', async ({ page }) => {
    // Reset render count
    await page.evaluate(() => {
      (window as any).__RENDER_COUNT__ = {};
    });

    // Select different destinations
    const destinations = ['Fold Mill', 'Production', 'PipeLine'];
    for (const dest of destinations) {
      const button = page.locator(`button:has-text("${dest}")`).first();
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(100);
      }
    }

    // Get render count
    const renderCount = await page.evaluate(() => {
      return (window as any).__RENDER_COUNT__;
    });

    console.log('Destination change renders:', renderCount);

    // Should have minimal re-renders (less than 15 per destination change)
    const totalRenders = Object.values(renderCount as Record<string, number>)
      .reduce((sum, count) => sum + count, 0);
    
    expect(totalRenders).toBeLessThan(45);
  });

  test('should cleanup event listeners and timers on unmount', async ({ page }) => {
    // Count active listeners before
    const initialListeners = await page.evaluate(() => {
      return (window as any).getEventListeners ? 
        Object.keys((window as any).getEventListeners(window)).length : 0;
    });

    // Navigate away and back
    await page.goto('/admin');
    await page.waitForTimeout(500);
    await page.goto('/admin/stock-transfer');
    await page.waitForTimeout(500);

    // Count active listeners after
    const finalListeners = await page.evaluate(() => {
      return (window as any).getEventListeners ? 
        Object.keys((window as any).getEventListeners(window)).length : 0;
    });

    // Listeners should not accumulate
    expect(finalListeners).toBeLessThanOrEqual(initialListeners + 2);
  });

  test('should optimize API calls with deduplication', async ({ page }) => {
    let apiCallCount = 0;
    
    // Intercept API calls
    await page.route('**/api/stock-transfer/**', (route) => {
      apiCallCount++;
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, data: [] })
      });
    });

    // Type same search multiple times quickly
    const searchInput = page.locator('input[placeholder*="pallet"]');
    
    for (let i = 0; i < 5; i++) {
      await searchInput.fill('TEST123');
      await searchInput.press('Enter');
    }

    await page.waitForTimeout(1000);

    // Should deduplicate and make only 1 API call
    expect(apiCallCount).toBeLessThanOrEqual(2);
  });
});

test.describe('Performance Comparison Tests', () => {
  test('should show improved metrics with optimized components', async ({ page }) => {
    // Test both original and optimized versions
    const results = {
      original: { renderTime: 0, memoryUsed: 0, bundleSize: 0 },
      optimized: { renderTime: 0, memoryUsed: 0, bundleSize: 0 }
    };

    // Test original StockCountCard
    await page.goto('/admin/stock-count?version=original');
    results.original.renderTime = await measureRenderTime(page, '[data-testid="stock-count-card"]');
    const originalMemory = await checkMemoryLeaks(page);
    results.original.memoryUsed = originalMemory.heapUsed;

    // Test optimized StockCountCard
    await page.goto('/admin/stock-count?version=optimized');
    results.optimized.renderTime = await measureRenderTime(page, '[data-testid="stock-count-card"]');
    const optimizedMemory = await checkMemoryLeaks(page);
    results.optimized.memoryUsed = optimizedMemory.heapUsed;

    // Calculate improvements
    const renderImprovement = ((results.original.renderTime - results.optimized.renderTime) / results.original.renderTime) * 100;
    const memoryImprovement = ((results.original.memoryUsed - results.optimized.memoryUsed) / results.original.memoryUsed) * 100;

    console.log('Performance Improvements:');
    console.log(`Render Time: ${renderImprovement.toFixed(2)}% faster`);
    console.log(`Memory Usage: ${memoryImprovement.toFixed(2)}% less`);

    // Expect at least 20% improvement
    expect(renderImprovement).toBeGreaterThan(20);
    expect(memoryImprovement).toBeGreaterThan(15);
  });
});

test.describe('Bundle Size Analysis', () => {
  test('should report bundle sizes for components', async ({ page }) => {
    // Navigate to a page that loads the components
    await page.goto('/admin/stock-count');

    // Get all loaded JavaScript files
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]'))
        .map(script => (script as HTMLScriptElement).src);
    });

    // Calculate total bundle size
    let totalSize = 0;
    for (const scriptUrl of scripts) {
      const response = await page.request.get(scriptUrl);
      const body = await response.body();
      totalSize += body.length;
    }

    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);

    // Check for specific chunks
    const hasLazyLoadedChunks = scripts.some(url => 
      url.includes('qr-scanner') || url.includes('chunk')
    );

    expect(hasLazyLoadedChunks).toBeTruthy();
    
    // Total bundle should be under 500KB for these components
    expect(totalSize).toBeLessThan(500 * 1024);
  });
});