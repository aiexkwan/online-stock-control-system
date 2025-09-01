#!/usr/bin/env tsx
/**
 * 批量同步 data_id 表中員工 ID 到 Supabase Auth user_metadata
 *
 * 功能：
 * 1. 從 data_id 表獲取所有有 email 的員工（除特定系統帳號外）
 * 2. 在 Auth 用戶的 user_metadata 中只加入 user_id (來自 data_id.id)
 * 3. 排除系統帳號：injection@, warehouse@, pipeline@pennineindustries.com
 *
 * 使用方法：
 * npm run tsx scripts/sync-user-metadata-from-data-id.ts
 * 或 npx tsx scripts/sync-user-metadata-from-data-id.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 環境變數檢查
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY_REDACTED;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的環境變數:');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_KEY_REDACTED:', !!supabaseServiceKey);
  process.exit(1);
}

// 建立 Supabase 客戶端（使用 service role key）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 要排除的系統帳號
const EXCLUDED_EMAILS = [
  'injection@pennineindustries.com',
  'warehouse@pennineindustries.com',
  'pipeline@pennineindustries.com',
];

interface DataIdRecord {
  id: number;
  email: string;
}

interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
}

async function syncUserMetadataFromDataId() {
  console.log('🚀 開始同步 data_id 表資料到 Auth user_metadata...\n');

  try {
    // 1. 獲取 data_id 表中所有有 email 的員工（排除系統帳號）
    console.log('📊 正在獲取 data_id 表資料...');

    const { data: dataIdRecords, error: dataIdError } = await supabase
      .from('data_id')
      .select('id, email')
      .not('email', 'is', null)
      .not('email', 'in', `(${EXCLUDED_EMAILS.map(e => `"${e}"`).join(',')})`)
      .order('id');

    if (dataIdError) {
      throw new Error(`獲取 data_id 資料失敗: ${dataIdError.message}`);
    }

    console.log(`✅ 找到 ${dataIdRecords.length} 個 data_id 記錄`);
    console.log(`📧 排除的系統帳號: ${EXCLUDED_EMAILS.join(', ')}\n`);

    // 2. 獲取所有 Auth 用戶
    console.log('👥 正在獲取 Auth 用戶列表...');

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`獲取 Auth 用戶失敗: ${authError.message}`);
    }

    console.log(`✅ 找到 ${authData.users.length} 個 Auth 用戶\n`);

    // 3. 建立 email 對應關係
    const dataIdMap = new Map<string, DataIdRecord>();
    dataIdRecords.forEach(record => {
      dataIdMap.set(record.email.toLowerCase(), record);
    });

    const authUserMap = new Map<string, AuthUser>();
    authData.users.forEach(user => {
      if (user.email) {
        authUserMap.set(user.email.toLowerCase(), {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || {},
        });
      }
    });

    // 4. 開始同步處理
    console.log('🔄 開始同步處理...\n');

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    for (const [email, dataIdRecord] of dataIdMap.entries()) {
      const authUser = authUserMap.get(email);

      if (!authUser) {
        console.log(`⚠️  找不到 Auth 用戶: ${email} (clock_number: ${dataIdRecord.id})`);
        notFoundCount++;
        continue;
      }

      // 檢查是否已有 user_id
      if (authUser.user_metadata.user_id) {
        console.log(`⏩ 跳過 ${email} (已有 user_id: ${authUser.user_metadata.user_id})`);
        skippedCount++;
        continue;
      }

      // 更新用戶 metadata，只加入 user_id
      const newMetadata = {
        ...authUser.user_metadata,
        user_id: dataIdRecord.id.toString(),
      };

      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: newMetadata,
        });

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ 已更新 ${email}`);
        console.log(`   🆔 User ID: ${dataIdRecord.id}\n`);

        updatedCount++;

        // 避免 rate limiting，每次更新後稍微等待
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (updateError: any) {
        console.error(`❌ 更新 ${email} 失敗: ${updateError.message}`);
        errorCount++;
      }
    }

    // 5. 顯示統計結果
    console.log('='.repeat(60));
    console.log('📊 同步完成統計:');
    console.log('='.repeat(60));
    console.log(`📋 data_id 記錄總數: ${dataIdRecords.length}`);
    console.log(`👥 Auth 用戶總數: ${authData.users.length}`);
    console.log(`✅ 成功更新: ${updatedCount}`);
    console.log(`⏩ 已跳過 (已有 user_id): ${skippedCount}`);
    console.log(`⚠️  找不到對應 Auth 用戶: ${notFoundCount}`);
    console.log(`❌ 更新失敗: ${errorCount}`);
    console.log('='.repeat(60));

    if (updatedCount > 0) {
      console.log(`\n🎉 成功為 ${updatedCount} 個用戶同步了 metadata!`);
    }

    if (notFoundCount > 0) {
      console.log(`\n💡 提示: ${notFoundCount} 個 data_id 記錄找不到對應的 Auth 用戶`);
      console.log('   可能需要這些員工先註冊帳號');
    }
  } catch (error: any) {
    console.error('\n❌ 同步過程發生錯誤:', error.message);
    console.error('詳細錯誤:', error);
    process.exit(1);
  }
}

// 執行腳本
if (require.main === module) {
  syncUserMetadataFromDataId()
    .then(() => {
      console.log('\n✅ 腳本執行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 腳本執行失敗:', error);
      process.exit(1);
    });
}
