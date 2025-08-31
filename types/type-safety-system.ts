/**
 * 端到端類型安全驗證系統 (End-to-End Type Safety System)
 *
 * 這個系統提供了從 Supabase 資料庫到 GraphQL API，再到 Next.js 前端的完整類型安全鏈路
 */

import { z } from 'zod';
// import type { Database } from './database';
import type {
  UserId,
  ProductCode,
  OrderId,
  GRNNumber,
  Weight,
  Quantity,
  Price,
  ISOTimestamp,
} from './branded-types';
import {
  createUserId,
  createProductCode,
  createWeight,
  createQuantity,
  createPrice,
  createISOTimestamp,
  isUserId,
  isProductCode,
  isWeight,
  isQuantity,
} from './branded-types';

// ============================================================================
// Zod 品牌類型 Schema (Zod Branded Type Schemas)
// ============================================================================

/** 用戶ID的Zod schema */
export const UserIdSchema = z.string().min(1).transform(createUserId);

/** 產品代碼的Zod schema */
export const ProductCodeSchema = z.string().min(1).transform(createProductCode);

/** 重量的Zod schema */
export const WeightSchema = z.number().min(0).transform(createWeight);

/** 數量的Zod schema */
export const QuantitySchema = z.number().min(0).transform(createQuantity);

/** 價格的Zod schema */
export const PriceSchema = z.number().min(0).transform(createPrice);

/** ISO時間戳的Zod schema */
export const ISOTimestampSchema = z.string().datetime().transform(createISOTimestamp);

// ============================================================================
// 資料庫類型安全包裝器 (Database Type Safety Wrappers)
// ============================================================================

/**
 * Supabase查詢結果的類型安全包裝器
 */
export class TypeSafeSupabaseResult<T> {
  constructor(
    public readonly data: T | null,
    public readonly error: Error | null,
    public readonly count?: number | null
  ) {}

  /**
   * 檢查結果是否成功
   */
  isSuccess(): this is TypeSafeSupabaseResult<T> & { data: T; error: null } {
    return this.error === null && this.data !== null;
  }

  /**
   * 檢查結果是否失敗
   */
  isError(): this is TypeSafeSupabaseResult<T> & { data: null; error: Error } {
    return this.error !== null;
  }

  /**
   * 獲取數據或拋出錯誤
   */
  unwrap(): T {
    if (this.isError()) {
      throw this.error;
    }
    if (this.data === null) {
      throw new Error('Data is null');
    }
    return this.data;
  }

  /**
   * 獲取數據或默認值
   */
  unwrapOr(defaultValue: T): T {
    return this.isSuccess() ? this.data : defaultValue;
  }

  /**
   * 映射數據
   */
  map<U>(fn: (data: T) => U): TypeSafeSupabaseResult<U> {
    if (this.isError()) {
      return new TypeSafeSupabaseResult<U>(null, this.error, this.count);
    }
    if (this.data === null) {
      return new TypeSafeSupabaseResult<U>(null, null, this.count);
    }
    try {
      const mapped = fn(this.data);
      return new TypeSafeSupabaseResult<U>(mapped, null, this.count);
    } catch (error) {
      return new TypeSafeSupabaseResult<U>(null, error as Error, this.count);
    }
  }
}

// ============================================================================
// GraphQL 類型安全工具 (GraphQL Type Safety Tools)
// ============================================================================

/**
 * GraphQL查詢的類型安全包裝器
 */
export interface TypeSafeGraphQLQuery<TVariables = {}, TData = any> {
  query: string;
  variables?: TVariables;
  operationName?: string;
}

/**
 * GraphQL響應的類型安全包裝器
 */
export interface TypeSafeGraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
}

/**
 * GraphQL變更操作的類型安全包裝器
 */
export interface TypeSafeGraphQLMutation<TVariables = {}, TData = any>
  extends TypeSafeGraphQLQuery<TVariables, TData> {
  __mutationType: 'create' | 'update' | 'delete' | 'upsert';
}

// ============================================================================
// 核心業務實體類型 (Core Business Entity Types)
// ============================================================================

/** 產品實體的類型安全定義 */
export interface TypeSafeProduct {
  readonly id: ProductCode;
  readonly name: string;
  readonly description?: string | undefined;
  readonly weight?: Weight | undefined;
  readonly price?: Price | undefined;
  readonly stockLevel: Quantity;
  readonly createdAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
}

/** 訂單實體的類型安全定義 */
export interface TypeSafeOrder {
  readonly id: OrderId;
  readonly userId: UserId;
  readonly status: 'pending' | 'processing' | 'completed' | 'cancelled';
  readonly items: ReadonlyArray<TypeSafeOrderItem>;
  readonly totalAmount: Price;
  readonly createdAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
}

/** 訂單項目的類型安全定義 */
export interface TypeSafeOrderItem {
  readonly productId: ProductCode;
  readonly quantity: Quantity;
  readonly unitPrice: Price;
  readonly totalPrice: Price;
}

/** GRN記錄的類型安全定義 */
export interface TypeSafeGRN {
  readonly grnNumber: GRNNumber;
  readonly productCode: ProductCode;
  readonly quantity: Quantity;
  readonly weight?: Weight | undefined;
  readonly receivedBy: UserId;
  readonly receivedAt: ISOTimestamp;
  readonly status: 'pending' | 'received' | 'quality_check' | 'approved' | 'rejected';
}

// ============================================================================
// API 響應類型安全包裝器 (API Response Type Safety Wrappers)
// ============================================================================

/**
 * 統一的API響應格式
 */
export interface TypeSafeAPIResponse<TData> {
  success: boolean;
  data?: TData | undefined;
  error?:
    | {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
      }
    | undefined;
  meta?:
    | {
        timestamp: ISOTimestamp;
        requestId: string;
        version: string;
      }
    | undefined;
}

/**
 * 分頁響應的類型安全包裝器
 */
export interface TypeSafePaginatedResponse<TData> extends TypeSafeAPIResponse<TData[]> {
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============================================================================
// 輸入驗證和清理系統 (Input Validation and Sanitization System)
// ============================================================================

/**
 * 類型安全的輸入驗證器
 */
export class TypeSafeInputValidator {
  /**
   * 驗證產品創建輸入
   */
  static validateCreateProductInput(input: unknown): TypeSafeProduct | never {
    const schema = z.object({
      id: ProductCodeSchema,
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      weight: WeightSchema.optional(),
      price: PriceSchema.optional(),
      stockLevel: QuantitySchema,
      createdAt: ISOTimestampSchema,
      updatedAt: ISOTimestampSchema,
    });

    return schema.parse(input) as TypeSafeProduct;
  }

  /**
   * 驗證訂單創建輸入
   */
  static validateCreateOrderInput(
    input: unknown
  ): Omit<TypeSafeOrder, 'id' | 'createdAt' | 'updatedAt'> | never {
    const schema = z.object({
      userId: UserIdSchema,
      status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
      items: z
        .array(
          z.object({
            productId: ProductCodeSchema,
            quantity: QuantitySchema,
            unitPrice: PriceSchema,
            totalPrice: PriceSchema,
          })
        )
        .min(1),
      totalAmount: PriceSchema,
    });

    return schema.parse(input) as Omit<TypeSafeOrder, 'id' | 'createdAt' | 'updatedAt'>;
  }

  /**
   * 驗證GRN創建輸入
   */
  static validateCreateGRNInput(input: unknown): Omit<TypeSafeGRN, 'grnNumber'> | never {
    const schema = z.object({
      productCode: ProductCodeSchema,
      quantity: QuantitySchema,
      weight: WeightSchema.optional(),
      receivedBy: UserIdSchema,
      receivedAt: ISOTimestampSchema,
      status: z.enum(['pending', 'received', 'quality_check', 'approved', 'rejected']),
    });

    return schema.parse(input) as Omit<TypeSafeGRN, 'grnNumber'>;
  }
}

// ============================================================================
// 類型安全的查詢建構器 (Type-Safe Query Builders)
// ============================================================================

/**
 * Supabase查詢的類型安全建構器
 */
export class TypeSafeSupabaseQueryBuilder<T> {
  constructor(
    private tableName: string,
    private supabaseClient: any // 實際使用時應該是 SupabaseClient
  ) {}

  /**
   * 類型安全的選擇查詢
   */
  async select(columns?: string[]): Promise<TypeSafeSupabaseResult<T[]>> {
    try {
      const query = columns
        ? this.supabaseClient.from(this.tableName).select(columns.join(','))
        : this.supabaseClient.from(this.tableName).select('*');

      const { data, error, count } = await query;

      return new TypeSafeSupabaseResult<T[]>(
        error ? null : data,
        error ? new Error(error.message) : null,
        count
      );
    } catch (error) {
      return new TypeSafeSupabaseResult<T[]>(null, error as Error, null);
    }
  }

  /**
   * 類型安全的插入操作
   */
  async insert(data: Partial<T>): Promise<TypeSafeSupabaseResult<T>> {
    try {
      const { data: insertedData, error } = await this.supabaseClient
        .from(this.tableName)
        .insert(data)
        .select()
        .single();

      return new TypeSafeSupabaseResult<T>(
        error ? null : insertedData,
        error ? new Error(error.message) : null
      );
    } catch (error) {
      return new TypeSafeSupabaseResult<T>(null, error as Error);
    }
  }

  /**
   * 類型安全的更新操作
   */
  async update(id: string, data: Partial<T>): Promise<TypeSafeSupabaseResult<T>> {
    try {
      const { data: updatedData, error } = await this.supabaseClient
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      return new TypeSafeSupabaseResult<T>(
        error ? null : updatedData,
        error ? new Error(error.message) : null
      );
    } catch (error) {
      return new TypeSafeSupabaseResult<T>(null, error as Error);
    }
  }

  /**
   * 類型安全的刪除操作
   */
  async delete(id: string): Promise<TypeSafeSupabaseResult<boolean>> {
    try {
      const { error } = await this.supabaseClient.from(this.tableName).delete().eq('id', id);

      return new TypeSafeSupabaseResult<boolean>(
        error ? null : true,
        error ? new Error(error.message) : null
      );
    } catch (error) {
      return new TypeSafeSupabaseResult<boolean>(null, error as Error);
    }
  }
}

// ============================================================================
// React Hook 類型安全包裝器 (React Hook Type Safety Wrappers)
// ============================================================================

/**
 * 類型安全的狀態管理Hook
 */
export interface TypeSafeState<T> {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly lastUpdated: ISOTimestamp | null;
}

/**
 * 類型安全的CRUD操作Hook
 */
export interface TypeSafeCRUDActions<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  create: (input: CreateInput) => Promise<TypeSafeSupabaseResult<T>>;
  read: (id: string) => Promise<TypeSafeSupabaseResult<T>>;
  update: (id: string, input: UpdateInput) => Promise<TypeSafeSupabaseResult<T>>;
  delete: (id: string) => Promise<TypeSafeSupabaseResult<boolean>>;
  list: (filters?: Record<string, any>) => Promise<TypeSafeSupabaseResult<T[]>>;
}

// ============================================================================
// 類型安全錯誤處理 (Type-Safe Error Handling)
// ============================================================================

/**
 * 類型安全的錯誤類型
 */
export enum TypeSafeErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * 類型安全的錯誤類
 */
export class TypeSafeError extends Error {
  constructor(
    public readonly code: TypeSafeErrorCode,
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TypeSafeError';
  }

  /**
   * 轉換為API響應格式
   */
  toAPIResponse(): TypeSafeAPIResponse<never> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.context || undefined,
      },
      meta: {
        timestamp: createISOTimestamp(),
        requestId: crypto.randomUUID(),
        version: '1.0.0',
      },
    };
  }
}

// ============================================================================
// 類型安全工具函數 (Type-Safe Utility Functions)
// ============================================================================

/**
 * 安全地解析JSON
 */
export const safeJsonParse = <T>(
  json: string,
  schema: z.ZodSchema<T>
): TypeSafeSupabaseResult<T> => {
  try {
    const parsed = JSON.parse(json);
    const validated = schema.parse(parsed);
    return new TypeSafeSupabaseResult(validated, null);
  } catch (error) {
    return new TypeSafeSupabaseResult<T>(null, error as Error);
  }
};

/**
 * 安全地轉換數據類型
 */
export const safeTransform = <T, U>(
  data: T,
  transformer: (data: T) => U
): TypeSafeSupabaseResult<U> => {
  try {
    const transformed = transformer(data);
    return new TypeSafeSupabaseResult(transformed, null);
  } catch (error) {
    return new TypeSafeSupabaseResult<U>(null, error as Error);
  }
};

/**
 * 批量驗證數據
 */
export const batchValidate = <T>(
  items: unknown[],
  schema: z.ZodSchema<T>
): TypeSafeSupabaseResult<T[]> => {
  try {
    const validated = items.map(item => schema.parse(item));
    return new TypeSafeSupabaseResult(validated, null);
  } catch (error) {
    return new TypeSafeSupabaseResult<T[]>(null, error as Error);
  }
};

// ============================================================================
// 導出所有核心類型 (Export All Core Types)
// ============================================================================

export type {
  // Database, // 暫時註解掉直到建立正確的資料庫類型
  UserId,
  ProductCode,
  OrderId,
  GRNNumber,
  Weight,
  Quantity,
  Price,
  ISOTimestamp,
};

export {
  createUserId,
  createProductCode,
  createWeight,
  createQuantity,
  createPrice,
  createISOTimestamp,
  isUserId,
  isProductCode,
  isWeight,
  isQuantity,
};
