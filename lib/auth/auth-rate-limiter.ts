/**
 * Authentication Rate Limiter
 * Prevents brute force and password spray attacks
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  locked: boolean;
  lockExpiry?: number;
}

// Store for tracking attempts (use Redis in production)
const attemptStore = new Map<string, RateLimitEntry>();

// Configuration
const CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minutes
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Get client identifier
 */
function getClientId(request: NextRequest): string {
  // Use combination of IP and user agent for fingerprinting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Simple hash for privacy
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
}

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [key, entry] of attemptStore.entries()) {
    // Remove unlocked entries older than 1 hour
    if (!entry.locked && now - entry.lastAttempt > 60 * 60 * 1000) {
      attemptStore.delete(key);
    }
    // Remove locked entries after lock expiry
    if (entry.locked && entry.lockExpiry && now > entry.lockExpiry) {
      attemptStore.delete(key);
    }
  }
}

/**
 * Check rate limit for authentication endpoints
 */
export async function checkAuthRateLimit(
  request: NextRequest,
  endpoint: 'login' | 'register' | 'passwordReset'
): Promise<{ allowed: boolean; retryAfter?: number; message?: string }> {
  const clientId = getClientId(request);
  const config = CONFIG[endpoint];
  const now = Date.now();

  // Clean up periodically
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  // Get or create entry
  let entry = attemptStore.get(clientId);

  if (!entry) {
    entry = {
      attempts: 0,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    };
    attemptStore.set(clientId, entry);
  }

  // Check if locked
  if (entry.locked && entry.lockExpiry && now < entry.lockExpiry) {
    const retryAfter = Math.ceil((entry.lockExpiry - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Too many failed attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    };
  }

  // Reset if outside window
  if (now - entry.firstAttempt > config.windowMs) {
    entry.attempts = 0;
    entry.firstAttempt = now;
    entry.locked = false;
    entry.lockExpiry = undefined;
  }

  // Increment attempts
  entry.attempts++;
  entry.lastAttempt = now;

  // Check if should lock
  if (entry.attempts > config.maxAttempts) {
    entry.locked = true;
    entry.lockExpiry = now + config.lockoutMs;

    const retryAfter = Math.ceil(config.lockoutMs / 1000);
    return {
      allowed: false,
      retryAfter,
      message: `Account temporarily locked due to multiple failed attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    };
  }

  // Calculate remaining attempts
  const remaining = config.maxAttempts - entry.attempts;

  if (remaining <= 2) {
    return {
      allowed: true,
      message: `Warning: ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lock.`,
    };
  }

  return { allowed: true };
}

/**
 * Record successful authentication (reset attempts)
 */
export function recordSuccessfulAuth(request: NextRequest): void {
  const clientId = getClientId(request);
  attemptStore.delete(clientId);
}

/**
 * Rate limit middleware for authentication routes
 */
export async function authRateLimitMiddleware(
  request: NextRequest,
  endpoint: 'login' | 'register' | 'passwordReset',
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await checkAuthRateLimit(request, endpoint);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: result.message,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '1800',
          'X-RateLimit-Limit': CONFIG[endpoint].maxAttempts.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Add warning header if close to limit
  const response = await handler();

  if (result.message) {
    response.headers.set('X-RateLimit-Warning', result.message);
  }

  return response;
}

/**
 * Get rate limit status for a client
 */
export function getRateLimitStatus(
  request: NextRequest,
  endpoint: 'login' | 'register' | 'passwordReset'
): {
  attempts: number;
  maxAttempts: number;
  locked: boolean;
  lockExpiry?: Date;
} {
  const clientId = getClientId(request);
  const config = CONFIG[endpoint];
  const entry = attemptStore.get(clientId);

  if (!entry) {
    return {
      attempts: 0,
      maxAttempts: config.maxAttempts,
      locked: false,
    };
  }

  return {
    attempts: entry.attempts,
    maxAttempts: config.maxAttempts,
    locked: entry.locked,
    lockExpiry: entry.lockExpiry ? new Date(entry.lockExpiry) : undefined,
  };
}
