import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface OrderItem {
  order_ref: number
  product_code: string
  product_desc: string
  product_qty: number
}

interface EmailRequest {
  orderData: OrderItem[]
  to?: string[]
  cc?: string[]
  from?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Order Created Email Function Started ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    // Validate API key
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not set in environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured - RESEND_API_KEY missing'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ RESEND_API_KEY is available, length:', RESEND_API_KEY.length)

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json()
      console.log('📥 Request body received:', requestBody)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { orderData, to, cc, from }: EmailRequest = requestBody

    // Validate required fields
    if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
      console.error('❌ Order data is missing or empty')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order data is required and must be a non-empty array'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set default email addresses
    const fromEmail = from || 'ordercreated@pennine.cc'

    // Determine email recipients based on product codes
    const hasUProducts = orderData.some(item => item.product_code.startsWith('U'))
    const hasNonUProducts = orderData.some(item => !item.product_code.startsWith('U'))

    let toEmails: string[]
    let ccEmails: string[]

    if (hasUProducts && hasNonUProducts) {
      // Mixed U and non-U products
      toEmails = to || ['grobinson@pennineindustries.com', 'kjones@pennineindustries.com']
      ccEmails = cc || ['akwan@pennineindustries.com', 'alyon@pennineindustries.com']
    } else if (hasUProducts) {
      // Only U products
      toEmails = to || ['grobinson@pennineindustries.com']
      ccEmails = cc || ['akwan@pennineindustries.com', 'alyon@pennineindustries.com', 'kjones@pennineindustries.com']
    } else {
      // Normal case (no U products)
      toEmails = to || ['alyon@pennineindustries.com']
      ccEmails = cc || ['akwan@pennineindustries.com', 'kjones@pennineindustries.com', 'grobinson@pennineindustries.com']
    }

    console.log('📧 Email details:', {
      from: fromEmail,
      to: toEmails,
      cc: ccEmails,
      orderCount: orderData.length,
      hasUProducts,
      hasNonUProducts
    })

    // Get unique order references
    const orderRefs = [...new Set(orderData.map(item => item.order_ref))]

    // Generate order summary table
    const orderSummaryHtml = orderData.map(item => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; text-align: left; font-family: 'Courier New', monospace; background-color: #f8f9fa; font-weight: bold;">${item.product_code}</td>
        <td style="padding: 12px; text-align: left;">${item.product_desc}</td>
        <td style="padding: 12px; text-align: center; font-weight: bold; color: #007bff;">${item.product_qty}</td>
      </tr>
    `).join('')

    // Prepare email content
    const emailData = {
      from: fromEmail,
      to: toEmails,
      cc: ccEmails,
      subject: `New Order Created - ${orderRefs.join(', ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">New Order Created</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Order Reference${orderRefs.length > 1 ? 's' : ''}: <strong>${orderRefs.join(', ')}</strong>
            </p>
          </div>

          <div style="padding: 30px;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #007bff;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Order Summary</h2>
              <p style="color: #666; margin: 0; font-size: 14px;">
                A new order has been uploaded and processed through the PDF analysis system.
              </p>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
                <strong>Total Items:</strong> ${orderData.length} |
                <strong>Total Quantity:</strong> ${orderData.reduce((sum, item) => sum + item.product_qty, 0)}
              </p>
            </div>

            <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 18px; border-bottom: 2px solid #007bff; padding-bottom: 8px;">
              Product Details
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

            ${hasUProducts ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
              <h4 style="color: #856404; margin: 0 0 8px 0; font-size: 16px;">
                ⚠️ Special Product Notice
              </h4>
              <p style="color: #856404; margin: 0; font-size: 14px;">
                This order contains products with codes starting with "U" which require special handling.
              </p>
            </div>
            ` : ''}

            <div style="background-color: #e8f4fd; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h4 style="color: #0c5460; margin: 0 0 10px 0; font-size: 16px;">📋 Next Steps</h4>
              <ul style="color: #0c5460; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Review the order details in the Stock Control System</li>
                <li>Verify product availability and delivery requirements</li>
                <li>Process the order according to standard procedures</li>
              </ul>
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

Order Summary:
${orderData.map(item =>
  `${item.product_code}: ${item.product_desc} (Qty: ${item.product_qty})`
).join('\n')}

Total Items: ${orderData.length}
Total Quantity: ${orderData.reduce((sum, item) => sum + item.product_qty, 0)}

This is an automated notification from the Pennine Stock Control System.
      `
    }

    console.log('📤 Sending email to Resend API...')

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    console.log('📨 Resend API response status:', response.status)
    console.log('📨 Resend API response headers:', Object.fromEntries(response.headers.entries()))

    const result = await response.json()
    console.log('📨 Resend API response body:', result)

    if (!response.ok) {
      console.error('❌ Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email via Resend API',
          details: {
            status: response.status,
            statusText: response.statusText,
            apiResponse: result
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Email sent successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order created email sent for ${orderRefs.length} order(s): ${orderRefs.join(', ')}`,
        emailId: result.id,
        recipients: {
          to: toEmails,
          cc: ccEmails
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in send-order-created-email function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
