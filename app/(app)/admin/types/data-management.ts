// Data management related types

// Void operation types
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
  palletInfo?: PalletInfo;
  password?: string;
  damageQuantity?: number;
}

export interface VoidResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  processedBy?: string;
  remainingQty?: number;
  requiresReprint?: boolean;
}

export interface BatchItem {
  id: string;
  palletId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: VoidResult;
  selected: boolean;
  palletInfo?: PalletInfo;
  product_code?: string;
  product_qty?: number;
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
  onExecute?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
}

export interface UploadConfiguration {
  maxFileSize?: number;
  acceptedFormats?: string[];
  allowMultiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  dropzoneText?: string;
  dropzoneSubtext?: string;
  showFileList?: boolean;
  autoUpload?: boolean;
}

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
}

export interface UploadRecord {
  id: string;
  file: UploadFile;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface DocUploadRecord extends UploadRecord {
  uuid: string;
  doc_name: string;
  upload_by: string;
  created_at: string;
  doc_url: string;
  doc_type: string;
  upload_by_name?: string;
  documentType?: string;
  department?: string;
}

export interface UploadCenterCardProps {
  onUpload?: (files: File[]) => Promise<void>;
  configuration?: UploadConfiguration;
  className?: string;
  title?: string;
  description?: string;
  height?: string | number;
  isEditMode?: boolean;
}

export interface UploadToastState {
  isOpen: boolean;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface VoidPalletCardProps {
  className?: string;
  title?: string;
  onVoidComplete?: (palletId: string, result: VoidResult) => void;
  initialPalletId?: string;
  mode?: VoidMode;
  isEditMode?: boolean;
}