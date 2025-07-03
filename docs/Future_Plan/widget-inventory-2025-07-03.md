# Widget 系統盤點報告

**盤點日期**: 2025-07-03  
**Widget 總數**: 57 個組件  
**GraphQL 集成**: 14 個 (24.6%)

## 📊 按主題分類統計

| 主題 | Widget 數量 | 主要功能 |
|------|------------|----------|
| **注入 (Injection)** | 10 | 生產監控、歷史記錄 |
| **管道 (Pipeline)** | 10 | 類似注入，不同數據源 |
| **倉庫 (Warehouse)** | 10 | 庫存監控、轉移追蹤 |
| **上傳 (Upload)** | 6 | 文件上傳管理 |
| **更新 (Update)** | 6 | 產品/供應商更新 |
| **庫存管理 (Stock-Management)** | 6 | 庫存分析圖表 |
| **系統 (System)** | 10 | 報表生成、標籤打印 |
| **分析 (Analysis)** | 3 | 數據分析儀表板 |
| **未使用** | 15+ | 獨立組件 |

## 🗂️ Widget 功能分類

### 1. 統計卡片類 (Stats) - 15個
```
- StatsCardWidget (通用)
- AwaitLocationQtyWidget
- YesterdayTransferCountWidget
- StillInAwaitWidget
- StillInAwaitPercentageWidget
- BookedOutStatsWidgetGraphQL ✅
- OutputStatsWidgetGraphQL ✅
- ProductionStatsGraphQL ✅
- 等待類 widgets...
```

### 2. 圖表類 (Charts) - 12個
```
- ProductMixChartWidget
- StockDistributionChart
- WarehouseWorkLevelAreaChart
- TransferTimeDistributionWidget
- StockLevelHistoryChart
- ProductDistributionChartGraphQL ✅
- TopProductsChartGraphQL ✅
- StaffWorkloadGraphQL ✅
- 各種分析圖表...
```

### 3. 列表類 (Lists) - 10個
```
- OrdersListWidget / OrdersListGraphQL ✅
- OtherFilesListWidget / OtherFilesListGraphQL ✅
- WarehouseTransferListWidget / WarehouseTransferListWidgetGraphQL ✅
- OrderStateListWidget
- ProductionDetailsGraphQL ✅
- 各種數據列表...
```

### 4. 操作類 (Operations) - 10個
```
- VoidPalletWidget
- ProductUpdateWidget
- SupplierUpdateWidget
- ReprintLabelWidget
- StockTypeSelector
- QuickActionsWidget
- 各種操作面板...
```

### 5. 上傳類 (Uploads) - 6個
```
- UploadOrdersWidget
- UploadFilesWidget
- UploadPhotoWidget
- UploadProductSpecWidget
- 文件管理相關...
```

### 6. 報表類 (Reports) - 8個
```
- ReportGeneratorWidget
- ReportGeneratorWithDialogWidget
- TransactionReportWidget
- GrnReportWidget
- AcoOrderReportWidget
- ReportsWidget
- 各種報表生成器...
```

### 7. 特殊用途類 (Special) - 6個
```
- HistoryTree (歷史樹)
- Folder3D (3D 文件夾效果)
- AnalysisExpandableCards (可展開分析卡片)
- AnalyticsDashboardWidget (分析儀表板)
- InventorySearchWidget (庫存搜索)
- EmptyPlaceholderWidget (空白佔位)
```

## 📈 GraphQL 集成狀態

### 已集成 GraphQL 的 Widgets (14個)
| Widget 名稱 | 對應非 GraphQL 版本 | 使用情況 |
|------------|-------------------|----------|
| BookedOutStatsWidgetGraphQL | - | 獨立使用 |
| OrdersListGraphQL | OrdersListWidget | 可選替換 |
| OtherFilesListGraphQL | OtherFilesListWidget | 可選替換 |
| OutputStatsWidgetGraphQL | - | 獨立使用 |
| ProductDistributionChartGraphQL | - | 獨立使用 |
| ProductionDetailsGraphQL | - | Injection 主題使用 |
| ProductionStatsGraphQL | - | 獨立使用 |
| StaffWorkloadGraphQL | - | Injection 主題使用 |
| StillInAwaitWidgetGraphQL | StillInAwaitWidget | 可選替換 |
| TopProductsChartGraphQL | - | 獨立使用 |
| WarehouseTransferListWidgetGraphQL | WarehouseTransferListWidget | 可選替換 |
| YesterdayTransferCountWidget | - | 部分 GraphQL |
| TransferTimeDistributionWidget | - | 部分 GraphQL |
| StillInAwaitWidget | - | 混合實現 |

### GraphQL 集成機會
- **高優先級**: 頻繁刷新的統計類 widgets
- **中優先級**: 數據量大的列表類 widgets  
- **低優先級**: 靜態或操作類 widgets

## 🔍 特殊發現

### 1. 重複實現
- 多個 widgets 有 GraphQL 和非 GraphQL 版本並存
- AnalysisPagedWidget 有 V1 和 V2 版本
- ReportGeneratorWidget 有 Dialog 和非 Dialog 版本

### 2. 未使用 Widgets
約 15+ 個 widgets 沒有在任何主題佈局中直接使用，可能是：
- 被其他組件內部調用
- 舊版本遺留
- 實驗性功能

### 3. 命名不一致
- 有些用 Widget 結尾，有些沒有
- GraphQL 版本命名不統一（有些是 GraphQL 後綴，有些內嵌）

## 🎯 優化建議

### 1. 立即行動
- 統一命名規範
- 移除未使用的 widgets
- 合併重複版本

### 2. 短期改進
- 完成所有高頻 widgets 的 GraphQL 集成
- 實施完整的懶加載
- 建立 widget 版本管理

### 3. 長期規劃
- 建立 widget 市場機制
- 支援用戶自定義 widgets
- 實施 widget 性能監控

---

**下一步**: 基於此盤點結果開始 Widget 註冊系統實施