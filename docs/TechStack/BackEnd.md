# 後端技術棧 (Backend Technology Stack)

_最後更新日期: 2025-08-29 02:33:37_

## 核心環境與框架

- **運行環境**: Node.js
- **框架**: Next.js API Routes

## API 層

- **API 類型**: GraphQL (主要), REST (輔助)
- **GraphQL 服務**: Apollo Server 5.0.0, GraphQL 16.11.0
- **外部服務**: Resend 4.0.1, Nodemailer 6.9.16
- **資料加載優化**: DataLoader 2.2.3
- **API 限流**: Rate-limiter-flexible 7.1.1

### API 設計理念

本系統採用 **GraphQL 為主、REST 為輔** 的混合 API 架構，旨在結合兩者的優勢：

- **GraphQL (主要)**
  - **應用場景**: 用於前端複雜的數據查詢與變更操作。客戶端可以精確地請求所需的數據，避免了 over-fetching 和 under-fetching 的問題。
  - **優勢**: 高效的數據交互、強型別 Schema、單一端點。

- **REST (輔助)**
  - **應用場景**:
    1.  **外部服務整合**: 用於接收來自第三方服務的 Webhook（例如：支付網關回調）。
    2.  **簡單的、固定的數據端點**: 例如 `GET /api/health` 健康檢查。
    3.  **文件上傳/下載**: 處理二進制數據流。
  - **優勢**: 簡單直觀、生態成熟、對 Webhook 友好。

## 後端架構

- **GraphQL Schema**: `lib/graphql/` 目錄下65個TypeScript檔案
- **GraphQL 擴展**: pg_graphql v1.5.11 已啟用
- **無伺服器函數**: `app/api/` 下29個REST端點 + 1個GraphQL端點
- **API版本管理**: v1與v2版本共存, 支持版本標示和自動轉發
- **中間件**: `middleware.ts` 認證與路由保護
- **安全層**: CORS 2.8.5, JWT (jsonwebtoken 9.0.2), bcryptjs 3.0.2

## AI 整合服務

- **OpenAI SDK**: openai 4.104.0
- **Anthropic SDK**: @anthropic-ai/sdk 0.40.1
- **應用場景**: 自然語言處理、資料庫查詢生成、PDF 文件分析

## 資料庫與 ORM

- **Prisma ORM**: @prisma/client 6.12.0, prisma 6.12.0
- **Supabase SDK**: @supabase/supabase-js 2.49.8
- **Supabase SSR**: @supabase/ssr 0.6.1
- **認證整合**: @supabase/auth-ui-react 0.4.7

### GraphQL 命名約定

為保持 GraphQL Schema 的一致性與可讀性，我們遵循以下命名約定：

- **類型 (Types)**: 使用 `PascalCase`，例如 `Product`, `UserOrder`。
- **查詢 (Queries)**: 使用 `camelCase`，並以 `get` 或 `list` 開頭。
  - 獲取單一實體: `getProductById(id: ID!)`
  - 獲取列表: `listProducts(filter: ProductFilter)`
- **變更 (Mutations)**: 使用 `camelCase`，並以動作動詞開頭，例如 `createProduct`, `updateOrderStatus`, `deleteUser`。
- **輸入 (Inputs)**: 變更的輸入類型應以其對應的變更名稱加上 `Input` 後綴，例如 `createProduct` 的輸入是 `CreateProductInput`。
