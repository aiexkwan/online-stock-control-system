'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generatePalletNumbers,
  confirmPalletUsage,
  releasePalletReservation,
} from '@/app/actions/palletActions';
import { createSecureLogger } from '@/lib/security/enhanced-logger-sanitizer';

// 建立安全日誌記錄器
const secureLogger = createSecureLogger('usePalletGeneration');

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
 * const _result = await palletGeneration.generatePalletNumbersAndSeries(5, 'my-session');
 * if (_result.success) {
 *   // Pallet numbers and series will be logged securely in development
 * }
 *
 * // Confirm usage after successful printing
 * await palletGeneration.confirmUsage(_result.palletNumbers);
 *
 * // Or release if printing failed
 * await palletGeneration.releaseReservation(_result.palletNumbers);
 * ```
 */
export const usePalletGeneration = (): UsePalletGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generatePalletNumbersAndSeries = useCallback(
    async (
      count: number,
      _sessionId?: string
    ): Promise<{
      palletNumbers: string[];
      series: string[];
      success: boolean;
      error?: string;
    }> => {
      if (count <= 0) {
        const _error = 'Invalid pallet count';
        setGenerationError(_error);
        toast.error(_error);
        return {
          palletNumbers: [],
          series: [],
          success: false,
          error: _error,
        };
      }

      setIsGenerating(true);
      setGenerationError(null);

      try {
        secureLogger.info({ count }, '[usePalletGeneration] Generating pallet numbers');

        // 使用 Server Action
        const _result = await generatePalletNumbers(count, _sessionId);

        if (_result.error) {
          const _error = _result.error;
          setGenerationError(_error);
          toast.error(_error);
          secureLogger.error(_result, '[usePalletGeneration] Generation failed');
          return {
            palletNumbers: [],
            series: [],
            success: false,
            error: _error,
          };
        }

        secureLogger.info(
          { count: _result.palletNumbers.length },
          '[usePalletGeneration] Generated successfully'
        );

        return {
          palletNumbers: _result.palletNumbers,
          series: _result.series,
          success: true,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setGenerationError(errorMessage);
        toast.error(`Error generating pallet numbers: ${errorMessage}`);
        secureLogger.error(error, '[usePalletGeneration] Exception');

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
      const _result = await confirmPalletUsage(palletNumbers);
      if (!_result.success) {
        toast.error(_result.error || 'Failed to confirm pallet usage');
        return false;
      }
      return true;
    } catch (error) {
      secureLogger.error(error, '[usePalletGeneration] Error confirming usage');
      toast.error('Error confirming pallet usage');
      return false;
    }
  }, []);

  const releaseReservation = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      const _result = await releasePalletReservation(palletNumbers);
      if (!_result.success) {
        toast.error(_result.error || 'Failed to release pallet reservation');
        return false;
      }
      return true;
    } catch (error) {
      secureLogger.error(error, '[usePalletGeneration] Error releasing reservation');
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
