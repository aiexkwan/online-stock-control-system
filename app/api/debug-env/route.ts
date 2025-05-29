import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10),
        startsWithEyJ: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        first10: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)
      }
    };

    console.log('[Debug Env] 環境變數檢查:', envCheck);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables checked successfully'
    });

  } catch (error: any) {
    console.error('[Debug Env] 檢查環境變數時出錯:', error);
    return NextResponse.json({
      success: false,
      error: `Environment check failed: ${error.message}`,
      stack: error.stack
    }, { status: 500 });
  }
} 