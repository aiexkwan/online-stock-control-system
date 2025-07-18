import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 創建 Supabase 客戶端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function checkOrderStatus() {
  console.log('=== 檢查最近上傳的訂單狀態 ===\n');
  
  // 1. 檢查最近的 doc_upload 記錄
  console.log('1. 最近 24 小時的 doc_upload 記錄:');
  const { data: docUploads, error: docError } = await supabase
    .from('doc_upload')
    .select('*')
    .eq('doc_type', 'order')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (docError) {
    console.error('Error fetching doc_upload:', docError);
  } else if (docUploads) {
    docUploads.forEach(doc => {
      console.log(`\n文件: ${doc.doc_name}`);
      console.log(`  - 上傳時間: ${doc.created_at}`);
      console.log(`  - 上傳者 ID: ${doc.upload_by}`);
      console.log(`  - JSON 欄位: ${doc.json ? `已填充 (${doc.json.length} 字元)` : '空'}`);
      console.log(`  - Token 使用: ${doc.token || '無'}`);
      
      // 如果有 JSON，解析並顯示摘要
      if (doc.json) {
        try {
          const jsonData = JSON.parse(doc.json);
          console.log(`  - 訂單數量: ${jsonData.length}`);
          if (jsonData.length > 0) {
            console.log(`  - 第一個訂單:`, jsonData[0]);
          }
        } catch (e: any) {
          console.log(`  - JSON 解析錯誤:`, (e as { message: string }).message);
        }
      }
    });
  }
  
  // 2. 檢查最近的 data_order 記錄
  console.log('\n\n2. 最近 24 小時的 data_order 記錄統計:');
  const { data: orderStats, error: orderError } = await supabase
    .from('data_order')
    .select('uploaded_by, order_ref, delivery_add, account_num')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (orderError) {
    console.error('Error fetching data_order:', orderError);
  } else if (orderStats) {
    // 按上傳者分組
    const byUploader: Record<string, typeof orderStats> = {};
    orderStats.forEach(order => {
      if (!byUploader[order.uploaded_by]) {
        byUploader[order.uploaded_by] = [];
      }
      byUploader[order.uploaded_by].push(order);
    });
    
    Object.entries(byUploader).forEach(([uploaderId, orders]) => {
      console.log(`\n上傳者 ID ${uploaderId}: ${orders.length} 個訂單`);
      console.log(`  訂單號: ${orders.map((o: any) => o.order_ref).join(', ')}`);
      
      // 檢查 delivery_add 和 account_num
      const hasDeliveryAdd = orders.some(o => o.delivery_add && o.delivery_add !== '-');
      const hasAccountNum = orders.some(o => o.account_num && o.account_num !== '-');
      console.log(`  delivery_add: ${hasDeliveryAdd ? '✓ 有資料' : '✗ 無資料'}`);
      console.log(`  account_num: ${hasAccountNum ? '✓ 有資料' : '✗ 無資料'}`);
      
      if (hasDeliveryAdd || hasAccountNum) {
        console.log('  範例資料:');
        const sampleOrder = orders.find(o => (o.delivery_add && o.delivery_add !== '-') || (o.account_num && o.account_num !== '-'));
        if (sampleOrder) {
          if (sampleOrder.delivery_add && sampleOrder.delivery_add !== '-') {
            console.log(`    - delivery_add: ${sampleOrder.delivery_add}`);
          }
          if (sampleOrder.account_num && sampleOrder.account_num !== '-') {
            console.log(`    - account_num: ${sampleOrder.account_num}`);
          }
        }
      }
    });
  }
  
  // 3. 檢查是否使用了新的 Vision API
  console.log('\n\n3. 檢查 Vision API 使用情況:');
  const recentTokenUsage = docUploads?.filter((d: Record<string, unknown>) => d.token && d.token > 0);
  if (recentTokenUsage && recentTokenUsage.length > 0) {
    console.log(`✓ 有 ${recentTokenUsage.length} 個文件使用了 API 分析`);
    recentTokenUsage.forEach(doc => {
      console.log(`  - ${doc.doc_name}: ${doc.token} tokens`);
    });
  } else {
    console.log('✗ 最近沒有文件使用 API 分析');
  }
}

checkOrderStatus().catch(console.error);