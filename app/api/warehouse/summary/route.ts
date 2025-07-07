import { createClient } from '@/app/utils/supabase/server';
import { createInventoryService } from '@/lib/inventory/services';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const inventoryService = createInventoryService(supabase);

    // 獲取倉庫摘要數據 - 使用 record_inventory 表
    const { data: warehouseSummary, error } = await supabase
      .from('record_inventory')
      .select('product_code, injection, pipeline, prebook, await, fold, bulk, backcarpark, damage, await_grn')
      .order('product_code');

    if (error) {
      console.error('Error fetching warehouse summary:', error);
      return NextResponse.json({ error: 'Failed to fetch warehouse summary' }, { status: 500 });
    }

    // 聚合數據 - 計算每個位置的總數量
    const locationTotals = {
      injection: 0,
      pipeline: 0,
      prebook: 0,
      await: 0,
      fold: 0,
      bulk: 0,
      backcarpark: 0,
      damage: 0,
      await_grn: 0
    };

    const itemCounts = {
      injection: 0,
      pipeline: 0,
      prebook: 0,
      await: 0,
      fold: 0,
      bulk: 0,
      backcarpark: 0,
      damage: 0,
      await_grn: 0
    };

    warehouseSummary?.forEach((item: any) => {
      Object.keys(locationTotals).forEach(location => {
        const qty = item[location] || 0;
        if (qty > 0) {
          locationTotals[location as keyof typeof locationTotals] += qty;
          itemCounts[location as keyof typeof itemCounts] += 1;
        }
      });
    });

    // 轉換為所需格式
    const summary = Object.keys(locationTotals).map(location => ({
      location,
      totalQty: locationTotals[location as keyof typeof locationTotals],
      itemCount: itemCounts[location as keyof typeof itemCounts]
    })).filter(item => item.totalQty > 0);

    return NextResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Warehouse summary API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 