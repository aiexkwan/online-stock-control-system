# 資料庫技術棧掃描報告

**掃描時間**: 2025-09-02 11:46:01  
**執行者**: data-architect

## 掃描結果

### 核心配置
- **Supabase 版本**: 2.49.8 (從 package.json 確認)
- **MCP 整合版本**: @supabase/mcp-server-supabase 0.4.5 (從 package.json 確認)
- **表格數量**: 30個表 (public schema)
- **外鍵關係**: 23個外鍵關係

### 數據庫架構
- **資料庫關係**: 30個表，23個外鍵關係
- **行級安全策略 (RLS)**: 120個RLS策略
- **已啟用擴展**: 
  - pg_graphql v1.5.11
  - vector v0.8.0 (pgvector)
  - pg_cron v1.6
  - pg_stat_statements v1.10
  - pgjwt v0.2.0
  - pgcrypto v1.3
  - uuid-ossp v1.1
  - supabase_vault v0.3.1
  - pg_trgm v1.6
  - plpgsql v1.0

### 變更摘要
- 表格數量從 21個 增加到 30個
- 外鍵關係從 31個 減少到 23個
- RLS 策略從 109個 增加到 120個
- 確認 pgvector 擴展已安裝 (v0.8.0)

### 新增表格 (相比原文檔)
1. archon_settings - Archon 系統設置表
2. archon_sources - Archon 知識來源表
3. archon_crawled_pages - Archon 爬取頁面表
4. archon_code_examples - Archon 代碼範例表
5. archon_projects - Archon 專案管理表
6. archon_tasks - Archon 任務管理表
7. archon_project_sources - Archon 專案來源關聯表
8. archon_document_versions - Archon 文檔版本表
9. context_history - AI Agents 長期記憶儲存表

### 數據完整性特性
- 所有表格均啟用 RLS (Row Level Security)
- 加密字段存在於: query_record, data_order, data_id, archon_settings
- 審計日誌表 (audit_logs) 包含完整性驗證鏈
- UUID 主鍵廣泛使用，確保全局唯一性

## 資料來源
- package.json 文件
- Supabase MCP 工具查詢
- PostgreSQL 系統表查詢