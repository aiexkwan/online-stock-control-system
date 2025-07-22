import { NextRequest, NextResponse } from 'next/server';

/**
 * 測試模式配置 API
 * 為測試環境提供最小化的模擬數據，避免大量真實 API 調用
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[API-LOG-${requestId}] Test mode config API called at ${new Date().toISOString()}`);

  // 檢查是否為測試環境
  const isTestMode =
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT_TEST === 'true' ||
    request.headers.get('x-test-mode') === 'true';

  if (!isTestMode) {
    return NextResponse.json(
      { error: 'This endpoint is only available in test mode' },
      { status: 403 }
    );
  }

  try {
    // 提供測試用的模擬數據
    const mockData = {
      combined_stats: {
        total_products: 1500,
        today_production: 45,
        total_quantity: 25000,
        last_updated: new Date().toISOString(),
      },
      // 最小化的 widget 數據
      analysis: {
        widgets: ['totalProducts', 'todayProduction', 'totalQuantity'],
        layout: 'minimal',
      },
      // 性能優化配置
      config: {
        cacheTime: 1000 * 60 * 180, // 3 hours
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchInterval: false,
        retry: 0,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        fetchTime: Date.now() - startTime,
        mode: 'test',
        apiCallsOptimized: true,
      },
    };

    console.log(`[API-LOG-${requestId}] Test mode data provided:`, mockData);
    console.log(`[API-LOG-${requestId}] Request completed in ${Date.now() - startTime}ms`);

    return NextResponse.json(mockData);
  } catch (error) {
    console.error(`[API-LOG-${requestId}] Error in test-mode-config API:`, error);

    return NextResponse.json(
      {
        error: 'Failed to provide test mode config',
        requestId,
        timestamp: new Date().toISOString(),
        fetchTime: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
