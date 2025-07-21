-- Simple version of doc_upload table creation
-- 簡化版本的 doc_upload 表建立腳本

-- Create the doc_upload table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS doc_upload (
    -- Primary key
    uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Document name
    doc_name VARCHAR(255) NOT NULL,

    -- Who uploaded (user ID from data_id table)
    upload_by INTEGER NOT NULL,

    -- Document type: 'image', 'spec', or 'order'
    doc_type VARCHAR(50),

    -- Document URL
    doc_url TEXT,

    -- File size in bytes
    file_size BIGINT,

    -- Storage folder
    folder VARCHAR(100),

    -- Upload timestamp
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doc_upload_created_at ON doc_upload(created_at DESC);
