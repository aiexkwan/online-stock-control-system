# AI Order Analysis 設置指南

## 前置要求

在使用 AI Order Analysis 功能之前，您需要完成以下設置：

### 1. OpenAI API 密鑰

您需要一個有效的 OpenAI API 密鑰來使用 GPT-4o 模型。

#### 獲取 OpenAI API 密鑰：
1. 訪問 [OpenAI Platform](https://platform.openai.com/)
2. 註冊或登入您的帳戶
3. 前往 [API Keys](https://platform.openai.com/api-keys) 頁面
4. 點擊 "Create new secret key"
5. 複製生成的 API 密鑰

#### 設置 API 密鑰：
1. 在項目根目錄創建 `.env.local` 文件（如果不存在）
2. 添加以下行：
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 2. 環境變數配置

確保您的 `.env.local` 文件包含以下必要的環境變數：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# 其他配置...
```

### 3. 驗證設置

運行以下命令來驗證您的設置：

```bash
node scripts/test-pdf-analysis.js
```

如果設置正確，您應該看到：
```
PDF Analysis Test Script
========================
✅ OpenAI API key is configured
✅ Supabase credentials are configured
✅ analyze-order-pdf API route exists
✅ OpenAI package is installed

🎉 All checks passed! PDF analysis functionality should work correctly.
```

## 成本考量

### OpenAI API 使用費用

AI Order Analysis 功能使用 OpenAI 的 GPT-4o 模型，這會產生 API 使用費用：

- **模型**: GPT-4o
- **輸入 Token**: 每 1M tokens 約 $2.50
- **輸出 Token**: 每 1M tokens 約 $10.00

### 估算使用成本

一般的 PDF 訂單文檔分析：
- **輸入**: 約 2,000-5,000 tokens（包含 prompt 和 PDF 內容）
- **輸出**: 約 200-500 tokens（JSON 格式的提取數據）
- **每次分析成本**: 約 $0.01-0.05

### 優化建議

1. **文檔大小**: 保持 PDF 文件簡潔，移除不必要的圖像
2. **批量處理**: 如果可能，將多個訂單合併到一個 PDF 中
3. **監控使用**: 定期檢查 OpenAI 使用儀表板

## 安全性設置

### API 密鑰安全

1. **不要提交**: 確保 `.env.local` 在 `.gitignore` 中
2. **定期輪換**: 定期更新您的 API 密鑰
3. **限制權限**: 在 OpenAI 平台設置適當的使用限制

### 數據隱私

1. **本地處理**: PDF 內容僅發送到 OpenAI 進行分析
2. **不存儲**: PDF 文件不會永久存儲在系統中
3. **審計日誌**: 所有分析活動都會記錄在數據庫中

## 故障排除

### 常見錯誤

#### "OPENAI_API_KEY environment variable is not set"
- 檢查 `.env.local` 文件是否存在
- 確認 API 密鑰格式正確（以 `sk-` 開頭）
- 重啟開發服務器

#### "OpenAI API request failed"
- 檢查 API 密鑰是否有效
- 確認 OpenAI 帳戶有足夠的信用額度
- 檢查網絡連接

#### "Failed to parse extracted data"
- PDF 內容可能過於複雜
- 嘗試使用更標準化的訂單格式
- 檢查 PDF 是否包含必要的訂單信息

### 調試模式

在開發環境中，您可以查看詳細的錯誤信息：

1. 打開瀏覽器開發者工具
2. 查看 Console 標籤頁
3. 查看 Network 標籤頁的 API 請求

## 支援

如果您在設置過程中遇到問題：

1. 檢查本文檔的故障排除部分
2. 運行測試腳本驗證設置
3. 查看應用程序日誌
4. 聯繫系統管理員

## 更新

當有新版本的 AI Order Analysis 功能時：

1. 更新代碼庫
2. 檢查是否有新的環境變數要求
3. 重新運行測試腳本
4. 測試功能是否正常工作 