'use server';

import { createClient } from '@/app/utils/supabase/server';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';
import { isNotProduction } from '@/lib/utils/environment';

/**
 * Get inventory column name based on location
 * @deprecated Use LocationMapper.toDbColumn() directly
 */
export function getInventoryColumn(location: string | null): string {
  if (!location) return 'injection'; // Default value

  isNotProduction() &&
    console.log(`[Inventory] Mapping location "${location}" to inventory column`);

  // Use the unified LocationMapper
  const column = LocationMapper.toDbColumn(location) || 'injection';
  isNotProduction() &&
    console.log(`[Inventory] Location "${location}" mapped to column "${column}"`);

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
    const supabase = await createClient();
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

    const { error } = await supabase.from('record_inventory').insert(inventoryUpdate);

    if (error) {
      console.error('[Inventory] Update failed:', error);
      return { success: false, error: error.message };
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log('[Inventory] Successfully updated inventory:', inventoryUpdate);
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
    const supabase = await createClient();

    isNotProduction() &&
      isNotProduction() &&
      console.log('[Stock Level] Updating:', {
        product_code: productCode,
        quantity: quantity,
        operation: operation,
      });

    const { data, error } = await supabase.rpc('update_stock_level_void', {
      p_product_code: productCode,
      p_quantity: quantity,
      p_operation: operation,
    });

    if (error) {
      console.error('[Stock Level] Update failed:', error);
      return { success: false, error: error.message };
    }

    isNotProduction() &&
      isNotProduction() &&
      console.log('[Stock Level] Updated successfully:', data);
    return { success: true, result: data };
  } catch (error: any) {
    console.error('[Stock Level] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}
