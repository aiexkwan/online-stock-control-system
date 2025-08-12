/**
 * 緩存和性能指標 API 端點
 * Phase 2.1 更新 - 智能緩存適配器支援
 * 專家優化：監控緩存性能和系統健康
 * Security Update: Added authentication and rate limiting
 */

import { getWarehouseCacheService } from '@/lib/services/warehouse-cache-service';
import { getCacheAdapter, getCurrentCacheType } from '@/lib/cache/cache-factory';
import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { cookies } from 'next/headers';
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

    // 並行獲取各種指標
    const [cacheMetrics, cacheStats, adapterMetrics, isCacheConnected] = await Promise.all([
      warehouseService.getCacheMetrics(),
      cacheAdapter.getStats(),
      cacheAdapter.getMetrics(),
      cacheAdapter.ping(),
    ]);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: 'v2.1-phase2-adaptive', // Phase 2.1 版本標識

      // 緩存類型和狀態 (Phase 2.1 新增)
      cacheType: cacheType,
      cache: {
        type: cacheType,
        connected: isCacheConnected,
        memory: cacheStats.memory,
        connections: cacheStats.connections,
        operations: cacheStats.operations,
        hitRate: cacheStats.hitRate || 0,
      },

      // 緩存性能指標
      performance: {
        hits: adapterMetrics.hits,
        misses: adapterMetrics.misses,
        totalRequests: adapterMetrics.totalRequests,
        hitRate: adapterMetrics.hitRate.toFixed(2) + '%',
        avgResponseTime: adapterMetrics.avgResponseTime.toFixed(2) + 'ms',
        errorRate:
          adapterMetrics.errors > 0
            ? ((adapterMetrics.errors / adapterMetrics.totalRequests) * 100).toFixed(2) + '%'
            : '0%',
      },

      // 系統健康指標
      health: {
        cache: isCacheConnected ? 'healthy' : 'error',
        lastError: adapterMetrics.lastError,
        lastErrorTime: adapterMetrics.lastErrorTime,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },

      // Phase 2.1: 適應性緩存優化建議
      recommendations: generateAdaptiveCacheRecommendations(
        adapterMetrics as unknown as Record<string, unknown>,
        cacheStats as unknown as Record<string, unknown>,
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
export async function DELETE(request: Request) {
  try {
    // Rate limiting check
    const rateLimitResult = await cacheOperationLimiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          status: 'error',
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset!.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Authentication check
    const cookieStore = await cookies();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Admin role check (in production)
    if (process.env.NODE_ENV === 'production') {
      // Check if user has admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || profile.role !== 'admin') {
        // Log unauthorized attempt
        console.warn('[SECURITY] Unauthorized cache clear attempt:', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        });
        
        return NextResponse.json(
          { 
            status: 'error',
            message: 'Admin access required'
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
      operation: 'CACHE_DELETE_V1',
      environment: process.env.NODE_ENV
    });

    // Continue with original logic after authentication
    const { searchParams } = new URL(request.url);
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
export async function POST(request: Request) {
  try {
    // Rate limiting check
    const rateLimitResult = await cacheOperationLimiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          status: 'error',
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset!.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Authentication check
    const cookieStore = await cookies();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Audit logging
    console.log('[AUDIT] Cache pre-warm operation:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      operation: 'CACHE_PREWARM_V1'
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
 * Phase 2.1: 生成適應性緩存優化建議
 * 支援 Redis 和 Memory 緩存的智能分析
 */
function generateAdaptiveCacheRecommendations(
  metrics: Record<string, unknown>,
  stats: Record<string, unknown>,
  cacheType: string
): string[] {
  const recommendations = [];

  // 命中率建議 (通用)
  const hitRate = typeof metrics.hitRate === 'number' ? metrics.hitRate : 0;
  if (hitRate < 70) {
    recommendations.push(
      `Cache hit rate is below 70% (${cacheType} cache). Consider increasing TTL or pre-warming more data.`
    );
  } else if (hitRate > 95) {
    recommendations.push(
      `Excellent cache hit rate with ${cacheType} cache! Consider increasing cache size.`
    );
  }

  // 響應時間建議 (適應性)
  const avgResponseTime = typeof metrics.avgResponseTime === 'number' ? metrics.avgResponseTime : 0;
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

  // 錯誤率建議 (通用)
  const errors = typeof metrics.errors === 'number' ? metrics.errors : 0;
  if (errors > 0) {
    recommendations.push(
      `${errors} cache errors detected with ${cacheType} cache. Check connectivity and logs.`
    );
  }

  // 內存使用建議 (適應性)
  if (typeof stats.memory === 'string') {
    if (cacheType === 'memory') {
      // 內存緩存特定建議
      if (stats.memory.includes('KB')) {
        const memoryKB = parseFloat(stats.memory.replace('KB', ''));
        if (memoryKB > 10000) {
          // 10MB
          recommendations.push(
            'Memory cache usage is high. Consider implementing more aggressive LRU eviction or reducing TTL.'
          );
        }
      }
    } else if (cacheType === 'redis') {
      // Redis 特定建議
      if (stats.memory.includes('MB')) {
        const memoryMB = parseFloat(stats.memory.replace('MB', ''));
        if (memoryMB > 100) {
          recommendations.push(
            'Redis memory usage is high. Consider implementing cache eviction policies or data compression.'
          );
        }
      }
    }
  }

  // 連接數建議 (Redis 特定)
  const connections = typeof stats.connections === 'number' ? stats.connections : 0;
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
