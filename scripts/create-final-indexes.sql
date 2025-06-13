-- =====================================================
-- 創建所有缺少的索引（完全正確版本）
-- =====================================================
-- 基於實際確認的表結構
-- =====================================================

-- 1. query_record 索引（欄位：user, created_at, token）
\echo '1. Creating query_record indexes...'
CREATE INDEX IF NOT EXISTS idx_query_record_user ON query_record("user");
CREATE INDEX IF NOT EXISTS idx_query_record_created_at ON query_record(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_record_token ON query_record(token DESC);
CREATE INDEX IF NOT EXISTS idx_query_record_user_time ON query_record("user", created_at DESC);

-- 2. data_code 索引（欄位：code, description）
\echo '2. Creating data_code indexes...'
CREATE INDEX IF NOT EXISTS idx_data_code_code ON data_code(code);
CREATE INDEX IF NOT EXISTS idx_data_code_description ON data_code(description);
CREATE INDEX IF NOT EXISTS idx_data_code_search ON data_code(code, description);

-- 3. data_supplier 索引（欄位：supplier_code, supplier_name）
\echo '3. Creating data_supplier indexes...'
CREATE INDEX IF NOT EXISTS idx_supplier_code ON data_supplier(supplier_code);
CREATE INDEX IF NOT EXISTS idx_supplier_name ON data_supplier(supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_analysis ON data_supplier(supplier_code, supplier_name);

-- 4. work_level 索引（欄位：id, latest_update, qc, move, grn）
\echo '4. Creating work_level indexes...'
CREATE INDEX IF NOT EXISTS idx_work_level_id ON work_level(id);
CREATE INDEX IF NOT EXISTS idx_work_level_latest_update ON work_level(latest_update DESC);

-- 5. grn_level 索引（欄位：grn_ref, latest_update）
\echo '5. Creating grn_level indexes...'
CREATE INDEX IF NOT EXISTS idx_grn_level_grn_ref ON grn_level(grn_ref);
CREATE INDEX IF NOT EXISTS idx_grn_level_latest_update ON grn_level(latest_update DESC);

-- 6. order_loading_history 索引（欄位：order_ref, pallet_num, product_code, action_time）
\echo '6. Creating order_loading_history indexes...'
CREATE INDEX IF NOT EXISTS idx_order_loading_order_ref ON order_loading_history(order_ref);
CREATE INDEX IF NOT EXISTS idx_order_loading_pallet_num ON order_loading_history(pallet_num);
CREATE INDEX IF NOT EXISTS idx_order_loading_action_time ON order_loading_history(action_time DESC);
CREATE INDEX IF NOT EXISTS idx_order_loading_order_product ON order_loading_history(order_ref, product_code);
CREATE INDEX IF NOT EXISTS idx_order_loading_time_order ON order_loading_history(action_time DESC, order_ref);

-- 7. record_transfer 索引
\echo '7. Creating record_transfer indexes...'
CREATE INDEX IF NOT EXISTS idx_transfer_plt_num ON record_transfer(plt_num);
CREATE INDEX IF NOT EXISTS idx_transfer_tran_date ON record_transfer(tran_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_operator ON record_transfer(operator_id);

-- 8. report_void 索引
\echo '8. Creating report_void indexes...'
CREATE INDEX IF NOT EXISTS idx_report_void_time ON report_void(time DESC);
CREATE INDEX IF NOT EXISTS idx_report_void_plt_num ON report_void(plt_num);

-- 9. debug_log 索引
\echo '9. Creating debug_log indexes...'
CREATE INDEX IF NOT EXISTS idx_debug_log_ts ON debug_log(ts DESC);

-- =====================================================
-- 驗證索引創建結果
-- =====================================================
\echo ''
\echo '===== 索引創建完成，檢查結果 ====='
\echo ''

-- 顯示更新後的索引數量
SELECT 
    tablename,
    COUNT(*) as index_count,
    STRING_AGG(indexname, ', ' ORDER BY indexname) as index_names
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'query_record', 'data_code', 'data_supplier', 
    'work_level', 'grn_level', 'order_loading_history',
    'record_transfer', 'report_void', 'debug_log'
)
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 更新統計信息
-- =====================================================
\echo ''
\echo '===== 更新表統計信息 ====='

ANALYZE query_record;
ANALYZE data_code;
ANALYZE data_supplier;
ANALYZE work_level;
ANALYZE grn_level;
ANALYZE order_loading_history;
ANALYZE record_transfer;
ANALYZE report_void;
ANALYZE debug_log;

\echo ''
\echo '===== 所有索引創建和優化完成！====='