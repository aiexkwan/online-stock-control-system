/**
 * Security headers configuration for Next.js application
 * Implements defense-in-depth security strategy
 */

/**
 * Interface for security header configuration
 */
export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

/**
 * Type for Content Security Policy directives
 */
type CSPDirective = string;

/**
 * Type for Permissions Policy features
 */
type PermissionsPolicyFeature = string;

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  readonly maxLoginAttempts: number;
  readonly lockoutDuration: number;
  readonly maxPasswordResetAttempts: number;
  readonly maxRegistrationAttempts: number;
}

/**
 * Configuration for session management
 */
export interface SessionConfig {
  readonly sessionTimeout: number;
  readonly refreshInterval: number;
  readonly enableRotation: boolean;
  readonly cookieOptions: {
    readonly httpOnly: boolean;
    readonly secure: boolean;
    readonly sameSite: 'strict' | 'lax' | 'none';
    readonly path: string;
  };
}

/**
 * Security headers array with strict typing
 */
export const securityHeaders: readonly SecurityHeader[] = [
  // Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: (
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://*.supabase.co",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'self'",
        "frame-src 'self'",
        "worker-src 'self' blob:",
        "form-action 'self'",
        "base-uri 'self'",
        "manifest-src 'self'",
        'upgrade-insecure-requests',
      ] as const satisfies readonly CSPDirective[]
    ).join('; '),
  },
  // Prevent clickjacking attacks
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy (formerly Feature Policy)
  {
    key: 'Permissions-Policy',
    value: (
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ] as const satisfies readonly PermissionsPolicyFeature[]
    ).join(', '),
  },
  // XSS Protection (for older browsers)
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // DNS Prefetch Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

/**
 * Get security headers for specific environments
 * @param isDevelopment - Whether running in development mode
 * @returns Array of security headers with proper typing
 */
export function getSecurityHeaders(isDevelopment: boolean = false): readonly SecurityHeader[] {
  if (isDevelopment) {
    // Relax CSP for development
    const headers: SecurityHeader[] = [...securityHeaders];
    const cspIndex = headers.findIndex(
      (h): h is SecurityHeader => h.key === 'Content-Security-Policy'
    );
    if (cspIndex !== -1) {
      headers[cspIndex] = {
        key: 'Content-Security-Policy',
        value: (
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://*.supabase.co http://localhost:*",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com ws://localhost:* http://localhost:*",
            "media-src 'self'",
            "object-src 'none'",
            "child-src 'self'",
            "frame-src 'self'",
            "worker-src 'self' blob:",
            "form-action 'self'",
            "base-uri 'self'",
            "manifest-src 'self'",
          ] as const satisfies readonly CSPDirective[]
        ).join('; '),
      };
    }
    return headers;
  }
  return securityHeaders;
}

/**
 * CSRF token generation and validation with enhanced type safety
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32 as const;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token' as const;
  private static readonly TOKEN_COOKIE = 'csrf-token' as const;

  /**
   * Generate a cryptographically secure CSRF token
   * @returns Promise resolving to CSRF token
   */
  static async generateToken(): Promise<string> {
    if (typeof window === 'undefined') {
      // Server-side: use Node.js crypto with dynamic import
      try {
        const { randomBytes } = await import('crypto');
        return randomBytes(this.TOKEN_LENGTH).toString('hex');
      } catch (error) {
        throw new Error(
          `Failed to generate CSRF token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } else {
      // Client-side: use Web Crypto API
      if (!globalThis.crypto?.getRandomValues) {
        throw new Error('Web Crypto API not available in this environment');
      }

      const array = new Uint8Array(this.TOKEN_LENGTH);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array, (byte: number): string => byte.toString(16).padStart(2, '0')).join(
        ''
      );
    }
  }

  /**
   * Validate CSRF token from request with timing-safe comparison
   * @param requestToken - Token from request header (nullable)
   * @param sessionToken - Token from session/cookie (nullable)
   * @returns boolean indicating if tokens match
   */
  static validateToken(
    requestToken: string | null | undefined,
    sessionToken: string | null | undefined
  ): boolean {
    // Type guard for token validation
    if (!this.isValidTokenString(requestToken) || !this.isValidTokenString(sessionToken)) {
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    if (requestToken.length !== sessionToken.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < requestToken.length; i++) {
      mismatch |= requestToken.charCodeAt(i) ^ sessionToken.charCodeAt(i);
    }

    return mismatch === 0;
  }

  /**
   * Type guard to check if a value is a valid token string
   * @param token - Token to validate
   * @returns boolean indicating if token is valid
   */
  private static isValidTokenString(token: unknown): token is string {
    return typeof token === 'string' && token.length > 0;
  }

  /**
   * Get CSRF token header name
   * @returns Header name for CSRF token
   */
  static getTokenHeader(): typeof CSRFProtection.TOKEN_HEADER {
    return this.TOKEN_HEADER;
  }

  /**
   * Get CSRF token cookie name
   * @returns Cookie name for CSRF token
   */
  static getTokenCookie(): typeof CSRFProtection.TOKEN_COOKIE {
    return this.TOKEN_COOKIE;
  }
}

/**
 * Rate limiting configuration with strict typing
 */
export const rateLimitConfig: RateLimitConfig = {
  // Maximum login attempts per IP per hour
  maxLoginAttempts: 5,
  // Lock duration in minutes after max attempts
  lockoutDuration: 30,
  // Password reset attempts per email per day
  maxPasswordResetAttempts: 3,
  // Registration attempts per IP per day
  maxRegistrationAttempts: 3,
} as const;

/**
 * Session security configuration with strict typing
 */
export const sessionConfig: SessionConfig = {
  // Session timeout in milliseconds (2 hours)
  sessionTimeout: 2 * 60 * 60 * 1000,
  // Session refresh interval (30 minutes)
  refreshInterval: 30 * 60 * 1000,
  // Enable session rotation on login
  enableRotation: true,
  // Secure cookie settings
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
  },
} as const;
