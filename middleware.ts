import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 此中間件已完全禁用，所有頁面都可以自由訪問
// 這樣可以解決頁面重定向問題

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 允許所有頁面訪問，不做任何重定向或身份驗證檢查
  console.log(`Middleware (測試模式): 允許訪問路徑: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，但不包括:
     * 1. /api/ (API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 