import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { filename } = await params;
  try {
    // 從 URL 參數獲取圖片大小和質量
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size') || '40';
    const quality = searchParams.get('quality') || '80';

    // TODO: 實作頭像圖片生成或獲取邏輯
    // 目前返回 404，因為實際的頭像系統尚未實作
    return NextResponse.json({ error: '頭像圖片未找到' }, { status: 404 });
  } catch (error) {
    console.error('Avatar request error:', error);
    return NextResponse.json({ error: '無法處理頭像請求' }, { status: 500 });
  }
}
