// 此腳本用於初始化 Supabase 數據表

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境變數未設置。請確保 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 已正確配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initTables() {
  console.log('開始初始化數據表...');
  
  try {
    // 檢查 data_id 表是否存在
    const { error: checkError } = await supabase
      .from('data_id')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('data_id 表可能不存在，嘗試創建...');
      
      // 為了創建表，我們需要使用 REST API
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/create_tables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        console.error('創建表失敗:', await res.text());
        console.log('請手動在 Supabase 中創建以下表：');
        console.log('1. data_id 表：');
        console.log('   - id (text, primary key)');
        console.log('   - name (text)');
        console.log('   - department (text)');
        console.log('   - password (text)');
        console.log('   - qc (boolean)');
        console.log('   - receive (boolean)');
        console.log('   - void (boolean)');
        console.log('   - view (boolean)');
        console.log('   - resume (boolean)');
        console.log('   - report (boolean)');
        
        console.log('2. products 表：');
        console.log('   - id (int8, primary key)');
        console.log('   - name (text)');
        console.log('   - sku (text)');
        console.log('   - quantity (int4)');
        console.log('   - location (text)');
        console.log('   - last_updated (timestamp)');
        
        console.log('3. inventory_movements 表：');
        console.log('   - id (int8, primary key)');
        console.log('   - product_id (int8, foreign key to products.id)');
        console.log('   - quantity (int4)');
        console.log('   - type (text)');
        console.log('   - from_location (text)');
        console.log('   - to_location (text)');
        console.log('   - created_by (text)');
        console.log('   - created_at (timestamp)');
        console.log('   - notes (text)');
      } else {
        console.log('數據表創建成功');
      }
    } else {
      console.log('數據表已存在');
    }
    
    // 添加一個管理員用戶
    const adminUser = {
      id: 'admin',
      name: '管理員',
      department: '管理',
      qc: true,
      receive: true,
      void: true,
      view: true,
      resume: true,
      report: true,
      password: 'admin123'
    };
    
    const { error: insertError } = await supabase
      .from('data_id')
      .upsert([adminUser]);
    
    if (insertError) {
      console.error('添加管理員用戶失敗:', insertError);
    } else {
      console.log('管理員用戶添加成功');
    }
    
  } catch (error) {
    console.error('初始化過程中發生錯誤:', error);
  }
}

// 執行函數
initTables().catch(console.error); 