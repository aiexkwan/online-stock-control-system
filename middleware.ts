import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 受保護的路徑列表
const protectedPaths = [
  '/',
  '/products',
  '/inventory',
  '/reports',
  '/users',
  '/tables',
  '/dashboard'
];

// 無需身份驗證的路徑列表
const publicPaths = [
  '/login',
  '/change-password',
  '/api',
  '/_next',
  '/favicon.ico'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 檢查是否是公共路徑
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 如果是受保護的路徑，檢查 Cookie 中是否有登入標記
  if (protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    // 查看請求是否包含 Cookie
    const authCookie = request.cookies.get('user');
    if (!authCookie) {
      // 沒有身份驗證 Cookie，重定向到登入頁面
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 