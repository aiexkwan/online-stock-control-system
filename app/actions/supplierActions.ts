/**
 * Supplier Server Actions
 *
 * 處理所有供應商相關的服務器端操作
 * 包括搜索、創建和更新供應商
 */

'use server';

import { createClient } from '@/app/utils/supabase/server';
import { errorHandler } from '@/app/components/qc-label-form/services/ErrorHandler';
import { z } from 'zod';
import type {
  RpcSearchSupplierResponse,
  RpcSupplierMutationResponse,
} from '@/lib/types/rpc-supplier-types';

// Type definitions
interface SupplierData {
  supplier_code: string;
  supplier_name: string;
}

interface SearchSupplierResult {
  exists: boolean;
  supplier?: SupplierData;
}

interface MutationResult {
  success: boolean;
  supplier?: SupplierData;
  error?: string;
}

// Validation schemas
const searchSupplierSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform(val => val.trim().toUpperCase()),
});

const createSupplierSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform(val => val.trim().toUpperCase()),
  name: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

const updateSupplierSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform(val => val.trim().toUpperCase()),
  name: z
    .string()
    .min(1)
    .transform(val => val.trim()),
});

/**
 * 獲取當前用戶 ID
 */
async function getCurrentUserId(): Promise<number> {
  const supabase = await createClient();

  try {
    // Get current user info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error('[supplierActions] No authenticated user found');
      return 999;
    }

    // Use RPC function to get user ID
    const { data, error } = await supabase.rpc('rpc_get_user_id_by_email', {
      p_email: user.email,
    });

    if (error) {
      console.error('[supplierActions] Error getting user ID:', error);
      return 999;
    }

    return typeof data === 'number' ? data : 999;
  } catch (error) {
    console.error('[supplierActions] Unexpected error getting user ID:', error);
    return 999;
  }
}

/**
 * 搜索供應商
 *
 * @param code - 供應商代碼
 * @returns 搜索結果，包含是否存在和供應商資料
 */
export async function searchSupplier(code: string): Promise<SearchSupplierResult> {
  const supabase = await createClient();

  try {
    // Validate input
    const { code: validatedCode } = searchSupplierSchema.parse({ code });

    const startTime = performance.now();

    // Call RPC function
    const { data, error } = await supabase.rpc('rpc_search_supplier', {
      p_supplier_code: validatedCode,
    });

    const endTime = performance.now();
    console.log(`[searchSupplier] RPC search completed in ${Math.round(endTime - startTime)}ms`);

    if (error) {
      errorHandler.handleApiError(
        error,
        { component: 'supplierActions', action: 'search_supplier' },
        'Failed to search supplier'
      );
      throw error;
    }

    if (
      data &&
      (data as unknown as RpcSearchSupplierResponse).exists &&
      (data as unknown as RpcSearchSupplierResponse).supplier
    ) {
      return {
        exists: true,
        supplier: (data as unknown as RpcSearchSupplierResponse).supplier,
      };
    }

    return { exists: false };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid supplier code format');
    }

    errorHandler.handleApiError(
      error as Error,
      { component: 'supplierActions', action: 'search_supplier' },
      'Unexpected error searching supplier'
    );
    throw error;
  }
}

/**
 * 創建新供應商
 *
 * @param code - 供應商代碼
 * @param name - 供應商名稱
 * @returns 創建結果
 */
export async function createSupplier(code: string, name: string): Promise<MutationResult> {
  const supabase = await createClient();

  try {
    // Validate input
    const validated = createSupplierSchema.parse({ code, name });

    // Get current user ID
    const userId = await getCurrentUserId();

    const startTime = performance.now();

    // Call RPC function
    const { data, error } = await supabase.rpc('rpc_create_supplier', {
      p_supplier_code: validated.code,
      p_supplier_name: validated.name,
      p_user_id: userId,
    });

    const endTime = performance.now();
    console.log(`[createSupplier] RPC create completed in ${Math.round(endTime - startTime)}ms`);

    if (error) {
      errorHandler.handleApiError(
        error,
        {
          component: 'supplierActions',
          action: 'create_supplier',
          additionalData: { supplierCode: validated.code },
        },
        'Failed to create supplier'
      );
      throw error;
    }

    if (!(data as unknown as RpcSupplierMutationResponse)?.success) {
      const errorMessage =
        (data as unknown as RpcSupplierMutationResponse)?.error || 'Failed to create supplier';
      throw new Error(errorMessage);
    }

    return {
      success: true,
      supplier: (data as unknown as RpcSupplierMutationResponse).supplier,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid supplier data format',
      };
    }

    errorHandler.handleApiError(
      error as Error,
      { component: 'supplierActions', action: 'create_supplier' },
      'Unexpected error creating supplier'
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * 更新供應商
 *
 * @param code - 供應商代碼
 * @param name - 新的供應商名稱
 * @returns 更新結果
 */
export async function updateSupplier(code: string, name: string): Promise<MutationResult> {
  const supabase = await createClient();

  try {
    // Validate input
    const validated = updateSupplierSchema.parse({ code, name });

    // Get current user ID
    const userId = await getCurrentUserId();

    const startTime = performance.now();

    // Call RPC function
    const { data, error } = await supabase.rpc('rpc_update_supplier', {
      p_supplier_code: validated.code,
      p_supplier_name: validated.name,
      p_user_id: userId,
    });

    const endTime = performance.now();
    console.log(`[updateSupplier] RPC update completed in ${Math.round(endTime - startTime)}ms`);

    if (error) {
      errorHandler.handleApiError(
        error,
        {
          component: 'supplierActions',
          action: 'update_supplier',
          additionalData: { supplierCode: validated.code },
        },
        'Failed to update supplier'
      );
      throw error;
    }

    if (!(data as unknown as RpcSupplierMutationResponse)?.success) {
      const errorMessage =
        (data as unknown as RpcSupplierMutationResponse)?.error || 'Failed to update supplier';
      throw new Error(errorMessage);
    }

    return {
      success: true,
      supplier: (data as unknown as RpcSupplierMutationResponse).supplier,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid supplier data format',
      };
    }

    errorHandler.handleApiError(
      error as Error,
      { component: 'supplierActions', action: 'update_supplier' },
      'Unexpected error updating supplier'
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
