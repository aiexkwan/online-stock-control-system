/**
 * 業務邏輯 Schema 定義 - 統一管理
 * 從 lib/types/business-schemas.ts 遷移
 */

import { z } from 'zod';

// ========== Void Pallet Schemas ==========

export const VoidReasonSchema = z.enum([
  'damage',
  'expired',
  'quality',
  'contamination',
  'shortage',
  'overstock',
  'mislabel',
  'other',
]);

export const VoidRecordSchema = z.object({
  uuid: z.string().min(1),
  plt_num: z.string().min(1),
  time: z.string().datetime(),
  reason: VoidReasonSchema,
  damage_qty: z.number().min(0).nullable(),
  product_code: z.string().optional(),
  product_qty: z.number().min(0).optional(),
  user_name: z.string().optional(),
  user_id: z.number().optional(),
  plt_loc: z.string().optional(),
  void_qty: z.number().min(0),
});

export const VoidReportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  voidReason: z.string().optional(),
  productCode: z.string().optional(),
  voidBy: z.string().optional(),
});

export const ReportVoidRecordSchema = z.object({
  uuid: z.string().min(1),
  plt_num: z.string().min(1),
  time: z.string().datetime(),
  reason: z.string().min(1),
  damage_qty: z.number().min(0).nullable(),
  record_palletinfo: z
    .object({
      product_code: z.string(),
      product_qty: z.number().min(0),
    })
    .nullable()
    .optional(),
});

// ========== Inventory Transaction Schemas ==========

export const InventoryTransactionTypeSchema = z.enum(['in', 'out', 'transfer', 'adjust']);

export const InventoryTransactionSchema = z.object({
  transaction_id: z.string().uuid(),
  plt_num: z.string().min(1),
  product_code: z.string().min(1),
  quantity_change: z.number(),
  transaction_type: InventoryTransactionTypeSchema,
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  user_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  reference: z.string().optional(),
});

// ========== QC Label Form Schemas ==========

export const QcStatusSchema = z.enum(['passed', 'failed', 'pending']);

export const BatchProcessingResultSchema = z.object({
  pallet_result: z.object({
    plt_num: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
  qc_result: z.object({
    qc_id: z.string(),
    status: QcStatusSchema,
    details: z.record(z.unknown()).optional(),
  }),
  pdf_result: z
    .object({
      pdf_url: z.string().url(),
      generated_at: z.string().datetime(),
    })
    .optional(),
  stock_result: z
    .object({
      updated_quantity: z.number().min(0),
      location: z.string(),
    })
    .optional(),
});

// ========== Database Response Schemas ==========

export const SupabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
      details: z.string().optional(),
      hint: z.string().optional(),
    })
    .nullable(),
});

export const PalletInfoSchema = z.object({
  plt_num: z.string(),
  product_code: z.string(),
  product_qty: z.number().min(0),
  location: z.string().optional(),
  status: z.string().optional(),
});

export const HistoryRecordSchema = z.object({
  plt_num: z.string(),
  time: z.string().datetime(),
  id: z.number(),
  action: z.string(),
  loc: z.string().optional(),
  remark: z.string().optional(),
  data_id: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});

// ========== Type Inference ==========

export type VoidReason = z.infer<typeof VoidReasonSchema>;
export type VoidRecord = z.infer<typeof VoidRecordSchema>;
export type VoidReportFilters = z.infer<typeof VoidReportFiltersSchema>;
export type ReportVoidRecord = z.infer<typeof ReportVoidRecordSchema>;
export type InventoryTransactionType = z.infer<typeof InventoryTransactionTypeSchema>;
export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;
export type QcStatus = z.infer<typeof QcStatusSchema>;
export type BatchProcessingResult = z.infer<typeof BatchProcessingResultSchema>;
export type SupabaseResponse = z.infer<typeof SupabaseResponseSchema>;
export type PalletInfo = z.infer<typeof PalletInfoSchema>;
export type HistoryRecord = z.infer<typeof HistoryRecordSchema>;

// ========== Validation Helpers ==========

export class BusinessSchemaValidator {
  static validateVoidRecord(data: unknown): VoidRecord {
    try {
      return VoidRecordSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid void record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static validateVoidRecordArray(data: unknown): VoidRecord[] {
    if (!Array.isArray(data)) {
      throw new Error('Expected array of void records');
    }
    return data.map(this.validateVoidRecord);
  }

  static validateReportVoidRecord(data: unknown): ReportVoidRecord {
    try {
      return ReportVoidRecordSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid report void record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static validateInventoryTransaction(data: unknown): InventoryTransaction {
    try {
      return InventoryTransactionSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid inventory transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static validateBatchProcessingResult(data: unknown): BatchProcessingResult {
    try {
      return BatchProcessingResultSchema.parse(data);
    } catch (error) {
      throw new Error(
        `Invalid batch processing result: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static safeParseVoidRecord(
    data: unknown
  ): { success: true; data: VoidRecord } | { success: false; error: string } {
    try {
      const result = VoidRecordSchema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  static safeParseArray<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): { success: true; data: T[] } | { success: false; error: string } {
    try {
      if (!Array.isArray(data)) {
        return { success: false, error: 'Expected array' };
      }
      const results = data.map(item => schema.parse(item));
      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }
}

// ========== Type Guards using Zod ==========

export class BusinessTypeGuards {
  static isVoidRecord(data: unknown): data is VoidRecord {
    try {
      VoidRecordSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  static isReportVoidRecord(data: unknown): data is ReportVoidRecord {
    try {
      ReportVoidRecordSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  static isInventoryTransaction(data: unknown): data is InventoryTransaction {
    try {
      InventoryTransactionSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  static isBatchProcessingResult(data: unknown): data is BatchProcessingResult {
    try {
      BatchProcessingResultSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  static isPalletInfo(data: unknown): data is PalletInfo {
    try {
      PalletInfoSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  static isHistoryRecord(data: unknown): data is HistoryRecord {
    try {
      HistoryRecordSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  // 通用陣列類型守衛
  static isArrayOf<T>(array: unknown, guard: (item: unknown) => item is T): array is T[] {
    return Array.isArray(array) && array.every(guard);
  }

  // 安全類型轉換
  static safeConvert<T>(data: unknown, guard: (data: unknown) => data is T, fallback: T): T {
    return guard(data) ? data : fallback;
  }
}
