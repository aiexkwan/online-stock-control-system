import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
// import { emailToClockNumber } from './app/utils/authUtils'; // 可能不再需要在中間件中直接使用

// 認證中間件 - 處理用戶會話和路由保護
export async function middleware(request: NextRequest) {
  // 記錄所有路徑，用於調試 API 路由問題
  console.log(`[Supabase SSR Middleware] Path: ${request.nextUrl.pathname} (ENV: ${process.env.NODE_ENV})`);
  
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

  // 公開路由 - 只有主登入頁面、密碼重設頁面和特定的 API 路由不需要認證
  // 注意：/_next/static, /_next/image, /favicon.ico 通常由 matcher 排除
  const publicRoutes = [
    '/main-login',
    '/new-password',  // 密碼重設頁面需要公開，用戶通過電郵連結訪問
    '/print-label/html-preview',  // HTML 標籤預覽頁面（用於測試和預覽）
    // 只有特定的 API 路由需要公開訪問
    '/api/auth',      // 認證相關 API
    '/api/health',    // 健康檢查 API（如果有的話）
    '/api/print-label-pdf',  // PDF 生成 API（用於內部調用）
    '/api/print-label-html',  // HTML 標籤預覽 API（用於測試和預覽）
    '/api/send-order-email'   // 訂單郵件發送 API（用於內部調用）
  ];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isPublicRoute) {
    // 記錄公開路由，用於調試
    console.log(`[Supabase SSR Middleware] Public route: ${request.nextUrl.pathname}, skipping auth check.`);
    return response; // 直接放行公開路由
  }
  
  // 用於追蹤是否已經記錄過 cookie 檢查
  let cookieLoggedForThisRequest = false;
  
  // 創建 Supabase client
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name);
          // 只在開發環境且第一次檢查主要認證 cookie 時記錄
          if (process.env.NODE_ENV === 'development' && 
              name.includes('auth-token') && 
              !name.match(/\.\d+$/) && 
              !cookieLoggedForThisRequest) {
            console.log(`[Supabase SSR Middleware] Checking auth cookie for: ${request.nextUrl.pathname}`);
            cookieLoggedForThisRequest = true;
          }
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 只記錄重要的 cookie 設置操作
          if (name.includes('auth-token') && !name.match(/\.\d+$/)) {
            console.log(`[Supabase SSR Middleware] Setting auth cookie: ${name}`);
          }
          
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
      // 除了公開路由外，所有其他路由都需要認證
      // 如果不在 /main-login 頁面且不是公開路由，則重定向到登入頁面
      if (request.nextUrl.pathname !== '/main-login' && !isPublicRoute) {
        console.log('[Supabase SSR Middleware] Protected route requires authentication, redirecting to main-login from:', request.nextUrl.pathname);
        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'authentication_required');
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      // 用戶已認證 - 只在首次訪問或重要頁面時記錄
      const shouldLogAuth = process.env.NODE_ENV === 'development' && 
                           (request.nextUrl.pathname === '/admin' || 
                            request.nextUrl.pathname === '/access' ||
                            !request.headers.get('referer')); // 首次訪問（沒有 referer）
      
      if (shouldLogAuth) {
        console.log(`[Supabase SSR Middleware] User authenticated: ${user.id} for ${request.nextUrl.pathname}`);
      }
      // 將用戶 ID 添加到回應 header，方便客戶端同步
      response.headers.set('X-User-ID', user.id);
      response.headers.set('X-User-Logged', 'true');
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