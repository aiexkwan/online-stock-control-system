import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isDevelopment, isProduction } from '@/lib/utils/env';
import { 
  middlewareLogger, 
  logMiddlewareRequest, 
  logMiddlewareAuth, 
  logMiddlewareRouting,
  getCorrelationId 
} from '@/lib/logger';
// import { emailToClockNumber } from './app/utils/authUtils'; // 可能不再需要在中間件中直接使用

// 認證中間件 - 處理用戶會話和路由保護
// 更新：修復 API 路由匹配問題 - 2025-01-09
export async function middleware(request: NextRequest) {
  // 生成或獲取 correlation ID
  const correlationId = getCorrelationId(request.headers);
  
  // 記錄請求開始
  const startTime = Date.now();
  logMiddlewareRequest(request.nextUrl.pathname, request.method, correlationId, {
    env: process.env.NODE_ENV || 'development',
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  });

  // 公開路由 - 只有主登入頁面、密碼重設頁面和特定的 API 路由不需要認證
  // 注意：/_next/static, /_next/image, /favicon.ico 通常由 matcher 排除
  const publicRoutes = [
    '/main-login',
    '/new-password', // 密碼重設頁面需要公開，用戶通過電郵連結訪問
    '/print-label/html-preview', // HTML 標籤預覽頁面（用於測試和預覽）
    '/camera-debug', // 相機調試頁面 - 用於排除身份驗證干擾
    // 只有特定的 API 路由需要公開訪問
    '/api/auth', // 認證相關 API
    '/api/health', // 健康檢查 API（如果有的話）
    '/api/print-label-pdf', // PDF 生成 API（用於內部調用）
    '/api/print-label-html', // HTML 標籤預覽 API（用於測試和預覽）
    '/api/send-order-email', // 訂單郵件發送 API（用於內部調用）
  ];

  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route => {
    const matches = request.nextUrl.pathname.startsWith(route);
    if (matches) {
      middlewareLogger.debug({
        correlationId,
        path: request.nextUrl.pathname,
        matchedRoute: route,
      }, 'Route matched public route pattern');
    }
    return matches;
  });

  // 記錄路由決策
  logMiddlewareRouting(correlationId, request.nextUrl.pathname, isPublicRoute);

  if (isPublicRoute) {
    middlewareLogger.info({
      correlationId,
      path: request.nextUrl.pathname,
      action: 'allow',
      reason: 'public_route',
    }, 'Public route access allowed');
    
    // 創建基礎回應
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    
    // 添加 correlation ID 到回應
    response.headers.set('x-correlation-id', correlationId);
    
    // 記錄請求完成時間
    const duration = Date.now() - startTime;
    middlewareLogger.info({
      correlationId,
      duration,
      status: 'allowed',
    }, 'Middleware request completed');
    
    return response; // 直接放行公開路由
  }

  // 創建基礎回應
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    middlewareLogger.error({
      correlationId,
      error: 'Supabase configuration missing',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    }, 'Critical configuration error: Supabase URL or Anon Key is missing');
    
    // 如果Supabase配置缺失，可能直接返回錯誤或重定向到一個錯誤頁面
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  // 用於追蹤是否已經記錄過 cookie 檢查
  let cookieLoggedForThisRequest = false;

  // 創建 Supabase client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = request.cookies.get(name);
        // 只在開發環境且第一次檢查主要認證 cookie 時記錄
        if (
          isDevelopment() &&
          name.includes('auth-token') &&
          !name.match(/\.\d+$/) &&
          !cookieLoggedForThisRequest
        ) {
          middlewareLogger.debug({
            correlationId,
            cookieName: name,
            path: request.nextUrl.pathname,
          }, 'Checking auth cookie');
          cookieLoggedForThisRequest = true;
        }
        return cookie?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // 只記錄重要的 cookie 設置操作
        if (name.includes('auth-token') && !name.match(/\.\d+$/)) {
          middlewareLogger.debug({
            correlationId,
            cookieName: name,
            hasValue: !!value,
          }, 'Setting auth cookie');
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
          secure: isProduction(),
        });
      },
      remove(name: string, options: CookieOptions) {
        middlewareLogger.debug({
          correlationId,
          cookieName: name,
        }, 'Removing cookie');

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
  });

  // IMPORTANT: Avoid writing Supabase cookies successfully if the client is PostgREST.
  // This can happen if you run `await supabase.auth.getUser()` in a Server Action.
  // Running `await supabase.auth.getSession()` from a Server Component or Page results in a loop.
  // It is also fine to make PostgREST calls that don't change the session.
  if (request.headers.get('X-Client-Info')?.startsWith('@supabase/postgrest-js')) {
    return response;
  }

  try {
    // 使用 getUser() 獲取用戶
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      logMiddlewareAuth(correlationId, false, undefined, userError.message);
      
      // 處理獲取用戶時的錯誤，但不要重定向公開路由
      // 只有在非公開路由且不在登入頁面時才重定向
      if (!isPublicRoute && request.nextUrl.pathname !== '/main-login') {
        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'user_fetch_failed');
        
        logMiddlewareRouting(correlationId, request.nextUrl.pathname, false, '/main-login');
        
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set('x-correlation-id', correlationId);
        return redirectResponse;
      }
    }

    if (!user) {
      // 除了公開路由外，所有其他路由都需要認證
      // 如果不在 /main-login 頁面且不是公開路由，則重定向到登入頁面
      if (request.nextUrl.pathname !== '/main-login' && !isPublicRoute) {
        middlewareLogger.warn({
          correlationId,
          path: request.nextUrl.pathname,
          action: 'redirect',
          reason: 'authentication_required',
        }, 'Protected route requires authentication, redirecting to login');
        
        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'authentication_required');
        
        logMiddlewareRouting(correlationId, request.nextUrl.pathname, false, '/main-login');
        
        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set('x-correlation-id', correlationId);
        return redirectResponse;
      }
    } else {
      // 用戶已認證 - 只在首次訪問或重要頁面時記錄
      const shouldLogAuth =
        isDevelopment() &&
        (request.nextUrl.pathname === '/admin' ||
          request.nextUrl.pathname === '/access' ||
          !request.headers.get('referer')); // 首次訪問（沒有 referer）

      if (shouldLogAuth) {
        logMiddlewareAuth(correlationId, true, user.id);
      }
      // 將用戶 ID 添加到回應 header，方便客戶端同步
      response.headers.set('X-User-ID', user.id);
      response.headers.set('X-User-Logged', 'true');
    }

    // 添加 correlation ID 到所有回應
    response.headers.set('x-correlation-id', correlationId);
    
    // 記錄請求完成
    const duration = Date.now() - startTime;
    middlewareLogger.info({
      correlationId,
      duration,
      status: 'completed',
      authenticated: true,
    }, 'Middleware request completed');
    
    return response;
  } catch (error) {
    middlewareLogger.error({
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname,
    }, 'Unexpected error in middleware');
    
    // 確保即使出錯也返回 correlation ID
    response.headers.set('x-correlation-id', correlationId);
    
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
