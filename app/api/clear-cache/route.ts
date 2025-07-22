import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getErrorMessage } from '@/types/core/error';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[clear-cache] 開始清除 Next.js 緩存...');
    }

    // 清除特定路徑的緩存
    const pathsToRevalidate = ['/print-label', '/print-grnlabel', '/admin', '/dashboard', '/'];

    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[clear-cache] 已清除路徑緩存: ${path}`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[clear-cache] 清除路徑緩存失敗 ${path}:`, error);
        }
      }
    }

    // 清除特定標籤的緩存
    const tagsToRevalidate = ['pallet-generation', 'qc-labels', 'grn-labels', 'database-queries'];

    for (const tag of tagsToRevalidate) {
      try {
        revalidateTag(tag);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[clear-cache] 已清除標籤緩存: ${tag}`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[clear-cache] 清除標籤緩存失敗 ${tag}:`, error);
        }
      }
    }

    // 在 Vercel 環境中添加額外的緩存清除
    if (process.env.VERCEL_ENV) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[clear-cache] Vercel 環境檢測，執行額外清除...');
      }

      // 強制清除所有可能的緩存
      try {
        revalidatePath('/', 'layout');
        if (process.env.NODE_ENV !== 'production') {
          console.log('[clear-cache] 已清除根布局緩存');
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[clear-cache] 清除根布局緩存失敗:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
    });
  } catch (error: unknown) {
    console.error('[clear-cache] 緩存清除失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cache clearing failed',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({
    message: 'Cache clearing endpoint',
    usage: 'Send POST request to clear Next.js cache',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    },
  });
}
