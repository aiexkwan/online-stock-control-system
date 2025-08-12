// Admin-specific types for QC Label Card
// Simplified version without manual ACO order entry
import type { Product } from '@/types/generated/graphql';

// Backward compatible ProductInfo interface
export interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

// Helper function to convert GraphQL Product to ProductInfo
export function productToProductInfo(product: Product): ProductInfo {
  return {
    code: product.code,
    description: product.description,
    standard_qty: product.standardQty?.toString() || '1',
    type: product.type || 'Unknown',
    remark: '-', // GraphQL schema doesn't have remark field
  };
}

export interface SlateDetail {
  batchNumber: string;
}

export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

export interface PdfProgress {
  current: number;
  total: number;
  status: ProgressStatus[];
}

// Simplified FormData for admin - no manual ACO order details
export interface AdminFormData {
  productCode: string;
  productInfo: ProductInfo | null;
  quantity: string;
  count: string;
  operator: string;
  userId: string;

  // ACO specific - only reference selection
  acoOrderRef: string;
  acoRemain: number | null;
  availableAcoOrders: string[];
  
  // Slate specific
  slateDetail: SlateDetail;

  // Progress tracking
  pdfProgress: PdfProgress;

  // Loading states
  isLoading: boolean;
  acoSearchLoading: boolean;
  productError: string | null;
  acoOrdersLoading: boolean;
  
  // Index signature for dynamic property access
  [key: string]: unknown;
}

// Types are already exported above, no need to re-export