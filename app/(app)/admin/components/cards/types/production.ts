// Production and quality control related types

// QCLabelCard types
export interface QCLabelCardProps {
  className?: string;
  onPrintComplete?: (data: any) => void;
  defaultProduct?: string;
}

// GRNLabelCard types
export interface GrnProductInfo {
  pallet_id: string;
  pallet_barcode: string;
  grn_ref: string;
  supplier?: string;
  material?: string;
  material_code?: string;
  description?: string;
  qty?: number;
  gross_weight?: number;
  net_weight?: number;
  package_type?: string;
  pallet_type?: string;
  created_at?: string;
  created_by?: string;
  status?: string;
  location?: string;
  batch?: string;
  expiry_date?: string;
  production_date?: string;
  qc_status?: string;
  qc_date?: string;
  qc_by?: string;
  qc_notes?: string;
  supplier_invoice?: string;
  purchase_order?: string;
  delivery_note?: string;
  container_number?: string;
  seal_number?: string;
  temperature?: string;
  humidity?: string;
  storage_conditions?: string;
  special_instructions?: string;
  country_of_origin?: string;
  customs_declaration?: string;
  hs_code?: string;
  certificate_number?: string;
  lot_number?: string;
  revision?: string;
  shelf_life?: string;
  retest_date?: string;
}

export interface GRNLabelCardProps {
  className?: string;
  onGenerateComplete?: (data: GrnProductInfo[]) => void;
  defaultGrnRef?: string;
}

// OrderLoadCard types
export interface OrderLoadCardProps {
  className?: string;
  onLoadComplete?: (orders: any[]) => void;
  initialOrders?: any[];
}

