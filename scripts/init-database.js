/**
 * 庫存系統資料庫初始化腳本
 * 此腳本會創建所需的資料表結構並添加示範數據
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 連接信息
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境變數未設置。請確保 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 已正確配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDatabase() {
  console.log('開始初始化數據庫...');
  
  try {
    // 創建 SQL 函數來創建數據表
    const createTablesSql = `
      -- 用戶表
      CREATE TABLE IF NOT EXISTS data_id (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        password TEXT,
        qc BOOLEAN DEFAULT FALSE,
        receive BOOLEAN DEFAULT FALSE,
        void BOOLEAN DEFAULT FALSE,
        view BOOLEAN DEFAULT FALSE,
        resume BOOLEAN DEFAULT FALSE,
        report BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 產品表
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        quantity INTEGER DEFAULT 0,
        location TEXT,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 庫存移動記錄表
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        type TEXT NOT NULL,
        from_location TEXT,
        to_location TEXT,
        created_by TEXT REFERENCES data_id(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT
      );
    `;
    
    // 使用 Supabase REST API 执行 SQL
    console.log('創建數據表...');
    const createTablesRes = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        query: createTablesSql
      })
    });
    
    if (!createTablesRes.ok) {
      console.error('創建表失敗:', await createTablesRes.text());
      console.log('\n您可以在 Supabase 儀表板中手動創建以下表：');
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
      console.log('   - created_at (timestamp)');
      
      console.log('\n2. products 表：');
      console.log('   - id (serial, primary key)');
      console.log('   - name (text)');
      console.log('   - sku (text, unique)');
      console.log('   - quantity (int4)');
      console.log('   - location (text)');
      console.log('   - last_updated (timestamp)');
      
      console.log('\n3. inventory_movements 表：');
      console.log('   - id (serial, primary key)');
      console.log('   - product_id (int4, foreign key to products.id)');
      console.log('   - quantity (int4)');
      console.log('   - type (text)');
      console.log('   - from_location (text)');
      console.log('   - to_location (text)');
      console.log('   - created_by (text, foreign key to data_id.id)');
      console.log('   - created_at (timestamp)');
      console.log('   - notes (text)');
    } else {
      console.log('數據表創建成功');
    }
    
    // 添加管理員用戶
    console.log('添加管理員用戶...');
    const adminUser = {
      id: 'admin',
      name: '系統管理員',
      department: '資訊部',
      qc: true,
      receive: true,
      void: true,
      view: true,
      resume: true,
      report: true,
      password: 'admin123'
    };
    
    const { error: adminError } = await supabase
      .from('data_id')
      .upsert([adminUser]);
    
    if (adminError) {
      console.error('添加管理員用戶失敗:', adminError);
    } else {
      console.log('管理員用戶 (ID: admin) 添加成功');
    }
    
    // 添加測試用戶
    console.log('添加測試用戶...');
    const testUsers = [
      {
        id: 'user1',
        name: '張三',
        department: '倉庫',
        qc: false,
        receive: true,
        void: true,
        view: true,
        resume: false,
        report: false,
        password: 'user1'
      },
      {
        id: 'user2',
        name: '李四',
        department: '物流',
        qc: false,
        receive: false,
        void: false,
        view: true,
        resume: false,
        report: true,
        password: 'user2'
      }
    ];
    
    const { error: testUserError } = await supabase
      .from('data_id')
      .upsert(testUsers);
    
    if (testUserError) {
      console.error('添加測試用戶失敗:', testUserError);
    } else {
      console.log('測試用戶添加成功');
    }
    
    // 添加示範產品數據
    console.log('添加示範產品數據...');
    const sampleProducts = [
      {
        name: '顯示器',
        sku: 'P001',
        quantity: 10,
        location: 'A-01',
        last_updated: new Date().toISOString()
      },
      {
        name: '鍵盤',
        sku: 'P002',
        quantity: 25,
        location: 'A-02',
        last_updated: new Date().toISOString()
      },
      {
        name: '滑鼠',
        sku: 'P003',
        quantity: 30,
        location: 'A-03',
        last_updated: new Date().toISOString()
      },
      {
        name: 'USB 隨身碟 32GB',
        sku: 'P004',
        quantity: 50,
        location: 'B-01',
        last_updated: new Date().toISOString()
      },
      {
        name: '網路線 2M',
        sku: 'P005',
        quantity: 100,
        location: 'B-02',
        last_updated: new Date().toISOString()
      }
    ];
    
    const { error: productError } = await supabase
      .from('products')
      .upsert(sampleProducts);
    
    if (productError) {
      console.error('添加示範產品數據失敗:', productError);
    } else {
      console.log('示範產品數據添加成功');
    }
    
    console.log('\n資料庫初始化完成！');
    console.log('您可以使用以下帳戶登入系統：');
    console.log('管理員帳戶: admin / admin123');
    console.log('倉庫帳戶: user1 / user1');
    console.log('物流帳戶: user2 / user2');
    
  } catch (error) {
    console.error('初始化過程中發生錯誤:', error);
  }
}

// 執行函數
initDatabase().catch(console.error); 