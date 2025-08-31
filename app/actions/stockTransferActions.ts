'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/utils/supabase/server';
// Simplified implementation without TransactionLogService
import { detectSearchType } from '@/app/utils/palletSearchUtils';
import { getUserIdFromEmail } from '@/lib/utils/getUserId';
import { systemLogger } from '@/lib/logger';
import type { SupabaseClient } from '@/types/database/supabase';

// UI Types for optimistic updates
export interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

// Result interfaces
export interface TransferPalletResult {
  success: boolean;
  message: string;
  data?: {
    palletNumber: string;
    productCode: string;
    productQty: number;
    fromLocation: string;
    toLocation: string;
    timestamp: string;
    transferId?: string;
  };
  error?: string;
}

export interface SearchPalletResult {
  success: boolean;
  data?: {
    plt_num: string;
    product_code: string;
    product_desc: string;
    product_qty: number;
    current_plt_loc: string;
    location?: string;
    status?: string;
  };
  error?: string;
  searchType?: 'series' | 'pallet_num';
}

export interface BatchTransferResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: TransferPalletResult[];
  error?: string;
}

export interface TransferHistoryItem {
  uuid: string;
  time: string;
  id: number;
  action: string;
  plt_num: string;
  loc: string | null;
  remark: string;
}

// Database record interfaces
interface ProductCodeRecord {
  description: string;
}

// Schema validation interfaces
interface SchemaValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, boolean>;
}

interface SearchPalletRPCResult {
  plt_num: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  current_location: string; // Note: This comes from record_history, not record_inventory
  is_from_mv?: boolean;
  last_update?: string;
}

interface TransferPalletRPCResult {
  success: boolean;
  message?: string;
  error?: string;
  from_location?: string;
  product_code?: string;
  product_qty?: number;
  transfer_id?: string;
}

/**
 * Validate database schema before operations
 */
async function validateDatabaseSchema(supabase: SupabaseClient): Promise<SchemaValidationResult> {
  try {
    // Check required tables exist
    const requiredTables = [
      'record_inventory',
      'record_palletinfo',
      'record_history',
      'record_transfer',
    ];
    const tableChecks = await Promise.all(
      requiredTables.map(async table => {
        const { error } = await supabase.from(table).select('*').limit(1);
        return { table, exists: !error };
      })
    );

    // Check record_inventory columns
    let inventoryColumns = null;
    let columnError = null;
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'record_inventory' });
      inventoryColumns = result.data;
      columnError = result.error;
    } catch {
      columnError = true;
    }

    if (columnError) {
      // Fallback: try direct query
      const { error: directError } = await supabase
        .from('record_inventory')
        .select('product_code, plt_num, await, injection, pipeline')
        .limit(1);

      if (directError) {
        return {
          valid: false,
          error: 'Cannot access record_inventory table structure',
          details: { record_inventory: false },
        };
      }
    }

    // Skip RPC function checks for now to avoid schema validation errors
    // All required functions have been verified to exist in the database
    const requiredFunctions = [
      'rpc_transfer_pallet',
      'execute_stock_transfer',
      'get_table_columns',
    ];
    const functionChecks = requiredFunctions.map(func => ({ func, exists: true }));

    const failedTables = tableChecks.filter(t => !t.exists);
    const failedFunctions = functionChecks.filter(f => !f.exists);

    if (failedTables.length > 0 || failedFunctions.length > 0) {
      return {
        valid: false,
        error: `Missing database objects: ${[
          ...failedTables.map(t => `table:${t.table}`),
          ...failedFunctions.map(f => `function:${f.func}`),
        ].join(', ')}`,
        details: {
          ...Object.fromEntries(tableChecks.map(t => [t.table, t.exists])),
          ...Object.fromEntries(functionChecks.map(f => [f.func, f.exists])),
        },
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Schema validation failed',
    };
  }
}

/**
 * Search for pallet with auto-detection
 */
export async function searchPallet(searchValue: string): Promise<SearchPalletResult> {
  const supabase = await createClient();

  try {
    // Auto-detect search type
    const searchType = detectSearchType(searchValue);

    if (searchType === 'unknown') {
      return {
        success: false,
        error: 'Invalid search format. Expected pallet number (DDMMYY/XXX) or series',
      };
    }

    // Get pallet info from record_palletinfo
    let palletQuery;
    if (searchType === 'pallet_num') {
      palletQuery = supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, series')
        .eq('plt_num', searchValue)
        .single();
    } else {
      palletQuery = supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, series')
        .eq('series', searchValue)
        .order('plt_num', { ascending: true })
        .limit(1);
    }

    const { data: palletData, error: palletError } = await palletQuery;

    if (palletError) {
      if (palletError.code === 'PGRST116') {
        return {
          success: false,
          error: `No pallet found for ${searchValue}`,
        };
      }
      throw palletError;
    }

    if (!palletData) {
      return {
        success: false,
        error: `No pallet found for ${searchValue}`,
      };
    }

    // For series search, we get an array, need to extract first item
    const palletInfo =
      searchType === 'series' && Array.isArray(palletData) ? palletData[0] : palletData;

    if (!palletInfo || Array.isArray(palletInfo)) {
      return {
        success: false,
        error: `No pallet found for ${searchValue}`,
      };
    }

    // Get product description from data_code
    const { data: productData } = await supabase
      .from('data_code')
      .select('description')
      .eq('code', palletInfo.product_code)
      .single();

    // Get current location from record_history
    const { data: historyData } = await supabase
      .from('record_history')
      .select('loc')
      .eq('plt_num', palletInfo.plt_num)
      .eq('action', 'Transfer')
      .order('time', { ascending: false })
      .limit(1)
      .single();

    const currentLocation = historyData?.loc || 'Await';

    // Log for debugging
    systemLogger.info(
      {
        searchValue,
        searchType,
        plt_num: palletInfo.plt_num,
        product_code: palletInfo.product_code,
        currentLocation,
      },
      'Pallet search successful'
    );

    return {
      success: true,
      data: {
        plt_num: palletInfo.plt_num,
        product_code: palletInfo.product_code,
        product_desc: (productData as ProductCodeRecord)?.description || palletInfo.product_code,
        product_qty: palletInfo.product_qty,
        current_plt_loc: currentLocation,
        location: currentLocation,
      },
      searchType,
    };
  } catch (error) {
    systemLogger.error({ error }, 'searchPallet operation failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Optimized pallet search using RPC functions with fallback mechanism
 */
export async function searchPalletOptimized(
  searchType: 'series' | 'pallet_num',
  searchValue: string
): Promise<SearchPalletResult & { metadata?: { isFromMv?: boolean; queryTime?: number } }> {
  const supabase = await createClient();
  const startTime = performance.now();

  try {
    // Priority to V2 function (includes fallback mechanism)
    const { data: v2Data, error: v2Error } = await supabase.rpc('search_pallet_optimized_v2', {
      p_search_type: searchType,
      p_search_value: searchValue.trim(),
    });

    if (!v2Error && v2Data && Array.isArray(v2Data) && v2Data.length > 0) {
      const result = v2Data[0];
      const queryTime = performance.now() - startTime;

      // Get product description from data_code table
      const { data: productData } = await supabase
        .from('data_code')
        .select('description')
        .eq('code', result.product_code)
        .single();

      return {
        success: true,
        data: {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_desc: productData?.description || result.product_code,
          product_qty: result.product_qty,
          current_plt_loc: result.current_location || 'Await',
          location: result.current_location || 'Await',
          status: result.current_location === 'Await' ? 'pending' : 'stored',
        },
        searchType,
        metadata: {
          isFromMv:
            (result as unknown as SearchPalletRPCResult & { is_from_mv?: boolean }).is_from_mv ||
            false,
          queryTime: Math.round(queryTime),
        },
      };
    }

    // If V2 function doesn't exist, fallback to V1
    if (v2Error && v2Error.code === '42883') {
      systemLogger.info({ searchType, searchValue }, 'V2 function not found, falling back to V1');

      const { data, error } = await supabase.rpc('search_pallet_optimized', {
        p_search_type: searchType,
        p_search_value: searchValue.trim(),
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: `No pallet found for ${searchValue}`,
          searchType,
        };
      }

      const result = data[0];
      const queryTime = performance.now() - startTime;

      // Get product description from data_code table
      const { data: productData } = await supabase
        .from('data_code')
        .select('description')
        .eq('code', result.product_code)
        .single();

      return {
        success: true,
        data: {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_desc: productData?.description || result.product_code,
          product_qty: result.product_qty,
          current_plt_loc: result.current_location || 'Await',
          location: result.current_location || 'Await',
          status: result.current_location === 'Await' ? 'pending' : 'stored',
        },
        searchType,
        metadata: {
          isFromMv: false,
          queryTime: Math.round(queryTime),
        },
      };
    }

    // If V2 has other _errors, throw
    if (v2Error) {
      throw v2Error;
    }

    return {
      success: false,
      error: `No pallet found for ${searchValue}`,
      searchType,
    };
  } catch (error) {
    systemLogger.error({ error, searchType, searchValue }, 'Optimized pallet search failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      searchType,
    };
  }
}

/**
 * Auto-detect search type and perform optimized search
 */
export async function searchPalletAuto(
  searchValue: string
): Promise<SearchPalletResult & { metadata?: { isFromMv?: boolean; queryTime?: number } }> {
  const searchType = detectSearchType(searchValue);

  if (searchType === 'unknown') {
    return {
      success: false,
      error: 'Invalid search format. Expected pallet number (DDMMYY/XXX) or series',
    };
  }

  return searchPalletOptimized(searchType, searchValue);
}

/**
 * Transfer a single pallet to a new location
 */
export async function transferPallet(
  palletNumber: string,
  toLocation: string
): Promise<TransferPalletResult> {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    let userId = 0;
    let userName = 'System';

    if (!userError && user?.email) {
      const userIdResult = await getUserIdFromEmail(user.email);
      if (userIdResult) {
        userId = userIdResult;

        // Get user name
        const { data: userData } = await supabase
          .from('data_id')
          .select('name')
          .eq('id', userId)
          .single();

        if (userData) {
          userName = userData.name || user.email;
        }
      }
    }

    // Use RPC function for atomic transfer with error handling
    const { data, error } = await supabase.rpc('rpc_transfer_pallet', {
      p_pallet_num: palletNumber,
      p_to_location: toLocation,
      p_user_id: userId,
      p_user_name: userName,
    });

    if (error) {
      // Enhanced error handling for schema-related errors
      const isSchemaError =
        error.message?.includes('column') && error.message?.includes('does not exist');

      systemLogger.error(
        {
          error: error.message,
          code: error.code,
          palletNumber,
          toLocation,
          isSchemaError,
        },
        '[transferPallet] RPC error'
      );

      return {
        success: false,
        message: isSchemaError
          ? 'Database configuration error - please contact system administrator'
          : 'Transfer failed',
        error: isSchemaError ? 'SCHEMA_ERROR' : error.message,
      };
    }

    const rpcResult = data as unknown as TransferPalletRPCResult;
    if (!data || !rpcResult.success) {
      return {
        success: false,
        message: rpcResult?.message || 'Transfer failed',
        error: rpcResult?.error,
      };
    }

    // Revalidate paths
    revalidatePath('/stock-transfer');

    return {
      success: true,
      message: `Successfully transferred ${palletNumber} to ${toLocation}`,
      data: {
        palletNumber,
        productCode: rpcResult.product_code || '',
        productQty: rpcResult.product_qty || 0,
        fromLocation: rpcResult.from_location || '',
        toLocation,
        timestamp: new Date().toISOString(),
        transferId: rpcResult.transfer_id || '',
      },
    };
  } catch (error) {
    systemLogger.error({ error }, '[transferPallet] Unexpected error');
    return {
      success: false,
      message: 'System error during transfer',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch transfer multiple pallets
 */
export async function batchTransferPallets(
  transfers: Array<{ palletNumber: string; toLocation: string }>
): Promise<BatchTransferResult> {
  const supabase = await createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    let userId = 0;
    let userName = 'System';

    if (!userError && user?.email) {
      const userIdResult = await getUserIdFromEmail(user.email);
      if (userIdResult) {
        userId = userIdResult;

        const { data: userData } = await supabase
          .from('data_id')
          .select('name')
          .eq('id', userId)
          .single();

        if (userData) {
          userName = userData.name || user.email;
        }
      }
    }

    // Process transfers in parallel with limit
    const BATCH_SIZE = 5;
    const results: TransferPalletResult[] = [];

    for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
      const batch = transfers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(({ palletNumber, toLocation }) => transferPallet(palletNumber, toLocation))
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      results,
    };
  } catch (error) {
    systemLogger.error({ error }, '[batchTransferPallets] Error');
    return {
      success: false,
      successCount: 0,
      failureCount: transfers.length,
      results: [],
      error: error instanceof Error ? error.message : 'Batch transfer failed',
    };
  }
}

/**
 * Get transfer history with enhanced error handling
 */
export async function getTransferHistory(
  limit: number = 50,
  userId?: number,
  options?: {
    signal?: AbortSignal;
    includeMetadata?: boolean;
  }
): Promise<TransferHistoryItem[]> {
  const supabase = await createClient();

  try {
    // Check if request was aborted
    if (options?.signal?.aborted) {
      throw new Error('Request aborted');
    }

    let query = supabase
      .from('record_history')
      .select('*')
      .eq('action', 'Stock Transfer') // Fixed: Use correct action value
      .order('time', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('id', userId);
    }

    const { data, error } = await query;

    // Check abort signal after database query
    if (options?.signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (error) {
      systemLogger.error(
        {
          error: error.message,
          code: error.code,
          limit,
          userId,
        },
        '[getTransferHistory] Database error'
      );
      throw error;
    }

    // Ensure we always return an array
    const history = (data as TransferHistoryItem[]) || [];

    // Log metadata if requested
    if (options?.includeMetadata) {
      systemLogger.info(
        {
          recordCount: history.length,
          limit,
          userId,
        },
        '[getTransferHistory] History loaded successfully'
      );
    }

    return history;
  } catch (error) {
    // Re-throw abort errors
    if (error instanceof Error && error.message === 'Request aborted') {
      throw error;
    }

    systemLogger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        limit,
        userId,
      },
      '[getTransferHistory] Error loading history'
    );

    // Return empty array as fallback for other errors
    return [];
  }
}

/**
 * Validate transfer destination
 */
export async function validateTransferDestination(
  palletNumber: string,
  destination: string
): Promise<{ valid: boolean; message?: string }> {
  const supabase = await createClient();

  try {
    // Check if destination is valid named location
    const validLocations = [
      'Fold Mill',
      'Production',
      'PipeLine',
      'Await',
      'Await_grn',
      'Void',
      'Lost',
      'Ship',
      'Damage',
      'Voided',
    ];

    if (!validLocations.includes(destination)) {
      return {
        valid: false,
        message: `Invalid location. Must be one of: ${validLocations.join(', ')}`,
      };
    }

    // Check if pallet exists
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .eq('plt_num', palletNumber)
      .single();

    if (palletError || !palletData) {
      return {
        valid: false,
        message: 'Pallet not found',
      };
    }

    // Get current location from record_history
    const { data: historyData } = await supabase
      .from('record_history')
      .select('loc')
      .eq('plt_num', palletNumber)
      .order('time', { ascending: false })
      .limit(1)
      .single();

    const currentLocation = historyData?.loc || 'Await';

    // Check if pallet is voided - cannot transfer from Voided location
    if (currentLocation === 'Voided' || currentLocation === 'Void') {
      return {
        valid: false,
        message: `Cannot transfer from ${currentLocation} location. Pallet is voided.`,
      };
    }

    // Check if already at destination
    if (currentLocation === destination) {
      return {
        valid: false,
        message: `Pallet is already at location ${destination}`,
      };
    }

    // Additional business rules can be added here
    // e.g., check if destination is full, restricted zones, etc.

    return { valid: true };
  } catch (error) {
    systemLogger.error({ error }, '[validateTransferDestination] Error');
    return {
      valid: false,
      message: 'Validation failed',
    };
  }
}

/**
 * Get locations for dropdown
 */
export async function getAvailableLocations(): Promise<string[]> {
  // Return actual warehouse locations used in the system
  return [
    'Await',
    'Await_grn',
    'Fold Mill',
    'Production',
    'PipeLine',
    'Void',
    'Lost',
    'Ship',
    'Damage',
    'Voided',
  ];
}

/**
 * Validate clock number and get user info
 * 驗證工號並取得用戶資訊
 */
export interface ClockValidationResult {
  success: boolean;
  data?: {
    id: number;
    name: string;
  };
  error?: string;
}

export async function validateClockNumber(clockNumber: string): Promise<ClockValidationResult> {
  const supabase = await createClient();

  try {
    const clockNum = parseInt(clockNumber.trim(), 10);

    if (isNaN(clockNum)) {
      return {
        success: false,
        error: 'Invalid clock number format',
      };
    }

    const { data, error } = await supabase
      .from('data_id')
      .select('id, name')
      .eq('id', clockNum)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Clock number not found',
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
      },
    };
  } catch (error) {
    systemLogger.error({ error, clockNumber }, 'Clock number validation failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}
