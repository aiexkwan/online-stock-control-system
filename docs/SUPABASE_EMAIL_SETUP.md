# Supabase 電郵模板配置修復指南

## 問題描述
新用戶註冊後收到的電郵確認連結指向錯誤的第三方網址，而不是我們的應用程式。

## 解決方案

### 1. 登入 Supabase Dashboard
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的項目

### 2. 修復 Site URL 設置
1. 前往 **Settings** → **General**
2. 在 **Site URL** 欄位中設置：
   ```
   http://localhost:3004
   ```
   （開發環境）或
   ```
   https://your-production-domain.com
   ```
   （生產環境）

### 3. 修復 Redirect URLs
1. 在同一頁面的 **Redirect URLs** 欄位中添加：
   ```
   http://localhost:3004/main-login
   https://your-production-domain.com/main-login
   ```

### 4. 修復電郵模板
1. 前往 **Authentication** → **Email Templates**
2. 選擇 **Confirm signup** 模板
3. 確保模板中的連結指向正確的 URL：
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```

### 5. 檢查 Auth 設置
1. 前往 **Authentication** → **Settings**
2. 確保以下設置：
   - **Enable email confirmations**: ✅ 啟用
   - **Secure email change**: ✅ 啟用
   - **Double confirm email changes**: ✅ 啟用

### 6. 自定義電郵模板（可選）
如果需要自定義電郵內容，可以修改模板：

```html
<h2>Welcome to Pennine Industries Stock Control System</h2>
<p>Thanks for signing up! Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
<p>This link will redirect you back to the login page where you can sign in.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

## 測試流程

1. 註冊新用戶
2. 檢查電郵確認連結是否指向 `/main-login?confirmed=true`
3. 點擊連結後應該：
   - 重定向到登入頁面
   - 顯示 "Email Confirmed!" 訊息
   - 允許用戶登入

## 注意事項

- 修改設置後可能需要等待幾分鐘才生效
- 確保所有 URL 都使用正確的協議（http/https）
- 生產環境必須使用 HTTPS 