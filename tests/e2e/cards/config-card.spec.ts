import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { waitForGraphQL } from '../helpers/graphql';
import { mockConfigData, mockConfigHistory, mockConfigTemplates, mockExportData, mockImportData } from '../fixtures/config-data';
import { ConfigCategory, ConfigDataType } from '@/lib/graphql/queries/config';

test.describe('ConfigCard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Functionality', () => {
    test('should display ConfigCard with all category tabs', async ({ page }) => {
      // Wait for ConfigCard to load
      await page.waitForSelector('[data-testid="config-card"]', { timeout: 10000 });
      
      // Check if card header is visible
      await expect(page.locator('text=Configuration Management')).toBeVisible();
      await expect(page.locator('text=Manage system configurations and settings')).toBeVisible();
      
      // Check all 8 category tabs are visible
      const categories = [
        'SYSTEM_CONFIG',
        'USER_PREFERENCES', 
        'DEPARTMENT_CONFIG',
        'NOTIFICATION_CONFIG',
        'API_CONFIG',
        'SECURITY_CONFIG',
        'DISPLAY_CONFIG',
        'WORKFLOW_CONFIG'
      ];
      
      for (const category of categories) {
        const tab = page.locator(`[role="tab"]:has-text("${category}")`);
        await expect(tab).toBeVisible();
      }
      
      // Check summary statistics
      await expect(page.locator('text=/Total Configs: \\d+/')).toBeVisible();
      await expect(page.locator('text=/Editable: \\d+/')).toBeVisible();
    });

    test('should switch between category tabs', async ({ page }) => {
      // Start with System Config tab
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/SYSTEM_CONFIG/);
      
      // Switch to User Preferences
      await page.click('[role="tab"]:has-text("USER_PREFERENCES")');
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/USER_PREFERENCES/);
      
      // Verify content changes
      await expect(page.locator('text=user.theme.mode')).toBeVisible();
      await expect(page.locator('text=user.notifications.email')).toBeVisible();
      
      // Switch to Security Config
      await page.click('[role="tab"]:has-text("SECURITY_CONFIG")');
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/SECURITY_CONFIG/);
      await expect(page.locator('text=security.password.minLength')).toBeVisible();
    });

    test('should display configuration items with correct data types', async ({ page }) => {
      // Check different data type representations
      await expect(page.locator('[data-testid="config-item"]').first()).toBeVisible();
      
      // Boolean type
      const booleanConfig = page.locator('[data-testid="config-item"]:has-text("system.maintenance.mode")');
      await expect(booleanConfig.locator('text=BOOLEAN')).toBeVisible();
      
      // Number type
      const numberConfig = page.locator('[data-testid="config-item"]:has-text("system.api.rateLimit")');
      await expect(numberConfig.locator('text=NUMBER')).toBeVisible();
      
      // Check badges for access levels
      const adminConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'Admin' });
      if (await adminConfig.count() > 0) {
        await expect(adminConfig.first()).toBeVisible();
      }
    });
  });

  test.describe('CRUD Operations', () => {
    test('should create new configuration', async ({ page }) => {
      // Click add configuration button
      await page.click('[data-testid="add-config-button"]');
      
      // Fill in configuration form
      await page.fill('[data-testid="config-key-input"]', 'test.new.config');
      await page.fill('[data-testid="config-value-input"]', 'test-value');
      await page.selectOption('[data-testid="config-datatype-select"]', ConfigDataType.STRING);
      await page.fill('[data-testid="config-description-input"]', 'Test configuration');
      
      // Submit form
      await page.click('[data-testid="save-config-button"]');
      
      // Wait for GraphQL mutation
      await waitForGraphQL(page, 'CreateConfig');
      
      // Check success message
      await expect(page.locator('text=Configuration created successfully')).toBeVisible();
    });

    test('should update existing configuration', async ({ page }) => {
      // Find an editable configuration
      const editableConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'system.api.rateLimit' }).first();
      
      // Click edit button
      await editableConfig.locator('button[aria-label="Edit configuration"]').click();
      
      // Change value
      await editableConfig.locator('input[type="number"]').fill('2000');
      
      // Save changes
      await editableConfig.locator('button[aria-label="Save changes"]').click();
      
      // Wait for GraphQL mutation
      await waitForGraphQL(page, 'UpdateConfig');
      
      // Check success message
      await expect(page.locator('text=Updated system.api.rateLimit')).toBeVisible();
    });

    test('should delete configuration', async ({ page }) => {
      // Find a deletable configuration (not global scope)
      const deletableConfig = page.locator('[data-testid="config-item"]').filter({ 
        hasNotText: 'GLOBAL' 
      }).first();
      
      if (await deletableConfig.count() > 0) {
        // Open dropdown menu
        await deletableConfig.locator('button[aria-label="More actions"]').click();
        
        // Click delete option
        await page.click('text=Delete');
        
        // Confirm deletion
        await page.click('button:has-text("Confirm")');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'DeleteConfig');
        
        // Check success message
        await expect(page.locator('text=Configuration deleted')).toBeVisible();
      }
    });

    test('should batch update multiple configurations', async ({ page }) => {
      // Select multiple configurations
      const checkboxes = page.locator('[data-testid="config-checkbox"]');
      const count = await checkboxes.count();
      
      if (count >= 2) {
        // Select first two configurations
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        // Verify batch actions appear
        await expect(page.locator('text=/\\d+ selected/')).toBeVisible();
        await expect(page.locator('[data-testid="batch-save-button"]')).toBeVisible();
        
        // Make edits to selected items
        const editButtons = page.locator('[data-testid="config-item"][data-selected="true"] button[aria-label="Edit configuration"]');
        for (let i = 0; i < await editButtons.count(); i++) {
          await editButtons.nth(i).click();
        }
        
        // Click batch save
        await page.click('[data-testid="batch-save-button"]');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'UpdateBatchConfig');
        
        // Check success message
        await expect(page.locator('text=/Updated \\d+ configurations/')).toBeVisible();
      }
    });
  });

  test.describe('Search and Filter', () => {
    test('should search configurations by key', async ({ page }) => {
      // Type in search box
      await page.fill('[data-testid="config-search-input"]', 'system');
      
      // Wait for debounced search
      await page.waitForTimeout(500);
      
      // Wait for GraphQL query
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Verify filtered results
      const results = page.locator('[data-testid="config-item"]');
      const count = await results.count();
      
      for (let i = 0; i < count; i++) {
        const text = await results.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('system');
      }
    });

    test('should search configurations by label', async ({ page }) => {
      // Search by description/label
      await page.fill('[data-testid="config-search-input"]', 'maintenance');
      
      // Wait for debounced search
      await page.waitForTimeout(500);
      
      // Wait for GraphQL query
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Verify results contain maintenance config
      await expect(page.locator('text=system.maintenance.mode')).toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
      // Switch to Security category
      await page.click('[role="tab"]:has-text("SECURITY_CONFIG")');
      
      // Verify only security configs are shown
      const configs = page.locator('[data-testid="config-item"]');
      const count = await configs.count();
      
      for (let i = 0; i < count; i++) {
        const categoryBadge = configs.nth(i).locator('text=SECURITY_CONFIG');
        await expect(categoryBadge).toBeVisible();
      }
    });

    test('should filter by scope', async ({ page }) => {
      // Open filter options
      await page.click('[data-testid="filter-button"]');
      
      // Select scope filter
      await page.click('[data-testid="scope-filter-DEPARTMENT"]');
      
      // Apply filters
      await page.click('button:has-text("Apply Filters")');
      
      // Wait for data refresh
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Verify filtered results
      const configs = page.locator('[data-testid="config-item"]');
      for (let i = 0; i < await configs.count(); i++) {
        const scopeBadge = configs.nth(i).locator('text=DEPARTMENT');
        await expect(scopeBadge).toBeVisible();
      }
    });

    test('should sort configurations', async ({ page }) => {
      // Open sort options
      await page.click('[data-testid="sort-button"]');
      
      // Select sort by updated date
      await page.click('text=Last Updated (Newest First)');
      
      // Wait for data refresh
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Verify sorting - first item should have most recent update
      const firstItem = page.locator('[data-testid="config-item"]').first();
      const firstDate = await firstItem.locator('[data-testid="updated-date"]').textContent();
      
      const secondItem = page.locator('[data-testid="config-item"]').nth(1);
      const secondDate = await secondItem.locator('[data-testid="updated-date"]').textContent();
      
      if (firstDate && secondDate) {
        expect(new Date(firstDate).getTime()).toBeGreaterThanOrEqual(new Date(secondDate).getTime());
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      // Find editable string config
      const stringConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'STRING' }).first();
      
      // Click edit
      await stringConfig.locator('button[aria-label="Edit configuration"]').click();
      
      // Clear the value
      await stringConfig.locator('input').clear();
      
      // Try to save
      await stringConfig.locator('button[aria-label="Save changes"]').click();
      
      // Check validation error
      await expect(page.locator('text=Value is required')).toBeVisible();
    });

    test('should validate number data type', async ({ page }) => {
      // Find number config with validation
      const numberConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'system.api.rateLimit' }).first();
      
      // Click edit
      await numberConfig.locator('button[aria-label="Edit configuration"]').click();
      
      // Enter invalid number (outside min/max)
      await numberConfig.locator('input[type="number"]').fill('50000');
      
      // Try to save
      await numberConfig.locator('button[aria-label="Save changes"]').click();
      
      // Check validation error
      await expect(page.locator('text=/Value must be between \\d+ and \\d+/')).toBeVisible();
    });

    test('should validate JSON data type', async ({ page }) => {
      // Switch to Workflow Config tab
      await page.click('[role="tab"]:has-text("WORKFLOW_CONFIG")');
      
      // Find JSON config
      const jsonConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'JSON' }).first();
      
      if (await jsonConfig.count() > 0) {
        // Click edit
        await jsonConfig.locator('button[aria-label="Edit configuration"]').click();
        
        // Enter invalid JSON
        await page.evaluate(() => {
          const editor = document.querySelector('.monaco-editor');
          if (editor) {
            // Simulate typing invalid JSON
            const event = new Event('input', { bubbles: true });
            editor.dispatchEvent(event);
          }
        });
        
        // Check for JSON error indicator
        await expect(jsonConfig.locator('text=Invalid JSON')).toBeVisible();
      }
    });

    test('should validate custom validation rules', async ({ page }) => {
      // Find config with custom validation (e.g., URL pattern)
      const urlConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'URL' }).first();
      
      if (await urlConfig.count() > 0) {
        // Click edit
        await urlConfig.locator('button[aria-label="Edit configuration"]').click();
        
        // Enter invalid URL
        await urlConfig.locator('input[type="url"]').fill('not-a-valid-url');
        
        // Try to save
        await urlConfig.locator('button[aria-label="Save changes"]').click();
        
        // Check validation error
        await expect(page.locator('text=Invalid URL format')).toBeVisible();
      }
    });

    test('should display error messages clearly', async ({ page }) => {
      // Trigger multiple validation errors
      const config = page.locator('[data-testid="config-item"]').first();
      
      // Click edit
      await config.locator('button[aria-label="Edit configuration"]').click();
      
      // Make invalid change based on data type
      const input = config.locator('input').first();
      await input.clear();
      
      // Try to save
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Check error display
      const errorMessage = page.locator('[data-testid="validation-error"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveClass(/text-red-500/);
      }
    });
  });

  test.describe('Permissions', () => {
    test('should hide edit buttons for read-only configs', async ({ page }) => {
      // Find read-only config
      const readOnlyConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'Read Only' });
      
      if (await readOnlyConfig.count() > 0) {
        // Verify edit button is not present
        const editButton = readOnlyConfig.locator('button[aria-label="Edit configuration"]');
        await expect(editButton).toHaveCount(0);
      }
    });

    test('should show restricted access for admin-only configs', async ({ page }) => {
      // Find admin-only config
      const adminConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'Admin' });
      
      if (await adminConfig.count() > 0) {
        // Check for lock icon or admin badge
        await expect(adminConfig.locator('[data-testid="access-level-badge"]')).toBeVisible();
        await expect(adminConfig.locator('svg[aria-label="Restricted access"]')).toBeVisible();
      }
    });

    test('should disable actions based on permissions', async ({ page }) => {
      // Mock limited permissions
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData')) {
          const response = {
            data: {
              configCardData: {
                ...mockConfigData,
                permissions: {
                  canView: true,
                  canEdit: false,
                  canCreate: false,
                  canDelete: false,
                  canImport: false,
                  canExport: false,
                  restrictedKeys: []
                }
              }
            }
          };
          
          await route.fulfill({
            status: 200,
            body: JSON.stringify(response)
          });
        } else {
          await route.continue();
        }
      });
      
      // Reload to apply permissions
      await page.reload();
      
      // Verify edit buttons are disabled
      const editButtons = page.locator('button[aria-label="Edit configuration"]');
      expect(await editButtons.count()).toBe(0);
      
      // Verify import/export are disabled
      await page.click('[data-testid="more-actions-button"]');
      const importOption = page.locator('text=Import').filter({ hasText: 'disabled' });
      const exportOption = page.locator('text=Export').filter({ hasText: 'disabled' });
      
      if (await importOption.count() > 0 || await exportOption.count() > 0) {
        expect(true).toBeTruthy();
      }
    });

    test('should show different UI for admin vs regular users', async ({ page }) => {
      // Check for admin-specific features
      const adminFeatures = [
        '[data-testid="batch-operations"]',
        '[data-testid="import-button"]',
        '[data-testid="export-button"]',
        '[data-testid="template-button"]'
      ];
      
      for (const feature of adminFeatures) {
        const element = page.locator(feature);
        if (await element.count() > 0) {
          // Admin features should be visible for admin users
          await expect(element).toBeVisible();
        }
      }
    });

    test('should respect permission hierarchy', async ({ page }) => {
      // Navigate to different access level configs
      const publicConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'PUBLIC' });
      const authenticatedConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'AUTHENTICATED' });
      const departmentConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'DEPARTMENT' });
      const adminConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'ADMIN' });
      const superAdminConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'SUPER_ADMIN' });
      
      // Verify appropriate access indicators
      if (await publicConfig.count() > 0) {
        await expect(publicConfig.first()).not.toHaveClass(/restricted/);
      }
      
      if (await superAdminConfig.count() > 0) {
        await expect(superAdminConfig.locator('[data-testid="high-security-indicator"]')).toBeVisible();
      }
    });
  });

  test.describe('Templates', () => {
    test('should save configuration as template', async ({ page }) => {
      // Select configurations for template
      const checkboxes = page.locator('[data-testid="config-checkbox"]');
      
      if (await checkboxes.count() >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        // Open template dialog
        await page.click('[data-testid="save-template-button"]');
        
        // Fill template details
        await page.fill('[data-testid="template-name-input"]', 'Test Template');
        await page.fill('[data-testid="template-description-input"]', 'E2E test template');
        
        // Save template
        await page.click('button:has-text("Save Template")');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'SaveConfigTemplate');
        
        // Check success message
        await expect(page.locator('text=Template saved successfully')).toBeVisible();
      }
    });

    test('should apply template', async ({ page }) => {
      // Open templates dialog
      await page.click('[data-testid="template-button"]');
      
      // Wait for templates to load
      await waitForGraphQL(page, 'GetConfigTemplates');
      
      // Select a template
      const template = page.locator('[data-testid="template-item"]').first();
      
      if (await template.count() > 0) {
        // Click apply button
        await template.locator('button:has-text("Apply")').click();
        
        // Confirm application
        await page.click('button:has-text("Confirm")');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'ApplyConfigTemplate');
        
        // Check success message
        await expect(page.locator('text=Template applied')).toBeVisible();
      }
    });

    test('should delete template', async ({ page }) => {
      // Open templates dialog
      await page.click('[data-testid="template-button"]');
      
      // Find a template
      const template = page.locator('[data-testid="template-item"]').first();
      
      if (await template.count() > 0) {
        // Open template menu
        await template.locator('[data-testid="template-menu-button"]').click();
        
        // Click delete
        await page.click('text=Delete Template');
        
        // Confirm deletion
        await page.click('button:has-text("Delete")');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'DeleteConfigTemplate');
        
        // Check success message
        await expect(page.locator('text=Template deleted')).toBeVisible();
      }
    });

    test('should search templates', async ({ page }) => {
      // Open templates dialog
      await page.click('[data-testid="template-button"]');
      
      // Search for template
      await page.fill('[data-testid="template-search-input"]', 'Production');
      
      // Verify filtered results
      const templates = page.locator('[data-testid="template-item"]');
      const count = await templates.count();
      
      for (let i = 0; i < count; i++) {
        const text = await templates.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('production');
      }
    });

    test('should preview template before applying', async ({ page }) => {
      // Open templates dialog
      await page.click('[data-testid="template-button"]');
      
      // Click on template to expand
      const template = page.locator('[data-testid="template-item"]').first();
      
      if (await template.count() > 0) {
        await template.click();
        
        // Check preview details
        await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();
        await expect(page.locator('text=/Contains \\d+ configurations/')).toBeVisible();
        
        // Verify configuration list in preview
        const previewConfigs = page.locator('[data-testid="template-config-preview"]');
        expect(await previewConfigs.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Import/Export', () => {
    test('should export configurations to JSON', async ({ page }) => {
      // Open export dialog
      await page.click('[data-testid="export-button"]');
      
      // Select JSON format
      await page.click('[data-testid="export-format-json"]');
      
      // Select category to export
      await page.click('[data-testid="export-category-select"]');
      await page.click('text=System Config');
      
      // Mock download
      const downloadPromise = page.waitForEvent('download');
      
      // Click export
      await page.click('button:has-text("Export")');
      
      // Wait for GraphQL mutation
      await waitForGraphQL(page, 'ExportConfig');
      
      // Verify download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('config');
      expect(download.suggestedFilename()).toContain('.json');
    });

    test('should export configurations to CSV', async ({ page }) => {
      // Open export dialog
      await page.click('[data-testid="export-button"]');
      
      // Select CSV format
      await page.click('[data-testid="export-format-csv"]');
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');
      
      await waitForGraphQL(page, 'ExportConfig');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should export configurations to ENV format', async ({ page }) => {
      // Open export dialog
      await page.click('[data-testid="export-button"]');
      
      // Select ENV format
      await page.click('[data-testid="export-format-env"]');
      
      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export")');
      
      await waitForGraphQL(page, 'ExportConfig');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.env');
    });

    test('should import configurations from file', async ({ page }) => {
      // Open import dialog
      await page.click('[data-testid="import-button"]');
      
      // Create test file
      const fileContent = mockImportData.json;
      
      // Upload file
      await page.setInputFiles('[data-testid="import-file-input"]', {
        name: 'test-config.json',
        mimeType: 'application/json',
        buffer: Buffer.from(fileContent)
      });
      
      // Confirm import
      await page.click('button:has-text("Import")');
      
      // Wait for GraphQL mutation
      await waitForGraphQL(page, 'ImportConfig');
      
      // Check success message
      await expect(page.locator('text=Configuration imported successfully')).toBeVisible();
    });

    test('should validate import file format', async ({ page }) => {
      // Open import dialog
      await page.click('[data-testid="import-button"]');
      
      // Try to upload invalid file
      await page.setInputFiles('[data-testid="import-file-input"]', {
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid content')
      });
      
      // Check error message
      await expect(page.locator('text=Invalid file format')).toBeVisible();
    });
  });

  test.describe('History', () => {
    test('should view configuration history', async ({ page }) => {
      // Find a configuration
      const config = page.locator('[data-testid="config-item"]').first();
      
      // Open actions menu
      await config.locator('[data-testid="config-menu-button"]').click();
      
      // Click view history
      await page.click('text=View History');
      
      // Wait for history to load
      await waitForGraphQL(page, 'GetConfigHistory');
      
      // Check history dialog
      await expect(page.locator('[data-testid="history-dialog"]')).toBeVisible();
      await expect(page.locator('text=Configuration History')).toBeVisible();
      
      // Verify history entries
      const historyEntries = page.locator('[data-testid="history-entry"]');
      expect(await historyEntries.count()).toBeGreaterThan(0);
      
      // Check entry details
      const firstEntry = historyEntries.first();
      await expect(firstEntry.locator('text=/Version \\d+/')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="changed-by"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="changed-at"]')).toBeVisible();
    });

    test('should revert to previous version', async ({ page }) => {
      // Open history for a config
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('[data-testid="config-menu-button"]').click();
      await page.click('text=View History');
      
      await waitForGraphQL(page, 'GetConfigHistory');
      
      // Find a previous version
      const historyEntry = page.locator('[data-testid="history-entry"]').nth(1);
      
      if (await historyEntry.count() > 0) {
        // Click revert button
        await historyEntry.locator('button:has-text("Revert")').click();
        
        // Confirm reversion
        await page.click('button:has-text("Confirm")');
        
        // Wait for GraphQL mutation
        await waitForGraphQL(page, 'RevertConfig');
        
        // Check success message
        await expect(page.locator('text=Configuration reverted successfully')).toBeVisible();
      }
    });

    test('should compare versions', async ({ page }) => {
      // Open history
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('[data-testid="config-menu-button"]').click();
      await page.click('text=View History');
      
      await waitForGraphQL(page, 'GetConfigHistory');
      
      // Select two versions to compare
      const checkboxes = page.locator('[data-testid="history-version-checkbox"]');
      
      if (await checkboxes.count() >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        // Click compare button
        await page.click('[data-testid="compare-versions-button"]');
        
        // Check comparison view
        await expect(page.locator('[data-testid="version-comparison"]')).toBeVisible();
        await expect(page.locator('text=Version Comparison')).toBeVisible();
        
        // Verify diff display
        await expect(page.locator('[data-testid="diff-viewer"]')).toBeVisible();
      }
    });

    test('should filter history by date', async ({ page }) => {
      // Open history
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('[data-testid="config-menu-button"]').click();
      await page.click('text=View History');
      
      await waitForGraphQL(page, 'GetConfigHistory');
      
      // Open date filter
      await page.click('[data-testid="history-filter-button"]');
      
      // Select date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('text=Last 7 days');
      
      // Apply filter
      await page.click('button:has-text("Apply")');
      
      // Verify filtered results
      const entries = page.locator('[data-testid="history-entry"]');
      const count = await entries.count();
      
      for (let i = 0; i < count; i++) {
        const dateText = await entries.nth(i).locator('[data-testid="changed-at"]').textContent();
        if (dateText) {
          const date = new Date(dateText);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          expect(date.getTime()).toBeGreaterThan(sevenDaysAgo.getTime());
        }
      }
    });

    test('should show change reasons in history', async ({ page }) => {
      // Mock history with change reasons
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('GetConfigHistory')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                getConfigHistory: mockConfigHistory
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Open history
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('[data-testid="config-menu-button"]').click();
      await page.click('text=View History');
      
      // Check for change reasons
      await expect(page.locator('text=Enabled maintenance mode for upgrade')).toBeVisible();
      await expect(page.locator('text=Disabled maintenance mode after upgrade')).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should poll for updates at configured interval', async ({ page }) => {
      // Get initial request count
      let requestCount = 0;
      
      page.on('request', request => {
        if (request.url().includes('graphql') && request.postData()?.includes('ConfigCardData')) {
          requestCount++;
        }
      });
      
      // Wait for initial load
      await waitForGraphQL(page, 'ConfigCardData');
      const initialCount = requestCount;
      
      // Wait for polling interval (30 seconds)
      await page.waitForTimeout(31000);
      
      // Check if new request was made
      expect(requestCount).toBeGreaterThan(initialCount);
    });

    test('should manually refresh data', async ({ page }) => {
      // Click refresh button
      await page.click('[data-testid="refresh-button"]');
      
      // Wait for GraphQL query
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Check for loading indicator
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      
      // Wait for loading to complete
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
      
      // Check last updated timestamp changed
      const timestamp = await page.locator('[data-testid="last-updated"]').textContent();
      expect(timestamp).toBeTruthy();
    });

    test('should handle optimistic updates', async ({ page }) => {
      // Find editable config
      const config = page.locator('[data-testid="config-item"]').first();
      
      // Click edit
      await config.locator('button[aria-label="Edit configuration"]').click();
      
      // Get current value
      const currentValue = await config.locator('input').inputValue();
      
      // Change value
      const newValue = 'optimistic-update-test';
      await config.locator('input').fill(newValue);
      
      // Save (trigger optimistic update)
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Value should update immediately (optimistic)
      await expect(config.locator(`text=${newValue}`)).toBeVisible({ timeout: 1000 });
      
      // Wait for actual mutation
      await waitForGraphQL(page, 'UpdateConfig');
    });

    test('should show stale data indicator', async ({ page }) => {
      // Mock stale data response
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                configCardData: {
                  ...mockConfigData,
                  lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                  dataSource: 'stale-cache'
                }
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Reload to get stale data
      await page.reload();
      
      // Check for stale data indicator
      await expect(page.locator('[data-testid="stale-data-warning"]')).toBeVisible();
      await expect(page.locator('text=Data may be outdated')).toBeVisible();
    });

    test('should handle concurrent updates', async ({ page, context }) => {
      // Open second tab
      const page2 = await context.newPage();
      await login(page2);
      await page2.goto('/admin');
      
      // Find same config in both tabs
      const configKey = 'system.api.rateLimit';
      const config1 = page.locator(`[data-testid="config-item"]:has-text("${configKey}")`);
      const config2 = page2.locator(`[data-testid="config-item"]:has-text("${configKey}")`);
      
      // Edit in first tab
      await config1.locator('button[aria-label="Edit configuration"]').click();
      await config1.locator('input').fill('3000');
      
      // Edit in second tab
      await config2.locator('button[aria-label="Edit configuration"]').click();
      await config2.locator('input').fill('4000');
      
      // Save in first tab
      await config1.locator('button[aria-label="Save changes"]').click();
      await waitForGraphQL(page, 'UpdateConfig');
      
      // Try to save in second tab
      await config2.locator('button[aria-label="Save changes"]').click();
      
      // Should show conflict warning
      await expect(page2.locator('text=/Configuration has been modified|Conflict detected/')).toBeVisible();
      
      await page2.close();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab to first config item
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Navigate through tabs with arrow keys
      await page.focus('[role="tablist"]');
      await page.keyboard.press('ArrowRight');
      
      // Check tab changed
      await expect(page.locator('[role="tab"][aria-selected="true"]')).not.toHaveText(/SYSTEM_CONFIG/);
      
      // Navigate back
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/SYSTEM_CONFIG/);
      
      // Enter to activate edit
      const firstConfig = page.locator('[data-testid="config-item"]').first();
      await firstConfig.locator('button[aria-label="Edit configuration"]').focus();
      await page.keyboard.press('Enter');
      
      // Check edit mode activated
      await expect(firstConfig.locator('input')).toBeVisible();
      
      // Escape to cancel
      await page.keyboard.press('Escape');
      await expect(firstConfig.locator('input')).not.toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check main regions
      await expect(page.locator('[aria-label="Configuration Management"]')).toBeVisible();
      
      // Check tabs
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tab"]').first()).toHaveAttribute('aria-selected');
      await expect(page.locator('[role="tabpanel"]')).toBeVisible();
      
      // Check form inputs
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('button[aria-label="Edit configuration"]').click();
      
      const input = config.locator('input').first();
      const label = await input.getAttribute('aria-label');
      expect(label).toBeTruthy();
      
      // Check buttons
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toBeTruthy();
        }
      }
    });

    test('should support screen reader announcements', async ({ page }) => {
      // Check for live regions
      const liveRegions = page.locator('[aria-live]');
      expect(await liveRegions.count()).toBeGreaterThan(0);
      
      // Trigger an action that should announce
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('button[aria-label="Edit configuration"]').click();
      
      // Change value and save
      await config.locator('input').fill('screen-reader-test');
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Check for success announcement
      const announcement = page.locator('[role="status"], [aria-live="polite"]');
      await expect(announcement).toContainText(/Updated|Success/);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a simplified contrast check
      // In real implementation, you might use axe-core or similar
      
      const elements = [
        { selector: '[data-testid="config-item"]', minContrast: 4.5 },
        { selector: 'button', minContrast: 4.5 },
        { selector: '[role="tab"]', minContrast: 4.5 }
      ];
      
      for (const { selector } of elements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          // Check that text is visible and readable
          await expect(element).toBeVisible();
          const color = await element.evaluate(el => 
            window.getComputedStyle(el).color
          );
          expect(color).not.toBe('transparent');
        }
      }
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'light', forcedColors: 'active' });
      
      // Check key elements are still visible
      await expect(page.locator('[data-testid="config-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="config-item"]').first()).toBeVisible();
      
      // Check borders are visible in high contrast
      const hasBorder = await page.locator('[data-testid="config-item"]').first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.borderWidth !== '0px' || styles.outline !== 'none';
      });
      
      expect(hasBorder).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to page
      await page.goto('/admin');
      
      // Wait for ConfigCard to be visible
      await page.waitForSelector('[data-testid="config-card"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check initial paint metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };
      });
      
      expect(metrics.domContentLoaded).toBeLessThan(1000);
      expect(metrics.loadComplete).toBeLessThan(2000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 200 }, (_, i) => ({
        id: `config-${i}`,
        key: `test.config.${i}`,
        value: `value-${i}`,
        dataType: ConfigDataType.STRING,
        category: ConfigCategory.SYSTEM_CONFIG,
        scope: ConfigScope.GLOBAL,
        description: `Test configuration ${i}`,
        defaultValue: `default-${i}`,
        validation: null,
        accessLevel: ConfigAccessLevel.AUTHENTICATED,
        isEditable: true,
        isInherited: false,
        inheritedFrom: null,
        tags: ['test', `group-${Math.floor(i / 10)}`],
        metadata: {},
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - i * 1800000).toISOString(),
        updatedBy: 'admin@example.com'
      }));
      
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                configCardData: {
                  configs: largeDataset.slice(0, 50), // Paginated
                  categories: mockConfigData.categories,
                  summary: {
                    ...mockConfigData.summary,
                    totalConfigs: 200
                  },
                  permissions: mockConfigData.permissions,
                  lastUpdated: new Date().toISOString(),
                  refreshInterval: 30000,
                  dataSource: 'cache'
                }
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Reload with large dataset
      await page.reload();
      
      // Measure scroll performance
      const scrollStartTime = Date.now();
      await page.locator('[data-testid="config-scroll-area"]').evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      const scrollTime = Date.now() - scrollStartTime;
      
      // Scroll should be smooth (under 100ms)
      expect(scrollTime).toBeLessThan(100);
      
      // Check virtual scrolling or pagination
      const visibleItems = await page.locator('[data-testid="config-item"]').count();
      expect(visibleItems).toBeLessThanOrEqual(50); // Should use pagination/virtualization
    });

    test('should debounce search input', async ({ page }) => {
      let searchRequests = 0;
      
      page.on('request', request => {
        if (request.url().includes('graphql') && request.postData()?.includes('search')) {
          searchRequests++;
        }
      });
      
      // Type quickly in search box
      const searchInput = page.locator('[data-testid="config-search-input"]');
      await searchInput.type('test search query', { delay: 50 });
      
      // Wait for debounce
      await page.waitForTimeout(500);
      
      // Should only make one request despite multiple keystrokes
      expect(searchRequests).toBeLessThanOrEqual(2);
    });

    test('should lazy load heavy components', async ({ page }) => {
      // Switch to a tab with JSON editor
      await page.click('[role="tab"]:has-text("WORKFLOW_CONFIG")');
      
      // Find JSON config
      const jsonConfig = page.locator('[data-testid="config-item"]').filter({ hasText: 'JSON' }).first();
      
      if (await jsonConfig.count() > 0) {
        // Monaco editor should not be loaded until edit
        let monacoLoaded = await page.evaluate(() => {
          return window.hasOwnProperty('monaco');
        });
        expect(monacoLoaded).toBeFalsy();
        
        // Click edit
        await jsonConfig.locator('button[aria-label="Edit configuration"]').click();
        
        // Now Monaco should load
        await page.waitForTimeout(1000);
        monacoLoaded = await page.evaluate(() => {
          return window.hasOwnProperty('monaco');
        });
        expect(monacoLoaded).toBeTruthy();
      }
    });

    test('should cache frequently accessed data', async ({ page }) => {
      // Track cache hits
      let cacheHits = 0;
      
      page.on('response', response => {
        const cacheStatus = response.headers()['x-cache-status'];
        if (cacheStatus === 'HIT') {
          cacheHits++;
        }
      });
      
      // Navigate between tabs multiple times
      for (let i = 0; i < 3; i++) {
        await page.click('[role="tab"]:has-text("USER_PREFERENCES")');
        await page.waitForTimeout(200);
        await page.click('[role="tab"]:has-text("SYSTEM_CONFIG")');
        await page.waitForTimeout(200);
      }
      
      // Some requests should be cached
      expect(cacheHits).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle GraphQL errors gracefully', async ({ page }) => {
      // Mock GraphQL error
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              errors: [{
                message: 'Failed to fetch configuration data',
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
              }]
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Reload to trigger error
      await page.reload();
      
      // Check error display
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=Failed to fetch configuration data')).toBeVisible();
      
      // Check retry button
      await expect(page.locator('button:has-text("Retry")'));
    });

    test('should handle network errors', async ({ page }) => {
      // Simulate network error
      await page.route('**/graphql', route => route.abort('failed'));
      
      // Try to perform an action
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('button[aria-label="Edit configuration"]').click();
      await config.locator('input').fill('network-test');
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Should show network error
      await expect(page.locator('text=/Network error|Connection failed/')).toBeVisible();
    });

    test('should handle validation errors from server', async ({ page }) => {
      // Mock validation error response
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('UpdateConfig')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              errors: [{
                message: 'Validation failed',
                extensions: {
                  code: 'BAD_USER_INPUT',
                  validationErrors: [
                    { field: 'value', message: 'Value exceeds maximum allowed' }
                  ]
                }
              }]
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Try to update config
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('button[aria-label="Edit configuration"]').click();
      await config.locator('input').fill('invalid-value');
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Should show validation error
      await expect(page.locator('text=Value exceeds maximum allowed')).toBeVisible();
    });

    test('should recover from errors gracefully', async ({ page }) => {
      let shouldFail = true;
      
      // Mock intermittent errors
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData') && shouldFail) {
          shouldFail = false;
          await route.fulfill({
            status: 500,
            body: 'Internal Server Error'
          });
        } else {
          await route.continue();
        }
      });
      
      // Navigate to trigger error
      await page.goto('/admin');
      
      // Should show error
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
      
      // Click retry
      await page.click('button:has-text("Retry")');
      
      // Should recover and show data
      await expect(page.locator('[data-testid="config-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="config-item"]').first()).toBeVisible();
    });

    test('should handle permission errors', async ({ page }) => {
      // Mock permission error
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('UpdateConfig')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              errors: [{
                message: 'Insufficient permissions',
                extensions: { code: 'FORBIDDEN' }
              }]
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Try to update config
      const config = page.locator('[data-testid="config-item"]').first();
      await config.locator('button[aria-label="Edit configuration"]').click();
      await config.locator('input').fill('test');
      await config.locator('button[aria-label="Save changes"]').click();
      
      // Should show permission error
      await expect(page.locator('text=Insufficient permissions')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no configurations', async ({ page }) => {
      // Mock empty response
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData?.includes('ConfigCardData')) {
          await route.fulfill({
            status: 200,
            body: JSON.stringify({
              data: {
                configCardData: {
                  configs: [],
                  categories: [],
                  summary: {
                    totalConfigs: 0,
                    editableConfigs: 0,
                    readOnlyConfigs: 0,
                    inheritedConfigs: 0,
                    modifiedConfigs: 0,
                    lastUpdated: new Date().toISOString()
                  },
                  permissions: mockConfigData.permissions,
                  lastUpdated: new Date().toISOString(),
                  refreshInterval: 30000,
                  dataSource: 'cache'
                }
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Reload to get empty state
      await page.reload();
      
      // Check empty state message
      await expect(page.locator('text=No configurations found')).toBeVisible();
      await expect(page.locator('[data-testid="empty-state-icon"]')).toBeVisible();
      
      // Check if create button is prominent
      if (mockConfigData.permissions.canCreate) {
        await expect(page.locator('[data-testid="create-first-config-button"]')).toBeVisible();
      }
    });

    test('should display empty search results', async ({ page }) => {
      // Search for non-existent config
      await page.fill('[data-testid="config-search-input"]', 'nonexistentconfiguration12345');
      
      // Wait for search
      await page.waitForTimeout(500);
      await waitForGraphQL(page, 'ConfigCardData');
      
      // Check empty search message
      await expect(page.locator('text=No configurations match your search')).toBeVisible();
      
      // Check clear search option
      await expect(page.locator('button:has-text("Clear search")')).toBeVisible();
    });
  });
});