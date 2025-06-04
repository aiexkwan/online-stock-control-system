import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  orderRef: number
  to?: string
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
    console.log('=== ACO Email Function Started ===')
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

    const { orderRef, to, from }: EmailRequest = requestBody

    // Validate required fields
    if (!orderRef) {
      console.error('❌ Order reference is missing')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order reference is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set default email addresses
    // pennine.cc domain is now verified in Resend
    const fromEmail = from || 'orders@pennine.cc'  // Now using verified pennine.cc domain
    
    // Use production business emails since domain is verified
    const toEmail = to || 'alyon@pennineindustries.com';
    const ccEmails = ['akwan@pennineindustries.com', 'gtatlock@pennineindustries.com', 'grobinson@pennineindustries.com'];
    
    console.log('📧 Email details:', {
      orderRef,
      from: fromEmail,
      to: toEmail,
      cc: ccEmails,
      note: 'Using verified pennine.cc domain'
    })

    // Prepare email content
    const emailData = {
      from: fromEmail,
      to: [toEmail],
      cc: ccEmails,
      subject: 'ACO Order Completed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ACO Order Completion Notification
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 16px; margin: 0;">
              <strong>ACO order has been completed.</strong>
            </p>
            <p style="font-size: 18px; color: #007bff; margin: 10px 0 0 0;">
              <strong>Reference Number: ${orderRef}</strong>
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              This is an automated notification from the Pennine Stock Control System.
            </p>
            <p style="color: #666; font-size: 14px;">
              Please check the system for detailed order information.
            </p>
          </div>
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Pennine Industries Stock Control System<br>
              Generated on ${new Date().toLocaleString('en-GB', { 
                timeZone: 'Europe/London',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      `,
      text: `ACO order has been completed. Reference Number: ${orderRef}`
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
        message: `ACO completion email sent for order ${orderRef}`,
        emailId: result.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error in send-aco-completion-email function:', error)
    console.error('💥 Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 