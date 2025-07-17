'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generatePalletNumbers,
  confirmPalletUsage,
  releasePalletReservation,
} from '@/app/actions/palletActions';

interface UsePalletGenerationReturn {
  isGenerating: boolean;
  generationError: string | null;
  generatePalletNumbersAndSeries: (
    count: number,
    sessionId?: string
  ) => Promise<{
    palletNumbers: string[];
    series: string[];
    success: boolean;
    error?: string;
  }>;
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
 *   process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(result.palletNumbers);
 *   process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(result.series);
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

  const generatePalletNumbersAndSeries = useCallback(
    async (
      count: number,
      sessionId?: string
    ): Promise<{
      palletNumbers: string[];
      series: string[];
      success: boolean;
      error?: string;
    }> => {
      if (count <= 0) {
        const error = 'Invalid pallet count';
        setGenerationError(error);
        toast.error(error);
        return {
          palletNumbers: [],
          series: [],
          success: false,
          error,
        };
      }

      setIsGenerating(true);
      setGenerationError(null);

      try {
        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[usePalletGeneration] Generating pallet numbers:', count);

        // 使用 Server Action
        const result = await generatePalletNumbers(count, sessionId);

        if (result.error) {
          const error = result.error;
          setGenerationError(error);
          toast.error(error);
          console.error('[usePalletGeneration] Generation failed:', result);
          return {
            palletNumbers: [],
            series: [],
            success: false,
            error,
          };
        }

        (process.env.NODE_ENV as string) !== 'production' &&
          console.log('[usePalletGeneration] Generated successfully:', {
            count: result.palletNumbers.length,
          });

        return {
          palletNumbers: result.palletNumbers,
          series: result.series,
          success: true,
        };
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
        };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const confirmUsage = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      const result = await confirmPalletUsage(palletNumbers);
      if (!result.success) {
        toast.error(result.error || 'Failed to confirm pallet usage');
        return false;
      }
      return true;
    } catch (error) {
      console.error('[usePalletGeneration] Error confirming usage:', error);
      toast.error('Error confirming pallet usage');
      return false;
    }
  }, []);

  const releaseReservation = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      const result = await releasePalletReservation(palletNumbers);
      if (!result.success) {
        toast.error(result.error || 'Failed to release pallet reservation');
        return false;
      }
      return true;
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
    clearError,
  };
};

export default usePalletGeneration;
