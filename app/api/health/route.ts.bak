import { NextResponse } from 'next/server';

/**
 * 健康檢查 API 端點
 * 用於性能測試和系統監控
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}

// 支援 HEAD 請求用於快速檢查
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
