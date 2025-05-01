import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
    // 從 data_id 表獲取所有用戶
    const { data: users, error: usersError } = await supabase
      .from('data_id')
      .select('*');

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users.length} users to process`);

    // 為每個用戶創建 auth 帳戶
    for (const user of users) {
      const email = `${user.id}@pennine.com`;
      const password = user.password || user.id; // 如果沒有密碼，使用 ID 作為密碼

      try {
        // 檢查用戶是否已存在
        const { data: existingUsers, error: listError } = await supabase
          .auth.admin.listUsers();

        if (listError) {
          console.error(`Error listing users:`, listError);
          continue;
        }

        const existingUser = existingUsers.users.find(u => u.email === email);

        if (!existingUser) {
          // 創建新用戶
          const { data, error: createError } = await supabase
            .auth.admin.createUser({
              email,
              password,
              email_confirm: true
            });

          if (createError) {
            console.error(`Error creating user ${user.id}:`, createError);
            continue;
          }

          console.log(`Created auth account for user ${user.id}`);
        } else {
          console.log(`Auth account already exists for user ${user.id}`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
      }
    }

    console.log('Auth initialization completed');
  } catch (err) {
    console.error('Failed to initialize auth:', err);
  }
}

initializeAuth(); 