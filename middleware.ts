import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { DatabaseRecord } from '@/types/database/tables';
import { safeGet, safeString } from '@/types/database/helpers';
import { NextResponse, type NextRequest } from 'next/server';
import { isDevelopment, isProduction } from '@/lib/utils/env';
import {
  middlewareLogger,
  logMiddlewareRequest,
  logMiddlewareAuth,
  logMiddlewareRouting,
  getCorrelationId,
} from '@/lib/logger';
import {
  handleApiVersioning,
  addVersionHeadersToResponse,
  recordVersionUsage,
  type ApiVersion,
} from '@/lib/middleware/apiVersioning';
import {
  handleApiRedirect,
  isDeprecatedApiPath,
  getDeprecationHeaders,
} from '@/lib/middleware/apiRedirects';
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
    userAgent: request.headers.get('user-agent') || '',
  });

  // 公開路由 - 只有主登入頁面、密碼重設頁面和特定的 API 路由不需要認證
  // 注意：/_next/static, /_next/image, /favicon.ico 通常由 matcher 排除
  const publicRoutes = [
    '/main-login', // 登入頁面
    '/change-password', // 密碼更新頁面需要公開，用戶通過電郵連結訪問
    '/new-password', // 密碼重設頁面需要公開，用戶通過電郵連結訪問
    '/api/health', // Health check API
    '/api/monitoring/health', // Consolidated monitoring health check (2025-08-11)
    '/api/monitoring/deep', // Deep health check (2025-08-11)
    '/api/metrics', // Consolidated metrics API (2025-08-11)
    '/api/v1/health', // v1 健康檢查 API (deprecated, redirects)
    '/api/v2/health', // v2 健康檢查 API (deprecated, redirects)
    '/api/v1/metrics', // v1 監控統計 API (deprecated, redirects)
    '/api/auth', // 認證相關 API
    '/api/print-label-html', // HTML 標籤預覽 API（用於測試和預覽）
    '/api/send-order-email', // 訂單郵件發送 API（用於內部調用）
    '/api/pdf-extract', // PDF 提取 API（用於內部 Server Action 調用）
    '/api/graphql', // GraphQL endpoint (allow app to handle auth)
  ];

  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route => {
    const matches = request.nextUrl.pathname.startsWith(route);
    if (matches) {
      middlewareLogger.debug(
        {
          correlationId,
          path: request.nextUrl.pathname,
          matchedRoute: route,
        },
        'Route matched public route pattern'
      );
    }
    return matches;
  });

  // 記錄路由決策
  logMiddlewareRouting(correlationId, request.nextUrl.pathname, isPublicRoute);

  // EMERGENCY: Alert API endpoints disabled (2025-08-13) - Security cleanup
  if (
    request.nextUrl.pathname.startsWith('/api/alerts/') ||
    request.nextUrl.pathname.startsWith('/api/v1/alerts/')
  ) {
    middlewareLogger.warn(
      {
        correlationId,
        path: request.nextUrl.pathname,
        action: 'blocked',
        reason: 'alert_api_disabled_for_security',
      },
      'Alert API endpoint access blocked - system cleanup in progress'
    );

    return new Response(
      JSON.stringify({
        error: 'Alert API Permanently Disabled',
        message: 'Alert system has been removed for security reasons',
        code: 'ALERT_API_REMOVED',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 410, // Gone
        headers: {
          'Content-Type': 'application/json',
          'X-Deprecation': 'Alert API permanently removed',
          'X-Correlation-ID': correlationId,
          'Cache-Control': 'no-store, no-cache',
          'X-Security-Notice': 'Alert system removed for security compliance',
        },
      }
    );
  }

  // API redirect handling for backward compatibility (2025-08-11)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Check for API redirects first
    const redirectResponse = handleApiRedirect(request);
    if (redirectResponse) {
      // Add deprecation headers if using old API version
      if (isDeprecatedApiPath(request.nextUrl.pathname)) {
        const deprecationHeaders = getDeprecationHeaders(request.nextUrl.pathname);
        Object.entries(deprecationHeaders).forEach(([key, value]) => {
          redirectResponse.headers.set(key, value as string);
        });
      }
      return redirectResponse;
    }
  }

  // API 版本管理處理 (v1.8 新增)
  let processedRequest = request;
  let apiVersion = 'v1'; // 預設版本
  let versionInfo: DatabaseRecord | undefined = undefined;

  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const versioningResult = await handleApiVersioning(request, correlationId);

      if (versioningResult.response) {
        // 版本錯誤，直接返回錯誤回應
        recordVersionUsage(versioningResult.version, true);
        return versioningResult.response;
      }

      processedRequest = versioningResult.request;
      apiVersion = versioningResult.version;
      // 策略4: unknown + type narrowing - 安全的類型轉換
      versionInfo = versioningResult.versionInfo as unknown as DatabaseRecord;

      // 記錄版本使用
      recordVersionUsage(apiVersion, false);
    } catch (error) {
      middlewareLogger.warn(
        {
          correlationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'API versioning failed, continuing with default version'
      );
    }
  }

  if (isPublicRoute) {
    // 改為 debug level 減少噪音
    middlewareLogger.debug(
      {
        correlationId,
        path: request.nextUrl.pathname,
        action: 'allow',
        reason: 'public_route',
      },
      'Public route access allowed'
    );

    // 創建基礎回應
    let response = NextResponse.next({
      request: {
        headers: processedRequest.headers,
      },
    });

    // 添加 correlation ID 到回應
    response.headers.set('x-correlation-id', correlationId);

    // 添加 API 版本 headers (v1.8 新增)
    if (processedRequest.nextUrl.pathname.startsWith('/api/')) {
      response = addVersionHeadersToResponse(
        response,
        apiVersion,
        versionInfo as unknown as ApiVersion | undefined
      );
    }

    // 記錄請求完成時間
    const duration = Date.now() - startTime;
    // 改為 debug level 減少噪音
    middlewareLogger.debug(
      {
        correlationId,
        duration,
        status: 'allowed',
        apiVersion: processedRequest.nextUrl.pathname.startsWith('/api/') ? apiVersion : undefined,
      },
      'Middleware request completed'
    );

    return response; // 直接放行公開路由
  }

  // 創建基礎回應
  let response = NextResponse.next({
    request: {
      headers: processedRequest.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    middlewareLogger.error(
      {
        correlationId,
        error: 'Supabase configuration missing',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      },
      'Critical configuration error: Supabase URL or Anon Key is missing'
    );

    // 如果Supabase配置缺失，可能直接返回錯誤或重定向到一個錯誤頁面
    response.headers.set('x-correlation-id', correlationId);
    return response;
  }

  // 用於追蹤是否已經記錄過 cookie 檢查
  let cookieLoggedForThisRequest = false;

  // 創建 Supabase client - 與前端保持一致的配置
  // 使用處理過的請求 (v1.8 版本管理)
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'sb-bbmkuiplnzvpudszrend-auth-token', // 與前端統一
      flowType: 'pkce',
    },
    cookies: {
      get(name: string) {
        const cookie = processedRequest.cookies.get(name);
        // 只在開發環境且第一次檢查主要認證 cookie 時記錄
        if (
          isDevelopment() &&
          name.includes('auth-token') &&
          !name.match(/\.\d+$/) &&
          !cookieLoggedForThisRequest
        ) {
          middlewareLogger.debug(
            {
              correlationId,
              cookieName: name,
              path: request.nextUrl.pathname,
            },
            'Checking auth cookie'
          );
          cookieLoggedForThisRequest = true;
        }
        return cookie?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // 只記錄重要的 cookie 設置操作
        if (name.includes('auth-token') && !name.match(/\.\d+$/)) {
          middlewareLogger.debug(
            {
              correlationId,
              cookieName: name,
              hasValue: !!value,
            },
            'Setting auth cookie'
          );
        }

        // 設置 request cookie
        processedRequest.cookies.set({
          name,
          value,
          ...options,
        });

        // 創建新嘅回應並設置 cookie
        response = NextResponse.next({
          request: {
            headers: processedRequest.headers,
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
        middlewareLogger.debug(
          {
            correlationId,
            cookieName: name,
          },
          'Removing cookie'
        );

        // 從 request 中移除
        processedRequest.cookies.delete(name);

        // 創建新嘅回應並移除 cookie
        response = NextResponse.next({
          request: {
            headers: processedRequest.headers,
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

      // 優雅處理用戶獲取錯誤 - 讓應用自行處理身份驗證
      // 只對非公開路由記錄錯誤，但不強制重定向
      if (!isPublicRoute) {
        middlewareLogger.warn(
          {
            correlationId,
            path: request.nextUrl.pathname,
            error: userError.message,
            action: 'continue',
            reason: 'allow_app_auth_handling',
          },
          'User fetch failed, allowing app to handle authentication'
        );

        // 添加錯誤標頭讓應用層處理
        response.headers.set('X-Auth-Error', userError.message);
        response.headers.set('X-User-Logged', 'false');
      }
    }

    if (!user) {
      // 對於 admin 路由，強制重定向到登入頁面
      if (request.nextUrl.pathname.startsWith('/admin/')) {
        // 改為 debug level 減少噪音
        middlewareLogger.debug(
          {
            correlationId,
            path: request.nextUrl.pathname,
            action: 'redirect',
            reason: 'admin_route_requires_auth',
          },
          'Admin route requires authentication, redirecting to login'
        );

        const redirectUrl = new URL('/main-login', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        redirectUrl.searchParams.set('error', 'admin_authentication_required');

        logMiddlewareRouting(correlationId, request.nextUrl.pathname, false, '/main-login');

        const redirectResponse = NextResponse.redirect(redirectUrl);
        redirectResponse.headers.set('x-correlation-id', correlationId);
        // 添加快取控制頭以防止部署不匹配問題
        redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        redirectResponse.headers.set('Pragma', 'no-cache');
        redirectResponse.headers.set('Expires', '0');
        return redirectResponse;
      }
      // 對於其他非公開路由，保持原有重定向邏輯
      else if (request.nextUrl.pathname !== '/main-login' && !isPublicRoute) {
        middlewareLogger.warn(
          {
            correlationId,
            path: request.nextUrl.pathname,
            action: 'redirect',
            reason: 'authentication_required',
          },
          'Protected route requires authentication, redirecting to login'
        );

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
        (request.nextUrl.pathname === '/admin' || !request.headers.get('referer')); // 首次訪問（沒有 referer）

      if (shouldLogAuth) {
        logMiddlewareAuth(correlationId, true, user.id);
      }
      // 將用戶 ID 添加到回應 header，方便客戶端同步
      response.headers.set('X-User-ID', user.id);
      response.headers.set('X-User-Logged', 'true');
    }

    // 添加 correlation ID 到所有回應
    response.headers.set('x-correlation-id', correlationId);

    // 添加 API 版本 headers (v1.8 新增)
    if (processedRequest.nextUrl.pathname.startsWith('/api/')) {
      response = addVersionHeadersToResponse(
        response,
        apiVersion,
        versionInfo as unknown as ApiVersion | undefined
      );
    }

    // 記錄請求完成
    const duration = Date.now() - startTime;
    // 改為 debug level 減少噪音
    middlewareLogger.debug(
      {
        correlationId,
        duration,
        status: 'completed',
        authenticated: true,
        apiVersion: processedRequest.nextUrl.pathname.startsWith('/api/') ? apiVersion : undefined,
      },
      'Middleware request completed'
    );

    return response;
  } catch (error) {
    middlewareLogger.error(
      {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: processedRequest.nextUrl.pathname,
      },
      'Unexpected error in middleware'
    );

    // 確保即使出錯也返回 correlation ID
    response.headers.set('x-correlation-id', correlationId);

    // 添加 API 版本 headers (v1.8 新增)
    if (processedRequest.nextUrl.pathname.startsWith('/api/')) {
      response = addVersionHeadersToResponse(
        response,
        apiVersion,
        versionInfo as unknown as ApiVersion | undefined
      );
    }

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
