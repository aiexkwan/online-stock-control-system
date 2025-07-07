'use server'

import { createClient } from '@/app/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TransactionLogService } from '@/app/services/transactionLog.service'
import { detectSearchType } from '@/app/utils/palletSearchUtils'
import { getUserIdFromEmail } from '@/lib/utils/getUserId'
import { systemLogger } from '@/lib/logger'

// Result interfaces
export interface TransferPalletResult {
  success: boolean
  message: string
  data?: {
    palletNumber: string
    productCode: string
    productQty: number
    fromLocation: string
    toLocation: string
    timestamp: string
    transferId?: string
  }
  error?: string
}

export interface SearchPalletResult {
  success: boolean
  data?: {
    plt_num: string
    product_code: string
    product_desc: string
    product_qty: number
    current_plt_loc: string
    location?: string
    status?: string
  }
  error?: string
  searchType?: 'series' | 'pallet_num'
}

export interface BatchTransferResult {
  success: boolean
  successCount: number
  failureCount: number
  results: TransferPalletResult[]
  error?: string
}

export interface TransferHistoryItem {
  uuid: string
  time: string
  id: number
  action: string
  plt_num: string
  loc: string | null
  remark: string
}

/**
 * Search for pallet with auto-detection
 */
export async function searchPallet(searchValue: string): Promise<SearchPalletResult> {
  const supabase = await createClient()
  
  try {
    // Auto-detect search type
    const searchType = detectSearchType(searchValue)
    
    if (searchType === 'unknown') {
      return {
        success: false,
        error: 'Invalid search format. Expected pallet number (DDMMYY/XXX) or series'
      }
    }
    
    let query;
    if (searchType === 'pallet_num') {
      query = supabase
        .from('data_product')
        .select('plt_num, product_code, product_desc, product_qty, current_plt_loc')
        .eq('plt_num', searchValue)
        .single()
    } else {
      query = supabase
        .from('data_product')
        .select('plt_num, product_code, product_desc, product_qty, current_plt_loc')
        .eq('series', searchValue)
        .order('plt_num', { ascending: true })
        .limit(1)
    }
    
    const { data, error } = await query
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: `No pallet found for ${searchValue}`
        }
      }
      throw error
    }
    
    if (!data) {
      return {
        success: false,
        error: `No pallet found for ${searchValue}`
      }
    }
    
    return {
      success: true,
      data: {
        ...data,
        location: data.current_plt_loc || 'Unknown'
      },
      searchType
    }
  } catch (error) {
    systemLogger.error(error, 'searchPallet operation failed')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }
  }
}

/**
 * Transfer a single pallet to a new location
 */
export async function transferPallet(
  palletNumber: string,
  toLocation: string
): Promise<TransferPalletResult> {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    let userId = 0
    let userName = 'System'
    
    if (!userError && user?.email) {
      const userIdResult = await getUserIdFromEmail(user.email)
      if (userIdResult) {
        userId = userIdResult
        
        // Get user name
        const { data: userData } = await supabase
          .from('data_id')
          .select('name')
          .eq('id', userId)
          .single()
          
        if (userData) {
          userName = userData.name || user.email
        }
      }
    }
    
    // Use RPC function for atomic transfer
    const { data, error } = await supabase
      .rpc('rpc_transfer_pallet', {
        p_pallet_num: palletNumber,
        p_to_location: toLocation,
        p_user_id: userId,
        p_user_name: userName
      })
    
    if (error) {
      console.error('[transferPallet] RPC error:', error)
      return {
        success: false,
        message: 'Transfer failed',
        error: error.message
      }
    }
    
    if (!data || !data.success) {
      return {
        success: false,
        message: data?.message || 'Transfer failed',
        error: data?.error
      }
    }
    
    // Log transaction
    await TransactionLogService.log({
      action: 'Transfer',
      palletNum: palletNumber,
      location: toLocation,
      userId,
      remark: `Transfer from ${data.from_location} to ${toLocation} by ${userName}`
    })
    
    // Revalidate paths
    revalidatePath('/stock-transfer')
    
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
        transferId: data.transfer_id
      }
    }
  } catch (error) {
    console.error('[transferPallet] Unexpected error:', error)
    return {
      success: false,
      message: 'System error during transfer',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Batch transfer multiple pallets
 */
export async function batchTransferPallets(
  transfers: Array<{ palletNumber: string; toLocation: string }>
): Promise<BatchTransferResult> {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    let userId = 0
    let userName = 'System'
    
    if (!userError && user?.email) {
      const userIdResult = await getUserIdFromEmail(user.email)
      if (userIdResult) {
        userId = userIdResult
        
        const { data: userData } = await supabase
          .from('data_id')
          .select('name')
          .eq('id', userId)
          .single()
          
        if (userData) {
          userName = userData.name || user.email
        }
      }
    }
    
    // Process transfers in parallel with limit
    const BATCH_SIZE = 5
    const results: TransferPalletResult[] = []
    
    for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
      const batch = transfers.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(({ palletNumber, toLocation }) =>
          transferPallet(palletNumber, toLocation)
        )
      )
      results.push(...batchResults)
    }
    
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    
    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      results
    }
  } catch (error) {
    console.error('[batchTransferPallets] Error:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: transfers.length,
      results: [],
      error: error instanceof Error ? error.message : 'Batch transfer failed'
    }
  }
}

/**
 * Get transfer history
 */
export async function getTransferHistory(
  limit: number = 50,
  userId?: number
): Promise<TransferHistoryItem[]> {
  const supabase = await createClient()
  
  try {
    let query = supabase
      .from('record_history')
      .select('*')
      .eq('action', 'Transfer')
      .order('time', { ascending: false })
      .limit(limit)
    
    if (userId) {
      query = query.eq('id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('[getTransferHistory] Error:', error)
    return []
  }
}

/**
 * Validate transfer destination
 */
export async function validateTransferDestination(
  palletNumber: string,
  destination: string
): Promise<{ valid: boolean; message?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if destination is valid location code
    const locationPattern = /^[A-Z]\d{2}$/
    if (!locationPattern.test(destination)) {
      return {
        valid: false,
        message: 'Invalid location format. Expected format: A01, B02, etc.'
      }
    }
    
    // Check if pallet exists
    const { data: palletData, error: palletError } = await supabase
      .from('data_product')
      .select('current_plt_loc')
      .eq('plt_num', palletNumber)
      .single()
    
    if (palletError || !palletData) {
      return {
        valid: false,
        message: 'Pallet not found'
      }
    }
    
    // Check if already at destination
    if (palletData.current_plt_loc === destination) {
      return {
        valid: false,
        message: `Pallet is already at location ${destination}`
      }
    }
    
    // Additional business rules can be added here
    // e.g., check if destination is full, restricted zones, etc.
    
    return { valid: true }
  } catch (error) {
    console.error('[validateTransferDestination] Error:', error)
    return {
      valid: false,
      message: 'Validation failed'
    }
  }
}

/**
 * Get locations for dropdown
 */
export async function getAvailableLocations(): Promise<string[]> {
  // This could be fetched from database or use a constant
  // For now, return common locations
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const rows = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))
  
  const locations: string[] = []
  for (const zone of zones) {
    for (const row of rows) {
      locations.push(`${zone}${row}`)
    }
  }
  
  // Add special locations
  locations.unshift('Await', 'Void', 'Lost', 'Ship', 'Production')
  
  return locations
}