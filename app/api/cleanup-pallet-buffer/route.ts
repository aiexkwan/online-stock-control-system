import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { getErrorMessage } from '@/types/core/error';

// 創建 service role client 用於清理操作
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 檢查 authorization（可選）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 如果設置了 CRON_SECRET，驗證請求
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    process.env.NODE_ENV !== 'production' &&
      console.log('[Cleanup API] Starting pallet buffer cleanup...');

    // 調用清理函數
    const { data, error } = await supabase.rpc('api_cleanup_pallet_buffer');

    if (error) {
      console.error('[Cleanup API] Cleanup failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: getErrorMessage(error),
        },
        { status: 500 }
      );
    }

    process.env.NODE_ENV !== 'production' && console.log('[Cleanup API] Cleanup completed:', data);

    return NextResponse.json({
      success: true,
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Cleanup API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error) || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET method for manual trigger or health check
export async function GET() {
  try {
    // 獲取 buffer 狀態
    const { data: bufferStats, error } = await supabase
      .from('pallet_number_buffer')
      .select('used')
      .eq('date_str', format(new Date(), 'yyyy-MM-dd'));

    if (error) {
      throw error;
    }

    const stats = {
      total: bufferStats?.length || 0,
      used: bufferStats?.filter(item => item.used).length || 0,
      unused: bufferStats?.filter(item => !item.used).length || 0,
      date: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      stats,
      message: 'Use POST method to trigger cleanup',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
