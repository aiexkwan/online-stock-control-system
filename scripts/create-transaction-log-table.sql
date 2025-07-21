-- 通用事務日誌表
-- 用於記錄所有模組的事務操作，支援回滾和審計
-- Date: 2025-07-02

-- 創建 update_updated_at_column 函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建通用事務日誌表
CREATE TABLE IF NOT EXISTS transaction_log (
  id SERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL,

  -- 事務來源識別
  source_module TEXT NOT NULL, -- 'grn_label', 'qc_label', 'inventory_transfer', etc.
  source_page TEXT NOT NULL,   -- '/print-grnlabel', '/qc-label', etc.
  source_action TEXT NOT NULL, -- 'create_label', 'bulk_process', 'transfer', etc.

  -- 事務基本信息
  operation_type TEXT NOT NULL,
  step_name TEXT,
  step_sequence INTEGER,       -- 步驟順序，便於回滾

  -- 用戶追蹤
  user_id TEXT NOT NULL,
  user_clock_number TEXT,
  session_id TEXT,

  -- 狀態追蹤
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'rolled_back'

  -- 數據快照
  pre_state JSONB,            -- 操作前狀態
  post_state JSONB,           -- 操作後狀態
  affected_records JSONB,     -- 受影響的記錄 IDs

  -- 錯誤處理
  error_code TEXT,
  error_message TEXT,
  error_details JSONB,
  error_stack TEXT,

  -- 回滾信息
  rollback_attempted BOOLEAN DEFAULT FALSE,
  rollback_successful BOOLEAN,
  rollback_timestamp TIMESTAMPTZ,
  rollback_by TEXT,           -- 誰執行了回滾
  rollback_reason TEXT,
  compensation_required BOOLEAN DEFAULT FALSE,
  compensation_actions JSONB,

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- 元數據
  metadata JSONB,             -- 額外的模組特定數據

  -- 關聯
  parent_transaction_id UUID, -- 支援嵌套事務
  related_transactions UUID[], -- 相關事務
  report_log_id UUID,         -- 關聯到 report_log 表

  -- 外鍵約束
  CONSTRAINT fk_report_log
    FOREIGN KEY (report_log_id)
    REFERENCES report_log(uuid)
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_transaction_log_id ON transaction_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_source ON transaction_log(source_module, source_action);
CREATE INDEX IF NOT EXISTS idx_transaction_log_status ON transaction_log(status);
CREATE INDEX IF NOT EXISTS idx_transaction_log_created ON transaction_log(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_log_user ON transaction_log(user_id);

-- 觸發器自動更新 updated_at
DROP TRIGGER IF EXISTS update_transaction_log_timestamp ON transaction_log;
CREATE TRIGGER update_transaction_log_timestamp
  BEFORE UPDATE ON transaction_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 創建整合視圖，方便查詢
CREATE OR REPLACE VIEW v_transaction_report AS
SELECT
  t.transaction_id,
  t.source_module,
  t.source_action,
  t.status,
  t.user_id,
  t.user_clock_number,
  t.created_at,
  t.error_message,
  t.metadata,
  r.uuid as report_log_uuid,
  r.error as report_error,
  r.error_info as report_error_info,
  r.state as report_state,
  r.time as report_time
FROM transaction_log t
LEFT JOIN report_log r ON t.report_log_id = r.uuid;

-- 授權
GRANT SELECT, INSERT, UPDATE ON transaction_log TO authenticated;
GRANT SELECT ON v_transaction_report TO authenticated;

-- 添加表註釋
COMMENT ON TABLE transaction_log IS '通用事務日誌表，記錄所有模組的事務操作，支援回滾和審計追蹤';
COMMENT ON COLUMN transaction_log.transaction_id IS '事務唯一標識符';
COMMENT ON COLUMN transaction_log.source_module IS '事務來源模組：grn_label, qc_label, inventory_transfer等';
COMMENT ON COLUMN transaction_log.status IS '事務狀態：pending, in_progress, completed, failed, rolled_back';
COMMENT ON COLUMN transaction_log.report_log_id IS '關聯到report_log表的UUID，用於長期錯誤記錄';
