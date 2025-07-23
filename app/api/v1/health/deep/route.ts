/**
 * 深度健康檢查端點 - 智能緩存適配器支援
 * Phase 2.1 更新 - 支援 Redis/Memory 緩存切換
 * 企業級監控解決方案
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { getCacheAdapter, getCurrentCacheType } from '@/lib/cache/cache-factory';

// 健康檢查結果介面
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

interface DeepHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: string;
  environment: string;
  appVersion: string;
  services: {
    database: HealthCheckResult;
    supabase: HealthCheckResult;
    cache: HealthCheckResult; // Phase 2.1: 從 redis 改為 cache (智能緩存)
    system: HealthCheckResult;
  };
  summary: {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  };
}

/**
 * 測試 Supabase 資料庫連接
 */
async function testSupabaseConnection(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // 測試基本查詢
    const { data, error } = await supabase.from('data_code').select('count(*)').limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        responseTime,
        error: (error as { message: string }).message,
        details: {
          code: error.code,
          hint: error.hint,
        },
      };
    }

    return {
      service: 'supabase',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        queryResult: data,
        connectionPool: 'active',
      },
    };
  } catch (error) {
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
    };
  }
}

/**
 * 測試資料庫詳細狀態
 */
async function testDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // 測試多個關鍵表
    const testQueries = [
      supabase.from('data_code').select('count(*)').limit(1),
      supabase.from('record_palletinfo').select('count(*)').limit(1),
      supabase.from('data_supplier').select('count(*)').limit(1),
    ];

    const results = await Promise.allSettled(testQueries);
    const responseTime = Date.now() - startTime;

    // Strategy 4: unknown + type narrowing for Promise.allSettled results
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.length - successCount;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failureCount === 0) {
      status = responseTime < 2000 ? 'healthy' : 'degraded';
    } else if (successCount > failureCount) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      service: 'database',
      status,
      responseTime,
      details: {
        tablesChecked: results.length,
        successfulQueries: successCount,
        failedQueries: failureCount,
        avgResponseTime: responseTime / results.length,
      },
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
    };
  }
}

/**
 * 測試緩存適配器連接和性能 (智能緩存支援)
 * Phase 2.1: 支援 Redis 和 Memory 緩存
 */
async function testCacheHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const cacheAdapter = getCacheAdapter();
    const cacheType = getCurrentCacheType();

    // 測試基本操作
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now(), test: true };

    await cacheAdapter.set(testKey, testValue, 10);
    const retrievedValue = await cacheAdapter.get(testKey);
    await cacheAdapter.delete(testKey);

    const responseTime = Date.now() - startTime;
    const stats = await cacheAdapter.getStats();
    const isConnected = await cacheAdapter.ping();

    if (!isConnected) {
      return {
        service: 'cache',
        status: 'degraded',
        responseTime,
        error: `${cacheType} cache connection issues - system continues with degraded performance`,
        details: {
          cacheType,
          fallbackMode: true,
          note: 'Cache unavailable but system operational'
        }
      };
    }

    // Phase 2.1: 根據緩存類型調整性能標準
    const responseTimeThreshold = cacheType === 'memory' ? 10 : 500; // 內存緩存應更快
    const status = responseTime < responseTimeThreshold ? 'healthy' : 'degraded';

    return {
      service: 'cache',
      status,
      responseTime,
      details: {
        cacheType,
        operationTest: retrievedValue !== null,
        memoryUsage: stats.memory,
        connections: stats.connections,
        hitRate: stats.hitRate || 0,
        expectedResponseTime: `< ${responseTimeThreshold}ms`,
        phase: 'Phase 2.1 - Adaptive Cache'
      },
    };
  } catch (error) {
    const cacheType = getCurrentCacheType();
    
    return {
      service: 'cache',
      status: 'degraded', // Phase 2.1: 緩存錯誤不影響系統核心功能
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      details: {
        cacheType,
        fallbackAvailable: true,
        note: 'System continues to operate without cache'
      }
    };
  }
}

/**
 * 檢查系統資源
 */
async function checkSystemResources(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // 計算記憶體使用率 (假設最大 512MB)
    const maxMemory = 512 * 1024 * 1024; // 512MB
    const memoryUsagePercent = (memoryUsage.heapUsed / maxMemory) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (memoryUsagePercent < 70) {
      status = 'healthy';
    } else if (memoryUsagePercent < 85) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      service: 'system',
      status,
      responseTime: Date.now() - startTime,
      details: {
        memoryUsage: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: `${Math.floor(uptime)}s`,
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  } catch (error) {
    return {
      service: 'system',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
    };
  }
}

/**
 * 深度健康檢查端點
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // 並行執行所有健康檢查 (Phase 2.1: 智能緩存支援)
    const [databaseResult, supabaseResult, cacheResult, systemResult] = await Promise.all([
      testDatabaseHealth(),
      testSupabaseConnection(),
      testCacheHealth(), // Phase 2.1: 使用智能緩存健康檢查
      checkSystemResources(),
    ]);

    // 計算總結 (Strategy 4: unknown + type narrowing)
    const services = [databaseResult, supabaseResult, cacheResult, systemResult];
    const healthyServices = services.filter(
      s => s && typeof s === 'object' && 'status' in s && s.status === 'healthy'
    ).length;
    const degradedServices = services.filter(
      s => s && typeof s === 'object' && 'status' in s && s.status === 'degraded'
    ).length;
    const unhealthyServices = services.filter(
      s => s && typeof s === 'object' && 'status' in s && s.status === 'unhealthy'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: DeepHealthResponse = {
      status: overallStatus,
      version: 'v2.1-phase2-adaptive', // Phase 2.1: 版本更新
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || 'development',
      appVersion: process.env.npm_package_version || '0.1.0',
      services: {
        database: databaseResult,
        supabase: supabaseResult,
        cache: cacheResult, // Phase 2.1: 使用智能緩存結果
        system: systemResult,
      },
      summary: {
        totalServices: services.length,
        healthyServices,
        degradedServices,
        unhealthyServices,
        overallStatus,
      },
    };

    // 根據整體狀態設定 HTTP 狀態碼
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache',
        'API-Version': 'v1',
      },
    });
  } catch (error) {
    console.error('Deep health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        version: 'v1',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Deep health check failed',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'API-Version': 'v1',
        },
      }
    );
  }
}

/**
 * 支援 HEAD 請求用於快速檢查 (智能緩存適配器)
 */
export async function HEAD() {
  try {
    // Phase 2.1: 智能緩存健康檢查，緩存為可選服務
    const [dbTest, cacheTest] = await Promise.all([testSupabaseConnection(), testCacheHealth()]);

    // 系統健康判斷：只有核心服務 (DB) unhealthy 才返回 503
    // 緩存 degraded 不影響系統可用性
    const isCriticalFailure = (dbTest as { status: string }).status === 'unhealthy';
    const cacheType = getCurrentCacheType();

    return new Response(null, {
      status: isCriticalFailure ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'API-Version': 'v2.1-phase2-adaptive', // Phase 2.1 版本
        'X-API-Version': 'v2.1-phase2-adaptive',
        'Cache-Control': 'no-cache',
        'X-Cache-Type': cacheType, // Phase 2.1: 顯示緩存類型
        'X-Cache-Status': (cacheTest as { status: string }).status,
        'X-Database-Status': (dbTest as { status: string }).status,
      },
    });
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'API-Version': 'v2.1-phase2-adaptive',
        'X-API-Version': 'v2.1-phase2-adaptive',
        'Cache-Control': 'no-cache',
        'X-Error': 'Health check failed',
      },
    });
  }
}
