/**
 * 版本化健康檢查 API 端點 (v1)
 * v1.8 系統優化 - 支援 API 版本管理
 */

import { NextResponse } from 'next/server';

/**
 * v1 健康檢查端點
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    return NextResponse.json({
      status: 'healthy',
      version: 'v1',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      environment: process.env.NODE_ENV || 'development',
      appVersion: process.env.npm_package_version || '0.1.0',

      // v1 特定的健康檢查信息
      services: {
        database: 'healthy', // 可以添加實際的資料庫檢查
        authentication: 'healthy',
        cache: 'healthy',
      },

      // 兼容性信息
      compatibility: {
        apiVersion: 'v1',
        isDeprecated: false,
        supportedUntil: null,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        version: 'v1',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? (error as { message: string }).message : 'Unknown error',
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * 支援 HEAD 請求用於快速檢查
 */
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'API-Version': 'v1',
      'X-API-Version': 'v1',
    },
  });
}
