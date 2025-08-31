/**
 * useStockUpdates Hook
 * 處理庫存和工作記錄更新
 * 已遷移到直接使用Supabase RPC調用
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../../../lib/types/error-handling';
import { createClient } from '../../../../utils/supabase/client';
import type { ProductInfo } from '../../types';

// 定義 Supabase RPC 函數回傳類型
interface HandlePrintLabelUpdatesResult {
  success: boolean;
  message?: string;
  stock_updated?: number;
  work_updated?: number;
}

// 定義 ACO 訂單更新 API 回應類型
interface AcoOrderUpdateResponse {
  success: boolean;
  error?: string;
  orderCompleted?: boolean;
  totalRemainingInOrder?: number;
  emailNotification?: { success: boolean };
}

interface StockUpdateOptions {
  productInfo: ProductInfo;
  totalQuantity: number;
  palletCount: number;
  clockNumber: string;
  acoOrderRef?: string;
  isNewAcoOrder?: boolean;
}

interface UseStockUpdatesReturn {
  updateStockAndWorkLevels: (options: StockUpdateOptions) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updateAcoOrderStatus: (options: {
    orderRef: number;
    productCode: string;
    quantityUsed: number;
  }) => Promise<{
    success: boolean;
    orderCompleted?: boolean;
    totalRemainingInOrder?: number;
    emailNotification?: { success: boolean };
    error?: string;
  }>;
}

export const useStockUpdates = (): UseStockUpdatesReturn => {
  // 更新庫存和工作記錄
  const updateStockAndWorkLevels = useCallback(async (options: StockUpdateOptions) => {
    const { productInfo, totalQuantity, palletCount, clockNumber } = options;

    try {
      // 獲取用戶 ID
      const userIdNum = parseInt(clockNumber, 10);

      if (isNaN(userIdNum)) {
        console.error('Invalid user ID (clock number):', clockNumber);
        return {
          success: false,
          error: 'Invalid user ID',
        };
      }

      // 直接調用RPC函數更新庫存和工作記錄
      const supabase = createClient();

      const { data, error } = await supabase.rpc('handle_print_label_updates', {
        p_product_code: productInfo.code,
        p_quantity: totalQuantity,
        p_user_id: userIdNum,
        p_pallet_count: palletCount,
        p_description: productInfo.description || null,
      });

      if (error) {
        console.error('Failed to update stock/work levels:', error);
        return {
          success: false,
          error: error.message || 'Failed to update stock/work levels',
        };
      }

      // 檢查RPC函數返回的結果
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          error: 'Invalid response from database function',
        };
      }

      const result = data as HandlePrintLabelUpdatesResult;

      if (!result.success) {
        return {
          success: false,
          error: result.message || 'Database function returned error',
        };
      }

      return { success: true };
    } catch (error: unknown) {
      console.error('Error updating stock/work levels:', error);
      return {
        success: false,
        error: getErrorMessage(error) || 'Error updating stock/work levels',
      };
    }
  }, []);

  // 更新 ACO 訂單狀態
  const updateAcoOrderStatus = useCallback(
    async (options: { orderRef: number; productCode: string; quantityUsed: number }) => {
      try {
        const response = await fetch('/api/aco-order-updates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as AcoOrderUpdateResponse;

        if (!result.success) {
          console.error('Failed to update ACO order:', result.error);
          return {
            success: false,
            error: result.error || 'Failed to update ACO order',
          };
        }

        // 處理訂單完成通知
        if (result.orderCompleted) {
          toast.success(
            `🎉 ACO Order ${options.orderRef} has been completed! Email notification sent.`
          );

          if (!result.emailNotification?.success) {
            toast.warning('Order completed but email notification failed.');
          }
        } else if (result.totalRemainingInOrder !== undefined) {
          toast.success(
            `ACO Order ${options.orderRef} updated. Remaining quantity: ${result.totalRemainingInOrder}`
          );
        }

        return {
          success: true,
          orderCompleted: result.orderCompleted,
          totalRemainingInOrder: result.totalRemainingInOrder,
          emailNotification: result.emailNotification,
        };
      } catch (error: unknown) {
        console.error('Error processing ACO order enhancement:', error);
        return {
          success: false,
          error: getErrorMessage(error) || 'Error processing ACO order',
        };
      }
    },
    []
  );

  return {
    updateStockAndWorkLevels,
    updateAcoOrderStatus,
  };
};
