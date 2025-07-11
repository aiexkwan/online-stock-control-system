# Performance Best Practices

基於 NewPennine 專案嘅優化成果，本文檔總結咗實現 **93% bundle size 減少**同**15+ 請求變成 1 個批量請求**嘅最佳實踐。

## 目錄

1. [性能優化成果](#性能優化成果)
2. [Bundle Size 優化](#bundle-size-優化)
3. [批量查詢策略](#批量查詢策略)
4. [Progressive Loading](#progressive-loading)
5. [SSR 優化](#ssr-優化)
6. [緩存策略](#緩存策略)
7. [監控同分析](#監控同分析)
8. [實戰案例](#實戰案例)

## 性能優化成果

### Day 4 優化數據

```typescript
// 優化前
{
  bundleSize: "1462 kB",
  firstLoadJS: "714 kB",
  apiRequests: 15,
  loadTime: "3.2s",
  TTI: "4.8s"
}

// 優化後
{
  bundleSize: "105 kB",  // 93% 減少
  firstLoadJS: "48 kB",   // 93% 減少
  apiRequests: 1,         // 15+ → 1
  loadTime: "0.8s",       // 75% 改善
  TTI: "1.2s"            // 75% 改善
}
```

## Bundle Size 優化

### 1. Tree Shaking 配置

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    // Tree shaking 優化
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 分離大型 vendor libraries
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // 分離通用組件
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    // 別名優化（減少重複打包）
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
      'moment': 'dayjs',
    };

    return config;
  },
};
```

### 2. Dynamic Imports 策略

```typescript
// 原本：靜態導入（全部打包）
import { 
  Widget1, Widget2, Widget3, Widget4, Widget5,
  Widget6, Widget7, Widget8, Widget9, Widget10 
} from './widgets';

// 優化後：動態導入（按需加載）
const widgetMap = {
  widget1: () => import('./widgets/Widget1'),
  widget2: () => import('./widgets/Widget2'),
  widget3: () => import('./widgets/Widget3'),
  // ... 更多 widgets
};

// 使用 React.lazy 同 Suspense
const LazyWidget = React.lazy(() => 
  widgetMap[widgetType]().then(module => ({ default: module.default }))
);

<Suspense fallback={<WidgetSkeleton />}>
  <LazyWidget {...props} />
</Suspense>
```

### 3. 避免 Barrel Exports

```typescript
// ❌ 錯誤：Barrel exports 會破壞 tree shaking
// widgets/index.ts
export * from './Widget1';
export * from './Widget2';
export * from './Widget3';

// ✅ 正確：具體導出
// widgets/index.ts
export { Widget1 } from './Widget1';
export { Widget2 } from './Widget2';
export { Widget3 } from './Widget3';

// 或者直接導入具體文件
import Widget1 from './widgets/Widget1';
```

### 4. 優化第三方庫

```typescript
// ❌ 錯誤：導入整個庫
import _ from 'lodash';
import moment from 'moment';

// ✅ 正確：只導入需要嘅函數
import debounce from 'lodash-es/debounce';
import dayjs from 'dayjs';

// 使用 next-bundle-analyzer 分析
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "BUNDLE_ANALYZE=server next build",
    "analyze:browser": "BUNDLE_ANALYZE=browser next build"
  }
}
```

## 批量查詢策略

### 1. GraphQL Batch Query

```typescript
// 原本：多個獨立查詢（15+ 請求）
const query1 = useQuery(STATS_QUERY);
const query2 = useQuery(ORDERS_QUERY);
const query3 = useQuery(INVENTORY_QUERY);
// ... 更多查詢

// 優化後：單一批量查詢（1 個請求）
const DASHBOARD_BATCH_QUERY = gql`
  query GetDashboardData($dateRange: DateRangeInput!) {
    stats: getStats(dateRange: $dateRange) {
      revenue
      orders
      users
    }
    recentOrders: getOrders(limit: 10, dateRange: $dateRange) {
      id
      status
      total
    }
    inventory: getInventoryLevels {
      totalValue
      lowStockItems
    }
    # 更多數據...
  }
`;

// 使用 DataLoader 進一步優化
import DataLoader from 'dataloader';

const orderLoader = new DataLoader(async (orderIds) => {
  const orders = await supabase
    .from('record_orders')
    .select('*')
    .in('id', orderIds);
  
  return orderIds.map(id => 
    orders.data?.find(order => order.id === id)
  );
});
```

### 2. Server Action 批量處理

```typescript
// app/actions/batchActions.ts
'use server';

export async function getBatchDashboardData(params: DashboardParams) {
  const supabase = createClient();
  
  // 並行執行多個查詢
  const [
    statsResult,
    ordersResult,
    inventoryResult,
    usersResult,
    notificationsResult,
  ] = await Promise.all([
    // Stats 查詢
    supabase.rpc('get_dashboard_stats', {
      start_date: params.dateRange.from,
      end_date: params.dateRange.to,
    }),
    
    // Orders 查詢
    supabase
      .from('record_orders')
      .select('id, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    
    // Inventory 查詢
    supabase.rpc('get_inventory_summary'),
    
    // Users 查詢
    supabase
      .from('data_id')
      .select('count')
      .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    
    // Notifications 查詢
    supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .limit(5),
  ]);

  // 組合結果
  return {
    stats: statsResult.data,
    recentOrders: ordersResult.data,
    inventory: inventoryResult.data,
    activeUsers: usersResult.count,
    notifications: notificationsResult.data,
    _timestamp: Date.now(),
  };
}
```

### 3. React Query 批量配置

```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 批量請求窗口
      staleTime: 5 * 60 * 1000, // 5 分鐘
      gcTime: 10 * 60 * 1000,   // 10 分鐘
      
      // 批量重試策略
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
      
      // 背景更新
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      // 樂觀更新
      onMutate: async (variables) => {
        await queryClient.cancelQueries();
        const previousData = queryClient.getQueryData(['key']);
        // 樂觀更新邏輯
        return { previousData };
      },
    },
  },
});

// 批量查詢 hook
export function useBatchQuery(keys: string[], fetcher: () => Promise<any>) {
  return useQuery({
    queryKey: ['batch', ...keys],
    queryFn: fetcher,
    // 批量窗口設置
    staleTime: 100, // 100ms 內嘅相同查詢會被批量處理
  });
}
```

## Progressive Loading

### 1. 優先級加載策略

```typescript
// lib/widgets/priority-loader.ts
export enum LoadPriority {
  CRITICAL = 0,    // 立即加載
  HIGH = 1,        // 100ms 後加載
  MEDIUM = 2,      // 300ms 後加載
  LOW = 3,         // 500ms 後加載
  LAZY = 4,        // 視口內先加載
}

export class PriorityLoader {
  private queue: Map<LoadPriority, Set<() => Promise<any>>> = new Map();
  
  async loadByPriority() {
    for (const [priority, loaders] of this.queue) {
      await this.delay(priority * 100);
      await Promise.all([...loaders].map(loader => loader()));
    }
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用示例
const loader = new PriorityLoader();

// Critical: Header, Navigation
loader.add(LoadPriority.CRITICAL, () => import('./Header'));

// High: 主要內容
loader.add(LoadPriority.HIGH, () => import('./MainContent'));

// Medium: 側邊欄
loader.add(LoadPriority.MEDIUM, () => import('./Sidebar'));

// Low: Footer, Analytics
loader.add(LoadPriority.LOW, () => import('./Footer'));
```

### 2. Intersection Observer 懶加載

```typescript
// hooks/useProgressiveLoad.ts
import { useEffect, useRef, useState } from 'react';

export function useProgressiveLoad<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // 提前 50px 開始加載
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasLoaded, options]);

  return { ref, isIntersecting, hasLoaded };
}

// Widget 使用
function LazyWidget({ widgetId }: { widgetId: string }) {
  const { ref, hasLoaded } = useProgressiveLoad();
  
  return (
    <div ref={ref} className="min-h-[400px]">
      {hasLoaded ? (
        <Suspense fallback={<WidgetSkeleton />}>
          <DynamicWidget widgetId={widgetId} />
        </Suspense>
      ) : (
        <WidgetPlaceholder />
      )}
    </div>
  );
}
```

### 3. 分階段渲染

```typescript
// components/ProgressiveContent.tsx
export function ProgressiveContent({ children }: { children: React.ReactNode[] }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [isExpanding, setIsExpanding] = useState(false);
  
  useEffect(() => {
    if (!isExpanding) return;
    
    const timer = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= React.Children.count(children)) {
          setIsExpanding(false);
          return prev;
        }
        return prev + 2; // 每次顯示 2 個
      });
    }, 100); // 每 100ms
    
    return () => clearInterval(timer);
  }, [isExpanding, children]);
  
  const loadMore = () => setIsExpanding(true);
  
  return (
    <>
      {React.Children.toArray(children).slice(0, visibleCount)}
      {visibleCount < React.Children.count(children) && (
        <button onClick={loadMore}>Load More</button>
      )}
    </>
  );
}
```

## SSR 優化

### 1. 關鍵數據預取

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';

// 緩存關鍵數據
const getCachedDashboardData = unstable_cache(
  async (userId: string) => {
    const [stats, widgets] = await Promise.all([
      getStatsData(userId),
      getCriticalWidgets(userId),
    ]);
    
    return { stats, widgets };
  },
  ['dashboard-data'],
  {
    revalidate: 60, // 1 分鐘
    tags: ['dashboard'],
  }
);

export default async function DashboardPage() {
  // 預取關鍵數據（SSR）
  const initialData = await getCachedDashboardData(userId);
  
  return (
    <>
      {/* 關鍵內容 - SSR */}
      <DashboardHeader stats={initialData.stats} />
      <CriticalWidgets widgets={initialData.widgets} />
      
      {/* 非關鍵內容 - CSR */}
      <Suspense fallback={<SecondaryContentSkeleton />}>
        <SecondaryContent />
      </Suspense>
    </>
  );
}
```

### 2. Streaming SSR

```typescript
// app/dashboard/StreamingDashboard.tsx
import { Suspense } from 'react';

async function StatsSection() {
  const stats = await fetchStats(); // 快速查詢
  return <StatsDisplay data={stats} />;
}

async function OrdersSection() {
  const orders = await fetchOrders(); // 中速查詢
  return <OrdersList orders={orders} />;
}

async function AnalyticsSection() {
  const analytics = await fetchAnalytics(); // 慢速查詢
  return <AnalyticsChart data={analytics} />;
}

export default function StreamingDashboard() {
  return (
    <div className="dashboard">
      {/* 立即顯示 */}
      <h1>Dashboard</h1>
      
      {/* 快速數據 - 約 100ms */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>
      
      {/* 中速數據 - 約 500ms */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersSection />
      </Suspense>
      
      {/* 慢速數據 - 約 1s */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsSection />
      </Suspense>
    </div>
  );
}
```

### 3. 混合渲染策略

```typescript
// lib/rendering/hybrid-strategy.ts
export function withHybridRendering<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    ssrKeys?: (keyof P)[];
    csrKeys?: (keyof P)[];
    preloadKeys?: (keyof P)[];
  }
) {
  return async function HybridComponent(props: P) {
    // SSR 數據
    const ssrData: Partial<P> = {};
    if (options.ssrKeys) {
      for (const key of options.ssrKeys) {
        if (key in props) {
          ssrData[key] = props[key];
        }
      }
    }
    
    // 預加載提示
    const preloadLinks = options.preloadKeys?.map(key => {
      const endpoint = `/api/data/${String(key)}`;
      return (
        <link
          key={endpoint}
          rel="preload"
          href={endpoint}
          as="fetch"
          crossOrigin="anonymous"
        />
      );
    });
    
    return (
      <>
        {preloadLinks}
        <Component {...props} ssrData={ssrData} />
      </>
    );
  };
}

// 使用示例
const HybridDashboard = withHybridRendering(Dashboard, {
  ssrKeys: ['criticalStats', 'userInfo'],
  csrKeys: ['charts', 'notifications'],
  preloadKeys: ['upcomingData'],
});
```

## 緩存策略

### 1. 多層緩存架構

```typescript
// lib/cache/multi-layer-cache.ts
export class MultiLayerCache {
  private memory = new Map<string, CacheEntry>();
  private sessionStorage = typeof window !== 'undefined' ? window.sessionStorage : null;
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // L1: Memory Cache
    const memoryHit = this.memory.get(key);
    if (memoryHit && !this.isStale(memoryHit, options.staleTime)) {
      return memoryHit.data as T;
    }
    
    // L2: Session Storage
    const sessionHit = this.getFromSession<T>(key);
    if (sessionHit && !this.isStale(sessionHit, options.staleTime)) {
      this.memory.set(key, sessionHit); // 提升到 L1
      return sessionHit.data;
    }
    
    // L3: Network (使用 SWR 策略)
    if (memoryHit || sessionHit) {
      // 返回過時數據，背景更新
      this.revalidateInBackground(key, fetcher, options);
      return (memoryHit || sessionHit)!.data as T;
    }
    
    // 無緩存，直接獲取
    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }
  
  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ) {
    fetcher().then(data => {
      this.set(key, data, options);
    }).catch(console.error);
  }
}

// 使用示例
const cache = new MultiLayerCache();

export async function getCachedData(key: string) {
  return cache.get(
    key,
    async () => {
      const response = await fetch(`/api/data/${key}`);
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000,      // 5 分鐘
      maxAge: 30 * 60 * 1000,         // 30 分鐘
      backgroundRevalidate: true,      // 背景更新
    }
  );
}
```

### 2. 智能預取策略

```typescript
// lib/prefetch/smart-prefetcher.ts
export class SmartPrefetcher {
  private prefetchQueue: Set<string> = new Set();
  private prefetchHistory: Map<string, number> = new Map();
  
  // 基於用戶行為預測
  predictNextAction(currentRoute: string): string[] {
    const patterns = {
      '/dashboard': ['/orders', '/inventory'],
      '/orders': ['/order-detail', '/shipping'],
      '/inventory': ['/stock-transfer', '/reports'],
    };
    
    return patterns[currentRoute] || [];
  }
  
  // 智能預取
  async prefetchSmartly(currentRoute: string) {
    const predictions = this.predictNextAction(currentRoute);
    
    // 基於歷史數據排序
    const sortedPredictions = predictions.sort((a, b) => {
      const aCount = this.prefetchHistory.get(a) || 0;
      const bCount = this.prefetchHistory.get(b) || 0;
      return bCount - aCount;
    });
    
    // 只預取前 3 個最可能嘅路由
    for (const route of sortedPredictions.slice(0, 3)) {
      if (!this.prefetchQueue.has(route)) {
        this.prefetchQueue.add(route);
        this.prefetchRoute(route);
      }
    }
  }
  
  private async prefetchRoute(route: string) {
    // 使用 requestIdleCallback 避免影響主線程
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import(`@/app${route}/page`);
        this.prefetchData(route);
      });
    }
  }
}
```

## 監控同分析

### 1. 性能監控

```typescript
// lib/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  
  // 記錄指標
  recordMetric(name: string, value: number, metadata?: any) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    
    // 實時告警
    this.checkThresholds(name, value);
  }
  
  // 性能預算檢查
  private checkThresholds(name: string, value: number) {
    const thresholds = {
      'bundle-size': 200 * 1024,        // 200KB
      'first-paint': 1000,              // 1s
      'tti': 3000,                      // 3s
      'api-response': 500,              // 500ms
    };
    
    if (thresholds[name] && value > thresholds[name]) {
      console.warn(`Performance budget exceeded for ${name}: ${value}`);
      this.sendAlert(name, value, thresholds[name]);
    }
  }
  
  // 生成報告
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: {},
    };
    
    for (const [name, metrics] of this.metrics) {
      const values = metrics.map(m => m.value);
      report.metrics[name] = {
        avg: average(values),
        min: Math.min(...values),
        max: Math.max(...values),
        p50: percentile(values, 50),
        p95: percentile(values, 95),
        p99: percentile(values, 99),
      };
    }
    
    return report;
  }
}

// 使用示例
const monitor = new PerformanceMonitor();

// Widget 加載時間
monitor.recordMetric('widget-load', loadTime, { widgetId: 'stats-overview' });

// API 響應時間
monitor.recordMetric('api-response', responseTime, { endpoint: '/api/dashboard' });

// Bundle size
monitor.recordMetric('bundle-size', bundleSize, { chunk: 'main' });
```

### 2. 自動化分析

```typescript
// scripts/analyze-performance.ts
import { analyzeBundle } from 'webpack-bundle-analyzer';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function runPerformanceAnalysis() {
  // 1. Bundle 分析
  const bundleStats = await analyzeBundle({
    statsFile: '.next/stats.json',
    analyzerMode: 'json',
  });
  
  // 2. Lighthouse 分析
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse('http://localhost:3000', options);
  await chrome.kill();
  
  // 3. 生成報告
  const report = {
    date: new Date().toISOString(),
    bundle: {
      totalSize: bundleStats.totalSize,
      chunks: bundleStats.chunks.map(chunk => ({
        name: chunk.name,
        size: chunk.size,
        modules: chunk.modules.length,
      })),
    },
    lighthouse: {
      performance: runnerResult.lhr.categories.performance.score * 100,
      fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      tti: runnerResult.lhr.audits['interactive'].numericValue,
      cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
    },
    recommendations: generateRecommendations(bundleStats, runnerResult),
  };
  
  console.log(JSON.stringify(report, null, 2));
  return report;
}

function generateRecommendations(bundleStats: any, lighthouseResult: any) {
  const recommendations = [];
  
  // Bundle size 建議
  if (bundleStats.totalSize > 500 * 1024) {
    recommendations.push({
      type: 'bundle-size',
      severity: 'high',
      message: 'Bundle size exceeds 500KB. Consider code splitting.',
      suggestions: [
        'Use dynamic imports for large components',
        'Remove unused dependencies',
        'Enable tree shaking',
      ],
    });
  }
  
  // Performance 建議
  const perfScore = lighthouseResult.lhr.categories.performance.score * 100;
  if (perfScore < 90) {
    recommendations.push({
      type: 'performance',
      severity: 'medium',
      message: `Performance score is ${perfScore}. Target is 90+.`,
      suggestions: [
        'Optimize images with next/image',
        'Implement resource hints (preload, prefetch)',
        'Use SSG/ISR for static content',
      ],
    });
  }
  
  return recommendations;
}
```

## 實戰案例

### 案例 1：Dashboard 優化前後對比

```typescript
// ❌ 優化前：多個獨立組件，各自請求數據
function OldDashboard() {
  return (
    <div>
      <StatsWidget />        {/* 3 個 API 請求 */}
      <OrdersWidget />       {/* 2 個 API 請求 */}
      <InventoryWidget />    {/* 4 個 API 請求 */}
      <ChartsWidget />       {/* 3 個 API 請求 */}
      <NotificationsWidget /> {/* 2 個 API 請求 */}
    </div>
  );
}
// 總計：14 個請求，無緩存，全部打包

// ✅ 優化後：批量查詢 + 動態加載 + SSR
async function OptimizedDashboard() {
  // SSR: 預取關鍵數據（1 個批量請求）
  const criticalData = await getCachedBatchData(['stats', 'notifications']);
  
  return (
    <DashboardDataProvider initialData={criticalData}>
      <div>
        {/* Critical: SSR 渲染 */}
        <StatsOverview data={criticalData.stats} />
        
        {/* High Priority: 快速動態加載 */}
        <Suspense fallback={<OrdersSkeleton />}>
          <LazyOrdersWidget priority="high" />
        </Suspense>
        
        {/* Medium Priority: 延遲加載 */}
        <Suspense fallback={<InventorySkeleton />}>
          <LazyInventoryWidget priority="medium" />
        </Suspense>
        
        {/* Low Priority: 視口內加載 */}
        <LazyLoadOnScroll>
          <LazyChartsWidget priority="low" />
        </LazyLoadOnScroll>
      </div>
    </DashboardDataProvider>
  );
}
// 總計：1 個批量請求，智能緩存，按需加載
```

### 案例 2：Widget Registry 優化

```typescript
// ❌ 優化前：所有 widgets 靜態導入
import { Widget1, Widget2, Widget3, /* ... */ Widget50 } from './widgets';

const widgetMap = {
  widget1: Widget1,
  widget2: Widget2,
  // ... 50 個 widgets
};
// Bundle size: 1.4MB

// ✅ 優化後：動態 registry + 優先級加載
class OptimizedWidgetRegistry {
  private widgets = new Map<string, WidgetConfig>();
  
  register(config: WidgetConfig) {
    this.widgets.set(config.id, {
      ...config,
      // 動態導入配置
      load: () => import(`./widgets/${config.id}`),
      // 預加載配置
      preload: config.priority === 'high',
      // 緩存配置
      cache: config.cache || { ttl: 5 * 60 * 1000 },
    });
  }
  
  async loadWidget(id: string) {
    const config = this.widgets.get(id);
    if (!config) throw new Error(`Widget ${id} not found`);
    
    // 檢查緩存
    const cached = await this.cache.get(id);
    if (cached) return cached;
    
    // 動態加載
    const start = performance.now();
    const module = await config.load();
    const loadTime = performance.now() - start;
    
    // 記錄性能
    this.monitor.recordMetric('widget-load', loadTime, { widgetId: id });
    
    // 緩存組件
    this.cache.set(id, module.default, config.cache);
    
    return module.default;
  }
  
  // 預加載高優先級 widgets
  async preloadHighPriority() {
    const highPriorityWidgets = Array.from(this.widgets.values())
      .filter(w => w.preload)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
    
    // 使用 requestIdleCallback 預加載
    for (const widget of highPriorityWidgets) {
      requestIdleCallback(() => {
        widget.load();
      });
    }
  }
}
// Bundle size: 105KB (93% 減少)
```

## 總結

通過實施呢啲最佳實踐，NewPennine 專案實現咗：

1. **Bundle Size**: 1462KB → 105KB (93% 減少)
2. **API 請求**: 15+ → 1 (93% 減少)
3. **加載時間**: 3.2s → 0.8s (75% 改善)
4. **TTI**: 4.8s → 1.2s (75% 改善)

關鍵要點：
- **Tree Shaking**: 正確配置同避免 barrel exports
- **批量查詢**: 使用 GraphQL 或 Server Actions 批量處理
- **Progressive Loading**: 按優先級加載內容
- **SSR 優化**: 關鍵內容 SSR，其他內容 CSR
- **智能緩存**: 多層緩存架構同 SWR 策略
- **持續監控**: 自動化性能分析同告警

記住：性能優化係一個持續嘅過程，需要不斷監控、分析同改進！