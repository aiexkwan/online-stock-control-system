/**
 * Void Pallet Domain Type Definitions
 * Business logic types for the void pallet system
 */

// Core pallet information
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

// Search functionality
export interface SearchParams {
  searchValue: string;
  searchType: 'qr' | 'pallet_num';
}

export interface SearchResult {
  success: boolean;
  data?: PalletInfo;
  error?: string;
}

// Void process
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

// Reprint functionality
export interface ReprintInfo {
  product_code: string;
  quantity: number;
  original_plt_num: string;
  source_action: string;
  target_location?: string | null;
  reason: string;
}

export interface ReprintInfoInput {
  type: 'damage' | 'wrong_qty' | 'wrong_code' | 'wrong_label';
  originalPalletInfo: PalletInfo;
  remainingQuantity?: number;
  correctedQuantity?: number;
  correctedProductCode?: string;
}

// Configuration and constants
export interface VoidReasonConfig {
  value: string;
  label: string;
  allowsReprint: boolean;
  requiresDamageQty: boolean;
}

// Error handling
export interface ErrorState {
  type: 'search' | 'void' | 'system' | 'validation';
  message: string;
  details?: string;
  isBlocking: boolean;
  timestamp: Date;
}

// Application state management
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
  isAutoReprinting: boolean;

  // Reprint flow
  reprintInfo?: ReprintInfoInput | null;
  showReprintInfoDialog: boolean;
}

// History tracking
export interface HistoryRecord {
  time: string;
  id: number;
  action: string;
  plt_num: string | null;
  loc: string | null;
  remark: string | null;
}

// Auto reprint functionality
export interface AutoReprintParams {
  productCode: string;
  quantity: number;
  originalPltNum: string;
  sourceAction: string;
  targetLocation?: string;
  reason: string;
  operatorClockNum: string;
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

// Constant types
export type SearchType = 'qr' | 'pallet_num';
export type ErrorType = 'search' | 'void' | 'system' | 'validation';
