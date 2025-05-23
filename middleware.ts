import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
// import { emailToClockNumber } from './app/utils/authUtils'; // 可能不再需要在中間件中直接使用

// 認證中間件 - 處理用戶會話和路由保護
export async function middleware(request: NextRequest) {
  console.log(`[Supabase SSR Middleware] Path: ${request.nextUrl.pathname}`);
  
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

  // 公開路由 - 這些路由不需要認證
  // 注意：/_next/static, /_next/image, /favicon.ico 通常由 matcher 排除
  const publicRoutes = [
    '/login', 
    '/new-password', 
    '/api',
    '/print-label',
    '/print-grnlabel',
    '/stock-transfer',
    '/dashboard/open-access'
  ]; // /change-password 受保護
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
      // 處理獲取用戶時的錯誤，可能重定向到登入頁或錯誤頁面
      // 根據錯誤類型，您可能希望有不同的處理邏輯
      // 例如，如果錯誤表示 token 無效，則明確重定向到登入
      if (request.nextUrl.pathname !== '/login') {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'user_fetch_failed');
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (!user) {
      // 如果不在 /login 頁面且沒有用戶（未認證），則重定向到登入頁面
      if (request.nextUrl.pathname !== '/login') {
        console.log('[Supabase SSR Middleware] No user, redirecting to login from:', request.nextUrl.pathname);
        const redirectUrl = new URL('/login', request.url);
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