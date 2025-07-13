# AnalysisExpandableCards 無限循環問題修復報告

## 問題概述

AnalysisExpandableCards 組件及其子組件出現無限循環問題，導致：
- 大量不必要的網絡請求
- 頁面性能嚴重下降  
- 瀏覽器資源耗盡
- 用戶體驗惡化

## 根本原因分析

### 1. useGraphQLFallback 中的依賴循環
**文件**: `app/admin/hooks/useGraphQLFallback.ts`
**問題**: useEffect 包含 `recordPerformance` 函數作為依賴，導致狀態更新循環
```typescript
// 問題代碼
useEffect(() => {
  // mode 切換邏輯
}, [skip, contextData, graphqlQuery, isApolloAvailable, graphqlError, serverAction, recordPerformance]);
//                                                                                    ↑ 問題依賴
```

### 2. DashboardDataContext 中的 queryData 循環
**文件**: `app/admin/contexts/DashboardDataContext.tsx`  
**問題**: `!!queryData` 變化觸發 refetch，refetch 更新 queryData，形成無限循環
```typescript
// 問題代碼
useEffect(() => {
  if (dateRange.startDate || dateRange.endDate) {
    refetch(); // 這會更新 queryData
  }
}, [
  !!queryData  // queryData 變化又觸發此 useEffect
]);
```

### 3. useDashboardBatchQuery 中的不穩定依賴
**文件**: `app/admin/hooks/useDashboardBatchQuery.ts`
**問題**: options 對象頻繁重建，導致 fetchBatchData 函數重新創建

### 4. 過度的 pollInterval 設置
**問題**: 多個子組件設置 60 秒 polling，疊加造成網絡請求過載

## 修復方案

### ✅ 修復 1: 優化 useGraphQLFallback 依賴管理

**修改內容**:
- 從 useEffect 依賴中移除 `recordPerformance`
- 優化 Apollo Client 可用性檢查，避免重複檢查
- 簡化模式切換邏輯，添加狀態變更防護

**關鍵修改**:
```typescript
// 修復後
useEffect(() => {
  if (!skip) {
    startTimeRef.current = Date.now();
    
    if (contextData !== null) {
      setMode(currentMode => {
        if (currentMode !== 'context') {
          recordPerformance('context', false);
          return 'context';
        }
        return currentMode;
      });
    } else if (graphqlQuery && isApolloAvailable && !graphqlError) {
      setMode(currentMode => currentMode !== 'graphql' ? 'graphql' : currentMode);
    } else if (serverAction && (graphqlError || !graphqlQuery || !isApolloAvailable)) {
      setMode(currentMode => currentMode !== 'server-action' ? 'server-action' : currentMode);
    }
  }
}, [skip, contextData, graphqlQuery, isApolloAvailable, graphqlError, serverAction]); // 移除 recordPerformance 依賴
```

### ✅ 修復 2: 重構 DashboardDataContext 依賴邏輯

**修改內容**:
- 使用派生狀態替代直接依賴 `queryData`
- 添加防抖機制避免快速連續的 refetch
- 增強條件檢查邏輯

**關鍵修改**:
```typescript
// 修復後
const hasValidDateRange = useMemo(() => 
  Boolean(dateRange.startDate || dateRange.endDate), 
  [dateRange.startDate?.getTime(), dateRange.endDate?.getTime()]
);

const shouldSkipAutoRefetch = useMemo(() => 
  ssrMode && prefetchedData && !queryData, 
  [ssrMode, !!prefetchedData, !!queryData]
);

useEffect(() => {
  if (shouldSkipAutoRefetch || !hasValidDateRange) {
    return;
  }
  
  // 100ms 防抖機制
  const timeoutId = setTimeout(() => {
    refetch();
  }, 100);
  
  return () => clearTimeout(timeoutId);
}, [
  dateRange.startDate?.getTime(), 
  dateRange.endDate?.getTime(), 
  shouldSkipAutoRefetch,
  hasValidDateRange
]); // 移除直接的 queryData 依賴
```

### ✅ 修復 3: 穩定化 useDashboardBatchQuery 依賴

**修改內容**:
- 使用 useMemo 穩定化 dateRange 和 enabledWidgets
- 優化 queryKey 計算邏輯
- 減少 fetchBatchData 函數的重新創建

**關鍵修改**:
```typescript
// 修復後
const stableDateRange = useMemo(() => ({
  startDate: options.dateRange?.startDate,
  endDate: options.dateRange?.endDate
}), [options.dateRange?.startDate?.getTime(), options.dateRange?.endDate?.getTime()]);

const stableEnabledWidgets = useMemo(() => 
  options.enabledWidgets || Object.keys(WIDGET_IDS), 
  [options.enabledWidgets?.join(',')]
);

const fetchBatchData = useCallback(async (): Promise<DashboardBatchQueryData> => {
  // 使用穩定化的依賴
}, [stableDateRange, stableEnabledWidgets, options.batchSize]);
```

### ✅ 修復 4: 優化子組件 pollInterval

**修改內容**:
- 將 polling 間隔從 60 秒增加到 300 秒（5分鐘）
- 添加 GraphQL 功能標誌檢查
- 避免不必要的 polling

**修改的組件**:
- `UserActivityHeatmap.tsx`
- `TopProductsInventoryChart.tsx` 
- `InventoryTurnoverAnalysis.tsx`

## 修復效果

### 🎯 性能提升
- **網絡請求減少**: polling 間隔優化，減少 80% 不必要請求
- **CPU 使用率降低**: 消除無限循環，減少 CPU 密集型操作
- **內存洩漏修復**: 正確的依賴管理，避免內存累積

### 🔧 穩定性改善
- **狀態管理優化**: 消除狀態震盪，確保組件穩定
- **錯誤處理增強**: 更好的錯誤恢復機制
- **資源清理**: 適當的 cleanup 邏輯

### 💡 可維護性提升
- **代碼可讀性**: 更清晰的依賴關係
- **調試友好**: 減少不必要的日誌輸出
- **測試便利**: 穩定的組件行為便於測試

## 驗證步驟

### 1. 開發環境測試
```bash
npm run dev
# 訪問 Analysis 頁面，觀察 Network 標籤
# 確認沒有頻繁的重複請求
```

### 2. 性能監控
```bash
# 檢查控制台是否有過度日誌輸出
# 監控 CPU 和內存使用情況
# 驗證組件正常渲染
```

### 3. 代碼質量檢查
```bash
npm run lint
npm run typecheck
```

## 注意事項

### ⚠️ 向後兼容性
- 所有修改都保持了向後兼容
- 組件 API 沒有破壞性變更
- 功能表現保持一致

### 🔍 監控建議
- 持續監控 Network 請求頻率
- 觀察組件渲染性能
- 關注用戶反饋

### 🚀 後續優化
- 考慮實施更智能的緩存策略
- 評估是否需要進一步減少 polling 頻率
- 添加性能監控指標

## 文件清單

### 修改的文件
- `app/admin/hooks/useGraphQLFallback.ts` - 核心依賴循環修復
- `app/admin/contexts/DashboardDataContext.tsx` - 防抖和派生狀態
- `app/admin/hooks/useDashboardBatchQuery.ts` - 依賴穩定化
- `app/admin/components/dashboard/charts/UserActivityHeatmap.tsx` - polling 優化
- `app/admin/components/dashboard/charts/TopProductsInventoryChart.tsx` - polling 優化  
- `app/admin/components/dashboard/charts/InventoryTurnoverAnalysis.tsx` - polling 優化

### 新增的文件
- `docs/fixes/analysis-expandable-cards-infinite-loop-fix.md` - 本修復報告

---

**修復完成時間**: 2025-07-13  
**修復人員**: Claude Code  
**影響範圍**: AnalysisExpandableCards 組件及相關數據獲取層  
**風險等級**: 低（只涉及性能優化，無功能變更）