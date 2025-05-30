// Void Pallet System Type Definitions

export interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  series?: string;
  plt_remark: string | null;
  plt_loc: string | null;
  creation_date?: string;
  user_id?: number;
}

export interface SearchParams {
  searchValue: string;
  searchType: 'qr' | 'pallet_num';
}

export interface SearchResult {
  success: boolean;
  data?: PalletInfo;
  error?: string;
}

export interface VoidParams {
  palletInfo: PalletInfo;
  voidReason: string;
  password: string;
  damageQuantity?: number;
}

export interface VoidResult {
  success: boolean;
  message?: string;
  error?: string;
  remainingQty?: number;
  actual_original_location?: string | null;
  requiresReprint?: boolean;
  reprintInfo?: ReprintInfo;
}

export interface ReprintInfo {
  product_code: string;
  quantity: number;
  original_plt_num: string;
  source_action: string;
  target_location?: string | null;
  reason: string;
}

export interface VoidReason {
  value: string;
  label: string;
  allowsReprint: boolean;
  requiresDamageQty: boolean;
}

export interface ErrorState {
  type: 'search' | 'void' | 'system' | 'validation';
  message: string;
  details?: string;
  isBlocking: boolean;
  timestamp: Date;
}

export interface VoidPalletState {
  // Search state
  searchInput: string;
  searchType: 'qr' | 'pallet_num';
  isSearching: boolean;
  
  // Pallet information
  foundPallet: PalletInfo | null;
  
  // Void process
  voidReason: string;
  damageQuantity: number;
  password: string;
  isProcessing: boolean;
  
  // Error handling
  error: ErrorState | null;
  
  // UI state
  showScanner: boolean;
  showConfirmDialog: boolean;
  showReprintDialog: boolean;
  isInputDisabled: boolean;
  
  // Enhanced reprint flow
  showReprintInfoDialog: boolean;
  reprintInfo: ReprintInfoInput | null;
  isAutoReprinting: boolean;
}

export interface HistoryRecord {
  time: string;
  id: number;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string | null;
}

// Constants definition
export const VOID_REASONS: VoidReason[] = [
  { 
    value: "Print Extra Label", 
    label: "Print Extra Label", 
    allowsReprint: false, 
    requiresDamageQty: false 
  },
  { 
    value: "Wrong Label", 
    label: "Wrong Label", 
    allowsReprint: true, 
    requiresDamageQty: false 
  },
  { 
    value: "Wrong Qty", 
    label: "Wrong Qty", 
    allowsReprint: true, 
    requiresDamageQty: false 
  },
  { 
    value: "Wrong Product Code", 
    label: "Wrong Product Code", 
    allowsReprint: true, 
    requiresDamageQty: false 
  },
  { 
    value: "Damage", 
    label: "Damage", 
    allowsReprint: true, 
    requiresDamageQty: true 
  },
  { 
    value: "Used Material", 
    label: "Used Material", 
    allowsReprint: false, 
    requiresDamageQty: false 
  },
  { 
    value: "Other", 
    label: "Other (Specify if possible)", 
    allowsReprint: false, 
    requiresDamageQty: false 
  },
];

export const SEARCH_TYPES = {
  QR: 'qr' as const,
  PALLET_NUM: 'pallet_num' as const,
};

export const ERROR_TYPES = {
  SEARCH: 'search' as const,
  VOID: 'void' as const,
  SYSTEM: 'system' as const,
  VALIDATION: 'validation' as const,
} as const; 

// New interfaces for enhanced reprint flow
export interface ReprintInfoInput {
  type: 'damage' | 'wrong_qty' | 'wrong_code';
  originalPalletInfo: PalletInfo;
  // For damage: remainingQty is calculated
  // For wrong_qty: user inputs correct quantity
  // For wrong_code: user inputs correct product code
  correctedQuantity?: number;
  correctedProductCode?: string;
  remainingQuantity?: number; // For damage cases
}

export interface AutoReprintParams {
  productCode: string;
  quantity: number;
  originalPltNum: string;
  sourceAction: string;
  targetLocation?: string;
  reason: string;
  operatorClockNum: string;
  // Auto-generated fields
  description?: string;
  date: string;
  qcClockNum: string;
  workOrderNumber: string;
  palletNum: string;
  qrValue: string;
}

export interface AutoReprintResult {
  success: boolean;
  message?: string;
  error?: string;
  pdfUrl?: string;
  newPalletNum?: string;
} 