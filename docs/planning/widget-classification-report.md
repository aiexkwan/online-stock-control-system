# Widget 分類系統調查報告

**調查日期**: 2025-07-21  
**調查範圍**: 系統所有 Widget 分類與架構  
**文檔版本**: v1.5  
**最後更新**: 2025-07-21 - 補充遺漏的 /admin/analytics 路由文檔

## 🎯 調查摘要

本報告詳細分析了 NewPennine 倉庫管理系統中的 Widget 分類架構，涵蓋 45 個 Widget 組件，分布於 9 個主要分類中。系統採用統一的 Widget 管理架構，支援路由預加載、優先級管理、緩存策略和性能優化。

**🔄 最新更新 (2025-07-21)**:  
- 已完成 HistoryTree → HistoryTreeV2 統一遷移，移除重複配置和重定向  
- 移除 ProductUpdateWidget 舊版本，統一使用 ProductUpdateWidgetV2  
- 移除 StockDistributionChart 舊版本，統一使用 StockDistributionChartV2  
- ✅ **GraphQL → REST API 完全遷移完成**，所有 Widget 現使用統一的 REST API 架構
- 系統一致性和代碼清潔度進一步提升

## 📊 系統概覽統計

- **總 Widget 數量**: 45個 (移除 2 個廢棄組件)
- **分類類型**: 9個
- **架構模式**: REST API + Server Actions + Mixed Strategy
- **支援功能**: REST API、實時更新、緩存、懶加載

## 🗂️ Widget 分類系統架構

### 主要分類類型

| 分類 | 英文名稱 | 用途描述 | Widget 數量 |
|------|----------|----------|-------------|
| 核心組件 | core | 系統核心功能組件 | 2個 |
| 統計卡片 | stats | 數據統計展示 | 6個 |
| 圖表類 | charts | 數據視覺化圖表 | 7個 |
| 列表類 | lists | 數據列表展示 | 5個 |
| 操作類 | operations | 用戶操作介面 | 8個 |
| 分析類 | analysis | 數據分析工具 | 4個 |
| 報表類 | reports | 報表生成與展示 | 6個 |
| 特殊類 | special | 特殊功能組件 | 8個 |

## 📋 詳細 Widget 清單

### 🌟 Core (核心組件) - 1個
- **HistoryTreeV2** - 增強版系統歷史樹狀圖 ⭐ 高優先級 (Priority: 10)
  - 路徑: `app/admin/components/dashboard/widgets/HistoryTreeV2.tsx`
  - 數據源: `record_history`
  - 刷新間隔: 30秒
  - 支援: 過濾器、日期範圍、緩存
  - 狀態: ✅ 現役版本 (已取代 HistoryTree)
  - 特性: Progressive Loading、REST API、事件合併、動畫效果

### 📊 Stats (統計卡片類) - 6個
- **AwaitLocationQty** - 等待分配位置數量
  - 路徑: `app/admin/components/dashboard/widgets/AwaitLocationQtyWidget.tsx`
  - 數據源: `record_palletinfo`
  - 刷新間隔: 5秒
  - 支援: 實時更新
- **YesterdayTransferCount** - 昨日轉移數量
  - 路徑: `app/admin/components/dashboard/widgets/YesterdayTransferCountWidget.tsx`
  - 數據源: `record_transfer`
  - 刷新間隔: 60秒
  - 支援: 緩存
- **StillInAwait** - 仍在等待項目
  - 路徑: `app/admin/components/dashboard/widgets/StillInAwaitWidget.tsx`
  - 數據源: `record_palletinfo`
  - 刷新間隔: 10秒
  - 支援: 實時更新
- **StillInAwaitPercentage** - 仍在等待百分比
  - 路徑: `app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget.tsx`
  - 數據源: `record_palletinfo`
  - 刷新間隔: 10秒
  - 支援: 實時更新
- **StatsCard** - 通用統計卡片
  - 路徑: `app/admin/components/dashboard/widgets/StatsCardWidget.tsx`
  - 刷新間隔: 30秒
  - 支援: 緩存
- **InjectionProductionStats** - 注塑生產統計
  - 路徑: `app/admin/components/dashboard/widgets/InjectionProductionStatsWidget.tsx`
  - 架構: REST API 優化版本

### 📈 Charts (圖表類) - 7個
- **StockDistributionChartV2** - 庫存分布圖表 (統一版本)
  - 路徑: `app/admin/components/dashboard/widgets/StockDistributionChartV2.tsx`
  - 數據源: `record_inventory` 通過統一 widgetAPI
  - 架構: React Query + REST API
  - 刷新間隔: 30秒
  - 狀態: ✅ 現役版本 (已取代 StockDistributionChart)
  - 特性: 智能緩存、自動重試、背景更新、統一錯誤處理
  - 支援: 日期範圍、庫存類型過濾、響應式設計
- **StockLevelHistoryChart** - 庫存水平歷史圖表 (線圖)
  - 路徑: `app/admin/components/dashboard/widgets/StockLevelHistoryChart.tsx`
  - 數據源: `record_inventory`
  - 刷新間隔: 60秒
  - 支援: 日期範圍
- **WarehouseWorkLevelAreaChart** - 倉庫工作水平區域圖 (區域圖)
  - 路徑: `app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart.tsx`
  - 數據源: `work_level`
  - 刷新間隔: 30秒
  - 支援: 日期範圍
- **TransferTimeDistribution** - 轉移時間分布 (直方圖)
  - 路徑: `app/admin/components/dashboard/widgets/TransferTimeDistributionWidget.tsx`
  - 數據源: `record_transfer`
  - 刷新間隔: 60秒
  - 支援: 日期範圍
- **ProductDistributionChart** - 產品分布圖表 (條形圖)
  - 路徑: `app/admin/components/dashboard/widgets/ProductDistributionChartWidget.tsx`
  - 數據源: `data_code`
  - 刷新間隔: 120秒
  - 支援: 日期範圍
- **TopProductsByQuantity** - 按數量排序熱門產品 (條形圖)
  - 路徑: `app/admin/components/dashboard/widgets/TopProductsByQuantityWidget.tsx`
  - 數據源: `record_inventory`
  - 刷新間隔: 60秒
  - 支援: 日期範圍
- **TopProductsDistribution** - 熱門產品分布 (甜甜圈圖)
  - 路徑: `app/admin/components/dashboard/widgets/TopProductsDistributionWidget.tsx`
  - 數據源: `record_inventory`
  - 刷新間隔: 60秒
  - 支援: 日期範圍

### 📋 Lists (列表類) - 5個
- **OrdersListV2** - 增強版訂單列表
  - 路徑: `app/admin/components/dashboard/widgets/OrdersListWidgetV2.tsx`
  - 數據源: `data_order`
  - 刷新間隔: 30秒
  - 支援: 過濾器、日期範圍
- **OtherFilesListV2** - 增強版其他文件列表
  - 路徑: `app/admin/components/dashboard/widgets/OtherFilesListWidgetV2.tsx`
  - 刷新間隔: 60秒
  - 支援: 過濾器
- **WarehouseTransferList** - 倉庫轉移列表
  - 路徑: `app/admin/components/dashboard/widgets/WarehouseTransferListWidget.tsx`
  - 數據源: `record_transfer`
  - 刷新間隔: 15秒
  - 支援: 過濾器、日期範圍、實時更新
- **OrderStateListV2** - 增強版訂單狀態列表
  - 路徑: `app/admin/components/dashboard/widgets/OrderStateListWidgetV2.tsx`
  - 數據源: `data_order`
  - 刷新間隔: 30秒
  - 支援: 過濾器、日期範圍
- **ProductionDetails** - 生產詳情
  - 路徑: `app/admin/components/dashboard/widgets/ProductionDetailsWidget.tsx`
  - 架構: Server Action
  - 用途: 顯示生產相關數據

### ⚙️ Operations (操作類) - 8個
- **VoidPallet** - 廢棄棧板
  - 路徑: `app/admin/components/dashboard/widgets/VoidPalletWidget.tsx`
  - 數據源: `record_palletinfo`
  - 架構: Mixed (讀: REST API, 寫: Server Actions)
  - 權限: 需要認證
- **ProductUpdateV2** - 產品更新管理 (統一版本)
  - 路徑: `app/admin/components/dashboard/widgets/ProductUpdateWidgetV2.tsx`
  - 數據源: `data_code`
  - 架構: Server Actions
  - 權限: 需要認證
  - 狀態: ✅ 現役版本 (已取代 ProductUpdateWidget)
  - 功能: 完整 CRUD 操作、表單驗證、狀態反饋、設計系統整合
- **SupplierUpdateV2** - 增強版供應商更新
  - 路徑: `app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2.tsx`
  - 數據源: `data_supplier`
  - 架構: Mixed (讀: REST API, 寫: Server Actions)
  - 權限: 需要認證
- **ReprintLabel** - 重印標籤
  - 路徑: `app/admin/components/dashboard/widgets/ReprintLabelWidget.tsx`
  - 架構: Mixed
  - 權限: 需要認證
- **UploadOrdersV2** - 增強版上傳訂單
  - 路徑: `app/admin/components/dashboard/widgets/UploadOrdersWidgetV2.tsx`
  - 架構: Server Actions
  - 權限: 需要認證
- **UploadFiles** - 上傳文件
  - 路徑: `app/admin/components/dashboard/widgets/UploadFilesWidget.tsx`
  - 架構: Server Actions
  - 權限: 需要認證
- **UploadPhoto** - 上傳照片
  - 路徑: `app/admin/components/dashboard/widgets/UploadPhotoWidget.tsx`
  - 架構: Server Actions
  - 權限: 需要認證
- **UploadProductSpec** - 上傳產品規格
  - 路徑: `app/admin/components/dashboard/widgets/UploadProductSpecWidget.tsx`
  - 架構: Server Actions
  - 權限: 需要認證

### 🔍 Analysis (分析類) - 4個
- **AnalysisExpandableCards** - 可擴展分析卡片
  - 路徑: `app/admin/components/dashboard/widgets/AnalysisExpandableCards.tsx`
  - 刷新間隔: 120秒
  - 支援: 日期範圍
- **AnalysisPagedV2** - 增強版分頁分析
  - 路徑: `app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2.tsx`
  - 架構: REST API
- **InventoryOrderedAnalysis** - 已訂購庫存分析
  - 路徑: `app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget.tsx`
  - 數據源: `record_inventory`
  - 刷新間隔: 60秒
  - 支援: 日期範圍
- **StockTypeSelector** - 庫存類型選擇器
  - 路徑: `app/admin/components/dashboard/widgets/StockTypeSelector.tsx`
  - 架構: REST API
  - 狀態: 已遷移

### 📊 Reports (報表類) - 6個
- **ReportGeneratorWithDialogV2** - 增強版報表生成器
  - 路徑: `app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2.tsx`
  - 權限: 需要認證
  - 支援: 多種報表類型
- **TransactionReport** - 交易報表
  - 路徑: `app/admin/components/dashboard/widgets/TransactionReportWidget.tsx`
  - 數據源: `record_history`
  - 架構: Server Actions
  - 權限: 需要認證
  - 支援: 日期範圍
- **GrnReportV2** - 增強版貨品收取報表
  - 路徑: `app/admin/components/dashboard/widgets/GrnReportWidgetV2.tsx`
  - 架構: Mixed (使用 DashboardAPI)
  - 狀態: 已遷移
- **AcoOrderReportV2** - 增強版 ACO 訂單報表
  - 路徑: `app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2.tsx`
  - 架構: REST API
- **AcoOrderProgress** - ACO 訂單進度
  - 路徑: `app/admin/components/dashboard/widgets/AcoOrderProgressWidget.tsx`
  - 架構: Mixed (使用 useUnifiedAPI)
- **OrderAnalysisResultDialog** - 訂單分析結果對話框
  - 路徑: `app/admin/components/dashboard/widgets/OrderAnalysisResultDialog.tsx`
  - 架構: Server Actions
  - 用途: AI 分析結果顯示

### 🎯 Special (特殊類) - 8個
- **StaffWorkload** - 員工工作量
  - 路徑: `app/admin/components/dashboard/widgets/StaffWorkloadWidget.tsx`
  - 架構: Server Actions
- **PerformanceTest** - 性能測試組件
  - 路徑: `app/admin/components/dashboard/widgets/PerformanceTestWidget.tsx`
- **DepartmentSelector** - 部門選擇器
  - 路徑: `app/admin/components/dashboard/widgets/DepartmentSelectorWidget.tsx`
- **GoogleDriveUploadToast** - Google Drive 上傳提示
  - 路徑: `app/admin/components/dashboard/widgets/GoogleDriveUploadToast.tsx`
- **AvailableSoon** - 即將推出功能
  - 路徑: `app/admin/components/dashboard/widgets/AvailableSoonWidget.tsx`
- **UnifiedChart** - 統一圖表組件
  - 路徑: `app/admin/components/dashboard/widgets/UnifiedChartWidget.tsx`
  - 支援: 錯誤邊界版本 `UnifiedChartWidgetWithErrorBoundary.tsx`
- **UnifiedStats** - 統一統計組件
  - 路徑: `app/admin/components/dashboard/widgets/UnifiedStatsWidget.tsx`
  - 支援: 錯誤邊界版本 `UnifiedStatsWidgetWithErrorBoundary.tsx`
- **UnifiedTable** - 統一表格組件
  - 路徑: `app/admin/components/dashboard/widgets/UnifiedTableWidget.tsx`
  - 支援: 錯誤邊界版本 `UnifiedTableWidgetWithErrorBoundary.tsx`

## 🏗️ 技術架構分析

### 數據模式分類
根據 `widget-data-classification.ts` 分析：

| 數據模式 | 數量 | 技術架構 | 說明 |
|----------|------|----------|------|
| **Read-Only** | 22個 | REST API + 批量查詢 | 只讀數據展示，性能優化 |
| **Write-Only** | 6個 | Server Actions | 純寫入操作，安全性優先 |
| **Read-Write** | 3個 | Mixed Strategy | 混合模式，讀寫分離 |
| **Reports** | 17個 | Mixed/Server Actions | 報表生成，複雜邏輯 |

### 技術策略分布
- **REST API**: 25個 Widget (主要用於讀取操作)
- **Server Actions**: 15個 Widget (主要用於寫入操作)
- **Mixed Strategy**: 8個 Widget (複雜讀寫邏輯)

### 性能配置
- **預加載優先級**: 1-10級 (10最高)
- **懶加載**: 大部分 Widget 支援
- **緩存策略**: aggressive, normal, minimal
- **實時更新**: 關鍵業務 Widget 支援

## 🗺️ 路由預加載映射

| 路由 | 預加載 Widget | 用途 |
|------|---------------|------|
| `/admin/warehouse` | AwaitLocationQty, WarehouseTransferList, StockDistributionChartV2, StillInAwait | 倉庫管理 |
| `/admin/injection` | HistoryTreeV2, StatsCard, ProductDistributionChart | 注塑管理 |
| `/admin/pipeline` | WarehouseWorkLevelAreaChart, OrdersList, OrderStateList | 流水線管理 |
| `/admin/upload` | UploadOrders, UploadFiles, OrdersList, OtherFilesList | 上傳管理 |
| `/admin/update` | ProductUpdate, SupplierUpdate, VoidPallet | 更新操作 |
| `/admin/stock-management` | StockDistributionChartV2, StockLevelHistory, InventoryAnalysis | 庫存管理 |
| `/admin/system` | ReportGenerator, ReprintLabel, TransactionReport | 系統管理 |
| `/admin/analysis` | HistoryTreeV2, AnalysisExpandableCards | 數據分析 |
| `/admin/analytics` | UnifiedAnalyticsDashboard, UnifiedStatsWidget (9個), HistoryTreeV2, PerformanceMetrics | 綜合分析中心 |

🏭 /admin/operations-monitoring (10個 Widgets)

  佈局: 10x7 網格，右側固定 HistoryTree

  | Widget | 組件名稱                     | 功能描述                             | 網格位置           |
  |--------|--------------------------|----------------------------------|----------------|
  | 1      | HistoryTreeV2            | 系統歷史樹狀圖                          | widget1 (右側固定) |
  | 2      | UnifiedStatsWidget       | Primary Metric - 主要指標            | widget2        |
  | 3      | UnifiedStatsWidget       | Secondary Metric - 次要指標          | widget3        |
  | 4      | DepartmentSelectorWidget | 部門選擇器                            | widget4        |
  | 5      | UnifiedStatsWidget       | Tertiary Metric - 第三指標           | widget5        |
  | 6      | UnifiedChartWidget       | Performance Chart - 性能圖表 (條形圖)   | widget6        |
  | 7      | UnifiedChartWidget       | Distribution Chart - 分布圖表 (甜甜圈圖) | widget7        |
  | 8      | AvailableSoonWidget      | Coming Soon - 即將推出功能             | widget8        |
  | 9      | UnifiedTableWidget       | Operations Details - 營運詳情表格      | widget9        |
  | 10     | UnifiedChartWidget       | Staff Workload - 員工工作量 (線圖)      | widget10       |

  ---
  📊 /admin/data-management (8個 Widgets)

  佈局: 8x5 網格，右側固定 HistoryTree

  | Widget | 組件名稱                   | 功能描述                          | 網格位置            |
  |--------|------------------------|-------------------------------|-----------------|
  | 1      | HistoryTreeV2          | 系統歷史樹狀圖                       | history-tree    |
  | 2      | OrdersListWidgetV2     | Order Upload History - 訂單上傳歷史 | upload-history  |
  | 3      | OtherFilesListWidgetV2 | File Upload History - 文件上傳歷史  | file-history    |
  | 4      | UnifiedUploadWidget    | Upload Center - 統一上傳中心        | upload-actions  |
  | 5      | ProductUpdateWidgetV2  | Product Management - 產品管理     | product-update  |
  | 6      | SupplierUpdateWidgetV2 | Supplier Management - 供應商管理   | supplier-update |
  | 7      | VoidPalletWidget       | Pallet Management - 廢棄棧板管理    | void-pallet     |
  | 8      | UnifiedStatsWidget     | Upload Statistics - 上傳統計      | upload-stats    |
  | 9      | UnifiedStatsWidget     | Update Statistics - 更新統計      | statistics      |

  ---
  📈 /admin/analytics (12個 Widgets)

  佈局: 8x6 網格，右側固定 HistoryTree，最大網格配置

  | Widget | 組件名稱                    | 功能描述                                | 網格位置                |
  |--------|-------------------------|-------------------------------------|---------------------|
  | 1      | HistoryTreeV2           | 系統歷史樹狀圖                             | history-tree        |
  | 2      | AnalysisExpandableCards | Comprehensive Analytics Dashboard   | analysis-dashboard  |
  | 3      | UnifiedStatsWidget      | Production Overview - 生產總覽          | stats1              |
  | 4      | UnifiedStatsWidget      | Inventory Status - 庫存狀態             | stats2              |
  | 5      | UnifiedStatsWidget      | Transfer Activity - 轉移活動            | stats3              |
  | 6      | UnifiedStatsWidget      | Quality Metrics - 質量指標              | stats4              |
  | 7      | UnifiedStatsWidget      | Efficiency Score - 效率分數             | stats5              |
  | 8      | UnifiedStatsWidget      | User Activity - 用戶活動                | stats6              |
  | 9      | UnifiedChartWidget      | Trend Analysis - 趨勢分析 (線圖)          | stats7              |
  | 10     | UnifiedChartWidget      | Distribution Analysis - 分布分析 (甜甜圈圖) | stats8              |
  | 11     | UnifiedChartWidget      | Predictive Analytics - 預測分析 (區域圖)   | stats9              |
  | 12     | UnifiedStatsWidget      | Performance Metrics - 性能指標          | performance-metrics |
  | 13     | UnifiedStatsWidget      | System Health - 系統健康                | system-health       |


## 📊 統一組件系統功能詳解

### 🔧 UnifiedStatsWidget - 統一統計組件

**核心功能**:
- **動態數據源**: 支援多種數據源 (`record_palletinfo`, `record_inventory`, `system_status` 等)
- **智能格式化**: 自動處理百分比、大數值 (K/M)、布林值顯示
- **動態圖標**: 根據標題內容自動選擇合適圖標 (Box, TrendingUp, AlertTriangle, CheckCircle)
- **多指標支援**: 配置 `metrics` 數組，支援主要指標和附加指標
- **錯誤處理**: 完善的載入、錯誤、無數據狀態處理
- **性能優化**: REST API 整合，包含性能追蹤指標

**配置示例**:
```typescript
{
  type: 'stats',
  title: 'Production Overview',
  dataSource: 'record_palletinfo',
  metrics: ['total_products', 'today_production'],
  component: 'UnifiedStatsWidget'
}
```

**支援的數據格式**:
- 數值類型: 自動格式化為 K/M 單位
- 百分比: 標題包含 '%' 或 'Percentage' 時自動轉換
- 布林值: 顯示為 Yes/No
- 字符串: 直接顯示

---

### 📊 UnifiedChartWidget - 統一圖表組件

**支援圖表類型**:
- **bar**: 條形圖 - 適用於類別比較
- **line**: 線圖 - 適用於趨勢分析
- **donut**: 甜甜圈圖 - 適用於比例顯示
- **pie**: 餅圖 - 適用於部分與整體關係
- **area**: 區域圖 - 適用於面積趨勢

**核心功能**:
- **動態數據處理**: 自動適配 `labels` 和 `values` 數組
- **顏色自動配置**: 支援自定義顏色和預設調色板
- **響應式設計**: 使用 ResponsiveContainer 確保適應性
- **交互功能**: 內建 Tooltip、Legend、動畫效果
- **Recharts 整合**: 優化的 bundle size，按需載入

**配置示例**:
```typescript
{
  type: 'chart',
  title: 'Distribution Analysis',
  dataSource: 'distribution_analysis',
  chartType: 'donut',
  component: 'UnifiedChartWidget'
}
```

**數據格式要求**:
```javascript
// API 回應格式
{
  labels: ['Category A', 'Category B', 'Category C'],
  values: [100, 200, 150],
  colors: ['#3B82F6', '#10B981', '#F59E0B'],
  borderColors: ['#1E40AF', '#065F46', '#D97706']
}
```

---

### 📋 UnifiedTableWidget - 統一表格組件

**核心功能**:
- **動態列生成**: 自動從數據物件生成表格列
- **智能渲染**: 自動處理不同數據類型 (數值、日期、布林、字符串)
- **數據格式支援**: 支援 Array, `{items: []}`, `{rows: []}` 格式
- **分頁功能**: 內建分頁，預設每頁 10 條記錄
- **長文本處理**: 超過 50 字符自動截斷顯示 "..."
- **空狀態處理**: 優雅的載入、錯誤、無數據狀態

**配置示例**:
```typescript
{
  type: 'table',
  title: 'Operations Details',
  dataSource: 'unified_operations',
  component: 'UnifiedTableWidget',
  description: 'Detailed operational data table'
}
```

**支援的數據渲染**:
- **數值**: 大數值顯示 K/M 格式
- **日期**: 自動識別時間戳並格式化
- **布林**: 顯示為 Yes/No
- **長字符串**: 自動截斷並添加省略號
- **空值**: 顯示為 "-"

**動態列配置**:
- 列標題自動從 key 生成 (首字母大寫，下劃線轉空格)
- 支援自定義列配置通過 `config.columns`
- 自動檢測數據類型並應用適當渲染邏輯

---

## 📊 Analytics vs Analysis 功能區別

### `/admin/analytics` - 綜合分析中心
- **定位**: 企業級分析儀表板，統一分析主題
- **特色**: 
  - 專用 6x8 網格佈局，包含 12 個統一組件實例
  - 大型綜合分析儀表板 (Comprehensive Analytics Dashboard)
  - 實時性能監控 (Performance Metrics) 和系統健康狀況
  - 統一組件系統 (UnifiedStatsWidget × 8, UnifiedChartWidget × 3)
- **主要組件**: 
  - Production Overview, Inventory Status, Transfer Activity
  - Quality Metrics, Efficiency Score, User Activity
  - Trend Analysis, Distribution Analysis, Predictive Analytics

### Analysis Widget - 嵌入式分析工具  
- **定位**: 可嵌入其他主題的分析組件
- **特色**:
  - `AnalysisExpandableCards` - 可展開分析卡片
  - `AnalysisPagedWidgetV2` - 分頁式分析數據
  - 作為輔助分析工具，整合到各主題中
- **用途**: 為特定業務場景提供針對性分析

---

## 🔧 統一組件系統優勢

### 架構統一
- **一致的 API**: 所有統一組件使用相同的 `useDashboardConcurrentQuery`
- **標準化配置**: 通過 `AdminWidgetConfig` 統一配置管理
- **錯誤處理**: 統一的載入、錯誤、無數據狀態處理

### 性能優化
- **REST API 整合**: 全面使用 REST API 替代 GraphQL
- **智能緩存**: 內建查詢緩存和背景更新
- **按需載入**: 優化的 bundle size 和懶載入

### 開發效率
- **快速配置**: 通過 JSON 配置快速創建新 Widget
- **類型安全**: 完整的 TypeScript 支援
- **可擴展性**: 易於添加新圖表類型和數據源

## 🔧 系統特性

### 支援功能
- ✅ REST API 完全遷移 (所有 Widget)
- ✅ 實時更新 (Supabase Realtime)
- ✅ 緩存策略 (多級緩存)
- ✅ 懶加載 (性能優化)
- ✅ 路由預加載 (用戶體驗)
- ✅ 權限控制 (角色基礎)
- ✅ 批量數據處理
- ✅ 過濾器 (用戶自定義)
- ✅ 日期範圍 (時間維度)
- ✅ 錯誤邊界 (系統穩定性)

### 架構優勢
1. **統一管理**: 所有 Widget 通過統一配置管理
2. **性能優化**: 智能預加載和緩存策略
3. **擴展性**: 模組化設計，易於添加新 Widget
4. **維護性**: 清晰的分類和文檔
5. **用戶體驗**: 響應式設計和實時更新

## 📈 統計摘要

### 分類分布
```
操作類 (Operations): 8個 (17.8%)
圖表類 (Charts): 7個 (15.6%)
特殊類 (Special): 8個 (17.8%)
統計類 (Stats): 6個 (13.3%)
報表類 (Reports): 6個 (13.3%)
列表類 (Lists): 5個 (11.1%)
分析類 (Analysis): 4個 (8.9%)
核心類 (Core): 1個 (2.2%)
```

### 技術架構分布
```
REST API: 25個 (54.3%)
Server Actions: 14個 (30.4%)  
Mixed Strategy: 7個 (15.2%)
```

## 🎯 建議與優化方向

### 短期優化
1. **性能監控**: 建立 Widget 性能追蹤系統
2. **錯誤處理**: 完善 Widget 錯誤邊界機制
3. **用戶體驗**: 優化 Widget 加載速度

### 中期規劃
1. **API 優化**: REST API 性能提升與批量請求
2. **實時功能**: 擴展實時更新範圍
3. **緩存優化**: 智能緩存策略升級

### 長期發展
1. **AI 整合**: Widget 智能推薦系統
2. **自定義化**: 用戶自定義 Widget 功能
3. **微前端**: Widget 微前端架構

## 📁 Widget 路徑快速索引

### 按字母順序排列 (總計: 45個)
```
AcoOrderProgressWidget.tsx
AcoOrderReportWidget.tsx
AcoOrderReportWidgetV2.tsx
AnalysisExpandableCards.tsx
AnalysisPagedWidgetV2.tsx
AvailableSoonWidget.tsx
AwaitLocationQtyWidget.tsx
DepartmentSelectorWidget.tsx
GoogleDriveUploadToast.tsx
GrnReportWidget.tsx
GrnReportWidgetV2.tsx
HistoryTreeV2.tsx                    ⭐ 核心組件，現役版本
InjectionProductionStatsWidget.tsx
InventoryOrderedAnalysisWidget.tsx
OrderAnalysisResultDialog.tsx
OrderStateListWidgetV2.tsx
OrdersListWidgetV2.tsx
OtherFilesListWidgetV2.tsx
PerformanceTestWidget.tsx
ProductDistributionChartWidget.tsx
ProductUpdateWidgetV2.tsx
ProductionDetailsWidget.tsx
ProductionStatsWidget.tsx
ReportGeneratorWithDialogWidgetV2.tsx
ReprintLabelWidget.tsx
StaffWorkloadWidget.tsx
StatsCardWidget.tsx
StillInAwaitPercentageWidget.tsx
StillInAwaitWidget.tsx
StockDistributionChartV2.tsx
StockLevelHistoryChart.tsx
StockTypeSelector.tsx
SupplierUpdateWidgetV2.tsx
TopProductsByQuantityWidget.tsx
TopProductsDistributionWidget.tsx
TransactionReportWidget.tsx
TransferTimeDistributionWidget.tsx
UnifiedChartWidget.tsx (+ ErrorBoundary版本)
UnifiedStatsWidget.tsx (+ ErrorBoundary版本)
UnifiedTableWidget.tsx (+ ErrorBoundary版本)
UploadFilesWidget.tsx
UploadOrdersWidgetV2.tsx
UploadPhotoWidget.tsx
UploadProductSpecWidget.tsx
VoidPalletWidget.tsx
WarehouseTransferListWidget.tsx
WarehouseWorkLevelAreaChart.tsx
YesterdayTransferCountWidget.tsx

🗑️ 已移除組件:  
- HistoryTree (重定向已清理，統一使用 HistoryTreeV2)  
- ProductUpdateWidget (已廢棄，統一使用 ProductUpdateWidgetV2)  
- StockDistributionChart (已廢棄，統一使用 StockDistributionChartV2)
```

### 通用組件路徑
```
app/admin/components/dashboard/widgets/common/
├── WidgetStates.tsx
├── charts/
│   ├── ChartContainer.tsx
│   └── ChartSkeleton.tsx
├── data-display/
│   ├── DataTable.tsx
│   └── MetricCard.tsx
└── filters/
    └── DateRangeFilter.tsx

app/admin/components/dashboard/widgets/__tests__/
└── unified/
    ├── UnifiedChartWidget.test.tsx
    ├── UnifiedStatsWidget.test.tsx
    ├── UnifiedTableWidget.test.tsx
    └── test-utils.tsx

lib/widgets/
└── error-boundary-wrapper.tsx
```

---

**報告生成**: Claude Code v4.0 (專家討論系統版)  
**最後更新**: 2025-07-21 (v1.4)  
**文檔路徑**: `docs/planning/widget-classification-report.md`  
**相關歷史**: `docs/HistoryRecord/Removal/` (詳細移除記錄)  
**更新紀錄**:  
- v1.0 (2025-07-21): 初始報告，涵蓋 47 個 Widget  
- v1.1 (2025-07-21): 移除 ProductUpdateWidget，更新至 46 個 Widget
- v1.2 (2025-07-21): 移除未實現的 PNG/PDF 匯出功能描述，反映實際系統能力
- v1.3 (2025-07-21): 更新 API 架構描述，確認 GraphQL → REST API 完全遷移
- v1.4 (2025-07-21): 移除 StockDistributionChart，統一使用 V2，更新至 45 個 Widget
- v1.5 (2025-07-21): 補充遺漏的 /admin/analytics 路由，添加 Analytics vs Analysis 功能區別說明