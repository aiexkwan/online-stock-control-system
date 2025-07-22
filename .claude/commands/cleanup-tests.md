# 測試清理命令

## 用法
`/cleanup-tests` 或 `/cleanup-tests [測試類型/模組]`

## 執行流程
1. **啟動工具**
   - Ultrathink - 深度測試分析
   - Sequential-thinking - 系統性測試策略
   - Task - 並行測試執行
   - Puppeteer MCP - E2E 測試優化

2. **測試分析**
   - 測試覆蓋率分析
   - 失敗測試修復
   - 測試性能優化
   - 測試穩定性提升

3. **測試憑證**
   - Email: ${env.local.PUPPETEER_LOGIN}
   - Password: ${env.local.PUPPETEER_PASSWORD}

## 角色建議
- 主要角色: 🧪 QA（測試專家）
- 協作角色: ⚙️ Backend + 🎨 Frontend + 🔒 Security
- 分析角色: 📊 Analyzer（測試分析）

## 測試檢查項目
### 📊 測試覆蓋率
- [ ] 單元測試覆蓋率 (>80%)
- [ ] 整合測試覆蓋率 (>70%)
- [ ] E2E 測試覆蓋率 (>60%)
- [ ] 關鍵路徑覆蓋 (100%)
- [ ] 邊緣案例覆蓋

### 🔧 測試質量
- [ ] 測試穩定性 (>95%)
- [ ] 測試執行速度
- [ ] 測試可讀性
- [ ] 測試維護性
- [ ] 模擬數據質量

### 🎯 測試策略
- [ ] 測試金字塔平衡
- [ ] 測試隔離性
- [ ] 測試數據管理
- [ ] 測試環境一致性
- [ ] 持續集成整合

## 測試覆蓋率目標
| 測試類型 | 目標覆蓋率 | 當前覆蓋率 | 差距 | 優先級 |
|---------|-----------|-----------|------|--------|
| 單元測試 | >80% | X% | X% | 🔴 高 |
| 整合測試 | >70% | X% | X% | 🟡 中 |
| E2E 測試 | >60% | X% | X% | 🟡 中 |
| API 測試 | >90% | X% | X% | 🔴 高 |
| 性能測試 | >50% | X% | X% | 🟢 低 |

## 測試類型優化
### 🧪 單元測試優化
```typescript
// 優化前：不穩定的測試
describe('UserService', () => {
  test('should create user', async () => {
    const user = await userService.createUser({
      name: 'John',
      email: 'john@example.com'
    });

    expect(user.id).toBeDefined(); // 不穩定
    expect(user.createdAt).toBe(new Date()); // 時間比較問題
  });
});

// 優化後：穩定的測試
describe('UserService', () => {
  const mockDate = new Date('2024-01-01');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const user = await userService.createUser(userData);

    expect(user).toMatchObject({
      name: userData.name,
      email: userData.email,
      createdAt: mockDate
    });
    expect(user.id).toMatch(/^[a-f0-9-]{36}$/); // UUID 格式
  });

  test('should throw error for invalid email', async () => {
    await expect(userService.createUser({
      name: 'John',
      email: 'invalid-email'
    })).rejects.toThrow('Invalid email format');
  });
});
```

### 🔄 整合測試優化
```typescript
// 資料庫整合測試
describe('PalletService Integration', () => {
  beforeEach(async () => {
    // 清理測試數據
    await testDb.cleanup();

    // 建立測試數據
    await testDb.seed([
      {
        table: 'data_code',
        data: [
          { product_code: 'TEST001', description: 'Test Product 1' },
          { product_code: 'TEST002', description: 'Test Product 2' }
        ]
      }
    ]);
  });

  test('should create pallet with valid product', async () => {
    const palletData = {
      product_code: 'TEST001',
      quantity: 100,
      location: 'A1-B2-C3'
    };

    const pallet = await palletService.createPallet(palletData);

    expect(pallet).toMatchObject({
      product_code: 'TEST001',
      quantity: 100,
      location: 'A1-B2-C3',
      status: 'active'
    });

    // 驗證資料庫狀態
    const savedPallet = await testDb.findOne('record_palletinfo', {
      pallet_no: pallet.pallet_no
    });

    expect(savedPallet).toBeDefined();
    expect(savedPallet.product_code).toBe('TEST001');
  });
});
```

### 🌐 E2E 測試優化
```typescript
// Playwright E2E 測試
describe('QC Label Printing E2E', () => {
  test('should print QC label successfully', async ({ page }) => {
    // 登入
    await page.goto('/login');
    await page.fill('[data-testid="email"]', process.env.PUPPETEER_LOGIN);
    await page.fill('[data-testid="password"]', process.env.PUPPETEER_PASSWORD);
    await page.click('[data-testid="login-button"]');

    // 等待登入完成
    await page.waitForURL('/dashboard');

    // 前往 QC 標籤頁面
    await page.goto('/print-label');

    // 填寫表單
    await page.fill('[data-testid="product-code"]', 'TEST001');
    await page.fill('[data-testid="quantity"]', '100');
    await page.selectOption('[data-testid="location"]', 'A1-B2-C3');

    // 提交表單
    await page.click('[data-testid="generate-label"]');

    // 驗證結果
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="pallet-number"]')).toContainText(/^P\d{9}$/);

    // 驗證 PDF 生成
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-pdf"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^QC_Label_P\d{9}\.pdf$/);
  });

  test('should handle validation errors', async ({ page }) => {
    await page.goto('/print-label');

    // 提交空表單
    await page.click('[data-testid="generate-label"]');

    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-product-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-quantity"]')).toBeVisible();
  });
});
```

## 測試數據管理
### 🗃️ 測試數據工廠
```typescript
// 測試數據工廠
export class TestDataFactory {
  static createProduct(overrides?: Partial<Product>): Product {
    return {
      product_code: faker.string.alphanumeric(6).toUpperCase(),
      description: faker.commerce.productName(),
      unit: faker.helpers.arrayElement(['PCS', 'KG', 'M']),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static createPallet(overrides?: Partial<Pallet>): Pallet {
    return {
      pallet_no: `P${Date.now()}${Math.floor(Math.random() * 1000)}`,
      product_code: faker.string.alphanumeric(6).toUpperCase(),
      quantity: faker.number.int({ min: 1, max: 1000 }),
      location: faker.helpers.arrayElement(['A1-B2-C3', 'B1-C2-D3', 'C1-D2-E3']),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  }

  static async seedDatabase(data: TestSeedData[]): Promise<void> {
    for (const seedData of data) {
      await testDb.insertMany(seedData.table, seedData.data);
    }
  }
}

// 測試數據庫工具
export class TestDatabase {
  async cleanup(): Promise<void> {
    const tables = [
      'record_palletinfo',
      'record_inventory',
      'record_history',
      'data_code'
    ];

    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '');
    }
  }

  async seed(data: TestSeedData[]): Promise<void> {
    for (const { table, data: tableData } of data) {
      await supabase.from(table).insert(tableData);
    }
  }

  async findOne(table: string, where: Record<string, any>): Promise<any> {
    const { data } = await supabase
      .from(table)
      .select('*')
      .match(where)
      .single();

    return data;
  }
}
```

## 測試性能優化
### ⚡ 測試速度優化
```typescript
// 優化前：慢速測試
describe('Slow Tests', () => {
  test('should process large dataset', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random()
    }));

    const result = await processData(largeData);
    expect(result.length).toBe(10000);
  });
});

// 優化後：快速測試
describe('Fast Tests', () => {
  test('should process data correctly', async () => {
    // 使用小數據集測試邏輯
    const testData = [
      { id: 1, value: 0.5 },
      { id: 2, value: 0.8 },
      { id: 3, value: 0.2 }
    ];

    const result = await processData(testData);

    expect(result).toHaveLength(3);
    expect(result[0].processed).toBe(true);
  });

  test('should handle large datasets', async () => {
    // 模擬大數據集行為
    const mockProcessData = jest.fn().mockResolvedValue(
      Array.from({ length: 10000 }, (_, i) => ({ id: i, processed: true }))
    );

    const result = await mockProcessData();
    expect(result).toHaveLength(10000);
  });
});
```

## 測試穩定性改善
### 🔄 消除測試不穩定性
```typescript
// 1. 時間相關測試
describe('Time-sensitive Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create timestamp correctly', () => {
    const result = createTimestamp();
    expect(result).toBe('2024-01-01T00:00:00.000Z');
  });
});

// 2. 異步測試
describe('Async Tests', () => {
  test('should wait for async operation', async () => {
    const promise = asyncOperation();

    // 使用 waitFor 等待結果
    await waitFor(() => {
      expect(promise).resolves.toBeDefined();
    });

    const result = await promise;
    expect(result.status).toBe('completed');
  });
});

// 3. 網絡請求測試
describe('Network Tests', () => {
  beforeEach(() => {
    // 模擬網絡請求
    fetchMock.resetMocks();
  });

  test('should handle API response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    });

    const result = await apiCall();
    expect(result.data).toBe('test');
  });
});
```

## 測試報告和分析
### 📊 測試覆蓋率分析
```bash
# 生成詳細覆蓋率報告
npm run test:coverage

# 覆蓋率閾值檢查
npm run test:coverage -- --coverageThreshold='{
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}'

# 性能測試報告
npm run test:perf:report
```

### 📈 測試指標追蹤
```typescript
// 測試指標收集
export class TestMetrics {
  static async collectMetrics(): Promise<TestMetricsReport> {
    const coverage = await this.getCoverageReport();
    const stability = await this.getStabilityReport();
    const performance = await this.getPerformanceReport();

    return {
      coverage: {
        lines: coverage.lines.pct,
        branches: coverage.branches.pct,
        functions: coverage.functions.pct,
        statements: coverage.statements.pct
      },
      stability: {
        passRate: stability.passRate,
        flakyTests: stability.flakyTests,
        avgExecutionTime: stability.avgExecutionTime
      },
      performance: {
        totalTests: performance.totalTests,
        totalTime: performance.totalTime,
        slowestTests: performance.slowestTests
      }
    };
  }
}
```

## 持續集成優化
### 🔄 CI/CD 測試流程
```yaml
# GitHub Actions 測試配置
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run typecheck

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 檢查命令
```bash
# 執行所有測試
npm run test:all

# 測試覆蓋率分析
npm run test:coverage

# 測試穩定性檢查
npm run test:stability

# 測試性能分析
npm run test:perf

# 清理測試數據
npm run test:cleanup
```

## 報告輸出路徑
`docs/cleanup/tests-cleanup-v[X.X.X].md`

---

**清理焦點**: 測試覆蓋率 + 測試穩定性 + 測試性能
**目標改善**: 覆蓋率提升至80%+，穩定性達到95%+，執行時間減少50%
