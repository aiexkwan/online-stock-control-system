-- RPC function for loading other files list (non-order documents)
-- 支援服務器端 JOIN 和篩選

CREATE OR REPLACE FUNCTION rpc_get_other_files_list(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_result JSONB;
    v_files JSONB[];
    v_total_count INTEGER;
    v_query_time_ms INTEGER;
BEGIN
    -- 獲取總數
    SELECT COUNT(*)
    INTO v_total_count
    FROM doc_upload
    WHERE doc_type != 'order' OR doc_type IS NULL;
    
    -- 獲取文件列表並 JOIN 用戶名稱
    SELECT ARRAY(
        SELECT jsonb_build_object(
            'uuid', d.uuid,
            'doc_name', d.doc_name,
            'upload_by', d.upload_by,
            'created_at', d.created_at,
            'doc_type', d.doc_type,
            'uploader_name', COALESCE(u.name, 'User ' || d.upload_by::TEXT),
            'uploader_id', d.upload_by
        )
        FROM doc_upload d
        LEFT JOIN data_id u ON u.id = d.upload_by::INTEGER
        WHERE d.doc_type != 'order' OR d.doc_type IS NULL
        ORDER BY d.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    INTO v_files;
    
    -- 計算查詢時間
    v_query_time_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER;
    
    -- 構建返回結果
    v_result := jsonb_build_object(
        'files', COALESCE(v_files, ARRAY[]::JSONB[]),
        'total_count', v_total_count,
        'has_more', v_total_count > (p_offset + p_limit),
        'limit', p_limit,
        'offset', p_offset,
        'query_time', v_query_time_ms || 'ms',
        'performance_ms', v_query_time_ms,
        'performance', jsonb_build_object(
            'total_time_ms', v_query_time_ms,
            'optimized', true,
            'joins', 1,
            'filters', 1
        )
    );
    
    RETURN v_result;
END;
$$;

-- 創建索引以優化查詢
CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_type_created ON doc_upload(doc_type, created_at DESC) 
WHERE doc_type != 'order' OR doc_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_doc_upload_upload_by ON doc_upload(upload_by);

-- 授權
GRANT EXECUTE ON FUNCTION rpc_get_other_files_list TO authenticated;