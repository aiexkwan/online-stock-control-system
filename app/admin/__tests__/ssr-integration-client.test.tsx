/**
 * Client-side behavior test for prefetchCriticalWidgetsData
 * 測試 prefetchCriticalWidgetsData 的客戶端行為
 */

import { prefetchCriticalWidgetsData } from '@/app/admin/hooks/useDashboardConcurrentQuery';

describe('prefetchCriticalWidgetsData - Client Side Behavior', () => {
  let originalNodeEnv: string | undefined;
  
  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    // 模擬非測試環境
    process.env.NODE_ENV = 'development';
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  it('應該在客戶端環境返回空對象並顯示警告', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const result = await prefetchCriticalWidgetsData({
      dateRange: { startDate: null, endDate: null },
      criticalOnly: true,
    });

    // 在非測試環境的客戶端，函數應返回空對象
    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(
      '[SSR] Client-side prefetch called - should be server-side only'
    );

    consoleSpy.mockRestore();
  });
});