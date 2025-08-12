/**
 * useStockUpdates Hook
 * 處理庫存和工作記錄更新
 */

import { useCallback } from 'react';
import { getErrorMessage } from '@/types/core/error';
import { toast } from 'sonner';
import type { ProductInfo } from '../../types';
import { isProduction, isNotProduction } from '@/lib/utils/env';

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

      // 調用 API 更新庫存和工作記錄
      const response = await fetch('/api/print-label-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCode: productInfo.code,
          quantity: totalQuantity,
          userId: userIdNum,
          palletCount: palletCount,
          description: productInfo.description,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to update stock/work levels:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to update stock/work levels',
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

        const result = await response.json();

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
