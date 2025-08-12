/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

import { NextResponse } from 'next/server';

interface RateLimitOptions {
  windowMs?: number;  // Time window in milliseconds
  max?: number;       // Max requests per window
  message?: string;   // Error message
  keyGenerator?: (request: Request) => string; // Custom key generator
}

interface RateLimitResult {
  success: boolean;
  message?: string;
  remaining?: number;
  reset?: Date;
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or external service
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later',
    keyGenerator = (request: Request) => {
      // Default: Use IP address as key
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      const url = new URL(request.url);
      return `${ip}:${url.pathname}`;
    }
  } = options;

  return async (request: Request): Promise<RateLimitResult> => {
    const key = keyGenerator(request);
    const now = Date.now();
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new window
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment counter
      entry.count++;
    }
    
    // Check if limit exceeded
    if (entry.count > max) {
      return {
        success: false,
        message,
        remaining: 0,
        reset: new Date(entry.resetTime)
      };
    }
    
    return {
      success: true,
      remaining: max - entry.count,
      reset: new Date(entry.resetTime)
    };
  };
}

/**
 * Rate limiter specifically for cache operations
 * More restrictive than general API rate limiting
 */
export const cacheOperationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Only 5 cache operations per 5 minutes
  message: 'Too many cache operations. Please wait before trying again.',
  keyGenerator: (request: Request) => {
    // For cache operations, also consider user ID if available
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const url = new URL(request.url);
    // Could enhance this to include user ID from auth token
    return `cache:${ip}:${url.pathname}`;
  }
});

/**
 * Express middleware compatibility wrapper
 */
export async function rateLimitMiddleware(
  request: Request,
  options?: RateLimitOptions
): Promise<NextResponse | null> {
  const limiter = rateLimit(options);
  const result = await limiter(request);
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: result.message,
        retryAfter: result.reset
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.reset!.getTime() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': options?.max?.toString() || '100',
          'X-RateLimit-Remaining': result.remaining?.toString() || '0',
          'X-RateLimit-Reset': result.reset!.toISOString()
        }
      }
    );
  }
  
  return null;
}