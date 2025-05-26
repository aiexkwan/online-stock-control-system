// Shared types for QC Label Form components

export interface ProductInfo {
  code: string;
  description: string;
  standard_qty: string;
  type: string;
}

export interface SlateDetail {
  firstOffDate: string;
  batchNumber: string;
  setterName: string;
  material: string;
  weight: string;
  topThickness: string;
  bottomThickness: string;
  length: string;
  width: string;
  centreHole: string;
  colour: string;
  shapes: string;
  flameTest: string;
  remark: string;
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
  
  // Loading states
  isLoading: boolean;
  acoSearchLoading: boolean;
  
  // Error states
  productError: string | null;
  acoOrderDetailErrors: string[];
  
  // Other states
  acoRemain: string | null;
  availableFirstOffDates: string[];
  availableAcoOrderRefs: number[];
}

export interface FormValidation {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
} 