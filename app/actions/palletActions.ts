'use server';

import { generatePalletNumbers as generatePalletNumbersClient, type GenerationOptions } from '@/app/utils/palletGeneration';

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
      sessionId
    };
    const result = await generatePalletNumbersClient(options);
    
    if (!result.success) {
      return {
        palletNumbers: [],
        series: [],
        error: result.error || 'Failed to generate pallet numbers'
      };
    }
    
    return {
      palletNumbers: result.palletNumbers,
      series: result.series
    };
  } catch (error: any) {
    console.error('[palletActions] Error generating pallet numbers:', error);
    return {
      palletNumbers: [],
      series: [],
      error: error.message || 'Unknown error occurred'
    };
  }
}