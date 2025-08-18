/**
 * Order Data Extraction Types
 * Unified type definitions for PDF order data extraction
 */

export interface ExtractedOrderItem {
  order_ref: string;
  account_num: string;
  delivery_add: string;
  invoice_to: string;
  customer_ref?: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  weight?: number;
  unit_price?: string;
  // Data quality fields
  is_valid?: boolean;
  was_corrected?: boolean;
  original_code?: string;
  confidence_score?: number;
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedOrderItem[];
  order_ref: string;
  recordCount: number;
  fileName: string;
  extractedAt: Date;
  error?: string;
}

export interface ExtractionSummary {
  totalItems: number;
  uniqueProducts: number;
  totalQuantity: number;
  dataQuality: {
    complete: number;
    corrected: number;
    lowConfidence: number;
  };
}

export interface DataExtractionOverlayState {
  isOpen: boolean;
  data: ExtractedOrderItem[];
  summary: ExtractionSummary;
  fileName: string;
  orderRef: string;
  loading?: boolean;
  error?: string;
}