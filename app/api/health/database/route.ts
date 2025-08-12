/**
 * Database Health Check API
 * 資料庫健康檢查 API 端點
 */

import { NextRequest, NextResponse } from 'next/server';
import { databaseHealthService } from '@/lib/services/database-health-service';
import { systemLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const detailed = searchParams.get('detailed') === 'true';
    const component = searchParams.get('component');
    
    if (detailed) {
      // 執行完整的健康檢查
      const healthStatus = await databaseHealthService.performFullHealthCheck();
      
      systemLogger.info({
        overall: healthStatus.overall,
        checksCount: healthStatus.checks.length,
        criticalIssues: healthStatus.checks.filter(c => c.critical && c.status === 'failed').length
      }, 'Database health check performed');
      
      return NextResponse.json(healthStatus);
    } else {
      // 快速健康檢查
      const healthStatus = await databaseHealthService.getCachedHealthStatus();
      const transferReadiness = await databaseHealthService.canPerformTransfer();
      
      const summary = {
        status: healthStatus.overall,
        canPerformTransfers: transferReadiness.allowed,
        degradedMode: transferReadiness.degradedMode,
        lastCheck: healthStatus.lastFullCheck,
        summary: {
          total: healthStatus.checks.length,
          healthy: healthStatus.checks.filter(c => c.status === 'healthy').length,
          degraded: healthStatus.checks.filter(c => c.status === 'degraded').length,
          failed: healthStatus.checks.filter(c => c.status === 'failed').length,
          criticalFailed: healthStatus.checks.filter(c => c.critical && c.status === 'failed').length
        }
      };
      
      if (component) {
        const componentCheck = healthStatus.checks.find(c => c.component === component);
        return NextResponse.json({
          ...summary,
          componentDetail: componentCheck
        });
      }
      
      return NextResponse.json(summary);
    }
  } catch (error) {
    systemLogger.error({ error }, 'Health check API error');
    
    return NextResponse.json(
      {
        status: 'failed',
        error: 'Health check failed',
        canPerformTransfers: false
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 強制執行新的健康檢查
    const healthStatus = await databaseHealthService.performFullHealthCheck();
    
    systemLogger.info({
      overall: healthStatus.overall,
      checksCount: healthStatus.checks.length
    }, 'Forced database health check performed');
    
    return NextResponse.json({
      message: 'Health check completed',
      status: healthStatus
    });
  } catch (error) {
    systemLogger.error({ error }, 'Forced health check failed');
    
    return NextResponse.json(
      {
        error: 'Failed to perform health check',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}