# GraphQL-First 開發指南

**報告日期**: 2025-07-28  
**報告人**: AI 協作者  
**報告類型**: 🏗️ 架構指南  
**報告級別**: 🔴 緊急

---

## 🎯 指南摘要

**核心原則**: 新功能開發必須優先使用 GraphQL + Server Actions  
**主要目標**: 建立統一、高效的 API 架構  
**關鍵收益**: 提升開發效率、降低維護成本、增強類型安全  
**適用範圍**: 所有新功能開發和現有功能重構  

## 📋 背景與目標

### 架構演進背景
- **歷史狀況**: 系統同時存在 REST API、GraphQL、Server Actions 三種技術棧
- **痛點問題**: 維護成本高、開發效率低、類型安全不一致
- **遷移成果**: 已成功移除 24 個 REST API endpoints
- **當前狀態**: GraphQL + Server Actions 為主導架構

### 開發目標
- **統一技術棧**: 所有數據查詢使用 GraphQL，文件操作使用 Server Actions
- **提升效率**: 減少 API 開發工作量 30%
- **增強安全**: 完整類型安全，端到端類型檢查
- **優化性能**: Single Query 模式，避免 N+1 查詢問題

---

## 🔍 GraphQL-First 開發流程

### 新功能開發標準流程

#### 1. 需求分析階段
```typescript
// 確定功能類型
const featureType = {
  dataQuery: 'GraphQL',        // 查詢、訂閱、聚合
  fileOperation: 'ServerAction', // 上傳、下載、處理
  realtime: 'GraphQL',         // 實時更新、推送
  background: 'ServerAction'   // 背景處理、排程
}
```

#### 2. GraphQL Schema 設計
```graphql
# 擴展現有 schema
extend type Query {
  # 新查詢定義
  newFeatureData(input: NewFeatureInput!): NewFeatureResult!
}

# 輸入類型定義
input NewFeatureInput {
  filters: FilterInput
  pagination: PaginationInput
  sorting: SortInput
}

# 結果類型定義
type NewFeatureResult {
  items: [NewFeatureItem!]!
  total: Int!
  aggregates: AggregateData
}
```

#### 3. RPC 函數開發
```sql
-- 創建高效的 Supabase RPC 函數
CREATE OR REPLACE FUNCTION rpc_get_new_feature_data(
  p_filters JSONB DEFAULT '{}',
  p_pagination JSONB DEFAULT '{"limit": 50, "offset": 0}',
  p_sorting JSONB DEFAULT '{"field": "created_at", "direction": "desc"}'
) RETURNS TABLE (
  items JSONB,
  total_count BIGINT,
  aggregates JSONB
) AS $$
BEGIN
  -- 單一查詢返回所有必要數據
  RETURN QUERY
  WITH filtered_data AS (
    SELECT * FROM your_table
    WHERE (CASE WHEN p_filters->>'field' IS NOT NULL 
           THEN field = (p_filters->>'field')::type 
           ELSE TRUE END)
  )
  SELECT 
    jsonb_agg(to_jsonb(filtered_data.*)) as items,
    count(*)::BIGINT as total_count,
    jsonb_build_object(
      'averageValue', avg(value_field),
      'totalSum', sum(sum_field)
    ) as aggregates
  FROM filtered_data;
END;
$$ LANGUAGE plpgsql;
```

#### 4. Service Layer 實現
```typescript
// lib/services/new-feature.service.ts
export class NewFeatureService {
  private cacheAdapter: CacheAdapter;
  private readonly CACHE_TTL = 300; // 5 minutes

  async getData(input: NewFeatureInput, requestId: string): Promise<NewFeatureResult> {
    // 1. 緩存檢查
    const cacheKey = `newfeature:${JSON.stringify(input)}`;
    const cached = await this.cacheAdapter.get(cacheKey);
    if (cached) return cached;

    // 2. RPC 調用
    const { data, error } = await supabase.rpc('rpc_get_new_feature_data', {
      p_filters: input.filters,
      p_pagination: input.pagination,
      p_sorting: input.sorting
    });

    if (error) throw new Error(`RPC call failed: ${error.message}`);

    // 3. 數據轉換
    const result = this.transformData(data);

    // 4. 緩存結果
    await this.cacheAdapter.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }
}
```

#### 5. GraphQL Resolver 整合
```typescript
// lib/graphql/resolvers/new-feature.resolver.ts
export const newFeatureResolvers = {
  Query: {
    newFeatureData: async (_: any, args: { input: NewFeatureInput }, context: any) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);

      try {
        // 權限檢查
        if (!context.user) {
          throw new GraphQLError('Unauthorized', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // Service 調用
        const service = new NewFeatureService();
        const result = await service.getData(args.input, requestId);

        console.log(`[GraphQL-${requestId}] Completed in ${Date.now() - startTime}ms`);
        return result;

      } catch (error) {
        console.error(`[GraphQL-${requestId}] Error:`, error);
        throw error instanceof GraphQLError ? error : new GraphQLError(
          error instanceof Error ? error.message : 'Internal server error',
          { extensions: { code: 'INTERNAL_SERVER_ERROR', requestId } }
        );
      }
    }
  }
};
```

---

## 🏗️ Server Actions 最佳實踐

### 文件操作開發標準

#### 1. 文件上傳 Action
```typescript
// app/actions/new-file-actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const uploadSchema = z.object({
  file: z.instanceof(File),
  category: z.enum(['document', 'image', 'report']),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
});

export async function uploadNewFile(formData: FormData) {
  try {
    // 1. 輸入驗證
    const validated = uploadSchema.parse({
      file: formData.get('file'),
      category: formData.get('category'),
      metadata: JSON.parse(formData.get('metadata') as string || '{}')
    });

    // 2. 安全檢查
    if (validated.file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    // 3. 存儲操作
    const result = await uploadToStorage(validated.file, validated.category);

    // 4. 數據庫記錄
    await recordUpload(result, validated.metadata);

    // 5. 緩存失效
    revalidatePath('/admin');

    return { success: true, data: result };

  } catch (error) {
    console.error('[uploadNewFile] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}
```

---

## 📊 性能優化指南

### Single Query 模式實現

#### 避免 N+1 查詢問題
```typescript
// ❌ 錯誤：N+1 查詢模式
const products = await getProducts();
for (const product of products) {
  product.details = await getProductDetails(product.id); // N+1 問題
}

// ✅ 正確：Single Query 模式
const productsWithDetails = await supabase.rpc('rpc_get_products_with_details', {
  p_product_ids: productIds,
  p_include_details: true
});
```

#### Field Resolver 優化
```typescript
// 使用 DataLoader 避免重複查詢
const productDetailsLoader = new DataLoader(async (productIds: string[]) => {
  const details = await supabase.rpc('rpc_batch_get_product_details', {
    p_product_ids: productIds
  });
  return productIds.map(id => details.find(d => d.product_id === id));
});

// GraphQL Field Resolver
const resolvers = {
  Product: {
    details: async (parent: Product) => {
      return productDetailsLoader.load(parent.id);
    }
  }
};
```

### 緩存策略

#### 多層緩存架構
```typescript
export class CacheStrategy {
  // L1: Apollo Server 響應緩存（1-5分鐘）
  getServerCacheHints(operation: string) {
    return {
      maxAge: 300, // 5 分鐘
      scope: 'PRIVATE' // 或 'PUBLIC'
    };
  }

  // L2: Apollo Client 正規化緩存
  configureApolloCache() {
    return new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // 定義緩存合併策略
          }
        }
      }
    });
  }

  // L3: React Query 緩存層（可選，用於複雜狀態管理）
  getQueryOptions(operation: string) {
    return {
      staleTime: 5 * 60 * 1000, // 5 分鐘
      cacheTime: 10 * 60 * 1000, // 10 分鐘
      refetchOnWindowFocus: false
    };
  }

  // 緩存策略選擇
  getCachePolicy(operation: string) {
    return {
      'realtime-data': 'network-only',
      'static-data': 'cache-first',
      'user-data': 'cache-and-network'
    }[operation] || 'cache-first';
  }
}
```

---

## 🔒 安全與權限控制

### GraphQL 權限模式
```typescript
// 統一權限檢查中間件
export function requireAuth(resolver: Function) {
  return async (parent: any, args: any, context: any, info: any) => {
    if (!context.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
    return resolver(parent, args, context, info);
  };
}

// 角色權限檢查
export function requireRole(roles: string[]) {
  return (resolver: Function) => async (parent: any, args: any, context: any, info: any) => {
    const userRole = context.user?.role;
    if (!roles.includes(userRole)) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' }
      });
    }
    return resolver(parent, args, context, info);
  };
}

// 使用範例
const resolvers = {
  Query: {
    sensitiveData: requireAuth(requireRole(['admin', 'manager'])(
      async (_, args, context) => {
        return await getSensitiveData(args, context.user);
      }
    ))
  }
};
```

---

## 🧪 測試策略

### GraphQL 測試範例
```typescript
// __tests__/graphql/new-feature.test.ts
import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server-core';

describe('NewFeature GraphQL', () => {
  let testClient: TestClient;

  beforeEach(() => {
    testClient = createTestClient(server);
  });

  it('should fetch feature data', async () => {
    const query = gql`
      query GetNewFeatureData($input: NewFeatureInput!) {
        newFeatureData(input: $input) {
          items {
            id
            name
            status
          }
          total
          aggregates {
            totalValue
            averageScore
          }
        }
      }
    `;

    const { data, errors } = await testClient.query({
      query,
      variables: {
        input: {
          filters: { status: 'active' },
          pagination: { limit: 10, offset: 0 }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.newFeatureData.items).toHaveLength(10);
    expect(data.newFeatureData.total).toBeGreaterThan(0);
  });
});
```

---

## 📈 監控與除錯

### GraphQL 查詢監控
```typescript
// lib/monitoring/graphql-monitor.ts
export class GraphQLMonitor {
  static trackQuery(operation: string, duration: number, success: boolean) {
    // 記錄查詢性能
    console.log(`[GraphQL] ${operation}: ${duration}ms ${success ? '✅' : '❌'}`);
    
    // 發送到監控系統
    if (duration > 1000) {
      console.warn(`[GraphQL] Slow query detected: ${operation} took ${duration}ms`);
    }
  }

  static trackError(operation: string, error: Error) {
    console.error(`[GraphQL] Error in ${operation}:`, error);
    // 發送錯誤報告
  }
}
```

### 開發工具配置
```typescript
// next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true
  },
  
  // GraphQL 開發工具
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  }
};
```

---

## 🚀 部署指南

### 生產環境配置
```typescript
// GraphQL 生產優化
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // 查詢複雜度限制
    require('graphql-query-complexity').createComplexityLimitRule(1000),
    
    // 查詢深度限制
    require('graphql-depth-limit')(10),
    
    // 速率限制
    require('graphql-rate-limit')({
      max: 1000,
      window: '15m'
    })
  ],
  
  // 生產環境禁用 introspection
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});
```

---

## 📚 相關文檔
- [Single Query 模式指南](./Single-Query-Pattern-Guide.md)
- [Card 架構開發指南](./Card架構開發指南.md)
- [TypeScript 遷移指南](./TypeScript-Migration-Guide.md)
- [GraphQL-Card 遷移策略](../expert-discussions/2025-07-27-GraphQL-Card-Migration-Strategy.md)

---

**指南建立**: AI 協作者  
**技術審核**: 架構專家  
**執行負責**: 開發團隊  
**最後更新**: 2025-07-28 18:00