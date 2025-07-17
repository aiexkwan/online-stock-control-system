'use client';

import { usePalletGeneration } from '@/app/hooks/usePalletGeneration';
import { grnErrorHandler } from '../services/ErrorHandler';

/**
 * Hook for handling pallet number generation for GRN
 * 處理 GRN 托盤號碼生成邏輯
 *
 * This is now a thin wrapper around the unified usePalletGeneration hook
 * 現在是統一 usePalletGeneration hook 的簡單包裝
 */
export const usePalletGenerationGrn = () => {
  const palletGeneration = usePalletGeneration();

  // Adapt the interface to match what GRN expects
  const generatePalletNumbers = async (count: number, clockNumber?: string) => {
    const result = await palletGeneration.generatePalletNumbersAndSeries(count, 'grn-label');

    // Handle error with our GRN-specific error handler
    if (!result.success) {
      grnErrorHandler.handlePalletGenerationError(
        new Error(result.error || 'Failed to generate pallet numbers'),
        {
          component: 'usePalletGenerationGrn',
          action: 'pallet_generation',
          clockNumber,
          additionalData: {
            requestedCount: count,
            method: (result as any).method || 'unknown',
          },
        },
        count
      );
    }

    return {
      palletNumbers: result.palletNumbers,
      series: result.series,
      success: result.success,
    };
  };

  // Add a rollback function for failed operations
  const rollbackPalletNumbers = async (palletNumbers: string[], series: string[]) => {
    try {
      const success = await palletGeneration.releaseReservation(palletNumbers);
      if (success) {
        grnErrorHandler.handleInfo(
          `Released ${palletNumbers.length} pallet reservations`,
          {
            component: 'usePalletGenerationGrn',
            action: 'pallet_rollback',
          },
          false // Don't show toast for rollback
        );
      }
      return success;
    } catch (error) {
      grnErrorHandler.handleWarning(
        'Failed to rollback pallet numbers',
        {
          component: 'usePalletGenerationGrn',
          action: 'pallet_rollback',
          additionalData: {
            palletNumbers,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        false // Don't show toast for rollback failure
      );
      return false;
    }
  };

  return {
    isGenerating: palletGeneration.isGenerating,
    generationError: palletGeneration.generationError,
    generatePalletNumbers,
    clearError: palletGeneration.clearError,
    confirmUsage: palletGeneration.confirmUsage,
    releaseReservation: palletGeneration.releaseReservation,
    rollbackPalletNumbers,
  };
};

export default usePalletGenerationGrn;
