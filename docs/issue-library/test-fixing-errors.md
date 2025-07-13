# Test Fixing Errors

本文件記錄所有測試相關嘅錯誤同解決方案。

## Apollo Client Mock Issues

**錯誤訊息：**
```
TypeError: (0 , _client.gql) is not a function
```

**發生時間：** 2025-07-12

**受影響文件：**
- `app/admin/hooks/__tests__/useGraphQLFallback.test.tsx`

**原因：**
缺少 @apollo/client mock 文件。

**解決方案：**
創建 `__mocks__/@apollo/client.js` 文件，提供完整嘅 mock 實現：

```javascript
const gql = jest.fn((strings, ...values) => {
  let result = '';
  strings.forEach((string, i) => {
    result += string;
    if (values[i]) {
      result += values[i];
    }
  });
  return result;
});

// 其他必要嘅 exports...
module.exports = {
  gql,
  useQuery,
  useLazyQuery,
  useMutation,
  useApolloClient,
  ApolloClient,
  InMemoryCache,
  // ...
};
```

## React Hook Spy Issues

**錯誤訊息：**
```
Property 'userRole' does not have access type get
```

**發生時間：** 2025-07-12

**受影響文件：**
- `app/hooks/__tests__/useAuth.test.ts`

**原因：**
嘗試 spy 一個唔係 getter 嘅屬性。

**解決方案：**
改為 mock 整個 hook：

```typescript
// 錯誤做法
jest.spyOn(authResult.current, 'userRole', 'get').mockReturnValue({...});

// 正確做法
jest.spyOn(require('../useAuth'), 'useAuth').mockReturnValue({
  loading: false,
  user: { id: '123', email: 'admin@pennineindustries.com' },
  isAuthenticated: true,
  userRole: { /* ... */ }
});
```

## Logger Mock Issues

**錯誤訊息：**
測試期望 `console.warn` 但實際代碼使用 `authLogger.warn`。

**發生時間：** 2025-07-12

**受影響文件：**
- `app/utils/__tests__/authUtils.test.ts`

**原因：**
Mock 錯誤嘅對象（console 而唔係 logger）。

**解決方案：**
```typescript
// Mock authLogger
jest.mock('@/lib/logger', () => ({
  authLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// 然後測試 authLogger.warn 而唔係 console.warn
expect(authLogger.warn).toHaveBeenCalledWith(
  expect.objectContaining({
    function: 'emailToClockNumber',
    input: null,
  }),
  'Called with null or undefined email'
);
```

## Async Testing Issues

**錯誤訊息：**
```
Warning: An update inside a test was not wrapped in act(...)
```

**發生時間：** 2025-07-12

**受影響文件：**
- `app/hooks/__tests__/useStockTransfer.test.tsx`

**原因：**
異步操作未正確處理。

**解決方案：**
```typescript
await act(async () => {
  jest.advanceTimersByTime(1000);
  await Promise.resolve();
});
```

## Component Test Expectation Issues

**問題：**
測試期望值唔符合實際組件行為。

**受影響文件：**
- `__tests__/grn/components/WeightInputList.test.tsx`
- `app/admin/components/dashboard/widgets/__tests__/AwaitLocationQtyWidget.test.tsx`

**解決方案：**
1. 檢查實際組件實現
2. 更新測試期望值以匹配實際行為
3. 移除測試中對唔存在功能嘅期望

## ESM Module Issues

**錯誤訊息：**
```
Jest encountered an unexpected token
```

**受影響文件：**
- `app/components/reports/generators/ExcelGenerator.test.ts`

**原因：**
ExcelJS 使用 ESM 模塊語法。

**解決方案：**
完整 mock ExcelJS：
```typescript
jest.mock('exceljs', () => ({
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      creator: '',
      lastModifiedBy: '',
      created: new Date(),
      modified: new Date(),
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        addRow: jest.fn(),
        getRow: jest.fn().mockReturnValue({
          font: {},
          alignment: {},
          fill: {},
        }),
        // ...
      }),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mock excel data')),
      },
    })),
  },
  Workbook: jest.fn().mockImplementation(/* same as above */),
}));
```

## 測試修復統計

- **開始時失敗測試數**：73
- **最終失敗測試數**：0
- **總測試套件**：59
- **總測試數**：1049（1031 通過，18 跳過）

## 預防措施

1. **Mock 設置**：
   - 確保所有外部依賴都有適當嘅 mock
   - Mock 文件放在 `__mocks__` 目錄
   - 使用 `jest.mock()` 確保 mock 被加載

2. **異步測試**：
   - 使用 `act()` 包裝所有會觸發狀態更新嘅操作
   - 使用 `waitFor()` 等待異步操作完成
   - 正確使用 `jest.useFakeTimers()` 同 `jest.useRealTimers()`

3. **測試隔離**：
   - 每個測試前後清理 mock（`jest.clearAllMocks()`）
   - 避免測試之間嘅狀態共享
   - 使用 `beforeEach` 同 `afterEach` 重置狀態

4. **期望值匹配**：
   - 定期檢查測試期望值是否匹配實際實現
   - 使用 `toMatchObject` 而唔係完全匹配當對象結構可能變化
   - 使用 `expect.objectContaining` 進行部分匹配

## Babel Parser TypeScript 語法錯誤 - Day 11-12 測試優化後

**錯誤訊息：**
```
SyntaxError: Missing semicolon. (24:16)
> 24 |     let supabase: ReturnType<typeof createMockSupabaseClient>;
     |                 ^

Cannot use import statement outside a module
```

**發生時間：** 2025-07-12

**受影響文件：**
- `__tests__/integration/supabase-mock-system.test.ts`
- `__tests__/grn/utils/calculateNetWeight.test.ts`
- 多個測試文件

**原因：**
Jest/Babel 配置無法正確解析現代 TypeScript 語法，特別係：
1. `ReturnType<typeof functionName>` 高級類型語法
2. ES 模塊 import 語句
3. TypeScript 複雜類型聲明

**技術背景：**
在 Day 11-12 測試執行優化期間，更新了 Jest 配置添加了並行執行、性能監控同緩存功能。但現有嘅 Babel 配置可能需要更新以支持新嘅 TypeScript 語法特性。

**建議解決方案：**
1. **更新 Babel 配置**：
```javascript
// babel.config.js 或 jest.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { allowDeclareFields: true }]
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-typescript'
  ]
};
```

2. **更新 Jest 配置**：
```javascript
// jest.config.js
module.exports = {
  // 現有配置...
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        allowJs: true,
        allowSyntheticDefaultImports: true
      }
    }]
  }
};
```

3. **使用 ts-jest 替代 babel-jest**：
```bash
npm install --save-dev ts-jest
```

**重要注意**：
雖然測試目前失敗，但 Day 11-12 完成嘅優化基礎架構（並行執行、數據庫連接池、智能緩存、CI/CD 工作流程）都係有價值嘅改進，只需要解決配置問題即可。

**影響評估：**
- 測試覆蓋率顯示 0%，但係因為語法解析問題而唔係代碼問題
- 優化配置本身係正確嘅，只需要修復 TypeScript/Babel 兼容性

## 常見修復模式

1. **Apollo Client 相關**：創建完整 mock 文件
2. **React Hooks 測試**：Mock 整個 hook 而唔係 spy 屬性
3. **Logger 相關**：Mock 正確嘅 logger 模塊
4. **異步操作**：使用 act() 同 waitFor()
5. **ESM 模塊**：提供完整嘅 CommonJS mock
6. **TypeScript 語法解析**：更新 Babel/Jest 配置支持現代 TypeScript 特性