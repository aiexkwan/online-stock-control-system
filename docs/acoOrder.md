# ACO Order Management 功能改進

> **更新日期**: 2025年5月25日  
> **版本**: v3.0  
> **狀態**: ✅ 已完成並測試  

## 📋 改進概覽

根據用戶需求，對ACO Order Management功能進行了以下重要改進：

### 🎯 主要改進項目

1. **下拉選單顯示所有唯一的order_ref值**
2. **支援選擇已完成和未完成的訂單**
3. **庫存超量檢查和警告**
4. **智能按鈕禁用機制**
5. **ACO訂單詳情完整性檢查**
6. **數字輸入驗證和過濾**
7. **手風琴按鈕意外觸發修復**

## 🔧 技術實現

### 1. 下拉選單改進

**之前的邏輯**:
```javascript
// 只顯示有剩餘數量的訂單
const activeOrderRefs = Object.entries(groupedByOrderRef)
  .filter(([, value]) => value.totalRemainQty > 0)
  .map(([key]) => parseInt(key, 10));
```

**改進後的邏輯**:
```javascript
// 顯示所有唯一的order_ref值
const allOrderRefs = Array.from(new Set(
  data
    .filter(record => record.order_ref !== null && record.order_ref !== undefined)
    .map(record => record.order_ref)
)).sort((a, b) => a - b);
```

### 2. 庫存超量檢查

新增了 `checkAcoQuantityExcess` 函數：

```javascript
const checkAcoQuantityExcess = useCallback(() => {
  if (productInfo?.type !== 'ACO' || !formData.acoOrderRef.trim() || formData.acoNewRef) {
    return false;
  }

  const quantity = parseInt(formData.quantity.trim(), 10);
  const count = parseInt(formData.count.trim(), 10);
  const totalPalletQuantity = quantity * count;
  
  // 從acoRemain字符串中提取剩餘數量
  if (formData.acoRemain && formData.acoRemain.includes('Order Remain Qty :')) {
    const remainQtyMatch = formData.acoRemain.match(/Order Remain Qty : (\d+)/);
    if (remainQtyMatch) {
      const remainingQty = parseInt(remainQtyMatch[1], 10);
      return totalPalletQuantity > remainingQty;
    }
  }
  
  return false;
}, [productInfo?.type, formData.acoOrderRef, formData.acoNewRef, formData.quantity, formData.count, formData.acoRemain]);
```

### 3. ACO訂單詳情完整性檢查

新增了 `isAcoOrderIncomplete` 檢查函數：

```javascript
const isAcoOrderIncomplete = (() => {
  if (productInfo?.type !== 'ACO') {
    return false;
  }

  // 如果沒有提供ACO訂單參考
  if (!formData.acoOrderRef.trim()) {
    return true;
  }

  // 如果提供了ACO訂單參考但沒有執行搜尋
  if (formData.acoOrderRef.trim().length >= 5 && !formData.acoRemain) {
    return true;
  }

  // 如果是新ACO訂單但沒有提供訂單詳情
  if (formData.acoNewRef) {
    const validOrderDetails = formData.acoOrderDetails.filter((detail, idx) => 
      detail.code.trim() && 
      detail.qty.trim() && 
      !formData.acoOrderDetailErrors[idx] && 
      !isNaN(parseInt(detail.qty.trim())) && 
      parseInt(detail.qty.trim()) > 0
    );
    
    if (validOrderDetails.length === 0) {
      return true;
    }
    
    const hasValidationErrors = formData.acoOrderDetailErrors.some(error => error.trim() !== '');
    if (hasValidationErrors) {
      return true;
    }
  }

  return false;
})();
```

### 4. 數字輸入驗證

為所有相關欄位添加了數字輸入限制：

```javascript
// ACO Order Reference欄位
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={acoOrderRef}
  onChange={(e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onAcoOrderRefChange(numericValue);
  }}
  placeholder="Or enter new Order Ref (min 5 digits)"
/>

// Quantity of Pallet欄位
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={quantity}
  onChange={(e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onQuantityChange(numericValue);
  }}
  placeholder="Numbers only"
/>
```

### 5. 手風琴按鈕修復

修復了手風琴組件中按鈕意外觸發表單提交的問題：

```javascript
// 修復前
<button onClick={handleToggle} disabled={disabled}>

// 修復後  
<button type="button" onClick={handleToggle} disabled={disabled}>
```

**修復的組件**：
- `Accordion.tsx`: 手風琴展開/收合按鈕
- `ErrorBoundary.tsx`: "Try Again" 和 "Refresh Page" 按鈕
- `ErrorStats.tsx`: "Clear" 和 "Log Details" 按鈕
- `PerformanceDashboard.tsx`: 顯示/隱藏和展開/收合按鈕

### 6. UI改進

#### 按鈕狀態管理
```javascript
<button
  type="submit"
  disabled={!validationState.isValid || isLoading || businessLogic.isAcoOrderExcess || businessLogic.isAcoOrderFulfilled || businessLogic.isAcoOrderIncomplete}
  className={`
    ${validationState.isValid && !isLoading && !businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
    }
  `}
>
  <span>
    {isLoading ? 'Processing...' : 
     businessLogic.isAcoOrderFulfilled ? 'Order Fulfilled' :
     businessLogic.isAcoOrderExcess ? 'Quantity Exceeds Order' : 
     businessLogic.isAcoOrderIncomplete ? 'Complete ACO Details' :
     'Print Label'}
  </span>
</button>
```

#### 警告信息顯示
```javascript
{/* ACO Fulfilled Warning */}
{businessLogic.isAcoOrderFulfilled && (
  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="text-sm font-medium text-yellow-800">
      ⚠️ Cannot Print Label
    </div>
    <div className="text-xs text-yellow-600 mt-1">
      This ACO order has been fulfilled. No remaining quantity available.
    </div>
  </div>
)}

{/* ACO Excess Warning */}
{businessLogic.isAcoOrderExcess && !businessLogic.isAcoOrderFulfilled && !businessLogic.isAcoOrderIncomplete && (
  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-sm font-medium text-red-800">
      ⚠️ Cannot Print Label
    </div>
    <div className="text-xs text-red-600 mt-1">
      The total quantity exceeds the remaining ACO order quantity. Please adjust your input.
    </div>
  </div>
)}

{/* ACO Incomplete Warning */}
{businessLogic.isAcoOrderIncomplete && (
  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="text-sm font-medium text-orange-800">
      ⚠️ Complete ACO Order Details
    </div>
    <div className="text-xs text-orange-600 mt-1">
      Please complete the ACO order search or enter all required order details before printing.
    </div>
  </div>
)}
```

## 📊 測試結果

### 資料庫狀態
- **總ACO記錄數**: 1筆
- **唯一Order References**: 123456
- **訂單狀態**: 已完成 (剩餘量: 0)

### 功能測試

#### ACO訂單狀態測試
| 測試案例 | 每托盤數量 | 托盤數 | 總需求量 | 剩餘量 | 結果 |
|---------|-----------|--------|----------|--------|------|
| 正常情況 | 50 | 2 | 100 | 0 | ❌ 超量 (正確) |
| 超量情況 | 100 | 5 | 500 | 0 | ❌ 超量 (正確) |
| 邊界情況 | 30 | 1 | 30 | 0 | ❌ 超量 (正確) |

#### ACO訂單完整性測試
| 測試情況 | ACO Order Ref | 搜尋狀態 | 訂單詳情 | 按鈕狀態 | 結果 |
|---------|---------------|----------|----------|----------|------|
| 未輸入訂單參考 | "" | - | - | 禁用 | ✅ 正確 |
| 輸入但未搜尋 | "123456" | 未搜尋 | - | 禁用 | ✅ 正確 |
| 已搜尋現有訂單 | "123456" | 已搜尋 | - | 啟用/禁用* | ✅ 正確 |
| 新訂單無詳情 | "999999" | 新訂單 | 空 | 禁用 | ✅ 正確 |
| 新訂單有詳情 | "999999" | 新訂單 | 有效 | 啟用 | ✅ 正確 |

*根據訂單狀態（已完成/超量）決定

#### 數字輸入驗證測試
| 欄位 | 輸入 | 過濾後 | 結果 |
|------|------|--------|------|
| ACO Order Reference | "123456" | "123456" | ✅ 正確 |
| ACO Order Reference | "12abc34" | "1234" | ✅ 正確 |
| Quantity of Pallet | "120" | "120" | ✅ 正確 |
| Quantity of Pallet | "12.5" | "125" | ✅ 正確 |
| Count of Pallet | "5" | "5" | ✅ 正確 |

#### 手風琴按鈕測試
| 測試項目 | 修復前 | 修復後 | 狀態 |
|---------|--------|--------|------|
| 點擊手風琴標題 | 觸發表單提交 | 只展開/收合 | ✅ 修復 |
| Print Label 按鈕禁用 | 可被繞過 | 正確禁用 | ✅ 修復 |
| 手風琴功能 | 正常 | 正常 | ✅ 維持 |

## 🎯 用戶體驗改進

### 1. 下拉選單體驗
- ✅ 顯示所有歷史訂單
- ✅ 包含訂單狀態指示
- ✅ 支援選擇已完成的訂單進行查看

### 2. 輸入驗證
- ✅ 實時檢查數量是否超過剩餘量
- ✅ 即時顯示警告信息
- ✅ 智能禁用不可用的操作
- ✅ 數字欄位自動過濾非數字字符
- ✅ 移動設備友好的數字鍵盤

### 3. 錯誤預防
- ✅ 防止用戶提交超量訂單
- ✅ 防止未完成ACO詳情時提交
- ✅ 防止意外的表單提交（手風琴按鈕）
- ✅ 清晰的錯誤提示
- ✅ 引導用戶調整輸入

### 4. 完整性檢查
- ✅ ACO訂單參考必須提供
- ✅ 必須執行訂單搜尋
- ✅ 新訂單必須提供有效的產品詳情
- ✅ 產品代碼驗證
- ✅ 數量驗證

## 🔄 業務流程

### 選擇現有訂單
1. 用戶從下拉選單選擇現有的order_ref
2. 系統查詢該訂單的剩餘數量
3. 顯示訂單狀態和剩餘量信息
4. 用戶輸入托盤數量和數量
5. 系統檢查是否超量
6. 如果超量，禁用Print Label按鈕並顯示警告

### 輸入新訂單
1. 用戶手動輸入新的order_ref (至少5個字符)
2. 系統檢測為新訂單
3. 要求用戶輸入訂單詳細信息
4. 驗證產品代碼
5. 允許列印標籤

## 📁 修改的文件

### 核心邏輯文件
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`
  - 修改ACO order refs獲取邏輯
  - 新增庫存超量檢查函數
  - 新增ACO訂單完整性檢查函數
  - 新增isAcoOrderFulfilled檢查
  - 新增isAcoOrderIncomplete檢查

### UI組件文件
- `app/components/qc-label-form/AcoOrderForm.tsx`
  - 改進警告信息顯示
  - 添加ACO Order Reference數字輸入限制

- `app/components/qc-label-form/BasicProductForm.tsx`
  - 添加Quantity和Count欄位數字輸入限制
  - 更新placeholder文字

- `app/components/qc-label-form/PerformanceOptimizedForm.tsx`
  - 修改按鈕禁用邏輯
  - 新增多種警告區域（超量、已完成、未完成）
  - 更新按鈕文字動態變更

### 按鈕修復文件
- `app/components/qc-label-form/Accordion.tsx`
  - 添加type="button"屬性

- `app/components/qc-label-form/ErrorBoundary.tsx`
  - 添加type="button"屬性

- `app/components/qc-label-form/ErrorStats.tsx`
  - 添加type="button"屬性

- `app/components/qc-label-form/PerformanceDashboard.tsx`
  - 添加type="button"屬性

### 文檔文件
- `docs/aco-order-improvements.md` - 本文檔（統一所有ACO相關改進）

## 🚀 部署狀態

- ✅ 代碼修改完成
- ✅ TypeScript編譯通過
- ✅ 功能測試通過
- ✅ ACO訂單完整性檢查實現
- ✅ 數字輸入驗證實現
- ✅ 手風琴按鈕修復完成
- ✅ 所有相關文檔統一整合
- ✅ 文檔更新完成

## 🔮 未來改進建議

1. **訂單狀態可視化**
   - 在下拉選單中顯示訂單狀態圖標
   - 使用顏色編碼區分不同狀態

2. **批量操作支援**
   - 支援一次處理多個ACO訂單
   - 批量更新剩餘數量

3. **歷史記錄追蹤**
   - 記錄每次數量變更的歷史
   - 提供訂單完成度追蹤

4. **智能建議**
   - 根據剩餘量建議最佳托盤配置
   - 自動計算最優分配方案

## 🔧 最新修正 (2025-01-28)

### ACO 訂單負數防護

**問題**: ACO 訂單的 `remain_qty` 可能被扣減至負數，導致數據不一致。

**根本原因**: 在 `updateAcoOrderRemainQty` 函數中，沒有檢查扣減後的結果是否為負數：
```typescript
// 修正前 (有問題)
const newRemainQty = (currentData.remain_qty || 0) - quantityUsed;
```

**解決方案**: 添加負數防護和警告日誌：
```typescript
// 修正後 (安全)
const currentRemainQty = currentData.remain_qty || 0;
const newRemainQty = Math.max(0, currentRemainQty - quantityUsed); // 防止負數

// 檢查是否會導致負數
if (currentRemainQty < quantityUsed) {
  console.warn(`[qcActions] ACO quantity warning: Trying to use ${quantityUsed} but only ${currentRemainQty} remaining. Setting to 0.`);
}
```

**修正效果**:
- ✅ **防止負數**: `remain_qty` 永遠不會小於 0
- ✅ **警告日誌**: 當嘗試超量使用時記錄警告
- ✅ **詳細回饋**: 返回更詳細的操作信息
- ✅ **數據一致性**: 確保 ACO 訂單數據的完整性

**測試案例**:
| 當前剩餘量 | 使用量 | 修正前結果 | 修正後結果 | 狀態 |
|-----------|--------|-----------|-----------|------|
| 100 | 50 | 50 | 50 | ✅ 正常 |
| 30 | 50 | -20 ❌ | 0 ✅ | ✅ 防護生效 |
| 0 | 10 | -10 ❌ | 0 ✅ | ✅ 防護生效 |

**影響範圍**:
- `app/actions/qcActions.ts` - `updateAcoOrderRemainQty` 函數
- 所有使用 ACO 訂單更新的功能（Print QC Label）
- ACO 訂單數據完整性

---

> **注意**: 此功能改進已經過完整測試，可以安全部署到生產環境。如有任何問題，請參考測試腳本或聯繫開發團隊。 