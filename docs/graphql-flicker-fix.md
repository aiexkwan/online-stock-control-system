# GraphQL 閃爍問題解決方案

## 問題描述
使用 GraphQL 嘅 Dashboard widgets 會出現畫面閃爍，而使用 Supabase SDK 嘅 widgets 則冇呢個問題。

## 問題原因
1. **初始 Loading State**: GraphQL hook 每次都從 `loading: true` 開始
2. **缺少持久緩存**: 組件卸載後緩存數據丟失
3. **重複請求**: 每次組件重新掛載都會重新發送請求

## 解決方案

### 1. 使用新嘅 Stable GraphQL Client
```typescript
// 替換原有嘅 import
import { useGraphQLQuery } from '@/lib/graphql-client-stable';
```

### 2. 主要改進
- **全局緩存**: 組件卸載後仍保留數據
- **智能 Loading**: 有緩存時唔顯示 loading，背景更新
- **isRefetching 狀態**: 區分初始載入同背景刷新

### 3. 使用示例
```typescript
// 原有代碼
const { data, loading, error } = useGraphQLQuery(GET_AWAIT_LOCATION_QTY);

// 新代碼（支援背景刷新狀態）
const { data, loading, error, isRefetching } = useGraphQLQuery(GET_AWAIT_LOCATION_QTY);

// 顯示 loading 時可以更智能
if (loading && !data) {
  return <LoadingSpinner />;
}

// 可選：顯示背景刷新指示器
{isRefetching && <RefreshIcon className="animate-spin" />}
```

### 4. 漸進式遷移
1. 先喺最關鍵嘅 widgets 測試新 client
2. 確認冇問題後逐步替換其他 widgets
3. 最後移除舊嘅 graphql-client.ts

### 5. 額外優化選項

#### Suspense 模式（實驗性）
```typescript
const { data, error } = useGraphQLQuery(
  GET_DATA,
  variables,
  { suspense: true }
);
```

#### 自定義緩存時間
```typescript
const { data, loading } = useGraphQLQuery(
  GET_DATA,
  variables,
  { cacheTime: 10000 } // 10秒緩存
);
```

## 實施步驟

1. **測試新 Client**
   ```bash
   # 更新一個 widget 測試
   # 例如：AwaitLocationQtyWidget
   ```

2. **監測效果**
   - 檢查係咪仲有閃爍
   - 確認數據更新正常
   - 檢查 network tab 確認請求優化

3. **全面推廣**
   - 逐步更新所有 GraphQL widgets
   - 更新文檔同培訓材料

## 預期效果
- ✅ 消除畫面閃爍
- ✅ 減少不必要嘅網絡請求
- ✅ 提升用戶體驗
- ✅ 保持實時數據更新能力