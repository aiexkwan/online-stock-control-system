import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

console.log('Current working directory:', process.cwd());
console.log('Loading .env.local from:', path.resolve(process.cwd(), '.env.local'));

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment variables loaded:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ (set)' : '✗ (not set)');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ (set)' : '✗ (not set)');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

async function initializeAuth() {
  try {
    console.log('開始初始化認證系統...');

    // 從 data_id 表獲取所有用戶
    const { data: users, error: usersError } = await supabase
      .from('data_id')
      .select('*');

    if (usersError) {
      throw usersError;
    }

    console.log(`找到 ${users.length} 個用戶需要處理`);

    // 為每個用戶創建或更新 auth 帳戶
    for (const user of users) {
      const email = `${user.id}@pennine.com`;
      const password = user.password || user.id;

      try {
        // 檢查用戶是否已存在
        const { data: { users: existingUsers }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`列出用戶時出錯:`, listError);
          continue;
        }

        const existingUser = existingUsers.find(u => u.email === email);

        if (!existingUser) {
          // 創建新用戶
          const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              id: user.id,
              name: user.name,
              department: user.department,
              permissions: {
                qc: user.qc,
                receive: user.receive,
                void: user.void,
                view: user.view,
                resume: user.resume,
                report: user.report
              }
            }
          });

          if (createError) {
            console.error(`創建用戶 ${user.id} 時出錯:`, createError);
          } else {
            console.log(`已為用戶 ${user.id} 創建認證帳戶`);
          }
        } else {
          // 更新現有用戶
          const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password,
              user_metadata: {
                id: user.id,
                name: user.name,
                department: user.department,
                permissions: {
                  qc: user.qc,
                  receive: user.receive,
                  void: user.void,
                  view: user.view,
                  resume: user.resume,
                  report: user.report
                }
              }
            }
          );

          if (updateError) {
            console.error(`更新用戶 ${user.id} 時出錯:`, updateError);
          } else {
            console.log(`已更新用戶 ${user.id} 的認證帳戶`);
          }
        }
      } catch (err) {
        console.error(`處理用戶 ${user.id} 時發生錯誤:`, err);
      }
    }

    console.log('認證系統初始化完成');
  } catch (err) {
    console.error('初始化認證系統失敗:', err);
  }
}

initializeAuth(); 