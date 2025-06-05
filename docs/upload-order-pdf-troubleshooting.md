# Upload Order PDF 故障排除指南

## 問題描述

用戶在使用 Upload Order PDF 功能時遇到錯誤：
```
Please select a PDF file and ensure you are logged in
```

以及 Storage 相關錯誤：
```
Server error: 400 Invalid MIME type. Only image types are supported.
```

即使用戶已經通過 Supabase Auth 成功登入。

## 問題分析

### 根本原因
1. **RLS 權限問題**: 查詢 `data_id` 表時返回 406 錯誤
2. **環境變數配置**: 前端需要 `NEXT_PUBLIC_` 前綴的環境變數
3. **用戶 ID 映射**: 需要將 Supabase Auth UUID 映射到 `data_id` 表的數字 ID
4. **Storage Bucket 配置**: 錯誤的 bucket 名稱或 MIME type 限制

### 錯誤日誌分析
```
bbmkuiplnzvpudszrend.supabase.co/rest/v1/data_id?select=id&uuid=eq.70021ec2-f987-4edc-8146-bb64589582a1:1 
Failed to load resource: the server responded with a status of 406 ()

Server error: 400 Invalid MIME type. Only image types are supported.
```

## 解決方案

### 1. 環境變數配置

確保 `.env.local` 文件包含正確的 Supabase 配置：
```env
SUPABASE_URL=https://bbmkuiplnzvpudszrend.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-p3...
```

### 2. Next.js 配置

`next.config.js` 中已經配置了前端所需的環境變數：
```javascript
env: {
  NEXT_PUBLIC_SUPABASE_URL: 'https://bbmkuiplnzvpudszrend.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
}
```

### 3. Storage Bucket 配置

**問題**: 使用了錯誤的 bucket 名稱或 bucket 不支援 PDF 文件

**解決方案**:
- 確保使用正確的 bucket 名稱：`orderpdf`
- 驗證 bucket 允許 `application/pdf` MIME type
- 修改 API 使用正確的 bucket 配置

```typescript
// 修改前（錯誤）
formData.append('storagePath', 'order-pdf');

// 修改後（正確）
formData.append('storagePath', 'orderpdf');
```

### 4. 用戶 ID 查詢優化

修改了 `UploadFilesDialog.tsx` 中的用戶 ID 獲取邏輯：

```typescript
// 直接使用 supabase client 查詢 data_id 表（通過 RLS）
try {
  // 首先嘗試通過 UUID 查詢
  const { data: userData, error } = await supabase
    .from('data_id')
    .select('id')
    .eq('uuid', user.id)
    .single();
  
  if (error) {
    // 如果 UUID 查詢失敗，嘗試使用 email 查詢
    const { data: userDataByEmail, error: emailError } = await supabase
      .from('data_id')
      .select('id')
      .eq('email', user.email)
      .single();
    
    // 處理結果...
  }
} catch (queryError) {
  // 錯誤處理...
}
```

### 5. RLS 政策驗證

使用測試腳本驗證 `data_id` 表的訪問權限：
```bash
node scripts/test-data-id-access.js
```

預期輸出：
```
🎉 All tests passed! data_id table is accessible.
💡 The Upload Order PDF feature should work correctly.
```

### 6. Storage 功能驗證

使用測試腳本驗證 PDF 上傳功能：
```bash
node scripts/test-pdf-upload.js
```

預期輸出：
```
🎉 All tests passed! PDF upload functionality is working.
💡 The Upload Order PDF feature should work correctly.
```

## 測試結果

### 數據庫訪問測試
- ✅ `data_id` 表可以正常訪問
- ✅ 總共 23 條用戶記錄可查詢
- ✅ 可以通過 email 查找特定用戶
- ✅ 用戶 `akwan@pennineindustries.com` 的 ID 是 5997

### Storage 功能測試
- ✅ `orderpdf` bucket 存在且可訪問
- ✅ PDF 文件可以成功上傳
- ✅ 公共 URL 生成正常
- ✅ 文件清理功能正常

### 功能驗證
- ✅ 用戶認證正常工作
- ✅ PDF 文件上傳功能正常
- ✅ OpenAI API 集成完成
- ✅ 數據提取和保存功能實現
- ✅ Storage bucket 配置正確

## 使用說明

### 1. 確保登入
用戶必須先通過 Supabase Auth 登入系統。

### 2. 訪問功能
1. 進入 Admin 面板
2. 點擊 "Upload Documents"
3. 選擇 "Upload Order PDF" 分頁

### 3. 上傳和分析
1. 選擇 PDF 文件（最大 10MB）
2. 點擊 "Start Upload" 按鈕
3. 等待 AI 分析完成
4. 查看提取的數據預覽
5. 數據自動保存到 `data_order` 表

## 常見問題

### Q: 仍然顯示 "Please select a PDF file and ensure you are logged in"
**A**: 檢查以下項目：
1. 確保用戶已登入
2. 檢查瀏覽器控制台是否有錯誤
3. 驗證用戶在 `data_id` 表中存在
4. 重新整理頁面重試

### Q: "Invalid MIME type. Only image types are supported"
**A**: Storage bucket 配置問題：
1. 確認使用正確的 bucket 名稱：`orderpdf`
2. 檢查 bucket 是否允許 PDF 文件類型
3. 驗證 API 使用正確的 `contentType: 'application/pdf'`
4. 運行 `node scripts/test-pdf-upload.js` 測試 bucket 配置

### Q: PDF 分析失敗
**A**: 可能的原因：
1. OpenAI API 密鑰未設置或無效
2. PDF 文件格式不支援
3. 網絡連接問題
4. PDF 內容過於複雜

### Q: 數據提取不準確
**A**: 優化建議：
1. 使用標準的商業文檔格式
2. 確保 PDF 文字清晰可讀
3. 使用標準的商業術語和標籤
4. 檢查提取的數據並手動調整

## 技術細節

### 數據流程
```
用戶登入 → 獲取 Auth UUID → 查詢 data_id 表 → 獲取數字 ID → PDF 分析 → OpenAI 處理 → 數據保存
```

### API 端點
- `/api/analyze-order-pdf`: PDF 分析和數據提取
- `/api/upload-pdf`: PDF 文件上傳到 Storage（備用）
- 使用 OpenAI GPT-4o 模型
- 自動保存到 `data_order` 表

### Storage 配置
- Bucket 名稱：`orderpdf`
- 支援的 MIME type：`application/pdf`
- 文件大小限制：10MB
- 可選的文件保存功能

### 安全性
- 基於 Supabase RLS 的權限控制
- 用戶身份驗證和授權
- PDF 文件可選保存到 Storage
- 完整的操作審計日誌

## 更新日誌

### v1.2.0 (2025-01-24)
- ✅ 修復 Storage bucket MIME type 錯誤
- ✅ 更新 bucket 名稱為 `orderpdf`
- ✅ 添加 PDF 文件類型驗證
- ✅ 完善 Storage 測試工具
- ✅ 優化錯誤處理和調試信息

### v1.1.0 (2025-01-24)
- ✅ 修復用戶認證問題
- ✅ 優化錯誤處理和用戶反饋
- ✅ 添加備用查詢邏輯（UUID → Email）
- ✅ 完善調試和測試工具