import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { waitForGraphQL } from '../helpers/graphql';
import { mockAlertData } from '../fixtures/alert-data';

test.describe('AlertCard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);

    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Functionality', () => {
    test('should display AlertCard with active alerts', async ({ page }) => {
      // Wait for AlertCard to load
      await page.waitForSelector('[data-testid="alert-card"]', { timeout: 10000 });

      // Check if card header is visible
      await expect(page.locator('text=Alert Management')).toBeVisible();

      // Check if summary stats are displayed
      await expect(page.locator('text=Active Alerts')).toBeVisible();
      await expect(page.locator('text=Critical')).toBeVisible();
      await expect(page.locator('text=Today')).toBeVisible();
      await expect(page.locator('text=Recent (1hr)')).toBeVisible();
    });

    test('should display different alert severities', async ({ page }) => {
      // Check for severity badges
      const severities = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];

      for (const severity of severities) {
        const severityBadge = page.locator(`[data-testid="severity-${severity.toLowerCase()}"]`);
        if ((await severityBadge.count()) > 0) {
          await expect(severityBadge.first()).toBeVisible();
        }
      }
    });

    test('should switch between tabs', async ({ page }) => {
      // Click on Statistics tab
      await page.click('text=Statistics');
      await expect(page.locator('text=Performance Metrics')).toBeVisible();
      await expect(page.locator('text=Mean Time to Acknowledge')).toBeVisible();

      // Click on Filters tab
      await page.click('text=Filters');
      await expect(page.locator('text=Sort By')).toBeVisible();
      await expect(page.locator('text=Include')).toBeVisible();

      // Return to Alerts tab
      await page.click('text=Alerts');
      await expect(page.locator('text=Active Alerts')).toBeVisible();
    });
  });

  test.describe('Alert Actions', () => {
    test('should acknowledge an alert', async ({ page }) => {
      // Find an active alert
      const activeAlert = page
        .locator('[data-testid="alert-item"]')
        .filter({ hasText: 'ACTIVE' })
        .first();

      if ((await activeAlert.count()) > 0) {
        // Click acknowledge button
        await activeAlert.locator('button:has-text("Acknowledge")').click();

        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'AcknowledgeAlert');

        // Check success toast
        await expect(page.locator('text=Alert acknowledged successfully')).toBeVisible();
      }
    });

    test('should resolve an alert', async ({ page }) => {
      // Find an active or acknowledged alert
      const alert = page.locator('[data-testid="alert-item"]').first();

      if ((await alert.count()) > 0) {
        // Click resolve button
        await alert.locator('button:has-text("Resolve")').click();

        // Handle resolution dialog
        await page.fill('[data-testid="resolution-input"]', 'Issue has been fixed');
        await page.click('button:has-text("Submit")');

        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'ResolveAlert');

        // Check success toast
        await expect(page.locator('text=Alert resolved successfully')).toBeVisible();
      }
    });

    test('should dismiss an alert', async ({ page }) => {
      // Find any alert
      const alert = page.locator('[data-testid="alert-item"]').first();

      if ((await alert.count()) > 0) {
        // Click dismiss button (X)
        await alert.locator('button[aria-label="Dismiss"]').click();

        // Confirm dismissal
        await page.click('button:has-text("Confirm")');

        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'DismissAlert');

        // Check success toast
        await expect(page.locator('text=Alert dismissed')).toBeVisible();
      }
    });
  });

  test.describe('Filtering and Sorting', () => {
    test('should filter alerts by severity', async ({ page }) => {
      // Go to Filters tab
      await page.click('text=Filters');

      // Change sort order
      await page.click('[data-testid="sort-select"]');
      await page.click('text=Severity (High to Low)');

      // Apply filters
      await page.click('button:has-text("Apply Filters")');

      // Wait for data refresh
      await waitForGraphQL(page, 'AlertCardData');

      // Verify sorting applied
      const firstAlert = page.locator('[data-testid="alert-item"]').first();
      if ((await firstAlert.count()) > 0) {
        const severity = await firstAlert.locator('[data-testid="alert-severity"]').textContent();
        expect(['CRITICAL', 'ERROR']).toContain(severity);
      }
    });

    test('should toggle include options', async ({ page }) => {
      // Go to Filters tab
      await page.click('text=Filters');

      // Toggle acknowledged alerts
      const acknowledgedCheckbox = page.locator('input[id="include-acknowledged"]');
      await acknowledgedCheckbox.uncheck();

      // Toggle resolved alerts
      const resolvedCheckbox = page.locator('input[id="include-resolved"]');
      await resolvedCheckbox.check();

      // Apply filters
      await page.click('button:has-text("Apply Filters")');

      // Wait for data refresh
      await waitForGraphQL(page, 'AlertCardData');
    });
  });

  test.describe('Statistics View', () => {
    test('should display performance metrics', async ({ page }) => {
      // Go to Statistics tab
      await page.click('text=Statistics');

      // Check performance metrics
      await expect(page.locator('text=Mean Time to Acknowledge')).toBeVisible();
      await expect(page.locator('text=Mean Time to Resolution')).toBeVisible();
      await expect(page.locator('text=Acknowledge Rate')).toBeVisible();
      await expect(page.locator('text=Resolution Rate')).toBeVisible();

      // Check distribution by severity
      await expect(page.locator('text=Distribution by Severity')).toBeVisible();

      // Verify severity distribution bars
      const severityBars = page.locator('[data-testid="severity-distribution-bar"]');
      expect(await severityBars.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Real-time Updates', () => {
    test('should refresh data periodically', async ({ page }) => {
      // Get initial alert count
      const initialCount = await page.locator('[data-testid="active-alert-count"]').textContent();

      // Track GraphQL requests for AlertCardData
      let requestCount = 0;
      page.on('response', async response => {
        if (response.url().includes('/api/graphql')) {
          try {
            const request = response.request();
            const postData = request.postData();
            if (postData?.includes('AlertCardData')) {
              requestCount++;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      });

      // Wait for refresh interval (30 seconds in the component)
      // For testing, we'll wait for a GraphQL refetch
      await page.waitForTimeout(31000);

      // Check if GraphQL query was called at least twice (initial + refresh)
      expect(requestCount).toBeGreaterThanOrEqual(2);
    });

    test('should manually refresh data', async ({ page }) => {
      // Click refresh button
      await page.click('[data-testid="refresh-button"]');

      // Wait for GraphQL query
      await waitForGraphQL(page, 'AlertCardData');

      // Check that loading indicator appears
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Wait for loading to complete
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Batch Operations', () => {
    test('should select multiple alerts', async ({ page }) => {
      // Find alert checkboxes
      const checkboxes = page.locator('[data-testid="alert-checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        // Select first two alerts
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Verify batch action buttons appear
        await expect(page.locator('[data-testid="batch-acknowledge"]')).toBeVisible();
        await expect(page.locator('[data-testid="batch-resolve"]')).toBeVisible();
      }
    });

    test('should batch acknowledge alerts', async ({ page }) => {
      // Select multiple alerts
      const checkboxes = page.locator('[data-testid="alert-checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Click batch acknowledge
        await page.click('[data-testid="batch-acknowledge"]');

        // Confirm action
        await page.click('button:has-text("Confirm")');

        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'BatchAcknowledgeAlerts');

        // Check success message
        await expect(page.locator('text=/Successfully acknowledged \\d+ alerts/')).toBeVisible();
      }
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no alerts', async ({ page }) => {
      // Mock empty response
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();

        if (postData?.includes('AlertCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                alertCardData: {
                  alerts: [],
                  summary: {
                    totalActive: 0,
                    totalToday: 0,
                    bySeverity: [],
                    byType: [],
                    byStatus: [],
                    recentCount: 0,
                    criticalCount: 0,
                  },
                  statistics: {
                    averageResolutionTime: 0,
                    averageAcknowledgeTime: 0,
                    acknowledgeRate: 0,
                    resolutionRate: 0,
                    recurringAlerts: 0,
                    performanceMetrics: {
                      mttr: 0,
                      mtta: 0,
                      alertVolume: 0,
                      falsePositiveRate: 0,
                    },
                  },
                  pagination: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    totalCount: 0,
                    totalPages: 0,
                    currentPage: 1,
                  },
                  lastUpdated: new Date().toISOString(),
                  refreshInterval: 30,
                },
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Reload page to trigger mocked response
      await page.reload();

      // Check empty state
      await expect(page.locator('text=No alerts matching your filters')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state-icon"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should display error state on GraphQL error', async ({ page }) => {
      // Mock error response
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();

        if (postData?.includes('AlertCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              errors: [
                {
                  message: 'Failed to fetch alert data',
                  extensions: { code: 'INTERNAL_SERVER_ERROR' },
                },
              ],
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Reload page to trigger error
      await page.reload();

      // Check error state
      await expect(page.locator('text=Error')).toBeVisible();
      await expect(page.locator('text=Failed to fetch alert data')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab through alert items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check focus indicators
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();

      // Navigate through tabs using arrow keys
      await page.click('text=Alerts');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Statistics');

      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Filters');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check main regions
      await expect(page.locator('[aria-label="Alert Management"]')).toBeVisible();

      // Check action buttons
      const acknowledgeButtons = page.locator('button[aria-label="Acknowledge alert"]');
      if ((await acknowledgeButtons.count()) > 0) {
        await expect(acknowledgeButtons.first()).toHaveAttribute('aria-label', 'Acknowledge alert');
      }

      // Check tabs
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tab"]').first()).toHaveAttribute('aria-selected');
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to page with AlertCard
      await page.goto('/admin');
      await page.waitForSelector('[data-testid="alert-card"]', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        type: 'SYSTEM_ALERT',
        severity: ['CRITICAL', 'ERROR', 'WARNING', 'INFO'][i % 4],
        status: 'ACTIVE',
        title: `Alert ${i}`,
        message: `This is alert message ${i}`,
        source: 'SYSTEM',
        createdAt: new Date().toISOString(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        resolvedBy: null,
        affectedEntities: [],
        actions: [],
        tags: [],
      }));

      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();

        if (postData?.includes('AlertCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                alertCardData: {
                  alerts: largeDataset.slice(0, 50), // Return first 50
                  summary: {
                    totalActive: 100,
                    totalToday: 50,
                    bySeverity: [
                      { severity: 'CRITICAL', count: 25, percentage: 25 },
                      { severity: 'ERROR', count: 25, percentage: 25 },
                      { severity: 'WARNING', count: 25, percentage: 25 },
                      { severity: 'INFO', count: 25, percentage: 25 },
                    ],
                    byType: [],
                    byStatus: [],
                    recentCount: 10,
                    criticalCount: 25,
                  },
                  statistics: mockAlertData.statistics,
                  pagination: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    totalCount: 100,
                    totalPages: 2,
                    currentPage: 1,
                  },
                  lastUpdated: new Date().toISOString(),
                  refreshInterval: 30,
                },
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Reload to get large dataset
      await page.reload();

      // Check that scroll area is functioning
      const scrollArea = page.locator('[data-testid="alert-scroll-area"]');
      await expect(scrollArea).toBeVisible();

      // Verify pagination info
      await expect(page.locator('text=/Showing \\d+ of \\d+/')).toBeVisible();
    });
  });
});
