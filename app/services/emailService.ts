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

export async function sendOrderCreatedEmail(emailRequest: EmailRequest) {
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('=== 📧 Internal Email Service Started ===');
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('🔍 [emailService] Bypassing all middleware and routes');
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    throw new Error('Email service not configured - RESEND_API_KEY missing');
  }

  const { orderData, to, cc, from, pdfAttachment } = emailRequest;

  // 驗證必需欄位
  if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
    console.error('❌ Order data is missing or empty');
    throw new Error('Order data is required and must be a non-empty array');
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
    toEmails = Array.isArray(to) ? to : ['grobinson@pennineindustries.com', 'kjones@pennineindustries.com'];
    ccEmails = cc || ['akwan@pennineindustries.com', 'alyon@pennineindustries.com'];
  } else if (hasUProducts) {
    // 僅 U 產品
    toEmails = Array.isArray(to) ? to : [typeof to === 'string' ? to : 'grobinson@pennineindustries.com'];
    ccEmails = cc || ['akwan@pennineindustries.com', 'alyon@pennineindustries.com', 'kjones@pennineindustries.com'];
  } else {
    // 正常情況（無 U 產品）
    toEmails = Array.isArray(to) ? to : [typeof to === 'string' ? to : 'alyon@pennineindustries.com'];
    ccEmails = cc || ['akwan@pennineindustries.com', 'kjones@pennineindustries.com', 'grobinson@pennineindustries.com'];
  }
  
  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📧 Email details:', {
    from: fromEmail,
    to: toEmails,
    cc: ccEmails,
    orderCount: orderData.length,
    hasUProducts
  });

  // 生成郵件內容
  const orderRefs = [...new Set(orderData.map(item => item.order_ref))];
  
  const orderSummaryHtml = orderData.map(item => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; text-align: left; font-family: 'Courier New', monospace; background-color: #f8f9fa; font-weight: bold;">${item.product_code}</td>
      <td style="padding: 12px; text-align: left;">${item.product_desc}</td>
      <td style="padding: 12px; text-align: center; font-weight: bold; color: #007bff;">${item.product_qty}</td>
    </tr>
  `).join('');

  const emailData: any = {
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
              second: '2-digit'
            })}
          </p>
        </div>
      </div>
    `,
    text: `
New Order Created - ${orderRefs.join(', ')}

New order has been created and uploaded

Order Details:
${orderData.map(item => 
  `${item.product_code}: ${item.product_desc} (Qty: ${item.product_qty})`
).join('\n')}

This is an automated notification from the Pennine Stock Control System.
    `
  };

  // 添加 PDF 附件（如果提供）
  if (pdfAttachment && pdfAttachment.filename && pdfAttachment.content) {
    emailData.attachments = [
      {
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        type: 'application/pdf'
      }
    ];
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📎 PDF attachment added:', pdfAttachment.filename);
  }

  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📤 Sending email directly to Resend API...');

  // 發送郵件使用 Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📨 Resend API response status:', response.status);

  let result;
  try {
    result = await response.json();
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📨 Resend API response body:', result);
  } catch (jsonError) {
    console.error('❌ Failed to parse Resend API response as JSON:', jsonError);
    const textResult = await response.text();
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('📨 Resend API response as text:', textResult);
    throw new Error(`Failed to parse email service response: ${textResult}`);
  }

  if (!response.ok) {
    console.error('❌ Resend API error:', {
      status: response.status,
      statusText: response.statusText,
      result
    });
    throw new Error(`Failed to send email via Resend API: ${response.status} ${response.statusText}`);
  }

  process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('✅ Email sent successfully via internal service:', result);

  return {
    success: true,
    message: `Order created email sent for ${orderRefs.length} order(s)`,
    emailId: result.id || result.data?.id || 'unknown',
    recipients: {
      to: toEmails,
      cc: ccEmails
    },
    resendResponse: result
  };
} 