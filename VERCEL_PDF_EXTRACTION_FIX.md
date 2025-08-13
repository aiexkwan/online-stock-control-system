# Vercel PDF 提取錯誤診斷和修復方案

> **狀態**: 診斷完成  
> **優先級**: 🔴 緊急  
> **預計修復時間**: 10-15 分鐘  

## 📋 問題摘要

用戶在 Vercel 部署後遇到錯誤：
```
"PDF extraction failed. Enhanced extraction service failed and Assistant API is unavailable due to Vercel regional restrictions (403 error)."
```

## 🔍 診斷結果

### ✅ 正常的部分
- `/api/pdf-extract` API Route 實現正確
- Node.js runtime 配置正確
- EU/UK 地區設定正確
- 環境變數（OpenAI API Key 等）存在

### ❌ 問題源頭

#### **問題 1: URL 構建邏輯錯誤** (主要問題)
**文件**: `app/actions/orderUploadActions.ts` 行 497-500

```typescript
// 🚨 有問題的代碼
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
               process.env.NEXT_PUBLIC_APP_URL || 
               'http://localhost:3000';
```

**問題**: 
- `VERCEL_URL` 可能已經包含 `https://` 協議
- 會導致 `https://https://your-app.vercel.app` 的雙重協議錯誤
- 結果 API 請求失敗

#### **問題 2: 環境變數缺失**
- `.env.local` 中缺少 `NEXT_PUBLIC_APP_URL`
- Vercel 生產環境可能沒有正確配置

#### **問題 3: 錯誤處理不充分**
- API 調用失敗後沒有詳細的錯誤信息
- 難以診斷具體問題

## 🚀 立即修復方案

### 修復 1: 修正 URL 構建邏輯

```typescript
// 修復後的代碼
function getApiBaseUrl(): string {
  // 優先使用 VERCEL_URL (生產環境)
  if (process.env.VERCEL_URL) {
    const url = process.env.VERCEL_URL;
    return url.startsWith('https://') ? url : `https://${url}`;
  }
  
  // 備用：NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // 本地開發
  return 'http://localhost:3000';
}

// 使用修復後的函數
const baseUrl = getApiBaseUrl();
const apiUrl = `${baseUrl}/api/pdf-extract`;
```

### 修復 2: 添加環境變數

在 `.env.local` 和 Vercel 環境設定中添加：
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 修復 3: 強化錯誤處理

```typescript
try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[analyzeOrderPDF] API request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      errorBody: errorText,
    });
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const enhancedResult = await response.json();
  // ... 其餘邏輯
} catch (error) {
  console.error('[analyzeOrderPDF] API Route extraction failed:', {
    error: error.message,
    url: apiUrl,
    baseUrl,
    vercelUrl: process.env.VERCEL_URL,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  // ... 錯誤處理
}
```

## 🛠️ 診斷工具

### 1. 運行診斷腳本
```bash
# 檢查 API 端點狀態
node scripts/test-pdf-api.js
```

### 2. Vercel Functions 日誌查看
```bash
# 查看實時日誌
vercel logs your-app-name --follow

# 查看特定函數日誌
vercel logs your-app-name --since=1h | grep "pdf-extract"
```

### 3. 本地測試對比
```bash
# 本地啟動應用
npm run dev

# 測試本地 API
curl -X POST http://localhost:3000/api/pdf-extract \
  -F "file=@test.pdf" \
  -F "fileName=test.pdf"
```

## 📊 修復實施步驟

### Step 1: 立即修復 URL 邏輯 (2 分鐘)
1. 修改 `app/actions/orderUploadActions.ts`
2. 替換 URL 構建邏輯

### Step 2: 設定環境變數 (1 分鐘)
1. 在 Vercel Dashboard 設定 `NEXT_PUBLIC_APP_URL`
2. 觸發重新部署

### Step 3: 測試驗證 (5 分鐘)
1. 運行診斷腳本
2. 測試 PDF 上載功能
3. 檢查 Vercel 日誌

### Step 4: 監控確認 (持續)
1. 監控錯誤率
2. 檢查用戶反饋
3. 記錄修復效果

## 🔄 回滾方案

如果修復導致新問題：

1. **立即回滾**:
   ```bash
   # 回滾到上一個工作版本
   vercel rollback
   ```

2. **臨時解決方案**: 
   - 使用相對路徑調用 API
   - 暫時禁用 PDF 功能

## 📈 預期結果

修復完成後應該看到：
- ✅ PDF 提取成功率 > 95%
- ✅ 錯誤日誌中不再出現 URL 錯誤
- ✅ API 響應時間正常 (< 30s)
- ✅ 用戶可以正常上載和處理 PDF

## 🎯 長期優化建議

1. **使用相對路徑**: 改用 Next.js 內部 API 調用方式
2. **添加重試機制**: 對網絡錯誤進行自動重試
3. **健康檢查**: 定期檢查 API 端點狀態
4. **錯誤監控**: 集成 Sentry 或類似的錯誤追蹤服務

---

**⚡ 緊急聯絡**: 如果修復過程中遇到問題，請立即檢查 Vercel 日誌並考慮回滾。