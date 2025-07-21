/**
 * InventoryService Test Suite
 * Tests for inventory field mapping, update calculations, negative stock protection, and concurrent updates
 */

import {
  getInventoryColumn,
  updateInventoryForVoid,
  updateStockLevel
} from '../inventoryService';
import { createClient } from '@/app/utils/supabase/server';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';
import { createSupabaseResponse, createSupabaseError } from '@/__tests__/mocks/factories';
import { useTestCleanup } from '@/__tests__/utils/cleanup';

// Mock Supabase client
jest.mock('@/app/utils/supabase/server');

// Mock LocationMapper
jest.mock('@/lib/inventory/utils/locationMapper');

// Mock console for production check
const originalEnv = process.env.NODE_ENV;
const originalConsoleLog = console.log;

describe('InventoryService', () => {
  const mockSupabase = {
    from: jest.fn(),
    rpc: jest.fn(),
  };

  const { cleanup, registerCleanup } = useTestCleanup();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    console.log = jest.fn();
  });

  afterEach(async () => {
    await cleanup();
    console.log = originalConsoleLog;
    // 恢復原始 NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
      enumerable: true
    });
  });

  describe('getInventoryColumn - Field Mapping', () => {
    beforeEach(() => {
      // Reset LocationMapper mock
      (LocationMapper.toDbColumn as jest.Mock).mockClear();
    });

    test('should map location to correct database column', () => {
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('pipeline');

      const result = getInventoryColumn('PIPELINE');

      expect(LocationMapper.toDbColumn).toHaveBeenCalledWith('PIPELINE');
      expect(result).toBe('pipeline');
    });

    test('should return injection as default for null location', () => {
      const result = getInventoryColumn(null);

      expect(result).toBe('injection');
      expect(LocationMapper.toDbColumn).not.toHaveBeenCalled();
    });

    test('should return injection as default for empty location', () => {
      const result = getInventoryColumn('');

      expect(result).toBe('injection');
      expect(LocationMapper.toDbColumn).not.toHaveBeenCalled();
    });

    test('should handle unmapped locations with default', () => {
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue(null);

      const result = getInventoryColumn('UNKNOWN_LOCATION');

      expect(LocationMapper.toDbColumn).toHaveBeenCalledWith('UNKNOWN_LOCATION');
      expect(result).toBe('injection');
    });

    test('should log mapping in non-production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
        enumerable: true
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('bulk');

      getInventoryColumn('BULK');

      expect(console.log).toHaveBeenCalledWith(
        '[Inventory as string] Mapping location "BULK" to inventory column'
      );
      expect(console.log).toHaveBeenCalledWith(
        '[Inventory as string] Location "BULK" mapped to column "bulk"'
      );
    });

    test('should not log mapping in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
        enumerable: true
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('bulk');

      getInventoryColumn('BULK');

      expect(console.log).not.toHaveBeenCalled();
    });

    test('should map all standard locations correctly', () => {
      const locationMappings = [
        ['PRODUCTION', 'injection'],
        ['PIPELINE', 'pipeline'],
        ['PREBOOK', 'prebook'],
        ['AWAITING', 'await'],
        ['FOLD', 'fold'],
        ['BULK', 'bulk'],
        ['BACK_CARPARK', 'backcarpark'],
        ['DAMAGE', 'damage'],
        ['AWAIT_GRN', 'await_grn'],
      ];

      locationMappings.forEach(([location, expectedColumn]) => {
        (LocationMapper.toDbColumn as jest.Mock).mockReturnValue(expectedColumn);

        const result = getInventoryColumn(location);

        expect(result).toBe(expectedColumn);
      });
    });
  });

  describe('updateInventoryForVoid - Inventory Update Logic', () => {
    const mockInventoryInsert = {
      insert: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
      mockSupabase.from.mockReturnValue(mockInventoryInsert);
      mockInventoryInsert.insert.mockClear();
    });

    test('should update inventory successfully for void operation', async () => {
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse({}));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('pipeline');

      const result = await updateInventoryForVoid(
        'PROD123',
        100,
        'PIPELINE',
        'PLT12345678'
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('record_inventory');
      expect(mockInventoryInsert.insert).toHaveBeenCalledWith({
        product_code: 'PROD123',
        latest_update: expect.any(String),
        plt_num: 'PLT12345678',
        pipeline: -100, // Negative value for deduction
      });
    });

    test('should handle damage quantity correctly', async () => {
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse({}));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('bulk');

      const result = await updateInventoryForVoid(
        'PROD456',
        150,
        'BULK',
        'PLT87654321',
        50 // 50 items damaged
      );

      expect(result.success).toBe(true);
      expect(mockInventoryInsert.insert).toHaveBeenCalledWith({
        product_code: 'PROD456',
        latest_update: expect.any(String),
        plt_num: 'PLT87654321',
        bulk: -150,
        damage: 50,
      });
    });

    test('should ignore zero damage quantity', async () => {
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse({}));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('fold');

      await updateInventoryForVoid(
        'PROD789',
        100,
        'FOLD',
        'PLT11111111',
        0
      );

      expect(mockInventoryInsert.insert).toHaveBeenCalledWith({
        product_code: 'PROD789',
        latest_update: expect.any(String),
        plt_num: 'PLT11111111',
        fold: -100,
        // damage field should not be included
      });
    });

    test('should handle database errors', async () => {
      const error = createSupabaseError('Duplicate key violation');
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse(null, error));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('injection');

      const result = await updateInventoryForVoid(
        'PROD999',
        200,
        'PRODUCTION',
        'PLT22222222'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate key violation');
    });

    test('should handle unexpected errors', async () => {
      mockInventoryInsert.insert.mockRejectedValue(new Error('Network error'));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('injection');

      const result = await updateInventoryForVoid(
        'PROD999',
        200,
        'PRODUCTION',
        'PLT22222222'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should use default location when location is null', async () => {
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse({}));

      await updateInventoryForVoid(
        'PROD111',
        50,
        null,
        'PLT33333333'
      );

      expect(mockInventoryInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          injection: -50, // Default location
        })
      );
    });

    test('should log operations in non-production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
        enumerable: true
      });
      mockInventoryInsert.insert.mockResolvedValue(createSupabaseResponse({}));
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('pipeline');

      await updateInventoryForVoid(
        'PROD123',
        100,
        'PIPELINE',
        'PLT12345678'
      );

      expect(console.log).toHaveBeenCalledWith(
        '[Inventory as string] Successfully updated inventory:',
        expect.objectContaining({
          product_code: 'PROD123',
          pipeline: -100,
        })
      );
    });
  });

  describe('updateStockLevel - Stock Level Updates', () => {
    describe('Basic Operations', () => {
      test('should update stock level for void operation', async () => {
        const mockResult = 'PROD123 - from 1000 to 900';
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse(mockResult));

        const result = await updateStockLevel('PROD123', 100, 'void');

        expect(result.success).toBe(true);
        expect(result.result).toBe(mockResult);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('update_stock_level_void', {
          p_product_code: 'PROD123',
          p_quantity: 100,
          p_operation: 'void',
        });
      });

      test('should update stock level for damage operation', async () => {
        const mockResult = 'PROD456 - from 500 to 450';
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse(mockResult));

        const result = await updateStockLevel('PROD456', 50, 'damage');

        expect(result.success).toBe(true);
        expect(result.result).toBe(mockResult);
        expect(mockSupabase.rpc).toHaveBeenCalledWith('update_stock_level_void', {
          p_product_code: 'PROD456',
          p_quantity: 50,
          p_operation: 'damage',
        });
      });

      test('should handle RPC errors', async () => {
        const error = createSupabaseError('Product code cannot be empty');
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse(null, error));

        const result = await updateStockLevel('', 100, 'void');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Product code cannot be empty');
      });

      test('should handle unexpected errors', async () => {
        mockSupabase.rpc.mockRejectedValue(new Error('Connection timeout'));

        const result = await updateStockLevel('PROD789', 100, 'void');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Connection timeout');
      });
    });

    describe('Negative Stock Protection', () => {
      test('should handle negative stock scenarios', async () => {
        // RPC function should handle negative stock internally
        const mockResult = 'PROD123 - from 50 to -50';
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse(mockResult));

        const result = await updateStockLevel('PROD123', 100, 'void');

        expect(result.success).toBe(true);
        expect(result.result).toContain('-50');
      });

      test('should create new record with negative stock if product not found', async () => {
        const mockResult = 'NEWPROD - new record with -100';
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse(mockResult));

        const result = await updateStockLevel('NEWPROD', 100, 'void');

        expect(result.success).toBe(true);
        expect(result.result).toBe(mockResult);
      });
    });

    describe('Logging', () => {
      test('should log operations in non-production', async () => {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'development',
          writable: true,
          configurable: true,
          enumerable: true
        });
        mockSupabase.rpc.mockResolvedValue(createSupabaseResponse('Success'));

        await updateStockLevel('PROD123', 100, 'void');

        expect(console.log).toHaveBeenCalledWith(
          '[Stock Level] Updating:',
          {
            product_code: 'PROD123',
            quantity: 100,
            operation: 'void',
          }
        );
        expect(console.log).toHaveBeenCalledWith(
          '[Stock Level] Updated successfully:',
          'Success'
        );
      });
    });
  });

  describe('Concurrent Update Handling', () => {
    test('should handle multiple concurrent void operations', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue(createSupabaseResponse({})),
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('pipeline');

      const operations = [
        updateInventoryForVoid('PROD1', 100, 'PIPELINE', 'PLT001'),
        updateInventoryForVoid('PROD2', 200, 'PIPELINE', 'PLT002'),
        updateInventoryForVoid('PROD3', 150, 'PIPELINE', 'PLT003'),
        updateInventoryForVoid('PROD4', 75, 'PIPELINE', 'PLT004'),
        updateInventoryForVoid('PROD5', 125, 'PIPELINE', 'PLT005'),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledTimes(5);
    });

    test('should isolate errors in concurrent operations', async () => {
      const mockInsert = jest.fn()
        .mockResolvedValueOnce(createSupabaseResponse({}))
        .mockResolvedValueOnce(createSupabaseResponse(null, createSupabaseError('Error')))
        .mockResolvedValueOnce(createSupabaseResponse({}));

      mockSupabase.from.mockReturnValue({ insert: mockInsert });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('bulk');

      const operations = [
        updateInventoryForVoid('PROD1', 100, 'BULK', 'PLT001'),
        updateInventoryForVoid('PROD2', 200, 'BULK', 'PLT002'), // This will fail
        updateInventoryForVoid('PROD3', 150, 'BULK', 'PLT003'),
      ];

      const results = await Promise.allSettled(operations);

      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as any).value.success).toBe(true);

      expect(results[1].status).toBe('fulfilled');
      expect((results[1] as any).value.success).toBe(false);

      expect(results[2].status).toBe('fulfilled');
      expect((results[2] as any).value.success).toBe(true);
    });

    test('should handle concurrent stock level updates', async () => {
      mockSupabase.rpc.mockResolvedValue(createSupabaseResponse('Success'));

      const operations = Array.from({ length: 10 }, (_, i) =>
        updateStockLevel(`PROD${i}`, (i + 1) * 10, 'void')
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(10);

      // Verify each call had different parameters
      for (let i = 0; i < 10; i++) {
        expect(mockSupabase.rpc).toHaveBeenCalledWith('update_stock_level_void', {
          p_product_code: `PROD${i}`,
          p_quantity: (i + 1) * 10,
          p_operation: 'void',
        });
      }
    });

    test('should handle mixed operation types concurrently', async () => {
      mockSupabase.rpc.mockResolvedValue(createSupabaseResponse('Success'));
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue(createSupabaseResponse({})),
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('pipeline');

      const operations = [
        updateStockLevel('PROD1', 100, 'void'),
        updateInventoryForVoid('PROD2', 200, 'PIPELINE', 'PLT002'),
        updateStockLevel('PROD3', 150, 'damage'),
        updateInventoryForVoid('PROD4', 75, 'PIPELINE', 'PLT004', 25),
        updateStockLevel('PROD5', 125, 'void'),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(3); // 3 stock level updates
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // 2 inventory updates
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle empty product code in inventory update', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue(createSupabaseResponse({})),
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('injection');

      const result = await updateInventoryForVoid('', 100, 'PRODUCTION', 'PLT123');

      expect(result.success).toBe(true);
      // Should still attempt the insert with empty product code
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    test('should handle zero quantity in inventory update', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue(createSupabaseResponse({})),
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('injection');

      const result = await updateInventoryForVoid('PROD123', 0, 'PRODUCTION', 'PLT123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalled();
    });

    test('should handle very large quantities', async () => {
      mockSupabase.rpc.mockResolvedValue(createSupabaseResponse('Success'));

      const result = await updateStockLevel('PROD123', 999999999, 'void');

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_stock_level_void', {
        p_product_code: 'PROD123',
        p_quantity: 999999999,
        p_operation: 'void',
      });
    });

    test('should handle special characters in product codes', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue(createSupabaseResponse({})),
      });
      (LocationMapper.toDbColumn as jest.Mock).mockReturnValue('injection');

      const specialProductCode = "PROD-123/456'789";
      const result = await updateInventoryForVoid(
        specialProductCode,
        100,
        'PRODUCTION',
        'PLT123'
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
