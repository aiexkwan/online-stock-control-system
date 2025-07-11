# Widget 系統優化計劃

**文檔版本**: 1.0.0  
**建立日期**: 2025-07-11  
**項目範圍**: Admin Dashboard Widget 系統  
**預計時間**: 6-8 週  

## 執行摘要

根據 Widget 系統審核報告（Re-Structure-12），發現系統存在多個嚴重問題需要優化：
- 33% widgets 重複數據獲取
- 43% widgets 混合架構增加複雜度
- 約 1,600 行重複代碼
- Widget Registry 過度工程化（370行可簡化至200-250行）
- 8個 Legacy widgets 需要遷移

本計劃將分版本逐步優化，預期達到：
- 數據庫查詢減少 50%
- Bundle Size 減少 30%
- 首屏加載改善 40%
- 錯誤率降低 60%

## 版本規劃

### 版本 1.0 - 基礎架構優化（優先級：高）

#### 1.0.1 - 批量查詢系統
**目標**: 減少 80% 網絡請求

**實施內容**:
```typescript
// app/admin/hooks/useDashboardBatchQuery.ts
const DASHBOARD_BATCH_QUERY = gql`
  query GetDashboardData($dateFrom: timestamp!, $dateTo: timestamp!) {
    stats: record_palletinfo_aggregate { ... }
    inventory: record_inventory_aggregate { ... }
    recent_orders: record_aco(limit: 10) { ... }
    transfers: record_transfer_aggregate { ... }
  }
`;
```

**影響範圍**:
- AwaitLocationQtyWidget
- StatsCardWidget
- YesterdayTransferCountWidget
- StockDistributionChartV2
- 其他庫存相關 widgets (共 15+ 個)

#### 1.0.2 - 首屏性能優化
**目標**: 提升 40% 加載速度

**實施內容**:
1. 識別 Critical Path widgets:
   - StatsCardWidget
   - AwaitLocationQtyWidget
   - YesterdayTransferCountWidget

2. 實施 SSR/SSG:
   ```typescript
   // app/admin/hooks/server/prefetch.server.ts
   export async function prefetchCriticalWidgetsData() {
     const [stats, inventory, transfers] = await Promise.all([
       getStatsData(),
       getInventoryData(),
       getTransferData()
     ]);
     return { stats, inventory, transfers };
   }
   ```

3. 優化 bundle splitting:
   ```typescript
   // lib/widgets/dynamic-imports.ts
   const criticalWidgets = ['StatsCard', 'AwaitLocationQty'];
   const lazyWidgets = ['StockDistributionChart', 'WarehouseWorkLevel'];
   ```

#### 1.0.3 - 統一數據獲取層
**目標**: 標準化數據獲取，減少 50% 重複代碼

**實施內容**:
```typescript
// app/admin/hooks/useGraphQLFallback.ts
export interface GraphQLFallbackOptions<T> {
  graphqlQuery?: DocumentNode;
  serverAction?: () => Promise<T>;
  extractFromContext?: (ctx: DashboardDataContext) => T | null;
  fallbackEnabled?: boolean;
  cachePolicy?: WatchQueryFetchPolicy;
}

export function useGraphQLFallback<T>(options: GraphQLFallbackOptions<T>) {
  // 1. 嘗試從 context 獲取
  // 2. 使用 GraphQL 查詢
  // 3. Fallback 到 Server Action
  // 4. 統一錯誤處理
}
```

#### 1.0.4 - 通用組件庫
**目標**: 減少 UI 代碼重複

**實施內容**:
1. 擴展現有通用組件:
   ```typescript
   // app/admin/components/dashboard/widgets/common/WidgetStates.tsx
   export const WidgetSkeleton = ({ rows = 2, showHeader = false }) => { ... }
   export const WidgetError = ({ error, onRetry }) => { ... }
   export const WidgetEmpty = ({ message, action }) => { ... }
   ```

2. 創建新通用 hooks:
   ```typescript
   // app/admin/hooks/useWidgetToast.ts
   export const useWidgetToast = () => {
     return {
       showError: (message: string) => { ... },
       showSuccess: (message: string) => { ... },
       showWarning: (message: string) => { ... }
     };
   };
   ```

#### 1.0.5 - DashboardDataContext 實施
**目標**: 避免重複查詢

**實施內容**:
```typescript
// app/admin/contexts/DashboardDataContext.tsx
export const DashboardDataProvider = ({ children, dateRange }) => {
  const batchData = useDashboardBatchQuery(dateRange);
  
  return (
    <DashboardDataContext.Provider value={batchData}>
      {children}
    </DashboardDataContext.Provider>
  );
};
```

### 版本 1.1 - 架構簡化（優先級：中）

#### 1.1.1 - Widget Registry 重構
**目標**: 從 370 行簡化至 200-250 行

**移除功能**:
- WidgetStateManager 類（50行，完全未使用）
- unregister(), getWidgetsByCategory() 等未使用方法
- 循環依賴和動態 require

**簡化後架構**:
```typescript
// lib/widgets/simple-registry.ts
export class SimpleWidgetRegistry {
  private widgets = new Map<string, WidgetConfig>();
  
  register(id: string, config: WidgetConfig): void
  async loadWidget(id: string): Promise<React.ComponentType>
  getAllWidgets(): WidgetConfig[]
  preloadCritical(): Promise<void>
}
```

#### 1.1.2 - 統一配置管理
**目標**: 單一配置源

**實施內容**:
```typescript
// lib/widgets/unified-config.ts
export const widgetConfig: WidgetConfigMap = {
  stats: {
    AwaitLocationQty: {
      loader: () => import('@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget'),
      dataSource: 'batch',
      priority: 'critical'
    }
  },
  // 其他 widgets...
};
```

#### 1.1.3 - Legacy Widgets 遷移
**目標**: 更新 8 個直接使用 Supabase Client 嘅舊 widgets

**需要遷移嘅 widgets**:
1. UploadFilesWidget
2. UploadPhotoWidget
3. UploadProductSpecWidget
4. StockTypeSelector
5. SupplierUpdateWidgetV2
6. GrnReportWidgetV2
7. TransactionReportWidget
8. VoidPalletWidget

**遷移策略**:
- Write-Only widgets → Server Actions
- Read-Only widgets → GraphQL + Context
- Mixed widgets → useGraphQLFallback

#### 1.1.4 - 移除未使用系統
**目標**: 清理過度工程化嘅功能

**需要移除**:
1. MigrationAdapter (lib/widgets/migration-adapter.ts)
2. DualRunVerifier (lib/widgets/dual-run-verification.ts)
3. ABTestManager (未實際使用部分)
4. RoutePredictor (僅一處使用)
5. GridVirtualizer (極少使用)

#### 1.1.5 - 讀寫邏輯分離
**目標**: 優化數據流

**分類策略**:
- **Read-Only (22個)**: 使用 GraphQL + 批量查詢
- **Write-Only (6個)**: 使用 Server Actions
- **Read-Write (3個)**: 混合模式，清晰分離

### 版本 1.2 - 長期優化（優先級：低）

#### 1.2.1 - Widget 開發框架
**目標**: 簡化新 widget 開發

```typescript
// lib/widgets/create-widget.ts
export function createWidget<T>({
  id,
  dataSource,
  component,
  options
}: CreateWidgetOptions<T>) {
  return {
    id,
    component: withWidgetFeatures(component, { dataSource }),
    register: () => registry.register(id, { component, dataSource })
  };
}
```

#### 1.2.2 - 智能緩存策略
**目標**: 優化數據新鮮度

**實施內容**:
- Date range aware caching
- Stale-while-revalidate 策略
- 預測性預加載
- 智能 TTL 管理

#### 1.2.3 - 性能監控系統
**目標**: 持續優化

**功能**:
- Widget 加載時間追蹤
- 錯誤率監控
- 自動性能報告
- A/B 測試結果分析

#### 1.2.4 - 開發文檔完善
**目標**: 提升開發效率

**內容**:
- Widget 開發最佳實踐
- 性能優化指南
- 遷移指南
- API 文檔

### 版本 1.3 - 持續改進

#### 1.3.1 - 代碼清理
**目標**: 減少 1,600 行重複代碼

**清理範圍**:
- 移除過多遷移註釋
- 統一 loading skeleton (17個 widgets)
- 統一 error handling (26個 widgets)
- 統一 toast notifications (10個 widgets)

## 風險評估與緩解

### 高風險項目
1. **批量查詢實施**
   - 風險：影響所有 widgets 數據獲取
   - 緩解：分階段部署，保留 fallback 機制

2. **Widget Registry 重構**
   - 風險：可能破壞現有功能
   - 緩解：完整測試覆蓋，保留兼容層

### 中風險項目
1. **Legacy Widget 遷移**
   - 風險：功能可能有差異
   - 緩解：逐個測試，用戶驗收

2. **SSR/SSG 實施**
   - 風險：可能影響動態數據
   - 緩解：只對靜態內容使用 SSG

### 低風險項目
1. **通用組件提取**
   - 風險：樣式可能有差異
   - 緩解：保持向後兼容

## 成功指標

### 技術指標
- [ ] 數據庫查詢次數：-50%
- [ ] Bundle Size：-30% (~200KB)
- [ ] 首屏加載時間：-40%
- [ ] 內存使用：-15MB

### 業務指標
- [ ] 頁面響應時間：< 1秒
- [ ] 錯誤率：< 0.1%
- [ ] 用戶滿意度：> 90%

### 開發效率
- [ ] 新 Widget 開發時間：-60%
- [ ] Bug 修復時間：-40%
- [ ] 代碼審查時間：-30%

## 實施時間表

| 版本 | 預計時間 | 主要交付物 |
|------|----------|-----------|
| 1.0.1-1.0.5 | 2週 | 批量查詢、首屏優化、統一數據層 |
| 1.1.1-1.1.5 | 2週 | Registry 重構、Legacy 遷移 |
| 1.2.1-1.2.4 | 3週 | 開發框架、緩存、監控 |
| 1.3.1 | 1週 | 代碼清理、文檔 |

## 資源需求

### 人力資源
- 高級前端工程師：1名（全職）
- 測試工程師：1名（50%）
- 項目經理：1名（20%）

### 技術資源
- 開發環境：已具備
- 測試環境：需要獨立測試環境
- 監控工具：需要設置 Sentry/DataDog

## 下一步行動

1. **立即開始**：版本 1.0.1 批量查詢系統實施
2. **準備工作**：設置測試環境和監控
3. **團隊溝通**：向團隊說明優化計劃
4. **基準測試**：記錄當前性能指標

## 實施進度

### 版本 1.0.1 & 1.0.2 - 已完成 (2025-07-11)

#### 1.0.1 批量查詢系統修復
- ✅ 修復 DashboardAPI 的 await_location_count 數據格式
  - 將簡單值改為返回 records 陣列格式
  - 支持 AwaitLocationQtyWidget 的數據需求
  - 實施位置：`lib/api/admin/DashboardAPI.ts`

#### 1.0.2 首屏性能優化修復
- ✅ 修復 prefetchCriticalWidgetsData 函數參數問題
  - 添加 options 參數支持（dateRange, criticalOnly）
  - 更新數據獲取邏輯以匹配新格式
  - 實施位置：`app/admin/hooks/server/prefetch.server.ts`
- ✅ 更新 DashboardBatchQueryData 類型定義
  - 支持新的 awaitLocationQty 數據結構
  - 保留舊欄位以確保向後兼容
  - 實施位置：`app/admin/types/dashboard.ts`

### 版本 1.0.3 & 1.0.4 & 1.0.5 - 已完成 (2025-07-11)

#### 1.0.3 統一數據獲取層
- ✅ useGraphQLFallback hook 已完整實施
  - 11個 widgets 已成功遷移
  - 支持 GraphQL → Server Action fallback
  - 集成 DashboardDataContext 數據共享

#### 1.0.4 通用組件庫擴展
- ✅ 創建 useWidgetToast hook
  - 支持 success、error、warning、info、loading 狀態
  - 提供 showPromise 方法處理異步操作
  - 包含預設配置（dataFetch、fileUpload、reportGeneration 等）
  - 實施位置：`app/admin/hooks/useWidgetToast.ts`
- ✅ WidgetStates.tsx 系統已完善
  - WidgetSkeleton、WidgetError、WidgetEmpty 組件
  - WidgetStateWrapper 統一狀態處理

#### 1.0.5 DashboardDataContext 完善
- ✅ DashboardDataContext 已完整實施
  - 支持 SSR 和 CSR 混合模式
  - 智能數據合併（預取數據 + 客戶端查詢）
  - 自動刷新機制（5分鐘間隔）
  - 3個 widgets 已遷移使用

#### 新增文件
1. **useWidgetToast.ts** - Widget 專用 toast 系統
2. **acoOrderProgressQueries.ts** - ACO 訂單 GraphQL 查詢
3. **acoOrderProgressActions.ts** - ACO 訂單 Server Actions
4. **acoOrderProgress.graphql** - GraphQL 查詢定義

#### 遷移進度
- **useGraphQLFallback**: 11/45 widgets 已遷移 (24%)
- **useWidgetToast**: 1/11 toast 使用者已遷移 (9%)
- **DashboardDataContext**: 3/45 widgets 已遷移 (7%)

#### 主要改動
1. **useWidgetToast.ts**
   - 創建專業的 widget toast 系統
   - 支持多種通知類型和預設配置

2. **AcoOrderProgressWidget.tsx**
   - 遷移到 useGraphQLFallback 架構
   - 使用新的 toast 系統

3. **TransactionReportWidget.tsx** 
   - 更新使用 useWidgetToast

---

**批准人**：_________________  
**批准日期**：_______________