# RPC函數庫

## 概述

RPC（Remote Procedure Call）函數庫係系統中用嚟處理複雜資料庫操作嘅核心組件。呢啲函數提供原子性操作、性能優化同安全執行，確保數據一致性同系統可靠性。

## 函數分類

### 1. 棧板號碼生成函數

#### generate_atomic_pallet_numbers_v5
最新版本嘅棧板號碼生成函數，支援數字排序同緩衝池機制。

**功能特點**：
- 原子性操作確保唯一性
- 支援數字排序（解決字符串排序問題）
- 實現緩衝池機制提升性能
- 自動預生成額外號碼
- 防止並發衝突

**參數**：
- `p_count`: 需要生成嘅數量
- `p_session_id`: 會話ID（可選）

**返回值**：
- 棧板號碼數組，格式：`DDMMYY/XXXX`

**使用示例**：
```sql
SELECT generate_atomic_pallet_numbers_v5(5, 'session-123');
```

### 2. 緩衝區清理函數

#### auto_cleanup_pallet_buffer
自動清理棧板號碼緩衝區嘅維護函數。

**清理規則**：
1. 刪除非今日嘅條目
2. 刪除已使用超過2小時嘅條目
3. 刪除未使用超過30分鐘嘅條目
4. 保持緩衝區最多100個未使用條目

**自動執行**：
- 使用Supabase Scheduler每5分鐘執行一次

#### api_cleanup_pallet_buffer
提供API調用嘅清理函數，返回JSON格式結果。

**返回值**：
```json
{
  "success": true,
  "deleted_old_days": 10,
  "deleted_used": 5,
  "deleted_unused": 3,
  "total_deleted": 18,
  "entries_before": 150,
  "entries_after": 132,
  "cleaned_at": "2025-06-21T10:00:00"
}
```

### 3. 訂單裝載函數

#### rpc_load_pallet_to_order
原子性棧板裝載到訂單嘅函數。

**功能流程**：
1. 驗證棧板存在性
2. 檢查重複裝載
3. 驗證訂單同產品
4. 檢查數量要求
5. 更新多個相關表
6. 記錄操作歷史

**參數**：
- `p_order_ref`: 訂單參考號
- `p_pallet_input`: 棧板號或系列號
- `p_user_id`: 用戶ID
- `p_user_name`: 用戶名稱

**更新表格**：
- `order_loading`: 新增裝載記錄
- `data_customerorder`: 更新剩餘數量
- `record_history`: 記錄操作歷史
- `stock_level`: 更新庫存水平
- `record_inventory`: 清空位置數量
- `record_palletinfo`: 更新備註

#### rpc_undo_load_pallet
原子性取消棧板裝載嘅函數。

**功能特點**：
- 恢復訂單數量
- 恢復庫存位置
- 記錄撤銷操作
- 刪除裝載記錄

### 4. 查詢執行函數

#### execute_sql_query
安全執行SQL查詢嘅函數，用於Ask Me Anything功能。

**安全特性**：
- 僅允許SELECT語句
- 阻止危險關鍵字
- 防止SQL注入
- 結果轉換為JSON格式

**使用限制**：
- 不允許DML操作（INSERT、UPDATE、DELETE）
- 不允許DDL操作（CREATE、DROP、ALTER）
- 不允許權限操作（GRANT、REVOKE）

### 5. 庫存管理函數

#### update_stock_level_void
用於作廢操作嘅庫存更新函數。

**功能特點**：
- 安全扣減庫存
- 防止負庫存
- 記錄更新時間
- 返回操作詳情

**參數**：
- `p_product_code`: 產品代碼
- `p_quantity`: 數量
- `p_operation`: 操作描述

### 6. 產品查詢函數

#### get_product_details_by_code
根據產品代碼獲取詳細資訊。

**返回欄位**：
- `code`: 產品代碼
- `description`: 產品描述
- `type`: 產品類型
- `short_code`: 簡碼
- `category`: 類別

## 管理儀表板RPC函數

### get_admin_dashboard_stats
獲取管理儀表板所有統計數據嘅集中式函數。

**功能特點**：
- 一次查詢獲取所有數據
- 減少網絡往返
- 優化性能
- 返回結構化JSON

**返回數據包括**：
- 每日生產統計
- ACO訂單進度
- 庫存摘要
- 轉移統計
- GRN收貨數據

### search_inventory_by_product
按產品代碼搜尋庫存。

**參數**：
- `p_product_code`: 產品代碼（支援部分匹配）

**返回值**：
- 產品資訊同各位置庫存數量

## 工作水平RPC函數

### get_operator_performance
獲取操作員性能統計。

**功能**：
- 操作員工作量統計
- 按操作類型分組
- 時間範圍過濾
- 排名計算

### get_top_performers
獲取頂級表現者。

**參數**：
- `p_operation_type`: 操作類型
- `p_limit`: 返回數量限制

### get_work_level_summary
獲取工作水平摘要統計。

**返回數據**：
- 總操作數
- 活躍操作員數
- 平均每人操作數
- 按類型分組統計

## 權限管理

### 執行權限
所有RPC函數都使用`SECURITY DEFINER`，以函數擁有者權限執行。

### 授權用戶
- `anon`: 匿名用戶（部分函數）
- `authenticated`: 認證用戶（大部分函數）
- `service_role`: 服務角色（維護函數）

## 性能優化

### 索引使用
- 所有查詢都利用適當索引
- 避免全表掃描
- 使用部分索引優化

### 批量操作
- 減少數據庫往返
- 使用事務確保一致性
- 批量插入同更新

### 緩存策略
- 緩衝池機制
- 預生成號碼
- 結果集緩存

## 錯誤處理

### 錯誤類型
- 驗證錯誤：參數無效
- 業務錯誤：違反業務規則
- 系統錯誤：資料庫異常

### 錯誤返回
所有函數返回標準化JSON格式：
```json
{
  "success": false,
  "error": "錯誤描述"
}
```

## 維護指南

### 日常維護
1. 監控緩衝池使用率
2. 檢查清理任務執行
3. 分析慢查詢
4. 優化索引

### 定期任務
- 每5分鐘：自動清理緩衝池
- 每日：檢查序列號連續性
- 每週：分析表統計資訊
- 每月：清理歷史數據

### 故障排除

#### 棧板號碼重複
- 檢查`daily_pallet_sequence`表
- 驗證緩衝池狀態
- 查看並發鎖定

#### 性能問題
- 分析執行計劃
- 檢查索引使用
- 監控連接池

#### 權限錯誤
- 確認用戶角色
- 檢查函數授權
- 驗證RLS政策

## 最佳實踐

### 使用建議
1. 優先使用RPC函數而非直接SQL
2. 利用批量操作提升性能
3. 正確處理錯誤返回
4. 避免長時間事務

### 安全考慮
1. 驗證所有輸入參數
2. 使用參數化查詢
3. 限制執行權限
4. 記錄敏感操作

### 性能考慮
1. 避免N+1查詢
2. 使用適當索引
3. 批量處理數據
4. 監控執行時間

## 版本歷史

### V5版本（當前）
- 支援數字排序
- 實現緩衝池機制
- 優化並發處理
- 增強錯誤處理

### 未來改進
- WebSocket即時通知
- 分佈式鎖定
- 更智能嘅緩衝策略
- 自動性能調優