/**
 * API 監控和統計端點
 * v1.8 系統優化 - API 使用率和版本統計
 */

import { NextResponse } from 'next/server';
import { getVersionStats, type VersionStats } from '@/lib/middleware/apiVersioning';

/**
 * 獲取 API 版本使用統計
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // 獲取版本統計
    const versionStats = getVersionStats();

    // 計算總請求數
    const totalRequests = versionStats.reduce((sum, stat) => sum + stat.requestCount, 0);
    const totalErrors = versionStats.reduce((sum, stat) => sum + stat.errorCount, 0);

    // 計算版本分佈 (Strategy 2: DTO/custom type interface)
    const versionDistribution = versionStats.map((stat: VersionStats) => ({
      version: stat.version,
      requestCount: stat.requestCount,
      percentage:
        totalRequests > 0 ? ((stat.requestCount / totalRequests) * 100).toFixed(2) : '0.00',
      errorRate:
        stat.requestCount > 0 ? ((stat.errorCount / stat.requestCount) * 100).toFixed(2) : '0.00',
      lastUsed: stat.lastUsed,
    }));

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0',

      // API 版本統計
      apiVersions: {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00',
        versionDistribution,
        supportedVersions: ['v1', 'v2'],
      },

      // 系統指標
      systemMetrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    console.error('Metrics endpoint failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Failed to retrieve metrics',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 清除版本統計 (開發用途)
 */
export async function DELETE() {
  try {
    const { clearVersionStats } = await import('@/lib/middleware/apiVersioning');
    clearVersionStats();

    return NextResponse.json({
      status: 'success',
      message: 'Version statistics cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to clear statistics',
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 支援 HEAD 請求用於快速健康檢查
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'API-Version': 'v1',
      'X-API-Version': 'v1',
    },
  });
}
