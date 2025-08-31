/**
 * CSRF Protection Implementation
 * Provides middleware and utilities for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_TOKEN_COOKIE = 'csrf-token' as const;
const CSRF_TOKEN_HEADER = 'x-csrf-token' as const;
const TOKEN_LENGTH = 32 as const;

// 類型定義
export interface CSRFTokenResult {
  token: string | null;
  headers: HeadersInit;
}

export interface CSRFProtectionOptions {
  exemptMethods?: readonly string[];
  cookieName?: string;
  headerName?: string;
}

export interface SecureFetchOptions extends RequestInit {
  includeCsrfToken?: boolean;
}

/**
 * Generate cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') {
    // Server-side
    const crypto = require('crypto') as typeof import('crypto');
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  } else {
    // Client-side
    const array = new Uint8Array(TOKEN_LENGTH);
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
      throw new Error('Crypto API not available');
    }
    crypto.getRandomValues(array);
    return Array.from(array, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
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
  handler: () => Promise<NextResponse>,
  options: CSRFProtectionOptions = {}
): Promise<NextResponse> {
  const {
    exemptMethods = ['GET', 'HEAD', 'OPTIONS'] as const,
    cookieName = CSRF_TOKEN_COOKIE,
    headerName = CSRF_TOKEN_HEADER,
  } = options;

  // Skip CSRF for safe methods
  if (exemptMethods.includes(request.method)) {
    return handler();
  }

  try {
    // Get token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(cookieName)?.value;

    // Get token from header or body
    const headerToken = request.headers.get(headerName);

    // Validate tokens
    if (!cookieToken || !headerToken) {
      return NextResponse.json(
        { error: 'CSRF token missing', code: 'CSRF_TOKEN_MISSING' },
        { status: 403 }
      );
    }

    if (!timingSafeEqual(cookieToken, headerToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', code: 'CSRF_TOKEN_INVALID' },
        { status: 403 }
      );
    }

    // Token is valid, proceed with request
    return handler();
  } catch (error) {
    console.error('CSRF protection error:', error);
    return NextResponse.json(
      { error: 'CSRF protection failed', code: 'CSRF_PROTECTION_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Set CSRF token cookie
 */
export function setCSRFCookie(
  response: NextResponse,
  token?: string,
  cookieName: string = CSRF_TOKEN_COOKIE
): string {
  const csrfToken = token || generateCSRFToken();

  response.cookies.set({
    name: cookieName,
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return csrfToken;
}

/**
 * Get CSRF token from request
 */
export function getCSRFToken(
  request: NextRequest,
  cookieName: string = CSRF_TOKEN_COOKIE
): string | null {
  return request.cookies.get(cookieName)?.value || null;
}

/**
 * React hook for CSRF protection
 */
export function useCSRFToken(
  cookieName: string = CSRF_TOKEN_COOKIE,
  headerName: string = CSRF_TOKEN_HEADER
): CSRFTokenResult {
  if (typeof window === 'undefined') {
    return { token: null, headers: {} };
  }

  // Get token from cookie with proper parsing
  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  };

  const token = getCookieValue(cookieName);

  return {
    token,
    headers: token ? { [headerName]: token } : {},
  };
}

/**
 * Fetch wrapper with CSRF protection
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const {
    includeCsrfToken = true,
    method = 'GET',
    headers: originalHeaders = {},
    ...restOptions
  } = options;

  // Helper function to get cookie value
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  };

  const token = getCookieValue(CSRF_TOKEN_COOKIE);
  const needsToken =
    includeCsrfToken && token && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

  const headers: HeadersInit = {
    ...originalHeaders,
    ...(needsToken ? { [CSRF_TOKEN_HEADER]: token } : {}),
  };

  try {
    return await fetch(url, {
      ...restOptions,
      method,
      headers,
    });
  } catch (error) {
    console.error('Secure fetch error:', error);
    throw error;
  }
}
