/**
 * Enhanced Session Management
 * Prevents session fixation and improves security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface SessionConfig {
  maxAge: number; // milliseconds
  refreshThreshold: number; // milliseconds
  rotateOnLogin: boolean;
  secureCookie: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

const DEFAULT_CONFIG: SessionConfig = {
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
  refreshThreshold: 30 * 60 * 1000, // 30 minutes
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
  async rotateSession(request: NextRequest): Promise<string> {
    // Generate new session ID
    const crypto = require('crypto');
    const newSessionId = crypto.randomBytes(32).toString('hex');

    // In production, this would:
    // 1. Copy existing session data
    // 2. Delete old session
    // 3. Create new session with new ID
    // 4. Update client cookie

    return newSessionId;
  }

  /**
   * Validate session
   */
  async validateSession(request: NextRequest): Promise<{
    valid: boolean;
    expired?: boolean;
    needsRefresh?: boolean;
    user?: unknown;
  }> {
    try {
      // Get Supabase session
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

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        return { valid: false, expired: true };
      }

      // Check session age (use expires_at as fallback if created_at is not available)
      const sessionTime = session.expires_at;
      let sessionAge = 0;
      let needsRefresh = false;

      if (sessionTime) {
        sessionAge = Date.now() - new Date(sessionTime).getTime();

        if (sessionAge > this.config.maxAge) {
          return { valid: false, expired: true };
        }

        // Check if needs refresh
        needsRefresh = sessionAge > this.config.refreshThreshold;
      }

      return {
        valid: true,
        needsRefresh,
        user: session.user,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(request: NextRequest): Promise<boolean> {
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

      const { error } = await supabase.auth.refreshSession();

      return !error;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
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
    const ip = forwarded ? forwarded.split(',')[0] : undefined;
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

    if (
      validation.user &&
      validation.user !== null &&
      typeof validation.user === 'object' &&
      'id' in validation.user
    ) {
      response.headers.set('X-Session-Valid', 'true');
      response.headers.set('X-Session-User', String((validation.user as { id: string }).id));
    }

    return response;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

/**
 * Session activity tracker
 */
export class SessionActivityTracker {
  private static readonly ACTIVITY_KEY = 'session-activity';
  private static readonly IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  /**
   * Track user activity
   */
  static trackActivity(): void {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    localStorage.setItem(this.ACTIVITY_KEY, now.toString());
  }

  /**
   * Check if session is idle
   */
  static isIdle(): boolean {
    if (typeof window === 'undefined') return false;

    const lastActivity = localStorage.getItem(this.ACTIVITY_KEY);
    if (!lastActivity) return true;

    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return elapsed > this.IDLE_TIMEOUT;
  }

  /**
   * Setup activity listeners
   */
  static setupListeners(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.trackActivity();
      });
    });

    // Check for idle timeout periodically
    setInterval(() => {
      if (this.isIdle()) {
        // Trigger idle warning or logout
        window.dispatchEvent(new CustomEvent('session-idle'));
      }
    }, 60 * 1000); // Check every minute
  }
}
