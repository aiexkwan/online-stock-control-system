# E2E Authentication Errors

呢個文件記錄所有同 E2E 測試認證相關嘅錯誤同解決方案。

## Login Page URL Change

**錯誤訊息：**
```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"
```

**發生時間：** 2025-07-12

**受影響文件：**
- `e2e/pages/login.page.ts`
- `e2e/auth/login.spec.ts`
- All E2E tests using authentication

**原因：**
應用程序嘅登入頁面 URL 已經從 `/login` 改為 `/main-login`。E2E 測試仍然嘗試訪問舊嘅 URL。

**解決方案：**
1. 更新 `login.page.ts` 中嘅 `goto()` 方法：
```typescript
// 錯誤
async goto() {
  await this.page.goto('/login');
}

// 正確
async goto() {
  await this.page.goto('/main-login');
}
```

2. 更新所有測試中嘅 URL 期望值從 `/login` 改為 `/main-login`

**測試結果：**
修復後測試可以成功訪問登入頁面。

## Login Form Selector Changes

**錯誤訊息：**
```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
Locator: locator('input[name="email"]')
Expected: visible
Received: <element(s) not found>
```

**發生時間：** 2025-07-12

**受影響文件：**
- `e2e/pages/login.page.ts`

**原因：**
登入表單使用 `id` 屬性而唔係 `name` 屬性來標識輸入欄位。

**實際 HTML：**
```html
<input id="email" type="email" ...>
<input id="password" type="password" ...>
```

**解決方案：**
更新選擇器：
```typescript
// 錯誤
this.emailInput = page.locator('input[name="email"]');
this.passwordInput = page.locator('input[name="password"]');

// 正確
this.emailInput = page.locator('input#email');
this.passwordInput = page.locator('input#password');
```

**測試結果：**
修復後可以成功定位到表單元素。

## Email Domain Validation

**錯誤訊息：**
```
Only @pennineindustries.com email addresses are allowed
```

**發生時間：** 2025-07-12

**受影響文件：**
- `app/main-login/components/SimpleLoginForm.tsx`
- All E2E tests using email authentication

**原因：**
登入表單有域名驗證，只允許 `@pennineindustries.com` 結尾嘅電郵地址。

**解決方案：**
1. 更新測試數據使用正確嘅域名
2. 更新環境變數使用實際嘅用戶憑證
3. 使用 `.env.local` 中嘅 `PUPPETEER_LOGIN` 同 `PUPPETEER_PASSWORD`

**測試結果：**
使用正確域名嘅電郵地址可以成功登入。

## Post-Login Redirect URL

**錯誤訊息：**
```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
Expected pattern: /\/dashboard/
Received string: "http://localhost:3000/access"
```

**發生時間：** 2025-07-12

**受影響文件：**
- `e2e/auth/login.spec.ts`
- `e2e/fixtures/auth.fixture.ts`
- All tests expecting post-login redirect

**原因：**
成功登入後，應用程序重定向到 `/access` 而唔係 `/dashboard`。

**解決方案：**
更新所有測試中嘅期望 URL：
```typescript
// 錯誤
await expect(page).toHaveURL(/\/dashboard/);

// 正確
await expect(page).toHaveURL(/\/access/);
```

**測試結果：**
修復後測試可以正確驗證登入後嘅重定向。

## Environment Variables Setup

**發生時間：** 2025-07-12

**問題：**
E2E 測試需要有效嘅用戶憑證，但默認嘅測試憑證唔符合域名要求。

**解決方案：**
1. 創建 `e2e/global-setup.ts` 自動加載 `.env.local`
2. 更新 `playwright.config.ts` 使用 global setup
3. 支持使用 `PUPPETEER_LOGIN` 同 `PUPPETEER_PASSWORD` 作為測試憑證
4. 提供 fallback 機制：
   - 首先檢查 `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
   - 然後檢查 `PUPPETEER_LOGIN` / `PUPPETEER_PASSWORD`
   - 最後使用默認值

**環境變數優先級：**
```
E2E_TEST_EMAIL > PUPPETEER_LOGIN > default
E2E_TEST_PASSWORD > PUPPETEER_PASSWORD > default
```

**測試結果：**
使用 `.env.local` 中嘅憑證可以成功運行測試。

## Skip Tests Without Valid Credentials

**發生時間：** 2025-07-12

**問題：**
某些測試需要有效嘅憑證，但唔係所有開發者都有。

**解決方案：**
為需要有效憑證嘅測試添加 skip 條件：
```typescript
test('should login with valid credentials', async ({ page }) => {
  if (!isValidEmail || !isValidPassword) {
    test.skip();
    return;
  }
  // ... test implementation
});
```

**測試結果：**
無有效憑證時，相關測試會被跳過而唔會失敗。

## Summary of All Changes

1. **URL Changes:**
   - Login page: `/login` → `/main-login`
   - Post-login redirect: `/dashboard` → `/access`
   - Admin dashboard: `/dashboard` → `/admin/dashboard`

2. **Selector Changes:**
   - Email input: `input[name="email"]` → `input#email`
   - Password input: `input[name="password"]` → `input#password`
   - Error message: Complex motion.div structure

3. **Validation Changes:**
   - Email must end with `@pennineindustries.com`
   - Error messages updated to match actual implementation

4. **Environment Setup:**
   - Auto-load `.env.local` via global setup
   - Support `PUPPETEER_LOGIN` / `PUPPETEER_PASSWORD`
   - Graceful handling of missing credentials

5. **Test Structure:**
   - Skip tests requiring valid credentials when not available
   - Update all URL expectations
   - Fix authentication fixture

**預防措施：**
1. 定期運行 E2E 測試確保同應用程序保持同步
2. 使用環境變數管理測試憑證
3. 為需要特定條件嘅測試添加 skip 邏輯
4. 維護測試文檔記錄所有必要嘅設置