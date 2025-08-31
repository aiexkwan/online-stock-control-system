/**
 * Enhanced Session Management
 * Prevents session fixation and improves security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { randomBytes } from 'crypto';
import type { User } from '@supabase/supabase-js';

interface SessionConfig {
  maxAge: number; // milliseconds
  refreshThreshold: number; // milliseconds
  rotateOnLogin: boolean;
  secureCookie: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

interface SessionValidationResult {
  valid: boolean;
  expired?: boolean;
  needsRefresh?: boolean;
  user?: User;
}

const DEFAULT_CONFIG: SessionConfig = {
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
  refreshThreshold: 15 * 60 * 1000, // 15 minutes (優化：提前刷新會話)
  rotateOnLogin: true,
  secureCookie: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

/**
 * Session Manager Class
 */
export class SessionManager {
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Rotate session ID (prevent session fixation)
   */
  async rotateSession(_request: NextRequest): Promise<string> {
    // Generate new session ID
    const newSessionId = randomBytes(32).toString('hex');

    // In production, this would:
    // 1. Copy existing session data
    // 2. Delete old session
    // 3. Create new session with new ID
    // 4. Update client cookie

    return newSessionId;
  }

  /**
   * Validate session with parallel checks for improved performance
   */
  async validateSession(request: NextRequest): Promise<SessionValidationResult> {
    try {
      // Get Supabase session with parallel validation approaches
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );

      // 並行會話驗證：同時檢查 session 和 user 狀態
      const validationResults = await Promise.allSettled([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      let session: any = null;
      let user: User | null = null;

      // 處理會話檢查結果
      if (validationResults[0].status === 'fulfilled' && !validationResults[0].value.error) {
        session = validationResults[0].value.data.session;
      }

      // 處理用戶檢查結果
      if (validationResults[1].status === 'fulfilled' && !validationResults[1].value.error) {
        user = validationResults[1].value.data.user;
      }

      // 如果沒有 session 但有 user，或者都沒有，視為無效
      if (!session && !user) {
        return { valid: false, expired: true };
      }

      // 優先使用 session，但如果沒有 session 但有 user，也可接受
      const validSession = session || user;
      const sessionUser: User | null = session?.user || user;

      if (!validSession || !sessionUser) {
        return { valid: false, expired: true };
      }

      // Check session age (use expires_at as fallback if created_at is not available)
      let needsRefresh = false;
      if (session?.expires_at) {
        const expiresAt = new Date(session.expires_at).getTime();
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // 如果距離過期時間小於刷新閾值，需要刷新
        needsRefresh = timeUntilExpiry < this.config.refreshThreshold;

        // 如果已經過期，返回無效
        if (timeUntilExpiry <= 0) {
          return { valid: false, expired: true };
        }
      }

      return {
        valid: true,
        needsRefresh,
        user: sessionUser,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Refresh session with retry mechanism and improved error handling
   */
  async refreshSession(request: NextRequest, retryAttempts: number = 2): Promise<boolean> {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // 重試機制：最多嘗試指定次數，間隔時間遞增
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const { error } = await supabase.auth.refreshSession();

        if (!error) {
          if (attempt > 0) {
            console.log(`[SessionManager] Session refresh succeeded on attempt ${attempt + 1}`);
          }
          return true;
        }

        // 如果是最後一次嘗試，記錄錯誤並返回失敗
        if (attempt === retryAttempts) {
          console.error('Session refresh failed after all attempts:', error);
          return false;
        }

        // 等待遞增的時間後重試 (200ms, 400ms, 800ms)
        const waitTime = 200 * Math.pow(2, attempt);
        console.warn(
          `[SessionManager] Session refresh attempt ${attempt + 1} failed, retrying in ${waitTime}ms:`,
          error
        );

        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error) {
        if (attempt === retryAttempts) {
          console.error('Session refresh error after all attempts:', error);
          return false;
        }

        // 等待後重試
        const waitTime = 200 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return false;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(request: NextRequest): Promise<void> {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Session invalidation error:', error);
    }
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(request: NextRequest): {
    ip?: string;
    userAgent?: string;
    timestamp: number;
  } {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    return {
      ip,
      userAgent,
      timestamp: Date.now(),
    };
  }

  /**
   * Session middleware
   */
  async middleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const validation = await this.validateSession(request);

    if (!validation.valid) {
      return NextResponse.json({ error: 'Session expired or invalid' }, { status: 401 });
    }

    // Refresh if needed
    if (validation.needsRefresh) {
      await this.refreshSession(request);
    }

    // Add session info to response headers
    const response = await handler();

    if (validation.user?.id) {
      response.headers.set('X-Session-Valid', 'true');
      response.headers.set('X-Session-User', validation.user.id);
    }

    return response;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

/**
 * Simplified Session activity tracker - relies on Supabase Auth's built-in session management
 */
export class SessionActivityTracker {
  /**
   * Setup minimal activity tracking - rely on Supabase Auth for session refresh
   */
  static setupListeners(): void {
    if (typeof window === 'undefined') return;

    // Minimal activity tracking - let Supabase handle session refresh automatically
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        // Just trigger a custom event for other components that might need it
        window.dispatchEvent(new CustomEvent('user-activity'));
      });
    });
  }
}
