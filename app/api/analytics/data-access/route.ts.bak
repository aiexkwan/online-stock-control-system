import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for DataAccessStrategy metrics recording
 * This endpoint receives performance metrics from the DataAccessLayer
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const metrics = await request.json();

    // Validate metrics data
    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 });
    }

    // Required fields validation
    const requiredFields = ['operation', 'strategy', 'duration', 'timestamp', 'success'];
    for (const field of requiredFields) {
      if (!(field in metrics)) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // For now, just log the metrics
    // In production, you might want to store these in a database or send to analytics service
    console.log('[DataAccess Metrics]', {
      operation: metrics.operation,
      strategy: metrics.strategy,
      duration: `${metrics.duration.toFixed(2)}ms`,
      success: metrics.success,
      dataSize: metrics.dataSize ? `${metrics.dataSize} bytes` : 'unknown',
      timestamp: new Date(metrics.timestamp).toISOString(),
    });

    // Optional: Store in database or analytics service
    // await storeMetrics(metrics);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Analytics API Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Gracefully handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit metrics.' },
    { status: 405 }
  );
}
