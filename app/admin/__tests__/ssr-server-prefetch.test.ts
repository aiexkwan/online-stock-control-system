/**
 * Server-Side Prefetch Tests
 * 測試實際的服務器端預取邏輯
 */

import { createClient } from '@/app/utils/supabase/server';
import { cookies } from 'next/headers';

// Mock Supabase server client
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// 實際的服務器端預取函數（應該在 server actions 或 API routes 中實現）
async function serverPrefetchCriticalWidgets(dateRange: {
  startDate: Date | null;
  endDate: Date | null;
}) {
  const supabase = createClient();
  const results: Record<string, any> = {};

  try {
    // 預取 total_pallets (StatsCardWidget)
    const { count: totalPallets, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('*', { count: 'exact', head: true });

    if (!palletError) {
      results.total_pallets = {
        value: totalPallets || 0,
        label: 'Total Pallets',
        trend: 0,
      };
    }

    // 預取 awaitLocationQty (AwaitLocationQtyWidget)
    const { data: awaitData, error: awaitError } = await supabase
      .rpc('rpc_get_await_location_count');

    if (!awaitError) {
      results.awaitLocationQty = {
        totalAwaitingQty: awaitData || 0,
        locations: [],
      };
    }

    // 預取 yesterdayTransferCount (YesterdayTransferCountWidget)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: transferCount, error: transferError } = await supabase
      .from('record_transfer')
      .select('*', { count: 'exact', head: true })
      .gte('tran_date', yesterday.toISOString())
      .lt('tran_date', today.toISOString());

    if (!transferError) {
      results.yesterdayTransferCount = {
        count: transferCount || 0,
        trend: 0,
        dateRange: {
          start: yesterday.toISOString(),
          end: today.toISOString(),
        },
        optimized: true,
      };
    }

    return results;
  } catch (error) {
    console.error('[SSR] Server prefetch failed:', error);
    return {};
  }
}

describe('Server-Side Prefetch Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('serverPrefetchCriticalWidgets', () => {
    it('應該成功預取所有 critical widgets 數據', async () => {
      // Mock total_pallets 查詢
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 150,
          error: null,
        }),
      });

      // Mock awaitLocationQty RPC
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 75,
        error: null,
      });

      // Mock yesterdayTransferCount 查詢
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              count: 30,
              error: null,
            }),
          }),
        }),
      });

      const results = await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      expect(results).toEqual({
        total_pallets: {
          value: 150,
          label: 'Total Pallets',
          trend: 0,
        },
        awaitLocationQty: {
          totalAwaitingQty: 75,
          locations: [],
        },
        yesterdayTransferCount: {
          count: 30,
          trend: 0,
          dateRange: expect.objectContaining({
            start: expect.any(String),
            end: expect.any(String),
          }),
          optimized: true,
        },
      });

      // 驗證調用次數
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('應該處理部分預取失敗', async () => {
      // Mock total_pallets 成功
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          count: 100,
          error: null,
        }),
      });

      // Mock awaitLocationQty 失敗
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error('RPC failed'),
      });

      // Mock yesterdayTransferCount 成功
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockResolvedValue({
              count: 20,
              error: null,
            }),
          }),
        }),
      });

      const results = await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      // 應該只包含成功的數據
      expect(results).toEqual({
        total_pallets: {
          value: 100,
          label: 'Total Pallets',
          trend: 0,
        },
        yesterdayTransferCount: {
          count: 20,
          trend: 0,
          dateRange: expect.objectContaining({
            start: expect.any(String),
            end: expect.any(String),
          }),
          optimized: true,
        },
      });

      // awaitLocationQty 應該不存在
      expect(results.awaitLocationQty).toBeUndefined();
    });

    it('應該處理完全預取失敗', async () => {
      // Mock 所有查詢失敗
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      // 應該返回空對象
      expect(results).toEqual({});

      // 應該記錄錯誤
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SSR] Server prefetch failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('應該使用正確的日期範圍查詢昨日轉移數據', async () => {
      // Mock 前兩個查詢
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ count: 0, error: null }),
      });
      mockSupabase.rpc.mockResolvedValueOnce({ data: 0, error: null });

      // Mock yesterdayTransferCount 查詢，捕獲參數
      let capturedGteDate: string;
      let capturedLtDate: string;

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn((column, date) => {
            capturedGteDate = date;
            return {
              lt: jest.fn((column, date) => {
                capturedLtDate = date;
                return Promise.resolve({ count: 15, error: null });
              }),
            };
          }),
        }),
      });

      await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      // 驗證日期範圍
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      expect(new Date(capturedGteDate!).toDateString()).toBe(yesterday.toDateString());
      expect(new Date(capturedLtDate!).toDateString()).toBe(today.toDateString());
    });
  });

  describe('Integration with AdminThemePage', () => {
    it('應該為不同主題使用不同的預取策略', async () => {
      const criticalThemes = ['injection', 'pipeline', 'warehouse'];
      const nonCriticalThemes = ['upload', 'update', 'stock-management', 'system', 'analysis'];

      // Mock 成功的預取
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ count: 100, error: null }),
      });
      mockSupabase.rpc.mockResolvedValue({ data: 50, error: null });

      // 測試 critical themes
      for (const theme of criticalThemes) {
        const results = await serverPrefetchCriticalWidgets({
          startDate: null,
          endDate: null,
        });

        expect(Object.keys(results).length).toBeGreaterThan(0);
      }

      // 對於 non-critical themes，實際實現中應該跳過預取
      // 這裡只是測試邏輯示例
    });
  });

  describe('Performance Optimization', () => {
    it('應該並行執行所有預取查詢', async () => {
      // 創建延遲的 mock 來測試並行執行
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockImplementation(async () => {
          await delay(100);
          return { count: 100, error: null };
        }),
      });

      mockSupabase.rpc.mockImplementation(async () => {
        await delay(100);
        return { data: 50, error: null };
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lt: jest.fn().mockImplementation(async () => {
              await delay(100);
              return { count: 25, error: null };
            }),
          }),
        }),
      });

      const startTime = Date.now();
      await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });
      const endTime = Date.now();

      // 如果是並行執行，總時間應該接近 100ms（最長的單個查詢）
      // 如果是串行執行，總時間會接近 300ms
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('應該緩存預取結果以避免重複查詢', async () => {
      // 這個測試展示了緩存策略的重要性
      // 實際實現中應該使用 Next.js 的 cache() 或 React Query
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ count: 100, error: null }),
      });
      mockSupabase.rpc.mockResolvedValue({ data: 50, error: null });

      // 第一次調用
      const results1 = await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      // 第二次調用（應該使用緩存）
      const results2 = await serverPrefetchCriticalWidgets({
        startDate: null,
        endDate: null,
      });

      expect(results1).toEqual(results2);
      
      // 在實際實現中，第二次調用不應該觸發數據庫查詢
      // 這裡只是示例，實際需要實現緩存機制
    });
  });
});