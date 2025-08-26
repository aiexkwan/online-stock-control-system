# Order Data Hooks

統一的訂單數據管理 Hooks，提供完整的訂單數據獲取、緩存和變更功能。

## 功能特性

- ✅ **統一的數據介面**: 一個 hook 管理所有訂單相關數據
- ✅ **GraphQL 集成**: 使用 Apollo Client 進行高效的數據獲取
- ✅ **智能快取**: 支援多種快取策略和自動更新
- ✅ **實時更新**: 支援 GraphQL Subscription 即時數據同步
- ✅ **錯誤處理**: 完整的錯誤處理和恢復機制
- ✅ **樂觀更新**: 提供良好的使用者體驗
- ✅ **TypeScript**: 完整的類型定義和類型安全
- ✅ **靈活配置**: 支援多種使用場景和配置選項

## 核心 Hooks

### `useOrderData` - 主要 Hook

```typescript
import { useOrderData } from '@/lib/hooks';

const orderData = useOrderData({
  polling: 30000, // 輪詢間隔 (ms)
  subscriptions: true, // 啟用實時更新
  optimisticUpdates: true, // 啟用樂觀更新
  fetchPolicy: 'cache-first',
});
```

### `useWarehouseOrders` - 倉庫訂單列表

```typescript
import { useWarehouseOrders } from '@/lib/hooks';

const { orders, total, loading, setFilter } = useWarehouseOrders(
  { status: 'PENDING' },
  { polling: 60000 }
);
```

### `useWarehouseOrder` - 單個倉庫訂單

```typescript
import { useWarehouseOrder } from '@/lib/hooks';

const { order, loading, refetch } = useWarehouseOrder('order-123');
```

### `useAcoOrderReport` - ACO 訂單報表

```typescript
import { useAcoOrderReport } from '@/lib/hooks';

const { report, loading, refetch } = useAcoOrderReport('REF-001');
```

### `useOrderLoadingRecords` - 訂單裝載記錄

```typescript
import { useOrderLoadingRecords } from '@/lib/hooks';

const filter = {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
};
const { records, summary, loading } = useOrderLoadingRecords(filter);
```

## 使用範例

### 基本訂單管理卡片

```typescript
import React from 'react';
import { useWarehouseOrders } from '@/lib/hooks';

export function OrdersListCard() {
  const { orders, loading, error, setFilter } = useWarehouseOrders();

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error.message}</div>;

  return (
    <div className="orders-card">
      <h2>倉庫訂單</h2>
      {orders.map(order => (
        <div key={order.id} className="order-item">
          <h3>{order.orderRef}</h3>
          <p>狀態: {order.status}</p>
          <p>進度: {order.loadedQuantity}/{order.totalQuantity}</p>
        </div>
      ))}
    </div>
  );
}
```

### 訂單詳情卡片

```typescript
import React from 'react';
import { useWarehouseOrder } from '@/lib/hooks';

export function OrderDetailCard({ orderId }: { orderId: string }) {
  const { order, loading, error } = useWarehouseOrder(orderId);

  if (loading) return <div>載入訂單詳情...</div>;
  if (error) return <div>錯誤: {error.message}</div>;
  if (!order) return <div>找不到訂單</div>;

  return (
    <div className="order-detail-card">
      <h2>訂單 {order.orderRef}</h2>
      <p>客戶: {order.customerName}</p>
      <p>狀態: {order.status}</p>

      <h3>訂單項目</h3>
      {order.items.map(item => (
        <div key={item.id} className="order-item">
          <span>{item.productCode}</span>
          <span>{item.loadedQuantity}/{item.quantity}</span>
          <span>{item.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### 完整功能卡片（包含變更操作）

```typescript
import React from 'react';
import { useOrderData } from '@/lib/hooks';

export function OrderManagementCard() {
  const orderData = useOrderData({
    subscriptions: true,
    optimisticUpdates: true
  });

  const handleStatusUpdate = async (orderId: string, status: any) => {
    const success = await orderData.updateOrderStatus({ orderId, status });
    if (success) {
      // 狀態更新成功
      await orderData.refetchOrders();
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await orderData.cancelOrder({
      orderId,
      reason: '客戶要求取消'
    });
    if (success) {
      // 訂單取消成功
    }
  };

  return (
    <div className="order-management-card">
      <h2>訂單管理</h2>

      {orderData.loading && <div>處理中...</div>}

      {orderData.warehouseOrders.map(order => (
        <div key={order.id} className="order-item">
          <h3>{order.orderRef}</h3>
          <p>狀態: {order.status}</p>

          <button onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}>
            標記完成
          </button>

          <button onClick={() => handleCancelOrder(order.id)}>
            取消訂單
          </button>
        </div>
      ))}

      {orderData.warehouseOrdersAggregates && (
        <div className="summary">
          <p>總訂單: {orderData.warehouseOrdersAggregates.totalOrders}</p>
          <p>待處理: {orderData.warehouseOrdersAggregates.pendingOrders}</p>
          <p>已完成: {orderData.warehouseOrdersAggregates.completedOrders}</p>
        </div>
      )}
    </div>
  );
}
```

## 配置選項

### `OrderDataConfig`

```typescript
interface OrderDataConfig {
  // 快取策略
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';

  // 錯誤處理策略
  errorPolicy?: 'none' | 'ignore' | 'all';

  // 輪詢間隔 (毫秒)
  polling?: number;

  // 啟用實時訂閱
  subscriptions?: boolean;

  // 啟用樂觀更新
  optimisticUpdates?: boolean;

  // 分頁配置
  pagination?: {
    limit?: number;
    offset?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };

  // 網路狀態通知
  notifyOnNetworkStatusChange?: boolean;
}
```

### 快取策略說明

- `cache-first`: 優先使用快取，快取不存在時才發送網路請求
- `cache-and-network`: 同時使用快取和網路請求，提供最佳使用者體驗
- `network-only`: 總是發送網路請求，忽略快取
- `no-cache`: 不使用快取，每次都重新請求

## 錯誤處理

所有 hooks 都集成了統一的錯誤處理機制：

```typescript
const { error, ordersError, orderError, acoError, recordsError } = useOrderData();

// 檢查特定錯誤
if (ordersError) {
  console.error('訂單列表錯誤:', ordersError.message);
}

if (orderError) {
  console.error('單個訂單錯誤:', orderError.message);
}
```

## 性能最佳化

### 1. 快取策略

- 使用 `cache-first` 策略減少不必要的網路請求
- 合理設定輪詢間隔，避免過度請求

### 2. 分頁

- 對大量數據使用分頁，避免一次載入過多資料

### 3. 樂觀更新

- 啟用樂觀更新提升使用者體驗

### 4. 條件載入

- 使用 lazy queries 進行按需載入

## 檔案結構

```
lib/hooks/
├── index.ts                    # 主要導出檔案
├── useOrderData.ts            # 主要 hook 實現
├── types/
│   └── orderData.types.ts     # TypeScript 類型定義
└── examples/
    └── useOrderData-examples.tsx  # 使用範例
```

## GraphQL 查詢

所有的 GraphQL 查詢和變更操作都定義在：

- `lib/graphql/queries/orderData.graphql.ts`
- `lib/graphql/resolvers/order.resolver.ts`
- `lib/graphql/schema/order.ts`

## 相依性

- `@apollo/client`: GraphQL 客戶端
- `@/lib/error-handling`: 錯誤處理
- React 18.3.1+
- TypeScript 5.8.3+

## 最佳實踐

1. **使用專門的 hooks**: 如果只需要特定功能，使用專門的 hooks (`useWarehouseOrders`, `useWarehouseOrder` 等)
2. **合理設定輪詢**: 根據數據更新頻率設定合適的輪詢間隔
3. **錯誤處理**: 始終處理可能的錯誤狀態
4. **載入狀態**: 提供適當的載入提示
5. **類型安全**: 使用 TypeScript 確保類型安全

## 故障排除

### 常見問題

1. **載入狀態一直為 true**: 檢查 GraphQL 查詢是否正確，網路連接是否正常
2. **快取不更新**: 確認快取策略設定，考慮使用 `refetch()` 強制更新
3. **實時更新不工作**: 檢查 WebSocket 連接和 subscription 設定
4. **類型錯誤**: 確保使用正確的類型定義，檢查 GraphQL schema

### 除錯技巧

```typescript
// 啟用網路狀態監控
const orderData = useOrderData({
  notifyOnNetworkStatusChange: true,
});

// 監控網路狀態
console.log('Network Status:', orderData.networkStatus);

// 檢查錯誤詳情
if (orderData.error) {
  console.error('GraphQL Error:', orderData.error.graphQLErrors);
  console.error('Network Error:', orderData.error.networkError);
}
```

## 未來功能

- [ ] 離線支援
- [ ] 批量操作
- [ ] 進階篩選和排序
- [ ] 匯出功能
- [ ] 更多圖表和分析功能
- [ ] 行動裝置優化

## 貢獻

歡迎提交 issue 和 pull request 來改善這個 hook。請確保：

1. 遵循現有的程式碼風格
2. 添加適當的測試
3. 更新文件
4. 使用 TypeScript

## 授權

MIT License
