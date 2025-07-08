/**
 * useDatabaseOperations Hook V2
 * 使用優化的托盤編號生成機制
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import {
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcAcoRecordPayload,
  type QcSlateRecordPayload,
  type QcInventoryPayload,
} from '@/app/actions/qcActions';
import {
  generatePalletNumbers as generatePalletNumbersUtil,
  confirmPalletUsage,
  releasePalletReservation,
} from '@/app/utils/palletGeneration';
import type { ProductInfo } from '../../types';

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
    success: boolean;
    error?: string;
  }>;
  createQcRecords: (options: DatabaseOperationOptions) => Promise<{
    success: boolean;
    error?: string;
  }>;
  validatePalletUniqueness: (palletNumbers: string[]) => Promise<boolean>;
}

export const useDatabaseOperationsV2 = (): UseDatabaseOperationsReturn => {
  const supabase = createClient();

  // 驗證托盤編號唯一性
  const validatePalletUniqueness = useCallback(
    async (palletNumbers: string[]): Promise<boolean> => {
      try {
        // V6 系統已經保證唯一性，這裡只做基本檢查
        if (!palletNumbers || palletNumbers.length === 0) {
          return false;
        }

        // 檢查是否有重複值（本地檢查）
        const uniqueSet = new Set(palletNumbers);
        if (uniqueSet.size !== palletNumbers.length) {
          const duplicates = palletNumbers.filter(
            (item, index) => palletNumbers.indexOf(item) !== index
          );
          console.error('Duplicate pallet numbers detected:', duplicates);
          toast.error(`Duplicate pallet numbers: ${duplicates.join(', ')}`);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error validating pallet uniqueness:', error);
        return false;
      }
    },
    []
  );

  // 生成托盤編號和系列號
  const generatePalletNumbers = useCallback(
    async (count: number) => {
      try {
        // 顯示生成中的提示
        const loadingToast = toast.loading(`Generating ${count} pallet numbers...`);

        // 使用優化的生成函數
        // 使用 V6 版本（簡化的預生成托盤編號系統）
        const result = await generatePalletNumbersUtil(
          {
            count,
            sessionId: `qc-${Date.now()}`,
          },
          supabase
        );

        toast.dismiss(loadingToast);

        if (result.error) {
          toast.error(`Generation failed: ${result.error}`);
          return {
            palletNumbers: [],
            series: [],
            success: false,
            error: result.error,
          };
        }

        // 額外的唯一性驗證
        const isUnique = await validatePalletUniqueness(result.palletNumbers);
        if (!isUnique) {
          return {
            palletNumbers: [],
            series: [],
            success: false,
            error: 'Generated duplicate pallet numbers',
          };
        }

        // 顯示成功消息
        toast.success(`Generated ${count} pallet numbers successfully`);

        // V6 已經返回正確排序的托盤編號，無需再排序
        process.env.NODE_ENV !== 'production' &&
          process.env.NODE_ENV !== 'production' &&
          console.log('[DatabaseOperations] Generated pallet numbers:', result.palletNumbers);

        return {
          palletNumbers: result.palletNumbers,
          series: result.series,
          success: true,
          error: undefined,
        };
      } catch (error: any) {
        console.error('Unexpected error generating pallet numbers:', error);
        toast.error('Unexpected error during generation');
        return {
          palletNumbers: [],
          series: [],
          success: false,
          error: error.message,
        };
      }
    },
    [validatePalletUniqueness, supabase]
  );

  // 創建 QC 記錄
  const createQcRecords = useCallback(async (options: DatabaseOperationOptions) => {
    const { productInfo, quantity, clockNumber, formData, palletNum, series, palletIndex } =
      options;

    try {
      // 檢查必要參數
      if (!productInfo || !productInfo.code) {
        throw new Error('Product information is missing');
      }

      // 準備數據庫記錄
      const palletInfoRecord: QcPalletInfoPayload = {
        plt_num: palletNum,
        series: series,
        product_code: productInfo.code,
        product_qty: quantity,
        plt_remark:
          productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
            ? `Finished In Production ACO Ref : ${formData.acoOrderRef.trim()}`
            : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber.trim()
              ? `Finished In Production Batch Num : ${formData.slateDetail.batchNumber.trim()}`
              : 'Finished In Production',
      };

      const historyRecord: QcHistoryPayload = {
        time: new Date().toISOString(),
        id: clockNumber,
        action: 'Finished QC',
        plt_num: palletNum,
        loc: 'Await',
        remark:
          productInfo.type === 'ACO' && formData.acoOrderRef?.trim()
            ? `ACO Ref : ${formData.acoOrderRef.trim()}`
            : productInfo.type === 'Slate' && formData.slateDetail?.batchNumber.trim()
              ? `Batch Num : ${formData.slateDetail.batchNumber.trim()}`
              : formData.operator || '-',
      };

      const inventoryRecord: QcInventoryPayload = {
        product_code: productInfo.code,
        plt_num: palletNum,
        await: quantity,
      };

      const acoRecords: QcAcoRecordPayload[] = [];
      const slateRecords: QcSlateRecordPayload[] = [];

      // 創建數據庫條目
      const dbPayload: QcDatabaseEntryPayload = {
        palletInfo: palletInfoRecord,
        historyRecord: historyRecord,
        inventoryRecord: inventoryRecord,
        acoRecords: acoRecords.length > 0 ? acoRecords : undefined,
        slateRecords: slateRecords.length > 0 ? slateRecords : undefined,
      };

      // 準備 ACO 更新信息（僅對現有訂單的第一個托盤）
      let acoUpdateInfo = undefined;
      if (
        productInfo.type === 'ACO' &&
        !formData.acoNewRef &&
        formData.acoOrderRef?.trim() &&
        palletIndex === 0
      ) {
        acoUpdateInfo = {
          orderRef: parseInt(formData.acoOrderRef.trim(), 10),
          productCode: productInfo.code,
          quantityUsed: quantity * options.count, // 所有托盤的總數量
        };
      }

      const dbResult = await createQcDatabaseEntriesWithTransaction(
        dbPayload,
        clockNumber,
        acoUpdateInfo
      );

      if (dbResult.error) {
        // 檢查是否是重複托盤編號錯誤
        if (dbResult.error.includes('already exists') || dbResult.error.includes('duplicate')) {
          console.error(`Duplicate pallet number detected for ${palletNum}:`, dbResult.error);
          toast.error(
            `Duplicate pallet number ${palletNum} detected. Please wait a moment and try again.`
          );
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
    validatePalletUniqueness,
  };
};
