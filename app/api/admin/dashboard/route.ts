import { NextRequest, NextResponse } from 'next/server';
import { createDashboardAPI, type DashboardResult } from '@/lib/api/admin/DashboardAPI';
import { ApiResult, successResult, errorResult, handleAsync } from '@/lib/types/api';

// Track API calls for debugging
let requestCounter = 0;

interface RequestLogEntry {
  id: number;
  timestamp: string;
  widgets: string[];
  userAgent?: string;
  referer?: string;
  ip?: string;
  duration?: number;
}

const requestLog: RequestLogEntry[] = [];

export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<DashboardResult>>> {
  const startTime = Date.now();
  const requestId = ++requestCounter;

  const result = await handleAsync(async (): Promise<DashboardResult> => {
    const searchParams = request.nextUrl.searchParams;
    const widgets = searchParams.get('widgets')?.split(',') || [];
    const warehouse = searchParams.get('warehouse');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Log request details for debugging
    const logEntry: RequestLogEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      widgets,
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    console.log(`🔥 API CALL #${requestId}:`, JSON.stringify(logEntry, null, 2));

    // Use existing DashboardAPI instead of duplicating logic
    const dashboardAPI = createDashboardAPI();

    const dashboardResult = await dashboardAPI.serverFetch({
      widgetIds: widgets,
      warehouse: warehouse || undefined,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
      params: {
        limit,
        offset,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
    });

    const duration = Date.now() - startTime;
    logEntry.duration = duration;
    requestLog.push(logEntry);

    // Keep only last 100 requests
    if (requestLog.length > 100) {
      requestLog.splice(0, requestLog.length - 100);
    }

    console.log(`✅ API CALL #${requestId} completed in ${duration}ms`);
    console.log(`📊 Total requests since restart: ${requestCounter}`);

    return dashboardResult;
  }, 'Dashboard API failed');

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=900',
      'Content-Type': 'application/json',
      'X-Request-Id': requestId.toString(),
      'X-Total-Requests': requestCounter.toString(),
    },
    status: result.success ? 200 : 500,
  });
}
