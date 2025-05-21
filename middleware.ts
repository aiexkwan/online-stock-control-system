import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
// import { emailToClockNumber } from './app/utils/authUtils'; // 可能不再需要在中間件中直接使用

// 認證中間件 - 處理用戶會話和路由保護
export async function middleware(request: NextRequest) {
  console.log(`[Supabase SSR Middleware] Path: ${request.nextUrl.pathname}`);
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
  const publicRoutes = ['/login', '/new-password', '/api']; // /change-password 受保護
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  if (isPublicRoute) {
    console.log(`[Supabase SSR Middleware] Public route: ${request.nextUrl.pathname}, skipping auth check.`);
    return response; // 直接放行公開路由
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[Supabase SSR Middleware] Session error:', sessionError.message);
    // Handle session error, maybe redirect to login or an error page
  }

  if (!session) {
    // 如果不在 /login 頁面且沒有會話，則重定向到登入頁面
    if (request.nextUrl.pathname !== '/login') {
      console.log('[Supabase SSR Middleware] No session, redirecting to login from:', request.nextUrl.pathname);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('from', request.nextUrl.pathname);
      redirectUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // 用戶有會話
    console.log(`[Supabase SSR Middleware] User authenticated: ${session.user.id}`);
    // 移除在中間件中基於 needs_password_change 的重定向邏輯
    // 這部分將由 /dashboard 頁面處理
    // 之前的 clockNumber cookie 設置也可以移除，因為 @supabase/ssr 會自動處理會話 cookie
  }

  return response;
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