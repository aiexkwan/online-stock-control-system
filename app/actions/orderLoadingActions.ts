'use server';

import { createClient } from '@/app/utils/supabase/server';
import { getUserIdFromEmail } from '@/lib/utils/getUserId';
import {
  checkOperationAnomaly,
  logFailedScan,
} from '@/app/order-loading/services/anomalyDetectionService';

export interface LoadPalletResult {
  success: boolean;
  message: string;
  data?: {
    palletNumber: string;
    productCode: string;
    productQty: number;
    updatedLoadedQty: number;
  };
  error?: string;
  warning?: string;
}

export interface UndoLoadResult {
  success: boolean;
  message: string;
  data?: {
    orderRef: string;
    palletNum: string;
    productCode: string;
    quantity: number;
    newLoadedQty: number;
  };
}

export async function undoLoadPallet(
  orderRef: string,
  palletNum: string,
  productCode: string,
  quantity: number
): Promise<UndoLoadResult> {
  const supabase = await createClient();
  process.env.NODE_ENV !== 'production' &&
    console.log(`[undoLoadPallet] Starting undo for order: ${orderRef}, pallet: ${palletNum}`);

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    let userName = 'System';
    let userId = 0;

    if (!userError && user?.email) {
      // Use unified getUserIdFromEmail function
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

    // Call RPC function for atomic transaction
    process.env.NODE_ENV !== 'production' &&
      console.log(`[undoLoadPallet] Calling RPC function`);
    const { data, error } = await supabase.rpc('rpc_undo_load_pallet', {
      p_order_ref: orderRef,
      p_pallet_num: palletNum,
      p_product_code: productCode,
      p_quantity: quantity,
      p_user_id: userId,
      p_user_name: userName,
    });

    if (error) {
      console.error('[undoLoadPallet] RPC error:', error);
      return {
        success: false,
        message: 'System error during undo operation',
      };
    }

    if (data.success) {
      process.env.NODE_ENV !== 'production' &&
        console.log(`[undoLoadPallet] Successfully undone:`, data);
    }

    return data;
  } catch (error) {
    console.error('[undoLoadPallet] Unexpected error:', error);
    return {
      success: false,
      message: 'System error during undo operation',
    };
  }
}

export async function loadPalletToOrder(
  orderRef: string,
  palletInput: string
): Promise<LoadPalletResult> {
  const supabase = await createClient();
  process.env.NODE_ENV !== 'production' &&
    console.log(`[loadPalletToOrder] Started with orderRef: ${orderRef}, input: ${palletInput}`);

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    let userId = 0;
    let userName = 'System';

    if (!userError && user?.email) {
      // Use unified getUserIdFromEmail function
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

    // Check for operation anomalies
    const anomalyCheck = await checkOperationAnomaly(userId.toString(), orderRef);
    if (anomalyCheck.hasAnomaly && anomalyCheck.severity === 'error') {
      return {
        success: false,
        message: anomalyCheck.message || 'Operation blocked due to anomaly',
        error: 'ANOMALY_DETECTED',
      };
    }

    // Trim input
    const cleanInput = palletInput.trim();

    // Call RPC function for atomic transaction
    process.env.NODE_ENV !== 'production' &&
      console.log(`[loadPalletToOrder] Calling RPC function`);
    const { data, error } = await supabase.rpc('rpc_load_pallet_to_order', {
      p_order_ref: orderRef,
      p_pallet_input: cleanInput,
      p_user_id: userId,
      p_user_name: userName,
    });

    if (error) {
      console.error('[loadPalletToOrder] RPC error:', error);
      await logFailedScan(userId.toString(), orderRef, cleanInput, error.message);
      return {
        success: false,
        message: 'System error',
        error: error.message,
      };
    }

    // Check for non-blocking anomaly warning
    const postLoadAnomaly = await checkOperationAnomaly(userId.toString(), orderRef);

    if (data.success) {
      process.env.NODE_ENV !== 'production' &&
        console.log(`[loadPalletToOrder] Successfully loaded:`, data);
      return {
        ...data,
        warning: postLoadAnomaly.hasAnomaly ? postLoadAnomaly.message : undefined,
      };
    } else {
      await logFailedScan(userId.toString(), orderRef, cleanInput, data.message);
      return data;
    }
  } catch (error) {
    console.error('[loadPalletToOrder] Unexpected error:', error);
    return {
      success: false,
      message: 'System error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getOrderInfo(orderRef: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('data_order')
    .select('*')
    .eq('order_ref', orderRef)
    .order('product_code');

  if (error) {
    console.error('Error fetching order info:', error);
    return null;
  }

  return data;
}
