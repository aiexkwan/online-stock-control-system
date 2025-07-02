import { createClient } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 獲取最近的倉庫活動 - 這裡可以根據實際需求調整查詢
    const { data: recentActivity, error } = await supabase
      .from('stock_transfer')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching recent warehouse activity:', error);
      return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: recentActivity || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Warehouse recent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 