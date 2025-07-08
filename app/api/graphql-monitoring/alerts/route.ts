import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/graphql/performance-monitor';

/**
 * GraphQL Performance Alerts API
 *
 * GET /api/graphql-monitoring/alerts - Get recent performance alerts
 * POST /api/graphql-monitoring/alerts - Update alert thresholds
 * DELETE /api/graphql-monitoring/alerts/:id - Clear a specific alert
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStatus = searchParams.get('status') === 'true';

    const alerts = performanceMonitor.getRecentAlerts(limit);

    const response: any = { alerts };

    if (includeStatus) {
      response.status = performanceMonitor.getStatus();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching performance alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thresholds } = body;

    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json({ error: 'Invalid thresholds provided' }, { status: 400 });
    }

    // Validate threshold values
    const validThresholds: any = {};

    if (typeof thresholds.maxExecutionTime === 'number' && thresholds.maxExecutionTime > 0) {
      validThresholds.maxExecutionTime = thresholds.maxExecutionTime;
    }

    if (typeof thresholds.maxComplexity === 'number' && thresholds.maxComplexity > 0) {
      validThresholds.maxComplexity = thresholds.maxComplexity;
    }

    if (
      typeof thresholds.minCacheHitRate === 'number' &&
      thresholds.minCacheHitRate >= 0 &&
      thresholds.minCacheHitRate <= 1
    ) {
      validThresholds.minCacheHitRate = thresholds.minCacheHitRate;
    }

    if (
      typeof thresholds.maxErrorRate === 'number' &&
      thresholds.maxErrorRate >= 0 &&
      thresholds.maxErrorRate <= 1
    ) {
      validThresholds.maxErrorRate = thresholds.maxErrorRate;
    }

    if (Object.keys(validThresholds).length === 0) {
      return NextResponse.json({ error: 'No valid thresholds provided' }, { status: 400 });
    }

    performanceMonitor.updateThresholds(validThresholds);

    return NextResponse.json({
      success: true,
      message: 'Thresholds updated successfully',
      updatedThresholds: validThresholds,
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    return NextResponse.json({ error: 'Failed to update thresholds' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const alertId = pathname.split('/').pop();

    if (!alertId || alertId === 'alerts') {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    performanceMonitor.clearAlert(alertId);

    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} cleared successfully`,
    });
  } catch (error) {
    console.error('Error clearing alert:', error);
    return NextResponse.json({ error: 'Failed to clear alert' }, { status: 500 });
  }
}
