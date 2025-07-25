import { renderHook, act, waitFor } from '@testing-library/react';
import { useStockTransfer } from '../useStockTransfer';
import { toast } from 'sonner';
import type { PalletInfo } from '@/app/services/palletSearchService';

// Mock dependencies
jest.mock('@/app/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

jest.mock('sonner', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('@/lib/inventory/utils/locationMapper', () => ({
  LocationMapper: {
    toDbColumn: jest.fn((location: string) => {
      const mapping: Record<string, string> = {
        'Await': 'await',
        'Injection': 'injection',
        'Pipeline': 'pipeline',
        'Prebook': 'prebook',
        'Bulk': 'bulk'
      };
      return mapping[location] || null;
    })
  }
}));

describe('useStockTransfer', () => {
  let mockSupabase: {
    from: jest.Mock;
    rpc: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    single: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock global timer functions
    jest.spyOn(global, 'setInterval');
    jest.spyOn(global, 'clearInterval');

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      rpc: jest.fn()
    };

    const { createClient } = require('@/app/utils/supabase/client');
    createClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const mockPalletInfo: PalletInfo = {
    plt_num: 'PLT001',
    product_code: 'PROD001',
    product_qty: 100,
    current_plt_loc: 'Await',
    series: 'SERIES001'
  };

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useStockTransfer());

      expect(result.current.isTransferring).toBe(false);
      expect(result.current.optimisticTransfers).toEqual([]);
      expect(typeof result.current.executeTransfer).toBe('function');
      expect(typeof result.current.hasPendingTransfer).toBe('function');
    });

    it('should setup cleanup interval', () => {
      renderHook(() => useStockTransfer());

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should cleanup interval on unmount', () => {
      const { unmount } = renderHook(() => useStockTransfer());

      unmount();

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('executeTransfer', () => {
    describe('Validation', () => {
      it('should reject invalid operator ID', async () => {
        const { result } = renderHook(() => useStockTransfer());

        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', 'invalid')
        );

        expect(success).toBe(false);
        expect(toast.error).toHaveBeenCalledWith('Invalid operator ID format');
      });

      it('should reject transfer when pallet has pending transfer', async () => {
        const { result } = renderHook(() => useStockTransfer());

        // First create a pending transfer
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });

        // Start first transfer but don't await it
        act(() => {
          result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123');
        });

        // Try to do another transfer immediately
        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Bulk', '123')
        );

        expect(success).toBe(false);
        expect(toast.warning).toHaveBeenCalledWith(
          'Pallet PLT001 has a pending transfer. Please wait.'
        );
      });
    });

    describe('Successful transfer', () => {
      beforeEach(() => {
        // Setup successful responses
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        mockSupabase.insert.mockResolvedValue({
          error: null
        });
        mockSupabase.rpc.mockResolvedValue({
          error: null
        });
      });

      it('should execute transfer successfully', async () => {
        const onTransferComplete = jest.fn();
        const { result } = renderHook(() =>
          useStockTransfer({ onTransferComplete })
        );

        const toastId = 'toast-123';
        (toast.loading as jest.Mock).mockReturnValue(toastId);

        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(success).toBe(true);
        expect(toast.loading).toHaveBeenCalledWith(
          'Moving pallet PLT001 to Pipeline...'
        );
        expect(toast.success).toHaveBeenCalledWith(
          'Pallet PLT001 moved to Pipeline',
          { id: toastId }
        );
        expect(onTransferComplete).toHaveBeenCalledWith(true, 'PLT001');
      });

      it('should verify operator exists', async () => {
        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('data_id');
        expect(mockSupabase.select).toHaveBeenCalledWith('id');
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', 123);
        expect(mockSupabase.single).toHaveBeenCalled();
      });

      it('should add history record', async () => {
        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('record_history');
        expect(mockSupabase.insert).toHaveBeenCalledWith([{
          id: 123,
          action: 'Stock Transfer',
          plt_num: 'PLT001',
          loc: 'Pipeline',
          remark: 'Moved from Await to Pipeline',
          time: expect.any(String)
        }]);
      });

      it('should add transfer record', async () => {
        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('record_transfer');
        expect(mockSupabase.insert).toHaveBeenCalledWith([{
          plt_num: 'PLT001',
          operator_id: 123,
          tran_date: expect.any(String),
          f_loc: 'Await',
          t_loc: 'Pipeline'
        }]);
      });

      it('should update inventory', async () => {
        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(mockSupabase.from).toHaveBeenCalledWith('record_inventory');
        expect(mockSupabase.insert).toHaveBeenCalledWith([{
          product_code: 'PROD001',
          plt_num: 'PLT001',
          await: -100,  // Decrease from location
          pipeline: 100, // Increase to location
          latest_update: expect.any(String)
        }]);
      });

      it('should update work level', async () => {
        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(mockSupabase.rpc).toHaveBeenCalledWith('update_work_level_move', {
          p_user_id: 123,
          p_move_count: 1
        });
      });
    });

    describe('Error handling', () => {
      it('should handle operator not found error', async () => {
        mockSupabase.single.mockResolvedValue({
          data: null,
          error: new Error('Not found')
        });

        const { result } = renderHook(() => useStockTransfer());

        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(success).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Operator ID 123 not found in system'),
          expect.any(Object)
        );
      });

      it('should handle history record error', async () => {
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        // Use a new mock function for this test to avoid interference
        const insertMock = jest.fn()
          .mockResolvedValueOnce({ error: new Error('History insert failed') });
        mockSupabase.insert = insertMock;

        const { result } = renderHook(() => useStockTransfer());

        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(success).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to record history'),
          expect.any(Object)
        );

        // Reset to default behavior
        mockSupabase.insert = jest.fn(() => Promise.resolve({ error: null }));
      });

      it('should handle invalid location mapping', async () => {
        const { LocationMapper } = require('@/lib/inventory/utils/locationMapper');
        LocationMapper.toDbColumn.mockReturnValue(null);

        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        mockSupabase.insert.mockResolvedValue({
          error: null
        });

        const { result } = renderHook(() => useStockTransfer());

        const success = await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'InvalidLocation', '123')
        );

        expect(success).toBe(false);
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid location mapping'),
          expect.any(Object)
        );

        // Reset LocationMapper to default behavior
        LocationMapper.toDbColumn.mockImplementation((location: string) => {
          const mapping: Record<string, string> = {
            'Await': 'await',
            'Injection': 'injection',
            'Pipeline': 'pipeline',
            'Prebook': 'prebook',
            'Bulk': 'bulk'
          };
          return mapping[location] || null;
        });
      });
    });

    describe('Optimistic updates', () => {
      it('should add optimistic transfer on start', async () => {
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        mockSupabase.insert.mockResolvedValue({
          error: null
        });
        mockSupabase.rpc.mockResolvedValue({
          error: null
        });

        const { result } = renderHook(() => useStockTransfer());

        // Start transfer without awaiting to check immediate state
        let transferPromise: Promise<boolean> | null = null;
        act(() => {
          transferPromise = result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123');
        });

        // Check optimistic transfer is added immediately
        expect(result.current.optimisticTransfers).toHaveLength(1);
        expect(result.current.optimisticTransfers[0]).toMatchObject({
          pltNum: 'PLT001',
          fromLocation: 'Await',
          toLocation: 'Pipeline',
          status: 'pending'
        });

        // Now await the promise
        await act(async () => {
          await transferPromise;
        });

        // Reset mocks to default
        mockSupabase.insert = jest.fn(() => Promise.resolve({ error: null }));
      });

      it('should update optimistic transfer to success', async () => {
        // Mock all required calls
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        mockSupabase.rpc.mockResolvedValue({
          error: null
        });

        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(result.current.optimisticTransfers).toHaveLength(1);
        expect(result.current.optimisticTransfers[0].status).toBe('success');
      });

      it('should update optimistic transfer to failed on error', async () => {
        mockSupabase.single.mockResolvedValue({
          data: null,
          error: new Error('Failed')
        });

        const { result } = renderHook(() => useStockTransfer());

        await act(async () =>
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123')
        );

        expect(result.current.optimisticTransfers[0].status).toBe('failed');
      });

      it('should cleanup old optimistic transfers', async () => {
        mockSupabase.single.mockResolvedValue({
          data: { id: 123 },
          error: null
        });
        mockSupabase.insert.mockResolvedValue({
          error: null
        });
        mockSupabase.rpc.mockResolvedValue({
          error: null
        });

        const { result } = renderHook(() => useStockTransfer());

        // Execute a successful transfer
        await act(async () => {
          await result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123');
        });

        // Fast forward time past cleanup threshold (5 seconds)
        act(() => {
          jest.advanceTimersByTime(6000);
        });

        await waitFor(() => {
          expect(result.current.optimisticTransfers).toHaveLength(0);
        });
      });
    });
  });

  describe('hasPendingTransfer', () => {
    it('should return true when pallet has pending transfer', async () => {
      const { result } = renderHook(() => useStockTransfer());

      // Setup for a pending transfer
      mockSupabase.single.mockResolvedValue({
        data: { id: 123 },
        error: null
      });

      // Start a transfer without awaiting to create pending state
      act(() => {
        result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123');
      });

      // Check immediately while transfer is pending
      expect(result.current.hasPendingTransfer('PLT001')).toBe(true);
    });

    it('should return false when pallet has no pending transfer', () => {
      const { result } = renderHook(() => useStockTransfer());

      act(() => {
        result.current.optimisticTransfers = [{
          id: 'transfer-1',
          pltNum: 'PLT001',
          fromLocation: 'Await',
          toLocation: 'Pipeline',
          status: 'success',
          timestamp: Date.now()
        }];
      });

      expect(result.current.hasPendingTransfer('PLT001')).toBe(false);
    });

    it('should return false for different pallet', () => {
      const { result } = renderHook(() => useStockTransfer());

      act(() => {
        result.current.optimisticTransfers = [{
          id: 'transfer-1',
          pltNum: 'PLT001',
          fromLocation: 'Await',
          toLocation: 'Pipeline',
          status: 'pending',
          timestamp: Date.now()
        }];
      });

      expect(result.current.hasPendingTransfer('PLT002')).toBe(false);
    });
  });

  describe('Loading state', () => {
    it('should set isTransferring during transfer', async () => {
      // Create a deferred promise to control when the mock resolves
      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSupabase.single.mockReturnValue(delayedPromise);
      mockSupabase.insert.mockResolvedValue({
        error: null
      });
      mockSupabase.rpc.mockResolvedValue({
        error: null
      });

      const { result } = renderHook(() => useStockTransfer());

      // Start transfer
      let transferPromise: Promise<boolean> | null = null;
      act(() => {
        transferPromise = result.current.executeTransfer(mockPalletInfo, 'Pipeline', '123');
      });

      // Should be transferring
      expect(result.current.isTransferring).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise({
          data: { id: 123 },
          error: null
        });
      });

      // Wait for transfer to complete
      await act(async () => {
        await transferPromise;
      });

      expect(result.current.isTransferring).toBe(false);
    });
  });
});
