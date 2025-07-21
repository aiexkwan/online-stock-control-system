-- Create print_history table for tracking all print jobs
CREATE TABLE IF NOT EXISTS print_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'qc-label', 'grn-label', 'transaction-report', etc.
  data JSONB, -- Store print data for potential reprint
  options JSONB, -- Print options (copies, paper size, etc.)
  metadata JSONB, -- Additional metadata (user, source, etc.)
  result JSONB, -- Print result details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_print_history_job_id ON print_history (job_id);
CREATE INDEX IF NOT EXISTS idx_print_history_type ON print_history (type);
CREATE INDEX IF NOT EXISTS idx_print_history_created_at ON print_history (created_at);
CREATE INDEX IF NOT EXISTS idx_print_history_metadata_user ON print_history ((metadata->>'userId'));

-- Add comments for documentation
COMMENT ON TABLE print_history IS 'Stores history of all print jobs for auditing and reprinting';
COMMENT ON COLUMN print_history.job_id IS 'Unique identifier for the print job';
COMMENT ON COLUMN print_history.type IS 'Type of document printed';
COMMENT ON COLUMN print_history.data IS 'Print data stored for potential reprinting';
COMMENT ON COLUMN print_history.options IS 'Print options like copies, paper size, orientation';
COMMENT ON COLUMN print_history.metadata IS 'Additional metadata including user ID, source, etc.';
COMMENT ON COLUMN print_history.result IS 'Result of the print job including success status and any errors';

-- Optional: Add RLS policies if needed
ALTER TABLE print_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own print history
CREATE POLICY "Users can view own print history" ON print_history
  FOR SELECT
  USING (metadata->>'userId' = auth.uid()::text);

-- Policy: Service role can insert print history
CREATE POLICY "Service can insert print history" ON print_history
  FOR INSERT
  WITH CHECK (true);
