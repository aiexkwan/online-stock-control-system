import { NextRequest, NextResponse } from 'next/server';
import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const widgets = searchParams.get('widgets')?.split(',') || [];
    const warehouse = searchParams.get('warehouse');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use existing DashboardAPI instead of duplicating logic
    const dashboardAPI = createDashboardAPI();
    
    const result = await dashboardAPI.serverFetch({
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

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
