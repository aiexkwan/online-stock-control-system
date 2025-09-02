# 後端技術棧掃描報告

_執行時間: 2025-09-02 11:46:01_
_執行者: Backend Architect_

## 掃描範圍

- package.json 依賴項版本
- GraphQL Schema 檔案統計
- API 端點數量統計
- 中間件配置檢查

## 掃描結果

### 核心環境與框架

- **運行環境**: Node.js (確認)
- **框架**: Next.js 15.4.4 API Routes (確認)

### API 層版本確認

- **API 類型**: GraphQL (主要), REST (輔助) - 保持不變
- **GraphQL 服務**:
  - Apollo Server: **4.0.0** → **5.0.0** (版本保持)
  - GraphQL: **16.11.0** (版本確認)
- **外部服務**:
  - Resend: **4.0.1** (版本確認)
  - Nodemailer: **6.9.16** (版本確認)
- **資料加載優化**: DataLoader **2.2.3** (版本確認)
- **API 限流**: rate-limiter-flexible **7.1.1** (版本確認)

### 後端架構統計

- **GraphQL Schema**: lib/graphql/ 目錄下 **65個** TypeScript 檔案 (確認)
- **GraphQL 擴展**: pg_graphql v1.5.11 (無法從 package.json 驗證，保持現有記錄)
- **無伺服器函數**: app/api/ 下 **11個** REST 端點檔案 + 1個 GraphQL 端點 (確認)
- **API版本管理**: v1與v2版本共存 (從檔案名稱推斷，如 route-new.ts)
- **中間件**: middleware.ts 存在，16,693 bytes (確認)
- **安全層版本**:
  - CORS: **2.8.5** (版本確認)
  - jsonwebtoken: **9.0.2** (版本確認)
  - bcryptjs: **3.0.2** (版本確認)

### AI 整合服務版本

- **OpenAI SDK**: openai **4.104.0** (版本確認)
- **Anthropic SDK**: @anthropic-ai/sdk **0.40.1** (版本確認)

### 資料庫與 ORM 版本

- **Prisma ORM**:
  - @prisma/client: **6.12.0** (版本確認)
  - prisma: **6.12.0** (版本確認)
- **Supabase SDK**:
  - @supabase/supabase-js: **2.49.8** (版本確認)
  - @supabase/ssr: **0.6.1** (版本確認)
  - @supabase/auth-ui-react: **0.4.7** (版本確認)

## 變更摘要

### 版本更新

- 所有套件版本已確認與 package.json 一致
- Apollo Server 版本保持為 5.0.0 (之前記錄正確)

### 數量確認

- GraphQL Schema 檔案: 65個 (無變化)
- API 端點: 11個 REST 端點 (確認數量)
- 中間件: middleware.ts 確認存在

## 資料完整性

- ✅ 所有核心依賴版本已驗證
- ✅ 檔案數量統計已確認
- ✅ 中間件配置已確認存在
- ⚠️ pg_graphql 版本無法從 package.json 驗證（保持現有記錄）
