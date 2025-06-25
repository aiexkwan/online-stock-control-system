import { useCallback } from 'react';
import { toast } from 'sonner';
import { generateOptimizedPalletNumbersV6, confirmPalletUsage, releasePalletReservation } from '@/app/utils/optimizedPalletGenerationV6';
import { createClient } from '@/lib/supabase';
import {
  createGrnDatabaseEntries,
  uploadPdfToStorage,
  type GrnPalletInfoPayload,
  type GrnRecordPayload
} from '@/app/actions/grnActions';

interface GrnDatabasePayload {
  palletInfo: GrnPalletInfoPayload;
  grnRecord: GrnRecordPayload;
}

interface GenerationResult {
  palletNumbers: string[];
  series: string[];
  error?: string;
}

export function useDatabaseOperationsV2() {
  // Optimized pallet number and series generation
  const generatePalletNumbersAndSeries = useCallback(async (count: number): Promise<GenerationResult> => {
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN useDatabaseOperationsV2] Generating ${count} pallet numbers using optimized method`);
      
      // Use V6 optimized pallet generation (includes series)
      const supabase = createClient();
      const result = await generateOptimizedPalletNumbersV6({
        count,
        sessionId: `grn-${Date.now()}`
      }, supabase);
      
      if (!result.success || result.palletNumbers.length !== count) {
        throw new Error(result.error || `Failed to generate ${count} pallet numbers`);
      }
      
      // V6 already includes series, no need to generate separately
      const series = result.series;
      
      // Log method used
      if (result.method) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[GRN useDatabaseOperationsV2] Generation completed:`, {
          method: result.method,
          count
        });
      }
      
      return {
        palletNumbers: result.palletNumbers,
        series
      };
    } catch (error: any) {
      console.error('[GRN useDatabaseOperationsV2] Generation failed:', error);
      return {
        palletNumbers: [],
        series: [],
        error: error.message
      };
    }
  }, []);
  
  // Create database entries
  const createDatabaseEntries = useCallback(async (
    payload: GrnDatabasePayload,
    operatorClockNumber: string,
    labelMode: 'weight' | 'qty' = 'weight'
  ) => {
    try {
      const result = await createGrnDatabaseEntries(payload, operatorClockNumber, labelMode);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Handle workflow warnings
      if (result.warning) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[GRN useDatabaseOperationsV2] Workflow warning:', result.warning);
        toast.warning(result.warning);
      }
      
      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('[GRN useDatabaseOperationsV2] Database operation failed:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  // Upload PDF to storage
  const uploadPdf = useCallback(async (
    pdfBlob: Blob,
    fileName: string,
    storagePath: string = 'grn-labels'
  ) => {
    try {
      // Convert blob to number array for server action
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const numberArray = Array.from(uint8Array);
      
      const result = await uploadPdfToStorage(numberArray, fileName, storagePath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return { success: true, publicUrl: result.publicUrl };
    } catch (error: any) {
      console.error('[GRN useDatabaseOperationsV2] PDF upload failed:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  return {
    generatePalletNumbersAndSeries,
    createDatabaseEntries,
    uploadPdf
  };
}