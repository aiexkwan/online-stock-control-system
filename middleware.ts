import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/favicon.ico'
];

// 追踪重定向的最大次數
const MAX_REDIRECTS = 3;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳過所有靜態資源、API請求和資源檔案的檢查
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.') // 處理所有靜態文件
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
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log(`Middleware: 允許訪問公共路徑: ${pathname}`);
    return NextResponse.next();
  }

  // 如果是受保護的路徑，檢查 Cookie 中是否有登入標記
  if (protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log(`Middleware: 檢查受保護路徑: ${pathname}`);
    
    // 查看請求是否包含 Cookie
    const authCookie = request.cookies.get('user');
    
    // 檢查是否有 localStorage 中的用戶數據（由客戶端腳本設置）
    console.log(`Middleware: 檢查Cookie: ${authCookie ? `存在 (${authCookie.value})` : '不存在'}`);
    
    if (!authCookie || !authCookie.value) {
      // 避免可能的重定向循環
      console.log(`Middleware: 重定向 ${pathname} -> /login (無有效Cookie)`);
      const response = NextResponse.redirect(new URL('/login', request.url));
      
      // 設置重定向計數
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      
      response.cookies.delete('user'); // 清除可能存在的無效 cookie
      return response;
    } else {
      console.log(`Middleware: 授權訪問: ${pathname} (Cookie: ${authCookie.value})`);
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