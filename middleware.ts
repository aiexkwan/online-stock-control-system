import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 受保護的路徑列表
const protectedPaths = [
  '/dashboard',
  '/products',
  '/inventory',
  '/reports',
  '/users',
  '/tables'
];

// 無需身份驗證的路徑列表
const publicPaths = [
  '/login',
  '/change-password',
  '/api',
  '/_next',
  '/favicon.ico',
  '/static'
];

// 追踪重定向的最大次數
const MAX_REDIRECTS = 3;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳過所有靜態資源、API請求和資源檔案的檢查
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // 檢查重定向次數
  const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0');
  if (redirectCount >= MAX_REDIRECTS) {
    console.error(`重定向次數過多: ${pathname}`);
    return NextResponse.next();
  }

  // 處理根路徑重定向
  if (pathname === '/') {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-redirect-count', '1');
    return response;
  }

  // 檢查是否是公共路徑
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    console.log(`Middleware: 允許訪問公共路徑: ${pathname}`);
    return NextResponse.next();
  }

  // 檢查是否是受保護的路徑
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath) {
    const token = request.cookies.get('sb-access-token')?.value;
    const refreshToken = request.cookies.get('sb-refresh-token')?.value;

    if (!token && !refreshToken) {
      console.log(`Middleware: 重定向 ${pathname} -> /login (無有效Token)`);
      const response = NextResponse.redirect(new URL('/login', request.url));
      
      // 設置重定向計數
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    } else {
      console.log(`Middleware: 授權訪問: ${pathname} (Token: ${token})`);
    }
  } else {
    console.log(`Middleware: 非保護路徑也非公共路徑: ${pathname}, 默認允許訪問`);
  }

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