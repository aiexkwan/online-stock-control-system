# NewPennine 測試最佳實踐指南

**最後更新**: 2025-07-12  
**適用版本**: Next.js 15 + Jest + TypeScript  
**覆蓋範圍**: API Routes, Components, Services, Integration, Performance

## 概述

本指南提供 NewPennine 項目中全面的測試最佳實踐，涵蓋 API 路由、組件、服務、集成測試和性能測試。基於 Day 1-12 測試覆蓋率提升項目的實戰經驗編寫。

## 測試架構概覽

NewPennine 採用分層測試策略：

```
┌─────────────────┐
│   E2E 測試      │  ← Playwright (用戶流程)
├─────────────────┤
│   整合測試      │  ← Jest (API + DB)
├─────────────────┤
│   組件測試      │  ← React Testing Library
├─────────────────┤
│   服務測試      │  ← Jest (業務邏輯)
├─────────────────┤
│   單元測試      │  ← Jest (純函數)
└─────────────────┘
```

### 測試執行優化 (Day 11-12 更新)

- **並行執行**: `maxWorkers: 50%` (本地), `2` (CI)
- **智能緩存**: RPC、Widget、文件系統分層緩存
- **數據庫連接池**: 優化測試環境連接管理
- **性能監控**: 自動檢測慢測試 (>5秒)

## 測試環境設置

### 1. 必要套件

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "msw": "^2.10.3",
    "@mswjs/data": "^0.16.2"
  }
}
```

### 2. Jest 配置

在 `jest.setup.js` 中已配置必要的 mock：

```javascript
// Mock Next.js Request/Response
global.Request = class Request { /* ... */ };
global.Response = class Response { /* ... */ };

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest extends Request { /* ... */ },
  NextResponse: {
    json: (data, init) => {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
    },
  },
}));
```

## 服務層測試 (Day 6-10 經驗)

### PalletSearchService 測試模式

基於 Day 6-7 實戰經驗：

```typescript
// app/services/__tests__/palletSearchService.test.ts
import { searchPallet, batchSearchPallets } from '../palletSearchService';
import { createMockSupabaseClient } from '@/__tests__/mocks/factories';

describe('PalletSearchService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('searchPallet', () => {
    test('should search by pallet number successfully', async () => {
      const mockData = [{ plt_num: 'PLT123', product_code: 'PROD001' }];
      mockSupabase.from().select().ilike.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await searchPallet('pallet', 'PLT123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    test('should handle database errors gracefully', async () => {
      mockSupabase.from().select().ilike.mockResolvedValue({
        data: null,
        error: new Error('Connection failed')
      });

      const result = await searchPallet('pallet', 'PLT123');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });
});
```

### TransactionLogService 測試模式

基於 Day 8-9 實戰經驗，測試複雜的事務管理：

```typescript
// app/services/__tests__/transactionLog.service.test.ts
import { TransactionLogService } from '../transactionLog.service';

describe('TransactionLogService', () => {
  let service: TransactionLogService;

  beforeEach(() => {
    service = TransactionLogService.getInstance();
  });

  describe('Transaction Lifecycle', () => {
    test('should start, record steps, and complete transaction', async () => {
      const transactionId = await service.startTransaction('test_operation');
      
      await service.recordTransactionStep(transactionId, 'step_1', { data: 'test' });
      await service.recordTransactionStep(transactionId, 'step_2', { data: 'test2' });
      
      const result = await service.completeTransaction(transactionId);
      
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe(transactionId);
    });

    test('should handle concurrent transactions without interference', async () => {
      const transaction1 = service.startTransaction('operation_1');
      const transaction2 = service.startTransaction('operation_2');
      
      const [id1, id2] = await Promise.all([transaction1, transaction2]);
      
      expect(id1).not.toBe(id2);
      // 並發測試確保事務隔離
    });
  });
});
```

### InventoryService 測試模式

基於 Day 10 實戰經驗，測試庫存管理邏輯：

```typescript
// app/void-pallet/services/__tests__/inventoryService.test.ts
import { updateInventoryForVoid, updateStockLevel } from '../inventoryService';

describe('InventoryService', () => {
  describe('Stock Level Updates', () => {
    test('should handle negative stock protection', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: 'PROD123 - from 50 to -50',
        error: null
      });

      const result = await updateStockLevel('PROD123', 100, 'void');
      
      expect(result.success).toBe(true);
      expect(result.result).toContain('-50');
    });

    test('should validate RPC function calls', async () => {
      await updateStockLevel('PROD456', 50, 'damage');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_stock_level_void', {
        p_product_code: 'PROD456',
        p_quantity: 50,
        p_operation: 'damage',
      });
    });
  });
});
```

## Widget 測試模式

### React 組件測試

```typescript
// Widget 測試標準模式
import { render, screen, waitFor } from '@testing-library/react';
import { useWidgetSmartCache } from '@/app/admin/hooks/useWidgetSmartCache';

// Mock Widget 相關 hooks
jest.mock('@/app/admin/hooks/useWidgetSmartCache');

describe('StockDistributionWidget', () => {
  beforeEach(() => {
    (useWidgetSmartCache as jest.Mock).mockReturnValue({
      data: mockWidgetData,
      loading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  test('should render chart data correctly', async () => {
    render(<StockDistributionWidget />);
    
    await waitFor(() => {
      expect(screen.getByTestId('stock-chart')).toBeInTheDocument();
    });
  });
});
```

### 測試優化工具使用 (Day 11-12)

#### 智能緩存測試

```typescript
import { createTestCache, withCache } from '@/__tests__/utils/test-cache-strategy';

describe('Widget Data Caching', () => {
  test('should cache RPC call results', async () => {
    const cache = createTestCache('rpc');
    
    await cache.cacheRpcCall('get_stock_data', { date: '2025-07-12' }, mockData);
    const cached = await cache.getCachedRpcCall('get_stock_data', { date: '2025-07-12' });
    
    expect(cached).toEqual(mockData);
  });
});
```

#### 數據庫連接池測試

```typescript
import { getTestDbConnection, getTestDbStats } from '@/__tests__/utils/test-db-pool';

describe('Database Connection Pool', () => {
  test('should reuse connections efficiently', async () => {
    const conn1 = await getTestDbConnection('test-1');
    const conn2 = await getTestDbConnection('test-1'); // 應該重用
    
    const stats = getTestDbStats();
    expect(stats.reused).toBeGreaterThan(0);
  });
});
```

## API Route 測試模式

### 基本測試結構

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

describe('GET /api/your-endpoint', () => {
  it('should return successful response', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-endpoint');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('expectedProperty');
  });
});
```

### 測試 Query Parameters

```typescript
it('should handle query parameters', async () => {
  const request = new NextRequest('http://localhost:3000/api/endpoint?param1=value1&param2=value2');
  const response = await GET(request);
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.param1).toBe('value1');
});
```

### 測試 POST 請求

```typescript
it('should create resource via POST', async () => {
  const body = JSON.stringify({
    name: 'Test Item',
    value: 123
  });
  
  const request = new NextRequest('http://localhost:3000/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  
  const response = await POST(request);
  
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data).toMatchObject({
    id: expect.any(String),
    name: 'Test Item',
    value: 123,
  });
});
```

## Mock 策略

### 1. Supabase Client Mock

```typescript
// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({
    data: [],
    error: null
  })
};

jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}));
```

### 2. 測試不同響應場景

```typescript
describe('Error handling', () => {
  it('should return 500 on database error', async () => {
    mockSupabaseClient.order.mockResolvedValueOnce({
      data: null,
      error: new Error('Database connection failed')
    });

    const response = await GET();
    
    expect(response.status).toBe(500);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });
});
```

### 3. MSW 高級用法

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/jest.setup';

it('should handle external API calls', async () => {
  // Override default handler for this test
  server.use(
    http.get('https://api.external.com/data', () => {
      return HttpResponse.json({ 
        customData: 'test' 
      });
    })
  );

  const response = await GET();
  // Test implementation that calls external API
});
```

## 常見測試案例

### 1. 身份驗證測試

```typescript
it('should require authentication', async () => {
  const request = new NextRequest('http://localhost:3000/api/protected', {
    headers: {
      // Missing auth token
    }
  });
  
  const response = await GET(request);
  expect(response.status).toBe(401);
});

it('should accept valid auth token', async () => {
  const request = new NextRequest('http://localhost:3000/api/protected', {
    headers: {
      'Authorization': 'Bearer valid-token'
    }
  });
  
  const response = await GET(request);
  expect(response.status).toBe(200);
});
```

### 2. 輸入驗證測試

```typescript
describe('Input validation', () => {
  const invalidInputs = [
    { data: {}, expectedError: 'name is required' },
    { data: { name: '' }, expectedError: 'name cannot be empty' },
    { data: { name: 'test', value: -1 }, expectedError: 'value must be positive' },
  ];

  invalidInputs.forEach(({ data, expectedError }) => {
    it(`should reject invalid input: ${expectedError}`, async () => {
      const request = new NextRequest('http://localhost:3000/api/endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain(expectedError);
    });
  });
});
```

### 3. 分頁測試

```typescript
it('should handle pagination', async () => {
  const mockData = Array(50).fill(null).map((_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`
  }));
  
  mockSupabaseClient.select.mockImplementation(() => ({
    range: jest.fn((start, end) => ({
      order: jest.fn().mockResolvedValue({
        data: mockData.slice(start, end + 1),
        error: null
      })
    }))
  }));

  const request = new NextRequest('http://localhost:3000/api/items?page=2&limit=10');
  const response = await GET(request);
  
  const data = await response.json();
  expect(data.items).toHaveLength(10);
  expect(data.items[0].id).toBe(11); // Second page starts at item 11
});
```

### 4. 性能測試

```typescript
it('should respond within acceptable time', async () => {
  const start = Date.now();
  const response = await GET();
  const end = Date.now();
  
  const responseTime = end - start;
  expect(response.status).toBe(200);
  expect(responseTime).toBeLessThan(100); // 100ms threshold
});
```

## 性能測試策略

### 1. 測試執行效能監控

```typescript
// jest.setup.js 自動慢測試檢測
const slowTestThreshold = 5000; // 5秒
let testStartTime;

beforeEach(() => {
  testStartTime = performance.now();
});

afterEach(() => {
  const testDuration = performance.now() - testStartTime;
  if (testDuration > slowTestThreshold) {
    console.warn(`Slow test detected: took ${testDuration}ms`);
  }
});
```

### 2. 性能基準測試

```typescript
describe('Performance Benchmarks', () => {
  test('API response time should be under 100ms', async () => {
    const start = performance.now();
    const response = await GET();
    const end = performance.now();
    
    expect(response.status).toBe(200);
    expect(end - start).toBeLessThan(100);
  });

  test('Widget render time should be under 500ms', async () => {
    const start = performance.now();
    render(<ComplexWidget />);
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
  });
});
```

### 3. 並行測試配置

```bash
# 本地開發
npm run test:parallel   # 4 workers

# CI 環境  
npm run test:ci         # 2 workers, 適合 CI 資源限制
```

### 4. 緩存性能測試

```typescript
describe('Cache Performance', () => {
  test('should improve response time with cache', async () => {
    // 第一次調用 (無緩存)
    const start1 = performance.now();
    await getWidgetData('widget-id');
    const uncachedTime = performance.now() - start1;

    // 第二次調用 (有緩存)
    const start2 = performance.now();
    await getWidgetData('widget-id');
    const cachedTime = performance.now() - start2;

    expect(cachedTime).toBeLessThan(uncachedTime * 0.5); // 50% 性能提升
  });
});
```

## 最佳實踐 (基於 Day 1-12 經驗)

### 1. 測試隔離與清理

每個測試應該獨立運行，不依賴其他測試的狀態：

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. 統一 Mock 策略 (Day 3-4 經驗)

使用標準化 Mock 工廠：

```typescript
// __tests__/mocks/factories.ts
import { createMockSupabaseClient } from './supabase-client';

export function createMockQueryChain() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null })
  };
}

// 使用方式
beforeEach(() => {
  mockSupabase = createMockSupabaseClient();
  // 確保每個測試開始時 mock 都被重置
});
```

### 3. 描述性測試名稱與分組

使用清晰的測試描述和分組：

```typescript
describe('PalletSearchService', () => {
  describe('searchPallet', () => {
    describe('when searching by pallet number', () => {
      test('should return matching pallets', async () => {});
      test('should handle non-existent pallet numbers', async () => {});
    });
    
    describe('when searching by series', () => {
      test('should return all pallets in series', async () => {});
      test('should filter voided pallets by default', async () => {});
    });
  });
});
```

### 4. 測試覆蓋完整性 (更新版)

基於實戰經驗，確保測試覆蓋：
- ✅ **Happy path**（正常流程）
- ✅ **Error cases**（數據庫錯誤、網絡錯誤）
- ✅ **Edge cases**（空值、特殊字符、極大數值）
- ✅ **Authentication/Authorization**（認證授權）
- ✅ **Input validation**（輸入驗證）
- ✅ **Concurrent operations**（並發操作處理）
- ✅ **Performance thresholds**（性能閾值）
- ✅ **Cache behavior**（緩存行為）

### 4. 使用輔助函數

創建可重用的測試輔助函數：

```typescript
// test-helpers.ts
export function createAuthenticatedRequest(url: string, token: string) {
  return new NextRequest(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function expectErrorResponse(response: Response, status: number, errorMessage: string) {
  expect(response.status).toBe(status);
  const error = await response.json();
  expect(error.error).toContain(errorMessage);
}
```

### 5. Mock 數據工廠

使用工廠函數生成測試數據：

```typescript
// __tests__/factories/product.factory.ts
export function createMockProduct(overrides = {}) {
  return {
    id: 'prod-123',
    name: 'Test Product',
    code: 'TEST001',
    quantity: 100,
    price: 99.99,
    ...overrides
  };
}
```

## 常見問題解決 (基於 Day 1-12 實戰經驗)

### 1. TypeScript 語法解析錯誤 (Day 11-12 發現)

**問題**: `ReturnType<typeof function>` 語法錯誤

```typescript
// 問題代碼
let supabase: ReturnType<typeof createMockSupabaseClient>;

// 解決方案 1: 簡化類型聲明
let supabase: any;

// 解決方案 2: 更新 Babel 配置
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-typescript', { allowDeclareFields: true }]
  ]
};
```

### 2. 無限遞歸 Mock 錯誤 (Day 10 經驗)

**問題**: Mock 函數調用自己導致堆疊溢出

```typescript
// ❌ 錯誤: 會導致無限遞歸
mockSupabase.from.mockImplementation((table) => {
  if (table === 'specific_table') {
    return mockTableQuery;
  }
  return mockSupabase.from(table); // 遞歸調用！
});

// ✅ 正確: 提供默認 mock 對象
mockSupabase.from.mockImplementation((table) => {
  if (table === 'specific_table') {
    return mockTableQuery;
  }
  return createDefaultMockQuery(); // 使用默認 mock
});
```

### 3. React Hook 測試錯誤

**問題**: Hook 測試中的狀態更新警告

```typescript
// ✅ 正確的異步 Hook 測試
test('should update state correctly', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    result.current.updateData();
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### 4. Supabase RPC Mock 設置

**問題**: RPC 函數 mock 不正確

```typescript
// ✅ 正確的 RPC mock 設置
mockSupabase.rpc.mockImplementation((functionName, params) => {
  switch (functionName) {
    case 'update_stock_level_void':
      return Promise.resolve({
        data: `${params.p_product_code} - updated`,
        error: null
      });
    default:
      return Promise.resolve({ data: null, error: null });
  }
});
```

### 5. 並發測試隔離問題

**問題**: 並發測試互相干擾

```typescript
// ✅ 正確的並發測試隔離
describe('Concurrent Operations', () => {
  test('should handle multiple operations independently', async () => {
    const operations = [
      operation1('param1'),
      operation2('param2'),
      operation3('param3')
    ];
    
    const results = await Promise.allSettled(operations);
    
    // 檢查每個操作的獨立結果
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');
    expect(results[2].status).toBe('fulfilled');
  });
});
```

### 6. 緩存測試問題

**問題**: 緩存狀態在測試間洩漏

```typescript
// ✅ 每個測試清理緩存
beforeEach(() => {
  // 清理所有 mock
  jest.clearAllMocks();
  
  // 清理緩存
  const cache = TestCacheStrategy.getInstance();
  cache.clear();
  
  // 重置數據庫連接池統計
  const pool = TestDbPool.getInstance();
  pool.resetStats();
});
```

## 持續集成配置 (Day 11-12 更新)

### GitHub Actions 優化工作流程

```yaml
# .github/workflows/test-optimization.yml
name: 優化測試執行流程

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-parallel:
    strategy:
      matrix:
        test-group: [unit, integration, services]
    steps:
      - name: 運行測試 - ${{ matrix.test-group }}
        run: |
          case "${{ matrix.test-group }}" in
            "unit") npm run test:unit -- --ci --coverage --maxWorkers=2 ;;
            "integration") npm run test:integration -- --ci --maxWorkers=1 ;;
            "services") npm test -- --testPathPattern='services' --ci --coverage ;;
          esac

  performance-test:
    name: 性能測試
    steps:
      - name: 運行性能測試
        run: npm run test:performance
      - name: 生成緩存統計
        run: npm run test:cache-stats
```

### 測試命令總覽

```bash
# 基本測試
npm test                    # 標準測試
npm run test:coverage       # 覆蓋率報告
npm run test:watch         # 監視模式

# 並行與性能
npm run test:parallel       # 並行測試 (4 workers)
npm run test:performance    # 性能測試與監控  
npm run test:cache-stats    # 緩存統計
npm run test:profile        # Node.js profiler 除錯

# CI/CD
npm run test:ci            # CI 環境專用腳本
npm run test:unit          # 只運行單元測試
npm run test:integration   # 只運行整合測試
```

## 測試覆蓋率目標 (v1.1 標準)

基於 Day 1-12 實施結果：

| 測試類型 | 目標覆蓋率 | 當前狀態 |
|---------|-----------|---------|
| 整體覆蓋率 | 15% | 14.98% ✅ |
| 核心服務 | 90%+ | 100% ✅ |
| TransactionLogService | 100% | 100% ✅ |
| InventoryService | 100% | 100% ✅ |
| PalletSearchService | 90%+ | 90.9% ✅ |

## 結語

本指南基於 NewPennine 項目 Day 1-12 測試覆蓋率提升的實戰經驗編寫，涵蓋從單元測試到性能優化的完整測試策略。重點改進包括：

### ✅ 已實現的優化：
- **並行測試執行**: 40-60% 性能提升
- **智能緩存策略**: 減少重複計算和網絡請求
- **數據庫連接池**: 優化測試環境資源使用
- **自動化 CI/CD**: 完整的測試流程和報告

### 🔄 持續改進：
- 定期更新測試模式和最佳實踐
- 監控測試性能和覆蓋率趨勢
- 整合新的測試工具和技術
- 建立團隊測試文化和知識分享

遵循這些指南可以確保測試的一致性、可維護性和高效率。隨著項目發展，持續優化測試策略，保持代碼質量和開發速度的平衡。

---

### 📚 相關文檔：
- [測試覆蓋率 v1.1 任務清單](./planning/test-coverage-v1.1-tasks.md)
- [測試修復錯誤記錄](./issue-library/test-fixing-errors.md)
- [Widget 開發測試指南](./widget-development-guide.md#測試策略)
- [性能優化最佳實踐](./performance-best-practices.md)
- [GitHub Actions 工作流程](./.github/workflows/test-optimization.yml)

### 🛠️ 測試工具與資源：
- [測試數據工廠](./__tests__/mocks/factories.ts)
- [Supabase Mock 系統](./__tests__/mocks/supabase-rpc-mocks.ts)
- [測試緩存策略](./__tests__/utils/test-cache-strategy.ts)
- [數據庫連接池](./__tests__/utils/test-db-pool.ts)
- [API 測試模板](./__tests__/templates/api-route.template.ts)