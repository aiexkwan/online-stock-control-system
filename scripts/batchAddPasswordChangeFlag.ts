// ./scripts/batchAddPasswordChangeFlag.ts
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('🚀 讀取 @pennine.com 用戶清單...');

  // 🔍 抓出所有 email 結尾為 @pennine.com 的用戶
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ 無法獲取用戶列表：', error.message);
    return;
  }

  // 🔁 遍歷每個 user，加 metadata
  for (const user of users.users) {
    if (!user.email?.endsWith('@pennine.com')) continue;

    const oldMetadata = user.user_metadata || {};

    const updatedMetadata = {
      ...oldMetadata,
      needs_password_change: true
    };

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMetadata
    });

    if (error) {
      console.error(`❌ 更新 ${user.email} 失敗:`, error.message);
    } else {
      console.log(`✅ 已更新 ${user.email}`);
    }
  }

  console.log('🏁 全部更新完成');
}

run();