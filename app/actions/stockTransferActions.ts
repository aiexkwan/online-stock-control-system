'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  TransactionLogService,
  TransactionSource,
  TransactionOperation,
  TransactionLogEntry,
} from '@/app/services/transactionLog.service';
import { detectSearchType } from '@/app/utils/palletSearchUtils';
import { getUserIdFromEmail } from '@/lib/utils/getUserId';
import { systemLogger } from '@/lib/logger';

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
    const palletInfo = searchType === 'series' && Array.isArray(palletData) ? palletData[0] : palletData;
    
    if (!palletInfo || Array.isArray(palletInfo)) {
      return {
        success: false,
        error: `No pallet found for ${searchValue}`,
      };
    }

    // Get product description from data_code
    const { data: productData } = await supabase
      .from('data_code')
      .select('desc')
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
    systemLogger.info('Pallet search successful', {
      searchValue,
      searchType,
      plt_num: palletInfo.plt_num,
      product_code: palletInfo.product_code,
      currentLocation
    });

    return {
      success: true,
      data: {
        plt_num: palletInfo.plt_num,
        product_code: palletInfo.product_code,
        product_desc: productData?.desc || '',
        product_qty: palletInfo.product_qty,
        current_plt_loc: currentLocation,
        location: currentLocation,
      },
      searchType,
    };
  } catch (error) {
    systemLogger.error(error, 'searchPallet operation failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Optimized pallet search using RPC functions with fallback mechanism
 * 優化版托盤搜索，使用 RPC 函數和回退機制
 */
export async function searchPalletOptimized(
  searchType: 'series' | 'pallet_num',
  searchValue: string
): Promise<SearchPalletResult & { metadata?: { isFromMv?: boolean; queryTime?: number } }> {
  const supabase = await createClient();
  const startTime = performance.now();

  try {
    // 優先使用 V2 函數（包含回退機制）
    const { data: v2Data, error: v2Error } = await supabase.rpc('search_pallet_optimized_v2', {
      p_search_type: searchType,
      p_search_value: searchValue.trim(),
    });

    if (!v2Error && v2Data && v2Data.length > 0) {
      const result = v2Data[0];
      const queryTime = performance.now() - startTime;

      return {
        success: true,
        data: {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_desc: result.product_desc || '',
          product_qty: result.product_qty,
          current_plt_loc: result.current_location || 'Await',
          location: result.current_location || 'Await',
          status: result.current_location === 'Await' ? 'pending' : 'stored',
        },
        searchType,
        metadata: {
          isFromMv: result.is_from_mv,
          queryTime: Math.round(queryTime),
        },
      };
    }

    // 如果 V2 函數不存在，回退到 V1
    if (v2Error && v2Error.code === '42883') {
      systemLogger.info('V2 函數不存在，回退到 V1', { searchType, searchValue });

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

      return {
        success: true,
        data: {
          plt_num: result.plt_num,
          product_code: result.product_code,
          product_desc: result.product_desc || '',
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

    // 如果 V2 有其他錯誤，拋出
    if (v2Error) {
      throw v2Error;
    }

    return {
      success: false,
      error: `No pallet found for ${searchValue}`,
      searchType,
    };
  } catch (error) {
    systemLogger.error(error, 'Optimized pallet search failed', { searchType, searchValue });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      searchType,
    };
  }
}

/**
 * Auto-detect search type and perform optimized search
 * 自動檢測搜索類型並執行優化搜索
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
  const transactionService = new TransactionLogService();
  const transactionId = transactionService.generateTransactionId();

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

    // Start transaction tracking
    const transactionEntry: TransactionLogEntry = {
      transactionId,
      sourceModule: TransactionSource.INVENTORY_TRANSFER,
      sourcePage: 'stock-transfer',
      sourceAction: 'transfer_pallet',
      operationType: TransactionOperation.TRANSFER_STOCK,
      userId: userId.toString(),
      userClockNumber: userId.toString(),
      metadata: {
        palletNumber,
        toLocation,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await transactionService.startTransaction(transactionEntry, {
        initiatingUser: userName,
        targetPallet: palletNumber,
      });
    } catch (logError) {
      console.error('[transferPallet] Transaction start failed:', logError);
      // Continue with operation even if logging fails
    }

    // Use RPC function for atomic transfer
    const { data, error } = await supabase.rpc('rpc_transfer_pallet', {
      p_pallet_num: palletNumber,
      p_to_location: toLocation,
      p_user_id: userId,
      p_user_name: userName,
    });

    if (error) {
      console.error('[transferPallet] RPC error:', error);
      return {
        success: false,
        message: 'Transfer failed',
        error: error.message,
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        message: data?.message || 'Transfer failed',
        error: data?.error,
      };
    }

    // Complete transaction tracking
    try {
      await transactionService.completeTransaction(
        transactionId,
        {
          palletNumber,
          fromLocation: data.from_location,
          toLocation,
          productCode: data.product_code,
          productQty: data.product_qty,
          transferId: data.transfer_id,
        },
        {
          recordsAffected: 1,
          tablesModified: ['record_inventory', 'record_history'],
        }
      );
    } catch (logError) {
      console.error('[transferPallet] Transaction logging failed:', logError);
      // Don't fail the whole operation for logging issues
    }

    // Revalidate paths
    revalidatePath('/stock-transfer');

    return {
      success: true,
      message: `Successfully transferred ${palletNumber} to ${toLocation}`,
      data: {
        palletNumber,
        productCode: data.product_code,
        productQty: data.product_qty,
        fromLocation: data.from_location,
        toLocation,
        timestamp: new Date().toISOString(),
        transferId: data.transfer_id,
      },
    };
  } catch (error) {
    // Record transaction error
    try {
      await transactionService.recordError(
        transactionId,
        error instanceof Error ? error : new Error(String(error))
      );
    } catch (logError) {
      console.error('[transferPallet] Error logging failed:', logError);
    }

    console.error('[transferPallet] Unexpected error:', error);
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
    console.error('[batchTransferPallets] Error:', error);
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
 * Get transfer history
 */
export async function getTransferHistory(
  limit: number = 50,
  userId?: number
): Promise<TransferHistoryItem[]> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('record_history')
      .select('*')
      .eq('action', 'Transfer')
      .order('time', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('[getTransferHistory] Error:', error);
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
    // Check if destination is valid location code
    const locationPattern = /^[A-Z]\d{2}$/;
    if (!locationPattern.test(destination)) {
      return {
        valid: false,
        message: 'Invalid location format. Expected format: A01, B02, etc.',
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
      .eq('action', 'Transfer')
      .order('time', { ascending: false })
      .limit(1)
      .single();

    const currentLocation = historyData?.loc || 'Await';

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
    console.error('[validateTransferDestination] Error:', error);
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
  // This could be fetched from database or use a constant
  // For now, return common locations
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const rows = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'));

  const locations: string[] = [];
  for (const zone of zones) {
    for (const row of rows) {
      locations.push(`${zone}${row}`);
    }
  }

  // Add special locations
  locations.unshift('Await', 'Void', 'Lost', 'Ship', 'Production');

  return locations;
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
    systemLogger.error(error, 'Clock number validation failed', { clockNumber });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}
