/**
 * Security headers configuration for Next.js application
 * Implements defense-in-depth security strategy
 */

export const securityHeaders = [
  // Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: [
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
    ].join('; '),
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
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
    ].join(', '),
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
 * @returns Array of security headers
 */
export function getSecurityHeaders(isDevelopment: boolean = false) {
  if (isDevelopment) {
    // Relax CSP for development
    const headers = [...securityHeaders];
    const cspIndex = headers.findIndex(h => h.key === 'Content-Security-Policy');
    if (cspIndex !== -1) {
      headers[cspIndex] = {
        key: 'Content-Security-Policy',
        value: [
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
        ].join('; '),
      };
    }
    return headers;
  }
  return securityHeaders;
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_COOKIE = 'csrf-token';

  /**
   * Generate a cryptographically secure CSRF token
   * @returns CSRF token
   */
  static generateToken(): string {
    if (typeof window === 'undefined') {
      // Server-side: use Node.js crypto
      const crypto = require('crypto');
      return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    } else {
      // Client-side: use Web Crypto API
      const array = new Uint8Array(this.TOKEN_LENGTH);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  }

  /**
   * Validate CSRF token from request
   * @param requestToken - Token from request header
   * @param sessionToken - Token from session/cookie
   * @returns boolean indicating if tokens match
   */
  static validateToken(requestToken: string | null, sessionToken: string | null): boolean {
    if (!requestToken || !sessionToken) {
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
   * Get CSRF token header name
   * @returns Header name for CSRF token
   */
  static getTokenHeader(): string {
    return this.TOKEN_HEADER;
  }

  /**
   * Get CSRF token cookie name
   * @returns Cookie name for CSRF token
   */
  static getTokenCookie(): string {
    return this.TOKEN_COOKIE;
  }
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // Maximum login attempts per IP per hour
  maxLoginAttempts: 5,
  // Lock duration in minutes after max attempts
  lockoutDuration: 30,
  // Password reset attempts per email per day
  maxPasswordResetAttempts: 3,
  // Registration attempts per IP per day
  maxRegistrationAttempts: 3,
};

/**
 * Session security configuration
 */
export const sessionConfig = {
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
};
