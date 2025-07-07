-- RPC function for HistoryTree widget
-- 獲取歷史記錄並在服務器端進行事件合併

-- Drop existing function if exists
DROP FUNCTION IF EXISTS rpc_get_history_tree(INTEGER, INTEGER);

-- Create the function
CREATE OR REPLACE FUNCTION rpc_get_history_tree(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_raw_events JSONB;
    v_merged_events JSONB = '[]'::JSONB;
    v_current_event JSONB;
    v_last_event JSONB;
    v_total_count BIGINT;
    v_merge_count INTEGER;
    v_performance_start TIMESTAMP;
    v_performance_end TIMESTAMP;
BEGIN
    v_performance_start := clock_timestamp();
    
    -- Get total count for pagination
    SELECT COUNT(*) INTO v_total_count FROM record_history;
    
    -- Fetch raw events with user names
    SELECT jsonb_agg(event_data ORDER BY time DESC)
    INTO v_raw_events
    FROM (
        SELECT jsonb_build_object(
            'id', rh.id,
            'time', rh.time,
            'action', rh.action,
            'plt_num', rh.plt_num,
            'loc', rh.loc,
            'remark', rh.remark,
            'user_id', rh.id,
            'user_name', COALESCE(di.name, 'Unknown User'),
            'doc_url', NULL
        ) as event_data
        FROM record_history rh
        LEFT JOIN data_id di ON di.worker_id = rh.id
        ORDER BY rh.time DESC
        LIMIT p_limit + 100  -- Fetch extra for merging
        OFFSET p_offset
    ) sub;
    
    -- If no events found
    IF v_raw_events IS NULL THEN
        v_performance_end := clock_timestamp();
        RETURN jsonb_build_object(
            'events', '[]'::JSONB,
            'total_count', 0,
            'merged_count', 0,
            'performance_ms', EXTRACT(MILLISECOND FROM (v_performance_end - v_performance_start))
        );
    END IF;
    
    -- Merge similar events (within 5 minutes, same action and user)
    v_merge_count := 0;
    v_last_event := NULL;
    
    FOR i IN 0..jsonb_array_length(v_raw_events) - 1 LOOP
        v_current_event := v_raw_events->i;
        
        -- Check if should merge with last event
        IF v_last_event IS NOT NULL AND
           v_current_event->>'action' = v_last_event->>'action' AND
           v_current_event->>'user_id' = v_last_event->>'user_id' AND
           ABS(EXTRACT(EPOCH FROM (
               (v_current_event->>'time')::TIMESTAMP - 
               (v_last_event->>'time')::TIMESTAMP
           ))) <= 300 -- 5 minutes in seconds
        THEN
            -- Merge: add current plt_num to merged list
            v_last_event := jsonb_set(
                v_last_event,
                '{merged_plt_nums}',
                COALESCE(v_last_event->'merged_plt_nums', '[]'::JSONB) || 
                jsonb_build_array(v_current_event->>'plt_num')
            );
            v_last_event := jsonb_set(
                v_last_event,
                '{merged_count}',
                to_jsonb(COALESCE((v_last_event->>'merged_count')::INTEGER, 1) + 1)
            );
            v_merge_count := v_merge_count + 1;
            
            -- Update the last event in the array
            v_merged_events := jsonb_set(
                v_merged_events,
                array[jsonb_array_length(v_merged_events) - 1]::TEXT[],
                v_last_event
            );
        ELSE
            -- New event group
            v_current_event := jsonb_set(
                v_current_event,
                '{merged_plt_nums}',
                jsonb_build_array(v_current_event->>'plt_num')
            );
            v_current_event := jsonb_set(
                v_current_event,
                '{merged_count}',
                '1'::JSONB
            );
            v_merged_events := v_merged_events || v_current_event;
            v_last_event := v_current_event;
        END IF;
        
        -- Stop if we have enough merged events
        IF jsonb_array_length(v_merged_events) >= p_limit THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Trim to requested limit
    IF jsonb_array_length(v_merged_events) > p_limit THEN
        SELECT jsonb_agg(elem)
        INTO v_merged_events
        FROM (
            SELECT jsonb_array_elements(v_merged_events) elem
            LIMIT p_limit
        ) sub;
    END IF;
    
    v_performance_end := clock_timestamp();
    
    -- Return result with metadata
    RETURN jsonb_build_object(
        'events', v_merged_events,
        'total_count', v_total_count,
        'merged_count', v_merge_count,
        'has_more', v_total_count > (p_offset + p_limit),
        'performance_ms', EXTRACT(MILLISECOND FROM (v_performance_end - v_performance_start)),
        'query_time', now()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'events', '[]'::JSONB,
            'total_count', 0
        );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rpc_get_history_tree(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_history_tree(INTEGER, INTEGER) TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_record_history_time_desc ON record_history(time DESC);
CREATE INDEX IF NOT EXISTS idx_record_history_id ON record_history(id);
CREATE INDEX IF NOT EXISTS idx_record_history_action ON record_history(action);
CREATE INDEX IF NOT EXISTS idx_record_history_composite ON record_history(time DESC, action, id);

-- Add comment
COMMENT ON FUNCTION rpc_get_history_tree IS 'Get history tree with server-side event merging for similar events within 5 minutes';