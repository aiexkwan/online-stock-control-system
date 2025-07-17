import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // TODO: 實作分析數據概覽邏輯
    const data = {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      growthRate: 0,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: '無法獲取分析概覽數據' }, { status: 500 });
  }
}
