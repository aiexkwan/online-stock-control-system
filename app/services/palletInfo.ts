import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// 使用延遲初始化以避免 SSR 問題
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export interface PalletInfo {
  generate_time: string;
  plt_num: string;
  product_code: string;
  product_qty: number;
}

// Database record type from Supabase
interface PalletInfoRecord {
  generate_time: string;
  plt_num: string;
  product_code: string;
  product_qty: number;
}

export async function getLatestPalletInfo(): Promise<PalletInfo[]> {
  try {
    const client = getSupabase();
    if (!client) {
      throw new Error('Supabase client is not available in SSR environment');
    }

    const { data, error } = await client
      .from('record_palletinfo')
      .select('generate_time, plt_num, product_code, product_qty')
      .order('generate_time', { ascending: false })
      .limit(15);

    if (error) {
      console.error('Error fetching pallet info:', error);
      throw error;
    }

    return (data as PalletInfoRecord[]).map(
      (record: PalletInfoRecord): PalletInfo => ({
        ...record,
        generate_time: format(new Date(record.generate_time), 'dd-MMM-yy HH:mm'),
      })
    );
  } catch (error) {
    console.error('Error in getLatestPalletInfo:', error);
    throw error;
  }
}
