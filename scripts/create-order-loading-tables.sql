-- Create table to track loaded pallets for each order
CREATE TABLE IF NOT EXISTS public.order_loaded_pallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_ref TEXT NOT NULL,
    pallet_number TEXT NOT NULL,
    product_code TEXT NOT NULL,
    loaded_qty BIGINT NOT NULL,
    loaded_by TEXT,
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_ref, pallet_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_loaded_pallets_order_ref ON public.order_loaded_pallets(order_ref);
CREATE INDEX IF NOT EXISTS idx_order_loaded_pallets_pallet_number ON public.order_loaded_pallets(pallet_number);

-- Add RLS policies
ALTER TABLE public.order_loaded_pallets ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read and insert
CREATE POLICY "Authenticated users can read and insert order loaded pallets" 
ON public.order_loaded_pallets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.order_loaded_pallets TO authenticated;
GRANT ALL ON public.order_loaded_pallets TO service_role;