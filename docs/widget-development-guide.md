# Widget 開發指南

本指南涵蓋 NewPennine Widget 系統嘅開發最佳實踐，包括 SSR 支持、性能優化同通用組件使用。

## 目錄

1. [Widget 系統概覽](#widget-系統概覽)
2. [創建新 Widget](#創建新-widget)
3. [SSR 支持](#ssr-支持)
4. [使用 useGraphQLFallback Hook](#使用-usegraphqlfallback-hook)
5. [通用組件](#通用組件)
6. [性能優化](#性能優化)
7. [測試策略](#測試策略)
8. [實戰範例](#實戰範例)

## Widget 系統概覽

NewPennine 使用統一嘅 Widget Registry 系統管理所有儀表板組件：

```typescript
// lib/widgets/enhanced-registry.ts
export class EnhancedWidgetRegistry {
  // 註冊 widget
  register(widget: WidgetDefinition): void
  
  // 獲取 widget
  getWidget(id: string): WidgetDefinition | undefined
  
  // 預加載高優先級 widgets
  preloadHighPriorityWidgets(): Promise<void>
}
```

### Widget 定義結構

```typescript
interface WidgetDefinition {
  id: string;
  name: string;
  description?: string;
  category: WidgetCategory;
  tags?: string[];
  
  // 組件加載
  component: () => Promise<{ default: React.ComponentType<any> }>;
  
  // 性能配置
  priority?: 'high' | 'medium' | 'low';
  preload?: boolean;
  
  // SSR 配置
  ssr?: {
    enabled: boolean;
    prefetchData?: (params: any) => Promise<any>;
  };
  
  // 權限控制
  permissions?: string[];
  
  // 佈局配置
  defaultSize?: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}
```

## 創建新 Widget

### 1. 基本 Widget 結構

```typescript
// app/admin/components/dashboard/widgets/MyNewWidget.tsx
'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { MetricCard, DataTable, ChartContainer } from './common';
import { MY_WIDGET_QUERY } from '@/lib/graphql/queries';
import { getMyWidgetData } from '@/app/actions/myWidgetActions';

export interface MyNewWidgetProps {
  // Widget 配置參數
  title?: string;
  dateRange?: { from: Date; to: Date };
  refreshInterval?: number;
}

export default function MyNewWidget({ 
  title = "My New Widget",
  dateRange,
  refreshInterval = 30000 
}: MyNewWidgetProps) {
  // 使用 GraphQL with fallback
  const { data, loading, error, refetch, mode } = useGraphQLFallback({
    graphqlQuery: MY_WIDGET_QUERY,
    serverAction: getMyWidgetData,
    variables: { dateRange },
    pollInterval: refreshInterval,
    widgetId: 'my-new-widget',
    // 從 context 提取數據（如果可用）
    extractFromContext: (contextData) => contextData?.myWidgetData,
  });

  if (loading) {
    return <Card className="animate-pulse h-[400px]" />;
  }

  if (error) {
    return (
      <Card>
        <MetricCard
          title={title}
          value="Error"
          error={error}
          className="h-[400px]"
        />
      </Card>
    );
  }

  return (
    <Card>
      <MetricCard
        title={title}
        value={data?.totalCount || 0}
        label="Total Items"
        trend={data?.trend}
        trendValue={data?.trendValue}
        performanceMetrics={{
          source: mode,
          optimized: true,
          fetchTime: data?._fetchTime,
        }}
      />
    </Card>
  );
}
```

### 2. 註冊 Widget

```typescript
// lib/widgets/my-widgets-adapter.ts
import { WidgetCategory } from './types';
import { createDynamicWidget } from './widget-loader';

export function registerMyWidgets(registry: IWidgetRegistry) {
  registry.register({
    id: 'my-new-widget',
    name: 'My New Widget',
    category: WidgetCategory.Stats,
    tags: ['custom', 'analytics'],
    component: createDynamicWidget(
      () => import('@/app/admin/components/dashboard/widgets/MyNewWidget')
    ),
    priority: 'medium',
    preload: false,
    ssr: {
      enabled: true,
      prefetchData: async (params) => {
        // Server-side data fetching
        const { getMyWidgetData } = await import('@/app/actions/myWidgetActions');
        return getMyWidgetData(params);
      },
    },
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
  });
}
```

## SSR 支持

### 使用 prefetchCriticalWidgetsData

`prefetchCriticalWidgetsData` 函數允許喺 server-side 預取關鍵 widget 數據：

```typescript
// app/admin/dashboard/page.tsx
import { prefetchCriticalWidgetsData } from '@/lib/widgets/ssr-utils';
import { DashboardDataProvider } from '../contexts/DashboardDataContext';

export default async function DashboardPage() {
  // 預取關鍵 widgets 數據
  const prefetchedData = await prefetchCriticalWidgetsData({
    widgetIds: ['stats-overview', 'recent-orders', 'inventory-levels'],
    params: {
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    },
  });

  return (
    <DashboardDataProvider initialData={prefetchedData}>
      <DashboardContent />
    </DashboardDataProvider>
  );
}
```

### SSR Widget 實作

```typescript
// app/admin/components/dashboard/widgets/SSROptimizedWidget.tsx
'use client';

import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';

export default function SSROptimizedWidget({ initialData }: { initialData?: any }) {
  const { data, loading, error } = useGraphQLFallback({
    graphqlQuery: WIDGET_QUERY,
    serverAction: getWidgetData,
    // 優先使用 SSR 數據
    extractFromContext: (ctx) => ctx?.ssrData?.widgetData || initialData,
    fetchPolicy: initialData ? 'cache-first' : 'network-only',
  });

  // Widget 實作...
}
```

## 使用 useGraphQLFallback Hook

### 基本使用

```typescript
const { data, loading, error, refetch, mode, performanceMetrics } = useGraphQLFallback({
  // GraphQL 查詢
  graphqlQuery: MY_QUERY,
  
  // Server Action fallback
  serverAction: myServerAction,
  
  // 查詢變量
  variables: { id: 123 },
  
  // 配置選項
  skip: false,
  pollInterval: 5000,
  fetchPolicy: 'cache-first',
  
  // 回調
  onCompleted: (data) => console.log('Data loaded:', data),
  onError: (error) => console.error('Error:', error),
  
  // Context 數據提取
  extractFromContext: (ctx) => ctx?.myData,
  
  // 性能配置
  widgetId: 'my-widget',
  fallbackEnabled: true,
  cacheTime: 5 * 60 * 1000,
  staleTime: 30 * 1000,
  retryCount: 3,
});
```

### 預設配置

```typescript
import { GraphQLFallbackPresets } from '@/app/admin/hooks/useGraphQLFallback';

// 實時數據
const realtimeData = useGraphQLFallback({
  ...GraphQLFallbackPresets.realtime,
  graphqlQuery: REALTIME_QUERY,
  serverAction: getRealtimeData,
});

// 緩存數據
const cachedData = useGraphQLFallback({
  ...GraphQLFallbackPresets.cached,
  graphqlQuery: CACHED_QUERY,
  serverAction: getCachedData,
});

// 寫操作
const mutation = useGraphQLFallback({
  ...GraphQLFallbackPresets.mutation,
  serverAction: updateData,
});
```

## 通用組件

### MetricCard

顯示指標卡片：

```typescript
import { MetricCard } from './common/data-display';

<MetricCard
  title="Total Revenue"
  value="$125,430"
  label="This month"
  icon={DollarSign}
  iconColor="text-green-500"
  trend="up"
  trendValue="+12.5%"
  trendLabel="vs last month"
  performanceMetrics={{
    source: 'graphql',
    optimized: true,
    fetchTime: 45,
  }}
  loading={loading}
  error={error}
  animateOnMount={true}
/>
```

### DataTable

顯示數據表格：

```typescript
import { DataTable } from './common/data-display';

<DataTable
  data={tableData}
  columns={[
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'secondary'}>
        {value}
      </Badge>
    )},
  ]}
  loading={loading}
  error={error}
  pageSize={10}
  showPagination={true}
  onRowClick={(row) => console.log('Clicked:', row)}
  emptyMessage="No data available"
  className="h-[400px]"
/>
```

### ChartContainer

圖表容器組件：

```typescript
import { ChartContainer } from './common/charts';
import { Line, Bar, Pie } from 'recharts';

<ChartContainer
  title="Sales Trend"
  loading={loading}
  error={error}
  height={300}
>
  <Line data={chartData} xKey="date" yKey="sales" />
</ChartContainer>
```

### DateRangeFilter

日期範圍過濾器：

```typescript
import { DateRangeFilter } from './common/filters';

<DateRangeFilter
  value={dateRange}
  onChange={(range) => setDateRange(range)}
  presets={[
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ]}
  maxDate={new Date()}
  placeholder="Select date range"
/>
```

## 性能優化

### 1. 懶加載配置

```typescript
// lib/widgets/dynamic-imports.ts
export const widgetDynamicImports = {
  'my-widget': {
    component: () => import('@/app/admin/components/dashboard/widgets/MyWidget'),
    preload: true, // 預加載
    priority: 'high', // 優先級
    chunkName: 'widget-my-widget', // Webpack chunk 名稱
  },
};
```

### 2. 使用虛擬化處理大數據

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeDataWidget({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 批量查詢優化

```typescript
// 使用 DashboardDataContext 批量查詢
import { DashboardDataProvider } from '@/app/admin/contexts/DashboardDataContext';

// Provider 配置
<DashboardDataProvider
  queries={[
    { type: 'stats', params: { period: 'month' } },
    { type: 'orders', params: { limit: 10 } },
    { type: 'inventory', params: { low_stock: true } },
  ]}
  batchInterval={100} // 批量間隔
  cacheTimeout={5 * 60 * 1000} // 緩存時間
>
  <Dashboard />
</DashboardDataProvider>
```

### 4. Progressive Loading

```typescript
function ProgressiveWidget() {
  const [loadedSections, setLoadedSections] = useState({
    header: true,
    summary: false,
    details: false,
    charts: false,
  });

  useEffect(() => {
    // Progressive loading
    const timers = [
      setTimeout(() => setLoadedSections(prev => ({ ...prev, summary: true })), 100),
      setTimeout(() => setLoadedSections(prev => ({ ...prev, details: true })), 200),
      setTimeout(() => setLoadedSections(prev => ({ ...prev, charts: true })), 300),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div>
      {loadedSections.header && <WidgetHeader />}
      {loadedSections.summary && <WidgetSummary />}
      {loadedSections.details && <WidgetDetails />}
      {loadedSections.charts && <WidgetCharts />}
    </div>
  );
}
```

## 測試策略

### 單元測試

```typescript
// __tests__/MyWidget.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import MyWidget from '../MyWidget';

const mocks = [
  {
    request: {
      query: MY_WIDGET_QUERY,
      variables: { dateRange: null },
    },
    result: {
      data: {
        widgetData: {
          totalCount: 100,
          trend: 'up',
          trendValue: 15,
        },
      },
    },
  },
];

describe('MyWidget', () => {
  it('renders data correctly', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <MyWidget />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('+15%')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    render(
      <MockedProvider mocks={[]}>
        <MyWidget />
      </MockedProvider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });
});
```

### 性能測試

```typescript
// __tests__/MyWidget.performance.test.tsx
import { measureRenderTime } from '@/test-utils/performance';

describe('MyWidget Performance', () => {
  it('renders within performance budget', async () => {
    const renderTime = await measureRenderTime(<MyWidget />);
    
    expect(renderTime).toBeLessThan(100); // 100ms budget
  });

  it('handles large datasets efficiently', async () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const renderTime = await measureRenderTime(
      <MyWidget data={largeData} />
    );
    
    expect(renderTime).toBeLessThan(500); // 500ms for large data
  });
});
```

## 實戰範例

### 完整的 Stats Widget

```typescript
// app/admin/components/dashboard/widgets/AdvancedStatsWidget.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGraphQLFallback } from '@/app/admin/hooks/useGraphQLFallback';
import { MetricCard, ChartContainer, DateRangeFilter } from './common';
import { STATS_OVERVIEW_QUERY } from '@/lib/graphql/queries';
import { getStatsOverview } from '@/app/actions/statsActions';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Package, ShoppingCart, Users } from 'lucide-react';

export interface AdvancedStatsWidgetProps {
  initialDateRange?: { from: Date; to: Date };
}

export default function AdvancedStatsWidget({ 
  initialDateRange 
}: AdvancedStatsWidgetProps) {
  const [dateRange, setDateRange] = React.useState(initialDateRange || {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Fetch data with GraphQL fallback
  const { data, loading, error, refetch, mode, performanceMetrics } = useGraphQLFallback({
    graphqlQuery: STATS_OVERVIEW_QUERY,
    serverAction: getStatsOverview,
    variables: { dateRange },
    widgetId: 'advanced-stats',
    extractFromContext: (ctx) => ctx?.statsData,
    ...GraphQLFallbackPresets.cached,
  });

  // Process chart data
  const chartData = useMemo(() => {
    if (!data?.dailyStats) return [];
    
    return data.dailyStats.map((stat: any) => ({
      date: new Date(stat.date).toLocaleDateString(),
      revenue: stat.revenue,
      orders: stat.orders,
      inventory: stat.inventoryValue,
    }));
  }, [data?.dailyStats]);

  // Metric cards configuration
  const metrics = [
    {
      title: 'Total Revenue',
      value: data?.totalRevenue || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      trend: data?.revenueTrend,
      format: 'currency',
    },
    {
      title: 'Total Orders',
      value: data?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-blue-500',
      trend: data?.ordersTrend,
    },
    {
      title: 'Inventory Value',
      value: data?.inventoryValue || 0,
      icon: Package,
      color: 'text-purple-500',
      trend: data?.inventoryTrend,
      format: 'currency',
    },
    {
      title: 'Active Users',
      value: data?.activeUsers || 0,
      icon: Users,
      color: 'text-orange-500',
      trend: data?.usersTrend,
    },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Business Overview</CardTitle>
        <DateRangeFilter
          value={dateRange}
          onChange={(range) => {
            setDateRange(range);
            refetch();
          }}
          presets={[
            { label: 'Last 7 days', days: 7 },
            { label: 'Last 30 days', days: 30 },
            { label: 'Last 90 days', days: 90 },
          ]}
        />
      </CardHeader>
      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={
                metric.format === 'currency'
                  ? `$${metric.value.toLocaleString()}`
                  : metric.value.toLocaleString()
              }
              icon={metric.icon}
              iconColor={metric.color}
              trend={metric.trend?.direction}
              trendValue={metric.trend?.value}
              loading={loading}
              error={error}
              performanceMetrics={{
                source: mode,
                optimized: true,
                fetchTime: performanceMetrics?.queryTime,
              }}
            />
          ))}
        </div>

        {/* Trend Chart */}
        <ChartContainer
          title="Trends Over Time"
          loading={loading}
          error={error}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                name="Revenue"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                name="Orders"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="inventory"
                stroke="#8b5cf6"
                name="Inventory"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Performance Indicator */}
        {performanceMetrics && (
          <div className="mt-4 text-xs text-muted-foreground text-right">
            Data source: {mode} | Load time: {performanceMetrics.queryTime}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Server Action Example

```typescript
// app/actions/statsActions.ts
'use server';

import { createClient } from '@/app/utils/supabase/server';
import { unstable_cache } from 'next/cache';

export async function getStatsOverview(params: {
  dateRange: { from: Date; to: Date };
}) {
  const supabase = createClient();
  
  // Batch multiple queries
  const [revenueData, ordersData, inventoryData, usersData] = await Promise.all([
    supabase
      .from('record_orders')
      .select('total_amount')
      .gte('created_at', params.dateRange.from.toISOString())
      .lte('created_at', params.dateRange.to.toISOString()),
    
    supabase
      .from('record_orders')
      .select('id')
      .gte('created_at', params.dateRange.from.toISOString())
      .lte('created_at', params.dateRange.to.toISOString()),
    
    supabase
      .from('record_inventory')
      .select('quantity, unit_price'),
    
    supabase
      .from('data_id')
      .select('id')
      .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Process data
  const totalRevenue = revenueData.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const totalOrders = ordersData.data?.length || 0;
  const inventoryValue = inventoryData.data?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
  const activeUsers = usersData.data?.length || 0;

  // Get daily stats
  const { data: dailyStats } = await supabase
    .rpc('get_daily_stats', {
      start_date: params.dateRange.from.toISOString(),
      end_date: params.dateRange.to.toISOString(),
    });

  return {
    totalRevenue,
    totalOrders,
    inventoryValue,
    activeUsers,
    dailyStats,
    revenueTrend: calculateTrend(totalRevenue, 'revenue'),
    ordersTrend: calculateTrend(totalOrders, 'orders'),
    inventoryTrend: calculateTrend(inventoryValue, 'inventory'),
    usersTrend: calculateTrend(activeUsers, 'users'),
    _fetchTime: Date.now(),
  };
}

// Cache the function
export const getCachedStatsOverview = unstable_cache(
  getStatsOverview,
  ['stats-overview'],
  {
    revalidate: 300, // 5 minutes
    tags: ['stats'],
  }
);

function calculateTrend(currentValue: number, type: string) {
  // Simplified trend calculation
  const previousValue = currentValue * 0.9; // Mock previous value
  const change = ((currentValue - previousValue) / previousValue) * 100;
  
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
  };
}
```

## 總結

遵循呢個指南可以確保你創建嘅 widgets：

1. **性能優異** - 使用 SSR、懶加載同批量查詢
2. **用戶體驗良好** - 有適當嘅 loading、error 狀態處理
3. **可維護** - 使用通用組件同標準化結構
4. **可測試** - 有完整嘅測試覆蓋
5. **可擴展** - 易於添加新功能同修改

記住要充分利用 Widget Registry 系統同通用組件，避免重複造輪子！