-- ================================
-- RPC Function: rpc_get_pallet_reprint_info
-- Purpose: Optimized query for ReprintLabelWidget with product description JOIN
-- Author: Phase 3.2.1 Migration
-- Date: 2025-07-07
-- ================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.rpc_get_pallet_reprint_info;

-- Create optimized RPC function for pallet reprint
CREATE OR REPLACE FUNCTION public.rpc_get_pallet_reprint_info(
  p_pallet_num TEXT
)
RETURNS TABLE (
  plt_num TEXT,
  product_code TEXT,
  product_description TEXT,
  product_colour TEXT,
  product_qty BIGINT,
  pdf_url TEXT,
  series TEXT,
  plt_remark TEXT,
  generate_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rp.plt_num,
    rp.product_code,
    COALESCE(dc.description, 'Unknown Product') as product_description,
    COALESCE(dc.colour, 'Unknown') as product_colour,
    rp.product_qty,
    rp.pdf_url,
    rp.series,
    COALESCE(rp.plt_remark, '') as plt_remark,
    rp.generate_time
  FROM record_palletinfo rp
  LEFT JOIN data_code dc ON rp.product_code = dc.code
  WHERE rp.plt_num = UPPER(p_pallet_num)
  LIMIT 1;
END;
$$;

-- Create index for optimal performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_record_palletinfo_plt_num
  ON record_palletinfo(plt_num);

-- Create index for JOIN optimization
CREATE INDEX IF NOT EXISTS idx_data_code_code
  ON data_code(code);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_get_pallet_reprint_info TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_pallet_reprint_info TO service_role;

-- Add function comment
COMMENT ON FUNCTION public.rpc_get_pallet_reprint_info IS
'Optimized function to fetch pallet information for reprint functionality.
Returns pallet details with product description JOIN for enhanced user experience.
Used by ReprintLabelWidget for Phase 3.2.1 migration.';

-- Test query
-- SELECT * FROM rpc_get_pallet_reprint_info('TEST001');
