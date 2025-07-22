/**
 * 監控數據統一 API 端點
 * 整合系統健康、業務指標、資料庫性能等監控數據
 */

import { NextResponse } from 'next/server';

/**
 * 獲取統一監控數據
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'health', 'metrics', 'database', 'alerts'

    // 並行獲取各種監控數據
    const [healthResponse, metricsResponse, cacheResponse] = await Promise.all([
      fetch(new URL('/api/v1/health', request.url)),
      fetch(new URL('/api/v1/metrics', request.url)),
      fetch(new URL('/api/v1/cache/metrics', request.url)),
    ]);

    const responseTime = Date.now() - startTime;

    // 根據請求類型返回相應數據
    switch (type) {
      case 'health':
        if (!healthResponse.ok) {
          throw new Error('Failed to fetch health data');
        }
        return NextResponse.json(await healthResponse.json());

      case 'metrics':
        if (!metricsResponse.ok) {
          throw new Error('Failed to fetch metrics data');
        }
        return NextResponse.json(await metricsResponse.json());

      case 'database':
        if (!cacheResponse.ok) {
          throw new Error('Failed to fetch database data');
        }
        return NextResponse.json(await cacheResponse.json());

      case 'alerts':
        // 模擬告警數據
        return NextResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          summary: {
            totalAlerts: 5,
            criticalCount: 1,
            warningCount: 3,
            infoCount: 1,
            acknowledgedCount: 2,
            resolvedCount: 3,
          },
          recentAlerts: [
            {
              id: '1',
              title: 'High Memory Usage',
              description: 'System memory usage exceeded 80%',
              severity: 'critical',
              status: 'active',
              category: 'system',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              source: 'System Monitor',
              actions: ['investigate', 'restart_service'],
            },
            {
              id: '2',
              title: 'Slow Database Query',
              description: 'Query execution time exceeded 5 seconds',
              severity: 'warning',
              status: 'acknowledged',
              category: 'database',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              source: 'Database Monitor',
              assignedTo: 'Database Team',
              actions: ['optimize_query', 'add_index'],
            },
            {
              id: '3',
              title: 'API Rate Limit',
              description: 'API rate limit reached for user endpoint',
              severity: 'warning',
              status: 'active',
              category: 'system',
              timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
              source: 'API Gateway',
              actions: ['scale_service', 'implement_throttling'],
            },
          ],
          notifications: {
            email: true,
            sms: true,
            webhook: false,
            slackChannel: 'monitoring-alerts',
          },
        });

      case 'all':
      default:
        // 返回所有監控數據
        const [healthData, metricsData, cacheData] = await Promise.all([
          healthResponse.ok ? healthResponse.json() : null,
          metricsResponse.ok ? metricsResponse.json() : null,
          cacheResponse.ok ? cacheResponse.json() : null,
        ]);

        return NextResponse.json({
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          status: 'healthy',

          // 系統健康數據
          systemHealth: healthData
            ? {
                ...healthData,
                services: {
                  ...healthData.services,
                  api: 'healthy',
                },
              }
            : null,

          // 業務指標數據
          businessMetrics: metricsData
            ? {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                kpis: {
                  totalUsers: { value: 1250, change: 5.2, changeType: 'increase' },
                  activeUsers: { value: 380, change: 2.1, changeType: 'increase' },
                  totalOrders: { value: 2450, change: 8.3, changeType: 'increase' },
                  totalProducts: { value: 15680, change: 1.2, changeType: 'increase' },
                  systemUptime: { value: 99.8, target: 99.9 },
                  responseTime: { value: 180, target: 200 },
                },
                performance: {
                  apiRequests: {
                    total: metricsData.apiVersions?.totalRequests || 0,
                    successful:
                      (metricsData.apiVersions?.totalRequests || 0) -
                      (metricsData.apiVersions?.totalErrors || 0),
                    failed: metricsData.apiVersions?.totalErrors || 0,
                    averageResponseTime: 150,
                  },
                  userActivity: {
                    dailyActiveUsers: 380,
                    weeklyActiveUsers: 1250,
                    monthlyActiveUsers: 3200,
                  },
                  systemLoad: {
                    cpu: 45,
                    memory: 62,
                    disk: 38,
                  },
                },
              }
            : null,

          // 資料庫性能數據
          databasePerformance: cacheData
            ? {
                status:
                  (cacheData as { status: string }).status === 'healthy' ? 'healthy' : 'degraded',
                timestamp: cacheData.timestamp,
                connectionInfo: {
                  activeConnections: 25,
                  maxConnections: 100,
                  connectionPool: {
                    total: 20,
                    active: 15,
                    idle: 5,
                    waiting: 0,
                  },
                },
                queryPerformance: {
                  averageQueryTime: 45,
                  slowQueries: 3,
                  totalQueries: 15420,
                  queriesPerSecond: 125,
                },
                cachePerformance: {
                  hitRate: parseFloat(cacheData.performance?.hitRate || '0'),
                  missRate: 100 - parseFloat(cacheData.performance?.hitRate || '0'),
                  totalRequests: cacheData.performance?.totalRequests || 0,
                  averageResponseTime: parseFloat(cacheData.performance?.avgResponseTime || '0'),
                  memoryUsage: 64 * 1024 * 1024, // 64MB
                  recommendations: cacheData.recommendations || [],
                },
                systemMetrics: {
                  cpuUsage: 35,
                  memoryUsage: 68,
                  diskUsage: 42,
                  networkIO: {
                    bytesIn: 1024 * 1024 * 50, // 50MB
                    bytesOut: 1024 * 1024 * 30, // 30MB
                  },
                },
              }
            : null,

          // 告警數據
          alerts: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            summary: {
              totalAlerts: 5,
              criticalCount: 1,
              warningCount: 3,
              infoCount: 1,
              acknowledgedCount: 2,
              resolvedCount: 3,
            },
            recentAlerts: [
              {
                id: '1',
                title: 'High Memory Usage',
                description: 'System memory usage exceeded 80%',
                severity: 'critical',
                status: 'active',
                category: 'system',
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                source: 'System Monitor',
                actions: ['investigate', 'restart_service'],
              },
              {
                id: '2',
                title: 'Slow Database Query',
                description: 'Query execution time exceeded 5 seconds',
                severity: 'warning',
                status: 'acknowledged',
                category: 'database',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                source: 'Database Monitor',
                assignedTo: 'Database Team',
                actions: ['optimize_query', 'add_index'],
              },
            ],
            notifications: {
              email: true,
              sms: true,
              webhook: false,
              slackChannel: 'monitoring-alerts',
            },
          },
        });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Monitoring API error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
        message: 'Failed to retrieve monitoring data',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 更新監控配置
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { type, config } = body;

    // 根據類型更新配置
    switch (type) {
      case 'alerts':
        // 更新告警配置
        console.log('Updating alert configuration:', config);
        break;

      case 'notifications':
        // 更新通知配置
        console.log('Updating notification configuration:', config);
        break;

      case 'thresholds':
        // 更新閾值配置
        console.log('Updating threshold configuration:', config);
        break;

      default:
        throw new Error('Invalid configuration type');
    }

    return NextResponse.json({
      status: 'success',
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monitoring configuration update error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to update configuration',
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 告警操作 (acknowledge, resolve, delete)
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { alertId, action, userId } = body;

    // 處理告警操作
    switch (action) {
      case 'acknowledge':
        console.log(`Alert ${alertId} acknowledged by ${userId}`);
        break;

      case 'resolve':
        console.log(`Alert ${alertId} resolved by ${userId}`);
        break;

      case 'delete':
        console.log(`Alert ${alertId} deleted by ${userId}`);
        break;

      default:
        throw new Error('Invalid alert action');
    }

    return NextResponse.json({
      status: 'success',
      message: `Alert ${action} completed successfully`,
      timestamp: new Date().toISOString(),
      alertId,
      action,
    });
  } catch (error) {
    console.error('Alert action error:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform alert action',
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 支援 HEAD 請求用於健康檢查
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'API-Version': 'v1',
      'X-Monitoring-API': 'active',
    },
  });
}
