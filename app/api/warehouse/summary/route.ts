import { getWarehouseCacheService } from '@/lib/services/warehouse-cache-service';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * 優化的倉庫摘要 API - v1.8 性能優化
 * 使用 Redis 緩存 + RPC 函數實現 85%+ 性能提升
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const warehouseService = getWarehouseCacheService();
    
    // 獲取查詢參數
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30 days';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // 如果要求強制刷新，先清除緩存
    if (forceRefresh) {
      await warehouseService.invalidateWarehouseCache('summary');
    }

    // 使用高性能緩存服務獲取數據
    const summary = await warehouseService.getWarehouseSummary(timeRange);
    
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: summary,
      metadata: {
        totalLocations: summary.length,
        totalQty: summary.reduce((sum, item) => sum + item.totalQty, 0),
        totalItems: summary.reduce((sum, item) => sum + item.itemCount, 0),
        timeRange,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        cacheOptimized: true,
        version: 'v1.8-optimized',
      },
    }, {
      headers: {
        // 優化的緩存控制
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=900',
        'X-Response-Time': `${responseTime}ms`,
        'X-Optimized': 'redis-cache-rpc',
        'Vary': 'Accept-Encoding',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Optimized warehouse summary API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch warehouse summary',
      message: error instanceof Error ? error.message : 'Internal server error',
      metadata: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        version: 'v1.8-optimized',
      },
    }, { 
      status: 500,
      headers: {
        'X-Response-Time': `${responseTime}ms`,
        'X-Error': 'optimization-failed',
      },
    });
  }
}
