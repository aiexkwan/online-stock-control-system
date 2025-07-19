/**
 * Strategy 3: Supabase codegen - Void Pallet 數據庫類型定義
 * 基於 Supabase schema 生成的類型
 */

// 數據庫表結構類型
export interface VoidRecordDbRow {
  id: string;
  pallet_number: string;
  product_code: string;
  void_reason: string;
  notes?: string;
  operator_clock_num: string;
  timestamp: string;
  batch_id?: string;
  original_location?: string;
  quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface PalletInfoDbRow {
  id: string;
  pallet_number: string;
  product_code: string;
  location: string;
  quantity: number;
  status: 'active' | 'void' | 'transferred';
  lot_number?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductDataDbRow {
  product_code: string;
  description: string;
  type?: string;
  colour?: string;
  unit?: string;
  category?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

// 批量操作類型
export interface BatchVoidOperation {
  batch_id: string;
  operator_clock_num: string;
  void_reason: string;
  notes?: string;
  items: VoidBatchItem[];
  created_at: string;
}

export interface VoidBatchItem {
  pallet_number: string;
  product_code: string;
  original_location?: string;
  quantity?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
}

// Void 原因類型 (基於數據庫約束)
export type VoidReasonCode = 
  | 'damage'
  | 'expired'
  | 'quality'
  | 'contamination'
  | 'shortage'
  | 'overstock'
  | 'mislabel'
  | 'other';

export interface VoidReasonDefinition {
  code: VoidReasonCode;
  label: string;
  description?: string;
  requires_notes: boolean;
  color: string;
  icon?: string;
}

// 查詢結果類型
export interface VoidRecordWithDetails extends VoidRecordDbRow {
  pallet_info?: PalletInfoDbRow;
  product_data?: ProductDataDbRow;
}

export interface VoidOperationResult {
  success: boolean;
  pallet_number: string;
  error_message?: string;
  void_record_id?: string;
}

export interface BatchVoidResult {
  batch_id: string;
  total_items: number;
  successful_items: number;
  failed_items: number;
  results: VoidOperationResult[];
  completed_at: string;
}

// 統計類型
export interface VoidStatistics {
  today_count: number;
  week_count: number;
  month_count: number;
  top_reasons: Array<{
    reason: VoidReasonCode;
    count: number;
    percentage: number;
  }>;
  recent_operations: VoidRecordWithDetails[];
}

// RPC 函數參數類型
export interface VoidPalletRpcParams {
  p_pallet_number: string;
  p_void_reason: VoidReasonCode;
  p_operator_clock_num: string;
  p_notes?: string;
  p_batch_id?: string;
}

export interface BatchVoidRpcParams {
  p_batch_id: string;
  p_operator_clock_num: string;
  p_void_reason: VoidReasonCode;
  p_notes?: string;
  p_pallet_numbers: string[];
}

// 類型保護函數
export function isValidVoidRecord(record: unknown): record is VoidRecordDbRow {
  if (!record || typeof record !== 'object') return false;
  
  const r = record as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.pallet_number === 'string' &&
    typeof r.product_code === 'string' &&
    typeof r.void_reason === 'string' &&
    typeof r.operator_clock_num === 'string' &&
    typeof r.timestamp === 'string'
  );
}

export function isValidPalletInfo(info: unknown): info is PalletInfoDbRow {
  if (!info || typeof info !== 'object') return false;
  
  const p = info as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.pallet_number === 'string' &&
    typeof p.product_code === 'string' &&
    typeof p.location === 'string' &&
    typeof p.quantity === 'number' &&
    typeof p.status === 'string'
  );
}

export function isValidVoidReason(reason: unknown): reason is VoidReasonCode {
  const validReasons: VoidReasonCode[] = [
    'damage', 'expired', 'quality', 'contamination',
    'shortage', 'overstock', 'mislabel', 'other'
  ];
  return typeof reason === 'string' && validReasons.includes(reason as VoidReasonCode);
}

// 數據轉換器
export class VoidDataMapper {
  static transformVoidRecord(dbRecord: VoidRecordDbRow): VoidRecordWithDetails {
    if (!isValidVoidRecord(dbRecord)) {
      throw new Error('Invalid void record format');
    }
    return dbRecord;
  }

  static transformBatchItems(items: unknown[]): VoidBatchItem[] {
    return items
      .filter((item): item is Record<string, unknown> => 
        item !== null && typeof item === 'object'
      )
      .map(item => ({
        pallet_number: String(item.pallet_number || ''),
        product_code: String(item.product_code || ''),
        original_location: item.original_location ? String(item.original_location) : undefined,
        quantity: typeof item.quantity === 'number' ? item.quantity : undefined,
        status: this.validateStatus(item.status),
        error_message: item.error_message ? String(item.error_message) : undefined,
      }))
      .filter(item => item.pallet_number && item.product_code);
  }

  static validateStatus(status: unknown): VoidBatchItem['status'] {
    const validStatuses = ['pending', 'processing', 'completed', 'failed'];
    return validStatuses.includes(status as string) 
      ? status as VoidBatchItem['status'] 
      : 'pending';
  }

  static transformVoidReasons(reasons: unknown[]): VoidReasonDefinition[] {
    return reasons
      .filter((reason): reason is Record<string, unknown> => 
        reason !== null && typeof reason === 'object'
      )
      .map(reason => ({
        code: this.validateVoidReasonCode(reason.code),
        label: String(reason.label || ''),
        description: reason.description ? String(reason.description) : undefined,
        requires_notes: Boolean(reason.requires_notes),
        color: String(reason.color || '#6B7280'),
        icon: reason.icon ? String(reason.icon) : undefined,
      }))
      .filter(reason => reason.code && reason.label);
  }

  static validateVoidReasonCode(code: unknown): VoidReasonCode {
    return isValidVoidReason(code) ? code : 'other';
  }

  static createBatchVoidParams(
    batchId: string,
    operatorClockNum: string,
    voidReason: VoidReasonCode,
    palletNumbers: string[],
    notes?: string
  ): BatchVoidRpcParams {
    return {
      p_batch_id: batchId,
      p_operator_clock_num: operatorClockNum,
      p_void_reason: voidReason,
      p_notes: notes,
      p_pallet_numbers: palletNumbers.filter(pn => pn.trim().length > 0),
    };
  }
}