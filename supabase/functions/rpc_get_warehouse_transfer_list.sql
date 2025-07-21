/**
 * RPC Function: Get Warehouse Transfer List
 * 用於 WarehouseTransferListWidget 的優化查詢
 *
 * 功能：
 * - 獲取倉庫部門的轉移記錄清單
 * - 服務器端 JOIN record_transfer 和 data_id 表
 * - 過濾 department = 'Warehouse' 的操作員
 * - 支援日期範圍和分頁參數
 * - 返回格式化的結果
 *
 * 參數：
 * - p_start_date: 開始日期
 * - p_end_date: 結束日期
 * - p_limit: 返回記錄數量限制 (默認50)
 * - p_offset: 分頁偏移量 (默認0)
 *
 * 返回：格式化的倉庫轉移記錄清單
 */

CREATE OR REPLACE FUNCTION rpc_get_warehouse_transfer_list(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    tran_date TIMESTAMPTZ,
    plt_num TEXT,
    operator_name TEXT,
    operator_id INTEGER,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_execution_start TIMESTAMPTZ := clock_timestamp();
    v_total_count BIGINT;
BEGIN
    -- 參數驗證和默認值設置
    v_start_time := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '1 day');
    v_end_time := COALESCE(p_end_date, CURRENT_DATE);

    -- 驗證時間範圍
    IF v_start_time >= v_end_time THEN
        RAISE EXCEPTION 'Start time must be before end time';
    END IF;

    -- 設置合理的限制
    p_limit := GREATEST(1, LEAST(COALESCE(p_limit, 50), 200)); -- 最多200筆
    p_offset := GREATEST(0, COALESCE(p_offset, 0));

    -- 先獲取總數量
    SELECT COUNT(*) INTO v_total_count
    FROM record_transfer rt
    INNER JOIN data_id di ON rt.operator_id = di.id
    WHERE rt.tran_date >= v_start_time
      AND rt.tran_date <= v_end_time
      AND di.department = 'Warehouse'
      AND rt.plt_num IS NOT NULL;

    -- 返回分頁結果
    RETURN QUERY
    SELECT
        rt.tran_date,
        rt.plt_num,
        COALESCE(di.name, 'Unknown') as operator_name,
        rt.operator_id,
        v_total_count as total_count
    FROM record_transfer rt
    INNER JOIN data_id di ON rt.operator_id = di.id
    WHERE rt.tran_date >= v_start_time
      AND rt.tran_date <= v_end_time
      AND di.department = 'Warehouse'
      AND rt.plt_num IS NOT NULL
    ORDER BY rt.tran_date DESC
    LIMIT p_limit
    OFFSET p_offset;

EXCEPTION WHEN OTHERS THEN
    -- 錯誤處理：返回空結果
    RAISE NOTICE 'Error in rpc_get_warehouse_transfer_list: %', SQLERRM;
    RETURN;
END;
$$;

-- 添加函數註釋
COMMENT ON FUNCTION rpc_get_warehouse_transfer_list IS
'Get warehouse department transfer list with server-side JOIN and filtering. Optimized for WarehouseTransferListWidget with pagination support.';

-- 設置函數權限
GRANT EXECUTE ON FUNCTION rpc_get_warehouse_transfer_list TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_warehouse_transfer_list TO service_role;

-- 創建優化索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_record_transfer_date_operator
ON record_transfer(tran_date DESC, operator_id)
WHERE tran_date IS NOT NULL AND plt_num IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_id_department
ON data_id(department, id)
WHERE department IS NOT NULL;

-- 複合索引優化 JOIN 查詢
CREATE INDEX IF NOT EXISTS idx_record_transfer_warehouse_optimized
ON record_transfer(tran_date DESC, plt_num, operator_id)
WHERE tran_date IS NOT NULL AND plt_num IS NOT NULL;

COMMENT ON INDEX idx_record_transfer_warehouse_optimized IS
'Optimized compound index for warehouse transfer list queries with date ordering';
