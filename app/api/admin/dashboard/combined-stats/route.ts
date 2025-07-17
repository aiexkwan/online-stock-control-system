import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/client';

/**
 * 合併統計數據 API
 * 將多個統計查詢合併為單一請求，減少 API 調用數量
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[API-LOG-${requestId}] Combined stats API called at ${new Date().toISOString()}`);
  
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    console.log(`[API-LOG-${requestId}] Query params:`, { startDate, endDate });
    
    // 暫時使用模擬數據，後續可以改為真實數據庫查詢
    console.log(`[API-LOG-${requestId}] Using mock data for testing`);
    
    const stats = {
      total_products: 1500 + Math.floor(Math.random() * 100),
      today_production: 45 + Math.floor(Math.random() * 10),
      total_quantity: 25000 + Math.floor(Math.random() * 1000)
    };
    
    const error = null; // 模擬成功
    
    if (error) {
      console.error(`[API-LOG-${requestId}] RPC error:`, error);
      throw error;
    }
    
    // 構建響應數據
    const response = {
      total_products: stats?.total_products || 0,
      today_production: stats?.today_production || 0,
      total_quantity: stats?.total_quantity || 0,
      // 包含時間戳以便調試
      timestamp: new Date().toISOString(),
      requestId,
      fetchTime: Date.now() - startTime
    };
    
    console.log(`[API-LOG-${requestId}] Response data:`, response);
    console.log(`[API-LOG-${requestId}] Request completed in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`[API-LOG-${requestId}] Error in combined-stats API:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch combined stats',
        requestId,
        timestamp: new Date().toISOString(),
        fetchTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}