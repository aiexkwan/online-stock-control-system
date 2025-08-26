-- Enable vector extension
-- CREATE EXTENSION IF NOT EXISTS vector;

-- --------------------------------------------------
-- Function: match_context_summaries_with_metadata
-- Description: Finds context summaries similar to a query embedding and returns full metadata.
-- --------------------------------------------------

-- Drop the function if it already exists to ensure a clean update
DROP FUNCTION IF EXISTS match_context_summaries_with_metadata(vector, double precision, integer);

-- Create the new function
CREATE OR REPLACE FUNCTION match_context_summaries_with_metadata(
  query_embedding vector(1536), -- Corresponds to OpenAI's text-embedding-3-small model
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  session_id text,
  content text,
  metadata jsonb,      -- The full JSON object of the summary
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    cs.session_id,
    cs.content,
    cs.metadata,
    1 - (cs.embedding <=> query_embedding) as similarity
  FROM
    context_summaries cs
  WHERE
    1 - (cs.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
$$;

-- Example Usage (from Supabase SQL Editor):
/*
SELECT * FROM match_context_summaries_with_metadata(
  (SELECT embedding FROM context_summaries LIMIT 1), -- Example embedding
  0.7,
  5
);
*/

