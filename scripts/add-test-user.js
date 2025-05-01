// 此腳本用於添加測試用戶到 data_id 表

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 從 next.config.js 直接獲取配置信息
const supabaseUrl = 'https://bbmkuiplnzvpudszrend.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTU2MDQsImV4cCI6MjA2MTI5MTYwNH0._xBzFK-3gOqyztwpvR6xfMbLd3ynTubEg5Z1iLYj92Q';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 連接資訊未設置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUsers() {
  // 測試用戶資料
  const testUsers = [
    {
      id: 'testuser',
      name: '測試用戶',
      department: 'IT',
      qc: true,           // 管理員權限
      receive: true,      // 入庫權限
      void: true,         // 出庫權限
      view: true,         // 查看權限
      resume: true,       // 編輯權限
      report: true,       // 報表權限
      password: 'testuser'  // 初始密碼與 ID 相同
    },
    {
      id: '5997',  // 添加圖片中顯示的用戶 ID
      name: '測試用戶 5997',
      department: '測試部門',
      qc: false,
      receive: true,
      void: true,
      view: true,
      resume: false,
      report: false,
      password: '5997'  // 初始密碼與 ID 相同
    }
  ];

  console.log('正在添加測試用戶...');
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase
        .from('data_id')
        .upsert([user])
        .select();

      if (error) {
        console.error(`添加用戶 ${user.id} 失敗:`, error);
      } else {
        console.log(`✅ 用戶 ${user.id} 添加成功:`, data);
      }
    } catch (err) {
      console.error(`添加用戶 ${user.id} 過程中發生錯誤:`, err);
    }
  }
}

// 查看所有用戶
async function listAllUsers() {
  try {
    console.log('\n獲取所有用戶...');
    const { data, error } = await supabase
      .from('data_id')
      .select('*')
      .order('id');
      
    if (error) {
      console.error('獲取用戶列表失敗:', error);
    } else {
      console.log('現有用戶列表:');
      data.forEach(user => {
        console.log(`- ID: ${user.id}, 名稱: ${user.name}, 部門: ${user.department}`);
      });
    }
  } catch (err) {
    console.error('獲取用戶列表過程中發生錯誤:', err);
  }
}

// 執行函數
async function main() {
  await addTestUsers();
  await listAllUsers();
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('腳本執行完成');
  }); 