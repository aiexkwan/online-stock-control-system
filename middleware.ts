import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中間件已完全禁用 - 不執行任何代碼，只直接返回 NextResponse.next()
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 