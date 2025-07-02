import { createClient } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 獲取倉庫摘要數據 - 這裡可以根據實際需求調整查詢
    const { data: warehouseSummary, error } = await supabase
      .from('stock_level')
      .select('location, qty')
      .order('location');

    if (error) {
      console.error('Error fetching warehouse summary:', error);
      return NextResponse.json({ error: 'Failed to fetch warehouse summary' }, { status: 500 });
    }

    // 聚合數據
    const summary = warehouseSummary?.reduce((acc: any, item: any) => {
      if (!acc[item.location]) {
        acc[item.location] = { location: item.location, totalQty: 0, itemCount: 0 };
      }
      acc[item.location].totalQty += item.qty || 0;
      acc[item.location].itemCount += 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: Object.values(summary || {}),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Warehouse summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 