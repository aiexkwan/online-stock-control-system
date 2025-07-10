# 重設密碼頁面操作手冊

## 頁面概述
重設密碼頁面用嚟幫助忘記密碼嘅用戶重新設定密碼。系統會發送重設連結到你嘅註冊電郵。

## 操作流程

### 1. 進入重設密碼頁面
- 喺登入頁面按 **「Forgot your password?」** 連結
- 或者直接訪問 `/main-login/reset` 路徑

### 2. 請求重設密碼

#### 步驟 1：輸入電郵地址
- 喺 **Email Address** 欄位輸入你註冊時使用嘅公司電郵
- 必須係 `@pennineindustries.com` 結尾嘅電郵地址
- 例如：`john.smith@pennineindustries.com`

#### 步驟 2：提交請求
- 按 **Send Reset Link** 按鈕
- 系統會顯示「Sending Reset Link...」表示正在處理

### 3. 請求結果

#### 成功發送
當重設連結成功發送後：
- 顯示綠色打勾圖示 ✓
- 出現 **「Reset Email Sent!」** 標題
- 提示檢查你嘅電郵收件箱
- 可以按 **「Back to Login」** 返回登入頁面

#### 發送失敗
系統會顯示紅色錯誤訊息：
- **「Please enter your email address」** - 電郵欄位空白
- **「Only @pennineindustries.com email addresses are allowed」** - 電郵域名錯誤
- **「Failed to send reset email」** - 系統錯誤，請稍後再試

### 4. 電郵重設流程

#### 檢查電郵
1. 打開你嘅電郵收件箱
2. 搵一封主題為「Reset Your Password」嘅郵件
3. 如果收唔到，檢查垃圾郵件資料夾

#### 使用重設連結
1. 按電郵入面嘅重設連結
2. 連結會帶你到新密碼設定頁面
3. 按照頁面指示設定新密碼

#### 連結有效期
- 重設連結通常 24 小時內有效
- 過期後需要重新請求

### 5. 返回登入
- 如果記返密碼，可以按 **「Sign in」** 連結返回登入頁面
- 唔需要等待重設郵件

## 注意事項

1. **電郵要求**
   - 必須使用註冊時嘅電郵地址
   - 如果忘記註冊電郵，請聯絡 IT 部門

2. **安全提示**
   - 重設連結只可以使用一次
   - 唔好將連結分享俾其他人
   - 確保係喺安全嘅環境下重設密碼

3. **收唔到郵件**
   - 等待 5-10 分鐘
   - 檢查垃圾郵件資料夾
   - 確認電郵地址正確
   - 嘗試重新發送

## 常見問題

**問：我輸入咗正確嘅電郵但收唔到重設郵件？**
答：
1. 確認電郵地址完全正確（包括大小寫）
2. 檢查垃圾郵件資料夾
3. 等待至少 10 分鐘
4. 如果仲係收唔到，聯絡 IT 部門

**問：重設連結過期咗點算？**
答：返回重設密碼頁面，重新輸入電郵地址請求新嘅重設連結。

**問：我按咗重設連結但頁面顯示錯誤？**
答：可能係連結已經使用過或者過期，請重新請求。

**問：可唔可以用其他電郵接收重設連結？**
答：唔可以，重設連結只會發送到你註冊時使用嘅電郵地址。

## 視覺指引

### 重設密碼請求表單
```
┌─────────────────────────────────────┐
│     Pennine Industries              │
│   Stock Control System              │
│         ─────────────               │
│                                     │
│      Reset Password                 │
│  Enter your email to receive        │
│     reset instructions              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email Address               │    │
│  │ your.name@pennineindustries │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Send Reset Link         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Remember your password? Sign in    │
│                                     │
└─────────────────────────────────────┘
```

### 成功發送頁面
```
┌─────────────────────────────────────┐
│              ✓                      │
│                                     │
│      Reset Email Sent!              │
│                                     │
│   Please check your email for       │
│   password reset instructions.      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Back to Login          │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 重設郵件內容示例
```
主題：Reset Your Password - Pennine Industries

Dear User,

You requested to reset your password for the 
Pennine Industries Stock Control System.

Click the link below to set a new password:
[Reset Password Link]

This link will expire in 24 hours.

If you didn't request this, please ignore 
this email.

Best regards,
Pennine Industries IT Team
```

## 技術支援
如果遇到任何問題，請聯絡：
- IT 部門：ext. 1234
- 電郵：it.support@pennineindustries.com
- 辦公時間：星期一至五，9:00 AM - 6:00 PM