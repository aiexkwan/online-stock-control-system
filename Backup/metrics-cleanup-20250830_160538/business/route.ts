/**
 * 統一業務指標 API 端點
 * 整合 v1 業務指標的統一端點
 * 創建日期: 2025-08-29
 */

import { NextResponse } from 'next/server';

interface BusinessMetrics {
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    year: number;
    total?: number; // Optional total field for filtered results
  };
  performance: {
    averageOrderValue: number;
    conversionRate: number;
    fulfillmentRate: number;
  };
}

/**
 * 獲取業務指標（模擬數據版本）
 * 注意：這是一個簡化版本，實際數據需要從資料庫獲取
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'day';
    const detailed = url.searchParams.get('detailed') === 'true';

    // 模擬業務指標數據
    const metrics: BusinessMetrics = {
      orders: {
        total: 1250,
        pending: 45,
        completed: 1180,
        cancelled: 25,
        todayCount: 32,
        weekCount: 215,
        monthCount: 890,
      },
      products: {
        total: 450,
        inStock: 380,
        lowStock: 45,
        outOfStock: 25,
      },
      revenue: {
        today: 4580.5,
        week: 32450.75,
        month: 125680.3,
        year: 1456789.2,
      },
      performance: {
        averageOrderValue: 125.5,
        conversionRate: 68.5,
        fulfillmentRate: 94.4,
      },
    };

    // 根據 period 參數過濾數據
    let filteredMetrics = metrics;
    if (!detailed) {
      if (period === 'day') {
        // 返回今日數據
        filteredMetrics = {
          ...metrics,
          orders: {
            ...metrics.orders,
            total: metrics.orders.todayCount,
          },
          revenue: {
            ...metrics.revenue,
            total: metrics.revenue.today,
          },
        };
      } else if (period === 'week') {
        // 返回本週數據
        filteredMetrics = {
          ...metrics,
          orders: {
            ...metrics.orders,
            total: metrics.orders.weekCount,
          },
          revenue: {
            ...metrics.revenue,
            total: metrics.revenue.week,
          },
        };
      } else if (period === 'month') {
        // 返回本月數據
        filteredMetrics = {
          ...metrics,
          orders: {
            ...metrics.orders,
            total: metrics.orders.monthCount,
          },
          revenue: {
            ...metrics.revenue,
            total: metrics.revenue.month,
          },
        };
      }
    }

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      period,
      metrics: filteredMetrics,
      metadata: {
        version: 'unified',
        dataSource: 'simulated',
        cacheStatus: 'static',
        processingTime: '5ms',
        note: 'This is a simplified version with simulated data. Connect to database for real metrics.',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=60',
        'X-API-Version': 'unified',
        'X-Metrics-Type': 'business',
        'X-Data-Source': 'simulated',
      },
    });
  } catch (error) {
    console.error('Business metrics fetch failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: null,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-API-Version': 'unified',
          'X-Metrics-Type': 'business',
        },
      }
    );
  }
}

/**
 * 支援 HEAD 請求
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'unified',
      'X-Metrics-Type': 'business',
      'X-Service-Status': 'available',
    },
  });
}
