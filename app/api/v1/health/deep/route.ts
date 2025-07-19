/**
 * 深度健康檢查端點 - 詳細服務狀態監控
 * v1.8 系統優化 - 企業級監控解決方案
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { testRedisConnection } from '@/lib/redis';
import { getRedisCacheAdapter } from '@/lib/cache/redis-cache-adapter';

// 健康檢查結果介面
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: any;
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
    redis: HealthCheckResult;
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
    const { data, error } = await supabase
      .from('data_code')
      .select('count(*)')
      .limit(1);
    
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
        }
      };
    }
    
    return {
      service: 'supabase',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        queryResult: data,
        connectionPool: 'active',
      }
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
      }
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
 * 測試 Redis 連接和性能
 */
async function testRedisHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const isConnected = await testRedisConnection();
    
    if (!isConnected) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Redis connection failed',
      };
    }
    
    const cacheAdapter = getRedisCacheAdapter();
    
    // 測試基本操作
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now(), test: true };
    
    await cacheAdapter.set(testKey, testValue, 10);
    const retrievedValue = await cacheAdapter.get(testKey);
    await cacheAdapter.delete(testKey);
    
    const responseTime = Date.now() - startTime;
    const stats = await cacheAdapter.getStats();
    
    return {
      service: 'redis',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        operationTest: retrievedValue !== null,
        memoryUsage: stats.memory,
        connections: stats.connections,
        hitRate: stats.hitRate,
      }
    };
    
  } catch (error) {
    return {
      service: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
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
      }
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
    
    // 並行執行所有健康檢查
    const [databaseResult, supabaseResult, redisResult, systemResult] = await Promise.all([
      testDatabaseHealth(),
      testSupabaseConnection(),
      testRedisHealth(),
      checkSystemResources(),
    ]);
    
    // 計算總結 (Strategy 4: unknown + type narrowing)
    const services = [databaseResult, supabaseResult, redisResult, systemResult];
    const healthyServices = services.filter(s => s && typeof s === 'object' && 'status' in s && s.status === 'healthy').length;
    const degradedServices = services.filter(s => s && typeof s === 'object' && 'status' in s && s.status === 'degraded').length;
    const unhealthyServices = services.filter(s => s && typeof s === 'object' && 'status' in s && s.status === 'unhealthy').length;
    
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
      version: 'v1',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || 'development',
      appVersion: process.env.npm_package_version || '0.1.0',
      services: {
        database: databaseResult,
        supabase: supabaseResult,
        redis: redisResult,
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
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache',
        'API-Version': 'v1',
      }
    });
    
  } catch (error) {
    console.error('Deep health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      version: 'v1',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      message: 'Deep health check failed',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'API-Version': 'v1',
      }
    });
  }
}

/**
 * 支援 HEAD 請求用於快速檢查
 */
export async function HEAD() {
  try {
    // 簡化的健康檢查，只測試基本連接
    const [dbTest, redisTest] = await Promise.all([
      testSupabaseConnection(),
      testRedisHealth(),
    ]);
    
    const isHealthy = (dbTest as { status: string }).status !== 'unhealthy' && (redisTest as { status: string }).status !== 'unhealthy';
    
    return new Response(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'API-Version': 'v1',
        'X-API-Version': 'v1',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'API-Version': 'v1',
        'X-API-Version': 'v1',
        'Cache-Control': 'no-cache',
      }
    });
  }
}