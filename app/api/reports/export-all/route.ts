import { NextRequest } from 'next/server';

// 直接使用 ExcelJS 實現，已完全移除 xlsx 依賴
export async function POST(request: NextRequest) {
  const { POST: newPOST } = await import('./route-new');
  return newPOST(request);
}
