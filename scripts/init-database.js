/**
 * 庫存系統資料庫初始化腳本
 * 此腳本會創建所需的資料表結構並添加示範數據
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境變數未設置。請確保 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 已正確配置');
  process.exit(1);
}

async function executeSql(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        sql_statement: sql
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL 執行失敗: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('執行 SQL 時出錯:', error);
    throw error;
  }
}

async function initDatabase() {
  console.log('開始初始化數據庫...');
  
  try {
    // 讀取 SQL 文件
    const sqlPath = path.join(__dirname, 'supabase-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割 SQL 語句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // 逐個執行 SQL 語句
    for (const statement of statements) {
      try {
        await executeSql(statement);
        console.log('SQL 語句執行成功');
      } catch (err) {
        console.error('執行 SQL 語句時出錯:', err);
        console.error('問題語句:', statement);
      }
    }
    
    console.log('數據庫初始化完成！');
    console.log('\n您可以使用以下帳戶登入系統：');
    console.log('管理員帳戶: admin / admin123');
    console.log('倉庫帳戶: user1 / user1');
    console.log('物流帳戶: user2 / user2');
    
  } catch (error) {
    console.error('初始化過程中發生錯誤:', error);
  }
}

initDatabase(); 