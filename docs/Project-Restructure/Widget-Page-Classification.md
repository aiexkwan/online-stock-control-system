# Widget 頁面分類總覽

## 📊 總體統計

| 頁面 | Widget 數量 | GraphQL 遷移 | Server Actions 保留 | 優先級 |
|------|------------|--------------|-------------------|---------|
| Warehouse | 7 | 7 | 0 | 最高 |
| Injection | 5 | 5 | 0 | 高 |
| Stock | 2 | 2 | 0 | 中 |
| System | 5 | 5 | 0 | 中 |
| Upload | 2 | 1 | 1 | 低 |
| Update | 3 | 0 | 3 | 低 |
| **總計** | **24** | **20** | **4** | - |

## 🏭 Warehouse 頁面 (`/admin/warehouse`)

### 頁面特點
- **核心業務流程**：倉庫日常運作嘅中樞
- **高頻使用**：員工每日最常用頁面
- **實時數據需求**：需要即時反映庫存變化

### Widget 分類

#### 📈 統計類 Widgets (3個)
1. **AwaitLocationQtyWidget**
   - 功能：顯示 Await 位置總數量
   - 數據源：`record_inventory` 表
   - 更新頻率：高（實時）
   - GraphQL 優勢：5秒緩存減少查詢壓力

2. **StillInAwaitWidget**
   - 功能：昨日完成但今日仍在 Await 嘅統計
   - 數據源：`record_history` + `record_inventory`
   - 更新頻率：中（每小時）
   - GraphQL 優勢：複雜 JOIN 查詢優化

3. **StillInAwaitPercentageWidget**
   - 功能：顯示 Await 百分比
   - 數據源：計算結果
   - 更新頻率：中
   - GraphQL 優勢：聚合計算伺服器端完成

#### 📊 圖表類 Widgets (2個)
4. **TransferTimeDistributionWidget**
   - 功能：轉移時間分布圖
   - 數據源：`record_transfer`
   - 更新頻率：高（時間範圍切換頻繁）
   - GraphQL 優勢：局部更新避免閃爍

5. **WarehouseWorkLevelAreaChart**
   - 功能：工作量區域圖
   - 數據源：`work_level`
   - 更新頻率：中
   - GraphQL 優勢：多維度數據靈活查詢

#### 📋 列表類 Widgets (2個)
6. **WarehouseTransferListWidget**
   - 功能：倉庫轉移記錄列表
   - 數據源：`record_transfer` + `data_id`
   - 更新頻率：高
   - GraphQL 優勢：分頁優化

7. **OrderStateListWidgetV2**
   - 功能：訂單狀態追蹤列表
   - 數據源：`data_order`
   - 更新頻率：高
   - GraphQL 優勢：批量狀態查詢

## 💉 Injection 頁面 (`/admin/injection`)

### 頁面特點
- **生產監控**：實時監控生產線狀況
- **數據分析**：多維度生產數據分析
- **管理決策**：為管理層提供決策支援

### Widget 分類

#### 📊 分析類 Widgets (3個)
1. **TopProductsChartWidget**
   - 功能：熱門產品排行
   - 數據源：`record_palletinfo`
   - 更新頻率：中
   - GraphQL 優勢：Top N 查詢優化

2. **ProductDistributionChartWidget**
   - 功能：產品分布圖
   - 數據源：`record_palletinfo` + `data_code`
   - 更新頻率：低
   - GraphQL 優勢：多維度分析

3. **AcoOrderProgressWidget**
   - 功能：ACO 訂單進度
   - 數據源：`record_aco`
   - 更新頻率：高
   - GraphQL 優勢：實時進度更新

#### 📈 統計類 Widgets (1個)
4. **ProductionStatsWidget**
   - 功能：生產統計卡片
   - 數據源：`record_palletinfo`
   - 更新頻率：高
   - GraphQL 優勢：聚合統計

#### 🌳 導航類 Widgets (1個)
5. **HistoryTreeV2**
   - 功能：歷史記錄樹狀導航
   - 數據源：`record_history`
   - 更新頻率：中
   - GraphQL 優勢：遞歸查詢效率

## 📦 Stock 頁面 (`/admin/stock`)

### 頁面特點
- **庫存管理**：全面掌握庫存狀況
- **定期盤點**：支援庫存盤點作業
- **分析報表**：深度庫存分析

### Widget 分類

#### 📊 分析類 Widgets (1個)
1. **InventoryOrderedAnalysisWidget**
   - 功能：庫存訂單深度分析
   - 數據源：`record_inventory` + `data_order`
   - 更新頻率：低
   - GraphQL 優勢：複雜多表關聯

#### 📈 統計類 Widgets (1個)
2. **StatsCardWidget**
   - 功能：庫存關鍵指標卡片組
   - 數據源：多個統計查詢
   - 更新頻率：中
   - GraphQL 優勢：批量查詢優化

## 🖥️ System 頁面 (`/admin/system`)

### 頁面特點
- **系統管理**：各類系統報表
- **數據導出**：支援多格式導出
- **管理工具**：系統管理功能

### Widget 分類

#### 📄 報表類 Widgets (5個)
1. **ReportGeneratorWithDialogWidgetV2**
   - 功能：通用報表生成器
   - 數據源：動態
   - 更新頻率：低
   - GraphQL 優勢：動態查詢構建

2. **AcoOrderReportWidgetV2**
   - 功能：ACO 訂單報表
   - 數據源：`record_aco`
   - 更新頻率：低
   - GraphQL 優勢：複雜報表查詢

3. **TransactionReportWidget**
   - 功能：交易記錄報表
   - 數據源：`record_history`
   - 更新頻率：低
   - GraphQL 優勢：時間範圍優化

4. **GrnReportWidgetV2**
   - 功能：GRN 收貨報表
   - 數據源：`record_grn`
   - 更新頻率：低
   - GraphQL 優勢：多表關聯

5. **ReprintLabelWidget**
   - 功能：標籤重印
   - 數據源：`record_palletinfo`
   - 更新頻率：低
   - GraphQL 優勢：批量查詢

## 📤 Upload 頁面 (`/admin/upload`)

### 頁面特點
- **文件管理**：訂單文件上傳管理
- **歷史記錄**：上傳歷史查詢
- **批量處理**：支援批量操作

### Widget 分類

#### 📁 文件類 Widgets (2個)
1. **UploadOrdersWidgetV2** ⚠️ **保持 Server Actions**
   - 功能：訂單文件上傳
   - 原因：文件上傳不適合 GraphQL
   - 技術：繼續使用 Server Actions

2. **OtherFilesListWidgetV2** ✅ **遷移到 GraphQL**
   - 功能：其他文件列表
   - 數據源：`doc_upload`
   - 更新頻率：低
   - GraphQL 優勢：分頁查詢

## 🔄 Update 頁面 (`/admin/update`)

### 頁面特點
- **數據維護**：基礎數據更新
- **CRUD 操作**：簡單增刪改查
- **低頻使用**：管理員偶爾使用

### Widget 分類

#### ✏️ 編輯類 Widgets (3個) - **全部保持 Server Actions**
1. **VoidPalletWidget**
   - 功能：作廢棧板
   - 原因：純寫入操作
   - 技術：Server Actions 更適合

2. **SupplierUpdateWidgetV2**
   - 功能：供應商資料更新
   - 原因：簡單 CRUD
   - 技術：Server Actions 足夠

3. **ProductUpdateWidget**
   - 功能：產品資料更新
   - 原因：簡單 CRUD
   - 技術：Server Actions 足夠

## 🎯 遷移策略總結

### 按 Widget 類型分組
1. **統計類** (6個) - 全部遷移到 GraphQL
2. **圖表類** (5個) - 全部遷移到 GraphQL
3. **列表類** (3個) - 全部遷移到 GraphQL
4. **報表類** (5個) - 全部遷移到 GraphQL
5. **分析類** (1個) - 全部遷移到 GraphQL
6. **文件類** (1個遷移，1個保留)
7. **編輯類** (3個) - 全部保持 Server Actions

### 技術決策原則
- ✅ **適合 GraphQL**：讀取、查詢、分析、報表
- ❌ **保持 Server Actions**：寫入、文件上傳、簡單 CRUD

---

*此分類文檔用於指導 GraphQL 遷移工作，確保每個 widget 都有明確嘅技術方向。*