// Shared types for QC Label Form components

export interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
  remark?: string;
}

export interface SlateDetail {
  batchNumber: string;
}

export interface AcoOrderDetail {
  code: string;
  qty: string;
}

export type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

export interface PdfProgress {
  current: number;
  total: number;
  status: ProgressStatus[];
}

// 策略 2: DTO/自定義 type interface - 添加索引簽名以支持動態屬性訪問
export interface FormData {
  productCode: string;
  productInfo: ProductInfo | null;
  quantity: string;
  count: string;
  operator: string;
  userId: string;

  // ACO specific
  acoOrderRef: string;
  acoOrderDetails: AcoOrderDetail[];
  acoNewRef: boolean;
  acoNewProductCode: string;
  acoNewOrderQty: string;

  // Slate specific
  slateDetail: SlateDetail;

  // Progress tracking
  pdfProgress: PdfProgress;

  // 索引簽名支援動態屬性訪問和 Record<string, unknown> 兼容性
  [key: string]: unknown;

  // Loading states
  isLoading: boolean;
  acoSearchLoading: boolean;

  // Error states
  productError: string | null;
  acoOrderDetailErrors: string[];

  // Other states
  acoRemain: string | null;
  availableAcoOrderRefs: number[];
}

export interface FormValidation {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}
