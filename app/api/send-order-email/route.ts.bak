import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/types/core/error';
import { safeGet, safeString, safeNumber } from '@/types/database/helpers';

interface OrderItem {
  order_ref: number;
  product_code: string;
  product_desc: string;
  product_qty: number;
}

interface EmailRequest {
  orderData: OrderItem[];
  to?: string | string[];
  cc?: string[];
  from?: string;
  pdfAttachment?: {
    filename: string;
    content: string; // base64 encoded
  };
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  // 強制標記為公開API路由，繞過認證
  'X-Public-Route': 'true',
  'X-Skip-Auth': 'true',
};

export async function OPTIONS() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📋 [send-order-email] OPTIONS request received');
  }
  return new Response('ok', { headers: corsHeaders });
}

export async function POST(request: Request) {
  // 強制標記此請求為公開路由
  const responseHeaders = {
    ...corsHeaders,
    'X-Route-Status': 'public-api-accessed',
  };

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== 📧 Order Created Email API Started ===');
      console.log('🔍 [send-order-email] API Route Hit - Bypassing Auth');
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🌐 Request URL:', request.url);
      console.log('📍 Request method:', request.method);
      console.log('🔗 User-Agent:', request.headers.get('user-agent'));
      console.log('🔗 Referer:', request.headers.get('referer'));
      console.log('🔗 Host:', request.headers.get('host'));
    }

    // 驗證 API Key
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 Checking RESEND_API_KEY availability...');
      console.log('RESEND_API_KEY exists:', !!RESEND_API_KEY);
      console.log('RESEND_API_KEY length:', RESEND_API_KEY?.length || 0);
      console.log('RESEND_API_KEY prefix:', RESEND_API_KEY?.substring(0, 10) || 'N/A');
    }

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'Email service not configured - RESEND_API_KEY missing',
        },
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    // 解析請求體
    let requestBody: EmailRequest;
    try {
      requestBody = await request.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('📥 Request body received:', requestBody);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    const { orderData, to, cc, from, pdfAttachment } = requestBody;

    // 驗證必需欄位
    if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
      console.error('❌ Order data is missing or empty');
      return NextResponse.json(
        {
          success: false,
          error: 'Order data is required and must be a non-empty array',
        },
        {
          status: 400,
          headers: responseHeaders,
        }
      );
    }

    // 設置郵件地址 - 使用已驗證的域名
    const fromEmail = from || 'orders@pennine.cc';

    // 根據產品代碼智能分配收件人
    const hasUProducts = orderData.some(item => item.product_code.startsWith('U'));
    const hasNonUProducts = orderData.some(item => !item.product_code.startsWith('U'));

    let toEmails: string[];
    let ccEmails: string[];

    if (hasUProducts && hasNonUProducts) {
      // 混合 U 和非 U 產品
      toEmails = Array.isArray(to) ? to : ['grobinson@pennineindustries.com'];
      ccEmails = cc || [
        'akwan@pennineindustries.com',
        'alyon@pennineindustries.com',
        'kjones@pennineindustries.com',
      ];
    } else if (hasUProducts) {
      // 僅 U 產品
      toEmails = Array.isArray(to)
        ? to
        : [typeof to === 'string' ? to : 'grobinson@pennineindustries.com'];
      ccEmails = cc || [
        'akwan@pennineindustries.com',
        'alyon@pennineindustries.com',
        'kjones@pennineindustries.com',
      ];
    } else {
      // 正常情況（無 U 產品）
      toEmails = Array.isArray(to)
        ? to
        : [typeof to === 'string' ? to : 'alyon@pennineindustries.com'];
      ccEmails = cc || [
        'akwan@pennineindustries.com',
        'grobinson@pennineindustries.com',
        'kjones@pennineindustries.com',
      ];
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email details:', {
        from: fromEmail,
        to: toEmails,
        cc: ccEmails,
        orderCount: orderData.length,
        hasUProducts,
      });
    }

    // 生成郵件內容 - 策略 4: 類型安全的郵件數據處理
    const orderRefs = [...new Set(orderData.map((item: OrderItem) => item.order_ref))];

    const orderSummaryHtml = orderData
      .map(
        (item: OrderItem) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; text-align: left; font-family: 'Courier New', monospace; background-color: #f8f9fa; font-weight: bold;">${item.product_code}</td>
        <td style="padding: 12px; text-align: left;">${item.product_desc}</td>
        <td style="padding: 12px; text-align: center; font-weight: bold; color: #007bff;">${item.product_qty}</td>
      </tr>
    `
      )
      .join('');

    const emailData: Record<string, unknown> = {
      from: fromEmail,
      to: toEmails,
      cc: ccEmails,
      subject: `New Order - ${orderRefs.join(', ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">New Order Created</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Order Reference${orderRefs.length > 1 ? 's' : ''}: <strong>${orderRefs.join(', ')}</strong>
            </p>
          </div>

          <div style="padding: 30px;">

            <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 18px; border-bottom: 2px solid #007bff; padding-bottom: 8px;">
              Order Details
            </h3>

            <div style="overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <table style="width: 100%; border-collapse: collapse; background-color: white;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white;">
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Product Code</th>
                    <th style="padding: 15px; text-align: left; font-weight: bold; font-size: 14px;">Description</th>
                    <th style="padding: 15px; text-align: center; font-weight: bold; font-size: 14px;">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderSummaryHtml}
                </tbody>
              </table>
            </div>

          </div>

          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated notification from the Pennine Stock Control System<br>
              Generated on ${new Date().toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>
        </div>
      `,
      text: `
New Order Created - ${orderRefs.join(', ')}

New order has been created and uploaded

Order Details:
${orderData
  .map((item: OrderItem) => `${item.product_code}: ${item.product_desc} (Qty: ${item.product_qty})`)
  .join('\n')}

This is an automated notification from the Pennine Stock Control System.
      `,
    };

    // 添加 PDF 附件（如果提供）
    if (pdfAttachment && pdfAttachment.filename && pdfAttachment.content) {
      emailData.attachments = [
        {
          filename: pdfAttachment.filename,
          content: pdfAttachment.content,
          type: 'application/pdf',
        },
      ];
      if (process.env.NODE_ENV !== 'production') {
        console.log('📎 PDF attachment added:', pdfAttachment.filename);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('📤 Sending email to Resend API...');
      console.log('📤 Email data preview:', {
        from: emailData.from,
        to: emailData.to,
        cc: emailData.cc,
        subject: emailData.subject,
        hasAttachments: !!emailData.attachments,
        attachmentCount: (emailData.attachments as unknown[])?.length || 0,
      });
    }

    // 發送郵件使用 Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('📨 Resend API response status:', response.status);
      console.log(
        '📨 Resend API response headers:',
        Object.fromEntries(response.headers.entries())
      );
    }

    let result;
    try {
      result = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('📨 Resend API response body:', result);
      }
    } catch (jsonError) {
      console.error('❌ Failed to parse Resend API response as JSON:', jsonError);
      const textResult = await response.text();
      if (process.env.NODE_ENV !== 'production') {
        console.log('📨 Resend API response as text:', textResult);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse email service response',
          details: {
            status: response.status,
            statusText: response.statusText,
            rawResponse: textResult,
          },
        },
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    if (!response.ok) {
      console.error('❌ Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        result,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email via Resend API',
          details: {
            status: response.status,
            statusText: response.statusText,
            apiResponse: result,
          },
        },
        {
          status: 500,
          headers: responseHeaders,
        }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Email sent successfully:', result);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Order created email sent for ${orderRefs.length} order(s)`,
        emailId: result.id || result.data?.id || 'unknown',
        recipients: {
          to: toEmails,
          cc: ccEmails,
        },
        resendResponse: result,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error: unknown) {
    console.error('💥 Unexpected error in order email API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: getErrorMessage(error) || 'Unknown error',
      },
      {
        status: 500,
        headers: responseHeaders,
      }
    );
  }
}
