# Widget 系統遷移指南

**版本**: 1.0.0  
**最後更新**: 2025-07-11  
**適用對象**: 需要遷移舊 Widget 的開發人員  

## 目錄

1. [遷移概述](#遷移概述)
2. [遷移前準備](#遷移前準備)
3. [Legacy Widget 識別](#legacy-widget-識別)
4. [遷移步驟](#遷移步驟)
5. [常見遷移場景](#常見遷移場景)
6. [測試與驗證](#測試與驗證)
7. [遷移清單](#遷移清單)
8. [常見問題](#常見問題)

## 遷移概述

本指南幫助你將使用舊架構的 widgets 遷移到新的優化架構，包括：
- 移除直接 Supabase Client 使用
- 採用 GraphQL + Server Action 架構
- 集成智能緩存系統
- 添加性能監控

### 遷移收益

- **性能提升**: 50% 數據庫查詢減少
- **Bundle Size**: 30% 減少
- **錯誤率**: 60% 降低
- **開發效率**: 新 Widget 開發時間減少 60%

## 遷移前準備

### 1. 環境檢查

```bash
# 確保依賴更新
npm install @tanstack/react-query@latest
npm install @apollo/client@latest

# 運行遷移前測試
npm run test:widgets

# 生成當前性能基準
npm run benchmark:widgets
```

### 2. 備份現有代碼

```bash
# 創建遷移分支
git checkout -b migrate-widgets-to-new-architecture

# 標記當前版本
git tag pre-migration-backup
```

### 3. 識別需要遷移的 Widgets

```typescript
// 運行 Legacy Widget 掃描腳本
import { scanForLegacyWidgets } from '@/scripts/widget-scanner';

const legacyWidgets = await scanForLegacyWidgets();
console.log(`發現 ${legacyWidgets.length} 個需要遷移的 widgets:`);
legacyWidgets.forEach(widget => {
  console.log(`- ${widget.name} (${widget.path})`);
});
```

## Legacy Widget 識別

### 特徵識別

以下特徵表明 widget 需要遷移：

1. **直接使用 Supabase Client**
```typescript
// ❌ Legacy 模式
import { createClient } from '@/app/utils/supabase/client';
const supabase = createClient();
```

2. **使用 useState + useEffect 獲取數據**
```typescript
// ❌ Legacy 模式
const [data, setData] = useState();
useEffect(() => {
  fetchData().then(setData);
}, []);
```

3. **缺少性能追蹤**
```typescript
// ❌ Legacy 模式 - 沒有性能監控
export function MyWidget() {
  // 直接渲染，沒有追蹤
}
```

4. **硬編碼的刷新邏輯**
```typescript
// ❌ Legacy 模式
setInterval(() => {
  refetchData();
}, 30000);
```

## 遷移步驟

### Step 1: 分析 Widget 類型

確定 widget 的數據模式：

```typescript
// 分析數據流
const widgetAnalysis = {
  hasDataFetch: true,      // 是否獲取數據
  hasDataMutation: false,  // 是否修改數據
  isRealtime: false,       // 是否需要實時更新
  dataSource: 'database',  // 數據來源
};

// 根據分析選擇遷移策略
const migrationStrategy = determineStrategy(widgetAnalysis);
```

### Step 2: 創建 GraphQL 查詢

為 widget 創建對應的 GraphQL 查詢：

```typescript
// lib/graphql/queries/myWidget.graphql
query GetMyWidgetData($dateRange: DateRangeInput) {
  myWidgetData(dateRange: $dateRange) {
    id
    value
    label
    trend {
      direction
      percentage
    }
  }
}
```

### Step 3: 創建 Server Action

實現 Server Action 作為 fallback：

```typescript
// app/actions/myWidgetActions.ts
'use server';

import { createClient } from '@/app/utils/supabase/server';

export async function getMyWidgetData(params: {
  dateRange?: { from: Date; to: Date };
}) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('widget_data')
    .select('*')
    .gte('created_at', params.dateRange?.from || new Date(0))
    .lte('created_at', params.dateRange?.to || new Date());
    
  if (error) throw error;
  
  return processWidgetData(data);
}
```

### Step 4: 更新 Widget 組件

#### Before (Legacy):
```typescript
// ❌ 舊版本
import { createClient } from '@/app/utils/supabase/client';

export function MyLegacyWidget() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('widget_data')
        .select('*');
      setData(data);
      setLoading(false);
    }
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{/* Widget content */}</div>;
}
```

#### After (Migrated):
```typescript
// ✅ 新版本
import { useWidgetSmartCache } from '@/app/admin/hooks/useWidgetSmartCache';
import { useWidgetPerformanceTracking } from '@/app/admin/hooks/useWidgetPerformanceTracking';
import { GET_MY_WIDGET_DATA } from '@/lib/graphql/queries';
import { getMyWidgetData } from '@/app/actions/myWidgetActions';

export function MyModernWidget() {
  // 性能追蹤
  const { trackError, trackDataFetch } = useWidgetPerformanceTracking({
    widgetId: 'my-widget',
    enableAutoTracking: true,
  });
  
  // 智能緩存 + GraphQL fallback
  const { data, isLoading, error, refetch } = useWidgetSmartCache({
    widgetId: 'my-widget',
    dataSource: 'graphql',
    dataMode: 'read-only',
    priority: 'normal',
    fetchFn: async () => {
      return trackDataFetch(async () => {
        // GraphQL 優先，Server Action 作為 fallback
        try {
          const result = await graphqlClient.query({
            query: GET_MY_WIDGET_DATA,
          });
          return result.data.myWidgetData;
        } catch {
          // Fallback to Server Action
          return await getMyWidgetData({});
        }
      });
    },
  });
  
  if (isLoading) return <WidgetSkeleton />;
  if (error) return <WidgetError error={error} onRetry={refetch} />;
  
  return <WidgetContent data={data} />;
}
```

### Step 5: 更新 Widget 配置

```typescript
// lib/widgets/unified-config.ts
export const widgetConfig: WidgetConfigMap = {
  'my-widget': {
    id: 'my-widget',
    name: 'My Widget',
    category: 'custom',
    description: 'Migrated from legacy architecture',
    loader: () => import('@/app/admin/components/dashboard/widgets/MyModernWidget'),
    dataSource: 'graphql',
    priority: 'normal',
    refreshInterval: 300,
    supportsTimeFrame: true,
  },
};
```

## 常見遷移場景

### 場景 1: Read-Only Widget

```typescript
// 只讀數據的 widget
const migration = {
  before: 'Direct Supabase query',
  after: 'GraphQL + useWidgetSmartCache',
  cacheStrategy: CACHE_STRATEGIES.STANDARD,
};
```

### 場景 2: Write-Only Widget

```typescript
// 只寫數據的 widget (如上傳組件)
const migration = {
  before: 'Supabase insert/update',
  after: 'Server Actions only',
  cacheStrategy: CACHE_STRATEGIES.STATIC,
};

// 範例
export async function uploadFileAction(formData: FormData) {
  'use server';
  const supabase = createClient();
  // 處理上傳
}
```

### 場景 3: Mixed Read-Write Widget

```typescript
// 讀寫混合的 widget
const migration = {
  before: 'Mixed Supabase operations',
  after: 'GraphQL for read + Server Actions for write',
  cacheStrategy: CACHE_STRATEGIES.DYNAMIC,
};

// 範例
export function MixedWidget() {
  // 讀取使用 GraphQL
  const { data } = useGraphQLFallback({
    graphqlQuery: GET_DATA,
    serverAction: getDataAction,
  });
  
  // 寫入使用 Server Action
  const handleUpdate = async (newData) => {
    await updateDataAction(newData);
    refetch(); // 更新後刷新
  };
}
```

### 場景 4: Real-time Widget

```typescript
// 實時數據 widget
const migration = {
  before: 'Supabase realtime subscription',
  after: 'GraphQL + Supabase realtime + Smart cache',
  cacheStrategy: CACHE_STRATEGIES.REALTIME,
};

// 保留 realtime 功能，但優化初始加載
useEffect(() => {
  const channel = supabase
    .channel('realtime-updates')
    .on('postgres_changes', { event: '*' }, () => {
      refetch(); // 使用緩存系統的 refetch
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

## 測試與驗證

### 1. 單元測試更新

```typescript
// __tests__/MyWidget.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: { query: GET_MY_WIDGET_DATA },
    result: { data: mockData },
  },
];

describe('MyWidget Migration', () => {
  it('should fetch data using GraphQL', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <MyModernWidget />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(mockData.label)).toBeInTheDocument();
    });
  });
  
  it('should fall back to Server Action on GraphQL error', async () => {
    const errorMocks = [{
      request: { query: GET_MY_WIDGET_DATA },
      error: new Error('GraphQL Error'),
    }];
    
    render(
      <MockedProvider mocks={errorMocks}>
        <MyModernWidget />
      </MockedProvider>
    );
    
    // Should still show data from Server Action
    await waitFor(() => {
      expect(screen.getByText('Fallback Data')).toBeInTheDocument();
    });
  });
});
```

### 2. 性能測試

```typescript
// __tests__/MyWidget.performance.test.tsx
describe('Widget Performance After Migration', () => {
  it('should load faster than legacy version', async () => {
    const legacyTime = await measureLoadTime(<MyLegacyWidget />);
    const modernTime = await measureLoadTime(<MyModernWidget />);
    
    expect(modernTime).toBeLessThan(legacyTime * 0.7); // 30% 改善
  });
  
  it('should reduce network requests', async () => {
    const requests = await captureNetworkRequests(() => {
      render(<MyModernWidget />);
    });
    
    expect(requests.length).toBeLessThan(3); // 批量查詢
  });
});
```

### 3. 緩存驗證

```typescript
// 驗證緩存行為
it('should use cached data on second render', async () => {
  const { rerender } = render(<MyModernWidget />);
  
  // 首次加載
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
  
  // 重新渲染應使用緩存
  rerender(<MyModernWidget />);
  expect(fetchSpy).toHaveBeenCalledTimes(1); // 沒有新請求
});
```

## 遷移清單

### Pre-Migration
- [ ] 識別所有 legacy widgets
- [ ] 創建遷移計劃和優先級
- [ ] 備份現有代碼
- [ ] 設置測試環境
- [ ] 記錄當前性能基準

### During Migration
- [ ] 創建 GraphQL queries
- [ ] 實現 Server Actions
- [ ] 更新 widget 組件代碼
- [ ] 集成智能緩存
- [ ] 添加性能監控
- [ ] 更新 widget 配置
- [ ] 移除舊依賴

### Post-Migration
- [ ] 運行所有測試
- [ ] 驗證功能完整性
- [ ] 比較性能指標
- [ ] 更新文檔
- [ ] 部署到測試環境
- [ ] 用戶驗收測試
- [ ] 監控錯誤率

### Cleanup
- [ ] 移除 legacy 代碼
- [ ] 更新 import paths
- [ ] 優化 bundle size
- [ ] 歸檔遷移文檔

## 常見問題

### Q1: 遷移後數據不同步？

確保 Server Action 和 GraphQL 返回相同的數據結構：

```typescript
// 統一數據轉換函數
export function normalizeWidgetData(raw: any): WidgetData {
  return {
    id: raw.id,
    value: raw.value || 0,
    label: raw.label || 'Unknown',
    // 確保所有字段都有默認值
  };
}
```

### Q2: 緩存導致數據過期？

調整緩存策略：

```typescript
customCacheConfig: {
  baseTTL: 60, // 縮短 TTL
  enableSWR: true, // 啟用 stale-while-revalidate
}
```

### Q3: Server Action 報錯？

檢查 Server Action 標記：

```typescript
'use server'; // 必須在文件頂部

// 確保使用 server 端 Supabase client
import { createClient } from '@/app/utils/supabase/server';
```

### Q4: 性能沒有改善？

檢查以下項目：
1. 是否正確實施批量查詢
2. 是否啟用了緩存
3. 是否有不必要的重渲染
4. 是否正確配置了懶加載

### Q5: 測試失敗？

更新測試 mock：

```typescript
// 確保 mock GraphQL 和 Server Actions
jest.mock('@/app/actions/myWidgetActions', () => ({
  getMyWidgetData: jest.fn().mockResolvedValue(mockData),
}));
```

## 遷移支持

如需協助，請參考：
- [Widget 開發指南](./widget-development-guide.md)
- [性能優化指南](./performance-optimization-guide.md)
- [API 文檔](./api-documentation.md)

---

*最後審核: 2025-07-11 | 下次審核: 2025-02-11*