# 主登入頁面操作手冊

## 頁面概述
主登入頁面係 Pennine Manufacturing 庫存管理系統嘅入口。呢個頁面用嚟驗證員工身份，確保只有授權人員先可以使用系統。

## 操作流程

### 1. 登入步驟

#### 步驟 1：輸入電郵地址
- 喺 **Email Address** 欄位輸入你嘅公司電郵
- 必須使用 `@pennineindustries.com` 結尾嘅電郵地址
- 例如：`john.smith@pennineindustries.com`

#### 步驟 2：輸入密碼
- 喺 **Password** 欄位輸入你嘅密碼
- 密碼係大小寫敏感嘅，請確保輸入正確

#### 步驟 3：按登入按鈕
- 按 **Sign In** 按鈕提交登入資料
- 系統會顯示「Signing in...」表示正在處理

### 2. 登入結果

#### 成功登入
- 系統會自動跳轉到權限頁面（Access Page）
- 你會睇到「Access Granted」嘅訊息

#### 登入失敗
系統會顯示紅色錯誤訊息：
- **「Please fill in all fields」** - 請確保所有欄位都已填寫
- **「Only @pennineindustries.com email addresses are allowed」** - 請使用公司電郵
- **「Login failed」** - 電郵或密碼錯誤，請重新檢查

### 3. 其他功能

#### 忘記密碼
- 按 **「Forgot your password?」** 連結
- 系統會跳轉到密碼重設頁面

#### 註冊新帳戶
- 按 **「Sign up」** 連結
- 系統會跳轉到註冊頁面（需要公司電郵）

### 4. 特殊情況

#### 電郵確認成功
- 如果你啱啱完成註冊並確認咗電郵
- 會睇到綠色嘅「Email Confirmed!」訊息
- 表示你嘅帳戶已經激活，可以登入

## 注意事項

1. **電郵格式**
   - 必須使用公司電郵（@pennineindustries.com）
   - 其他電郵域名會被拒絕

2. **密碼安全**
   - 唔好同其他人分享你嘅密碼
   - 定期更改密碼以確保安全

3. **瀏覽器要求**
   - 建議使用最新版本嘅 Chrome、Firefox 或 Edge
   - 確保啟用 JavaScript

## 常見問題

**問：點解我輸入正確嘅電郵同密碼都登入唔到？**
答：請檢查：
- 電郵地址有冇打錯字
- 密碼大小寫是否正確
- 賬戶是否已經激活（檢查電郵確認）

**問：我收唔到確認電郵點算？**
答：請檢查垃圾郵件資料夾，或者聯絡 IT 部門協助。

**問：登入後點解會自動登出？**
答：可能係 session 過期，請重新登入。如果問題持續，請聯絡 IT 部門。

## 視覺指引

```
┌─────────────────────────────────────┐
│     Pennine Manufacturing           │
│   Stock Management System           │
│         ─────────────               │
│                                     │
│         Sign In                     │
│     Access your account             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email Address               │    │
│  │ your.name@pennineindustries │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Password                    │    │
│  │ ••••••••••••                │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │        Sign In →            │    │
│  └─────────────────────────────┘    │
│                                     │
│    Forgot your password?            │
│    Don't have an account? Sign up   │
│                                     │
└─────────────────────────────────────┘
```

## 技術支援
如果遇到任何問題，請聯絡：
- IT 部門：ext. 1234
- 電郵：it.support@pennineindustries.com