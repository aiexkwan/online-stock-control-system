# ListCard GraphQL Integration Guide

## 概述

本文檔描述了為 ListCard 組件新增的 GraphQL schema 擴展，支援統一的列表數據查詢和管理。

## 架構概述

### 核心設計原則

1. **統一介面 (Unified Interface)**: 使用 `ListData` interface 統一所有列表類型
2. **類型安全 (Type Safety)**: 完整的 TypeScript 類型支援
3. **靈活查詢 (Flexible Queries)**: 支援分頁、過濾、排序
4. **性能優化 (Performance)**: 緩存、速率限制、批量查詢
5. **安全考量 (Security)**: RLS 政策、權限控制

### 支援的列表類型

1. **ORDER_STATE** - 訂單狀態列表
   - 訂單進度追蹤
   - 狀態統計摘要
   - 進度指標

2. **ORDER_RECORD** - 訂單記錄列表
   - 訂單歷史記錄
   - 時間軸事件
   - 分析數據

3. **WAREHOUSE_TRANSFER** - 倉庫轉移列表
   - 轉移記錄
   - 狀態分佈
   - 性能指標

4. **OTHER_FILES** - 其他文件列表
   - 文件管理
   - 分類統計
   - 存儲指標

## Schema 結構

### 基礎 Interface

```graphql
interface ListData {
  id: ID!
  listType: ListType!
  title: String!
  description: String
  totalCount: Int!
  filteredCount: Int!
  lastUpdated: DateTime!
  dataSource: String!
  refreshInterval: Int
}
```

### Union Type

```graphql
union ListDataUnion = OrderStateList | OrderRecordList | WarehouseTransferList | OtherFilesList
```

### 核心查詢

```graphql
type Query {
  # 單一 List 查詢
  listCardData(input: ListCardInput!): ListDataUnion!
  
  # 批量 List 查詢
  batchListCardData(inputs: [ListCardInput!]!): [ListDataUnion!]!
  
  # List 分析數據
  listAnalytics(input: ListAnalyticsInput!): JSON!
  
  # List 元數據
  listMetadata(listType: ListType!): ListMetadata!
}
```

## 使用方式

### 1. 基本查詢

```typescript
import { useQuery } from '@apollo/client';
import { GetListCardDataDocument } from '@/types/generated/graphql';

const { data, loading, error } = useQuery(GetListCardDataDocument, {
  variables: {
    input: {
      listType: 'ORDER_STATE',
      pagination: { limit: 20, offset: 0 },
      includeMetrics: true
    }
  }
});
```

### 2. 帶篩選器查詢

```typescript
const { data } = useQuery(GetListCardDataDocument, {
  variables: {
    input: {
      listType: 'WAREHOUSE_TRANSFER',
      filters: {
        status: ['PENDING', 'IN_PROGRESS'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      },
      pagination: { limit: 50 },
      sort: { field: 'requestedAt', direction: 'DESC' }
    }
  }
});
```

### 3. 批量查詢

```typescript
const { data } = useQuery(GetBatchListCardDataDocument, {
  variables: {
    inputs: [
      { listType: 'ORDER_STATE', pagination: { limit: 10 } },
      { listType: 'WAREHOUSE_TRANSFER', pagination: { limit: 10 } },
      { listType: 'OTHER_FILES', pagination: { limit: 10 } }
    ]
  }
});
```

### 4. 類型守護 (Type Guards)

```typescript
const handleListData = (listData: ListDataUnion) => {
  switch (listData.listType) {
    case 'ORDER_STATE':
      // TypeScript 現在知道這是 OrderStateList 類型
      const orderList = listData as OrderStateList;
      console.log(orderList.statusSummary);
      break;
      
    case 'WAREHOUSE_TRANSFER':
      const transferList = listData as WarehouseTransferList;
      console.log(transferList.performanceMetrics);
      break;
      
    // 其他類型...
  }
};
```

## 篩選器系統

### 通用篩選器

```typescript
interface ListFilters {
  search?: string;           // 搜尋關鍵字
  status?: string[];         // 狀態篩選
  category?: string[];       // 分類篩選
  tags?: string[];          // 標籤篩選
  userId?: string;          // 用戶篩選
}
```

### 特定類型篩選器

```typescript
// 訂單篩選器
interface OrderListFilters {
  orderNumbers?: string[];
  customerCodes?: string[];
  statuses?: OrderStatus[];
  priorities?: OrderPriority[];
  isUrgent?: boolean;
  valueRange?: {
    min?: number;
    max?: number;
  };
}

// 轉移篩選器
interface TransferListFilters {
  transferNumbers?: string[];
  palletNumbers?: string[];
  fromLocations?: string[];
  toLocations?: string[];
  statuses?: TransferStatus[];
  priorities?: TransferPriority[];
}

// 文件篩選器
interface FileListFilters {
  fileTypes?: FileType[];
  categories?: FileCategory[];
  statuses?: FileStatus[];
  accessibility?: FileAccessibility[];
  sizeRange?: {
    min?: number;
    max?: number;
  };
}
```

## 性能優化

### 1. 緩存策略

```graphql
listCardData(input: ListCardInput!): ListDataUnion! 
  @cache(ttl: 300, scope: USER)
```

### 2. 速率限制

```graphql
listCardData(input: ListCardInput!): ListDataUnion!
  @rateLimit(max: 100, window: "1m")
```

### 3. 批量查詢

使用 `batchListCardData` 減少網路請求：

```typescript
// 一次查詢多個列表類型
const results = await batchListCardData([
  { listType: 'ORDER_STATE' },
  { listType: 'WAREHOUSE_TRANSFER' }
]);
```

## 安全考量

### 1. 權限控制

```graphql
listCardData: ListDataUnion! @auth(requires: VIEWER)
```

### 2. RLS 政策

每種列表類型都會根據用戶權限自動過濾數據：

- **ORDER_STATE**: 只顯示用戶有權查看的訂單
- **WAREHOUSE_TRANSFER**: 基於部門/位置權限
- **OTHER_FILES**: 基於文件訪問權限

### 3. 數據隱私

敏感數據會根據用戶角色自動遮罩或排除。

## 錯誤處理

### 1. GraphQL 錯誤

```typescript
const { data, error } = useQuery(GetListCardDataDocument, {
  variables: { input: { listType: 'ORDER_STATE' } },
  errorPolicy: 'partial' // 允許部分數據返回
});

if (error) {
  console.error('GraphQL Error:', error.message);
  // 處理特定錯誤類型
  error.graphQLErrors.forEach(({ message, extensions }) => {
    if (extensions?.code === 'PERMISSION_DENIED') {
      // 處理權限錯誤
    }
  });
}
```

### 2. 網路錯誤

```typescript
const { data, error, refetch } = useQuery(GetListCardDataDocument, {
  variables: { input: { listType: 'ORDER_STATE' } },
  errorPolicy: 'cache-and-network',
  fetchPolicy: 'cache-first'
});

// 重試機制
const handleRetry = () => {
  refetch().catch(console.error);
};
```

## 實時更新

### 使用 Subscriptions

```typescript
import { useSubscription } from '@apollo/client';

const { data: realtimeData } = useSubscription(LIST_DATA_UPDATED_SUBSCRIPTION, {
  variables: { listType: 'ORDER_STATE' }
});

useEffect(() => {
  if (realtimeData) {
    // 更新本地數據
    updateListData(realtimeData.listDataUpdated);
  }
}, [realtimeData]);
```

## 最佳實踐

### 1. 查詢優化

```typescript
// ✅ 好的做法 - 只查詢需要的欄位
const OPTIMIZED_QUERY = gql`
  query GetOrderStateList($input: ListCardInput!) {
    listCardData(input: $input) {
      ... on OrderStateList {
        id
        title
        totalCount
        statusSummary {
          status
          count
        }
        # 只查詢必要的欄位
      }
    }
  }
`;

// ❌ 避免 - 查詢所有欄位
const INEFFICIENT_QUERY = gql`
  query GetOrderStateList($input: ListCardInput!) {
    listCardData(input: $input) {
      ... on OrderStateList {
        # 查詢所有可用欄位，包括不需要的
      }
    }
  }
`;
```

### 2. 分頁處理

```typescript
const { data, fetchMore } = useQuery(GetListCardDataDocument, {
  variables: {
    input: { 
      listType: 'ORDER_STATE',
      pagination: { limit: 20, offset: 0 }
    }
  }
});

const loadMore = () => {
  fetchMore({
    variables: {
      input: {
        listType: 'ORDER_STATE',
        pagination: { 
          limit: 20, 
          offset: data?.listCardData?.orders?.edges?.length || 0 
        }
      }
    },
    updateQuery: (prev, { fetchMoreResult }) => {
      // 合併結果
      return mergeResults(prev, fetchMoreResult);
    }
  });
};
```

### 3. 錯誤邊界

```typescript
import { ErrorBoundary } from 'react-error-boundary';

const ListCardErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-fallback">
    <h2>Something went wrong with the list data:</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

const ListCardWithErrorBoundary = () => (
  <ErrorBoundary
    FallbackComponent={ListCardErrorFallback}
    onReset={() => window.location.reload()}
  >
    <ListCard listType="ORDER_STATE" />
  </ErrorBoundary>
);
```

## 測試策略

### 1. 單元測試

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

const mocks = [
  {
    request: {
      query: GetListCardDataDocument,
      variables: { input: { listType: 'ORDER_STATE' } }
    },
    result: {
      data: {
        listCardData: {
          __typename: 'OrderStateList',
          id: '1',
          listType: 'ORDER_STATE',
          title: 'Order Status',
          totalCount: 100,
          // ... 其他測試數據
        }
      }
    }
  }
];

test('renders ListCard with order state data', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ListCard listType="ORDER_STATE" />
    </MockedProvider>
  );

  expect(await screen.findByText('Order Status')).toBeInTheDocument();
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

### 2. 整合測試

```typescript
// 測試實際的 GraphQL 查詢
test('fetches real data from GraphQL endpoint', async () => {
  const client = new ApolloClient({
    uri: process.env.GRAPHQL_ENDPOINT,
    cache: new InMemoryCache()
  });

  const { data } = await client.query({
    query: GetListCardDataDocument,
    variables: { input: { listType: 'ORDER_STATE' } }
  });

  expect(data.listCardData).toBeDefined();
  expect(data.listCardData.listType).toBe('ORDER_STATE');
});
```

## 故障排除

### 常見問題

1. **類型錯誤**: 確保運行 `npm run codegen` 生成最新的 TypeScript 類型
2. **權限錯誤**: 檢查用戶是否有訪問特定列表類型的權限
3. **緩存問題**: 使用 `fetchPolicy: 'network-only'` 強制重新獲取數據
4. **性能問題**: 檢查查詢是否包含不必要的欄位或關聯

### 調試工具

1. **Apollo Client DevTools**: 監控查詢和緩存狀態
2. **GraphQL Playground**: 測試查詢和變更
3. **Network Tab**: 檢查實際的網路請求

## 未來擴展

### 計劃中的功能

1. **更多列表類型**: GRN 列表、用戶列表等
2. **高級篩選**: 自定義篩選器建構器
3. **匯出功能**: CSV、Excel、PDF 匯出
4. **範本系統**: 儲存和重用篩選器配置

### 版本兼容性

- **v1.0**: 基本 CRUD 操作
- **v1.1**: 新增批量操作
- **v1.2**: 實時更新支援
- **v2.0**: 高級分析功能

---

*最後更新：2024年7月*
*版本：1.0.0*