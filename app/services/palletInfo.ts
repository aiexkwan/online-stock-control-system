import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PalletInfo {
  generate_time: string;
  plt_num: string;
  product_code: string;
  product_qty: number;
}

export async function getLatestPalletInfo(): Promise<PalletInfo[]> {
  try {
    const { data, error } = await supabase
      .from('record_palletinfo')
      .select('generate_time, plt_num, product_code, product_qty')
      .order('generate_time', { ascending: false })
      .limit(15);

    if (error) {
      console.error('Error fetching pallet info:', error);
      throw error;
    }

    return data.map(record => ({
      ...record,
      generate_time: format(new Date(record.generate_time), 'dd-MMM-yy HH:mm'),
    }));
  } catch (error) {
    console.error('Error in getLatestPalletInfo:', error);
    throw error;
  }
} 