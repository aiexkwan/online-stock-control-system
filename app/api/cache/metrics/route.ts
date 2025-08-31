/**
 * 緩存和性能指標 API 端點
 * Phase 2.1 更新 - 智能緩存適配器支援
 * 專家優化：監控緩存性能和系統健康
 * Security Update: Added authentication and rate limiting
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWarehouseCacheService } from '@/lib/services/warehouse-cache-service';
import { getCacheAdapter, getCurrentCacheType } from '@/lib/cache/cache-factory';
import { createClient } from '@/app/utils/supabase/server';
import { cacheOperationLimiter } from '@/lib/middleware/rate-limit';

/**
 * 獲取緩存性能指標 (智能緩存適配器)
 */
export async function GET() {
  const startTime = Date.now();

  try {
    const warehouseService = getWarehouseCacheService();
    const cacheAdapter = getCacheAdapter();
    const cacheType = getCurrentCacheType();

    // 並行獲取各種指標，添加錯誤處理和類型安全檢查
    const [cacheMetrics, cacheStats, adapterMetrics, isCacheConnected] = await Promise.allSettled([
      warehouseService.getCacheMetrics(),
      cacheAdapter.getStats(),
      cacheAdapter.getMetrics(),
      cacheAdapter.ping(),
    ]).then(results => [
      results[0].status === 'fulfilled' ? results[0].value : null,
      results[1].status === 'fulfilled'
        ? results[1].value
        : { memory: '0KB', connections: 0, operations: 0 },
      results[2].status === 'fulfilled'
        ? results[2].value
        : {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            hitRate: 0,
            avgResponseTime: 0,
            errors: 0,
            lastError: null,
            lastErrorTime: null,
          },
      results[3].status === 'fulfilled' ? results[3].value : false,
    ]);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: 'v2.1-phase2-adaptive', // Phase 2.1 版本標識

      // 緩存類型和狀態 (Phase 2.1 新增) - 添加完整類型安全檢查
      cacheType: cacheType,
      cache: {
        type: cacheType,
        connected: Boolean(isCacheConnected),
        memory:
          cacheStats &&
          typeof cacheStats === 'object' &&
          'memory' in cacheStats &&
          typeof cacheStats.memory === 'string'
            ? cacheStats.memory
            : '0KB',
        connections:
          cacheStats &&
          typeof cacheStats === 'object' &&
          'connections' in cacheStats &&
          typeof cacheStats.connections === 'number'
            ? cacheStats.connections
            : 0,
        operations:
          cacheStats &&
          typeof cacheStats === 'object' &&
          'operations' in cacheStats &&
          typeof cacheStats.operations === 'number'
            ? cacheStats.operations
            : 0,
        hitRate:
          cacheStats &&
          typeof cacheStats === 'object' &&
          'hitRate' in cacheStats &&
          typeof cacheStats.hitRate === 'number'
            ? cacheStats.hitRate
            : 0,
      },

      // 緩存性能指標 - 添加完整類型安全檢查
      performance: {
        hits:
          adapterMetrics &&
          typeof adapterMetrics === 'object' &&
          'hits' in adapterMetrics &&
          typeof adapterMetrics.hits === 'number'
            ? adapterMetrics.hits
            : 0,
        misses:
          adapterMetrics &&
          typeof adapterMetrics === 'object' &&
          'misses' in adapterMetrics &&
          typeof adapterMetrics.misses === 'number'
            ? adapterMetrics.misses
            : 0,
        totalRequests:
          adapterMetrics &&
          typeof adapterMetrics === 'object' &&
          'totalRequests' in adapterMetrics &&
          typeof adapterMetrics.totalRequests === 'number'
            ? adapterMetrics.totalRequests
            : 0,
        hitRate:
          adapterMetrics &&
          typeof adapterMetrics === 'object' &&
          'hitRate' in adapterMetrics &&
          typeof adapterMetrics.hitRate === 'number'
            ? adapterMetrics.hitRate.toFixed(2) + '%'
            : '0%',
        avgResponseTime:
          adapterMetrics &&
          typeof adapterMetrics === 'object' &&
          'avgResponseTime' in adapterMetrics &&
          typeof adapterMetrics.avgResponseTime === 'number'
            ? adapterMetrics.avgResponseTime.toFixed(2) + 'ms'
            : '0ms',
        errorRate: (() => {
          const errors =
            adapterMetrics &&
            typeof adapterMetrics === 'object' &&
            'errors' in adapterMetrics &&
            typeof adapterMetrics.errors === 'number'
              ? adapterMetrics.errors
              : 0;
          const totalRequests =
            adapterMetrics &&
            typeof adapterMetrics === 'object' &&
            'totalRequests' in adapterMetrics &&
            typeof adapterMetrics.totalRequests === 'number'
              ? adapterMetrics.totalRequests
              : 1;
          return errors > 0 ? ((errors / totalRequests) * 100).toFixed(2) + '%' : '0%';
        })(),
      },

      // 系統健康指標 - 添加完整類型安全檢查
      health: {
        cache: Boolean(isCacheConnected) ? 'healthy' : 'error',
        lastError:
          adapterMetrics && typeof adapterMetrics === 'object' && 'lastError' in adapterMetrics
            ? adapterMetrics.lastError
            : null,
        lastErrorTime:
          adapterMetrics && typeof adapterMetrics === 'object' && 'lastErrorTime' in adapterMetrics
            ? adapterMetrics.lastErrorTime
            : null,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },

      // Phase 2.1: 適應性緩存優化建議 - 添加類型安全檢查
      recommendations: generateAdaptiveCacheRecommendations(
        extractAdapterMetrics(adapterMetrics),
        extractCacheStats(cacheStats),
        cacheType
      ),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Cache metrics API error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Failed to retrieve cache metrics',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 清除指定的緩存 (開發/管理用途) - 智能緩存適配器支援
 * Security: Requires authentication and admin role
 */
export async function DELETE(_request: Request) {
  try {
    // Rate limiting check
    const rateLimitResult = await cacheOperationLimiter(_request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.reset!.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Authentication check
    await cookies(); // Ensure cookies are available
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Admin role check (in production)
    if (process.env.NODE_ENV === 'production') {
      // Check if user has admin position using data_id table
      const { data: userInfo, error: userError } = await supabase
        .from('data_id')
        .select('position, department')
        .eq('email', user.email || '')
        .single();

      if (userError || !userInfo || userInfo.position !== 'Admin') {
        // Log unauthorized attempt
        console.warn('[SECURITY] Unauthorized cache clear attempt:', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
          ip: _request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(
          {
            status: 'error',
            message: 'Admin access required',
          },
          { status: 403 }
        );
      }
    }

    // Audit logging
    console.log('[AUDIT] Cache clear operation:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      operation: 'CACHE_DELETE',
      environment: process.env.NODE_ENV,
    });

    // Continue with original logic after authentication
    const { searchParams } = new URL(_request.url);
    const type = searchParams.get('type') as 'summary' | 'dashboard' | 'inventory' | 'all';
    const pattern = searchParams.get('pattern');

    const warehouseService = getWarehouseCacheService();
    const cacheAdapter = getCacheAdapter();
    const cacheType = getCurrentCacheType();

    if (pattern) {
      // 根據模式清除緩存
      const invalidatedCount = await cacheAdapter.invalidatePattern(pattern);

      return NextResponse.json({
        status: 'success',
        message: `Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`,
        cacheType,
        timestamp: new Date().toISOString(),
      });
    } else if (type) {
      // 根據類型清除緩存
      await warehouseService.invalidateWarehouseCache(type);

      return NextResponse.json({
        status: 'success',
        message: `Invalidated ${type} cache`,
        cacheType,
        timestamp: new Date().toISOString(),
      });
    } else {
      // 清除所有緩存
      await cacheAdapter.clear();

      return NextResponse.json({
        status: 'success',
        message: `All cache cleared (${cacheType} adapter)`,
        cacheType,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Cache clear API error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Failed to clear cache',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 預熱緩存 (管理用途)
 * Security: Requires authentication
 */
export async function POST(_request: Request) {
  try {
    // Rate limiting check
    const rateLimitResult = await cacheOperationLimiter(_request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.reset!.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Authentication check
    await cookies(); // Ensure cookies are available
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Audit logging
    console.log('[AUDIT] Cache pre-warm operation:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      operation: 'CACHE_PREWARM',
    });

    // Continue with original logic after authentication
    const warehouseService = getWarehouseCacheService();

    // 預熱關鍵緩存
    await warehouseService.preWarmCache();

    return NextResponse.json({
      status: 'success',
      message: 'Cache pre-warming completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache pre-warm API error:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Failed to pre-warm cache',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 從複雜類型中安全提取 adapter metrics
 */
function extractAdapterMetrics(metrics: unknown): {
  hitRate?: number;
  avgResponseTime?: number;
  errors?: number;
  hits?: number;
  misses?: number;
  totalRequests?: number;
} {
  const defaultMetrics = {
    hitRate: 0,
    avgResponseTime: 0,
    errors: 0,
    hits: 0,
    misses: 0,
    totalRequests: 0,
  };

  if (!metrics || typeof metrics !== 'object') {
    return defaultMetrics;
  }

  const metricsObj = metrics as Record<string, unknown>;

  return {
    hitRate: typeof metricsObj.hitRate === 'number' ? metricsObj.hitRate : defaultMetrics.hitRate,
    avgResponseTime:
      typeof metricsObj.avgResponseTime === 'number'
        ? metricsObj.avgResponseTime
        : defaultMetrics.avgResponseTime,
    errors: typeof metricsObj.errors === 'number' ? metricsObj.errors : defaultMetrics.errors,
    hits: typeof metricsObj.hits === 'number' ? metricsObj.hits : defaultMetrics.hits,
    misses: typeof metricsObj.misses === 'number' ? metricsObj.misses : defaultMetrics.misses,
    totalRequests:
      typeof metricsObj.totalRequests === 'number'
        ? metricsObj.totalRequests
        : defaultMetrics.totalRequests,
  };
}

/**
 * 從複雜類型中安全提取 cache stats
 */
function extractCacheStats(stats: unknown): {
  memory?: string;
  connections?: number;
  operations?: number;
  hitRate?: number;
} {
  const defaultStats = { memory: '0KB', connections: 0, operations: 0, hitRate: 0 };

  if (!stats || typeof stats !== 'object') {
    return defaultStats;
  }

  const statsObj = stats as Record<string, unknown>;

  return {
    memory: typeof statsObj.memory === 'string' ? statsObj.memory : defaultStats.memory,
    connections:
      typeof statsObj.connections === 'number' ? statsObj.connections : defaultStats.connections,
    operations:
      typeof statsObj.operations === 'number' ? statsObj.operations : defaultStats.operations,
    hitRate: typeof statsObj.hitRate === 'number' ? statsObj.hitRate : defaultStats.hitRate,
  };
}

/**
 * Phase 2.1: 生成適應性緩存優化建議
 * 支援 Redis 和 Memory 緩存的智能分析
 */
function generateAdaptiveCacheRecommendations(
  metrics: {
    hitRate?: number;
    avgResponseTime?: number;
    errors?: number;
    hits?: number;
    misses?: number;
    totalRequests?: number;
  } | null,
  stats: { memory?: string; connections?: number; operations?: number; hitRate?: number } | null,
  cacheType: string
): string[] {
  const recommendations: string[] = [];

  // 類型安全的輔助函數
  const safeGetNumber = (value: number | undefined, defaultValue: number = 0): number => {
    return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
  };

  const safeGetString = (value: string | undefined, defaultValue: string = ''): string => {
    return typeof value === 'string' ? value : defaultValue;
  };

  // 命中率建議 (通用) - 添加空值檢查
  const hitRate = safeGetNumber(metrics?.hitRate);
  if (hitRate < 70) {
    recommendations.push(
      `Cache hit rate is below 70% (${cacheType} cache). Consider increasing TTL or pre-warming more data.`
    );
  } else if (hitRate > 95) {
    recommendations.push(
      `Excellent cache hit rate with ${cacheType} cache! Consider increasing cache size.`
    );
  }

  // 響應時間建議 (適應性) - 添加空值檢查
  const avgResponseTime = safeGetNumber(metrics?.avgResponseTime);
  const responseTimeThreshold = cacheType === 'memory' ? 5 : 50; // 內存緩存標準更嚴格

  if (avgResponseTime > responseTimeThreshold) {
    if (cacheType === 'memory') {
      recommendations.push(
        `Memory cache response time is high (${avgResponseTime.toFixed(2)}ms). Consider reducing cache size or optimizing data structures.`
      );
    } else {
      recommendations.push(
        `Redis cache response time is high (${avgResponseTime.toFixed(2)}ms). Consider optimizing Redis configuration or network latency.`
      );
    }
  }

  // 錯誤率建議 (通用) - 添加空值檢查
  const errors = safeGetNumber(metrics?.errors);
  if (errors > 0) {
    recommendations.push(
      `${errors} cache errors detected with ${cacheType} cache. Check connectivity and logs.`
    );
  }

  // 內存使用建議 (適應性) - 添加空值檢查
  const memory = safeGetString(stats?.memory);
  if (memory) {
    if (cacheType === 'memory') {
      // 內存緩存特定建議
      if (memory.includes('KB')) {
        const memoryKB = parseFloat(memory.replace('KB', ''));
        if (!isNaN(memoryKB) && memoryKB > 10000) {
          // 10MB
          recommendations.push(
            'Memory cache usage is high. Consider implementing more aggressive LRU eviction or reducing TTL.'
          );
        }
      }
    } else if (cacheType === 'redis') {
      // Redis 特定建議
      if (memory.includes('MB')) {
        const memoryMB = parseFloat(memory.replace('MB', ''));
        if (!isNaN(memoryMB) && memoryMB > 100) {
          recommendations.push(
            'Redis memory usage is high. Consider implementing cache eviction policies or data compression.'
          );
        }
      }
    }
  }

  // 連接數建議 (Redis 特定) - 添加空值檢查
  const connections = safeGetNumber(stats?.connections);
  if (cacheType === 'redis' && connections > 50) {
    recommendations.push(
      'High number of Redis connections. Consider connection pooling optimization.'
    );
  } else if (cacheType === 'memory' && connections > 0) {
    recommendations.push(
      'Memory cache shows connection count - this may indicate configuration issues.'
    );
  }

  // Phase 2.1 特定建議
  if (cacheType === 'memory') {
    recommendations.push(
      '✅ Using optimized memory cache - ideal for current system scale (30-40 users).'
    );
    recommendations.push(
      '🚀 Memory cache eliminates network latency - expect 1-3ms response times.'
    );
  } else if (cacheType === 'redis') {
    recommendations.push(
      '⚠️  Consider migrating to memory cache for better performance and simplified deployment.'
    );
  }

  // 系統健康總結
  if (
    recommendations.length === 0 ||
    recommendations.every(r => r.includes('✅') || r.includes('🚀'))
  ) {
    recommendations.push(
      `🎯 Cache performance is optimal with ${cacheType} adapter. System is well-configured for current scale.`
    );
  }

  return recommendations;
}
