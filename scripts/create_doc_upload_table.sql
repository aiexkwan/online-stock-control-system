-- Create doc_upload table for tracking all document uploads
-- 建立 doc_upload 表來追蹤所有文檔上傳記錄

-- Drop table if exists (be careful in production!)
-- DROP TABLE IF EXISTS doc_upload;

-- Create the doc_upload table
CREATE TABLE IF NOT EXISTS doc_upload (
    -- Primary key using UUID for better distributed systems compatibility
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Auto-incrementing ID for easier reference
    id SERIAL UNIQUE NOT NULL,
    
    -- Document name (required)
    doc_name VARCHAR(255) NOT NULL,
    
    -- Who uploaded the document (foreign key to data_id table)
    upload_by INTEGER NOT NULL,
    
    -- Document type: 'image' for stock pictures, 'spec' for product specs, 'order' for order PDFs
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('image', 'spec', 'order')),
    
    -- Full public URL of the document
    doc_url TEXT,
    
    -- File size in bytes
    file_size BIGINT,
    
    -- Storage folder/bucket path
    folder VARCHAR(100),
    
    -- Timestamp when the document was uploaded
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Optional: Last updated timestamp
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional: Soft delete flag
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Optional: Additional metadata as JSON
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Foreign key constraint (assuming data_id table exists)
    CONSTRAINT fk_upload_by FOREIGN KEY (upload_by) REFERENCES data_id(id) ON DELETE RESTRICT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_doc_upload_created_at ON doc_upload(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_upload_upload_by ON doc_upload(upload_by);
CREATE INDEX IF NOT EXISTS idx_doc_upload_doc_type ON doc_upload(doc_type);
CREATE INDEX IF NOT EXISTS idx_doc_upload_is_deleted ON doc_upload(is_deleted);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_doc_upload_type_created ON doc_upload(doc_type, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE doc_upload IS 'Table to track all document uploads including images, specs, and order PDFs';
COMMENT ON COLUMN doc_upload.uuid IS 'Unique identifier for the upload record';
COMMENT ON COLUMN doc_upload.id IS 'Sequential ID for easier reference';
COMMENT ON COLUMN doc_upload.doc_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN doc_upload.upload_by IS 'User ID who uploaded the document (references data_id table)';
COMMENT ON COLUMN doc_upload.doc_type IS 'Type of document: image, spec, or order';
COMMENT ON COLUMN doc_upload.doc_url IS 'Full public URL to access the document';
COMMENT ON COLUMN doc_upload.file_size IS 'File size in bytes';
COMMENT ON COLUMN doc_upload.folder IS 'Storage folder or bucket path';
COMMENT ON COLUMN doc_upload.created_at IS 'Timestamp when the document was uploaded';
COMMENT ON COLUMN doc_upload.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN doc_upload.is_deleted IS 'Soft delete flag (true = deleted, false = active)';
COMMENT ON COLUMN doc_upload.metadata IS 'Additional metadata in JSON format';

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_doc_upload_updated_at 
    BEFORE UPDATE ON doc_upload 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your needs)
-- GRANT SELECT ON doc_upload TO authenticated;
-- GRANT INSERT ON doc_upload TO authenticated;
-- GRANT UPDATE ON doc_upload TO authenticated;

-- Row Level Security (RLS) - uncomment and adjust based on your needs
-- ALTER TABLE doc_upload ENABLE ROW LEVEL SECURITY;

-- Example RLS policies
-- -- Users can view all uploads
-- CREATE POLICY "Users can view all uploads" ON doc_upload
--     FOR SELECT
--     TO authenticated
--     USING (true);

-- -- Users can only insert their own uploads
-- CREATE POLICY "Users can insert their own uploads" ON doc_upload
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.uid()::text = (SELECT email FROM data_id WHERE id = upload_by));

-- -- Users can only update their own uploads
-- CREATE POLICY "Users can update their own uploads" ON doc_upload
--     FOR UPDATE
--     TO authenticated
--     USING (auth.uid()::text = (SELECT email FROM data_id WHERE id = upload_by));

-- Sample insert for testing (comment out in production)
-- INSERT INTO doc_upload (doc_name, upload_by, doc_type, doc_url, file_size, folder)
-- VALUES 
--     ('test-product-spec.pdf', 1, 'spec', 'https://example.com/test.pdf', 1024000, 'productSpec'),
--     ('stock-image-001.jpg', 1, 'image', 'https://example.com/image.jpg', 512000, 'stockPic'),
--     ('order-12345.pdf', 1, 'order', 'https://example.com/order.pdf', 2048000, 'orderpdf');