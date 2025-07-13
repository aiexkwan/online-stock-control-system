# Widget 性能優化指南

**版本**: 1.0.0  
**最後更新**: 2025-07-11  
**適用對象**: 前端開發人員  

## 目錄

1. [性能優化概述](#性能優化概述)
2. [Bundle Size 優化](#bundle-size-優化)
3. [加載性能優化](#加載性能優化)
4. [渲染性能優化](#渲染性能優化)
5. [數據獲取優化](#數據獲取優化)
6. [緩存策略優化](#緩存策略優化)
7. [性能監控與分析](#性能監控與分析)
8. [最佳實踐檢查清單](#最佳實踐檢查清單)

## 性能優化概述

NewPennine Widget 系統已實現 93% bundle size 減少，本指南將幫助你進一步優化 widget 性能。

### 性能目標

- **首屏加載時間 (FCP)**: < 1.5s
- **最大內容繪製 (LCP)**: < 2.5s
- **首次輸入延遲 (FID)**: < 100ms
- **累積佈局偏移 (CLS)**: < 0.1
- **Widget 加載時間**: < 100ms (p90)
- **Bundle Size**: < 200KB per chunk

## Bundle Size 優化

### 1. 動態導入與代碼分割

```typescript
// ❌ 避免：靜態導入大型庫
import { Chart } from 'recharts';
import * as ExcelJS from 'exceljs';

// ✅ 推薦：動態導入
const Chart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.Chart })),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false 
  }
);

// 按需加載重型功能
const handleExport = async () => {
  const ExcelJS = await import('exceljs');
  // 使用 ExcelJS
};
```

### 2. Tree Shaking 優化

```typescript
// ❌ 避免：導入整個庫
import _ from 'lodash';

// ✅ 推薦：只導入需要的函數
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### 3. 使用輕量級替代品

```typescript
// 替代 moment.js (279KB) 
import { format } from 'date-fns'; // 或 dayjs (7KB)

// 替代 lodash (71KB)
import { debounce } from '@/lib/utils'; // 自定義實現

// 替代 axios (53KB)
// 使用原生 fetch API 或輕量級封裝
```

### 4. 圖片優化

```typescript
// 使用 Next.js Image 組件
import Image from 'next/image';

<Image
  src="/widget-icon.png"
  alt="Widget Icon"
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
  blurDataURL={shimmerDataUrl}
/>

// WebP/AVIF 格式支持
<picture>
  <source srcSet="/image.avif" type="image/avif" />
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="Fallback" />
</picture>
```

## 加載性能優化

### 1. Critical Path 優化

```typescript
// lib/widgets/critical-widgets.ts
export const CRITICAL_WIDGETS = [
  'stats-overview',
  'recent-orders',
  'inventory-alerts',
];

// 預加載關鍵 widgets
export async function preloadCriticalWidgets() {
  const promises = CRITICAL_WIDGETS.map(widgetId => {
    const config = widgetConfig[widgetId];
    return config?.loader();
  });
  
  await Promise.all(promises);
}
```

### 2. Progressive Enhancement

```typescript
export function ProgressiveWidget() {
  const [enhancementLevel, setEnhancementLevel] = useState<
    'basic' | 'enhanced' | 'full'
  >('basic');
  
  useEffect(() => {
    // 漸進式增強
    requestIdleCallback(() => {
      setEnhancementLevel('enhanced');
      
      // 進一步增強
      requestIdleCallback(() => {
        setEnhancementLevel('full');
      });
    });
  }, []);
  
  return (
    <>
      {/* 基礎功能 - 立即顯示 */}
      <BasicWidgetContent />
      
      {/* 增強功能 - 延遲加載 */}
      {enhancementLevel !== 'basic' && <EnhancedFeatures />}
      
      {/* 完整功能 - 最後加載 */}
      {enhancementLevel === 'full' && <FullFeatures />}
    </>
  );
}
```

### 3. Resource Hints

```typescript
// app/admin/layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        {/* 預連接關鍵資源 */}
        <link rel="preconnect" href="https://api.example.com" />
        <link rel="dns-prefetch" href="https://cdn.example.com" />
        
        {/* 預加載關鍵字體 */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* 預取下一頁資源 */}
        <link rel="prefetch" href="/api/dashboard-data" />
      </Head>
      {children}
    </>
  );
}
```

## 渲染性能優化

### 1. React.memo 優化

```typescript
// 優化昂貴的組件
export const ExpensiveWidget = React.memo(
  ({ data, options }: WidgetProps) => {
    // Widget 實現
    return <WidgetContent data={data} />;
  },
  (prevProps, nextProps) => {
    // 自定義比較邏輯
    return (
      prevProps.data.id === nextProps.data.id &&
      prevProps.options.refreshInterval === nextProps.options.refreshInterval
    );
  }
);
```

### 2. useMemo 與 useCallback

```typescript
export function DataWidget({ items, filters }: Props) {
  // 緩存昂貴計算
  const processedData = useMemo(() => {
    return items
      .filter(item => matchesFilters(item, filters))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100);
  }, [items, filters]);
  
  // 緩存回調函數
  const handleItemClick = useCallback((itemId: string) => {
    router.push(`/items/${itemId}`);
  }, [router]);
  
  return (
    <DataList
      items={processedData}
      onItemClick={handleItemClick}
    />
  );
}
```

### 3. 虛擬滾動

```typescript
import { FixedSizeList } from 'react-window';

export function LargeListWidget({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      <ItemRow item={items[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 4. 防抖與節流

```typescript
import { useDebouncedCallback } from 'use-debounce';

export function SearchWidget() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 防抖搜索
  const debouncedSearch = useDebouncedCallback(
    (term: string) => {
      performSearch(term);
    },
    300 // 300ms 延遲
  );
  
  // 節流滾動
  const handleScroll = useThrottle((e: Event) => {
    updateScrollPosition(e);
  }, 100); // 每 100ms 最多執行一次
  
  return (
    <input
      onChange={(e) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

## 數據獲取優化

### 1. 批量查詢

```typescript
// 使用 DashboardDataContext 批量獲取數據
const DASHBOARD_BATCH_QUERY = gql`
  query GetDashboardData($dateRange: DateRangeInput!) {
    stats: getStats(dateRange: $dateRange) {
      revenue
      orders
      customers
    }
    inventory: getInventory {
      totalItems
      lowStockCount
    }
    recentOrders: getRecentOrders(limit: 10) {
      id
      total
      status
    }
  }
`;

// 一次查詢獲取所有數據
const { data } = useQuery(DASHBOARD_BATCH_QUERY, {
  variables: { dateRange },
});
```

### 2. 並行請求

```typescript
export async function fetchWidgetData() {
  // ❌ 避免：串行請求
  const stats = await fetchStats();
  const orders = await fetchOrders();
  const inventory = await fetchInventory();
  
  // ✅ 推薦：並行請求
  const [stats, orders, inventory] = await Promise.all([
    fetchStats(),
    fetchOrders(),
    fetchInventory(),
  ]);
  
  return { stats, orders, inventory };
}
```

### 3. 數據預取

```typescript
// 預取下一頁數據
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['orders', { page: currentPage + 1 }],
    queryFn: () => fetchOrders({ page: currentPage + 1 }),
    staleTime: 10 * 60 * 1000, // 10 分鐘
  });
};

// 基於用戶行為預取
useEffect(() => {
  if (userHoveredOnNextButton) {
    prefetchNextPage();
  }
}, [userHoveredOnNextButton]);
```

## 緩存策略優化

### 1. 智能 TTL 設置

```typescript
// 根據數據特性設置不同的 TTL
const getCacheTTL = (dataType: string): number => {
  switch (dataType) {
    case 'user-profile':
      return 3600; // 1 小時
    case 'product-catalog':
      return 1800; // 30 分鐘
    case 'inventory-levels':
      return 300; // 5 分鐘
    case 'real-time-orders':
      return 30; // 30 秒
    default:
      return 600; // 默認 10 分鐘
  }
};
```

### 2. Stale-While-Revalidate 實施

```typescript
const { data } = useWidgetSmartCache({
  widgetId: 'inventory-widget',
  fetchFn: fetchInventoryData,
  customCacheConfig: {
    baseTTL: 300, // 5 分鐘
    enableSWR: true,
    swrWindow: 60, // 1 分鐘 stale window
  },
});

// 數據會在 5 分鐘後標記為 stale
// 但在接下來的 1 分鐘內仍會返回舊數據
// 同時在後台獲取新數據
```

### 3. 預測性緩存

```typescript
// 基於用戶行為模式預測
const predictCacheNeeds = (userActivity: UserActivity) => {
  const predictions = [];
  
  // 工作時間更可能查看報表
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 10) {
    predictions.push({
      widget: 'daily-report',
      probability: 0.85,
      preloadIn: 300, // 5 分鐘後
    });
  }
  
  // 月底更可能查看月度總結
  const date = new Date().getDate();
  if (date >= 28) {
    predictions.push({
      widget: 'monthly-summary',
      probability: 0.9,
      preloadIn: 600, // 10 分鐘後
    });
  }
  
  return predictions;
};
```

## 性能監控與分析

### 1. 實時性能指標

```typescript
import { useRealtimePerformanceMonitor } from '@/app/admin/hooks/useWidgetPerformanceTracking';

export function PerformanceDashboard() {
  const { metrics, startMonitoring } = useRealtimePerformanceMonitor();
  
  useEffect(() => {
    startMonitoring();
  }, []);
  
  return (
    <div>
      <MetricCard
        title="平均加載時間"
        value={`${metrics?.global?.v2?.avgLoadTime?.toFixed(0) || 0}ms`}
        target="< 100ms"
        status={
          metrics?.global?.v2?.avgLoadTime < 100 ? 'good' : 'warning'
        }
      />
    </div>
  );
}
```

### 2. 性能預算監控

```typescript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 200000, // 200KB
    maxEntrypointSize: 250000, // 250KB
    hints: 'error', // 超出預算時報錯
    assetFilter: (assetFilename) => {
      // 只檢查 JS 和 CSS 文件
      return /\.(js|css)$/.test(assetFilename);
    },
  },
};
```

### 3. 自動性能報告

```typescript
// 每日性能報告
const schedulePerformanceReports = () => {
  // 每天早上 9 點生成報告
  cron.schedule('0 9 * * *', async () => {
    const report = enhancedPerformanceMonitor.generateReport('daily');
    
    // 檢查性能退化
    if (report.summary.performanceScore < 80) {
      await notifyTeam({
        title: '性能警告',
        message: `性能分數降至 ${report.summary.performanceScore}`,
        criticalIssues: report.criticalIssues,
      });
    }
  });
};
```

## 最佳實踐檢查清單

### 開發階段

- [ ] 使用動態導入分割代碼
- [ ] 實施 React.memo 優化重渲染
- [ ] 使用 useMemo/useCallback 緩存昂貴操作
- [ ] 為大列表實施虛擬滾動
- [ ] 優化圖片格式和加載策略
- [ ] 實施智能緩存策略
- [ ] 添加性能追蹤代碼

### 測試階段

- [ ] 運行 Lighthouse 性能測試
- [ ] 檢查 bundle size 分析報告
- [ ] 測試慢速網絡下的性能
- [ ] 驗證緩存策略有效性
- [ ] 檢查內存洩漏
- [ ] 測試並發請求優化

### 部署階段

- [ ] 啟用 Gzip/Brotli 壓縮
- [ ] 配置 CDN 緩存策略
- [ ] 啟用 HTTP/2 或 HTTP/3
- [ ] 設置性能監控警報
- [ ] 配置自動性能報告
- [ ] 實施 A/B 測試追蹤

### 維護階段

- [ ] 定期審查性能指標
- [ ] 更新依賴到最新版本
- [ ] 優化新增功能的性能
- [ ] 分析用戶行為優化緩存
- [ ] 調整性能預算
- [ ] 記錄性能優化決策

## 性能優化工具

### 分析工具

```bash
# Bundle 分析
npm run analyze

# 性能測試
npm run test:perf

# Lighthouse CI
npm run lighthouse
```

### 監控工具

- Chrome DevTools Performance
- React DevTools Profiler
- Web Vitals Extension
- Bundle Analyzer
- Performance Monitor Dashboard

## 總結

遵循本指南的優化建議，你可以確保 widgets：

1. **快速加載** - 優化 bundle size 和加載策略
2. **流暢運行** - 優化渲染和運行時性能
3. **高效緩存** - 智能緩存減少網絡請求
4. **持續監控** - 及時發現和解決性能問題

記住：性能優化是持續的過程，需要不斷測量、分析和改進。

---

*最後審核: 2025-07-11 | 下次審核: 2025-02-11*