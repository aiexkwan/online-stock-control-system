import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const widgets = searchParams.get('widgets')?.split(',') || [];
    const warehouse = searchParams.get('warehouse');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const supabase = await createClient();
    const results = [];
    
    // Process each widget request
    for (const widgetId of widgets) {
      try {
        let widgetData;
        
        switch (widgetId) {
          case 'total_pallets':
            const { count: palletCount } = await supabase
              .from('record_palletinfo')
              .select('*', { count: 'exact', head: true });
            
            widgetData = {
              value: palletCount || 0,
              label: 'Total Pallets'
            };
            break;
            
          case 'today_transfers':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count: transferCount } = await supabase
              .from('record_transfer')
              .select('*', { count: 'exact', head: true })
              .gte('tran_date', today.toISOString());
            
            widgetData = {
              value: transferCount || 0,
              label: "Today's Transfers"
            };
            break;
            
          case 'active_products':
            const { count: productCount } = await supabase
              .from('data_code')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active');
            
            widgetData = {
              value: productCount || 0,
              label: 'Active Products'
            };
            break;
            
          case 'pending_orders':
            const { count: orderCount } = await supabase
              .from('data_order')
              .select('*', { count: 'exact', head: true })
              .is('loaded_qty', null);
            
            widgetData = {
              value: orderCount || 0,
              label: 'Pending Orders'
            };
            break;
            
          case 'await_percentage_stats':
            // Use optimized RPC for complex calculation
            const rpcStartDate = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const rpcEndDate = endDate || new Date().toISOString();
            
            const { data: awaitStatsApi, error: awaitApiError } = await supabase
              .rpc('rpc_get_await_percentage_stats', {
                p_start_date: rpcStartDate,
                p_end_date: rpcEndDate
              });
            
            if (awaitApiError) {
              console.error('API: Error fetching await percentage stats:', awaitApiError);
              widgetData = {
                value: 0,
                label: 'Error loading await stats',
                error: awaitApiError.message
              };
            } else {
              widgetData = {
                value: awaitStatsApi?.percentage || 0,
                label: 'Still In Await %',
                metadata: {
                  totalPallets: awaitStatsApi?.total_pallets || 0,
                  stillAwait: awaitStatsApi?.still_await || 0,
                  calculationTime: awaitStatsApi?.calculation_time,
                  dateRange: awaitStatsApi?.date_range,
                  optimized: true
                }
              };
            }
            break;
            
          case 'await_location_count':
            // Use optimized RPC for await location count
            const { data: awaitCountApi, error: awaitCountApiError } = await supabase
              .rpc('rpc_get_await_location_count');
            
            if (awaitCountApiError) {
              console.error('API: Error fetching await location count:', awaitCountApiError);
              widgetData = {
                value: 0,
                label: 'Error loading await count',
                error: awaitCountApiError.message
              };
            } else {
              widgetData = {
                value: awaitCountApi?.await_count || 0,
                label: 'Await Location Qty',
                metadata: {
                  calculationTime: awaitCountApi?.calculation_time,
                  method: awaitCountApi?.method,
                  optimized: awaitCountApi?.performance?.optimized || true
                }
              };
            }
            break;
            
          case 'transfer_count':
            // Transfer count with trend analysis
            const transferApiStartDate = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const transferApiEndDate = endDate || new Date().toISOString();
            
            // Get transfer count for specified range
            const { count: transferApiCount } = await supabase
              .from('record_transfer')
              .select('*', { count: 'exact', head: true })
              .gte('tran_date', transferApiStartDate)
              .lte('tran_date', transferApiEndDate);
            
            // Get today's count for trend comparison
            let apiTrendPercentage = 0;
            const apiToday = new Date();
            const apiTodayStart = new Date(apiToday.getFullYear(), apiToday.getMonth(), apiToday.getDate()).toISOString();
            const apiTodayEnd = new Date(apiToday.getFullYear(), apiToday.getMonth(), apiToday.getDate() + 1).toISOString();
            
            if (transferApiStartDate !== apiTodayStart) {
              const { count: apiTodayCount } = await supabase
                .from('record_transfer')
                .select('*', { count: 'exact', head: true })
                .gte('tran_date', apiTodayStart)
                .lt('tran_date', apiTodayEnd);
              
              if (apiTodayCount && apiTodayCount > 0) {
                apiTrendPercentage = ((transferApiCount || 0) - apiTodayCount) / apiTodayCount * 100;
              }
            }
            
            widgetData = {
              value: transferApiCount || 0,
              label: 'Transfer Done',
              metadata: {
                dateRange: {
                  start: transferApiStartDate,
                  end: transferApiEndDate
                },
                trend: apiTrendPercentage,
                optimized: true
              }
            };
            break;
            
          default:
            widgetData = {
              value: 0,
              label: 'Unknown Widget'
            };
        }
        
        results.push({
          widgetId,
          title: getWidgetTitle(widgetId),
          data: widgetData,
          lastUpdated: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`Error fetching widget ${widgetId}:`, error);
        results.push({
          widgetId,
          title: getWidgetTitle(widgetId),
          data: { error: 'Failed to load widget data' },
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    const response = {
      widgets: results,
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheHit: false,
        processingTime: Date.now() % 1000 // Simple mock timing
      }
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getWidgetTitle(widgetId: string): string {
  const titles: Record<string, string> = {
    total_pallets: 'Total Pallets',
    today_transfers: "Today's Transfers",
    active_products: 'Active Products',
    pending_orders: 'Pending Orders'
  };
  
  return titles[widgetId] || widgetId;
}