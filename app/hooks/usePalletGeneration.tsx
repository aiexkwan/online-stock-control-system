'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import { 
  generatePalletNumbers,
  confirmPalletUsage,
  releasePalletReservation,
  type GenerationResult 
} from '@/app/utils/palletGeneration';

interface UsePalletGenerationReturn {
  isGenerating: boolean;
  generationError: string | null;
  generatePalletNumbersAndSeries: (count: number, sessionId?: string) => Promise<GenerationResult>;
  confirmUsage: (palletNumbers: string[]) => Promise<boolean>;
  releaseReservation: (palletNumbers: string[]) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Unified hook for pallet number generation
 * 統一的托盤號碼生成 Hook - 供 QC Label 和 GRN Label 共用
 * 
 * @example
 * ```typescript
 * const palletGeneration = usePalletGeneration();
 * 
 * // Generate pallet numbers
 * const result = await palletGeneration.generatePalletNumbersAndSeries(5, 'my-session');
 * if (result.success) {
 *   console.log(result.palletNumbers);
 *   console.log(result.series);
 * }
 * 
 * // Confirm usage after successful printing
 * await palletGeneration.confirmUsage(result.palletNumbers);
 * 
 * // Or release if printing failed
 * await palletGeneration.releaseReservation(result.palletNumbers);
 * ```
 */
export const usePalletGeneration = (): UsePalletGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generatePalletNumbersAndSeries = useCallback(async (
    count: number, 
    sessionId?: string
  ): Promise<GenerationResult> => {
    if (count <= 0) {
      const error = 'Invalid pallet count';
      setGenerationError(error);
      toast.error(error);
      return { 
        palletNumbers: [], 
        series: [], 
        success: false, 
        error,
        method: 'invalid_input' 
      };
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('[usePalletGeneration] Generating pallet numbers:', count);
      
      // 使用統一的托盤生成函數
      const supabase = createClient();
      const result = await generatePalletNumbers({ count, sessionId }, supabase);
      
      if (!result.success) {
        const error = result.error || 'Failed to generate pallet numbers';
        setGenerationError(error);
        toast.error(error);
        console.error('[usePalletGeneration] Generation failed:', result);
        return result;
      }

      console.log('[usePalletGeneration] Generated successfully:', {
        count: result.palletNumbers.length,
        method: result.method
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationError(errorMessage);
      toast.error(`Error generating pallet numbers: ${errorMessage}`);
      console.error('[usePalletGeneration] Exception:', error);
      
      return { 
        palletNumbers: [], 
        series: [], 
        success: false, 
        error: errorMessage,
        method: 'exception' 
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const confirmUsage = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      const supabase = createClient();
      const success = await confirmPalletUsage(palletNumbers, supabase);
      if (!success) {
        toast.error('Failed to confirm pallet usage');
      }
      return success;
    } catch (error) {
      console.error('[usePalletGeneration] Error confirming usage:', error);
      toast.error('Error confirming pallet usage');
      return false;
    }
  }, []);

  const releaseReservation = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      const supabase = createClient();
      const success = await releasePalletReservation(palletNumbers, supabase);
      if (!success) {
        toast.error('Failed to release pallet reservation');
      }
      return success;
    } catch (error) {
      console.error('[usePalletGeneration] Error releasing reservation:', error);
      toast.error('Error releasing pallet reservation');
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    isGenerating,
    generationError,
    generatePalletNumbersAndSeries,
    confirmUsage,
    releaseReservation,
    clearError
  };
};

export default usePalletGeneration;