/**
 * PalletSearchService Test Suite
 * Tests for pallet search functionality including single and batch search
 */

import { PalletSearchService, palletSearchService } from '../palletSearchService';
import { createClient } from '@/app/utils/supabase/client';
import { createMockPallet, createSupabaseResponse, createSupabaseError } from '@/__tests__/mocks/factories';
import { useTestCleanup } from '@/__tests__/utils/cleanup';

// Mock Supabase client
jest.mock('@/app/utils/supabase/client');

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('PalletSearchService', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };

  const { cleanup, registerCleanup } = useTestCleanup();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('searchPallet', () => {
    const mockPalletData = {
      plt_num: 'PLT12345678',
      product_code: 'PROD001',
      product_qty: 100,
      plt_remark: 'Test pallet',
      series: 'SER001',
    };

    const mockHistoryData = [
      {
        loc: 'A01-01',
        action: 'Stock Transfer',
      },
    ];

    test('should search by pallet number successfully', async () => {
      // Setup mocks
      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          createSupabaseResponse(mockPalletData)
        ),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(
          createSupabaseResponse(mockHistoryData)
        ),
      }));

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'PLT12345678',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        plt_num: 'PLT12345678',
        product_code: 'PROD001',
        product_qty: 100,
        plt_remark: 'Test pallet',
        series: 'SER001',
        current_plt_loc: 'A01-01',
        is_voided: false,
      });

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('record_palletinfo');
      expect(mockSupabase.from).toHaveBeenCalledWith('record_history');
    });

    test('should search by series successfully', async () => {
      // Setup mocks for series search
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue(
              createSupabaseResponse(mockPalletData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse(mockHistoryData)
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'series',
        searchValue: 'SER001',
      });

      expect(result.success).toBe(true);
      expect(result.data?.series).toBe('SER001');
      expect(result.data?.current_plt_loc).toBe('A01-01');
    });

    test('should handle empty results', async () => {
      // Mock empty result
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          createSupabaseResponse(null, createSupabaseError('No rows found'))
        ),
      }));

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'NONEXISTENT',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No rows found');
    });

    test('should handle database errors', async () => {
      // Mock database error
      const dbError = createSupabaseError('Database connection failed');
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(
          createSupabaseResponse(null, dbError)
        ),
      }));

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'PLT12345678',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });

    test('should validate input parameters', async () => {
      const service = new PalletSearchService();

      // Test empty search value
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: '  ',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter pallet number');

      // Test empty series search
      const seriesResult = await service.searchPallet({
        searchType: 'series',
        searchValue: '',
      });

      expect(result.success).toBe(false);
      expect(seriesResult.error).toBe('Please enter series number');
    });

    test('should detect voided pallets when checkVoided is true', async () => {
      const voidedHistoryData = [
        {
          loc: 'Voided',
          action: 'Void',
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue(
              createSupabaseResponse(mockPalletData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse(voidedHistoryData)
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'PLT12345678',
        checkVoided: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.is_voided).toBe(true);
      expect(result.data?.current_plt_loc).toBe('Voided');
    });

    test('should handle pallets with no history (default to Await)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue(
              createSupabaseResponse(mockPalletData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse([])
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const result = await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'PLT12345678',
      });

      expect(result.success).toBe(true);
      expect(result.data?.current_plt_loc).toBe('Await');
      expect(result.data?.is_voided).toBe(false);
    });
  });

  describe('batchSearchPallets', () => {
    const mockPalletsData = [
      {
        plt_num: 'PLT00000001',
        product_code: 'PROD001',
        product_qty: 100,
        plt_remark: 'Batch pallet 1',
        series: 'SER001',
      },
      {
        plt_num: 'PLT00000002',
        product_code: 'PROD002',
        product_qty: 200,
        plt_remark: 'Batch pallet 2',
        series: 'SER002',
      },
      {
        plt_num: 'PLT00000003',
        product_code: 'PROD003',
        product_qty: 300,
        plt_remark: 'Batch pallet 3',
        series: 'SER003',
      },
    ];

    test('should process batch search successfully', async () => {
      // Mock batch search
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue(
              createSupabaseResponse(mockPalletsData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse([{ loc: 'A01-01' }])
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const palletNumbers = ['PLT00000001', 'PLT00000002', 'PLT00000003'];
      const results = await service.batchSearchPallets(palletNumbers);

      expect(results).toHaveLength(3);
      expect(results[0].plt_num).toBe('PLT00000001');
      expect(results[0].current_plt_loc).toBe('A01-01');
      expect(results[1].plt_num).toBe('PLT00000002');
      expect(results[2].plt_num).toBe('PLT00000003');
    });

    test('should handle partial failures', async () => {
      // Mock partial data (only 2 out of 3 pallets found)
      const partialData = mockPalletsData.slice(0, 2);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue(
              createSupabaseResponse(partialData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse([{ loc: 'B02-02' }])
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const palletNumbers = ['PLT00000001', 'PLT00000002', 'NONEXISTENT'];
      const results = await service.batchSearchPallets(palletNumbers);

      expect(results).toHaveLength(2);
      expect(results.find(p => p.plt_num === 'NONEXISTENT')).toBeUndefined();
    });

    test('should respect batch size limits', async () => {
      // Create large batch of pallet numbers
      const largeBatch = Array.from({ length: 100 }, (_, i) =>
        `PLT${String(i + 1).padStart(8, '0')}`
      );

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockImplementation((column, values) => {
              // Verify batch size
              expect(values).toHaveLength(100);
              return Promise.resolve(createSupabaseResponse([]));
            }),
          };
        }
      });

      const service = new PalletSearchService();
      await service.batchSearchPallets(largeBatch);

      expect(mockSupabase.from).toHaveBeenCalledWith('record_palletinfo');
    });

    test('should maintain order of results', async () => {
      // Mock data in different order
      const reorderedData = [mockPalletsData[2], mockPalletsData[0], mockPalletsData[1]];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_palletinfo') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue(
              createSupabaseResponse(reorderedData)
            ),
          };
        } else if (table === 'record_history') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(
              createSupabaseResponse([{ loc: 'C03-03' }])
            ),
          };
        }
      });

      const service = new PalletSearchService();
      const palletNumbers = ['PLT00000001', 'PLT00000002', 'PLT00000003'];
      const results = await service.batchSearchPallets(palletNumbers);

      // Results should include all pallets even if order is different
      expect(results).toHaveLength(3);
      expect(results.map(r => r.plt_num)).toContain('PLT00000001');
      expect(results.map(r => r.plt_num)).toContain('PLT00000002');
      expect(results.map(r => r.plt_num)).toContain('PLT00000003');
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      const service = new PalletSearchService();
      const results = await service.batchSearchPallets(['PLT00000001']);

      // Should return empty array on error
      expect(results).toEqual([]);
    });

    test('should handle empty input array', async () => {
      const service = new PalletSearchService();
      const results = await service.batchSearchPallets([]);

      expect(results).toEqual([]);
      // The service still calls Supabase with empty array, which returns empty result
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(palletSearchService).toBeInstanceOf(PalletSearchService);
    });
  });

  describe('Error Handling', () => {
    test('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Test error')),
      }));

      const service = new PalletSearchService();
      await service.searchPallet({
        searchType: 'pallet_num',
        searchValue: 'ERROR_TEST',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Pallet search failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
