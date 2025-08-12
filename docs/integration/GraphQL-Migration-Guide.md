# GraphQL 遷移指南

**文檔版本**: 1.0  
**建立日期**: 2025-07-27  
**文檔類型**: 技術指南  
**目標讀者**: 開發團隊

## 📋 執行摘要

本指南提供從 REST API 遷移到 GraphQL 的實用步驟和範例。目前 GraphQL 基礎設施完善，但採用率低於 5%。本指南旨在加速遷移進程。

## 🎯 遷移優先級

### 高優先級 API（Dashboard 相關）
1. `/api/stats` → `query statsCardData`
2. `/api/charts` → `query chartCardData`
3. `/api/tables` → `query tableCardData`
4. `/api/analytics/*` → `query analyticsData`

### 中優先級 API（業務操作）
1. `/api/inventory/*` → `query inventoryData`
2. `/api/orders/*` → `query/mutation orders`
3. `/api/print-label-updates` → `mutation updatePrintLabel`

### 低優先級 API（工具類）
1. `/api/upload-pdf` → `mutation uploadFile`

## 📚 遷移範例

### 範例 1: Stats API 遷移

#### 原 REST 實現
```typescript
// 舊代碼 - REST API
const fetchStats = async () => {
  const response = await fetch('/api/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
```

#### 新 GraphQL 實現
```typescript
// 新代碼 - GraphQL
import { gql, useQuery } from '@apollo/client';

const STATS_QUERY = gql`
  query GetStatsData($warehouse: String, $timeRange: TimeRange) {
    statsCardData(warehouse: $warehouse, timeRange: $timeRange) {
      id
      title
      value
      change
      changeType
      icon
      category
    }
  }
`;

// 在 React 組件中使用
const StatsCard: React.FC = () => {
  const { data, loading, error } = useQuery(STATS_QUERY, {
    variables: {
      warehouse: 'main',
      timeRange: 'LAST_7_DAYS'
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <StatsDisplay data={data.statsCardData} />;
};
```

### 範例 2: Table Data 遷移

#### 原 REST 實現
```typescript
// 舊代碼 - 分頁表格數據
const fetchTableData = async (page: number, pageSize: number) => {
  const response = await fetch(
    `/api/tables/orders?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

#### 新 GraphQL 實現
```typescript
// 新代碼 - GraphQL with pagination
const TABLE_QUERY = gql`
  query GetTableData($input: TableDataInput!) {
    tableCardData(input: $input) {
      data {
        id
        columns
        rows
      }
      pagination {
        total
        page
        pageSize
        totalPages
      }
    }
  }
`;

// 使用 Apollo Client
const TableComponent: React.FC = () => {
  const [page, setPage] = useState(1);
  
  const { data, loading, error } = useQuery(TABLE_QUERY, {
    variables: {
      input: {
        dataType: 'orders',
        pagination: {
          page,
          pageSize: 20
        },
        filters: {
          status: 'ACTIVE'
        }
      }
    }
  });

  // 處理分頁
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <TableDisplay 
      data={data?.tableCardData}
      loading={loading}
      onPageChange={handlePageChange}
    />
  );
};
```

### 範例 3: Mutation 操作

#### 原 REST 實現
```typescript
// 舊代碼 - 更新操作
const updateOrder = async (orderId: string, updates: any) => {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};
```

#### 新 GraphQL 實現
```typescript
// 新代碼 - GraphQL Mutation
const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $input: OrderUpdateInput!) {
    updateOrder(id: $id, input: $input) {
      success
      message
      order {
        id
        status
        updatedAt
      }
    }
  }
`;

// 在組件中使用
const OrderActions: React.FC = ({ orderId }) => {
  const [updateOrder, { loading, error }] = useMutation(UPDATE_ORDER, {
    // 更新緩存
    update(cache, { data: { updateOrder } }) {
      if (updateOrder.success) {
        // 更新本地緩存
        cache.modify({
          fields: {
            orders(existingOrders = []) {
              // 更新邏輯
              return existingOrders;
            }
          }
        });
      }
    }
  });

  const handleUpdate = async (updates: any) => {
    try {
      const { data } = await updateOrder({
        variables: {
          id: orderId,
          input: updates
        }
      });
      
      if (data.updateOrder.success) {
        toast.success('Order updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  return <UpdateButton onClick={handleUpdate} loading={loading} />;
};
```

## 🔧 實用工具

### 1. GraphQL Code Generator 配置

創建 `codegen.yml`:
```yaml
overwrite: true
schema: "http://localhost:3000/api/graphql"
documents: "app/**/*.{ts,tsx}"
generates:
  types/generated/graphql.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-react-apollo"
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

### 2. Apollo Client 設置

確保 Apollo Client 已正確配置：
```typescript
// lib/graphql/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: '/api/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

## 📈 遷移檢查清單

### 組件級別遷移
- [ ] 識別組件中的 REST API 調用
- [ ] 創建對應的 GraphQL Query/Mutation
- [ ] 使用 Apollo hooks 替換 fetch 調用
- [ ] 更新錯誤處理邏輯
- [ ] 實現適當的 loading 狀態
- [ ] 測試數據流和緩存行為

### API 級別考慮
- [ ] 確認 GraphQL resolver 已實現
- [ ] 驗證權限和認證邏輯
- [ ] 檢查性能（N+1 查詢問題）
- [ ] 實現 DataLoader（如需要）
- [ ] 更新 API 文檔

## 🚀 最佳實踐

### 1. 使用 Fragment 重用查詢
```typescript
const ORDER_FRAGMENT = gql`
  fragment OrderDetails on Order {
    id
    orderRef
    status
    createdAt
    items {
      id
      productCode
      quantity
    }
  }
`;

const ORDERS_QUERY = gql`
  ${ORDER_FRAGMENT}
  query GetOrders {
    orders {
      ...OrderDetails
    }
  }
`;
```

### 2. 優化查詢（只請求需要的字段）
```typescript
// ❌ 不好 - 請求所有字段
const BAD_QUERY = gql`
  query GetUser {
    user {
      # 獲取所有字段
    }
  }
`;

// ✅ 好 - 只請求需要的字段
const GOOD_QUERY = gql`
  query GetUser {
    user {
      id
      name
      email
    }
  }
`;
```

### 3. 錯誤處理
```typescript
const MyComponent = () => {
  const { data, loading, error } = useQuery(MY_QUERY, {
    errorPolicy: 'all', // 獲取部分數據即使有錯誤
    onError: (error) => {
      // 集中錯誤處理
      console.error('GraphQL error:', error);
      toast.error(getErrorMessage(error));
    }
  });
};
```

## 📊 監控和調試

### GraphQL Playground
訪問 `/api/graphql` 查看 GraphQL Playground（開發環境）

### Apollo DevTools
安裝 Apollo Client DevTools Chrome 擴展以便調試

### 性能監控
```typescript
// 添加性能監控
const apolloClient = new ApolloClient({
  // ... 其他配置
  onError: ({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(`GraphQL error: ${message}`)
      );
    }
    if (networkError) {
      console.log(`Network error: ${networkError}`);
    }
  },
});
```

## 📅 遷移時間表

### 第 1 週
- 團隊培訓和知識分享
- 遷移第一個 Dashboard Card（StatsCard）
- 建立遷移模板

### 第 2-3 週
- 遷移所有 Dashboard 相關 API
- 實施性能優化

### 第 4-6 週
- 遷移業務操作 API
- 整合測試

### 第 7-8 週
- 遷移剩餘 API
- 標記 REST endpoints 為 deprecated

## 🆘 常見問題

### Q: 如何處理文件上傳？
A: 使用 Apollo Upload Client：
```typescript
import { createUploadLink } from 'apollo-upload-client';

const uploadLink = createUploadLink({
  uri: '/api/graphql',
});
```

### Q: 如何實現實時更新？
A: 使用 GraphQL Subscriptions（需要 WebSocket 支持）

### Q: 如何處理大量數據？
A: 實現分頁和遊標分頁策略

---

**需要幫助？** 聯繫架構團隊或查看 [GraphQL 官方文檔](https://graphql.org/learn/)