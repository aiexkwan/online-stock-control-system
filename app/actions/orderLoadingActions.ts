'use server'

import { createClient } from '@/app/utils/supabase/server'
import { checkOperationAnomaly, logFailedScan } from '@/app/order-loading/services/anomalyDetectionService'

export interface LoadPalletResult {
  success: boolean
  message: string
  data?: {
    palletNumber: string
    productCode: string
    productQty: number
    updatedLoadedQty: number
  }
  error?: string
  warning?: string
}

export interface UndoLoadResult {
  success: boolean
  message: string
  data?: {
    orderRef: string
    palletNum: string
    productCode: string
    quantity: number
    newLoadedQty: number
  }
}

export async function undoLoadPallet(
  orderRef: string,
  palletNum: string,
  productCode: string,
  quantity: number
): Promise<UndoLoadResult> {
  const supabase = await createClient()
  console.log(`[undoLoadPallet] Starting undo for order: ${orderRef}, pallet: ${palletNum}`)

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    let userName = 'System'
    let userId = null
    
    if (!userError && user?.email) {
      const { data: userData } = await supabase
        .from('data_id')
        .select('id, name')
        .eq('email', user.email)
        .single()
      
      if (userData) {
        userId = userData.id
        userName = userData.name || user.email
      }
    }

    // 2. Update order loaded quantity
    const { data: orderItem, error: orderError } = await supabase
      .from('data_order')
      .select('uuid, loaded_qty')
      .eq('order_ref', orderRef)
      .eq('product_code', productCode)
      .single()

    if (orderError || !orderItem) {
      return {
        success: false,
        message: 'Order item not found'
      }
    }

    const currentLoadedQty = parseInt(orderItem.loaded_qty || '0')
    const newLoadedQty = Math.max(0, currentLoadedQty - quantity)

    const { error: updateError } = await supabase
      .from('data_order')
      .update({ loaded_qty: newLoadedQty.toString() })
      .eq('uuid', orderItem.uuid)

    if (updateError) {
      return {
        success: false,
        message: 'Failed to update order quantity'
      }
    }

    // 3. Record undo action in order_loading_history
    const { error: historyError } = await supabase
      .from('order_loading_history')
      .insert({
        order_ref: orderRef,
        pallet_num: palletNum,
        product_code: productCode,
        quantity: quantity,
        action_type: 'unload',
        action_by: userName,
        action_time: new Date().toISOString(),
        remark: `Undo loading by ${userName}`
      })

    if (historyError) {
      console.error('Failed to record history:', historyError)
    }

    // 4. Update record_history
    const { error: recordHistoryError } = await supabase
      .from('record_history')
      .insert({
        time: new Date().toISOString(),
        id: userId || 0,
        action: 'Order Unload',
        plt_num: palletNum,
        loc: null,
        remark: `Unloaded from order ${orderRef}`
      })

    if (recordHistoryError) {
      console.error('Failed to update record_history:', recordHistoryError)
    }

    // 5. Update pallet remark
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_remark')
      .eq('plt_num', palletNum)
      .single()

    if (!palletError && palletData) {
      const currentRemark = palletData.plt_remark || ''
      const newRemark = currentRemark.replace(
        /;\s*loaded to \w+/gi, 
        ''
      ).trim()

      await supabase
        .from('record_palletinfo')
        .update({ plt_remark: newRemark })
        .eq('plt_num', palletNum)
    }

    console.log(`[undoLoadPallet] Successfully undone loading for pallet ${palletNum}`)

    return {
      success: true,
      message: `Successfully undone loading of ${palletNum}`,
      data: {
        orderRef,
        palletNum,
        productCode,
        quantity,
        newLoadedQty
      }
    }

  } catch (error) {
    console.error('[undoLoadPallet] Unexpected error:', error)
    return {
      success: false,
      message: 'System error during undo operation'
    }
  }
}

export async function loadPalletToOrder(
  orderRef: string,
  palletInput: string
): Promise<LoadPalletResult> {
  const supabase = await createClient()
  console.log(`[loadPalletToOrder] Started with orderRef: ${orderRef}, input: ${palletInput}`);

  try {
    // Get current user for anomaly detection
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    let userId = '0';
    
    if (!userError && user?.email) {
      const { data: userData } = await supabase
        .from('data_id')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (userData) {
        userId = userData.id;
      }
    }
    
    // Check for operation anomalies
    const anomalyCheck = await checkOperationAnomaly(userId, orderRef);
    if (anomalyCheck.hasAnomaly && anomalyCheck.severity === 'error') {
      return {
        success: false,
        message: anomalyCheck.message || 'Operation blocked due to anomaly',
        error: 'ANOMALY_DETECTED'
      };
    }
    
    // Trim input and normalize
    const cleanInput = palletInput.trim();
    
    // Check for duplicate scanning within recent time window (5 minutes)
    console.log(`[loadPalletToOrder] Checking for duplicate scan`);
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const { data: recentScan, error: duplicateError } = await supabase
      .from('order_loading_history')
      .select('*')
      .eq('order_ref', orderRef)
      .eq('pallet_num', cleanInput)
      .eq('action_type', 'load')
      .gte('action_time', fiveMinutesAgo.toISOString())
      .order('action_time', { ascending: false })
      .limit(1);
      
    if (!duplicateError && recentScan && recentScan.length > 0) {
      const timeSinceLastScan = new Date().getTime() - new Date(recentScan[0].action_time).getTime();
      const secondsAgo = Math.floor(timeSinceLastScan / 1000);
      
      console.log(`[loadPalletToOrder] Duplicate scan detected - scanned ${secondsAgo} seconds ago`);
      return {
        success: false,
        message: `⚠️ Duplicate scan! This pallet was already scanned ${secondsAgo} seconds ago`,
        error: 'DUPLICATE_SCAN'
      }
    }
    
    // Determine if input is pallet number (contains "/") or series (contains "-")
    const isPalletNumber = cleanInput.includes('/')
    const isSeries = cleanInput.includes('-')
    console.log(`[loadPalletToOrder] Input type: ${isPalletNumber ? 'Pallet Number' : isSeries ? 'Series' : 'Unknown'}`);

    if (isPalletNumber) {
      // Input is a pallet number, query by pallet_number
      console.log(`[loadPalletToOrder] Searching for pallet number: ${cleanInput}`);
      const { data: palletInfo, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, series')
        .eq('plt_num', cleanInput)
        .single();

      if (palletError || !palletInfo) {
        console.error(`[loadPalletToOrder] Pallet lookup error:`, palletError);
        console.log(`[loadPalletToOrder] Query failed for plt_num = ${cleanInput}`);
        return {
          success: false,
          message: `Pallet not found: ${cleanInput}`,
          error: palletError?.message || 'Pallet not found in database'
        }
      }

      console.log(`[loadPalletToOrder] Found pallet:`, palletInfo);
      return processSinglePallet(supabase, orderRef, palletInfo)
    } else if (isSeries) {
      // Input is a series, query by series
      console.log(`[loadPalletToOrder] Searching for series: ${cleanInput}`);
      const { data: palletsBySeries, error: seriesError } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, series')
        .eq('series', cleanInput)
        .order('plt_num', { ascending: true });

      if (seriesError) {
        console.error(`[loadPalletToOrder] Series lookup error:`, seriesError);
        console.log(`[loadPalletToOrder] Query failed for series = ${cleanInput}`);
      }

      if (!palletsBySeries || palletsBySeries.length === 0) {
        console.log(`[loadPalletToOrder] No pallets found for series: ${cleanInput}`);
        return {
          success: false,
          message: `No pallets found for series: ${cleanInput}`,
          error: 'NOT_FOUND'
        }
      }

      console.log(`[loadPalletToOrder] Found ${palletsBySeries.length} pallets for series: ${cleanInput}`);
      
      // Process the first pallet in the series
      console.log(`[loadPalletToOrder] Processing first pallet in series: ${palletsBySeries[0].plt_num}`);
      return processSinglePallet(supabase, orderRef, palletsBySeries[0]);
    } else {
      // Input format not recognized
      console.log(`[loadPalletToOrder] Invalid input format: ${cleanInput}`);
      return {
        success: false,
        message: `Invalid input format. Use pallet number (with /) or series (with -)`,
        error: 'INVALID_FORMAT'
      }
    }
  } catch (error) {
    console.error('[loadPalletToOrder] Unexpected error:', error)
    return {
      success: false,
      message: 'System error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function processSinglePallet(
  supabase: any,
  orderRef: string,
  palletInfo: any
): Promise<LoadPalletResult> {
  console.log(`[processSinglePallet] Processing pallet for order ${orderRef}:`, palletInfo);
  
  try {
    // Extract pallet data using correct field names
    const pallet_number = palletInfo.plt_num;
    const product_code = palletInfo.product_code;
    const product_qty = palletInfo.product_qty;
    
    console.log(`[processSinglePallet] Extracted data - pallet: ${pallet_number}, product: ${product_code}, qty: ${product_qty}`);

    // 1. Check if product exists in the order
    console.log(`[processSinglePallet] Checking if product ${product_code} exists in order ${orderRef}`);
    const { data: orderItems, error: orderError } = await supabase
      .from('data_order')
      .select('uuid, product_code, product_qty, loaded_qty')
      .eq('order_ref', orderRef)
      .eq('product_code', product_code)
      .single();

    if (orderError || !orderItems) {
      console.error(`[processSinglePallet] Order check error:`, orderError);
      return {
        success: false,
        message: `Product ${product_code} is not in order ${orderRef}`,
        error: orderError?.message || 'Product not found in order'
      }
    }

    console.log(`[processSinglePallet] Product found in order:`, orderItems);

    // 2. Calculate new loaded_qty
    const currentLoadedQty = parseInt(orderItems.loaded_qty || '0')
    const requestedQty = parseInt(orderItems.product_qty || '0')
    const palletQty = Number(product_qty) || 0
    const newLoadedQty = currentLoadedQty + palletQty

    console.log(`[processSinglePallet] Quantities - current: ${currentLoadedQty}, requested: ${requestedQty}, pallet: ${palletQty}, new: ${newLoadedQty}`);

    // 3. Check if exceeding order quantity
    if (newLoadedQty > requestedQty) {
      console.log(`[processSinglePallet] Exceeds order quantity - order qty: ${requestedQty}, would be: ${newLoadedQty}`);
      return {
        success: false,
        message: `Exceeds order quantity! Requested: ${requestedQty}, Already loaded: ${currentLoadedQty}, This pallet: ${palletQty}`,
        error: 'EXCEED_ORDER_QTY'
      }
    }

    // 4. Update loaded_qty directly in data_order table
    console.log(`[processSinglePallet] Updating data_order.loaded_qty to ${newLoadedQty} for uuid ${orderItems.uuid}`);
    try {
      const { error: updateError } = await supabase
        .from('data_order')
        .update({ loaded_qty: newLoadedQty.toString() })
        .eq('uuid', orderItems.uuid);

      if (updateError) {
        console.error(`[processSinglePallet] Failed to update order quantity:`, updateError);
        return {
          success: false,
          message: 'Failed to update order quantity',
          error: updateError.message
        }
      }

      console.log(`[processSinglePallet] Successfully updated loaded_qty for order ${orderRef}, product ${product_code}`);
      
      // 5. Perform additional actions after successful loading
      await performPostLoadActions(supabase, orderRef, pallet_number, product_code, palletQty);
      
      // Check for anomaly warning (non-blocking)
      const { data: { user } } = await supabase.auth.getUser();
      let userId = '0';
      if (user?.email) {
        const { data: userData } = await supabase
          .from('data_id')
          .select('id')
          .eq('email', user.email)
          .single();
        if (userData) userId = userData.id;
      }
      
      const anomalyCheck = await checkOperationAnomaly(userId, orderRef);
      
      return {
        success: true,
        message: `Successfully loaded pallet ${pallet_number}`,
        data: {
          palletNumber: pallet_number,
          productCode: product_code,
          productQty: palletQty,
          updatedLoadedQty: newLoadedQty
        },
        warning: anomalyCheck.hasAnomaly ? anomalyCheck.message : undefined
      }
    } catch (updateError) {
      console.error(`[processSinglePallet] Exception updating order quantity:`, updateError);
      return {
        success: false,
        message: 'System error while updating order quantity',
        error: updateError instanceof Error ? updateError.message : 'Unknown error'
      }
    }
  } catch (error) {
    console.error('[processSinglePallet] Unexpected error:', error)
    return {
      success: false,
      message: 'System error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Perform additional actions after successful pallet loading
 */
async function performPostLoadActions(
  supabase: any,
  orderRef: string,
  palletNumber: string,
  productCode: string,
  palletQty: number
): Promise<void> {
  try {
    console.log(`[performPostLoadActions] Starting post-load actions for pallet ${palletNumber}, order ${orderRef}`);
    
    // 1. Get current user information
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    let userName = 'System'
    let userId = null
    
    if (!userError && user?.email) {
      const { data: userData } = await supabase
        .from('data_id')
        .select('id, name')
        .eq('email', user.email)
        .single()
      
      if (userData) {
        userId = userData.id
        userName = userData.name || user.email
      }
    }
    
    // 2. Add record to order_loading_history
    console.log(`[performPostLoadActions] Adding record to order_loading_history`);
    const { error: loadingHistoryError } = await supabase
      .from('order_loading_history')
      .insert({
        order_ref: orderRef,
        pallet_num: palletNumber,
        product_code: productCode,
        quantity: palletQty,
        action_type: 'load',
        action_by: userName,
        action_time: new Date().toISOString(),
        remark: `Loaded by ${userName}`
      });
      
    if (loadingHistoryError) {
      console.error(`[performPostLoadActions] Failed to add order loading history:`, loadingHistoryError);
    } else {
      console.log(`[performPostLoadActions] Successfully added order loading history`);
    }
    
    // 3. Add record to record_history
    console.log(`[performPostLoadActions] Adding record to record_history`);
    const historyEntry = {
      time: new Date().toISOString(),
      id: userId || 0,
      action: 'Order Load',
      plt_num: palletNumber,
      loc: null,
      remark: `Loaded to order ${orderRef}`
    };
    
    const { error: historyError } = await supabase
      .from('record_history')
      .insert(historyEntry);
      
    if (historyError) {
      console.error(`[performPostLoadActions] Failed to add history record:`, historyError);
    } else {
      console.log(`[performPostLoadActions] Successfully added history record`);
    }
    
    // 4. Update remark in record_palletinfo
    console.log(`[performPostLoadActions] Updating remark in record_palletinfo`);
    
    // First, get current remark
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_remark')
      .eq('plt_num', palletNumber)
      .single();
      
    if (palletError) {
      console.error(`[performPostLoadActions] Failed to get current remark:`, palletError);
    } else {
      // Update remark, adding the loading information
      const currentRemark = palletData?.plt_remark || '';
      const newRemark = currentRemark 
        ? `${currentRemark}; loaded to ${orderRef}`
        : `loaded to ${orderRef}`;
        
      const { error: updateRemarkError } = await supabase
        .from('record_palletinfo')
        .update({ plt_remark: newRemark })
        .eq('plt_num', palletNumber);
        
      if (updateRemarkError) {
        console.error(`[performPostLoadActions] Failed to update remark:`, updateRemarkError);
      } else {
        console.log(`[performPostLoadActions] Successfully updated remark to: ${newRemark}`);
      }
    }
    
    // 5. Find latest location from record_history
    console.log(`[performPostLoadActions] Finding latest location for pallet ${palletNumber}`);
    const { data: locationHistory, error: locationError } = await supabase
      .from('record_history')
      .select('*')
      .eq('plt_num', palletNumber)
      .order('time', { ascending: false })
      .limit(10); // Get recent history to find location
      
    if (locationError) {
      console.error(`[performPostLoadActions] Failed to get location history:`, locationError);
      return; // Stop if we can't get location
    }
    
    // Find most recent location entry
    let latestLocation = '';
    for (const entry of locationHistory || []) {
      // Check various fields for location information
      if (entry.loc && entry.loc !== 'null' && entry.loc !== '') {
        latestLocation = entry.loc;
        break;
      } else if (entry.remark) {
        // Try to extract location from remark
        const locationMatch = entry.remark.match(/moved to (\w+)|location[:\s]+(\w+)|at (\w+)/i);
        if (locationMatch) {
          latestLocation = locationMatch[1] || locationMatch[2] || locationMatch[3];
          break;
        }
      } else if (entry.action && entry.action.includes('Transfer')) {
        // For transfer actions, location might be in the action field
        const transferMatch = entry.action.match(/to (\w+)/i);
        if (transferMatch) {
          latestLocation = transferMatch[1];
          break;
        }
      }
    }
    
    if (!latestLocation) {
      console.log(`[performPostLoadActions] Could not determine latest location for pallet ${palletNumber}, defaulting to 'injection'`);
      latestLocation = 'injection'; // Default location
    }
    
    console.log(`[performPostLoadActions] Latest location for pallet ${palletNumber} is: ${latestLocation}`);
    
    // 6. Update inventory in record_inventory based on location column
    console.log(`[performPostLoadActions] Updating inventory for ${productCode} at ${latestLocation}`);
    
    // Map the location to the corresponding column in record_inventory
    const locationMapping: { [key: string]: string } = {
      'injection': 'injection',
      'pipeline': 'pipeline',
      'prebook': 'prebook',
      'await': 'await',
      'awaiting': 'await',
      'fold': 'fold',
      'fold mill': 'fold',
      'bulk': 'bulk',
      'backcarpark': 'backcarpark',
      'back car park': 'backcarpark',
      'warehouse': 'injection',
      'qc': 'injection',
      'production': 'injection'
    };
    
    const locationColumn = locationMapping[latestLocation.toLowerCase()] || 'injection';
    const validLocations = ['injection', 'pipeline', 'prebook', 'await', 'fold', 'bulk', 'backcarpark'];
    
    console.log(`[performPostLoadActions] Mapped location '${latestLocation}' to column '${locationColumn}'`);
    
    // Create new inventory record as ledger entry
    console.log(`[performPostLoadActions] Creating new inventory ledger record for ${productCode} at ${latestLocation}`);
    
    // Create insert object with all locations as 0 except for the specific one
    const insertObj: Record<string, any> = {
      product_code: productCode,
      plt_num: palletNumber,
      latest_update: new Date().toISOString()
    };
    
    // Set all locations to 0
    validLocations.forEach(loc => {
      insertObj[loc] = 0;
    });
    
    // Set the specific location to negative value (as it's being removed)
    insertObj[locationColumn] = -palletQty;
    
    const { error: insertInventoryError } = await supabase
      .from('record_inventory')
      .insert(insertObj);
      
    if (insertInventoryError) {
      console.error(`[performPostLoadActions] Failed to create inventory record:`, insertInventoryError);
    } else {
      console.log(`[performPostLoadActions] Successfully created inventory record with ${locationColumn}=-${palletQty}`);
    }
    
    console.log(`[performPostLoadActions] Completed all post-load actions`);
  } catch (error) {
    console.error(`[performPostLoadActions] Unexpected error during post-load actions:`, error);
    // We don't throw here to avoid affecting the main loading process
  }
}

export async function getOrderInfo(orderRef: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('data_order')
    .select('*')
    .eq('order_ref', orderRef)
    .order('product_code')

  if (error) {
    console.error('Error fetching order info:', error)
    return null
  }

  return data
}