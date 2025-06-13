import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

/**
 * Generates a unique series number in the format ddmmyy-RANDOMSTRING.
 * Ensures uniqueness by checking against the 'record_palletinfo' table.
 * @param supabase - The Supabase client instance.
 * @returns A promise that resolves to a unique series string.
 */
export async function generateUniqueSeries(supabase: SupabaseClient): Promise<string> {
  const S_ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const S_LENGTH = 6;
  let series = '';
  let unique = false;

  while (!unique) {
    const datePart = format(new Date(), 'ddMMyy');
    let randomPart = '';
    for (let i = 0; i < S_LENGTH; i++) {
      randomPart += S_ALPHANUMERIC.charAt(Math.floor(Math.random() * S_ALPHANUMERIC.length));
    }
    series = `${datePart}-${randomPart}`;

    const { data, error } = await supabase
      .from('record_palletinfo')
      .select('series')
      .eq('series', series)
      .maybeSingle();

    if (error) {
      console.error('Error checking series uniqueness:', error);
      throw new Error(`Failed to check series uniqueness: ${error.message}`);
    }

    if (!data) {
      unique = true;
    }
  }
  return series;
}

/**
 * Generates a daily pallet number in the format DDMMYY/NN.
 * NN is a global counter for all pallets printed on that day.
 * @param supabase - The Supabase client instance.
 * @returns A promise that resolves to the next daily pallet number string.
 */
export async function generateDailyPalletNumber(supabase: SupabaseClient): Promise<string> {
  const currentDate = new Date();
  const datePrefix = format(currentDate, 'ddMMyy');

  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('plt_num')
    .like('plt_num', `${datePrefix}/%`)
    .order('plt_num', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last pallet number:', error);
    throw new Error(`Failed to fetch last pallet number: ${error.message}`);
  }

  let nextSequence = 1;
  if (data && data.length > 0 && data[0].plt_num) {
    const lastPalletNum = data[0].plt_num;
    const parts = lastPalletNum.split('/');
    if (parts.length === 2) {
      const lastSequence = parseInt(parts[1], 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
  }

  const sequenceString = nextSequence.toString().padStart(2, '0');
  return `${datePrefix}/${sequenceString}`;
} 