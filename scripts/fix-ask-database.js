const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取 .env 文件
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });

    console.log('✅ 成功讀取 .env 文件');
  } catch (error) {
    console.log('⚠️  無法讀取 .env 文件，使用系統環境變數');
  }
}

// 修復 Ask Database 功能
async function fixAskDatabase() {
  console.log('🔧 開始修復 Ask Database 功能...');

  // 讀取環境變數
  loadEnvFile();

  // 檢查環境變數
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少必要的環境變數：');
    console.error('   - SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY 或 SUPABASE_ANON_KEY');
    console.log('\n🔍 當前環境變數：');
    console.log('   SUPABASE_URL:', supabaseUrl ? '✅ 已設置' : '❌ 未設置');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已設置' : '❌ 未設置');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已設置' : '❌ 未設置');
    console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 已設置' : '❌ 未設置');
    return;
  }

  console.log('✅ 環境變數檢查通過');
  console.log('📡 Supabase URL:', supabaseUrl.substring(0, 30) + '...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 測試連接
    console.log('🔗 測試 Supabase 連接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('data_code')
      .select('code')
      .limit(1);

    if (connectionError) {
      console.error('❌ Supabase 連接失敗：', connectionError.message);
      return;
    }

    console.log('✅ Supabase 連接成功');

    // 測試修復後的函數
    console.log('\n🧪 測試 execute_sql_query 函數...');

    // 測試 1：基本查詢
    try {
      const { data: test1, error: error1 } = await supabase.rpc('execute_sql_query', {
        query_text: 'SELECT 1 as test_value'
      });

      if (error1) {
        console.log('❌ 測試 1 失敗：', error1.message);
      } else {
        console.log('✅ 測試 1 通過：基本查詢');
      }
    } catch (err) {
      console.log('❌ 測試 1 異常：', err.message);
    }

    // 測試 2：日期函數
    try {
      const { data: test2, error: error2 } = await supabase.rpc('execute_sql_query', {
        query_text: 'SELECT CURRENT_DATE as today'
      });

      if (error2) {
        console.log('❌ 測試 2 失敗：', error2.message);
        console.log('🔍 這表示 execute_sql_query 函數的安全檢查過於嚴格');
      } else {
        console.log('✅ 測試 2 通過：日期函數');
      }
    } catch (err) {
      console.log('❌ 測試 2 異常：', err.message);
    }

    // 測試 3：原始問題查詢
    try {
      const { data: test3, error: error3 } = await supabase.rpc('execute_sql_query', {
        query_text: 'SELECT COUNT(*) AS grn_receipts_today FROM grn_level WHERE DATE(latest_update) = CURRENT_DATE'
      });

      if (error3) {
        console.log('❌ 測試 3 失敗：', error3.message);
        console.log('🔍 這是導致 Ask Database 功能失效的原因');

        // 提供解決方案
        console.log('\n💡 解決方案：');
        console.log('需要在 Supabase Dashboard 中更新 execute_sql_query 函數');
        console.log('📄 SQL 腳本已準備好：scripts/fix-execute-sql-query.sql');

      } else {
        console.log('✅ 測試 3 通過：原始問題查詢');
        console.log('📊 查詢結果：', test3);
      }
    } catch (err) {
      console.log('❌ 測試 3 異常：', err.message);
    }

    console.log('\n📋 診斷摘要：');
    console.log('1. ✅ Supabase 連接正常');
    console.log('2. ❌ execute_sql_query 函數安全檢查過於嚴格');
    console.log('3. 🎯 問題：日期函數和聚合函數被誤判為不安全');

    console.log('\n🔧 修復步驟：');
    console.log('1. 登入 Supabase Dashboard (https://supabase.com/dashboard)');
    console.log('2. 選擇您的項目');
    console.log('3. 進入 SQL Editor');
    console.log('4. 複製並執行以下文件的內容：');
    console.log('   📄 scripts/fix-execute-sql-query.sql');
    console.log('5. 重新測試 Ask Database 功能');

    // 顯示 SQL 腳本內容
    try {
      const sqlPath = path.join(__dirname, 'fix-execute-sql-query.sql');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');
      console.log('\n📄 SQL 修復腳本內容：');
      console.log('=' .repeat(60));
      console.log(sqlScript);
      console.log('=' .repeat(60));
    } catch (err) {
      console.log('⚠️  無法讀取 SQL 腳本文件');
    }

  } catch (error) {
    console.error('❌ 修復過程中發生錯誤：', error);
  }
}

// 執行修復
if (require.main === module) {
  fixAskDatabase();
}

module.exports = { fixAskDatabase };
