import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import type { Database } from '@/types/database/supabase';

// 使用專案統一的資料庫類型定義
type PalletInfoRow = Database['public']['Tables']['record_palletinfo']['Row'];

export interface PalletInfo {
  generate_time: string;
  plt_num: string;
  product_code: string;
  product_qty: number;
}

export async function getLatestPalletInfo(): Promise<PalletInfo[]> {
  try {
    // 確保只在客戶端環境中執行
    if (typeof window === 'undefined') {
      console.warn('[getLatestPalletInfo] Cannot run in server-side environment');
      return [];
    }

    const client = createClient();

    const { data, error } = await client
      .from('record_palletinfo')
      .select('generate_time, plt_num, product_code, product_qty')
      .order('generate_time', { ascending: false })
      .limit(15);

    if (error) {
      console.error('Error fetching pallet info:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return (data as PalletInfoRow[]).map(
      (record: PalletInfoRow): PalletInfo => ({
        generate_time: format(new Date(record.generate_time), 'dd-MMM-yy HH:mm'),
        plt_num: record.plt_num,
        product_code: record.product_code,
        product_qty: record.product_qty,
      })
    );
  } catch (error) {
    console.error('Error in getLatestPalletInfo:', error);
    throw error;
  }
}
