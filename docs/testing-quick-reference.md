# NewPennine 測試快速參考指南

**快速上手** | **常用模式** | **一頁搞定**  
適合：日常開發參考、新人快速上手、代碼評審檢查

## 🚀 快速開始

```bash
# 基本測試命令
npm test                    # 執行所有測試
npm run test:watch         # 監視模式
npm run test:coverage      # 生成覆蓋率報告

# 並行與性能測試 (Day 11-12 優化)
npm run test:parallel       # 並行測試 (50% workers)
npm run test:performance    # 性能監控
npm run test:ci            # CI 環境測試
```

## 📋 測試檢查清單

### ✅ 每個測試文件必須包含：
- [ ] 基本 Happy Path 測試
- [ ] 錯誤處理測試  
- [ ] 邊界值測試
- [ ] Loading/Error 狀態測試
- [ ] Mock 清理 (`beforeEach: jest.clearAllMocks()`)

### ✅ 測試命名規範：
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    test('should do expected behavior when valid input', () => {})
    test('should handle error when invalid input', () => {})
    test('should return empty when no data found', () => {})
  })
})
```

## 🛠️ 常用測試模式

### 1. API Route 測試
```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// GET 測試
test('should return data successfully', async () => {
  const request = new NextRequest('http://localhost/api/endpoint');
  const response = await GET(request);
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty('success', true);
});

// POST 測試
test('should create resource', async () => {
  const request = new NextRequest('http://localhost/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ name: 'test' }),
  });
  
  const response = await POST(request);
  expect(response.status).toBe(201);
});
```

### 2. Service 層測試
```typescript
import { createMockSupabaseClient } from '@/__tests__/mocks/factories';

describe('MyService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  test('should fetch data successfully', async () => {
    // 設置 mock 響應
    mockSupabase.from().select().eq.mockResolvedValue({
      data: [{ id: 1, name: 'test' }],
      error: null
    });

    // 執行測試
    const result = await myService.getData('123');
    
    // 驗證結果
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});
```

### 3. React Component 測試
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('should render and handle user interaction', async () => {
  const user = userEvent.setup();
  
  render(<MyComponent />);
  
  // 查找元素
  const button = screen.getByRole('button', { name: /click me/i });
  
  // 模擬用戶交互
  await user.click(button);
  
  // 等待異步更新
  await waitFor(() => {
    expect(screen.getByText('Updated!')).toBeInTheDocument();
  });
});
```

### 4. Hook 測試
```typescript
import { renderHook, act } from '@testing-library/react';

test('should update state correctly', async () => {
  const { result } = renderHook(() => useMyHook());
  
  await act(async () => {
    result.current.updateData('new value');
  });
  
  expect(result.current.data).toBe('new value');
});
```

## 🎯 常用 Mock 模式

### Supabase Client Mock
```typescript
const mockSupabase = createMockSupabaseClient();
mockSupabase.from().select().eq.mockResolvedValue({
  data: [/* mock data */],
  error: null
});
```

### RPC Function Mock
```typescript
mockSupabase.rpc.mockImplementation((functionName, params) => {
  switch (functionName) {
    case 'my_rpc_function':
      return Promise.resolve({ data: 'result', error: null });
    default:
      return Promise.resolve({ data: null, error: null });
  }
});
```

### External API Mock (MSW)
```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/__tests__/setup';

server.use(
  http.get('https://api.external.com/data', () => {
    return HttpResponse.json({ data: 'mock response' });
  })
);
```

## ⚡ 性能優化測試模式

### 並發測試
```typescript
test('should handle concurrent operations', async () => {
  const operations = [
    myService.operation1(),
    myService.operation2(),
    myService.operation3()
  ];
  
  const results = await Promise.allSettled(operations);
  
  results.forEach(result => {
    expect(result.status).toBe('fulfilled');
  });
});
```

### 緩存測試
```typescript
test('should use cache on second call', async () => {
  // 第一次調用
  const start1 = performance.now();
  await myService.getData();
  const uncachedTime = performance.now() - start1;

  // 第二次調用 (應該來自緩存)
  const start2 = performance.now();
  await myService.getData();
  const cachedTime = performance.now() - start2;

  expect(cachedTime).toBeLessThan(uncachedTime * 0.5);
});
```

## 🚨 常見錯誤與快速修復

### Mock 未清理
```typescript
// ❌ 問題：測試間 mock 狀態洩漏
// ✅ 解決：每個測試前清理
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 異步操作未等待
```typescript
// ❌ 問題：未等待異步操作
test('should update', () => {
  component.updateAsync();
  expect(result).toBe('updated'); // 可能失敗
});

// ✅ 解決：正確等待
test('should update', async () => {
  await component.updateAsync();
  expect(result).toBe('updated');
});
```

### React Hook 警告
```typescript
// ❌ 問題：狀態更新未包裝在 act()
// ✅ 解決：使用 act()
await act(async () => {
  result.current.updateState();
  await waitFor(() => {
    expect(result.current.state).toBe('updated');
  });
});
```

### TypeScript 類型錯誤
```typescript
// ❌ 問題：ReturnType<typeof function> 語法錯誤
let client: ReturnType<typeof createMockSupabaseClient>;

// ✅ 解決：簡化類型聲明
let client: any; // 或使用具體類型
```

## 📊 測試覆蓋率目標

| 類型 | 目標 | 命令 |
|------|------|------|
| 整體覆蓋率 | 15%+ | `npm run test:coverage` |
| 核心服務 | 90%+ | `npm test -- app/services` |
| API Routes | 80%+ | `npm test -- app/api` |
| 組件 | 70%+ | `npm test -- components` |

## 🔧 測試工具速查

### Jest 配置重點
```javascript
// jest.config.js 關鍵配置
{
  maxWorkers: '50%',           // 並行執行
  testTimeout: 10000,          // 10秒超時
  clearMocks: true,            // 自動清理 mock
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
```

### 測試文件位置
```
__tests__/
├── mocks/              # Mock 文件
│   ├── factories.ts    # 測試數據工廠
│   └── scenarios/      # 場景數據
├── utils/              # 測試工具
└── integration/        # 集成測試

app/
├── services/__tests__/     # 服務測試
├── components/__tests__/   # 組件測試
└── api/__tests__/         # API 測試
```

### 有用的測試輔助函數
```typescript
// 現有輔助函數
import { createMockSupabaseClient } from '@/__tests__/mocks/factories';
import { useTestCleanup } from '@/__tests__/utils/cleanup';
import { createStockTransferScenario } from '@/__tests__/mocks/scenarios/stock-transfer.scenario';
```

## 📚 延伸閱讀

- **詳細指南**: [測試最佳實踐指南](./api-testing-guide.md)
- **Widget 測試**: [Widget 開發指南](./widget-development-guide.md#測試策略)  
- **錯誤記錄**: [測試修復錯誤](./issue-library/test-fixing-errors.md)
- **項目任務**: [測試覆蓋率 v1.1 任務](./planning/test-coverage-v1.1-tasks.md)

---

💡 **記住**: 好的測試應該快速、獨立、可重複、自解釋！

*最後更新: 2025-07-12 | Day 13 文檔*