# 搜尋功能修復報告

> **修復日期**: 2025年1月25日  
> **問題**: 托盤搜尋功能失敗，提示"資料存在，但搜尋失敗"  
> **狀態**: ✅ 已修復  

## 🔍 問題分析

### 根本原因
`useStockMovement.tsx` 中的 `searchPalletInfo` 函數嘗試查詢 `record_palletinfo` 表格中不存在的 `plt_loc` 欄位，導致搜尋失敗。

### 資料庫結構發現
通過詳細檢查發現：

1. **`record_palletinfo` 表格結構**:
   ```
   - generate_time (string)
   - plt_num (string) 
   - product_code (string)
   - series (string)
   - plt_remark (string)
   - product_qty (number)
   ```
   ❌ **沒有 `plt_loc` 欄位**

2. **`record_history` 表格結構**:
   ```
   - time (string)
   - id (number)
   - action (string)
   - plt_num (string)
   - loc (string) ← 位置信息存儲在這裡
   - remark (string)
   - uuid (string)
   ```
   ✅ **位置信息存儲在 `loc` 欄位中**

## 🛠️ 修復方案

### 修改前的代碼問題
```typescript
// ❌ 錯誤：嘗試查詢不存在的plt_loc欄位
let query = supabase.from('record_palletinfo')
                .select('plt_num, product_code, product_qty, plt_remark, plt_loc');
```

### 修復後的代碼
```typescript
// ✅ 正確：分兩步獲取完整信息

// 1. 從record_palletinfo獲取基本信息
let palletQuery = supabase.from('record_palletinfo')
                    .select('plt_num, product_code, product_qty, plt_remark, series');

// 2. 從record_history獲取最新位置
const { data: historyData, error: historyError } = await supabase
  .from('record_history')
  .select('loc')
  .eq('plt_num', palletData.plt_num)
  .order('time', { ascending: false })
  .limit(1);
```

## 🧪 測試結果

### 測試用例
1. **按托盤號搜尋** (`250525/1`): ✅ 成功
2. **按系列號搜尋** (`250525-BC6K22`): ✅ 成功  
3. **搜尋不存在的托盤**: ✅ 正確錯誤處理

### 測試輸出範例
```json
{
  "plt_num": "250525/1",
  "product_code": "MHWEDGE30", 
  "product_qty": 120,
  "plt_remark": "Finished In Production ACO Ref : 123456",
  "current_plt_loc": "Await"
}
```

## 📋 修復內容

### 文件修改
- **`app/hooks/useStockMovement.tsx`**: 修復 `searchPalletInfo` 函數邏輯

### 邏輯改進
1. **分離查詢**: 將托盤基本信息和位置信息分開查詢
2. **錯誤處理**: 保持原有的錯誤處理邏輯
3. **默認值**: 當沒有位置記錄時，使用 'Await' 作為默認位置
4. **性能優化**: 只查詢最新的位置記錄

## 🎯 影響範圍

### 受益功能
- ✅ **Stock Transfer頁面**: 托盤搜尋功能恢復正常
- ✅ **QR碼掃描**: 支持托盤號和系列號搜尋
- ✅ **位置追蹤**: 正確顯示托盤當前位置

### 兼容性
- ✅ **向後兼容**: 不影響現有功能
- ✅ **TypeScript編譯**: 無錯誤
- ✅ **資料庫查詢**: 優化查詢邏輯

## 📝 經驗總結

### 問題排查步驟
1. 檢查錯誤信息和日誌
2. 驗證資料庫表格結構
3. 對比代碼與實際資料庫欄位
4. 創建測試腳本驗證修復

### 最佳實踐
- 在查詢前先驗證表格結構
- 使用適當的錯誤處理
- 提供合理的默認值
- 編寫測試用例驗證修復

---

> **注意**: 此修復確保了托盤搜尋功能的穩定性和準確性，同時保持了與現有系統的完全兼容。 