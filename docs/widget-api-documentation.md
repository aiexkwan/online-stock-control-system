# Widget System API Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-07-11  
**API Stability**: Stable  

## Table of Contents

1. [Core Hooks](#core-hooks)
2. [Cache System API](#cache-system-api)
3. [Performance Monitoring API](#performance-monitoring-api)
4. [Widget Configuration API](#widget-configuration-api)
5. [Utility Functions](#utility-functions)
6. [Type Definitions](#type-definitions)

## Core Hooks

### useWidgetSmartCache

智能緩存 hook，提供自動化的數據獲取和緩存管理。

```typescript
function useWidgetSmartCache<T>(
  options: UseWidgetSmartCacheOptions<T>
): UseWidgetSmartCacheResult<T>
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| widgetId | string | ✓ | Widget 的唯一標識符 |
| dataSource | WidgetDataSource | ✓ | 數據源類型：'graphql' \| 'server-action' \| 'batch' \| 'mixed' \| 'none' |
| dataMode | WidgetDataMode | ✓ | 數據模式：'read-only' \| 'write-only' \| 'read-write' \| 'real-time' |
| priority | WidgetPriority | ✓ | 優先級：'critical' \| 'high' \| 'normal' \| 'low' |
| fetchFn | (params: any) => Promise<T> | ✓ | 數據獲取函數 |
| params | object | ✗ | 查詢參數，包含 dateRange 和 filters |
| enabled | boolean | ✗ | 是否啟用查詢（默認：true）|
| customCacheConfig | Partial<WidgetCacheConfig> | ✗ | 自定義緩存配置 |
| onDataUpdate | (data: T) => void | ✗ | 數據更新回調 |
| predictiveConfig | object | ✗ | 預測性預加載配置 |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| data | T \| undefined | 獲取的數據 |
| isLoading | boolean | 加載狀態 |
| isError | boolean | 錯誤狀態 |
| error | Error \| null | 錯誤對象 |
| isStale | boolean | 數據是否過期 |
| isFetching | boolean | 是否正在獲取數據 |
| refetch | () => void | 手動刷新數據 |
| invalidate | () => void | 使緩存失效 |
| cacheMetrics | object | 緩存性能指標 |

#### Example

```typescript
const { data, isLoading, error, refetch } = useWidgetSmartCache({
  widgetId: 'inventory-stats',
  dataSource: 'graphql',
  dataMode: 'read-only',
  priority: 'high',
  fetchFn: async (params) => {
    return await fetchInventoryStats(params);
  },
  params: {
    dateRange: {
      from: new Date('2025-01-01'),
      to: new Date(),
    },
  },
  customCacheConfig: {
    baseTTL: 300,
    enableSWR: true,
    swrWindow: 60,
  },
});
```

### useWidgetPerformanceTracking

性能追蹤 hook，自動監控 widget 的加載時間、錯誤率等指標。

```typescript
function useWidgetPerformanceTracking(
  options: UseWidgetPerformanceTrackingOptions
): UseWidgetPerformanceTrackingResult
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| widgetId | string | ✓ | Widget 標識符 |
| variant | 'v2' \| 'legacy' | ✗ | Widget 版本（默認：'v2'）|
| enableAutoTracking | boolean | ✗ | 自動追蹤（默認：true）|
| abTest | object | ✗ | A/B 測試配置 |
| customMetrics | Record<string, any> | ✗ | 自定義指標 |

#### Returns

| Method | Type | Description |
|--------|------|-------------|
| startTracking | () => void | 開始性能追蹤 |
| stopTracking | () => void | 停止追蹤並記錄結果 |
| trackRender | () => void | 標記渲染開始時間 |
| trackDataFetch | <T>(fn: () => Promise<T>) => Promise<T> | 追蹤數據獲取性能 |
| trackError | (error: Error, type?: ErrorType) => void | 記錄錯誤 |
| getMetrics | () => Metrics | 獲取當前性能指標 |
| isTestVariant | boolean | 是否為測試變體 |
| trackConversion | (type: string) => void | 追蹤轉換事件 |

#### Example

```typescript
const {
  trackError,
  trackDataFetch,
  trackConversion,
} = useWidgetPerformanceTracking({
  widgetId: 'checkout-button',
  abTest: {
    testId: 'green-button-test',
    variant: 'test',
  },
});

// 追蹤數據獲取
const data = await trackDataFetch(async () => {
  return await api.fetchData();
});

// 追蹤轉換
trackConversion('purchase_completed');
```

### usePerformanceReports

訪問性能報告和分析功能。

```typescript
function usePerformanceReports(): UsePerformanceReportsResult
```

#### Returns

| Method | Type | Description |
|--------|------|-------------|
| generateReport | (type: ReportType, range?: DateRange) => Report | 生成性能報告 |
| getABTestResults | (testId: string) => ABTestResults | 獲取 A/B 測試結果 |
| exportPerformanceData | (format: 'json' \| 'csv') => string | 導出性能數據 |
| detectAnomalies | (widgetId: string, sensitivity?: number) => Issue[] | 檢測性能異常 |

### useRealtimePerformanceMonitor

實時性能監控 hook。

```typescript
function useRealtimePerformanceMonitor(
  widgetId?: string
): UseRealtimePerformanceMonitorResult
```

#### Returns

| Property/Method | Type | Description |
|-----------------|------|-------------|
| metrics | RealtimeMetrics \| null | 實時性能指標 |
| isMonitoring | boolean | 是否正在監控 |
| startMonitoring | () => void | 開始監控 |
| stopMonitoring | () => void | 停止監控 |

## Cache System API

### Smart Cache Strategy

```typescript
// 緩存策略預設
export const CACHE_STRATEGIES = {
  REALTIME: {
    baseTTL: 5,
    enableSWR: true,
    swrWindow: 10,
    enablePreload: false,
    dateRangeAware: false,
  },
  DYNAMIC: {
    baseTTL: 60,
    enableSWR: true,
    swrWindow: 30,
    enablePreload: true,
    preloadTiming: 10,
    dateRangeAware: true,
  },
  STANDARD: {
    baseTTL: 300,
    enableSWR: true,
    swrWindow: 60,
    enablePreload: true,
    preloadTiming: 30,
    dateRangeAware: true,
  },
  STABLE: {
    baseTTL: 1800,
    enableSWR: true,
    swrWindow: 300,
    enablePreload: true,
    preloadTiming: 120,
    dateRangeAware: true,
  },
  STATIC: {
    baseTTL: 3600,
    enableSWR: false,
    enablePreload: false,
    dateRangeAware: false,
  },
};
```

### SmartTTLManager

動態 TTL 管理器。

```typescript
class SmartTTLManager {
  static calculateTTL(params: TTLParams): number;
  static shouldPreload(entry: CacheEntry, config: WidgetCacheConfig): boolean;
  static isStaleButUsable(entry: CacheEntry, config: WidgetCacheConfig): boolean;
}
```

### DateRangeCacheKeyGenerator

日期範圍感知的緩存鍵生成器。

```typescript
class DateRangeCacheKeyGenerator {
  static generate(params: CacheKeyParams): string;
  static rangesOverlap(range1: DateRange, range2: DateRange): boolean;
}
```

### PredictivePreloader

預測性預加載管理器。

```typescript
class PredictivePreloader {
  schedulePreload(
    widgetId: string,
    loadFunction: () => Promise<any>,
    prediction: PredictionConfig
  ): void;
  
  cancelPreload(widgetId: string): void;
  clearAll(): void;
}
```

## Performance Monitoring API

### EnhancedPerformanceMonitor

增強性能監控器單例。

```typescript
class EnhancedPerformanceMonitor {
  static getInstance(): EnhancedPerformanceMonitor;
  
  recordError(error: ErrorMetrics): void;
  getErrorRate(widgetId: string, timeRange?: DateRange): number;
  getErrorBreakdown(widgetId: string): Map<string, number>;
  
  setupABTest(config: ABTestConfig): void;
  analyzeABTest(testId: string): ABTestResults | null;
  
  generateReport(type: ReportType, range?: DateRange): AutomatedPerformanceReport;
  detectAnomalies(widgetId: string, sensitivity?: number): PerformanceIssue[];
  exportData(format: 'json' | 'csv'): string;
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  widgetId: string;
  timestamp: number;
  loadTime: number;
  renderTime: number;
  dataFetchTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  cumulativeLayoutShift?: number;
  route: string;
  variant: 'v2' | 'legacy';
  sessionId: string;
  userId?: string;
}
```

## Widget Configuration API

### Widget Registry

```typescript
class EnhancedWidgetRegistry {
  register(definition: WidgetDefinition): void;
  getDefinition(widgetId: string): WidgetDefinition | undefined;
  getComponent(widgetId: string): React.ComponentType | undefined;
  getAllDefinitions(): WidgetDefinition[];
  getByCategory(category: WidgetCategory): WidgetDefinition[];
}
```

### Widget Configuration

```typescript
interface WidgetConfig {
  id: string;
  name: string;
  category: WidgetCategory;
  description?: string;
  loader: () => Promise<{ default: React.ComponentType }>;
  dataSource: WidgetDataSource;
  priority: WidgetPriority;
  refreshInterval?: number;
  supportsTimeFrame?: boolean;
  experimental?: boolean;
}
```

### Configuration Helpers

```typescript
// 獲取推薦的緩存策略
function getRecommendedCacheStrategy(
  dataSource: WidgetDataSource,
  dataMode: WidgetDataMode,
  priority: WidgetPriority
): keyof typeof CACHE_STRATEGIES;

// 創建 widget 緩存配置
function createWidgetCacheConfig(
  widgetId: string,
  options: CacheConfigOptions
): WidgetCacheConfig;

// 按優先級獲取 widgets
function getWidgetsByPriority(priority: WidgetPriority): WidgetConfig[];

// 按數據源獲取 widgets
function getWidgetsByDataSource(dataSource: WidgetDataSource): WidgetConfig[];
```

## Utility Functions

### Performance Utilities

```typescript
// 測量渲染時間
async function measureRenderTime(
  component: React.ReactElement
): Promise<number>;

// 捕獲網絡請求
async function captureNetworkRequests(
  callback: () => void
): Promise<NetworkRequest[]>;

// 生成會話 ID
function generateSessionId(): string;

// 判斷錯誤嚴重性
function determineSeverity(
  error: Error,
  errorType: ErrorType
): ErrorSeverity;
```

### Cache Utilities

```typescript
// 使緩存失效
async function invalidateWidgetCache(
  widgetId: string,
  options?: InvalidateOptions
): Promise<void>;

// 預熱緩存
async function warmupCache(
  widgetIds: string[],
  params?: any
): Promise<void>;

// 清理過期緩存
function cleanupExpiredCache(
  olderThan: Date
): void;
```

## Type Definitions

### Core Types

```typescript
// Widget 數據源
type WidgetDataSource = 
  | 'graphql' 
  | 'server-action' 
  | 'batch' 
  | 'mixed' 
  | 'none';

// Widget 數據模式
type WidgetDataMode = 
  | 'read-only' 
  | 'write-only' 
  | 'read-write' 
  | 'real-time';

// Widget 優先級
type WidgetPriority = 
  | 'critical' 
  | 'high' 
  | 'normal' 
  | 'low';

// Widget 類別
enum WidgetCategory {
  Stats = 'stats',
  Charts = 'charts',
  Lists = 'lists',
  Forms = 'forms',
  Reports = 'reports',
  Analysis = 'analysis',
  Upload = 'upload',
  Search = 'search',
  Utilities = 'utilities',
}
```

### Cache Types

```typescript
interface WidgetCacheConfig {
  baseTTL: number;
  enableSWR: boolean;
  swrWindow?: number;
  enablePreload: boolean;
  preloadTiming?: number;
  dateRangeAware: boolean;
  generateKey: (params: CacheKeyParams) => string;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  dateRange?: {
    from: string;
    to: string;
  };
  staleAt?: number;
  preloadAt?: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  staleHits: number;
  preloads: number;
  errors: number;
  avgLoadTime: number;
}
```

### Performance Types

```typescript
interface ErrorMetrics {
  widgetId: string;
  timestamp: number;
  errorType: 'load' | 'render' | 'data-fetch' | 'runtime';
  errorMessage: string;
  errorStack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userImpact: number;
  context: {
    route: string;
    variant: 'v2' | 'legacy';
    sessionId: string;
    userId?: string;
  };
}

interface ABTestConfig {
  testId: string;
  widgetId: string;
  variants: {
    control: string;
    test: string;
  };
  metrics: string[];
  startDate: Date;
  endDate?: Date;
  splitRatio: number;
}

interface ABTestResults {
  testId: string;
  widgetId: string;
  dateRange: DateRange;
  control: VariantMetrics;
  test: VariantMetrics;
  analysis: {
    winner: 'control' | 'test' | 'inconclusive';
    confidence: number;
    improvement: number;
    significanceLevel: number;
  };
  recommendations: string[];
}
```

## Error Handling

### Error Types

```typescript
class WidgetLoadError extends Error {
  constructor(widgetId: string, cause?: Error);
}

class CacheMissError extends Error {
  constructor(cacheKey: string);
}

class PerformanceBudgetExceededError extends Error {
  constructor(metric: string, actual: number, budget: number);
}
```

### Error Recovery

```typescript
// Widget 錯誤邊界
export function WidgetErrorBoundary({ 
  children,
  fallback,
  onError,
}: WidgetErrorBoundaryProps) {
  // 實現錯誤捕獲和恢復
}

// 重試邏輯
export function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>;
```

## Migration Support

### Legacy Widget Detection

```typescript
// 掃描 legacy widgets
async function scanForLegacyWidgets(): Promise<LegacyWidget[]>;

// 分析 widget 遷移需求
function analyzeWidgetMigration(
  widget: LegacyWidget
): MigrationAnalysis;
```

### Migration Helpers

```typescript
// 遷移 legacy widget
async function migrateWidget(
  widgetPath: string,
  options?: MigrationOptions
): Promise<MigrationResult>;

// 驗證遷移結果
function validateMigration(
  before: LegacyWidget,
  after: ModernWidget
): ValidationResult;
```

## Best Practices

### Performance

1. 總是使用 `useWidgetSmartCache` 進行數據獲取
2. 為不同數據類型選擇合適的緩存策略
3. 啟用性能追蹤以監控 widget 健康狀況
4. 使用批量查詢減少網絡請求

### Error Handling

1. 總是提供錯誤狀態 UI
2. 使用 `trackError` 記錄所有錯誤
3. 實施重試邏輯處理暫時性錯誤
4. 提供用戶友好的錯誤信息

### Testing

1. Mock GraphQL 查詢和 Server Actions
2. 測試緩存行為
3. 驗證性能指標
4. 測試錯誤場景

---

*API Version: 1.0.0 | Last Updated: 2025-07-11*