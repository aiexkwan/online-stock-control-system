#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 獲取當前檔案的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入環境變數
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 測試 Supabase 連接...\n');

// 檢查環境變數
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少必要的環境變數:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

console.log('✅ 環境變數已載入');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 1. 測試基本連接 - 查詢 query_record 表
    console.log('📊 測試查詢 query_record 表...');
    const { data: queryRecords, error: queryError } = await supabase
      .from('query_record')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('❌ 查詢 query_record 失敗:', queryError);
    } else {
      console.log(`✅ 成功查詢 query_record，找到 ${queryRecords?.length || 0} 筆最近記錄`);
      if (queryRecords && queryRecords.length > 0) {
        console.log('\n最近的查詢記錄:');
        queryRecords.forEach((record, index) => {
          console.log(`${index + 1}. ${record.query || 'N/A'} (${new Date(record.created_at).toLocaleString()})`);
        });
      }
    }

    // 2. 測試查詢產品表 (data_code)
    console.log('\n📦 測試查詢 data_code 表...');
    const { data: products, error: productsError } = await supabase
      .from('data_code')
      .select('*')
      .limit(5);

    if (productsError) {
      console.error('❌ 查詢 data_code 失敗:', productsError);
    } else {
      console.log(`✅ 成功查詢 data_code，找到 ${products?.length || 0} 個產品`);
      if (products && products.length > 0) {
        console.log('\n產品範例:');
        products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.code} - ${product.description} (標準數量: ${product.standard_qty})`);
        });
      }
    }

    // 3. 測試查詢庫存表 (record_inventory)
    console.log('\n📈 測試查詢 record_inventory 表...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('record_inventory')
      .select('*')
      .limit(5);

    if (inventoryError) {
      console.error('❌ 查詢 record_inventory 失敗:', inventoryError);
    } else {
      console.log(`✅ 成功查詢 record_inventory，找到 ${inventory?.length || 0} 筆記錄`);
      if (inventory && inventory.length > 0) {
        console.log('\n庫存範例:');
        inventory.forEach((item, index) => {
          const totalQty = Number(item.injection || 0) + Number(item.pipeline || 0) + 
                          Number(item.prebook || 0) + Number(item.await || 0) + 
                          Number(item.fold || 0) + Number(item.bulk || 0) + 
                          Number(item.backcarpark || 0);
          console.log(`${index + 1}. ${item.product_code} - 托盤: ${item.plt_num}, 總數量: ${totalQty}`);
        });
      }
    }

    // 4. 測試查詢托盤資訊 (record_palletinfo)
    console.log('\n📦 測試查詢 record_palletinfo 表...');
    const { data: pallets, error: palletsError } = await supabase
      .from('record_palletinfo')
      .select('*')
      .order('generate_time', { ascending: false })
      .limit(5);

    if (palletsError) {
      console.error('❌ 查詢 record_palletinfo 失敗:', palletsError);
    } else {
      console.log(`✅ 成功查詢 record_palletinfo，找到 ${pallets?.length || 0} 筆記錄`);
      if (pallets && pallets.length > 0) {
        console.log('\n托盤範例:');
        pallets.forEach((pallet, index) => {
          console.log(`${index + 1}. ${pallet.plt_num} - 產品: ${pallet.product_code}, 數量: ${pallet.product_qty}`);
        });
      }
    }

    // 5. 列出所有已知的表
    console.log('\n📋 檢查所有已知表格...');
    const knownTables = [
      'data_code', 'data_id', 'data_slateinfo', 'data_supplier',
      'query_record', 'record_aco', 'record_aco_detail', 'record_grn',
      'record_history', 'record_inventory', 'record_palletinfo',
      'record_slate', 'record_transfer', 'report_log', 'report_void'
    ];
    
    console.log('\n檢查表格可訪問性:');
    let accessibleTables = [];
    for (const tableName of knownTables) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${tableName} - 可訪問`);
        accessibleTables.push(tableName);
      } else {
        console.log(`❌ ${tableName} - ${error.message}`);
      }
    }

    console.log(`\n📊 總結: ${accessibleTables.length}/${knownTables.length} 個表可訪問`);
    console.log('可訪問的表:', accessibleTables.join(', '));

    console.log('\n✅ Supabase 連接測試完成！');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
  }
}

// 執行測試
testConnection(); 