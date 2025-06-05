# 🏷️ GRN Label 列印工作流程優化

## 📅 優化日期
2025年1月3日

## 🎯 優化目標

在原有 GRN 標籤列印流程基礎上，新增三個自動化動作：
1. **grn_level 表記錄更新** - 追蹤 GRN 層級的重量/數量統計
2. **work_level 表記錄更新** - 追蹤員工 GRN 工作量
3. **stock_level 表記錄更新** - 追蹤產品庫存水平

## 📋 需求分析

### 新動作（一）：grn_level 表更新
- **觸發時機**：每次列印一張 GRN 標籤 PDF 時
- **查詢邏輯**：在 `grn_level` 表的 `grn_ref` 欄查詢是否有舊記錄
- **新增邏輯**：如無舊記錄則新增一欄
- **更新邏輯**：
  - **重量模式**：在 `total_gross` 欄加入毛重，在 `total_net` 欄加入淨重
  - **數量模式**：在 `total_unit` 欄加入數量
- **累加邏輯**：如有舊記錄則在原有欄位上累加新記錄

### 新動作（二）：work_level 表更新
- **觸發時機**：每次列印一張 GRN 標籤 PDF 時
- **查詢邏輯**：在 `work_level` 表查詢該員工 ID 當天的記錄
- **更新邏輯**：如有記錄，則在 `grn` 欄原有值加上 1，並更新 `latest_update` 欄
- **新增邏輯**：如無記錄，則新增一欄，並在 `grn` 欄設為 1

### 🚀 新動作（三）：stock_level 表更新
- **觸發時機**：每次列印一張 GRN 標籤 PDF 時
- **查詢邏輯**：在 `stock_level` 表的 `stock` 欄查詢是否有相同 product code 記錄
- **新增邏輯**：如無舊記錄則新增一欄
- **更新邏輯**：如有舊記錄則在原有列的 `stock_level` 欄上加上新記錄，並更新 `update_time` 欄
- **數量計算**：
  - **重量模式**：使用淨重作為庫存數量
  - **數量模式**：使用產品數量作為庫存數量

## 🛠️ 技術實現

### 1. 數據庫 RPC 函數

#### `update_grn_level()` 函數
```sql
CREATE OR REPLACE FUNCTION update_grn_level(
    p_grn_ref TEXT,
    p_label_mode TEXT, -- 'weight' 或 'qty'
    p_gross_weight NUMERIC DEFAULT NULL,
    p_net_weight NUMERIC DEFAULT NULL,
    p_quantity INTEGER DEFAULT NULL
)
RETURNS TEXT
```

**功能特點**：
- 支援重量模式和數量模式
- 自動驗證 GRN 參考號格式
- 智能判斷新增或更新邏輯
- 返回詳細操作結果

#### `update_work_level_grn()` 函數
```sql
CREATE OR REPLACE FUNCTION update_work_level_grn(
    p_user_id INTEGER,
    p_grn_count INTEGER DEFAULT 1
)
RETURNS TEXT
```

**功能特點**：
- 基於當天日期查詢員工記錄
- 自動累加 GRN 工作量
- 更新最後操作時間
- 支援批量計數

#### `update_stock_level_grn()` 函數
```sql
CREATE OR REPLACE FUNCTION update_stock_level_grn(
    p_product_code TEXT,
    p_quantity BIGINT,
    p_description TEXT DEFAULT NULL
)
RETURNS TEXT
```

**功能特點**：
- 基於產品代碼查詢庫存記錄
- 自動累加庫存數量
- 更新庫存時間戳
- 自動獲取產品描述（如未提供）
- 支援新產品的庫存初始化

#### `update_grn_workflow()` 組合函數
```sql
CREATE OR REPLACE FUNCTION update_grn_workflow(
    p_grn_ref TEXT,
    p_label_mode TEXT,
    p_user_id INTEGER,
    p_product_code TEXT,
    p_product_description TEXT DEFAULT NULL,
    p_gross_weight NUMERIC DEFAULT NULL,
    p_net_weight NUMERIC DEFAULT NULL,
    p_quantity INTEGER DEFAULT NULL,
    p_grn_count INTEGER DEFAULT 1
)
RETURNS JSONB
```

**功能特點**：
- 同時調用三個子函數
- 返回 JSON 格式的詳細結果
- 包含成功狀態和時間戳
- 錯誤處理和回滾機制
- 智能數量計算（重量/數量模式）

### 2. Server Actions 更新

#### `createGrnDatabaseEntries()` 函數增強
```typescript
export async function createGrnDatabaseEntries(
  payload: GrnDatabaseEntryPayload, 
  operatorClockNumberStr: string,
  labelMode: 'weight' | 'qty' = 'weight' // 新增參數
): Promise<{ data?: string; error?: string; warning?: string }>
```

**新增功能**：
- 接收標籤模式參數
- 調用 `update_grn_workflow` RPC 函數
- 智能參數映射（重量/數量模式）
- 非阻塞式錯誤處理（警告而非中斷）

### 3. 前端組件整合

#### GrnLabelForm 組件更新
- 傳遞 `labelMode.mode` 到 server action
- 顯示 workflow 更新警告訊息
- 保持原有列印流程不變

## 📊 數據流程圖

```
用戶列印 GRN 標籤
        ↓
1. 執行原有流程
   - 生成棧板號碼
   - 創建數據庫記錄
   - 生成 PDF
        ↓
2. 🚀 新增：GRN Workflow 優化
   - 調用 update_grn_workflow()
   - 更新 grn_level 表
   - 更新 work_level 表
   - 更新 stock_level 表
        ↓
3. 完成列印流程
   - 上傳 PDF
   - 合併列印
   - 重置表單
```

## 🔧 配置說明

### 標籤模式支援
- **重量模式** (`weight`)：
  - 更新 `grn_level.total_gross` 和 `total_net`
  - 使用實際毛重和淨重數值
  
- **數量模式** (`qty`)：
  - 更新 `grn_level.total_unit`
  - 使用產品數量數值

### 錯誤處理策略
- **非阻塞式設計**：workflow 更新失敗不影響主要列印流程
- **警告提示**：向用戶顯示 workflow 更新狀態
- **詳細日誌**：記錄所有操作結果供調試

## 📈 業務價值

### 1. 數據追蹤能力
- **GRN 層級統計**：自動累計每個 GRN 的總重量/數量
- **員工工作量統計**：追蹤每位員工的 GRN 處理數量
- **產品庫存統計**：實時更新產品庫存水平
- **實時數據更新**：每次列印即時更新統計數據

### 2. 運營效率提升
- **自動化統計**：無需手動計算 GRN 統計數據
- **工作量可視化**：清楚了解員工工作分配
- **庫存管理**：自動維護產品庫存記錄
- **數據一致性**：確保統計數據與實際操作同步

### 3. 系統穩定性
- **向後兼容**：不影響現有列印功能
- **容錯設計**：workflow 更新失敗不中斷主流程
- **漸進式增強**：在原有基礎上添加新功能

## 🧪 測試場景

### 重量模式測試
```typescript
// 測試案例：重量模式 GRN 標籤
const testPayload = {
  grnRecord: {
    grn_ref: "12345",
    material_code: "ABC123",
    gross_weight: 100.5,
    net_weight: 85.2,
    // ... 其他欄位
  }
};

// 預期結果：
// grn_level.total_gross += 100.5
// grn_level.total_net += 85.2
// work_level.grn += 1
// stock_level.stock_level += 85 (淨重作為庫存)
```

### 數量模式測試
```typescript
// 測試案例：數量模式 GRN 標籤
const testPayload = {
  palletInfo: {
    product_code: "ABC123",
    product_qty: 50,
    // ... 其他欄位
  }
};

// 預期結果：
// grn_level.total_unit += 50
// work_level.grn += 1
// stock_level.stock_level += 50 (數量作為庫存)
```

### 庫存累加邏輯測試
```sql
-- 第一次列印：新增庫存記錄
INSERT INTO stock_level (stock, description, stock_level) 
VALUES ('ABC123', 'Test Product', 85);

-- 第二次列印：累加更新
UPDATE stock_level 
SET stock_level = stock_level + 95,
    update_time = NOW()
WHERE stock = 'ABC123';

-- 結果：stock_level = 180
```

## 🚀 部署步驟

### 1. 執行 SQL 腳本
```bash
# 在 Supabase 中執行
psql -f scripts/grn-label-enhancement-rpc.sql
```

### 2. 驗證 RPC 函數
```sql
-- 測試 grn_level 更新
SELECT update_grn_level('12345', 'weight', 100.5, 85.2, NULL);

-- 測試 work_level 更新
SELECT update_work_level_grn(5997, 1);

-- 測試 stock_level 更新
SELECT update_stock_level_grn('ABC123', 85, 'Test Product');

-- 測試組合函數
SELECT update_grn_workflow('12345', 'weight', 5997, 'ABC123', 'Test Product', 100.5, 85.2, NULL, 1);
```

### 3. 前端部署
- 更新 `grnActions.ts`
- 更新 `GrnLabelForm.tsx`
- 測試列印流程

## 📋 檢查清單

### 功能驗證
- [ ] 重量模式正確更新 grn_level
- [ ] 數量模式正確更新 grn_level
- [ ] work_level 正確累加員工工作量
- [ ] stock_level 正確更新產品庫存
- [ ] 重量模式使用淨重更新庫存
- [ ] 數量模式使用數量更新庫存
- [ ] 錯誤處理不中斷主流程
- [ ] 警告訊息正確顯示

### 數據完整性
- [ ] GRN 參考號格式驗證
- [ ] 產品代碼外鍵關聯正確
- [ ] 數值累加邏輯正確
- [ ] 時間戳更新正確
- [ ] 外鍵關聯完整

### 用戶體驗
- [ ] 列印流程無感知延遲
- [ ] 錯誤訊息用戶友好
- [ ] 原有功能完全保持
- [ ] 新功能透明運行

## 🎉 總結

GRN Label 工作流程優化成功實現了：

✅ **無縫整合**：在不影響原有列印流程的基礎上添加新功能  
✅ **智能統計**：自動追蹤 GRN 層級、員工層級和產品庫存的數據  
✅ **容錯設計**：workflow 更新失敗不影響核心列印功能  
✅ **模式支援**：同時支援重量模式和數量模式的統計  
✅ **實時更新**：每次列印操作即時更新相關統計數據  
✅ **庫存管理**：自動維護產品庫存水平，支援庫存追蹤  

這次優化為 GRN 管理提供了更完整的數據追蹤能力，包括庫存管理功能，為後續的報表分析、工作量統計和庫存控制奠定了堅實基礎。 