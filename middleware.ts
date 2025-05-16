import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

// Middleware is fully disabled - no code executed, directly return NextResponse.next()
export async function middleware(req: NextRequest) {
  console.log(`[Supabase Middleware] Path: ${req.nextUrl.pathname} - ENTER (Supabase Auth logic commented out)`);
  const res = NextResponse.next();

  /*
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase Middleware] Supabase URL or Anon Key is missing in env.');
    // 如果缺少關鍵配置，可能需要阻止後續 Supabase client 初始化
    return res; 
  }

  // 這是 createMiddlewareClient 的標準用法
  const supabase = createMiddlewareClient({ req, res }, {
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseAnonKey,
  });

  try {
    console.log('[Supabase Middleware] Attempting supabase.auth.getSession()...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession(); 

    if (sessionError) {
      console.error('[Supabase Middleware] Error from getSession():', sessionError.message);
    }

    if (session) {
      console.log(`[Supabase Middleware] Session FOUND for user: ${session.user.id}.`);
    } else {
      console.log('[Supabase Middleware] No session found by supabase.auth.getSession().');
    }

    // 在 getSession 之後，檢查響應中設置了哪些 cookies
    const responseCookies = res.cookies.getAll();
    console.log('[Supabase Middleware] Cookies in RESPONSE after getSession():', responseCookies.map(c => `${c.name}=${c.value ? '[HAS_VALUE]' : '[EMPTY]'}; Path=${c.path}; HttpOnly=${c.httpOnly}; SameSite=${c.sameSite}; Expires=${c.expires}`).join(' || '));
    
    // 特別檢查 sb-access-token 和 sb-refresh-token
    const accessToken = responseCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-access-token'));
    const refreshToken = responseCookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-refresh-token'));
    
    if (accessToken) {
      console.log('[Supabase Middleware] Access token FOUND in response cookies after getSession.');
    } else {
      console.warn('[Supabase Middleware] Access token NOT FOUND in response cookies after getSession.');
    }
    if (refreshToken) {
      console.log('[Supabase Middleware] Refresh token FOUND in response cookies after getSession.');
    } else {
      console.warn('[Supabase Middleware] Refresh token NOT FOUND in response cookies after getSession.');
    }

  } catch (error: any) {
    console.error('[Supabase Middleware] Error during supabase.auth.getSession() block:', error.message);
  }
  */
  
  console.log(`[Supabase Middleware] Path: ${req.nextUrl.pathname} - EXIT (Supabase Auth logic commented out)`);
  return res;
}

export const config = {
  // 恢復到更通用的 matcher，確保所有相關頁面都經過 middleware
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 