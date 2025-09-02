# 資料庫技術棧 (Database Technology Stack)

_最後更新日期: 2025-09-02 11:46:01_

## 核心配置

- **供應商**: Supabase 2.49.8 (PostgreSQL)
- **MCP 整合**: @supabase/mcp-server-supabase 0.4.5
- **表格數量**: 30個表 (public schema)
- **關係**: 23個外鍵關係

## 數據庫架構

- **資料庫關係**: 30個表，23個外鍵關係
- **行級安全策略 (RLS)**: 120個RLS策略
- **驗證工具**: Supabase MCP 工具
- **向量支援**: pgvector 0.8.0 擴展（用於 AI 語義搜索）
- **安全功能**: 審計日誌與完整性驗證鏈

## 核心資料表關係圖

```mermaid
erDiagram
    users {
        UUID id PK
        String email
        String role
    }

    products {
        UUID id PK
        String name
        String product_code
        Int stock_level
    }

    orders {
        UUID id PK
        UUID user_id FK
        String status
        Timestamp created_at
    }

    order_items {
        UUID order_id PK, FK
        UUID product_id PK, FK
        Int quantity
    }

    locations {
        UUID id PK
        String name
    }

    stock_transfers {
        UUID id PK
        UUID product_id FK
        UUID from_location_id FK
        UUID to_location_id FK
        Int quantity
    }

    users ||--o{ orders : "places"
    orders ||--|{ order_items : "contains"
    products ||--|{ order_items : "details"
    products ||--o{ stock_transfers : "is transferred"
    locations ||--o{ stock_transfers : "from"
    locations ||--o{ stock_transfers : "to"
```
