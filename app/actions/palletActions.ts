'use server';

import {
  generatePalletNumbers as generatePalletNumbersClient,
  confirmPalletUsage as confirmPalletUsageClient,
  releasePalletReservation as releasePalletReservationClient,
  type GenerationOptions,
} from '../utils/palletGeneration';
import { createClient as createServerClient } from '@/app/utils/supabase/server';
import { getErrorMessage } from '@/types/core/error';
import { z } from 'zod';

// Type definitions for database records
interface DocUploadRecord {
  uuid: string;
  doc_name: string;
  upload_by: number;
  doc_type: string;
  doc_url: string;
  file_size: number;
  folder: string;
  created_at: string;
  json_txt: string;
}

interface PalletInfoRecord {
  plt_num: string;
  product_code: string;
  product_qty: number;
  series: string;
  plt_remark: string;
  generate_time: string;
  pdf_url: string;
}

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
  } catch (error: unknown) {
    console.error('[palletActions] Error generating pallet numbers:', error);
    return {
      palletNumbers: [],
      series: [],
      error: getErrorMessage(error) || 'Unknown error occurred',
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
  } catch (error: unknown) {
    console.error('[palletActions] Error confirming pallet usage:', error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Unknown error occurred',
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
  } catch (error: unknown) {
    console.error('[palletActions] Error releasing pallet reservation:', error);
    return {
      success: false,
      error: getErrorMessage(error) || 'Unknown error occurred',
    };
  }
}

