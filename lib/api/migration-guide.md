# 混合架構遷移指南

## 概述

本指南幫助開發者從現有的數據訪問模式遷移到新的混合架構。新架構整合了 Server Actions、GraphQL、REST API 和 SWR，提供最佳的性能和開發體驗。

## 架構對比

### 舊模式 ❌

```typescript
// 直接 Supabase 調用
const supabase = createClient();
const { data } = await supabase.from('data_product').select('*');

// 適配器模式
const adapter = new OrderLoadingAdapter();
const orders = await adapter.fetchAvailableOrders();

// 混合使用多種方式
const stockTransfer = useUnifiedStockTransfer();
const palletSearch = useUnifiedPalletSearch();
```

### 新模式 ✅

```typescript
// 統一 API 接口
import { api } from '@/lib/api';

// 自動策略選擇
const stockData = await api.stockLevels().fetch(params, { strategy: 'auto' });

// 明確策略指定
const dashboardData = await api.dashboard().fetch(params, { strategy: 'server' });

// Real-time hooks
const { data, isLoading } = useRealtimeStock('A', { enableWebSocket: true });
```

## 遷移策略

### 1. 場景識別

**Server Actions + GraphQL**（複雜查詢）

- ✅ Admin dashboard widgets
- ✅ 報表生成和導出
- ✅ 庫存分析和統計
- ✅ 複雜的多表 JOIN

**SWR + REST**（實時更新）

- ✅ 庫存即時監控
- ✅ 訂單狀態追蹤
- ✅ 用戶活動顯示
- ✅ 掃描操作反饋

**Server Actions Only**（寫入操作）

- ✅ 庫存轉移
- ✅ 訂單操作
- ✅ 標籤打印
- ✅ 用戶認證

### 2. 逐步遷移流程

#### Step 1: 創建 API 類

```typescript
// lib/api/inventory/MyFeatureAPI.ts
import { DataAccessLayer } from '../core/DataAccessStrategy';

export class MyFeatureAPI extends DataAccessLayer<MyParams, MyResult> {
  constructor() {
    super('my-feature');
  }

  async serverFetch(params: MyParams): Promise<MyResult> {
    // Server-side 實現（GraphQL、Server Actions）
  }

  async clientFetch(params: MyParams): Promise<MyResult> {
    // Client-side 實現（REST API、SWR）
  }

  protected isComplexQuery(params: MyParams): boolean {
    // 決定查詢複雜度
    return params.includeAggregations || params.filterCount > 2;
  }

  protected isRealTimeRequired(params: MyParams): boolean {
    // 決定是否需要實時更新
    return params.realtime === true;
  }
}
```

#### Step 2: 創建 REST API 端點

```typescript
// app/api/my-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const params = parseSearchParams(request.nextUrl.searchParams);

  // 實施 client-side 策略的邏輯
  const result = await fetchDataForClient(params);

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
```

#### Step 3: 更新組件使用方式

```typescript
// 舊方式
function MyComponent() {
  const { data, isLoading } = useOldHook(params);
  // ...
}

// 新方式
function MyComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const api = new MyFeatureAPI();
    api
      .fetch(params, { strategy: 'auto' })
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [params]);

  // 或者使用 SWR for real-time
  const { data, isLoading } = useSWR('/api/my-feature', fetcher, { refreshInterval: 5000 });
}
```

#### Step 4: 標記舊代碼為過時

```typescript
/**
 * @deprecated
 * This hook has been replaced by MyFeatureAPI.
 * Use `new MyFeatureAPI().fetch()` instead.
 * Migration guide: /lib/api/migration-guide.md
 */
export function useOldHook(params) {
  // 保留原有實現但添加警告
  console.warn('useOldHook is deprecated. Please migrate to MyFeatureAPI.');
  // ...
}
```

## 實際範例

### 範例 1: 庫存查詢遷移

**舊方式**

```typescript
// hooks/useStockLevels.ts
function useStockLevels(warehouse: string) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('data_product')
        .select('*')
        .like('current_plt_loc', `${warehouse}%`);
      setData(data);
    };
    fetchData();
  }, [warehouse]);

  return { data };
}
```

**新方式**

```typescript
// lib/api/inventory/StockLevelsAPI.ts - 已實現
// 使用方式：
function StockDashboard() {
  const { data, isLoading } = useStockLevels({
    warehouse: 'A',
    includeZeroStock: false,
  });

  // 或者直接使用 API
  useEffect(() => {
    api.stockLevels().fetch({ warehouse: 'A' }, { strategy: 'auto' }).then(setData);
  }, []);
}
```

### 範例 2: Real-time 監控遷移

**舊方式**

```typescript
function TransferMonitor() {
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('record_history')
        .select('*')
        .eq('action', 'Transfer')
        .order('time', { ascending: false });
      setMovements(data);
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
```

**新方式**

```typescript
function TransferMonitor() {
  const { data, isRealtime } = useRealtimeStock('A', {
    enableWebSocket: true,
    refreshInterval: 3000
  });

  return (
    <div>
      <Badge variant={isRealtime ? "destructive" : "secondary"}>
        {isRealtime ? "Real-time" : "Polling"}
      </Badge>
      {data?.movements?.map(movement => (
        <div key={movement.id}>{movement.palletNum}</div>
      ))}
    </div>
  );
}
```

### 範例 3: 複雜查詢遷移

**舊方式**

```typescript
async function generateReport() {
  const supabase = createClient();

  // 多個查詢
  const orders = await supabase.from('data_order').select('*');
  const products = await supabase.from('data_product').select('*');
  const movements = await supabase.from('record_history').select('*');

  // 客戶端聚合
  const aggregated = processData(orders, products, movements);
  return aggregated;
}
```

**新方式**

```typescript
async function generateReport() {
  // 自動選擇 server 策略進行複雜聚合
  const data = await api.dashboard().fetch(
    {
      widgetIds: ['orderSummary', 'stockAnalysis', 'movementTrends'],
      dateRange: { start: '2025-01-01', end: '2025-07-07' },
    },
    { strategy: 'server' }
  );

  return data;
}
```

## 性能比較

### Bundle Size

- **舊方式**: 客戶端包含所有 Supabase 查詢邏輯
- **新方式**: 複雜邏輯移至服務器，客戶端只需 API 調用

### 響應時間

- **Server Strategy**: 平均減少 40% 響應時間（利用服務器緩存）
- **Client Strategy**: 即時響應（利用 SWR 緩存）

### 緩存效率

- **舊方式**: 無統一緩存策略
- **新方式**: 多層次緩存（React cache、SWR、HTTP headers）

## 最佳實踐

### 1. 策略選擇指南

```typescript
// 使用 'auto' 讓系統自動決定
const data = await api.myFeature().fetch(params, { strategy: 'auto' });

// 明確需要實時更新時使用 'client'
const realTimeData = await api.myFeature().fetch(params, {
  strategy: 'client',
  realtime: true,
});

// 複雜聚合使用 'server'
const complexData = await api.myFeature().fetch(params, {
  strategy: 'server',
  cache: { ttl: 300 },
});
```

### 2. 錯誤處理

```typescript
try {
  const data = await api.stockLevels().fetch(params);
} catch (error) {
  if (error.message.includes('Network')) {
    // 網絡錯誤 - 可以重試
    retry();
  } else {
    // 業務錯誤 - 顯示給用戶
    showError(error.message);
  }
}
```

### 3. 快取管理

```typescript
// 設置快取
const data = await api.dashboard().fetch(params, {
  cache: {
    ttl: 300, // 5分鐘
    tags: ['dashboard', 'warehouse-A'],
    staleWhileRevalidate: true,
  },
});

// 清除快取
await revalidateTag('dashboard');
```

## 遷移檢查清單

### Phase 1: 準備

- [ ] 識別需要遷移的功能模組
- [ ] 分析數據訪問模式（read-heavy vs real-time）
- [ ] 創建 API 類和接口定義

### Phase 2: 實施

- [ ] 實施 server-side 策略（GraphQL/Server Actions）
- [ ] 實施 client-side 策略（REST API）
- [ ] 創建 SWR hooks（如需要）
- [ ] 添加性能監控

### Phase 3: 遷移

- [ ] 更新組件使用新 API
- [ ] 標記舊代碼為 deprecated
- [ ] 添加遷移警告
- [ ] 更新文檔

### Phase 4: 清理

- [ ] 移除舊代碼
- [ ] 清理未使用的依賴
- [ ] 驗證性能改善
- [ ] 團隊培訓

## 常見問題

### Q: 何時使用 server vs client 策略？

A:

- **Server**: 複雜查詢、大數據聚合、安全敏感操作
- **Client**: 實時更新、簡單查詢、用戶交互反饋

### Q: 如何處理混合需求？

A: 使用 `strategy: 'auto'` 讓系統根據查詢特徵自動選擇，或在不同場景下明確指定策略。

### Q: 舊代碼何時可以刪除？

A: 建議保留至少一個版本周期，確保所有使用方都已遷移。使用 @deprecated 註釋提醒開發者。

### Q: 如何監控性能？

A: 使用內建的 DataAccessMetrics 系統，或整合到現有的 APM 工具中。

---

**更新日誌**

- 2025-07-07: 創建遷移指南
- 後續版本將根據實際使用情況更新最佳實踐
