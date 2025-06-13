import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

/**
 * Generates an array of unique pallet numbers for the current day.
 * Format: ddMMyy/N, ddMMyy/N+1, ...
 * Queries 'record_palletinfo' to find the next available sequence number for the day.
 * @param supabaseClient - The Supabase client instance.
 * @param count - The number of pallet numbers to generate.
 * @returns A promise that resolves to an array of pallet number strings.
 * @throws Error if Supabase query fails.
 */
export async function generatePalletNumbers(supabaseClient: SupabaseClient, count: number): Promise<string[]> {
  if (count <= 0) {
    return [];
  }

  const today = new Date();
  const dateStr = format(today, 'ddMMyy');
  let maxNum = 0;

  const { data: todayPlts, error: queryError } = await supabaseClient
    .from('record_palletinfo')
    .select('plt_num')
    .like('plt_num', `${dateStr}/%`);

  if (queryError) {
    console.error('Error querying today\'s pallets for numbering:', queryError);
    throw new Error(`Failed to query today\'s pallets: ${queryError.message}`);
  }

  if (todayPlts && todayPlts.length > 0) {
    todayPlts.forEach(row => {
      if (row.plt_num) { // Ensure plt_num is not null or undefined
        const parts = row.plt_num.split('/');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          maxNum = Math.max(maxNum, parseInt(parts[1]));
        }
      }
    });
  }

  const palletNumbersGenerated: string[] = [];
  for (let i = 0; i < count; i++) {
    palletNumbersGenerated.push(`${dateStr}/${maxNum + 1 + i}`);
  }

  return palletNumbersGenerated;
} 