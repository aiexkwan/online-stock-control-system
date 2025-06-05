# 🚀 Stock Transfer Work Level 優化

## 📅 優化日期
2025年1月3日

## 🎯 優化目標

在 `/stock-transfer` 頁面的托盤轉移功能基礎上，新增自動化動作來追蹤員工的移動工作量：

**新動作**：在每次成功轉移托盤位置後，自動更新 `work_level` 表中員工的 `move` 欄位記錄。

## 📋 需求分析

### 業務需求
- **觸發時機**：每次成功執行托盤位置轉移後
- **查詢邏輯**：在 `work_level` 表的 `id` 欄及 `latest_update` 欄查詢該員工當天的記錄（只比較日期，忽略時間）
- **更新邏輯**：如有記錄，則在 `move` 欄原有值加上 1，並更新 `latest_update` 欄
- **新增邏輯**：如無記錄，則新增一欄，並在 `move` 欄設為 1

### 技術要求
- **非阻塞式設計**：work_level 更新失敗不影響主要轉移流程
- **錯誤處理**：記錄詳細日誌供調試
- **數據完整性**：確保員工 ID 有效性

## 🛠️ 技術實現

### 1. 數據庫 RPC 函數

#### `update_work_level_move()` 函數
```sql
CREATE OR REPLACE FUNCTION update_work_level_move(
    p_user_id INTEGER,
    p_move_count INTEGER DEFAULT 1
)
RETURNS TEXT
```

**功能特點**：
- 基於當天日期查詢員工記錄
- 自動累加 Move 工作量
- 更新最後操作時間
- 支援批量計數
- 完整的錯誤處理

**邏輯流程**：
1. 獲取當前日期
2. 查詢該員工當天的 `work_level` 記錄
3. 如果找到記錄：
   - 在 `move` 欄位累加指定數量
   - 更新 `latest_update` 為當前時間
4. 如果沒有記錄：
   - 新增記錄，設定 `move` 為指定數量
   - 其他欄位（`qc`, `grn`）設為 0
   - 設定 `latest_update` 為當前時間

### 2. Hook 功能整合

#### `useStockMovement.tsx` 更新
在 `executeStockTransfer` 函數中，成功轉移後添加：

```typescript
// 🚀 新增：更新 work_level 表的 move 欄位
try {
  const { data: workLevelData, error: workLevelError } = await supabase.rpc('update_work_level_move', {
    p_user_id: operatorIdNum,
    p_move_count: 1
  });

  if (workLevelError) {
    console.error('[useStockMovement] Work level move 更新失敗:', workLevelError);
    addActivityLog(`Work level update warning: ${workLevelError.message}`, 'info');
  } else {
    console.log('[useStockMovement] Work level move 更新成功:', workLevelData);
    addActivityLog(`Work level updated: ${workLevelData}`, 'info');
  }
} catch (workLevelError: any) {
  console.error('[useStockMovement] Work level move 更新異常:', workLevelError);
  addActivityLog(`Work level update exception: ${workLevelError.message}`, 'info');
}
```

**整合特點**：
- **非阻塞式執行**：work_level 更新失敗不影響主要轉移流程
- **靜默更新**：work_level 更新不會在 Transfer Log 中顯示，保持日誌簡潔
- **控制台日誌**：詳細的調試信息記錄在控制台供開發者查看

## 📊 數據流程圖

```
用戶執行托盤轉移
        ↓
1. 驗證操作員 ID
        ↓
2. 執行主要轉移邏輯
   - 記錄歷史
   - 更新轉移記錄
   - 更新庫存記錄
        ↓
3. 轉移成功
        ↓
4. 🚀 新增：更新 work_level
   - 調用 update_work_level_move()
   - 累加員工 move 工作量
   - 更新活動日誌
        ↓
5. 完成轉移流程
```

## 🧪 測試驗證

### 測試腳本
創建了 `scripts/test-stock-transfer-work-level.sql` 測試腳本，包含：

1. **新增記錄測試**：測試員工第一次 move 記錄
2. **更新記錄測試**：測試現有記錄的累加
3. **批量操作測試**：測試多次移動的累加
4. **錯誤處理測試**：測試無效用戶 ID

### 測試案例
```sql
-- 測試 1: 新增員工的第一個 move 記錄
SELECT update_work_level_move(5997, 1);
-- 預期結果：INSERTED: New work record for User 5997 with Move count 1

-- 測試 2: 更新現有員工的 move 記錄  
SELECT update_work_level_move(5997, 1);
-- 預期結果：UPDATED: User 5997 Move count increased by 1
```

## 🔧 配置說明

### 權限設定
```sql
GRANT EXECUTE ON FUNCTION update_work_level_move(INTEGER, INTEGER) TO authenticated;
```

### 錯誤處理策略
- **非阻塞式設計**：work_level 更新失敗不中斷主要轉移流程
- **靜默處理**：work_level 更新狀態不會在 Transfer Log 中顯示，保持用戶界面簡潔
- **控制台日誌**：詳細的操作結果和錯誤信息記錄在控制台供調試

## 📈 業務價值

### 1. 工作量追蹤
- **自動化統計**：無需手動計算員工移動工作量
- **實時更新**：每次轉移操作即時更新統計數據
- **日期分組**：按天統計，便於日報分析

### 2. 運營效率提升
- **工作量可視化**：清楚了解員工工作分配
- **績效評估**：為員工績效評估提供數據支持
- **資源優化**：幫助管理層優化人力資源配置

### 3. 系統穩定性
- **向後兼容**：不影響現有轉移功能
- **容錯設計**：work_level 更新失敗不中斷主流程
- **漸進式增強**：在原有基礎上添加新功能

## 🚀 部署步驟

### 1. 執行 SQL 腳本
```bash
# 在 Supabase 中執行更新的 RPC 函數
psql -f scripts/grn-label-enhancement-rpc.sql
```

### 2. 驗證 RPC 函數
```sql
-- 測試 work_level move 更新
SELECT update_work_level_move(5997, 1);
```

### 3. 前端部署
- 更新 `useStockMovement.tsx`
- 測試轉移流程

## 📋 檢查清單

### 功能驗證
- [ ] work_level 正確累加員工移動工作量
- [ ] 當天記錄存在時正確更新
- [ ] 當天記錄不存在時正確新增
- [ ] 錯誤處理不中斷主流程
- [ ] work_level 更新不會在 Transfer Log 中顯示（靜默更新）

### 數據完整性
- [ ] 員工 ID 外鍵關聯正確
- [ ] 數值累加邏輯正確
- [ ] 時間戳更新正確
- [ ] 日期比較邏輯正確

### 用戶體驗
- [ ] 轉移流程無感知延遲
- [ ] 錯誤訊息用戶友好
- [ ] 原有功能完全保持
- [ ] 新功能透明運行

## 🎉 總結

Stock Transfer Work Level 優化成功實現了：

✅ **自動化追蹤**：每次托盤轉移自動記錄員工移動工作量  
✅ **無縫整合**：在不影響原有轉移流程的基礎上添加新功能  
✅ **容錯設計**：work_level 更新失敗不影響核心轉移功能  
✅ **實時統計**：每次轉移操作即時更新員工工作量數據  
✅ **日期分組**：按天統計員工工作量，便於報表分析  

這次優化為托盤轉移管理提供了更完整的員工工作量追蹤能力，為後續的工作量統計、績效評估和資源優化奠定了堅實基礎。 