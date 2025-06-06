import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      isVercel: !!(process.env.VERCEL || process.env.VERCEL_ENV),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };
    
    console.log('[Debug Env] Environment check:', envCheck);
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Debug Env] Error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error.message
    }, { status: 500 });
  }
} 