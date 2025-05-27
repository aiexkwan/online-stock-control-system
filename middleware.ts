import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
// import { emailToClockNumber } from './app/utils/authUtils'; // 可能不再需要在中間件中直接使用

// 認證中間件 - 處理用戶會話和路由保護
export async function middleware(request: NextRequest) {
  console.log(`[Supabase SSR Middleware] Path: ${request.nextUrl.pathname}`);
  
  // 讓根路由由 app/page.tsx 處理重定向
  
  // 創建基礎回應
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase SSR Middleware] Supabase URL or Anon Key is missing in env.');
    // 如果Supabase配置缺失，可能直接返回錯誤或重定向到一個錯誤頁面
    return response; 
  }

  // 公開路由 - 主登入頁面、密碼重設頁面和 API 路由不需要認證
  // 注意：/_next/static, /_next/image, /favicon.ico 通常由 matcher 排除
  const publicRoutes = [
    '/main-login',
    '/new-password',  // 密碼重設頁面需要公開，用戶通過電郵連結訪問
    '/api'  // API 路由保持公開以支援功能調用
  ];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isPublicRoute) {
    console.log(`[Supabase SSR Middleware] Public route: ${request.nextUrl.pathname}, skipping auth check.`);
    return response; // 直接放行公開路由
  }
  
  // 創建 Supabase client
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          console.log(`[Supabase SSR Middleware] Getting cookie: ${name}, value: ${cookie?.value}`);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log(`[Supabase SSR Middleware] Setting cookie: ${name}, value: ${value}`);
          
          // 設置 request cookie
          request.cookies.set({
            name,
            value,
            ...options,
          });
          
          // 創建新嘅回應並設置 cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          response.cookies.set({
            name,
            value,
            ...options,
            // 確保 cookie 可以跨子域名共享
            domain: process.env.COOKIE_DOMAIN || undefined,
            // 確保 cookie 可以通過 JavaScript 訪問（對於客戶端認證很重要）
            httpOnly: false,
            // 使用相同的站點策略
            sameSite: 'lax',
            // 本地開發使用 http
            secure: process.env.NODE_ENV === 'production',
          });
        },
        remove(name: string, options: CookieOptions) {
          console.log(`[Supabase SSR Middleware] Removing cookie: ${name}`);
          
          // 從 request 中移除
          request.cookies.delete(name);
          
          // 創建新嘅回應並移除 cookie
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          response.cookies.set({
            name,
            value: '',
            ...options,
            expires: new Date(0),
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing Supabase cookies successfully if the client is PostgREST.
  // This can happen if you run `await supabase.auth.getUser()` in a Server Action.
  // Running `await supabase.auth.getSession()` from a Server Component or Page results in a loop.
  // It is also fine to make PostgREST calls that don't change the session.
  if (request.headers.get('X-Client-Info')?.startsWith('@supabase/postgrest-js')) {
    return response;
  }

  try {
    // 使用 getUser() 獲取用戶
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[Supabase SSR Middleware] User fetch error:', userError.message);
      // 處理獲取用戶時的錯誤，但不要重定向公開路由
      // 只有在非公開路由且不在登入頁面時才重定向
      if (!isPublicRoute && request.nextUrl.pathname !== '/main-login') {
        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'user_fetch_failed');
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (!user) {
      // 需要認證的頁面列表 - 除了公開路由外的所有頁面都需要認證
      const protectedRoutes = [
        '/access',
        '/dashboard',
        '/change-password',  // 密碼修改頁面需要認證，用戶必須已登入
        '/users',
        '/reports',
        '/view-history',
        '/void-pallet',
        '/tables',
        '/inventory',
        '/export-report',
        '/history',
        '/products',
        '/stock-transfer',
        '/print-label',
        '/print-grnlabel',
        '/debug-test'
      ];
      
      // 檢查當前路徑是否需要認證
      const needsAuth = protectedRoutes.some(route => 
        request.nextUrl.pathname.startsWith(route)
      );
      
      // 如果不在 /main-login 頁面且需要認證，則重定向到登入頁面
      if (request.nextUrl.pathname !== '/main-login' && needsAuth) {
        console.log('[Supabase SSR Middleware] Protected route requires authentication, redirecting to main-login from:', request.nextUrl.pathname);
        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'authentication_required');
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      // 用戶已認證
      console.log(`[Supabase SSR Middleware] User authenticated: ${user.id}`);
      // 將用戶 ID 添加到回應 header，方便客戶端同步
      response.headers.set('X-User-ID', user.id);
    }

    return response;
  } catch (error) {
    console.error('[Supabase SSR Middleware] Unexpected error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
}; 