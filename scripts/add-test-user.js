// 此腳本用於添加測試用戶到 data_id 表

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('環境變數未設置。請確保 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 已正確配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUser() {
  // 測試用戶資料
  const testUser = {
    id: 'testuser123',
    name: '測試用戶',
    department: 'IT',
    qc: true,           // 管理員權限
    receive: true,      // 入庫權限
    void: true,         // 出庫權限
    view: true,         // 查看權限
    resume: true,       // 編輯權限
    report: true,       // 報表權限
    password: 'testuser123'  // 初始密碼與 ID 相同
  };

  // 添加測試用戶
  console.log('正在添加測試用戶...');
  
  const { data, error } = await supabase
    .from('data_id')
    .upsert([testUser])
    .select();

  if (error) {
    console.error('添加測試用戶失敗:', error);
  } else {
    console.log('測試用戶添加成功:', data);
  }
}

// 執行函數
addTestUser().catch(console.error); 