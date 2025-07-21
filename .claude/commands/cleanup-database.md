# 資料庫清理命令

## 用法
`/cleanup-database` 或 `/cleanup-database [表名/功能]`

## 執行流程
1. **啟動工具**
   - Ultrathink - 深度資料庫分析
   - Sequential-thinking - 系統性查詢優化
   - Task - 並行性能測試
   - Supabase MCP - 直接資料庫操作

2. **資料庫分析**
   - 慢查詢識別
   - 索引優化建議
   - 數據完整性檢查
   - RPC 函數優化

## 角色建議
- 主要角色: ⚙️ Backend（資料庫專家）
- 協作角色: 📊 DataAnalyst + ⚡ Optimizer + 🔒 Security
- 分析角色: 📊 Analyzer（查詢分析）

## 資料庫檢查項目
### 🗃️ 表結構優化
- [ ] 索引使用效率
- [ ] 外鍵約束檢查
- [ ] 資料類型優化
- [ ] 正規化程度評估
- [ ] 分區策略檢查

### 🚀 查詢性能
- [ ] 慢查詢識別 (>50ms)
- [ ] N+1 查詢問題
- [ ] 全表掃描檢查
- [ ] 查詢計劃分析
- [ ] 統計信息更新

### 🔧 RPC 函數
- [ ] 函數執行效率
- [ ] 參數驗證完整性
- [ ] 錯誤處理機制
- [ ] 事務管理
- [ ] 安全性檢查

## 性能目標
| 指標 | 目標值 | 檢查方法 |
|------|--------|----------|
| 查詢響應時間 | <50ms | EXPLAIN ANALYZE |
| 索引命中率 | >95% | pg_stat_user_indexes |
| 連接池使用率 | <80% | pg_stat_activity |
| 緩存命中率 | >90% | pg_stat_database |
| 鎖等待時間 | <10ms | pg_locks |

## 資料庫診斷查詢
### 🔍 性能分析
```sql
-- 慢查詢分析
SELECT
  query,
  calls,
  total_exec_time,
  total_exec_time/calls as avg_time,
  rows/calls as avg_rows
FROM pg_stat_statements
WHERE total_exec_time > 1000
ORDER BY total_exec_time DESC
LIMIT 10;

-- 索引使用情況
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- 表大小分析
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
  pg_total_relation_size(tablename::regclass) as raw_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY raw_size DESC;

-- 鎖分析
SELECT
  pid,
  usename,
  query,
  state,
  query_start,
  state_change,
  backend_start
FROM pg_stat_activity
WHERE state != 'idle'
  AND query != '<IDLE>'
ORDER BY query_start;
```

### 📊 數據完整性
```sql
-- 外鍵約束檢查
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- 重複數據檢查
SELECT
  column_name,
  COUNT(*) as duplicate_count
FROM (
  SELECT
    product_code,
    pallet_no,
    COUNT(*) as cnt
  FROM record_palletinfo
  GROUP BY product_code, pallet_no
  HAVING COUNT(*) > 1
) duplicates
GROUP BY column_name;

-- 空值分析
SELECT
  column_name,
  COUNT(*) as null_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM record_palletinfo) as null_percentage
FROM information_schema.columns c
CROSS JOIN record_palletinfo p
WHERE c.table_name = 'record_palletinfo'
  AND c.column_name IS NULL
GROUP BY column_name;
```

## 索引優化策略
### 🎯 索引建議
```sql
-- 常用查詢索引
CREATE INDEX CONCURRENTLY idx_palletinfo_product_code
ON record_palletinfo(product_code);

CREATE INDEX CONCURRENTLY idx_palletinfo_created_at
ON record_palletinfo(created_at DESC);

-- 複合索引
CREATE INDEX CONCURRENTLY idx_palletinfo_product_date
ON record_palletinfo(product_code, created_at DESC);

-- 部分索引
CREATE INDEX CONCURRENTLY idx_palletinfo_active
ON record_palletinfo(product_code)
WHERE status = 'active';

-- 函數索引
CREATE INDEX CONCURRENTLY idx_palletinfo_upper_code
ON record_palletinfo(UPPER(product_code));
```

### 🔄 索引維護
```sql
-- 重建索引
REINDEX INDEX CONCURRENTLY idx_palletinfo_product_code;

-- 更新統計信息
ANALYZE record_palletinfo;

-- 清理膨脹
VACUUM FULL record_palletinfo;

-- 自動清理配置
ALTER TABLE record_palletinfo SET (
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_threshold = 1000
);
```

## RPC 函數優化
### 🚀 函數性能
```sql
-- 優化前的函數
CREATE OR REPLACE FUNCTION get_pallet_info_slow(p_product_code TEXT)
RETURNS TABLE(pallet_no TEXT, quantity INTEGER, location TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rp.pallet_no,
    rp.quantity,
    rp.location
  FROM record_palletinfo rp
  WHERE rp.product_code = p_product_code
  ORDER BY rp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 優化後的函數
CREATE OR REPLACE FUNCTION get_pallet_info_fast(p_product_code TEXT)
RETURNS TABLE(pallet_no TEXT, quantity INTEGER, location TEXT) AS $$
BEGIN
  -- 使用預準備語句
  RETURN QUERY EXECUTE
  'SELECT pallet_no, quantity, location
   FROM record_palletinfo
   WHERE product_code = $1
   ORDER BY created_at DESC
   LIMIT 100'
  USING p_product_code;
END;
$$ LANGUAGE plpgsql;

-- 批量操作優化
CREATE OR REPLACE FUNCTION batch_update_pallets(
  p_updates JSONB
) RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  -- 使用 UNNEST 批量更新
  WITH updates AS (
    SELECT
      (value->>'pallet_no')::TEXT as pallet_no,
      (value->>'quantity')::INTEGER as quantity,
      (value->>'location')::TEXT as location
    FROM jsonb_array_elements(p_updates) AS value
  )
  UPDATE record_palletinfo rp
  SET
    quantity = u.quantity,
    location = u.location,
    updated_at = NOW()
  FROM updates u
  WHERE rp.pallet_no = u.pallet_no;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;
```

## 數據清理策略
### 🧹 清理腳本
```sql
-- 清理重複數據
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_code, pallet_no
      ORDER BY created_at DESC
    ) as rn
  FROM record_palletinfo
)
DELETE FROM record_palletinfo
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 清理過期數據
DELETE FROM record_history
WHERE created_at < NOW() - INTERVAL '2 years';

-- 清理空值數據
UPDATE record_palletinfo
SET location = 'UNKNOWN'
WHERE location IS NULL OR location = '';

-- 數據歸檔
INSERT INTO record_palletinfo_archive
SELECT * FROM record_palletinfo
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM record_palletinfo
WHERE created_at < NOW() - INTERVAL '1 year';
```

### 📊 數據質量檢查
```sql
-- 數據一致性檢查
SELECT
  'record_palletinfo' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT product_code) as unique_products,
  COUNT(DISTINCT pallet_no) as unique_pallets,
  COUNT(*) FILTER (WHERE quantity <= 0) as invalid_quantities,
  COUNT(*) FILTER (WHERE location IS NULL) as null_locations
FROM record_palletinfo
UNION ALL
SELECT
  'record_inventory' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT product_code) as unique_products,
  0 as unique_pallets,
  COUNT(*) FILTER (WHERE quantity < 0) as invalid_quantities,
  COUNT(*) FILTER (WHERE location IS NULL) as null_locations
FROM record_inventory;
```

## 監控和維護
### 📈 性能監控
```sql
-- 創建性能監控視圖
CREATE VIEW db_performance_summary AS
SELECT
  'slow_queries' as metric,
  COUNT(*) as value
FROM pg_stat_statements
WHERE total_exec_time / calls > 100
UNION ALL
SELECT
  'unused_indexes' as metric,
  COUNT(*) as value
FROM pg_stat_user_indexes
WHERE idx_scan = 0
UNION ALL
SELECT
  'table_bloat' as metric,
  COUNT(*) as value
FROM pg_stat_user_tables
WHERE n_dead_tup > n_live_tup * 0.1;

-- 自動維護任務
CREATE OR REPLACE FUNCTION auto_maintenance()
RETURNS VOID AS $$
BEGIN
  -- 更新統計信息
  ANALYZE;

  -- 清理膨脹
  VACUUM (ANALYZE, VERBOSE);

  -- 重建索引 (如果需要)
  IF EXISTS (
    SELECT 1 FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'Found unused indexes, consider dropping them';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## 檢查命令
```bash
# 資料庫性能檢查
npm run db:analyze

# 慢查詢分析
npm run db:slow-queries

# 索引使用分析
npm run db:index-usage

# 數據完整性檢查
npm run db:integrity-check
```

## 報告輸出路徑
`docs/cleanup/database-cleanup-v[X.X.X].md`

---

**清理焦點**: 查詢優化 + 索引管理 + 數據完整性
**目標改善**: 查詢速度提升60%，索引命中率>95%，數據一致性100%
