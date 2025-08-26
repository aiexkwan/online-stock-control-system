/**
 * CSRF Protection Implementation
 * Provides middleware and utilities for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') {
    // Server-side
    const crypto = require('crypto');
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  } else {
    // Client-side
    const array = new Uint8Array(TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * CSRF middleware for API routes
 */
export async function csrfProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler();
  }

  // Get token from cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  // Get token from header or body
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  // Validate tokens
  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
  }

  if (!timingSafeEqual(cookieToken, headerToken)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  // Token is valid, proceed with request
  return handler();
}

/**
 * Set CSRF token cookie
 */
export function setCSRFCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();

  response.cookies.set({
    name: CSRF_TOKEN_COOKIE,
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * React hook for CSRF protection
 */
export function useCSRFToken(): {
  token: string | null;
  headers: HeadersInit;
} {
  if (typeof window === 'undefined') {
    return { token: null, headers: {} };
  }

  // Get token from cookie
  const token =
    document.cookie
      .split('; ')
      .find(row => row.startsWith(CSRF_TOKEN_COOKIE))
      ?.split('=')[1] || null;

  return {
    token,
    headers: token ? { [CSRF_TOKEN_HEADER]: token } : {},
  };
}

/**
 * Fetch wrapper with CSRF protection
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(CSRF_TOKEN_COOKIE))
    ?.split('=')[1];

  if (token && !['GET', 'HEAD'].includes(options.method || 'GET')) {
    options.headers = {
      ...options.headers,
      [CSRF_TOKEN_HEADER]: token,
    };
  }

  return fetch(url, options);
}
