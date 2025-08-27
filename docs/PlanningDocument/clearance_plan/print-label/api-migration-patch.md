# API 依賴遷移補丁

基於清理分析，需要先處理 useStockUpdates.tsx 中的API依賴，將其從REST API遷移到RPC調用。

## 🎯 遷移目標

將 `useStockUpdates.tsx` 中的 `/api/print-label-updates` 調用遷移到直接使用Supabase RPC函數 `handle_print_label_updates`。

---

## 📋 遷移步驟

### 步驟1：修改 useStockUpdates.tsx

**文件位置**: `app/components/qc-label-form/hooks/modules/useStockUpdates.tsx`

**原代碼** (第57-89行):
```typescript
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
```

**新代碼**:
```typescript
// 導入Supabase客戶端
import { createClient } from '@/app/utils/supabase/client';

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
if (!data || typeof data !== 'object' || !data.success) {
  return {
    success: false,
    error: data?.message || 'Database function returned error',
  };
}

return { success: true };
```

---

### 步驟2：完整的修改後文件

```typescript
/**
 * useStockUpdates Hook
 * 處理庫存和工作記錄更新
 * 已遷移到直接使用Supabase RPC調用
 */

import { useCallback } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
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

      const result = data as {
        success: boolean;
        message?: string;
        stock_updated?: number;
        work_updated?: number;
      };

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

  // 更新 ACO 訂單狀態 (保持不變，使用不同的API)
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
```

---

### 步驟3：測試遷移結果

**執行測試**:
```bash
# 1. TypeScript 編譯檢查
npm run type-check

# 2. 單元測試
npm run test -- --testPathPattern=useStockUpdates

# 3. 啟動開發環境測試
npm run dev

# 4. 手動功能測試
# 訪問 Admin > Operations > QC Label
# 測試標籤生成和庫存更新功能
```

**驗證要點**:
- [ ] QCLabelCard 功能完全正常
- [ ] 庫存更新正確執行 
- [ ] 工作記錄正確寫入
- [ ] 無控制台錯誤或警告
- [ ] API調用響應時間合理

---

### 步驟4：清理舊的 import

確保在修改後，文件頂部的imports是正確的：

```typescript
import { useCallback } from 'react';
import { getErrorMessage } from '@/lib/types/error-handling';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client'; // 新增
import type { ProductInfo } from '../../types';
import { isProduction, isNotProduction } from '@/lib/utils/env';
```

---

## 🔍 技術對比

| 方面 | 原方案 (REST API) | 新方案 (RPC) |
|------|------------------|---------------|
| **調用方式** | fetch('/api/print-label-updates') | supabase.rpc('handle_print_label_updates') |
| **網路請求** | HTTP POST → API Route → Supabase | 直接 Supabase 調用 |
| **性能** | 2次網路請求 | 1次網路請求 |
| **錯誤處理** | HTTP狀態碼 + JSON | Supabase錯誤對象 |
| **類型安全** | JSON response | TypeScript RPC 調用 |
| **維護性** | 需維護API Route | 只需維護RPC函數 |

---

## ⚠️ 注意事項

1. **確保RPC函數存在**: 檢查 `handle_print_label_updates` 函數在Supabase中正常運作
2. **參數對應**: 確保RPC函數參數與傳入參數完全匹配
3. **錯誤處理**: 新的錯誤處理邏輯與原來略有不同
4. **ACO功能**: ACO訂單更新功能保持使用原有API（`/api/aco-order-updates`）
5. **測試覆蓋**: 需要完整測試所有相關功能確保無回歸問題

---

## 📋 完成檢查清單

遷移完成後，請確認：

- [ ] useStockUpdates.tsx 已修改完成
- [ ] 新的import語句已添加
- [ ] TypeScript編譯無錯誤
- [ ] 單元測試通過
- [ ] QCLabelCard功能測試正常
- [ ] 庫存更新功能正常
- [ ] 工作記錄寫入正常
- [ ] 沒有控制台錯誤
- [ ] 性能表現符合預期

**遷移完成後，即可執行主清理腳本移除 print-label 模組。**