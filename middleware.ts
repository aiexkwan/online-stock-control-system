import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';
import { emailToClockNumber } from './app/utils/authUtils';

// 認證中間件 - 處理用戶會話和路由保護
export async function middleware(req: NextRequest) {
  console.log(`[Supabase Middleware] Path: ${req.nextUrl.pathname}`);
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Middleware] Supabase URL or Anon Key is missing in env.');
    return res; 
  }

  // 公開路由 - 這些路由不需要認證
  const publicRoutes = ['/login', '/new-password', '/_next', '/api', '/favicon.ico'];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  
  // 如果是公開路由，直接放行
  if (isPublicRoute) {
    return res;
  }

  try {
    // 初始化 Supabase 客戶端
    const supabase = createMiddlewareClient({ req, res }, {
      supabaseUrl: supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });

    // 獲取會話
    const { data: { session }, error: sessionError } = await supabase.auth.getSession(); 

    if (sessionError) {
      console.error('[Supabase Middleware] Session error:', sessionError.message);
    }

    // 1. 檢查 Supabase 會話
    if (session) {
      console.log(`[Supabase Middleware] User authenticated via Supabase session: ${session.user.id}`);
      
      // 如果有會話，則檢查用戶是否有時鐘編號，並將其設置到 cookie
      const user = session.user;
      const email = user.email;
      let clockNumber = null;
      
      // 從用戶元數據或電子郵件中提取時鐘編號
      if (user.user_metadata?.clock_number) {
        clockNumber = user.user_metadata.clock_number;
      } else if (email) {
        clockNumber = emailToClockNumber(email);
      }
      
      if (clockNumber) {
        console.log(`[Supabase Middleware] Setting clock number cookie: ${clockNumber}`);
        
        // 設置一個特殊的 cookie，在客戶端可以使用 JavaScript 讀取
        res.cookies.set('loggedInUserClockNumber', clockNumber, {
          httpOnly: false,
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24小時
        });

        // 檢查是否需要重定向到 change password 頁面
        const isFirstLogin = user.user_metadata?.first_login === true;
        const path = req.nextUrl.pathname;
        
        // 如果是首次登入，且不在密碼更改頁面，則重定向到密碼更改頁面
        if (isFirstLogin && path !== '/change-password' && path !== '/login') {
          console.log(`[Supabase Middleware] First login detected, redirecting to change password`);
          const url = new URL('/change-password', req.url);
          url.searchParams.set('userId', clockNumber);
          return NextResponse.redirect(url);
        }
        
        // 用戶已驗證，允許訪問
        return res;
      } else {
        console.warn(`[Supabase Middleware] Authenticated user without clock number: ${email}`);
      }
    }
    
    // 2. 如果沒有 Supabase 會話，檢查 cookie 作為後備
    const clockNumberFromCookie = req.cookies.get('loggedInUserClockNumber')?.value;
    
    if (clockNumberFromCookie) {
      console.log(`[Supabase Middleware] Using cookie auth as fallback, clock number: ${clockNumberFromCookie}`);
      // 使用 cookie 中的時鐘編號作為後備認證機制
      // 這使系統可以在 Supabase 會話尚未完全同步時保持用戶已登入狀態
      return res;
    }
    
    // 3. 如果兩種方法都沒有驗證成功，則重定向到登入頁面
    console.log(`[Supabase Middleware] No auth session or cookie, redirecting to login from: ${req.nextUrl.pathname}`);
    const redirectUrl = new URL('/login', req.url);
    // 保存用戶嘗試訪問的頁面，以便登入後重定向回去
    redirectUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Supabase Middleware] Error:', error.message);
  }
  
  return res;
}

export const config = {
  // 恢復到更通用的 matcher，確保所有相關頁面都經過 middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 