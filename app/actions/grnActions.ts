'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types'; // 假設您的類型定義路徑

// 確保 GrnDatabaseEntryPayload 與實際傳入的數據以及數據庫 schema 匹配
interface GrnPalletInfoPayload {
  plt_num: string;
  series: string;
  product_code: string;
  product_qty: number; // 假設這是 number，後續會 Math.round
  plt_remark: string;
  // 確保沒有多餘或缺失的字段，與 record_palletinfo 表的 Insert 類型匹配
}

interface GrnRecordPayload {
  grn_ref: string; // 假設這是 string
  material_code: string;
  sup_code: string;
  plt_num: string;
  gross_weight: number;
  net_weight: number;
  pallet_count: number;
  package_count: number;
  pallet: string;
  package: string;
  // 確保沒有多餘或缺失的字段，與 record_grn 表的 Insert 類型匹配
}

interface GrnDatabaseEntryPayload {
  palletInfo: GrnPalletInfoPayload;
  grnRecord: GrnRecordPayload;
}

export async function createGrnDatabaseEntries(payload: GrnDatabaseEntryPayload): Promise<{ data?: string; error?: string; warning?: string }> {
  const cookieStore = cookies; // 直接傳遞函數引用
  const supabase = createServerActionClient<Database>({ cookies: cookieStore });

  const allCookiesFromStore = cookieStore().getAll().map(c => c.name);
  console.log('[grnActions] All available cookie names in GRN Action:', allCookiesFromStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('[grnActions] Supabase auth.getUser() error:', authError.message);
    return { error: `用戶身份驗證時發生錯誤: ${authError.message}` };
  }

  const currentAuthUserUuid = user?.id;

  if (!currentAuthUserUuid) { // 類型保護：此處之後 currentAuthUserUuid 是 string
    console.error('[grnActions] User not authenticated. Cannot perform GRN operations.');
    return { error: '用戶未登入，無法執行GRN操作並記錄歷史。' };
  }

  let dataIdForHistoryRecord: number; // 假設 id 總是 number

  try {
    const { data: userDataFromDataId, error: queryError } = await supabase
      .from('data_id')
      .select('id')
      .eq('uuid', currentAuthUserUuid) // currentAuthUserUuid 此處已確認是 string
      .single();

    if (queryError) {
      console.error('[grnActions] Error fetching id from data_id table:', queryError);
      return { error: `查詢操作員資料時發生錯誤: ${queryError.message}` };
    }

    if (!userDataFromDataId || typeof userDataFromDataId.id !== 'number') {
      console.error(`[grnActions] No valid entry found in data_id for auth_user_uuid: ${currentAuthUserUuid}. Cannot log history.`);
      return { error: '未找到對應的操作員記錄 (data_id) 或記錄格式不正確，無法記錄歷史。請確保您的用戶帳戶已正確配置。' };
    }
    
    dataIdForHistoryRecord = userDataFromDataId.id;

    // 1. Insert into record_palletinfo
    // 確保 palletInfoToInsert 的類型與 Database['public']['Tables']['record_palletinfo']['Insert'] 匹配
    const palletInfoToInsert = {
      ...payload.palletInfo,
      product_qty: Math.round(payload.palletInfo.product_qty),
    };
    const { error: palletInfoError } = await supabase
      .from('record_palletinfo')
      .insert(palletInfoToInsert); // .insert([palletInfoToInsert]) 如果是單條記錄，不需要數組

    if (palletInfoError) {
      console.error('[grnActions] Error inserting into record_palletinfo:', palletInfoError);
      return { error: `Failed to insert pallet info: ${palletInfoError.message}` };
    }

    // 2. Insert into record_grn
    // 確保 grnRecordToInsert 的類型與 Database['public']['Tables']['record_grn']['Insert'] 匹配
    const grnRecordToInsert = {
        ...payload.grnRecord
    };
    const { error: grnError } = await supabase
      .from('record_grn')
      .insert(grnRecordToInsert); // .insert([payload.grnRecord])

    if (grnError) {
      console.error('[grnActions] Error inserting into record_grn:', grnError);
      // 考慮是否需要回滾 record_palletinfo 的插入
      return { error: `Failed to insert GRN record: ${grnError.message}. Pallet info might have been created.` };
    }

    // 3. Insert into record_inventory
    // 確保 inventoryDataToInsert 的類型與 Database['public']['Tables']['record_inventory']['Insert'] 匹配
    const inventoryDataToInsert = {
      product_code: payload.grnRecord.material_code,
      pallet_num: payload.grnRecord.plt_num,
      await: payload.grnRecord.net_weight, // 假設 await 是 number，net_weight 也是 number
      // 檢查 record_inventory 是否有其他必填字段或默認值
    };
    const { error: inventoryInsertError } = await supabase
      .from('record_inventory')
      .insert(inventoryDataToInsert); // .insert([inventoryDataToInsert])

    if (inventoryInsertError) {
      console.error('[grnActions] Error inserting into record_inventory:', inventoryInsertError);
      // 考慮回滾
      return { error: `Failed to insert inventory record: ${inventoryInsertError.message}. GRN and Pallet Info might have been created.` };
    }

    // 4. Insert into record_history
    const historyData = {
        action: 'GRN Pallet Received',
        id: dataIdForHistoryRecord, // 確保 dataIdForHistoryRecord 的類型與 record_history.id 匹配
        plt_num: payload.palletInfo.plt_num,
        loc: 'GRN Area', 
        remark: `GRN: ${payload.grnRecord.grn_ref}, Material: ${payload.grnRecord.material_code}`,
        // time 字段通常由數據庫自動生成 (e.g., default now())
    };
    const { error: historyError } = await supabase
      .from('record_history')
      .insert(historyData); // .insert([historyData])

    if (historyError) {
      console.error('[grnActions] Error inserting into record_history:', historyError);
      return { data: 'Successfully created GRN database entries but history failed.', warning: `History record failed: ${historyError.message}` };
    }

    return { data: 'Successfully created GRN database entries.' };

  } catch (error: any) {
    console.error('[grnActions] Unexpected error in createGrnDatabaseEntries:', error);
    if (error.message) {
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: 'An unexpected error occurred.' };
  }
} 