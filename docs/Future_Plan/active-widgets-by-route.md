# 系統 Active Widgets 使用報告（修正版）

**報告日期**: 2025-07-03  
**分析目的**: 確定實際使用中嘅 widgets，排除廢棄組件
**更新說明**: 根據實際頁面顯示內容修正

## ✅ 實際使用中嘅 Widgets（按路由）

### 1. 注入生產監控 (`/admin/injection`)
| Widget/功能 | 實際渲染內容 | 位置 | 類型 |
|------------|------------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 | 特殊組件 |
| Today Produced (PLT) | Stats卡片 - 棧板數量 | widget2 | AdminWidgetRenderer (stats) |
| Today Produced (QTY) | Stats卡片 - 總數量 | widget3 | AdminWidgetRenderer (stats) |
| Coming Soon | 佔位符 | widget4,5,8 | AvailableSoonWidget |
| Top 10 Products by Quantity | 條形圖 | widget6 | AdminWidgetRenderer (bar chart) |
| Top 10 Products Distribution | 圓餅圖 | widget7 | AdminWidgetRenderer (donut chart) |
| Production Details | 生產詳情表格 | widget9 | AdminWidgetRenderer (table) |
| Staff Workload | 多線圖表 | widget10 | AdminWidgetRenderer (line chart) |

### 2. 管道監控 (`/admin/pipeline`)
| Widget/功能 | 實際渲染內容 | 位置 | 類型 |
|------------|------------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 | 特殊組件 |
| Today Produced (PLT) | Stats卡片 - 管道產品棧板 | widget2 | AdminWidgetRenderer (stats) |
| Today Produced (QTY) | Stats卡片 - 管道產品數量 | widget3 | AdminWidgetRenderer (stats) |
| Coming Soon | 佔位符 | widget4,5,8,10 | AvailableSoonWidget |
| 未知圖表 | 條形圖 | widget6 | AdminWidgetRenderer (bar chart) |
| Top 5 Products Distribution | 圓餅圖 | widget7 | AdminWidgetRenderer (donut chart) |
| Production Details | 生產詳情表格 | widget9 | AdminWidgetRenderer (table) |

### 3. 倉庫管理 (`/admin/warehouse`)
| Widget/功能 | 實際渲染內容 | 位置 | 類型 |
|------------|------------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 | 特殊組件 |
| Await Location Qty | 等待位置數量 | widget2 | AwaitLocationQtyWidget |
| Transfer Done | 昨日轉移完成 | widget3 | YesterdayTransferCountWidget |
| Still In Await | 仍在等待數量 | widget4 | StillInAwaitWidget/GraphQL |
| Still In Await % | 等待百分比 | widget5 | StillInAwaitPercentageWidget |
| Order Progress | 訂單進度列表 | widget6 | OrderStateListWidget |
| Transfer Time Distribution | 轉移時間分佈圖 | widget7 | TransferTimeDistributionWidget |
| Coming Soon | 佔位符 | widget8 | AvailableSoonWidget |
| Warehouse Transfers | 倉庫轉移列表 | widget9 | WarehouseTransferListWidget/GraphQL |
| Warehouse Work Level | 工作水平區域圖 | widget10 | WarehouseWorkLevelAreaChart |

### 4. 檔案上傳 (`/admin/upload`)
| Widget | 功能 | 位置 |
|--------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 |
| OrdersListWidget | 訂單上傳歷史 | widget2 |
| OtherFilesListWidget | 其他檔案歷史 | widget3 |
| UploadFilesWidget | 上傳檔案 | widget4 |
| UploadOrdersWidget | 上傳訂單 | widget5 |
| UploadProductSpecWidget | 上傳產品規格 | widget6 |
| UploadPhotoWidget | 上傳相片 | widget7 |

### 5. 資料更新 (`/admin/update`)
| Widget/功能 | 實際渲染內容 | 位置 | 類型 |
|------------|------------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 | 特殊組件 |
| Product Update | 產品資料更新 | widget2 | ProductUpdateWidget |
| Supplier Update | 供應商更新 | widget3 | SupplierUpdateWidget |
| Void Pallet | 作廢棧板 | widget4 | VoidPalletWidget |
| 空白 widget | Stats卡片 - 待處理數量 | widget5 | AdminWidgetRenderer (stats) |

### 6. 庫存管理 (`/admin/stock-management`)
| Widget | 功能 | 位置 |
|--------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 |
| StockTypeSelector | 庫存類型選擇 | widget2 |
| StockLevelHistoryChart | 庫存水平歷史 | widget3 |
| InventoryOrderedAnalysisWidget | 庫存訂購分析 | widget4 |
| StockDistributionChart | 庫存分佈圖 | widget5 |

### 7. 系統功能 (`/admin/system`)
| Widget | 功能 | 位置 |
|--------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 |
| ReportGeneratorWidget | 報表生成器 | widget2-4,8 |
| AcoOrderReportWidget | ACO訂單報表 | widget5 |
| TransactionReportWidget | 交易報表 | widget6 |
| GrnReportWidget | GRN報表 | widget7 |
| ReprintLabelWidget | 重印標籤 | widget9 |

### 8. 數據分析 (`/admin/analysis`)
| Widget/功能 | 實際渲染內容 | 位置 | 類型 |
|------------|------------|------|------|
| HistoryTree | 歷史記錄樹 | widget1 | 特殊組件 |
| AnalysisExpandableCards | 可展開分析卡片集合 | widget2 | 特殊組件 |

**AnalysisExpandableCards 內部包含**：
- ACO Order Progress - 訂單完成狀態追蹤
- Top Products - 主要庫存產品
- Inventory Turnover - 庫存周轉分析
- Stocktake Accuracy - 盤點準確度監控
- Inventory Map - 倉庫利用率地圖
- Void Analysis - 作廢減少洞察
- Activity Heatmap - 員工工作模式

## 🔍 重要發現：AdminWidgetRenderer 的動態渲染機制

AdminWidgetRenderer 是核心渲染器，根據配置動態渲染不同類型的 widgets：
- **stats**: 渲染統計卡片（數字、趨勢）
- **chart**: 根據 chartType 渲染圖表（line/bar/donut/area）
- **table**: 渲染數據表格
- **GraphQL 支援**: 當 ENABLE_GRAPHQL=true 時，會替換某些 widgets 為 GraphQL 版本

## 📊 統計總結（修正版）

### 實際使用的 Widgets
1. **特殊組件（直接使用）**: 22 個
   - 共用：HistoryTree, AvailableSoonWidget
   - 倉庫：AwaitLocationQtyWidget, YesterdayTransferCountWidget, StillInAwaitWidget 等
   - 上傳：UploadOrdersWidget, UploadFilesWidget 等
   - 更新：ProductUpdateWidget, SupplierUpdateWidget, VoidPalletWidget
   - 報表：ReportGeneratorWidget, TransactionReportWidget 等
   - 分析：AnalysisExpandableCards, AcoOrderProgressCards

2. **AdminWidgetRenderer 動態渲染**: 統計卡片、圖表、表格

3. **GraphQL 條件性使用**: 8 個
   - 當 ENABLE_GRAPHQL=true 時替換對應的非 GraphQL 版本
   - ProductionDetailsGraphQL, StaffWorkloadGraphQL 等

### 按類型分佈
| 類型 | 數量 | 說明 |
|------|------|------|
| 特殊組件 | 22 | 直接在佈局中使用 |
| 動態渲染 | N/A | 通過 AdminWidgetRenderer |
| GraphQL | 8 | 條件性替換 |
| 佔位符 | 1 | AvailableSoonWidget |

## ❌ 確定未使用的 Widgets（已刪除）

### 已刪除的未使用組件（6個）✅
```
- BookedOutStatsWidgetGraphQL ✅ 已刪除
- FileExistsDialog ✅ 已刪除 (只是 dialog，非 widget)
- OutputStatsWidgetGraphQL ✅ 已刪除
- PalletOverviewWidget ✅ 已刪除
- QuickActionsWidget ✅ 已刪除
- ViewHistoryWidget ✅ 已刪除
```

### 保留但需注意（5個）
```
- Folder3D (包括 CSS 檔案) - 🔶 保留（用戶要求）
- GoogleDriveUploadToast - ⚠️ 實際被使用中（4個上傳 widgets 引用）
- InventorySearchWidget - ⚠️ LazyWidgetRegistry 中註冊
- ProductMixChartWidget - ⚠️ LazyWidgetRegistry 中註冊  
- StatsCardWidget - ⚠️ AdminWidgetRenderer 有相似功能
```

### 被替代的舊版本（5個）
```
- AnalysisPagedWidget (→AnalysisExpandableCards)
- AnalysisPagedWidgetV2 (→AnalysisExpandableCards)
- OrdersListGraphQL (→OrdersListWidget 使用中)
- OtherFilesListGraphQL (→OtherFilesListWidget 使用中)
- ReportsWidget (只在 LazyRegistry，無實際使用)
```

## ✅ 實際使用中但需注意的 Widgets

### 條件性使用（GraphQL 版本）
當 ENABLE_GRAPHQL=true 時，這些 widgets 會替換對應的動態渲染：
```
✅ ProductionDetailsGraphQL - 替換 Production Details 表格
✅ StaffWorkloadGraphQL - 替換 Staff Workload 圖表
✅ TopProductsChartGraphQL - 替換 Top Products 圖表
✅ ProductDistributionChartGraphQL - 替換 Product Distribution 圖表
✅ StillInAwaitWidgetGraphQL - 倉庫主題使用
✅ WarehouseTransferListWidgetGraphQL - 倉庫主題使用
```

### 特殊用途
```
✅ AcoOrderProgressCards - AnalysisExpandableCards 內部使用
✅ EmptyPlaceholderWidget - AdminWidgetRenderer 特殊處理
✅ OrderAnalysisResultDialog - UploadOrdersWidget 內部使用
✅ AnalyticsDashboardWidget - 可能在其他地方使用（需確認）
✅ ReportGeneratorWithDialogWidget - 可能仍在使用（需確認）
```

## 🎯 建議行動（基於修正分析）

### 1. 立即清理 ✅
- ✅ 已刪除 6 個完全未使用的 widgets
- 🔶 保留 Folder3D（用戶要求）
- ⚠️ 修正分析：4 個實際被使用中，不能刪除
- 📊 實際刪除：6 個檔案（約 10.5%）+ 1 個 actions 檔案

### 2. 保留但需優化
- **AdminWidgetRenderer**: 核心渲染器，需優化性能
- **GraphQL widgets**: 保留用於 ENABLE_GRAPHQL 模式
- **特殊用途 widgets**: 確認使用情況後決定

### 3. 重組結構建議
```
/widgets
  /core           (AdminWidgetRenderer, HistoryTree, AvailableSoonWidget)
  /warehouse      (倉庫專用 widgets)
  /upload         (上傳相關 widgets)
  /update         (更新操作 widgets)
  /reports        (報表生成 widgets)
  /analysis       (分析相關 widgets)
  /graphql        (所有 GraphQL 版本)
  /deprecated     (待刪除的舊版本)
```

### 4. Widget 註冊系統重點
1. **優先處理**: 實際使用中的 ~35 個 widgets
2. **動態渲染**: 改進 AdminWidgetRenderer 的擴展性
3. **GraphQL 模式**: 統一處理條件性 GraphQL 替換
4. **懶加載**: 為所有特殊組件實施懶加載

---

**結論**: 系統實際使用約 35-40 個 widgets（包括條件性使用），已清理 6 個廢棄組件。AdminWidgetRenderer 是核心組件，需要特別關注其優化。

---

## 📋 2025-07-03 清理總結

### ✅ 已完成
1. **刪除 6 個未使用 widgets**:
   - BookedOutStatsWidgetGraphQL.tsx
   - FileExistsDialog.tsx  
   - OutputStatsWidgetGraphQL.tsx
   - PalletOverviewWidget.tsx
   - QuickActionsWidget.tsx
   - ViewHistoryWidget.tsx

2. **刪除相關文件**:
   - app/actions/viewHistoryActions.ts

3. **清理類型定義**:
   - 移除 WidgetType.PALLET_OVERVIEW
   - 移除 WidgetType.QUICK_ACTIONS  
   - 移除 WidgetType.VIEW_HISTORY

4. **清理樣式配置**:
   - 移除 VIEW_HISTORY 相關樣式
   - 移除 viewHistory 快速訪問配置

### 🎯 下一步：Widget Registry System 1.2
系統已準備好進入 Widget Registry System 實施階段。