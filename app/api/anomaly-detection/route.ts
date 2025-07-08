import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 檢查用戶權限
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 執行異常檢測
    const anomalies = await detectAllAnomalies(supabase);

    return NextResponse.json({
      success: true,
      anomalies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Anomaly Detection API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function detectAllAnomalies(supabase: any) {
  const anomalies = [];

  try {
    // 並行執行所有檢測
    const [stuckPallets, inventoryIssues, overdueOrders] = await Promise.all([
      detectStuckPallets(supabase),
      detectInventoryMismatch(supabase),
      detectOverdueOrders(supabase),
    ]);

    if (stuckPallets) anomalies.push(stuckPallets);
    if (inventoryIssues) anomalies.push(inventoryIssues);
    if (overdueOrders) anomalies.push(overdueOrders);
  } catch (error) {
    console.error('[Anomaly Detection] Error:', error);
  }

  return anomalies;
}

// 1. 檢測超過30日未移動的棧板
async function detectStuckPallets(supabase: any) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = `WITH pallet_activities AS (
  SELECT 
    p.plt_num,
    p.product_code,
    p.product_qty,
    dc.description as product_name,
    COALESCE(
      (SELECT MAX(time) 
       FROM record_history h 
       WHERE h.plt_num = p.plt_num 
         AND h.action IN ('Move', 'Stock Transfer', 'QC Done', 'GRN Received', 'Order Load')
      ), 
      p.created_date
    ) as last_activity,
    (SELECT loc 
     FROM record_history h2 
     WHERE h2.plt_num = p.plt_num 
     ORDER BY h2.time DESC 
     LIMIT 1
    ) as current_location
  FROM record_palletinfo p
  LEFT JOIN data_code dc ON p.product_code = dc.code
  WHERE p.plt_num IS NOT NULL
)
SELECT 
  plt_num,
  product_code,
  product_qty,
  product_name,
  last_activity,
  CASE 
    WHEN last_activity IS NULL THEN 999
    ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - last_activity)::INTEGER
  END as days_stuck,
  COALESCE(current_location, 'Unknown') as current_location
FROM pallet_activities
WHERE last_activity < '${thirtyDaysAgo.toISOString()}'
   OR last_activity IS NULL
ORDER BY days_stuck DESC
LIMIT 50`;

    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query,
    });

    if (error) {
      console.error('[Anomaly Detection] Error detecting stuck pallets:', error);
      return null;
    }

    if (data && data.length > 0) {
      // Convert JSONB result to proper format
      const formattedData = data.map((row: any) => row.result || row);

      return {
        type: 'stuck_pallets',
        severity: formattedData.length > 20 ? 'high' : 'medium',
        title: `${formattedData.length} Pallets Stuck Over 30 Days`,
        description: `Found ${formattedData.length} pallets that haven't moved in over 30 days. This may indicate forgotten inventory or process issues.`,
        count: formattedData.length,
        data: formattedData.slice(0, 10),
        suggestedAction: 'Review and relocate these pallets, or mark for disposal if damaged.',
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('[Anomaly Detection] detectStuckPallets error:', error);
    return null;
  }
}

// 2. 檢測庫存數量異常
async function detectInventoryMismatch(supabase: any) {
  try {
    const query = `WITH inventory_totals AS (
  SELECT 
    p.product_code,
    SUM(p.product_qty) as pallet_total,
    COUNT(DISTINCT p.plt_num) as pallet_count
  FROM record_palletinfo p
  JOIN record_inventory i ON p.plt_num = i.plt_num
  WHERE (i.injection + i.pipeline + i.await + i.fold + i.bulk + i.backcarpark) > 0
    AND i.damage = 0
  GROUP BY p.product_code
),
mismatches AS (
  SELECT 
    it.product_code,
    dc.description as product_name,
    it.pallet_total,
    sl.stock_level,
    ABS(it.pallet_total - sl.stock_level) as difference,
    CASE 
      WHEN sl.stock_level = 0 THEN 100
      ELSE ABS(it.pallet_total - sl.stock_level) * 100.0 / sl.stock_level 
    END as variance_percentage
  FROM inventory_totals it
  JOIN stock_level sl ON it.product_code = sl.stock
  LEFT JOIN data_code dc ON it.product_code = dc.code
  WHERE ABS(it.pallet_total - sl.stock_level) > 10
    AND (
      sl.stock_level = 0 OR 
      ABS(it.pallet_total - sl.stock_level) * 100.0 / sl.stock_level > 5
    )
)
SELECT * FROM mismatches
ORDER BY difference DESC
LIMIT 20`;

    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query,
    });

    if (error) {
      console.error('[Anomaly Detection] Error detecting inventory mismatch:', error);
      return null;
    }

    if (data && data.length > 0) {
      // Convert JSONB result to proper format
      const formattedData = data.map((row: any) => row.result || row);
      const criticalCount = formattedData.filter(
        (item: any) => item.variance_percentage > 20
      ).length;

      return {
        type: 'inventory_mismatch',
        severity: criticalCount > 5 ? 'high' : 'medium',
        title: `${formattedData.length} Products with Inventory Discrepancies`,
        description: `Found ${formattedData.length} products where physical count doesn't match system records. ${criticalCount} have variance over 20%.`,
        count: formattedData.length,
        data: formattedData.slice(0, 10),
        suggestedAction:
          'Perform physical stock count for these products and update system records.',
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('[Anomaly Detection] detectInventoryMismatch error:', error);
    return null;
  }
}

// 3. 檢測超時訂單
async function detectOverdueOrders(supabase: any) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = `SELECT 
  o.order_ref,
  o.product_code,
  dc.description as product_name,
  o.product_qty::integer as ordered_qty,
  COALESCE(o.loaded_qty::integer, 0) as loaded_qty,
  (o.product_qty::integer - COALESCE(o.loaded_qty::integer, 0)) as remaining_qty,
  o.created_at,
  EXTRACT(DAY FROM CURRENT_TIMESTAMP - o.created_at)::INTEGER as days_overdue,
  o.account_num as customer
FROM data_order o
LEFT JOIN data_code dc ON o.product_code = dc.code
WHERE COALESCE(o.loaded_qty::integer, 0) < o.product_qty::integer
  AND o.created_at < '${sevenDaysAgo.toISOString()}'
ORDER BY o.created_at ASC
LIMIT 50`;

    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query,
    });

    if (error) {
      console.error('[Anomaly Detection] Error detecting overdue orders:', error);
      return null;
    }

    if (data && data.length > 0) {
      // Convert JSONB result to proper format
      const formattedData = data.map((row: any) => row.result || row);
      const criticalOrders = formattedData.filter((order: any) => order.days_overdue > 14).length;

      return {
        type: 'overdue_orders',
        severity: criticalOrders > 0 ? 'critical' : 'high',
        title: `${formattedData.length} Overdue Orders`,
        description: `Found ${formattedData.length} orders that are overdue. ${criticalOrders} are over 14 days old and require immediate attention.`,
        count: formattedData.length,
        data: formattedData.slice(0, 10),
        suggestedAction: 'Contact customers for critical orders and expedite fulfillment.',
        detectedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('[Anomaly Detection] detectOverdueOrders error:', error);
    return null;
  }
}
