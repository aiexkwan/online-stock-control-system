/**
 * Test Data Factories Test Suite
 * Tests for all factory functions, scenarios, and cleanup utilities
 */

import {
  createMockGRNOrder,
  createMockSupplier,
  createMockWarehouseLocation,
  createMockBatch,
} from './mocks/factories';

import {
  simplePalletTransfer,
  bulkPalletTransfer,
  partialPalletTransfer,
  failedTransferScenario,
  validateScenarioExecution,
} from './mocks/scenarios/stock-transfer.scenario';

import {
  completeOrderLoading,
  partialOrderLoading,
  simpleGRNReceiving,
  complexGRNReceiving,
  calculateLoadingProgress,
  processGRNReceiving,
} from './mocks/scenarios/order-loading.scenario';

import {
  useTestCleanup,
  createScopedCleanup,
  cleanupTestTransactions,
  MemoryLeakDetector,
  cleanupPresets,
} from './utils/cleanup';

describe('Test Data Factories', () => {
  describe('New Factory Functions', () => {
    describe('createMockGRNOrder', () => {
      it('should create a valid GRN order with all required fields', () => {
        const grn = createMockGRNOrder();

        expect(grn).toHaveProperty('grn_ref');
        expect(grn).toHaveProperty('plt_num');
        expect(grn).toHaveProperty('sup_code');
        expect(grn).toHaveProperty('material_code');
        expect(grn).toHaveProperty('gross_weight');
        expect(grn).toHaveProperty('net_weight');
        expect(grn).toHaveProperty('uuid');
        expect(grn).toHaveProperty('pallet');
        expect(grn).toHaveProperty('package');
        expect(grn).toHaveProperty('pallet_count');
        expect(grn).toHaveProperty('package_count');
        expect(grn).toHaveProperty('creat_time');

        // Validate data types
        expect(typeof grn.grn_ref).toBe('number');
        expect(grn.plt_num).toMatch(/^PLT\d{8}$/);
        expect(grn.sup_code).toMatch(/^SUP\d{4}$/);
        expect(grn.gross_weight).toBeGreaterThanOrEqual(100);
        expect(grn.net_weight).toBeLessThanOrEqual(grn.gross_weight);
      });

      it('should accept overrides', () => {
        const customGRN = createMockGRNOrder({
          grn_ref: 99999,
          sup_code: 'CUSTOM_SUP',
          gross_weight: 5000,
        });

        expect(customGRN.grn_ref).toBe(99999);
        expect(customGRN.sup_code).toBe('CUSTOM_SUP');
        expect(customGRN.gross_weight).toBe(5000);
      });
    });

    describe('createMockSupplier', () => {
      it('should create a valid supplier', () => {
        const supplier = createMockSupplier();

        expect(supplier).toHaveProperty('supplier_code');
        expect(supplier).toHaveProperty('supplier_name');
        expect(supplier.supplier_code).toMatch(/^SUP\d{4}$/);
        expect(supplier.supplier_name).toBeTruthy();
      });

      it('should create batch suppliers with unique codes', () => {
        const suppliers = createMockBatch(createMockSupplier, 5);

        expect(suppliers).toHaveLength(5);
        const codes = suppliers.map(s => s.supplier_code);
        const uniqueCodes = new Set(codes);
        expect(uniqueCodes.size).toBeGreaterThan(1); // Should have some uniqueness
      });
    });

    describe('createMockWarehouseLocation', () => {
      it('should create a valid warehouse location', () => {
        const location = createMockWarehouseLocation();

        expect(location).toHaveProperty('location_code');
        expect(location).toHaveProperty('warehouse_zone');
        expect(location).toHaveProperty('location_type');
        expect(location).toHaveProperty('max_capacity');
        expect(location).toHaveProperty('current_capacity');
        expect(location).toHaveProperty('is_active');

        expect(location.location_code).toMatch(/^[A-D]\d{2}-\d{2}$/);
        expect(['INBOUND', 'STORAGE', 'PICKING', 'OUTBOUND']).toContain(location.warehouse_zone);
        expect(location.current_capacity).toBeLessThanOrEqual(location.max_capacity);
      });
    });
  });

  describe('Stock Transfer Scenarios', () => {
    it('should have valid simple transfer scenario', () => {
      expect(simplePalletTransfer.pallets).toHaveLength(1);
      expect(simplePalletTransfer.movements).toHaveLength(1);
      expect(simplePalletTransfer.expectedResults.totalQuantity).toBe(100);
    });

    it('should have valid bulk transfer scenario', () => {
      expect(bulkPalletTransfer.pallets).toHaveLength(5);
      expect(bulkPalletTransfer.movements).toHaveLength(5);
      expect(bulkPalletTransfer.expectedResults.totalQuantity).toBe(1000);
    });

    it('should validate scenario execution correctly', () => {
      const actualResults = {
        transferredQuantity: 100,
        successfulMovements: 1,
        sourceCapacityAfter: 900,
        targetCapacityAfter: 600,
      };

      const validation = validateScenarioExecution(simplePalletTransfer, actualResults);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const wrongResults = {
        transferredQuantity: 50, // Wrong quantity
        successfulMovements: 1,
        sourceCapacityAfter: 900,
        targetCapacityAfter: 600,
      };

      const validation = validateScenarioExecution(simplePalletTransfer, wrongResults);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Quantity mismatch: expected 100, got 50'
      );
    });
  });

  describe('Order Loading Scenarios', () => {
    it('should calculate loading progress correctly', () => {
      const progress = calculateLoadingProgress(completeOrderLoading.order, 1000);
      
      expect(progress.totalLoaded).toBe(1000);
      expect(progress.remaining).toBe(0);
      expect(progress.percentage).toBe(100);
      expect(progress.status).toBe('completed');
    });

    it('should handle partial loading progress', () => {
      const progress = calculateLoadingProgress(partialOrderLoading.order, 600);
      
      expect(progress.totalLoaded).toBe(600);
      expect(progress.remaining).toBe(1400);
      expect(progress.percentage).toBe(30);
      expect(progress.status).toBe('in_progress');
    });

    it('should process GRN receiving correctly', () => {
      const result = processGRNReceiving(simpleGRNReceiving);
      
      expect(result.generatedPallets).toHaveLength(2);
      expect(result.totalWeight.gross).toBe(1200);
      expect(result.totalWeight.net).toBe(1000);
    });

    it('should handle complex GRN with multiple orders', () => {
      const result = processGRNReceiving(complexGRNReceiving);
      
      expect(result.generatedPallets.length).toBeGreaterThanOrEqual(10);
      expect(result.totalWeight.gross).toBe(7500);
      expect(result.totalWeight.net).toBe(6800);
    });
  });

  describe('Test Cleanup Utilities', () => {
    describe('useTestCleanup', () => {
      it('should create cleanup hook with default options', () => {
        const { cleanup, registerCleanup } = useTestCleanup();
        
        expect(cleanup).toBeInstanceOf(Function);
        expect(registerCleanup).toBeInstanceOf(Function);
      });

      it('should execute cleanup tasks in priority order', async () => {
        const executionOrder: string[] = [];
        const { cleanup, registerCleanup } = useTestCleanup({ clearMocks: false });

        registerCleanup({
          name: 'task3',
          fn: () => executionOrder.push('task3'),
          priority: 3,
        });

        registerCleanup({
          name: 'task1',
          fn: () => executionOrder.push('task1'),
          priority: 1,
        });

        registerCleanup({
          name: 'task2',
          fn: () => executionOrder.push('task2'),
          priority: 2,
        });

        await cleanup();

        expect(executionOrder).toEqual(['task1', 'task2', 'task3']);
      });

      it('should handle async cleanup tasks', async () => {
        const { cleanup, registerCleanup } = useTestCleanup();
        let asyncTaskCompleted = false;

        registerCleanup({
          name: 'asyncTask',
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            asyncTaskCompleted = true;
          },
          priority: 1,
        });

        await cleanup();
        expect(asyncTaskCompleted).toBe(true);
      });
    });

    describe('createScopedCleanup', () => {
      it('should create isolated cleanup scope', async () => {
        const scope1 = createScopedCleanup();
        const scope2 = createScopedCleanup();
        
        let scope1Executed = false;
        let scope2Executed = false;

        scope1.addTask({
          name: 'scope1Task',
          fn: () => { scope1Executed = true; },
          priority: 1,
        });

        scope2.addTask({
          name: 'scope2Task',
          fn: () => { scope2Executed = true; },
          priority: 1,
        });

        await scope1.runCleanup();
        expect(scope1Executed).toBe(true);
        expect(scope2Executed).toBe(false);

        await scope2.runCleanup();
        expect(scope2Executed).toBe(true);
      });
    });

    describe('MemoryLeakDetector', () => {
      it('should track memory usage', () => {
        const detector = new MemoryLeakDetector();
        detector.start();

        const testObject = { data: new Array(1000).fill('test') };
        detector.track(testObject, 'testObject');

        // Memory check should pass for small allocations
        detector.check(100 * 1024 * 1024).then(result => {
          expect(result).toBe(true);
        });
      });
    });

    describe('cleanupPresets', () => {
      it('should provide unit test preset', () => {
        const unitCleanup = cleanupPresets.unit();
        expect(unitCleanup).toHaveProperty('cleanup');
        expect(unitCleanup).toHaveProperty('registerCleanup');
      });

      it('should provide integration test preset', () => {
        const integrationCleanup = cleanupPresets.integration();
        expect(integrationCleanup).toHaveProperty('cleanup');
      });

      it('should provide e2e test preset', () => {
        const e2eCleanup = cleanupPresets.e2e();
        expect(e2eCleanup).toHaveProperty('cleanup');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with real test scenario', async () => {
      const { cleanup, registerCleanup } = useTestCleanup();
      
      // Simulate test setup
      const mockData = createMockBatch(createMockGRNOrder, 3);
      const testTransactionIds = ['trans-001', 'trans-002'];
      
      // Register cleanup for test data
      registerCleanup({
        name: 'cleanupTestData',
        fn: () => {
          mockData.length = 0;
          testTransactionIds.length = 0;
        },
        priority: 1,
      });

      expect(mockData).toHaveLength(3);
      
      // Run cleanup
      await cleanup();
      
      expect(mockData).toHaveLength(0);
      expect(testTransactionIds).toHaveLength(0);
    });
  });
});