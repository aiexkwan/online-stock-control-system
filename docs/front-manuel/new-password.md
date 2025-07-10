# 新密碼設定頁面操作手冊

## 頁面概述
新密碼設定頁面係密碼重設流程嘅最後一步。當你透過電郵收到重設連結並按下後，就會嚟到呢個頁面設定新密碼。

## 使用前提
- 必須透過重設密碼郵件嘅連結進入
- URL 必須包含有效嘅用戶 ID 參數
- 重設連結未過期

## 操作流程

### 1. 頁面載入檢查

當你進入頁面時，系統會：
- 自動檢查 URL 中嘅用戶 ID
- 顯示你嘅員工編號（Clock Number）
- 如果冇有效 ID，會顯示錯誤訊息

### 2. 設定新密碼步驟

#### 步驟 1：輸入新密碼
- 喺 **New Password** 欄位輸入你想要嘅新密碼
- 密碼要求：
  - 最少 6 個字符
  - 可以包含任何字符

#### 步驟 2：確認新密碼
- 喺 **Confirm New Password** 欄位再次輸入相同密碼
- 必須同第一次輸入完全一樣

#### 步驟 3：提交新密碼
- 按 **Reset Password** 按鈕
- 系統會顯示「Processing...」同轉圈圖示

### 3. 設定結果

#### 成功設定
密碼成功重設後：
- 顯示綠色成功頁面
- 出現打勾圖示 ✓
- 顯示「Password Reset Successfully!」
- 3 秒後自動跳轉到登入頁面

#### 設定失敗
系統會顯示紅色錯誤訊息：
- **「User ID is missing」** - URL 缺少用戶資訊
- **「Password must be at least 6 characters long」** - 密碼太短
- **「Passwords do not match」** - 兩次輸入唔一樣
- **「Failed to reset password」** - 系統錯誤或連結無效

### 4. 錯誤處理

#### 無效連結
如果重設連結有問題：
- 顯示紅色錯誤頁面
- 提供「Return to Login」按鈕
- 建議重新請求密碼重設

#### 系統錯誤
遇到技術問題時：
- 保留錯誤訊息
- 可以重試或聯絡支援

## 頁面元素說明

### 用戶資訊顯示
```
┌─────────────────────────────────────┐
│  Resetting password for Clock       │
│  Number: 12345                      │
└─────────────────────────────────────┘
```
顯示你嘅員工編號，確保係為正確賬戶重設密碼

### 操作按鈕
- **Cancel & Return to Login** - 取消操作，返回登入頁面
- **Reset Password** - 確認設定新密碼

## 注意事項

1. **連結安全**
   - 重設連結只可使用一次
   - 通常 24 小時內有效
   - 唔好將連結分享俾他人

2. **密碼要求**
   - 至少 6 個字符
   - 建議使用強密碼
   - 新密碼立即生效

3. **瀏覽器要求**
   - 確保 JavaScript 已啟用
   - 建議使用最新版本瀏覽器

## 常見問題

**問：點解話「User ID not provided」？**
答：重設連結可能唔完整或已損壞。請返回登入頁面重新請求密碼重設。

**問：設定新密碼後可以立即登入嗎？**
答：可以，新密碼立即生效。系統會自動跳轉到登入頁面。

**問：如果 3 秒自動跳轉唔 work 點算？**
答：可以手動按「Return to Login」按鈕返回登入頁面。

## 視覺指引

### 新密碼設定表單
```
┌─────────────────────────────────────┐
│      Reset Your Password            │
│                                     │
│  Enter and confirm a new password   │
│  for your account.                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Resetting password for      │    │
│  │ Clock Number: 12345         │    │
│  └─────────────────────────────┘    │
│                                     │
│  New Password *                     │
│  ┌─────────────────────────────┐    │
│  │ Enter new password (min. 6) │    │
│  └─────────────────────────────┘    │
│  Minimum 6 characters required.     │
│                                     │
│  Confirm New Password *             │
│  ┌─────────────────────────────┐    │
│  │ Confirm your new password   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Cancel & Return]  [Reset Password]│
│                                     │
└─────────────────────────────────────┘
```

### 成功頁面
```
┌─────────────────────────────────────┐
│              ✓                      │
│                                     │
│   Password Reset Successfully!      │
│                                     │
│   Your password has been updated.   │
│   You will be redirected to the     │
│   login page shortly.               │
│                                     │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │
│   (Loading bar animation)           │
│                                     │
└─────────────────────────────────────┘
```

### 錯誤頁面
```
┌─────────────────────────────────────┐
│              ⚠️                     │
│                                     │
│         Access Error                │
│                                     │
│   User ID not provided. Please      │
│   return to the login page and      │
│   use the "Forgot Password" link    │
│   again.                            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Return to Login        │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

## 技術支援
如果遇到任何問題，請聯絡：
- IT 部門：ext. 1234
- 電郵：it.support@pennineindustries.com
- 緊急支援：ext. 5678