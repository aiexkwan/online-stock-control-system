# Vercel 部署修正指南

## 🚨 問題描述

在 Vercel 正式環境中出現 "Invalid API key" 錯誤：

```
Error: Database operation failed: Transaction failed: Failed to insert pallet info: Invalid API key
```

## 🔍 根本原因分析

經過分析，可能的原因包括：

1. **環境變數優先級問題**: Vercel Dashboard 中的環境變數會覆蓋 `vercel.json`
2. **Service Role Key 無效**: 雖然 JWT 未過期，但可能被 Supabase 撤銷
3. **Supabase 項目設置問題**: RLS 政策或權限配置問題
4. **API key 格式問題**: 複製時可能有隱藏字符

## 🔧 解決步驟

### 步驟 1: 診斷當前狀態

訪問診斷端點來檢查環境變數和連接：
```
https://your-vercel-app.vercel.app/api/debug-supabase
```

### 步驟 2: 獲取新的 Service Role Key

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇項目: `bbmkuiplnzvpudszrend`
3. 進入 **Settings** → **API**
4. 點擊 **Reset** 按鈕重新生成 service_role key
5. 複製新的 **service_role** key

### 步驟 3: 更新 Vercel 環境變數

#### 方法 A: 通過 Vercel Dashboard (推薦)

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的項目
3. 進入 **Settings** → **Environment Variables**
4. **刪除**現有的 `SUPABASE_SERVICE_ROLE_KEY`
5. **新增**新的 `SUPABASE_SERVICE_ROLE_KEY` 環境變數
6. 設置適用於所有環境 (Production, Preview, Development)
7. 點擊 **Save**
8. 重新部署項目

#### 方法 B: 更新 vercel.json 並推送

1. 更新 `vercel.json` 中的 `SUPABASE_SERVICE_ROLE_KEY`
2. 確保 Vercel Dashboard 中沒有同名環境變數
3. 提交並推送到 GitHub
4. Vercel 會自動重新部署

### 步驟 4: 清除 Vercel 緩存

1. 在 Vercel Dashboard 中進入項目
2. 進入 **Deployments** 頁面
3. 點擊最新部署的 **...** 菜單
4. 選擇 **Redeploy**
5. 勾選 **Use existing Build Cache** 取消選擇
6. 點擊 **Redeploy**

### 步驟 5: 驗證修正

部署完成後：

1. 訪問診斷端點確認環境變數正確
2. 登入系統
3. 嘗試使用 Print QC Label 功能
4. 檢查是否還有 "Invalid API key" 錯誤

## 🔍 進階診斷

### 檢查 Supabase 項目狀態

1. 確認 Supabase 項目是否暫停或有問題
2. 檢查 Supabase Dashboard 中的 **Settings** → **General**
3. 確認項目狀態為 "Active"

### 檢查 RLS 政策

如果連接成功但仍有權限問題：

1. 進入 Supabase Dashboard → **Authentication** → **Policies**
2. 檢查相關表格的 RLS 政策
3. 確認 `service_role` 有適當的權限

### 檢查 API 使用限制

1. 進入 Supabase Dashboard → **Settings** → **Usage**
2. 檢查是否達到 API 請求限制
3. 檢查是否有異常的 API 使用模式

## 🔒 安全注意事項

- **絕不要**將 Service Role Key 暴露在前端代碼中
- **絕不要**將 Service Role Key 提交到公開的 Git 倉庫
- Service Role Key 具有完整的資料庫訪問權限，必須妥善保護
- 定期輪換 API keys 以提高安全性

## 📋 環境變數清單

確保以下環境變數在 Vercel 中正確設置：

```
NEXT_PUBLIC_SUPABASE_URL=https://bbmkuiplnzvpudszrend.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=[新的有效 Service Role Key]
```

## 🧪 測試腳本

### 本地測試
```bash
node scripts/check-env.js
node scripts/decode-jwt.js
```

### 線上診斷
```
GET /api/debug-supabase
```

## 🚨 緊急解決方案

如果問題持續存在，嘗試以下步驟：

1. **完全重新創建環境變數**:
   - 在 Vercel Dashboard 中刪除所有 Supabase 相關環境變數
   - 重新添加所有環境變數
   - 強制重新部署

2. **檢查 Supabase 項目健康狀態**:
   - 訪問 [Supabase Status](https://status.supabase.com/)
   - 確認沒有服務中斷

3. **聯繫支援**:
   - Vercel Support (如果是部署問題)
   - Supabase Support (如果是 API 問題)

## 📞 如需協助

如果問題持續存在：

1. 檢查診斷端點的詳細錯誤信息
2. 確認 Supabase 項目是否正常運行
3. 確認 Service Role Key 是否正確複製
4. 檢查 Vercel 部署日誌中的詳細錯誤信息
5. 嘗試在本地環境重現問題

---

**最後更新**: 2025-01-28  
**狀態**: 增強診斷中 