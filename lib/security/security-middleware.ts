/**
 * Security Middleware
 * Integrates security monitoring into the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, SecurityEventType, SecuritySeverity } from './production-monitor';

/**
 * Security middleware for Next.js
 */
export async function securityMiddleware(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract request information
    const requestInfo = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      ip: (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      path: new URL(request.url).pathname,
    };

    // Define public routes that should skip security threat detection
    const publicRoutes = [
      '/', // Root route - common entry point that gets redirected via middleware
      '/main-login',
      '/change-password',
      '/new-password',
      '/api/health',
      '/api/monitoring/health',
      '/api/monitoring/deep',
      '/api/metrics',
      '/api/auth',
      '/_next/static',
      '/_next/image',
      '/favicon.ico',
      '/fonts',
      '/images',
    ];

    // Check if this is a public route
    const isPublicRoute = publicRoutes.some(route => requestInfo.path.startsWith(route));

    // Skip threat detection for public routes to avoid false positives
    let threats: any[] = [];
    if (!isPublicRoute) {
      // Get body if present (for POST/PUT/PATCH)
      let body: any;
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const clonedRequest = request.clone();
          body = await clonedRequest.json().catch(() => null);
        } catch {
          // Body parsing failed, continue without it
        }
      }

      // Get query parameters
      const query = Object.fromEntries(new URL(request.url).searchParams.entries());

      // Detect security threats only for protected routes
      threats = securityMonitor.detectThreats({
        url: requestInfo.url,
        method: requestInfo.method,
        headers: requestInfo.headers,
        body,
        query,
      });
    }

    // Log detected threats (only for non-public routes)
    if (!isPublicRoute) {
      for (const threat of threats) {
        securityMonitor.logEvent({
          type: threat,
          severity: SecuritySeverity.HIGH,
          ipAddress: requestInfo.ip,
          userAgent: requestInfo.userAgent,
          path: requestInfo.path,
          method: requestInfo.method,
          payload: {
            body: requestInfo.path.startsWith('/api/') ? 'REQUEST_BODY_REDACTED' : undefined,
            query: new URL(request.url).searchParams.toString()
              ? Object.fromEntries(new URL(request.url).searchParams.entries())
              : undefined,
          },
          metadata: {
            url: requestInfo.url,
            headers: requestInfo.headers,
          },
        });
      }
    }

    // Block request if critical threats detected (only in production)
    const criticalThreats = [
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
    ];

    const shouldBlockRequest =
      threats.some(t => criticalThreats.includes(t)) && process.env.NODE_ENV === 'production';

    if (shouldBlockRequest) {
      // Log blocked request
      securityMonitor.logEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecuritySeverity.CRITICAL,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        path: requestInfo.path,
        method: requestInfo.method,
        metadata: {
          reason: 'Security threat detected',
          threats,
        },
      });

      return new NextResponse(JSON.stringify({ error: 'Security violation detected' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (threats.length > 0) {
      // In development, just log threats but don't block
      securityMonitor.logEvent({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecuritySeverity.MEDIUM,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        path: requestInfo.path,
        method: requestInfo.method,
        metadata: {
          reason: 'Security threat detected (dev mode - not blocked)',
          threats,
        },
      });
    }

    // Check rate limiting
    const rateLimitKey = `${requestInfo.ip}:${requestInfo.path}`;
    const isAllowed = securityMonitor.checkRateLimit(
      rateLimitKey,
      100, // 100 requests
      60000 // per minute
    );

    if (!isAllowed) {
      return new NextResponse(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }

    // Log successful request (sample for performance)
    if (Math.random() < 0.1) {
      // Log 10% of successful requests
      securityMonitor.logEvent({
        type: SecurityEventType.SENSITIVE_DATA_ACCESS,
        severity: SecuritySeverity.INFO,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        path: requestInfo.path,
        method: requestInfo.method,
        metadata: {
          responseTime: Date.now() - startTime,
        },
      });
    }

    // Continue with request
    return NextResponse.next();
  } catch (error) {
    // Log error
    securityMonitor.logEvent({
      type: SecurityEventType.ERROR_SPIKE,
      severity: SecuritySeverity.MEDIUM,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Return error response
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Authentication monitoring hook
 */
export function monitorAuthentication(
  action: 'login' | 'logout' | 'register' | 'password-change',
  success: boolean,
  userId?: string,
  metadata?: any
) {
  const eventTypeMap = {
    login: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    logout: SecurityEventType.LOGOUT,
    register: SecurityEventType.LOGIN_SUCCESS,
    'password-change': SecurityEventType.PASSWORD_CHANGE,
  };

  securityMonitor.logEvent({
    type: eventTypeMap[action],
    severity: success ? SecuritySeverity.INFO : SecuritySeverity.MEDIUM,
    userId,
    metadata,
  });
}

/**
 * Data access monitoring hook
 */
export function monitorDataAccess(
  operation: 'read' | 'write' | 'delete' | 'export',
  resource: string,
  userId?: string,
  metadata?: any
) {
  const eventTypeMap = {
    read: SecurityEventType.SENSITIVE_DATA_ACCESS,
    write: SecurityEventType.DATA_MODIFICATION,
    delete: SecurityEventType.DATA_DELETION,
    export: SecurityEventType.BULK_DATA_EXPORT,
  };

  const severityMap = {
    read: SecuritySeverity.LOW,
    write: SecuritySeverity.MEDIUM,
    delete: SecuritySeverity.HIGH,
    export: SecuritySeverity.MEDIUM,
  };

  securityMonitor.logEvent({
    type: eventTypeMap[operation],
    severity: severityMap[operation],
    userId,
    metadata: {
      resource,
      ...metadata,
    },
  });
}

/**
 * Error monitoring hook
 */
export function monitorError(error: Error, context?: any) {
  // Check if error rate is anomalous
  const isAnomaly = securityMonitor.detectAnomaly('error_rate', 1);

  securityMonitor.logEvent({
    type: SecurityEventType.ERROR_SPIKE,
    severity: isAnomaly ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
    metadata: {
      error: error.message,
      stack: error.stack,
      context,
    },
  });
}

/**
 * Performance monitoring hook
 */
export function monitorPerformance(metric: string, value: number, metadata?: any) {
  // Check if performance is anomalous
  const isAnomaly = securityMonitor.detectAnomaly(metric, value);

  if (isAnomaly) {
    securityMonitor.logEvent({
      type: SecurityEventType.PERFORMANCE_DEGRADATION,
      severity: SecuritySeverity.MEDIUM,
      metadata: {
        metric,
        value,
        ...metadata,
      },
    });
  }
}

/**
 * File upload monitoring
 */
export async function monitorFileUpload(
  file: {
    name: string;
    size: number;
    type: string;
  },
  userId?: string
) {
  // Check for suspicious file types
  const suspiciousExtensions = ['.exe', '.dll', '.bat', '.sh', '.ps1', '.vbs'];
  const isSuspicious = suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (isSuspicious) {
    securityMonitor.logEvent({
      type: SecurityEventType.MALICIOUS_FILE_DETECTED,
      severity: SecuritySeverity.HIGH,
      userId,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    throw new Error('Suspicious file detected');
  }

  securityMonitor.logEvent({
    type: SecurityEventType.FILE_UPLOAD,
    severity: SecuritySeverity.INFO,
    userId,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  });
}

/**
 * Security headers middleware
 */
export function securityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
