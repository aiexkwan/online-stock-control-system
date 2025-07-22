import { NextRequest, NextResponse } from 'next/server';
import { DatabaseRecord } from '@/types/database/tables';
import { getErrorMessage } from '@/types/core/error';
import { createClient } from '@supabase/supabase-js';
import { type QcInputData } from '@/lib/pdfUtils';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';
import {
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcInventoryPayload,
} from '@/app/actions/qcActions';
import {
  generateOptimizedPalletNumbersV6,
  confirmPalletUsage,
  releasePalletReservation,
} from '@/app/utils/optimizedPalletGenerationV6';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

interface AutoReprintRequest {
  productCode: string;
  quantity: number;
  originalPltNum: string;
  originalLocation: string;
  sourceAction: string;
  targetLocation?: string;
  reason: string;
  operatorClockNum: string;
}

/**
 * Get product information from database
 */
async function getProductInfo(productCode: string) {
  const { data, error } = await supabase.rpc('get_product_details_by_code', {
    p_code: productCode,
  });

  if (error || !data || data.length === 0) {
    throw new Error(`Product code ${productCode} not found`);
  }

  return data[0];
}

/**
 * Map location names to database field names
 * @deprecated Use LocationMapper.toDbColumn() directly
 */
function mapLocationToDbField(location: string): string {
  // Use the unified LocationMapper
  return LocationMapper.toDbColumn(location) || 'await'; // Default to 'await' if not found
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let palletNum: string | undefined;

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Starting optimized auto reprint process...');
    }
    const data: AutoReprintRequest = await request.json();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Received request data:', data);
    }

    // Validate input
    if (!data.productCode || !data.quantity || !data.operatorClockNum) {
      console.error('[Auto Reprint V2 API] Missing required fields:', {
        productCode: !!data.productCode,
        quantity: !!data.quantity,
        operatorClockNum: !!data.operatorClockNum,
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product information
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auto Reprint V2 API] Getting product info for: ${data.productCode}`);
    }
    const productInfo = await getProductInfo(data.productCode);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Product info retrieved:', productInfo);
    }

    // Generate pallet number using V6 optimized method
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Generating pallet number using V6 optimization...');
    }

    const generationResult = await generateOptimizedPalletNumbersV6(
      {
        count: 1,
        sessionId: `auto-reprint-${Date.now()}`,
      },
      supabase
    );

    if (!generationResult.success || generationResult.palletNumbers.length === 0) {
      console.error(
        '[Auto Reprint V2 API] Pallet number generation failed:',
        generationResult.error
      );
      throw new Error(
        `Failed to generate pallet number: ${generationResult.error || 'Unknown error'}`
      );
    }

    // Log method used
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Generation method:', generationResult.method);
    }

    palletNum = generationResult.palletNumbers[0];
    const seriesValue = generationResult.series[0]; // V6 includes series
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auto Reprint V2 API] Generated pallet: ${palletNum}, series: ${seriesValue}`);
    }

    // Prepare database records
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Preparing database records...');
    }
    const palletInfoRecord: QcPalletInfoPayload = {
      plt_num: palletNum,
      series: seriesValue,
      product_code: productInfo.code,
      product_qty: data.quantity,
      plt_remark: `Auto-reprinted from ${data.originalPltNum}`,
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: data.operatorClockNum,
      action: 'Auto Reprint',
      plt_num: palletNum,
      loc: data.targetLocation || 'Pipeline',
      remark: `Auto-reprinted from ${data.originalPltNum}`,
    };

    // Create dynamic inventory record (Strategy 2: DTO pattern)
    const inventoryRecord: QcInventoryPayload = {
      product_code: productInfo.code,
      plt_num: palletNum,
      await: 0, // Default await value
    };

    // Set inventory field based on original pallet location
    const mappedLocation = mapLocationToDbField(data.originalLocation);
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[Auto Reprint V2 API] Location mapping: "${data.originalLocation}" -> "${mappedLocation}"`
      );
    }
    // Type-safe dynamic property assignment using index signature
    (inventoryRecord as QcInventoryPayload & Record<string, unknown>)[mappedLocation] =
      data.quantity;

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord,
    };

    // Insert database records
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Inserting database records...');
    }
    const dbResult = await createQcDatabaseEntriesWithTransaction(
      databasePayload,
      data.operatorClockNum
    );
    if (dbResult.error) {
      console.error('[Auto Reprint V2 API] Database operation failed:', dbResult.error);
      throw new Error(`Database operation failed: ${dbResult.error}`);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Database records inserted successfully');
    }

    // Update original pallet's history record
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Auto Reprint V2 API] Updating original pallet history record...');
      }

      // Find original pallet's "Partially Damaged" record
      const { data: historyRecords, error: findError } = await supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', data.originalPltNum)
        .eq('action', 'Partially Damaged')
        .order('time', { ascending: false })
        .limit(1);

      if (findError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Auto Reprint V2 API] Failed to find original history record:', findError);
        }
      } else if (historyRecords && historyRecords.length > 0) {
        const originalRecord = historyRecords[0];
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Auto Reprint V2 API] Found original history record:', originalRecord);
        }

        // Update remark, replace "XX" with actual new pallet number
        if (originalRecord.remark && originalRecord.remark.includes('/XX')) {
          const updatedRemark = originalRecord.remark.replace('/XX', `/${palletNum.split('/')[1]}`);

          const { error: updateError } = await supabase
            .from('record_history')
            .update({ remark: updatedRemark })
            .eq('uuid', originalRecord.uuid);

          if (updateError) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(
                '[Auto Reprint V2 API] Failed to update original history record:',
                updateError
              );
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[Auto Reprint V2 API] Successfully updated original history record:', {
                original_remark: originalRecord.remark,
                updated_remark: updatedRemark,
              });
            }
          }
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            '[Auto Reprint V2 API] No "Partially Damaged" history record found for original pallet'
          );
        }
      }
    } catch (historyUpdateError: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[Auto Reprint V2 API] Error updating original history record:',
          historyUpdateError
        );
      }
      // Don't interrupt main flow
    }

    // Update stock_level table
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Auto Reprint V2 API] Updating stock_level for product:', {
          product_code: productInfo.code,
          quantity: data.quantity,
          operation: 'auto_reprint',
        });
      }

      const { data: stockResult, error: stockError } = await supabase.rpc(
        'update_stock_level_void',
        {
          p_product_code: productInfo.code,
          p_quantity: -data.quantity, // Negative indicates increase in stock (new pallet created)
          p_operation: 'auto_reprint',
        }
      );

      if (stockError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Auto Reprint V2 API] Stock level update failed:', stockError);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Auto Reprint V2 API] Stock level updated successfully:', stockResult);
        }
      }
    } catch (stockUpdateError: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Auto Reprint V2 API] Stock level update error:', stockUpdateError);
      }
    }

    // Return success data for client-side PDF generation
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] Preparing data for client-side PDF generation...');
    }

    // Prepare QC input data (same format as QC Label)
    const qcInputData = {
      productCode: productInfo.code,
      productDescription: productInfo.description,
      quantity: data.quantity,
      series: seriesValue,
      palletNum: palletNum,
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.operatorClockNum,
      workOrderNumber: '-', // Auto-reprint doesn't have work order
      workOrderName: undefined,
      productType: productInfo.type,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auto Reprint V2 API] QC input data prepared:', qcInputData);
    }

    // Confirm pallet usage in V6 system (since DB transaction was successful)
    const confirmResult = await confirmPalletUsage([palletNum as string], supabase);
    if (!confirmResult) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Auto Reprint V2 API] Failed to confirm pallet usage for v6 system');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auto Reprint V2 API] Returning QC input data for client-side PDF generation`);
    }

    return NextResponse.json({
      success: true,
      message: `New pallet ${palletNum} created successfully`,
      data: {
        newPalletNumber: palletNum,
        fileName: `${palletNum.replace(/\//g, '_')}.pdf`,
        qcInputData: qcInputData,
        autoprint: true,
      },
    });
  } catch (error: unknown) {
    console.error('[Auto Reprint V2 API] Error in auto reprint process:', error);

    // Release pallet reservation in V6 system on error
    if (palletNum) {
      const releaseResult = await releasePalletReservation([palletNum as string], supabase);
      if (!releaseResult) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Auto Reprint V2 API] Failed to release pallet reservation after error');
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `Auto reprint failed: ${getErrorMessage(error)}`,
      },
      { status: 500 }
    );
  }
}
