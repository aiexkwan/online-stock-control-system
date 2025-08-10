// Inventory management types actually used by VoidPalletCard

// VoidPalletCard types
export type VoidMode = 'single' | 'batch';
export type VoidStep = 'search' | 'confirm' | 'result';

export interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_loc?: string;
  plt_remark?: string;
  description?: string;
  type?: string;
  generate_time?: string;
}

export interface VoidParams {
  palletId?: string;
  voidType?: string;
  voidReason: string;
  voidQty?: number;
  description?: string;
  removePallet?: boolean;
  removeStandardQty?: boolean;
  removeNonStandardQty?: boolean;
  user?: string;
  timestamp?: string;
}

export interface VoidResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp?: string;
  processedBy?: string;
}

export interface BatchItem {
  id: string;
  palletId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: VoidResult;
  selected: boolean;
}

export interface InventoryRecord {
  id: number;
  pallet_id: string;
  material: string;
  batch: string;
  qty: number;
  status: string;
  created_at: string;
  updated_at: string;
  location: string;
  supplier?: string;
  grn_ref?: string;
}

export interface OperationChildProps {
  onVoidComplete: (palletId: string, result: VoidResult) => void;
  onError: (error: Error) => void;
  initialPalletId?: string;
  mode?: VoidMode;
}

export interface VoidPalletCardProps {
  className?: string;
  title?: string;
  onVoidComplete?: (palletId: string, result: VoidResult) => void;
  initialPalletId?: string;
  mode?: VoidMode;
}

// Constants
export const VOID_REASONS = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Quality Issue', label: 'Quality Issue' },
  { value: 'Wrong Item', label: 'Wrong Item' },
  { value: 'Lost', label: 'Lost' },
  { value: 'System Error', label: 'System Error' },
  { value: 'Other', label: 'Other' }
] as const;