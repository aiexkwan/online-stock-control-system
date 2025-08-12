# Security Audit Report - API Consolidation
**Date:** 2025-08-11  
**System:** Online Stock Control System  
**Audit Focus:** API Consolidation Security Implications

## Executive Summary

The API consolidation from `/api/v1/*` and `/api/v2/*` to `/api/*` has been reviewed for security implications. While the implementation includes several security controls, there are **critical vulnerabilities** that require immediate attention.

### Risk Summary
- **CRITICAL:** 2 issues
- **HIGH:** 3 issues  
- **MEDIUM:** 4 issues
- **LOW:** 2 issues

## Critical Security Findings

### 1. ❌ CRITICAL: Overly Permissive CORS Configuration
**Location:** `/app/api/graphql/route.ts`, `/app/api/send-order-email/route.ts`
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // CRITICAL: Allows any origin
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```
**Risk:** Allows any website to make requests to your API, enabling:
- Cross-site request forgery (CSRF) attacks
- Data exfiltration from malicious websites
- Unauthorized API access from untrusted domains

**OWASP Reference:** A07:2021 – Identification and Authentication Failures

### 2. ❌ CRITICAL: Sensitive Information Disclosure in Health Endpoints
**Location:** `/app/api/monitoring/health/route.ts`
```typescript
return NextResponse.json({
  environment: process.env.NODE_ENV || 'development',
  appVersion: process.env.npm_package_version || '0.1.0',
  services: {
    database: 'healthy',
    authentication: 'healthy',
    cache: 'healthy',
  },
})
```
**Risk:** Exposes internal system information publicly without authentication:
- Application version (enables targeted exploit attempts)
- Environment details
- Service status information

**OWASP Reference:** A01:2021 – Broken Access Control

## High Severity Findings

### 3. ⚠️ HIGH: Missing Authentication on Sensitive Endpoints
**Location:** `/app/api/alerts/config/route.ts`
```typescript
export async function GET() {
  // No authentication check before returning configuration
  return NextResponse.json(response);
}
```
**Risk:** Alert configuration endpoints lack authentication verification at the handler level, relying solely on middleware.

### 4. ⚠️ HIGH: Insufficient Rate Limiting Implementation
**Location:** `/lib/graphql/middleware/query-complexity.ts`
```typescript
const rateLimitStore = new Map(); // In-memory storage
```
**Risk:** 
- Rate limiting uses in-memory storage (not distributed)
- No rate limiting on REST API endpoints
- Vulnerable to distributed attacks

### 5. ⚠️ HIGH: Error Stack Traces in Development Mode
**Location:** `/lib/unified-error-handler.ts`
```typescript
console.error('Alert config GET failed:', error);
// Stack traces may be exposed based on NODE_ENV
```
**Risk:** If NODE_ENV is not properly set in production, stack traces could leak sensitive information.

## Medium Severity Findings

### 6. ⚠️ MEDIUM: Redirect Without Validation
**Location:** `/lib/middleware/apiRedirects.ts`
```typescript
const url = request.nextUrl.clone();
url.pathname = newPath;
return NextResponse.redirect(url, { status: 308 });
```
**Risk:** No validation of redirect destinations could potentially be exploited.

### 7. ⚠️ MEDIUM: Weak Input Validation
**Location:** `/app/api/alerts/config/route.ts`
```typescript
const body = await request.json(); // No schema validation
```
**Risk:** Missing input validation using schemas (like Zod) for API endpoints.

### 8. ⚠️ MEDIUM: Missing Security Headers
**Finding:** No implementation of security headers like:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### 9. ⚠️ MEDIUM: API Version Information Disclosure
**Location:** Response headers expose API version information
```typescript
headers: {
  'API-Version': 'v1',
  'X-API-Version': 'v1',
}
```

## Low Severity Findings

### 10. ℹ️ LOW: Deprecation Headers Information Leak
**Location:** `/lib/middleware/apiRedirects.ts`
```typescript
headers['X-API-Deprecation-Date'] = '2025-09-01';
```
**Risk:** Reveals timeline information about system changes.

### 11. ℹ️ LOW: Verbose Logging in Production
**Location:** Multiple files
```typescript
middlewareLogger.info({ oldPath, newPath, method }, 'API redirect');
```
**Risk:** Excessive logging could impact performance and leak information.

## Recommendations

### Immediate Actions (Critical - Implement within 24 hours)

#### 1. Fix CORS Configuration
```typescript
// Secure CORS implementation
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'];

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0],
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
});
```

#### 2. Secure Health Endpoints
```typescript
export async function GET(request: Request) {
  // Add authentication check for detailed health info
  const { user } = await validateAuth(request);
  
  if (!user) {
    // Return minimal info for unauthenticated requests
    return NextResponse.json({ status: 'healthy' });
  }
  
  // Return detailed info only for authenticated users
  return NextResponse.json({
    status: 'healthy',
    ...(user.role === 'admin' && {
      environment: process.env.NODE_ENV,
      services: { /* ... */ }
    })
  });
}
```

### Short-term Actions (High Priority - Within 1 week)

#### 3. Implement Proper Rate Limiting
```typescript
// Use Redis for distributed rate limiting
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function rateLimit(identifier: string) {
  const key = `rate_limit:${identifier}`;
  const limit = 100;
  const window = 60; // seconds
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, window);
  }
  
  if (count > limit) {
    throw new Error('Rate limit exceeded');
  }
}
```

#### 4. Add Authentication Verification
```typescript
// Add to all sensitive endpoints
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check specific permissions
  if (!hasPermission(user, 'alerts:read')) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  // Continue with request...
}
```

#### 5. Implement Security Headers Middleware
```typescript
// Add to middleware.ts
export function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (isProduction()) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
  }
  
  return response;
}
```

### Medium-term Actions (Within 1 month)

#### 6. Input Validation with Zod
```typescript
import { z } from 'zod';

const AlertConfigSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean(),
  thresholds: z.object({
    system: z.object({
      cpu: z.object({
        warning: z.number().min(0).max(100),
        critical: z.number().min(0).max(100),
      }),
    }),
  }),
});

export async function PUT(request: Request) {
  const body = await request.json();
  
  try {
    const validated = AlertConfigSchema.parse(body);
    // Process validated data...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

#### 7. Sanitize Error Messages
```typescript
export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    // Log full error internally
    console.error('[Internal]', error);
    
    // Return generic message to client
    return 'An error occurred processing your request';
  }
  
  // In development, return more details
  return error instanceof Error ? error.message : 'Unknown error';
}
```

## Security Testing Checklist

- [ ] Test CORS configuration with unauthorized origins
- [ ] Verify authentication on all sensitive endpoints
- [ ] Test rate limiting with automated requests
- [ ] Check error responses don't leak sensitive info
- [ ] Validate all input fields with malicious data
- [ ] Test redirect functionality for open redirect vulnerabilities
- [ ] Verify security headers are present in responses
- [ ] Perform penetration testing on consolidated endpoints

## Compliance Considerations

### OWASP Top 10 Coverage
- **A01:2021 Broken Access Control** - Addressed with authentication fixes
- **A02:2021 Cryptographic Failures** - Ensure HTTPS everywhere
- **A03:2021 Injection** - Input validation implementation
- **A07:2021 Identification and Authentication Failures** - Auth improvements
- **A09:2021 Security Logging and Monitoring Failures** - Enhance logging

### GDPR Compliance
- Ensure no PII in logs
- Implement proper data retention policies
- Add audit trails for data access

## Conclusion

The API consolidation has been implemented with backward compatibility in mind, but several critical security issues need immediate attention. The most pressing concerns are:

1. **CORS configuration** allowing any origin
2. **Information disclosure** in health endpoints
3. **Missing authentication** verification at handler level

Implementing the recommended fixes will significantly improve the security posture of the application. Priority should be given to critical and high-severity findings.

## Implementation Timeline

| Priority | Timeline | Issues to Address |
|----------|----------|------------------|
| Critical | 24 hours | CORS, Health endpoint info disclosure |
| High | 1 week | Authentication, Rate limiting, Error handling |
| Medium | 1 month | Input validation, Security headers, Logging |
| Low | 2 months | Documentation, Testing, Monitoring |

---

**Auditor:** Security Audit System  
**Review Required By:** System Administrator  
**Next Review Date:** 2025-09-11