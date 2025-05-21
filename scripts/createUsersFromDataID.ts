import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function batchCreateUsers() {
  console.log("🚀 開始讀取 data_id 表...");

  const { data: ids, error } = await supabaseAdmin
    .from('data_id')
    .select('id');

  if (error) {
    console.error('❌ 讀取 data_id 表失敗：', error);
    return;
  }

  if (!ids || ids.length === 0) {
    console.warn('⚠️ 資料表 data_id 沒有任何員工 ID，請確認內容');
    return;
  }

  console.log(`📋 準備建立 ${ids.length} 個帳號...`);

  for (const user of ids) {
    const workerId = user.id;
    const email = `${workerId}@pennine.com`;
    const password = workerId;

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        worker_id: workerId
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`⚠️ 已存在：${email}`);
      } else {
        console.error(`❌ 建立 ${email} 失敗：`, error.message);
      }
    } else {
      console.log(`✅ 建立成功：${email}`);
    }
  }

  console.log("🏁 全部處理完成");
}

batchCreateUsers();