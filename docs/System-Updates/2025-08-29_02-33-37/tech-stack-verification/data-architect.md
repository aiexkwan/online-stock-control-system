# 資料庫架構掃描報告

_掃描時間: 2025-08-29 02:33:37_

## 執行摘要

本次掃描使用 Supabase MCP 工具對系統資料庫進行全面檢查，驗證實際配置與文檔記錄的一致性。

## 掃描結果

### 核心配置

- **供應商**: Supabase (PostgreSQL)
- **Supabase JS 版本**: 2.49.8 (與文檔記錄一致)
- **Supabase CLI 版本**: 2.29.0

### 資料庫結構統計

| 項目     | 文檔記錄值 | 實際掃描值 | 差異 |
| -------- | ---------- | ---------- | ---- |
| 表格數量 | 23         | 21         | -2   |
| 外鍵關係 | 16         | 31         | +15  |
| RLS 策略 | 109        | 109        | 0    |

### 詳細表格清單 (21個表)

1. **data_code** - 產品詳細資料庫 (8,435 筆記錄)
2. **data_id** - 使用者ID資料庫 (34 筆記錄)
3. **data_slateinfo** - 石板詳細資料庫 (0 筆記錄)
4. **data_supplier** - 供應商資料庫 (66 筆記錄)
5. **record_grn** - 收貨記錄 (22 筆記錄)
6. **record_history** - 操作歷史 (42 筆記錄)
7. **record_inventory** - 庫存記錄 (42 筆記錄)
8. **record_palletinfo** - 托盤資訊庫 (7,892 筆記錄)
9. **record_transfer** - 轉移記錄 (0 筆記錄)
10. **record_aco** - ACO訂單庫 (0 筆記錄)
11. **report_void** - 損壞記錄 (0 筆記錄)
12. **query_record** - 聊天記錄庫 (0 筆記錄)
13. **stock_level** - 庫存水平 (3 筆記錄)
14. **work_level** - 工作量記錄 (1 筆記錄)
15. **API** - API配置表 (5 筆記錄)
16. **grn_level** - GRN收貨庫 (4 筆記錄)
17. **data_order** - 訂單資料庫 (19 筆記錄)
18. **record_stocktake** - 盤點記錄 (0 筆記錄)
19. **order_loading_history** - 訂單載入歷史 (0 筆記錄)
20. **pallet_number_buffer** - 托盤號碼緩衝區 (300 筆記錄)
21. **doc_upload** - 文檔上傳記錄 (0 筆記錄)

### 新發現的表格（未在文檔中記錄）

- **audit_logs** - 增強的審計日誌表，包含設備指紋、會話追踪和完整性驗證
- **context_summaries** - 上下文摘要表，支援向量嵌入

### 外鍵關係詳細分析 (31個關係)

#### 被引用的主表

- **data_code** (5個外鍵引用)
- **data_id** (4個外鍵引用)
- **data_supplier** (1個外鍵引用)
- **record_palletinfo** (6個外鍵引用)

#### 引用其他表的表

- **record_grn**: 3個外鍵
- **record_history**: 2個外鍵
- **record_inventory**: 2個外鍵
- **record_palletinfo**: 1個外鍵
- **record_transfer**: 2個外鍵
- **record_aco**: 1個外鍵
- **report_void**: 1個外鍵
- **stock_level**: 1個外鍵
- **work_level**: 1個外鍵
- **record_stocktake**: 2個外鍵

### RLS 策略分佈 (總計: 109個策略)

| 表名             | 策略數量  |
| ---------------- | --------- |
| data_order       | 7         |
| data_id          | 6         |
| record_grn       | 6         |
| record_history   | 6         |
| record_inventory | 6         |
| record_transfer  | 6         |
| 其他表           | 4-5個策略 |

## 發現的差異與建議

### 1. 表格數量差異

- **問題**: 文檔記錄23個表，實際只有21個表在public schema中
- **新增表格**: audit_logs, context_summaries（可能是最近添加）
- **建議**: 更新文檔以反映實際的表格結構

### 2. 外鍵關係差異

- **問題**: 文檔記錄16個外鍵，實際有31個外鍵關係
- **原因**: 文檔可能只計算了單向關係，實際系統有更複雜的關聯
- **建議**: 更新ER圖以包含所有外鍵關係

### 3. 安全增強功能

- **發現**: audit_logs表包含進階安全功能
  - 設備指紋追踪
  - 地理位置記錄
  - 完整性哈希鏈
  - 風險評分系統
- **建議**: 這些安全功能應該在安全文檔中詳細記錄

### 4. AI/向量支援

- **發現**: context_summaries表支援向量嵌入
- **意義**: 系統可能正在使用向量數據庫功能進行語義搜索
- **建議**: 在AI整合文檔中記錄此功能

## 性能優化建議

1. **索引優化**
   - record_palletinfo表有7,892筆記錄，建議檢查索引策略
   - data_code表有8,435筆記錄，應確保product_code有適當索引

2. **空表清理**
   - 多個表格為空（record_transfer, record_aco等）
   - 評估是否為未來功能預留或可以清理

3. **加密欄位**
   - data_id.email_encrypted使用bytea格式
   - query_record.token_encrypted使用bytea格式
   - 確保加密金鑰管理安全

## 結論

資料庫架構基本穩定，但文檔需要更新以反映實際狀態。系統已實施進階安全功能和向量支援，顯示架構正在演進以支援更複雜的功能需求。
