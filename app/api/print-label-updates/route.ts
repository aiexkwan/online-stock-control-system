import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productCode, quantity, userId, palletCount = 1, description } = body;

    // Validate required fields
    if (!productCode || !quantity || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: productCode, quantity, or userId',
        },
        { status: 400 }
      );
    }

    // Validate data types
    const quantityNum = parseInt(quantity);
    const userIdNum = parseInt(userId);
    const palletCountNum = parseInt(palletCount);

    if (isNaN(quantityNum) || isNaN(userIdNum) || isNaN(palletCountNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data types for quantity, userId, or palletCount',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call the RPC function to handle both updates
    const { data, error } = await supabase.rpc('handle_print_label_updates', {
      p_product_code: productCode,
      p_quantity: quantityNum,
      p_user_id: userIdNum,
      p_pallet_count: palletCountNum,
      p_description: description || null,
    });

    if (error) {
      console.error('Error calling handle_print_label_updates RPC:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    // Parse the JSON result from the RPC function
    const result = data;

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Unknown error occurred',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      stockUpdated: result.stock_updated,
      workUpdated: result.work_updated,
    });
  } catch (error: any) {
    console.error('Error in print-label-updates API:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
