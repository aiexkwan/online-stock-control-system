/**
 * API Redirect Middleware for Backward Compatibility
 * Handles redirects from old API versions to new consolidated structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { middlewareLogger } from '@/lib/logger';

// Redirect mapping from old paths to new paths
const API_REDIRECT_MAP: Record<string, string> = {
  // v1 health endpoints - redirect to main health endpoint
  '/api/v1/health': '/api/health',
  '/api/v1/health/deep': '/api/health', // Deep health check removed

  // v2 health endpoint - redirect to main health endpoint
  '/api/v2/health': '/api/health',

  // v1 alerts endpoints
  '/api/v1/alerts/config': '/api/alerts/config',
  '/api/v1/alerts/history': '/api/alerts/history',
  '/api/v1/alerts/notifications': '/api/alerts/notifications',
  '/api/v1/alerts/rules': '/api/alerts/rules',

  // v1 metrics endpoints
  '/api/v1/metrics': '/api/metrics',
  '/api/v1/metrics/business': '/api/metrics/business',
  '/api/v1/metrics/database': '/api/metrics/database',

  // v1 cache endpoints
  '/api/v1/cache/metrics': '/api/cache/metrics',
};

/**
 * Handle API redirects for backward compatibility
 */
export function handleApiRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // Check for exact match
  if (API_REDIRECT_MAP[pathname]) {
    const newPath = API_REDIRECT_MAP[pathname];
    const url = request.nextUrl.clone();
    url.pathname = newPath;

    middlewareLogger.info(
      {
        oldPath: pathname,
        newPath,
        method: request.method,
      },
      'API redirect for backward compatibility'
    );

    // Use 308 Permanent Redirect to preserve the HTTP method
    return NextResponse.redirect(url, { status: 308 });
  }

  // Check for pattern matches (e.g., /api/v1/alerts/rules/[id])
  if (pathname.startsWith('/api/v1/alerts/rules/') && pathname !== '/api/v1/alerts/rules') {
    const newPath = pathname.replace('/api/v1/alerts/rules/', '/api/alerts/rules/');
    const url = request.nextUrl.clone();
    url.pathname = newPath;

    middlewareLogger.info(
      {
        oldPath: pathname,
        newPath,
        method: request.method,
      },
      'API redirect for dynamic route'
    );

    return NextResponse.redirect(url, { status: 308 });
  }

  return null;
}

/**
 * Get deprecation headers for old API versions
 */
export function getDeprecationHeaders(pathname: string): HeadersInit {
  const headers: HeadersInit = {};

  if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/v2/')) {
    headers['X-API-Deprecated'] = 'true';
    headers['X-API-Deprecation-Date'] = '2025-09-01';
    headers['X-API-Replacement'] = pathname
      .replace('/api/v1/', '/api/')
      .replace('/api/v2/', '/api/');
  }

  return headers;
}

/**
 * Check if a path is using a deprecated API version
 */
export function isDeprecatedApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/v1/') || pathname.startsWith('/api/v2/');
}
