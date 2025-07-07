# E2E Testing with Playwright

## 概述

本目錄包含使用 Playwright 框架的端到端 (E2E) 測試。這些測試模擬真實用戶操作，確保整個應用程序的功能正常運作。

## 目錄結構

```
e2e/
├── auth/               # 認證相關測試
├── dashboard/          # 儀表板測試
├── inventory/          # 庫存管理測試
├── fixtures/           # 測試夾具（如認證狀態）
├── pages/              # 頁面對象模型
├── utils/              # 測試工具函數
└── README.md          # 本文件
```

## 運行測試

### 基本命令

```bash
# 運行所有測試
npm run test:e2e

# 運行特定測試文件
npx playwright test e2e/auth/login.spec.ts

# 運行測試並顯示瀏覽器
npx playwright test --headed

# 運行測試並生成報告
npx playwright test --reporter=html

# 調試模式
npx playwright test --debug
```

### 測試特定瀏覽器

```bash
# 只在 Chrome 運行
npx playwright test --project=chromium

# 只在移動設備運行
npx playwright test --project="Mobile Chrome"
```

## 環境變量

創建 `.env.test` 文件設置測試環境變量：

```env
# 測試環境 URL
PLAYWRIGHT_BASE_URL=http://localhost:3000

# 測試用戶憑證
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword
E2E_ADMIN_EMAIL=admin@example.com
E2E_ADMIN_PASSWORD=adminpassword

# API 設置
API_BASE_URL=http://localhost:3000/api
```

## 編寫測試指南

### 1. 頁面對象模型 (POM)

所有頁面交互都應通過頁面對象進行：

```typescript
// pages/example.page.ts
export class ExamplePage {
  constructor(private page: Page) {}
  
  async doSomething() {
    await this.page.click('[data-testid="button"]');
  }
}
```

### 2. 使用測試 ID

優先使用 `data-testid` 屬性定位元素：

```tsx
// 在組件中
<button data-testid="submit-button">Submit</button>

// 在測試中
await page.click('[data-testid="submit-button"]');
```

### 3. 等待策略

正確處理異步操作：

```typescript
// 等待元素出現
await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });

// 等待網絡請求完成
await page.waitForLoadState('networkidle');

// 等待特定 URL
await page.waitForURL('**/dashboard');
```

### 4. 測試組織

使用 `describe` 和 `test` 組織測試：

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // 設置
  });

  test('should do something', async ({ page }) => {
    // 測試邏輯
  });
});
```

## 最佳實踐

1. **隔離測試**: 每個測試應該獨立運行，不依賴其他測試
2. **清理數據**: 測試後清理創建的測試數據
3. **使用夾具**: 利用 Playwright fixtures 共享設置邏輯
4. **避免硬編碼**: 使用環境變量和配置文件
5. **合理超時**: 根據操作類型設置適當的超時時間
6. **並行執行**: 設計測試以支持並行執行

## 調試技巧

### 1. 使用 Playwright Inspector

```bash
npx playwright test --debug
```

### 2. 查看測試執行過程

```bash
npx playwright test --headed --slow-mo=1000
```

### 3. 保存測試追蹤

```typescript
// 在測試中
await page.screenshot({ path: 'screenshot.png' });
await page.video().path(); // 獲取視頻路徑
```

### 4. 使用 VS Code 擴展

安裝 Playwright Test for VSCode 擴展以獲得更好的開發體驗。

## CI/CD 集成

測試已配置為在 GitHub Actions 中運行。查看 `.github/workflows/test.yml` 了解配置詳情。

### 本地運行 CI 測試

```bash
# 模擬 CI 環境
CI=true npm run test:e2e
```

## 性能考慮

1. **並行化**: 測試默認並行運行以提高速度
2. **重試機制**: CI 環境中失敗的測試會自動重試
3. **瀏覽器重用**: 開發時重用現有瀏覽器實例

## 報告

測試完成後，可以查看以下報告：

- **HTML 報告**: `playwright-report/index.html`
- **JSON 報告**: `test-results/e2e-results.json`
- **JUnit XML**: `test-results/e2e-junit.xml`

查看 HTML 報告：

```bash
npx playwright show-report
```

## 故障排除

### 常見問題

1. **瀏覽器下載失敗**
   ```bash
   npx playwright install
   ```

2. **測試超時**
   - 增加超時設置
   - 檢查網絡條件
   - 確保應用程序正在運行

3. **選擇器找不到**
   - 使用 Playwright Inspector 調試
   - 確保元素有 data-testid
   - 檢查元素是否在 Shadow DOM 中

## 貢獻指南

1. 新功能必須包含 E2E 測試
2. 修改現有功能時更新相關測試
3. 保持頁面對象模型更新
4. 遵循現有的測試模式和命名規範

## 相關文檔

- [Playwright 官方文檔](https://playwright.dev)
- [測試最佳實踐](https://playwright.dev/docs/best-practices)
- [API 參考](https://playwright.dev/docs/api/class-playwright)