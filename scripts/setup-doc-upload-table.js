const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 配置 - 從環境變量讀取
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 建立 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createDocUploadTable() {
  console.log('開始建立 doc_upload 表...');

  try {
    // 建立表格的 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS doc_upload (
        uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        doc_name VARCHAR(255) NOT NULL,
        upload_by INTEGER NOT NULL,
        doc_type VARCHAR(50),
        doc_url TEXT,
        file_size BIGINT,
        folder VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;

    // 執行建立表格
    const { error: createError } = await supabase.rpc('execute_sql', {
      query: createTableSQL
    });

    if (createError) {
      console.error('建立表格時發生錯誤:', createError);

      // 如果 RPC 不存在，嘗試直接使用 SQL
      console.log('嘗試使用替代方法...');

      // 檢查表格是否已存在
      const { data: tables, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'doc_upload');

      if (checkError) {
        console.error('檢查表格時發生錯誤:', checkError);
        return;
      }

      if (tables && tables.length > 0) {
        console.log('doc_upload 表已經存在！');
        return;
      }
    } else {
      console.log('成功建立 doc_upload 表！');
    }

    // 建立索引
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_doc_upload_created_at
      ON doc_upload(created_at DESC)
    `;

    const { error: indexError } = await supabase.rpc('execute_sql', {
      query: createIndexSQL
    });

    if (indexError) {
      console.error('建立索引時發生錯誤:', indexError);
    } else {
      console.log('成功建立索引！');
    }

    // 測試插入一條記錄
    console.log('測試插入記錄...');
    const { data, error: insertError } = await supabase
      .from('doc_upload')
      .insert({
        doc_name: 'test-setup.pdf',
        upload_by: 1,
        doc_type: 'spec',
        doc_url: 'https://example.com/test.pdf',
        file_size: 1024,
        folder: 'test'
      })
      .select();

    if (insertError) {
      console.error('插入測試記錄時發生錯誤:', insertError);
    } else {
      console.log('成功插入測試記錄:', data);

      // 刪除測試記錄
      const { error: deleteError } = await supabase
        .from('doc_upload')
        .delete()
        .eq('doc_name', 'test-setup.pdf');

      if (!deleteError) {
        console.log('已刪除測試記錄');
      }
    }

  } catch (error) {
    console.error('執行過程中發生錯誤:', error);
  }
}

// 執行建立表格
createDocUploadTable();
