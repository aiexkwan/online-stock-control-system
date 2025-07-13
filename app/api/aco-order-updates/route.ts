import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderRef,
      productCode,
      quantityUsed,
      skipUpdate = false, // 新增：是否跳過數據更新，只發送郵件
      orderCompleted = false, // 新增：訂單是否已完成
    } = body;

    // Validate required fields
    if (!orderRef || !productCode || quantityUsed === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: orderRef, productCode, or quantityUsed',
        },
        { status: 400 }
      );
    }

    // Validate data types
    const orderRefNum = parseInt(orderRef);
    const quantityUsedNum = parseInt(quantityUsed);

    if (isNaN(orderRefNum) || isNaN(quantityUsedNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data types for orderRef or quantityUsed',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let result;

    if (skipUpdate) {
      // 如果跳過更新，只需要基本的訂單資訊來發送郵件
      result = {
        success: true,
        order_ref: orderRefNum,
        product_code: productCode,
        order_completed: orderCompleted,
        message: 'Email-only request',
      };
    } else {
      // Call the enhanced RPC function to update ACO order and check completion
      const { data, error } = await supabase.rpc('update_aco_order_with_completion_check', {
        p_order_ref: orderRefNum,
        p_product_code: productCode,
        p_quantity_used: quantityUsedNum,
      });

      if (error) {
        console.error('Error calling update_aco_order_with_completion_check RPC:', error);
        return NextResponse.json(
          {
            success: false,
            error: `Database error: ${error.message}`,
          },
          { status: 500 }
        );
      }

      // Parse the JSON result from the RPC function
      result = data;

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Unknown error occurred',
          },
          { status: 500 }
        );
      }
    }

    // Check if order is completed and send email notification
    let emailResult = null;
    if (result.order_completed) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[ACO] Order ${orderRefNum} completed, sending email notification...`);
        }
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ACO] Environment check:', {
            nodeEnv: process.env.NODE_ENV,
            isLocalhost: request.url.includes('localhost'),
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
          });
        }

        // Call Supabase Edge Function to send email
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-aco-completion-email',
          {
            body: {
              orderRef: orderRefNum,
              from: 'orders@pennine.cc', // Now using verified pennine.cc domain
              to: 'alyon@pennineindustries.com', // Primary recipient
            },
          }
        );

        if (process.env.NODE_ENV !== 'production') {
          console.log('[ACO] Edge Function response:', { emailData, emailError });
        }

        if (emailError) {
          console.error('Error sending ACO completion email:', emailError);
          // Log the completion even if email fails
          if (process.env.NODE_ENV !== 'production') {
            console.log(
              `🎉 ACO ORDER COMPLETED: Order ${orderRefNum} has been completed but email notification failed.`
            );
          }
          emailResult = {
            success: false,
            error: emailError.message,
          };
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('ACO completion email sent successfully:', emailData);
          }
          emailResult = {
            success: true,
            message: emailData.message,
            emailId: emailData.emailId,
          };
        }
      } catch (emailError: any) {
        console.error('Error invoking email function:', emailError);
        // Log the completion even if email fails
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `🎉 ACO ORDER COMPLETED: Order ${orderRefNum} has been completed but email service failed.`
          );
        }
        emailResult = {
          success: false,
          error: `Email service error: ${emailError.message}`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      orderRef: result.order_ref,
      productCode: result.product_code,
      previousFinishedQty: result.previous_finished_qty,
      quantityUsed: result.quantity_used,
      newFinishedQty: result.new_finished_qty,
      requiredQty: result.required_qty,
      totalRemainingInOrder: result.total_remaining_in_order,
      orderCompleted: result.order_completed,
      emailNotification: emailResult,
    });
  } catch (error: any) {
    console.error('Error in aco-order-updates API:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check order completion status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderRef = searchParams.get('orderRef');

    if (!orderRef) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing orderRef parameter',
        },
        { status: 400 }
      );
    }

    const orderRefNum = parseInt(orderRef);
    if (isNaN(orderRefNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid orderRef format',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check order completion status
    const { data, error } = await supabase.rpc('check_aco_order_completion', {
      p_order_ref: orderRefNum,
    });

    if (error) {
      console.error('Error calling check_aco_order_completion RPC:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in aco-order-updates GET API:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
