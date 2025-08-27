# 資料庫架構掃描報告
_生成時間: 2025-08-27 10:42:20_

## 執行摘要

本報告基於實際資料庫配置和系統檔案掃描結果，提供資料庫架構的完整狀態評估。

## 1. Supabase 配置狀態

### 核心配置
- **Supabase JS SDK**: v2.49.8 (package.json確認)
- **Supabase SSR**: v0.6.1
- **Auth UI React**: v0.4.7
- **MCP Server**: v0.4.5
- **連接模式**: 使用 `@supabase/ssr` 的 createBrowserClient
- **GraphQL 整合**: 支援 pg_graphql 端點

### 客戶端配置檔案
- `/app/utils/supabase/client.ts` - 瀏覽器客戶端
- `/app/utils/supabase/server.ts` - 伺服器端客戶端
- `/app/utils/supabase/simple-client.ts` - 簡單客戶端
- `/app/utils/supabase/optimized-client.ts` - 優化客戶端
- `/lib/database/supabase-client-manager.ts` - 客戶端單例管理器

### Supabase Functions (Edge Functions)
- `send-aco-completion-email`
- `send-order-created-email`

### SQL Functions (RPC)
已發現 4 個 RPC 函數：
- `rpc_get_await_location_count.sql`
- `rpc_get_await_percentage_stats.sql`
- `rpc_get_stock_level_history.sql`
- `rpc_get_warehouse_transfer_list.sql`

## 2. GraphQL 整合狀態

### Apollo Client 配置
- **版本**: graphql v16.11.0 (package.json確認)
- **客戶端**: Apollo Client with InMemoryCache
- **端點**: 支援自定義端點或 Supabase pg_graphql
- **認證**: 整合 Supabase Auth session
- **性能監控**: PerformanceLink 已配置

### GraphQL 檔案結構
- `/lib/graphql/apollo-client.ts` - Apollo Client 主配置
- `/lib/graphql/apollo-client-factory.ts` - Client 工廠模式
- `/lib/graphql/apollo-server-setup.ts` - Server 設置
- `/lib/graphql/schema.ts` - Schema 定義
- `/lib/graphql/server.ts` - GraphQL 伺服器

### GraphQL Extensions
- **pg_graphql**: v1.5.11 (已安裝並啟用)

## 3. 資料庫表格統計

### 實際表格數量
- **總表格數**: 23個 (實際掃描結果)
- **文檔記錄**: 30個表 (需要更新)
- **差異**: -7個表 (文檔過時)

### 實際表格清單
1. API
2. audit_logs
3. context_summaries
4. data_code
5. data_id
6. data_order
7. data_slateinfo
8. data_supplier
9. doc_upload
10. grn_level
11. order_loading_history
12. pallet_number_buffer
13. query_record
14. record_aco
15. record_grn
16. record_history
17. record_inventory
18. record_palletinfo
19. record_stocktake
20. record_transfer
21. report_void
22. stock_level
23. work_level

### 外鍵關係
- **實際數量**: 16個外鍵關係
- **文檔記錄**: 17個外鍵關係
- **差異**: -1個關係

## 4. ORM/Query 工具版本

### Prisma
- **版本**: v6.12.0 (僅開發依賴)
- **配置檔案**: 未找到 prisma/schema.prisma
- **狀態**: 已安裝但未配置使用

### DataLoader
- **版本**: v2.2.3
- **用途**: 解決 GraphQL N+1 查詢問題

## 5. 資料庫安全配置

### Row Level Security (RLS)
- **實際RLS策略數**: 109個
- **文檔記錄**: 88個
- **新增策略**: +21個 (顯示持續的安全改進)

### 已安裝的安全相關擴展
1. **pgcrypto** v1.3 - 加密功能
2. **pgjwt** v0.2.0 - JWT Token 處理
3. **supabase_vault** v0.3.1 - 密鑰管理
4. **pgsodium** - libsodium 加密功能 (可用但未安裝)

## 6. 性能優化擴展

### 已啟用擴展
1. **pg_stat_statements** v1.10 - SQL 語句執行統計
2. **pg_trgm** v1.6 - 文本相似度搜索
3. **vector** v0.8.0 - 向量數據類型和索引
4. **uuid-ossp** v1.1 - UUID 生成

### 可用但未啟用的優化擴展
1. **pg_stat_monitor** v2.1 - 高級查詢性能監控
2. **hypopg** v1.4.1 - 假設索引分析
3. **pg_prewarm** v1.2 - 預熱關係數據

## 7. 資料庫遷移狀態

### 遷移統計
- **總遷移數**: 296個
- **最早遷移**: 2025-05-14 (create_increment_grn_pallet_counter_function)
- **最新遷移**: 2025-08-25 (optimize_database_verified_final)

### 遷移類別分佈
- RLS/Security 相關: ~25個
- Performance/Index 優化: ~20個
- Function/RPC 創建: ~80個
- Table 結構調整: ~40個
- 數據清理/維護: ~30個
- 其他: ~101個

## 8. 連接管理配置

### Supabase Client Manager 特性
- **單例模式**: 優化連接重用
- **性能監控**: 查詢時間、慢查詢、失敗查詢追蹤
- **查詢緩存**: LRU/FIFO 策略支援
- **自動重連**: 連接失敗自動重試
- **健康檢查**: 30秒間隔健康檢查

### 連接配置預設值
```javascript
{
  maxRetries: 3,
  retryDelayMs: 1000,
  healthCheckIntervalMs: 30000,
  connectionTimeoutMs: 10000,
  enableAutoReconnect: true,
  enableQueryMetrics: true,
  enableQueryCache: true
}
```

## 9. 特殊功能擴展

### 已啟用
1. **pg_cron** v1.6 - 作業調度器
2. **pg_net** - 異步 HTTP 請求 (可用但未安裝)
3. **vector** v0.8.0 - AI/ML 向量運算支援

### 時序數據
- **timescaledb** v2.16.1 - 可用但未安裝，適合未來的時序數據需求

## 10. 建議更新項目

### 文檔更新需求
1. **表格數量**: 更新為 23個表（當前文檔顯示30個）
2. **外鍵關係**: 更新為 16個（當前文檔顯示17個）
3. **RLS策略**: 更新為 109個（當前文檔顯示88個）

### 架構優化建議
1. **Prisma配置**: 已安裝 v6.12.0 但未配置 schema，建議評估是否需要移除或完整配置
2. **性能監控**: 考慮啟用 pg_stat_monitor 以獲得更詳細的查詢分析
3. **索引優化**: 考慮使用 hypopg 進行假設索引分析

### 安全加固建議
1. **加密升級**: 考慮啟用 pgsodium 以使用更現代的加密功能
2. **審計加強**: audit_logs 表已存在，確保所有敏感操作都有記錄

## 11. 資料完整性驗證

### 核心數據表關係驗證
基於實際表格掃描，以下是主要的數據關係：
- `record_grn` → `data_supplier` (供應商關係)
- `record_inventory` → `record_palletinfo` (庫存-托盤關係)
- `record_aco` → `data_order` (ACO訂單關係)
- `record_transfer` → `record_inventory` (轉移-庫存關係)

### 數據一致性檢查點
1. `pallet_number_buffer` - 托盤號碼生成緩衝
2. `work_level` / `grn_level` - 工作層級管理
3. `audit_logs` - 操作審計追蹤

## 總結

資料庫架構整體健康，具備以下特點：
- ✅ Supabase 整合完整，版本最新
- ✅ GraphQL 配置完善，支援 pg_graphql
- ✅ RLS 策略覆蓋全面（109個策略）
- ⚠️ 文檔需要更新以反映實際狀態
- ⚠️ Prisma 已安裝但未使用
- ✅ 性能監控和優化工具充足
- ✅ 安全擴展配置得當

---

_此報告由 Data Architect 自動生成_
_基於實時資料庫掃描結果_