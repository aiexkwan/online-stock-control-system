'use server';

import { createClient } from '@/app/utils/supabase/server';

/**
 * Get inventory column name based on location
 */
export function getInventoryColumn(location: string | null): string {
  if (!location) return 'injection'; // Default value
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Inventory] Mapping location "${location}" to inventory column`);
  
  const locationMap: { [key: string]: string } = {
    // Exact matches for database locations
    'Injection': 'injection',
    'Pipeline': 'pipeline', 
    'Prebook': 'prebook',
    'Await': 'await',
    'Awaiting': 'await', // Alternative spelling
    'Fold Mill': 'fold',
    'Bulk': 'bulk',
    'Backcarpark': 'backcarpark',
    'Back Car Park': 'backcarpark', // Alternative spelling
    
    // Fallback mappings for other locations
    'Warehouse': 'injection',
    'QC': 'injection', 
    'Shipping': 'injection',
    'Production': 'injection',
    'Storage': 'injection',
  };
  
  const column = locationMap[location] || 'injection';
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Inventory] Location "${location}" mapped to column "${column}"`);
  
  return column;
}

/**
 * Update inventory for void operation
 */
export async function updateInventoryForVoid(
  productCode: string,
  quantity: number,
  location: string | null,
  palletNum: string,
  damageQuantity?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const inventoryColumn = getInventoryColumn(location);
    
    const inventoryUpdate: any = {
      product_code: productCode,
      latest_update: new Date().toISOString(),
      plt_num: palletNum,
    };
    
    // Deduct from original location
    inventoryUpdate[inventoryColumn] = -quantity;
    
    // Add to damage if applicable
    if (damageQuantity && damageQuantity > 0) {
      inventoryUpdate.damage = damageQuantity;
    }

    const { error } = await supabase
      .from('record_inventory')
      .insert(inventoryUpdate);

    if (error) {
      console.error('[Inventory] Update failed:', error);
      return { success: false, error: error.message };
    }

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Inventory] Successfully updated inventory:', inventoryUpdate);
    return { success: true };
  } catch (error: any) {
    console.error('[Inventory] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update stock level using RPC function
 */
export async function updateStockLevel(
  productCode: string,
  quantity: number,
  operation: 'void' | 'damage'
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const supabase = createClient();
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Stock Level] Updating:', {
      product_code: productCode,
      quantity: quantity,
      operation: operation
    });

    const { data, error } = await supabase
      .rpc('update_stock_level_void', {
        p_product_code: productCode,
        p_quantity: quantity,
        p_operation: operation
      });

    if (error) {
      console.error('[Stock Level] Update failed:', error);
      return { success: false, error: error.message };
    }

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Stock Level] Updated successfully:', data);
    return { success: true, result: data };
  } catch (error: any) {
    console.error('[Stock Level] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}