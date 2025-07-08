import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 獲取最近的倉庫活動 - 使用 record_transfer 表
    const { data: recentActivity, error } = await supabase
      .from('record_transfer')
      .select('*')
      .order('tran_date', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent warehouse activity:', error);
      return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: recentActivity || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Warehouse recent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
