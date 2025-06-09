'use server'

import { createClient } from '@/app/utils/supabase/server'

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
}

export async function loadPalletToOrder(
  orderRef: string,
  palletInput: string
): Promise<LoadPalletResult> {
  const supabase = await createClient()
  console.log(`[loadPalletToOrder] Started with orderRef: ${orderRef}, input: ${palletInput}`);

  try {
    // Trim input and normalize
    const cleanInput = palletInput.trim();
    
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
      
      return {
        success: true,
        message: `Successfully loaded pallet ${pallet_number}`,
        data: {
          palletNumber: pallet_number,
          productCode: product_code,
          productQty: palletQty,
          updatedLoadedQty: newLoadedQty
        }
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
    
    // 1. Add record to record_history
    console.log(`[performPostLoadActions] Adding record to record_history`);
    const historyEntry = {
      pallet_num: palletNumber,
      action_type: 'Loaded',
      action_by: 'system',
      date_action: new Date().toISOString(),
      action_desc: `Loaded to order ${orderRef}`,
      product_code: productCode,
      product_qty: palletQty
    };
    
    const { error: historyError } = await supabase
      .from('record_history')
      .insert(historyEntry);
      
    if (historyError) {
      console.error(`[performPostLoadActions] Failed to add history record:`, historyError);
    } else {
      console.log(`[performPostLoadActions] Successfully added history record`);
    }
    
    // 2. Update remark in record_palletinfo
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
    
    // 3. Find latest location from record_history
    console.log(`[performPostLoadActions] Finding latest location for pallet ${palletNumber}`);
    const { data: locationHistory, error: locationError } = await supabase
      .from('record_history')
      .select('*')
      .eq('pallet_num', palletNumber)
      .order('date_action', { ascending: false })
      .limit(10); // Get recent history to find location
      
    if (locationError) {
      console.error(`[performPostLoadActions] Failed to get location history:`, locationError);
      return; // Stop if we can't get location
    }
    
    // Find most recent location entry
    let latestLocation = '';
    for (const entry of locationHistory || []) {
      // Check action_desc for location information
      if (entry.action_desc && (
          entry.action_desc.includes('moved to') || 
          entry.action_desc.includes('location:') ||
          entry.action_type === 'Location'
      )) {
        // Extract location from action description
        const locationMatch = entry.action_desc.match(/moved to (\w+)|location: (\w+)/i);
        if (locationMatch) {
          latestLocation = locationMatch[1] || locationMatch[2];
          break;
        } else if (entry.loc) {
          // If location is directly stored
          latestLocation = entry.loc;
          break;
        }
      }
    }
    
    if (!latestLocation) {
      console.log(`[performPostLoadActions] Could not determine latest location for pallet ${palletNumber}`);
      return; // Stop if no location found
    }
    
    console.log(`[performPostLoadActions] Latest location for pallet ${palletNumber} is: ${latestLocation}`);
    
    // 4. Update inventory in record_inventory based on location column
    console.log(`[performPostLoadActions] Updating inventory for ${productCode} at ${latestLocation}`);
    
    // Map the location to the corresponding column in record_inventory
    const validLocations = ['injection', 'pipeline', 'prebook', 'await', 'fold', 'bulk', 'backcarpark'];
    const locationColumn = latestLocation.toLowerCase();
    
    if (!validLocations.includes(locationColumn)) {
      console.log(`[performPostLoadActions] Location ${latestLocation} does not map to a valid inventory column`);
      return;
    }
    
    // Create new inventory record as ledger entry
    console.log(`[performPostLoadActions] Creating new inventory ledger record for ${productCode} at ${latestLocation}`);
    
    // Create insert object with all locations as 0 except for the specific one
    const insertObj: Record<string, any> = {
      product_code: productCode,
      pallet_num: palletNumber,
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