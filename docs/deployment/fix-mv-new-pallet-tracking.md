# 修復物化視圖新增托盤追蹤問題 - 部署指南

## 背景

目前的物化視圖 `mv_pallet_current_location` 只在 `record_history` 表更新時刷新，當新增托盤到 `record_palletinfo` 時不會觸發刷新，導致新托盤無法立即被搜尋到。

## 修復內容

1. **新增觸發器** - 監聽 `record_palletinfo` 表的插入操作
2. **查詢函數 V2** - 包含智能回退機制
3. **自動刷新機制** - 定期檢查並刷新視圖
4. **手動同步選項** - 提供緊急同步功能

## 部署步驟

### 1. 執行 SQL 腳本

```bash
# 連接到 Supabase 數據庫
psql -h db.xxxxx.supabase.co -p 5432 -d postgres -U postgres

# 執行修復腳本
\i /path/to/fix-mv-new-pallet-tracking.sql
```

或使用 Supabase Dashboard：
1. 進入 SQL Editor
2. 複製 `scripts/fix-mv-new-pallet-tracking.sql` 內容
3. 執行腳本

### 2. 驗證部署

```sql
-- 檢查新函數是否創建成功
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('search_pallet_optimized_v2', 'smart_refresh_mv', 'force_sync_pallet_mv');

-- 檢查觸發器是否創建成功
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name IN ('trg_history_mv_refresh', 'trg_palletinfo_mv_refresh');

-- 測試新函數
SELECT * FROM search_pallet_optimized_v2('pallet_num', 'YOUR_TEST_PALLET');
```

### 3. 前端代碼更新

前端代碼已經更新，會自動使用新的 V2 函數。如果 V2 函數不存在，會自動回退到 V1。

### 4. 監控和維護

#### 檢查物化視圖狀態
```sql
-- 查看刷新狀態
SELECT * FROM mv_refresh_tracking;

-- 查看性能統計
SELECT * FROM v_stock_transfer_performance;
```

#### 手動操作（如需要）
```sql
-- 智能刷新（只在需要時刷新）
SELECT smart_refresh_mv();

-- 強制同步（緊急情況）
SELECT force_sync_pallet_mv();
```

## 測試驗證

### 1. 新增托盤測試

```sql
-- 1. 插入新托盤
INSERT INTO record_palletinfo (plt_num, product_code, product_qty)
VALUES ('TEST-999999/1', 'TEST001', 100);

-- 2. 立即搜尋（應該能找到）
SELECT * FROM search_pallet_optimized_v2('pallet_num', 'TEST-999999/1');

-- 3. 檢查數據來源
-- is_from_mv = false 表示來自實時查詢
-- is_from_mv = true 表示來自物化視圖
```

### 2. 性能測試

```sql
-- 比較查詢性能
EXPLAIN ANALYZE SELECT * FROM search_pallet_optimized_v2('pallet_num', 'YOUR_PALLET');
```

## 回滾方案

如果需要回滾：

```sql
-- 1. 刪除新觸發器
DROP TRIGGER IF EXISTS trg_palletinfo_mv_refresh ON record_palletinfo;

-- 2. 刪除新函數
DROP FUNCTION IF EXISTS search_pallet_optimized_v2;
DROP FUNCTION IF EXISTS smart_refresh_mv;
DROP FUNCTION IF EXISTS force_sync_pallet_mv;

-- 3. 前端會自動回退到使用 V1 函數
```

## 注意事項

1. **性能影響** - 新增托盤會觸發刷新標記，但不會立即刷新視圖
2. **數據一致性** - 使用 CONCURRENTLY 刷新，不會阻塞查詢
3. **自動刷新** - 如果安裝了 pg_cron，會每分鐘自動檢查並刷新

## 問題排查

### 新托盤仍然找不到？

1. 檢查觸發器是否正常工作：
   ```sql
   SELECT * FROM mv_refresh_tracking;
   -- needs_refresh 應該為 true
   ```

2. 手動強制同步：
   ```sql
   SELECT force_sync_pallet_mv();
   ```

3. 檢查查詢結果的 `is_from_mv` 欄位，確認數據來源

### 性能下降？

1. 檢查物化視圖索引：
   ```sql
   \d mv_pallet_current_location
   ```

2. 分析查詢計劃：
   ```sql
   EXPLAIN ANALYZE SELECT * FROM mv_pallet_current_location WHERE plt_num = 'XXX';
   ```

## 聯絡支援

如有問題，請提供：
- 錯誤訊息截圖
- `mv_refresh_tracking` 表的內容
- 相關的托盤號碼