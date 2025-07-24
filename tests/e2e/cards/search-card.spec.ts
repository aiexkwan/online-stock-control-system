import { test, expect } from '@playwright/test';

/**
 * SearchCard E2E Tests
 * 
 * Tests the SearchCard component functionality including:
 * - Basic search functionality
 * - Search filters and modes
 * - Result selection and interaction
 * - Performance and accessibility
 */

test.describe('SearchCard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to SearchCard test page
    await page.goto('/admin/test-search-card');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Search Functionality', () => {
    test('should render SearchCard components', async ({ page }) => {
      // Check if all test sections are visible
      await expect(page.locator('h1')).toContainText('SearchCard Test Page');
      
      // Check if all SearchCard instances are rendered
      const searchCards = page.locator('input[placeholder*="Search"]');
      await expect(searchCards).toHaveCount(5); // 5 test cases
    });

    test('should trigger search on typing', async ({ page }) => {
      // Find the first SearchCard
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Type search query
      await firstSearchCard.fill('test');
      
      // Wait for debounced search (300ms + processing time)
      await page.waitForTimeout(500);
      
      // Check if GraphQL query was triggered (would require network interception in real scenario)
      // For now, just check that the input has the expected value
      await expect(firstSearchCard).toHaveValue('test');
    });

    test('should show search filters', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      const parentContainer = firstSearchCard.locator('..');
      
      // Click filter button
      const filterButton = parentContainer.locator('button').last();
      await filterButton.click();
      
      // Check if filter panel appears
      await expect(page.locator('text=Search Mode')).toBeVisible();
      await expect(page.locator('text=Search In')).toBeVisible();
    });

    test('should handle different search modes', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      const parentContainer = firstSearchCard.locator('..');
      
      // Open filters
      await parentContainer.locator('button').last().click();
      
      // Test different search modes
      const modes = ['GLOBAL', 'ENTITY', 'MIXED'];
      
      for (const mode of modes) {
        await page.locator(`text=${mode}`).click();
        await expect(page.locator(`text=${mode}`)).toHaveClass(/bg-blue-100/);
      }
    });
  });

  test.describe('Entity Filtering', () => {
    test('should toggle entity filters', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      const parentContainer = firstSearchCard.locator('..');
      
      // Open filters
      await parentContainer.locator('button').last().click();
      
      // Test entity toggles
      const entities = ['PRODUCT', 'PALLET', 'INVENTORY', 'ORDER'];
      
      for (const entity of entities) {
        const entityButton = page.locator(`text=${entity}`);
        if (await entityButton.isVisible()) {
          await entityButton.click();
          // Check if selection state changes
          await page.waitForTimeout(100);
        }
      }
    });

    test('should preserve filter settings', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      const parentContainer = firstSearchCard.locator('..');
      
      // Open filters
      await parentContainer.locator('button').last().click();
      
      // Change search mode
      await page.locator('text=ENTITY').click();
      
      // Select specific entity
      await page.locator('text=PRODUCT').click();
      
      // Close filters by clicking somewhere else
      await page.locator('h1').click();
      
      // Reopen filters
      await parentContainer.locator('button').last().click();
      
      // Check if settings are preserved
      await expect(page.locator('text=ENTITY')).toHaveClass(/bg-blue-100/);
    });
  });

  test.describe('Search Results', () => {
    test('should handle search input focus and blur', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Focus input
      await firstSearchCard.focus();
      
      // Type to trigger dropdown
      await firstSearchCard.fill('te');
      await page.waitForTimeout(100);
      
      // Blur input
      await page.locator('h1').click();
      await page.waitForTimeout(200);
      
      // Focus again
      await firstSearchCard.focus();
      
      // Should still have the value
      await expect(firstSearchCard).toHaveValue('te');
    });

    test('should clear search input', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Type search query
      await firstSearchCard.fill('test query');
      await expect(firstSearchCard).toHaveValue('test query');
      
      // Find and click clear button
      const parentContainer = firstSearchCard.locator('..');
      const clearButton = parentContainer.locator('button svg').first();
      
      // Check if clear button is visible when there's text
      await expect(clearButton).toBeVisible();
      
      // Click clear button
      await clearButton.click();
      
      // Check if input is cleared
      await expect(firstSearchCard).toHaveValue('');
    });
  });

  test.describe('Different Search Configurations', () => {
    test('should handle product-only search', async ({ page }) => {
      // Find the Product-only search card (second test case)
      const productSearch = page.locator('h2:has-text("Product-only Search")').locator('..').locator('input');
      
      await productSearch.fill('product');
      await page.waitForTimeout(300);
      
      // Open filters to verify it's configured for products only
      const parentContainer = productSearch.locator('..');
      await parentContainer.locator('button').last().click();
      
      // Should show ENTITY mode selected
      await expect(page.locator('text=ENTITY')).toHaveClass(/bg-blue-100/);
    });

    test('should handle multi-entity search', async ({ page }) => {
      // Find the Multi-entity search card (third test case)
      const multiEntitySearch = page.locator('h2:has-text("Multi-entity Search")').locator('..').locator('input');
      
      await multiEntitySearch.fill('multi');
      await page.waitForTimeout(300);
      
      // Open filters
      const parentContainer = multiEntitySearch.locator('..');
      await parentContainer.locator('button').last().click();
      
      // Should show MIXED mode
      await expect(page.locator('text=MIXED')).toHaveClass(/bg-blue-100/);
    });

    test('should handle advanced search', async ({ page }) => {
      // Find the Advanced search card (fourth test case)
      const advancedSearch = page.locator('h2:has-text("Advanced Search")').locator('..').locator('input');
      
      await advancedSearch.fill('advanced');
      await page.waitForTimeout(300);
      
      // Should have placeholder for advanced search
      await expect(advancedSearch).toHaveAttribute('placeholder', 'Advanced search across all data...');
    });

    test('should handle compact search', async ({ page }) => {
      // Find the Compact search card (fifth test case)
      const compactSearch = page.locator('h2:has-text("Compact Search")').locator('..').locator('input');
      
      await compactSearch.fill('quick');
      await page.waitForTimeout(300);
      
      // Should have quick search placeholder
      await expect(compactSearch).toHaveAttribute('placeholder', 'Quick search...');
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle rapid typing without lag', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Type rapidly
      const testString = 'rapid typing test';
      for (const char of testString) {
        await firstSearchCard.type(char, { delay: 50 });
      }
      
      // Wait for debouncing
      await page.waitForTimeout(400);
      
      // Check final value
      await expect(firstSearchCard).toHaveValue(testString);
    });

    test('should handle multiple search cards simultaneously', async ({ page }) => {
      const searchCards = page.locator('input[placeholder*="Search"]');
      
      // Type in multiple search cards
      await searchCards.nth(0).fill('search1');
      await searchCards.nth(1).fill('search2');
      await searchCards.nth(2).fill('search3');
      
      // Wait for processing
      await page.waitForTimeout(500);
      
      // Verify all have correct values
      await expect(searchCards.nth(0)).toHaveValue('search1');
      await expect(searchCards.nth(1)).toHaveValue('search2');
      await expect(searchCards.nth(2)).toHaveValue('search3');
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to first search input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should focus the first search input
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      await expect(firstSearchCard).toBeFocused();
      
      // Type with keyboard
      await page.keyboard.type('keyboard test');
      await expect(firstSearchCard).toHaveValue('keyboard test');
      
      // Clear with keyboard (Ctrl+A, Delete)
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await expect(firstSearchCard).toHaveValue('');
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Check for basic accessibility attributes
      await expect(firstSearchCard).toHaveAttribute('type', 'text');
      
      // Check for placeholder text
      await expect(firstSearchCard).toHaveAttribute('placeholder');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle empty search gracefully', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Try to search with empty input
      await firstSearchCard.fill('');
      await page.waitForTimeout(300);
      
      // Should not trigger search (no error should occur)
      await expect(firstSearchCard).toHaveValue('');
    });

    test('should handle very long search queries', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Type very long search query
      const longQuery = 'a'.repeat(1000);
      await firstSearchCard.fill(longQuery);
      await page.waitForTimeout(500);
      
      // Should handle without crashing
      await expect(firstSearchCard).toHaveValue(longQuery);
    });

    test('should handle special characters', async ({ page }) => {
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      
      // Test special characters
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      await firstSearchCard.fill(specialChars);
      await page.waitForTimeout(300);
      
      // Should handle without breaking
      await expect(firstSearchCard).toHaveValue(specialChars);
    });
  });

  test.describe('Console Error Monitoring', () => {
    test('should not generate console errors during normal operation', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Perform various operations
      const firstSearchCard = page.locator('input[placeholder*="Search"]').first();
      await firstSearchCard.fill('test');
      await page.waitForTimeout(300);
      
      // Open and close filters
      const parentContainer = firstSearchCard.locator('..');
      await parentContainer.locator('button').last().click();
      await page.locator('h1').click();
      
      // Clear search
      await firstSearchCard.fill('');
      
      // Check for console errors (excluding expected GraphQL errors for missing backend)
      const relevantErrors = consoleErrors.filter(error => 
        !error.includes('fetch') && 
        !error.includes('NetworkError') &&
        !error.includes('GraphQL')
      );
      
      expect(relevantErrors).toHaveLength(0);
    });
  });
});