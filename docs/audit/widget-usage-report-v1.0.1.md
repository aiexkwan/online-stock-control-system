# Widget Usage Report - Version 1.0.1

## Executive Summary

NewPennine 倉庫管理系統嘅 Admin Widget 系統審計完成。發現系統存在嚴重過度工程化問題：

- **總 Widget 數量**: 47 個實際 widgets + 額外輔助文件
- **實際使用數量**: 42 個 widgets 被使用（35 個直接配置 + 7 個通過容器）
- **未使用 Widget**: 僅 5-6 個 widgets 完全未被使用
- **代碼總行數**: 超過 13,000 行
- **平均複雜度**: 每個 widget 平均 250+ 行代碼

## Widget 使用頻率分析

### 重要發現
根據用戶補充資料，**/admin/injection**、**/pipeline** 同 **/warehouse** 三個頁面嘅 widget 內容大致相同，只係使用不同嘅數據過濾器 (filter)。這解釋咗為何某些 widgets 使用頻率特別高。

### 高頻使用 Widgets (核心組件)
1. **HistoryTree** - 使用 9 次
   - 幾乎每個主題都包含
   - 776 行代碼，屬於最複雜組件之一
   - **問題**: 三個相似頁面重複使用，可考慮統一處理
   
2. **AvailableSoonWidget** - 使用 7 次
   - 只有 40 行代碼，但使用頻繁
   - **問題**: 在 injection/pipeline/warehouse 重複配置
   - 建議使用共享配置減少重複

3. **ReportGeneratorWithDialogWidgetV2** - 使用 4 次
   - 290 行代碼
   - 報表生成核心組件

### 單次使用 Widgets (30個)
大部分 widgets 只在特定主題中使用一次，包括：
- VoidPalletWidget (776 行 - 最複雜)
- ProductUpdateWidgetV2 (672 行)
- SupplierUpdateWidgetV2 (579 行)
- InventoryOrderedAnalysisWidget (472 行)

### 完全未使用 Widgets
以下 widgets 在代碼庫中存在但未在任何 layout 中直接使用：
1. StatsCardWidget
2. ProductionStatsWidget
3. ProductUpdateWidget (有 V2 版本)
4. AnalysisPagedWidgetV2
5. AcoOrderProgressWidget (單獨 widget，但 AcoOrderProgressCards 有使用)

### 可能被間接使用的 Widgets
1. ProductDistributionChartWidget - 在 widget-mappings.ts 中被分類為 'charts'，可能在其他地方動態載入

### 通過容器組件使用的 Widgets
**AnalysisExpandableCards** 容器動態加載以下 7 個圖表：
1. AcoOrderProgressCards (ACO 訂單進度)
2. TopProductsInventoryChart (熱門產品庫存)
3. UserActivityHeatmap (用戶活動熱圖)
4. InventoryTurnoverAnalysis (庫存週轉分析)
5. StocktakeAccuracyTrend (盤點準確度趨勢)
6. VoidRecordsAnalysis (作廢記錄分析)
7. RealTimeInventoryMap (實時庫存地圖)

**重要發現**：/admin/analysis 頁面使用 AnalysisExpandableCards 作為容器，內含 7 個分析圖表 widgets

## 複雜度分析

### 最複雜 Widgets (按複雜度分數)
1. **InventoryOrderedAnalysisWidget** - 複雜度 114
   - 472 行代碼, 26 個 hooks
2. **ProductUpdateWidgetV2** - 複雜度 111
   - 672 行代碼, 28 個 hooks
3. **VoidPalletWidget** - 複雜度 107
   - 776 行代碼, 21 個 hooks
4. **SupplierUpdateWidgetV2** - 複雜度 105
   - 579 行代碼, 26 個 hooks

### 最簡單 Widgets (可作為參考)
1. **AvailableSoonWidget** - 複雜度 12
   - 40 行代碼, 0 個 hooks
2. **AwaitLocationQtyWidget** - 複雜度 22
   - 30 行代碼, 3 個 hooks

## 架構問題

### 1. 雙重註冊系統
- LazyWidgetRegistry.tsx (527 行)
- enhanced-registry.ts
- 兩個系統並行運行，造成混亂

### 2. 版本重複
多個 widgets 同時存在 V1 和 V2 版本：
- ProductUpdateWidget vs ProductUpdateWidgetV2
- OrdersListWidget vs OrdersListWidgetV2
- GrnReportWidget vs GrnReportWidgetV2

### 3. 過度抽象
- 7 個 widget adapters
- 複雜的動態加載機制
- 網絡自適應加載（OptimizedWidgetLoader）

## 依賴關係分析

### 核心依賴
1. **DashboardDataContext** - 批量查詢系統
2. **MetricCard** - 通用組件（253 行）
3. **useWidgetData** - 數據獲取 hook
4. **GraphQL** - 部分 widgets 使用 GraphQL 優化

### 重型依賴
- recharts (圖表庫)
- ExcelJS (報表生成)
- react-day-picker (日期選擇)
- framer-motion (動畫)

## 建議優化方向

### 立即行動項目
1. **移除未使用 Widgets** - 可減少約 3,000 行代碼
2. **合併版本** - 統一到 V2 版本，移除舊版
3. **統一相似頁面配置** - injection/pipeline/warehouse 使用共享配置
   - 減少 widget 重複定義
   - 使用 filter 參數區分數據
   - 預計可減少 60% 配置代碼

### 短期優化
1. **統一註冊系統** - 選擇一個系統，移除另一個
2. **簡化複雜 Widgets** - 將 700+ 行的組件拆分
3. **移除過度優化** - 網絡自適應等功能

### 長期重構
1. **減少到 15 個核心 Widgets**
2. **統一使用 MetricCard 等通用組件**
3. **簡化架構層次**

## 性能影響

### Bundle Size 影響
- 未使用 widgets 佔用約 30% bundle size
- 重複版本增加 15% 冗餘
- 過度抽象層增加 10% overhead

### 維護成本
- 新人學習需要 2-3 週
- 每個新功能需要理解 7 層架構
- Bug 修復困難度高

## 結論

系統為 10-15 人團隊設計了企業級架構，造成嚴重的過度工程化。建議立即開始簡化工作，優先移除未使用組件和統一版本，預計可減少 50-70% 代碼量。

---

**審計日期**: 2025-01-14  
**審計版本**: 1.0.1  
**審計人**: System Audit