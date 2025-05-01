// 測試 Supabase 連接和資料存取
const { createClient } = require('@supabase/supabase-js');

// 硬編碼 Supabase 連接資訊 (從 next.config.js 獲取)
const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJiYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';

// 檢查環境變數
console.log('\n======== 環境變數檢查 ========');
console.log(`Supabase URL: ${supabaseUrl ? '✅ 已設置' : '❌ 未設置'}`);
console.log(`Supabase Key: ${supabaseKey ? '✅ 已設置' : '❌ 未設置'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 連接資訊未正確設置');
  process.exit(1);
}

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseKey);

// 測試函數
async function runTests() {
  try {
    console.log('\n======== Supabase 連接測試 ========');
    
    // 測試 1: 檢查 Supabase 連接
    try {
      const { data, error } = await supabase.from('data_id').select('count()', { count: 'exact' });
      if (error) throw error;
      console.log('✅ Supabase 連接成功');
      console.log(`📊 資料表總記錄數: ${data[0].count}`);
    } catch (error) {
      console.error('❌ Supabase 連接測試失敗:', error.message);
    }

    // 測試 2: 讀取資料表權限
    console.log('\n======== 讀取資料表權限測試 ========');
    try {
      const { data, error } = await supabase.from('data_id').select('*').limit(1);
      if (error) throw error;
      console.log('✅ 資料表讀取權限正常');
      console.log('📄 示例資料:', data);
    } catch (error) {
      console.error('❌ 資料表讀取權限測試失敗:', error.message);
    }

    // 測試 3: 搜尋功能測試
    console.log('\n======== 搜尋功能測試 ========');
    try {
      // 測試 ID = 'admin'
      const { data: adminData, error: adminError } = await supabase
        .from('data_id')
        .select('*')
        .eq('id', 'admin')
        .single();

      if (adminError) {
        console.error('❌ 搜尋 admin 用戶失敗:', adminError.message);
      } else {
        console.log('✅ 成功找到 admin 用戶');
        console.log('📄 Admin 用戶資料:', adminData);
      }
      
      // 測試 ID = '5997'（圖片中顯示的 ID）
      const { data: testData, error: testError } = await supabase
        .from('data_id')
        .select('*')
        .eq('id', '5997')
        .single();

      if (testError) {
        console.error('❌ 搜尋 ID 5997 失敗:', testError.message);
        
        // 如果是 "資料未找到" 的錯誤，可能是資料表中真的沒有此記錄
        if (testError.code === 'PGRST116') {
          console.log('⚠️ 資料表中沒有 ID 為 5997 的記錄');
          
          // 列出所有可用的用戶 ID
          const { data: allUsers, error: listError } = await supabase
            .from('data_id')
            .select('id, name')
            .order('id');
            
          if (listError) {
            console.error('❌ 無法列出所有用戶 ID:', listError.message);
          } else {
            console.log('📋 資料表中可用的用戶 ID:');
            allUsers.forEach(user => {
              console.log(`   - ${user.id}: ${user.name}`);
            });
          }
        }
      } else {
        console.log('✅ 成功找到 ID 5997 用戶');
        console.log('📄 用戶資料:', testData);
      }

    } catch (error) {
      console.error('❌ 搜尋功能測試失敗:', error.message);
    }

    // 測試 4: 檢查資料表權限政策
    console.log('\n======== 資料表權限政策測試 ========');
    try {
      // 查詢資料表的權限政策 (這裡需要 Service Role 權限，可能會失敗)
      const { data: policyData, error: policyError } = await supabase.rpc('get_policies_for_table', {
        table_name: 'data_id'
      });

      if (policyError) {
        console.error('❌ 無法查詢資料表權限政策 (需要更高權限):', policyError.message);
        console.log('ℹ️ 請手動檢查 Supabase Dashboard 中的資料表權限設置');
      } else {
        console.log('✅ 資料表權限政策:', policyData);
      }
    } catch (error) {
      console.error('❌ 資料表權限政策測試失敗:', error.message);
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  }
}

// 執行測試
console.log('🔍 開始測試 Supabase 連接和資料存取權限...');
runTests()
  .catch(err => {
    console.error('❌ 測試執行失敗:', err.message);
  })
  .finally(() => {
    console.log('\n======== 測試完成 ========');
  }); 