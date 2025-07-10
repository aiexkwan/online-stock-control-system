# DashboardDataContext 使用指南

## 概述

DashboardDataContext 是一個用於管理儀表板數據共享和優化的 React Context。它通過批量查詢和智能緩存來提高性能，並提供統一的數據管理接口。

## 功能特點

- **批量數據獲取**: 使用 `useDashboardBatchQuery` hook 批量獲取所有 widget 數據
- **智能緩存**: 基於 React Query 的緩存策略，減少不必要的 API 調用
- **日期範圍管理**: 統一管理所有 widgets 的日期範圍篩選
- **自動刷新**: 支持配置自動刷新間隔
- **錯誤處理**: 統一的錯誤處理和狀態管理
- **性能優化**: 支持按需加載和單個 widget 刷新

## 基本使用

### 1. 在頂層組件中提供 Context

```tsx
import { DashboardDataProvider } from '@/app/admin/contexts/DashboardDataContext';

function AdminDashboard() {
  return (
    <DashboardDataProvider 
      initialDateRange={{ startDate: null, endDate: null }}
      autoRefreshInterval={5 * 60 * 1000} // 5 分鐘
    >
      {/* 你的儀表板內容 */}
    </DashboardDataProvider>
  );
}
```

### 2. 在 Widget 中使用數據

```tsx
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';

function MyWidget() {
  const { data, loading, error, refetch } = useWidgetData('widgetId');

  if (loading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      {/* 使用 data */}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### 3. 使用整體 Context

```tsx
import { useDashboardData } from '@/app/admin/contexts/DashboardDataContext';

function DashboardControls() {
  const { 
    dateRange, 
    setDateRange, 
    refetch,
    getWidgetData 
  } = useDashboardData();

  return (
    <div>
      <DatePicker
        value={dateRange}
        onChange={setDateRange}
      />
      <button onClick={refetch}>Refresh All</button>
    </div>
  );
}
```

## API 參考

### DashboardDataProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `initialDateRange` | `DashboardDateRange` | 初始日期範圍 |
| `autoRefreshInterval` | `number` | 自動刷新間隔（毫秒） |

### useDashboardData Hook

返回以下方法和屬性：

- `data`: 所有 widget 的數據對象
- `loading`: 是否正在加載
- `error`: 錯誤信息
- `dateRange`: 當前日期範圍
- `setDateRange`: 設置日期範圍
- `refetch`: 刷新所有數據
- `refetchWidget`: 刷新單個 widget
- `getWidgetData`: 獲取特定 widget 數據
- `isWidgetLoading`: 檢查特定 widget 是否加載中
- `getWidgetError`: 獲取特定 widget 的錯誤

### useWidgetData Hook

專門用於單個 widget 的便捷 hook：

```tsx
const { data, loading, error, refetch } = useWidgetData<DataType>('widgetId');
```

## 支持的 Widget IDs

- `statsCard` - 統計卡片數據
- `stockDistribution` - 庫存分佈
- `stockLevelHistory` - 庫存歷史
- `topProducts` - 熱門產品
- `acoOrderProgress` - ACO 訂單進度
- `ordersList` - 訂單列表
- `injectionProductionStats` - 注塑生產統計
- `productionDetails` - 生產詳情
- `staffWorkload` - 員工工作量
- `warehouseTransferList` - 倉庫轉移列表
- `warehouseWorkLevel` - 倉庫工作水平
- `grnReport` - GRN 報告
- `availableSoon` - 即將可用
- `awaitLocationQty` - 等待位置數量
- `historyTree` - 歷史樹

## 遷移指南

### 從舊的獨立 API 調用遷移

之前：
```tsx
function StatsWidget() {
  const { data, loading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  });
  // ...
}
```

之後：
```tsx
function StatsWidget() {
  const { data, loading } = useWidgetData('statsCard');
  // ...
}
```

### 處理日期範圍

之前：
```tsx
function Widget() {
  const [dateRange, setDateRange] = useState({});
  // 每個 widget 管理自己的日期範圍
}
```

之後：
```tsx
function Widget() {
  const { dateRange } = useDashboardData();
  // 使用統一的日期範圍
}
```

## 性能優化建議

1. **使用適當的自動刷新間隔**: 根據數據更新頻率設置合理的間隔
2. **按需刷新**: 使用 `refetchWidget` 只刷新需要的 widget
3. **利用緩存**: React Query 會自動緩存數據，避免重複請求
4. **批量大小**: 可以通過 `batchSize` 選項調整批量請求的大小

## 錯誤處理

Context 提供統一的錯誤處理：

```tsx
function ErrorBoundary() {
  const { error } = useDashboardData();
  
  if (error?.type === 'batch') {
    // 批量錯誤
  } else if (error?.type === 'widget') {
    // 單個 widget 錯誤
  }
}
```

## 測試

```tsx
import { DashboardDataProvider } from '@/app/admin/contexts/DashboardDataContext';
import { render } from '@testing-library/react';

test('widget renders with data', () => {
  const mockData = { statsCard: { totalProducts: 100 } };
  
  render(
    <DashboardDataProvider initialDateRange={...}>
      <MyWidget />
    </DashboardDataProvider>
  );
});
```