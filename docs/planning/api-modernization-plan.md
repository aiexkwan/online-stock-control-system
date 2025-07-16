# API 系統現代化計劃書

**最後更新**: 2025-07-16  
**版本**: v1.5  
**狀態**: 執行中

## 📋 計劃概述

將 NewPennine 系統從 GraphQL 架構遷移到 NestJS REST API 架構，並建立企業級 API 版本管理系統。

## 🎯 總體目標

1. **完全移除 GraphQL 依賴** - 遷移所有 widgets 到 REST API
2. **建立 API 版本管理系統** - 實施語義化版本控制
3. **提升系統性能** - 優化響應時間和資源使用
4. **改善開發體驗** - 統一 API 架構

## 📊 實際進度狀態

### 總體完成度: 25% (5/20 個主要任務)

### ✅ 已完成任務 (5項)
1. **GraphQL 清理** (100%)
   - 移除 4 個 GraphQL 依賴包
   - 清理 32 個 .graphql 文件
   - 更新 ClientLayout 移除 ApolloProvider

2. **核心 Widgets 遷移** (4/18 = 22%)
   - ✅ AcoOrderProgressWidget
   - ✅ TransactionReportWidget  
   - ✅ VoidRecordsAnalysis
   - ✅ StockDistributionChartV2

3. **API 版本管理設計** (100%)
   - 完成企業級版本管理系統設計文檔
   - 定義語義化版本策略 (MAJOR.MINOR.PATCH)
   - 設計 URL 版本化結構 (/api/v1/, /api/v2/)
   - **注意**: 僅完成設計，實施部分為 0%

4. **NestJS API 端點創建** (部分)
   - `/api/v1/analysis/void-records`
   - `/api/v1/widgets/stock-distribution`

5. **前端優化**
   - 實施 React Query 替代 useEffect + useState
   - 創建統一 widget API 客戶端

### ❌ 未完成任務 (15項)

#### 高優先級 Widgets 遷移 (2個)
- InventoryOrderedAnalysisWidget
- HistoryTreeV2

#### 中優先級 Widgets 遷移 (5個)
- StatsCardWidget
- StockLevelHistoryChart
- TopProductsInventoryChart
- InventoryTurnoverAnalysis
- RealTimeInventoryMap

#### 低優先級 Widgets 遷移 (7個)
- StocktakeAccuracyTrend
- UserActivityHeatmap
- VoidPalletWidget
- SupplierUpdateWidgetV2
- OrdersListWidgetV2
- AwaitLocationQtyWidget
- PerformanceTestWidget

#### API 版本管理實施
- NestJS 版本控制中間件
- 版本協商機制
- 向後兼容層
- 監控和告警系統
- 客戶端 SDK

## 🚨 已識別問題

1. **認證服務問題**
   - E2E 測試只有 56% 通過率 (62/110)
   - Auth session missing 錯誤
   - 需要優先修復

2. **API 穩定性**
   - 部分 widgets API 返回 500 錯誤
   - 需要改善錯誤處理

3. **實際工作量**
   - 發現 14 個需要遷移的 widgets（原預期 10+）
   - 需要重新評估時間表

## 📅 修訂時間表

### Phase 1: 基礎遷移 ✅ (已完成)
- GraphQL 清理
- 核心 widgets 初步遷移

### Phase 2: Widget 遷移 (進行中 - 預計 3-4 週)
- Week 1: 高優先級 widgets (2個)
- Week 2: 中優先級 widgets (5個)
- Week 3-4: 低優先級 widgets (7個)

### Phase 3: API 版本管理 (預計 2-3 週)
- Week 5: 實施版本控制中間件
- Week 6: 建立監控系統
- Week 7: 客戶端 SDK 開發

### Phase 4: 優化和穩定 (預計 1-2 週)
- 性能優化
- 錯誤修復
- 文檔完善

**總預計時間**: 6-9 週（而非原先聲稱的"1天完成35天工作"）

## 🛠️ 技術架構

### 前端架構
- Next.js 14 + TypeScript
- React Query 數據管理
- 統一 API 客戶端

### 後端架構
- NestJS REST API
- JWT 認證
- 多層緩存策略
- RPC 函數優化

### API 版本管理（設計階段）
詳見 `docs/planning/api-version-management-design.md`：

#### 核心設計要點
- **URL 版本化**: `/api/v1/`, `/api/v2/`
- **語義化版本**: MAJOR.MINOR.PATCH
- **版本協商**: Header、Query、Accept 多種方式
- **向後兼容**: 轉換層確保舊版本支援
- **監控告警**: 版本使用率、棄用通知
- **客戶端 SDK**: 自動版本適配

#### 實施階段（8週計劃）
- Phase 1: 基礎架構 (2週)
- Phase 2: 版本控制實施 (2週) 
- Phase 3: 監控系統 (2週)
- Phase 4: SDK 開發 (2週)

## 📈 關鍵指標

### 當前狀態
- Widget 遷移率: 22% (4/18)
- GraphQL 依賴: 0% (完全移除)
- API 穩定性: 需改善
- 測試通過率: 56%

### 目標指標
- Widget 遷移率: 100%
- API 響應時間: <200ms
- 測試通過率: >95%
- 系統可用性: 99.9%

## 🔄 下一步行動

1. **立即行動**
   - 修復認證服務問題
   - 解決 API 500 錯誤

2. **本週目標**
   - 完成 2 個高優先級 widgets 遷移
   - 提升 E2E 測試通過率到 80%

3. **月度目標**
   - 完成所有 widgets 遷移
   - 開始 API 版本管理實施

---

**注意**: 本計劃書會根據實際進度持續更新，所有更新將直接修改本文檔內容。

## 📑 相關文檔
- **進度報告**: `docs/progress-check/api-modernization-progress-2025-07-16.md`