/**
 * useDatabaseOperations Hook
 * 處理 QC Label 相關的數據庫操作
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import {
  createQcDatabaseEntriesWithTransaction,
  generatePalletNumbersDirectQuery,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcAcoRecordPayload,
  type QcSlateRecordPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';
import type { ProductInfo } from '../../types';
import {
  MAX_PALLET_GENERATION_RETRIES_PROD,
  MAX_PALLET_GENERATION_RETRIES_DEV,
  RETRY_DELAY_BASE_PROD,
  RETRY_DELAY_BASE
} from '../../constants';

interface DatabaseOperationOptions {
  productInfo: ProductInfo;
  quantity: number;
  count: number;
  clockNumber: string;
  formData: {
    acoOrderRef?: string;
    acoNewRef?: boolean;
    acoOrderDetails?: Array<{ code: string; qty: string }>;
    slateDetail?: {
      batchNumber: string;
    };
    operator?: string;
  };
  palletNum: string;
  series: string;
  palletIndex: number;
}

interface UseDatabaseOperationsReturn {
  generatePalletNumbers: (count: number) => Promise<{
    palletNumbers: string[];
    series: string[];
    error?: string;
  }>;
  createQcRecords: (options: DatabaseOperationOptions) => Promise<{
    success: boolean;
    error?: string;
  }>;
  validatePalletUniqueness: (palletNumbers: string[]) => Promise<boolean>;
}

export const useDatabaseOperations = (): UseDatabaseOperationsReturn => {
  const supabase = createClient();

  // 驗證托盤編號唯一性
  const validatePalletUniqueness = useCallback(async (palletNumbers: string[]): Promise<boolean> => {
    try {
      for (const palletNum of palletNumbers) {
        const { data: existing } = await supabase
          .from('record_palletinfo')
          .select('plt_num')
          .eq('plt_num', palletNum)
          .single();
        
        if (existing) {
          console.error('客戶端檢測到重複托盤編號:', palletNum);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error validating pallet uniqueness:', error);
      return false;
    }
  }, [supabase]);

  // 生成托盤編號和系列號
  const generatePalletNumbers = useCallback(async (count: number) => {
    let retryCount = 0;
    const maxRetries = process.env.NODE_ENV === 'production' 
      ? MAX_PALLET_GENERATION_RETRIES_PROD 
      : MAX_PALLET_GENERATION_RETRIES_DEV;
    
    while (retryCount < maxRetries) {
      const generationResult = await generatePalletNumbersDirectQuery(count);
      
      if (!generationResult.error && generationResult.palletNumbers && generationResult.series) {
        // 額外驗證生成的托盤編號唯一性
        const isUnique = await validatePalletUniqueness(generationResult.palletNumbers);
        
        if (isUnique) {
          return generationResult;
        } else {
          generationResult.error = 'Client-side duplicate detection';
        }
      }
      
      retryCount++;
      
      if (retryCount < maxRetries) {
        toast.warning(`Pallet generation failed (attempt ${retryCount}/${maxRetries}). Retrying...`);
        // 指數退避重試延遲
        const delay = process.env.NODE_ENV === 'production' 
          ? RETRY_DELAY_BASE_PROD * retryCount 
          : RETRY_DELAY_BASE * retryCount;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    const error = `Failed to generate pallet numbers after ${maxRetries} attempts`;
    toast.error(error);
    return { palletNumbers: [], series: [], error };
  }, [validatePalletUniqueness]);

  // 創建 QC 記錄
  const createQcRecords = useCallback(async (options: DatabaseOperationOptions) => {
    const {
      productInfo,
      quantity,
      clockNumber,
      formData,
      palletNum,
      series,
      palletIndex
    } = options;

    try {
      // 準備數據庫記錄
      const palletInfoRecord: QcPalletInfoPayload = {
        plt_num: palletNum,
        series: series,
        product_code: productInfo.code,
        product_qty: quantity,
        plt_remark: productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
          ? `Finished In Production ACO Ref : ${formData.acoOrderRef.trim()}`
          : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber.trim()
          ? `Finished In Production Batch Num : ${formData.slateDetail.batchNumber.trim()}`
          : 'Finished In Production'
      };

      const historyRecord: QcHistoryPayload = {
        time: new Date().toISOString(),
        id: clockNumber,
        action: 'Finished QC',
        plt_num: palletNum,
        loc: 'Await',
        remark: productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
          ? `ACO Ref : ${formData.acoOrderRef.trim()}`
          : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber.trim()
          ? `Batch Num : ${formData.slateDetail.batchNumber.trim()}`
          : formData.operator || '-'
      };

      const inventoryRecord: QcInventoryPayload = {
        product_code: productInfo.code,
        plt_num: palletNum,
        await: quantity
      };

      const acoRecords: QcAcoRecordPayload[] = [];
      const slateRecords: QcSlateRecordPayload[] = [];

      // 創建數據庫條目
      const dbPayload: QcDatabaseEntryPayload = {
        palletInfo: palletInfoRecord,
        historyRecord: historyRecord,
        inventoryRecord: inventoryRecord,
        acoRecords: acoRecords.length > 0 ? acoRecords : undefined,
        slateRecords: slateRecords.length > 0 ? slateRecords : undefined
      };

      // 準備 ACO 更新信息（僅對現有訂單的第一個托盤）
      let acoUpdateInfo = undefined;
      if (productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef?.trim() && palletIndex === 0) {
        acoUpdateInfo = {
          orderRef: parseInt(formData.acoOrderRef.trim(), 10),
          productCode: productInfo.code,
          quantityUsed: quantity * options.count // 所有托盤的總數量
        };
      }

      const dbResult = await createQcDatabaseEntriesWithTransaction(dbPayload, clockNumber, acoUpdateInfo);
      
      if (dbResult.error) {
        // 檢查是否是重複托盤編號錯誤
        if (dbResult.error.includes('already exists') || dbResult.error.includes('duplicate')) {
          console.error(`Duplicate pallet number detected for ${palletNum}:`, dbResult.error);
          toast.error(`Duplicate pallet number ${palletNum} detected. Please wait a moment and try again.`);
          return { success: false, error: 'DUPLICATE_PALLET' };
        }
        
        throw new Error(`Database operation failed: ${dbResult.error}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Error creating QC records for pallet ${palletNum}:`, error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    generatePalletNumbers,
    createQcRecords,
    validatePalletUniqueness
  };
};