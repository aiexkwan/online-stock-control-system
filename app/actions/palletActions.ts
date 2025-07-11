'use server';

import {
  generatePalletNumbers as generatePalletNumbersClient,
  confirmPalletUsage as confirmPalletUsageClient,
  releasePalletReservation as releasePalletReservationClient,
  type GenerationOptions,
} from '@/app/utils/palletGeneration';
import { createClient as createServerClient } from '@/app/utils/supabase/server';
import { z } from 'zod';

/**
 * Server action wrapper for unified pallet generation
 * This provides a server-side interface to the V6 pallet generation system
 *
 * @param count - Number of pallet numbers to generate
 * @param sessionId - Optional session identifier for debugging
 * @returns Promise with palletNumbers, series, and error (if any)
 */
export async function generatePalletNumbers(
  count: number,
  sessionId?: string
): Promise<{
  palletNumbers: string[];
  series: string[];
  error?: string;
}> {
  try {
    const options: GenerationOptions = {
      count,
      sessionId,
    };
    const result = await generatePalletNumbersClient(options);

    if (!result.success) {
      return {
        palletNumbers: [],
        series: [],
        error: result.error || 'Failed to generate pallet numbers',
      };
    }

    return {
      palletNumbers: result.palletNumbers,
      series: result.series,
    };
  } catch (error: any) {
    console.error('[palletActions] Error generating pallet numbers:', error);
    return {
      palletNumbers: [],
      series: [],
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Server action to confirm pallet usage
 * Marks reserved pallets as used in the system
 *
 * @param palletNumbers - Array of pallet numbers to confirm
 * @returns Promise with success status and error message if failed
 */
export async function confirmPalletUsage(palletNumbers: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const success = await confirmPalletUsageClient(palletNumbers);

    if (!success) {
      return {
        success: false,
        error: 'Failed to confirm pallet usage',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[palletActions] Error confirming pallet usage:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Server action to release pallet reservations
 * Returns reserved pallets back to available state
 *
 * @param palletNumbers - Array of pallet numbers to release
 * @returns Promise with success status and error message if failed
 */
export async function releasePalletReservation(palletNumbers: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const success = await releasePalletReservationClient(palletNumbers);

    if (!success) {
      return {
        success: false,
        error: 'Failed to release pallet reservation',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[palletActions] Error releasing pallet reservation:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

// Validation schema for reprint
const reprintPalletSchema = z.object({
  palletNumber: z.string().min(1).transform(val => val.toUpperCase()),
});

/**
 * Fetch pallet information for reprinting
 * 獲取棧板信息以供重印
 */
export async function fetchPalletForReprint(palletNumber: string) {
  try {
    const validatedData = reprintPalletSchema.parse({ palletNumber });
    
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Fetch pallet information
    const { data: palletInfo, error: palletError } = await supabase
      .from('record_palletinfo')
      .select(`
        plt_num,
        product_code,
        product_qty,
        lot_num,
        expiry_date,
        grn_num,
        qc_by,
        created_at,
        data_code (
          description,
          chinese_description
        )
      `)
      .eq('plt_num', validatedData.palletNumber)
      .single();

    if (palletError || !palletInfo) {
      console.error('[fetchPalletForReprint] Error fetching pallet:', palletError);
      return {
        success: false,
        error: `Pallet number ${validatedData.palletNumber} not found`,
      };
    }

    // Check if PDF exists
    const { data: labelData, error: labelError } = await supabase
      .from('label_pdf')
      .select('pdf_url, created_at')
      .eq('plt_num', validatedData.palletNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (labelError || !labelData?.pdf_url) {
      console.error('[fetchPalletForReprint] No PDF found:', labelError);
      return {
        success: false,
        error: `No PDF label found for pallet ${validatedData.palletNumber}`,
      };
    }

    // Get user info for history logging
    const { data: userData } = await supabase
      .from('data_id')
      .select('id')
      .eq('email', user.email)
      .single();

    // Log reprint action to history
    if (userData?.id) {
      await supabase.from('record_history').insert({
        action: 'Reprint Label',
        plt_num: validatedData.palletNumber,
        remark: `Reprinted label for pallet ${validatedData.palletNumber}`,
        who: userData.id.toString(),
      });
    }

    return {
      success: true,
      data: {
        plt_num: palletInfo.plt_num,
        product_code: palletInfo.product_code,
        product_description: palletInfo.data_code?.description || '',
        product_qty: palletInfo.product_qty,
        lot_num: palletInfo.lot_num,
        expiry_date: palletInfo.expiry_date,
        grn_num: palletInfo.grn_num,
        qc_by: palletInfo.qc_by,
        created_at: palletInfo.created_at,
        pdf_url: labelData.pdf_url,
      },
    };
  } catch (error) {
    console.error('[fetchPalletForReprint] Error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid pallet number format',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pallet information',
    };
  }
}
