/**
 * API 版本管理中間件
 * v1.8 系統優化 - API 版本控制和協商
 * 支援 URL 路徑版本和 Header 版本協商
 */

import { NextRequest, NextResponse } from 'next/server';
import { middlewareLogger } from '@/lib/logger';

export interface ApiVersion {
  version: string;
  isSupported: boolean;
  isDeprecated: boolean;
  deprecationDate?: string;
  supportEndDate?: string;
}

export interface VersioningConfig {
  defaultVersion: string;
  supportedVersions: ApiVersion[];
  enablePathVersioning: boolean;
  enableHeaderVersioning: boolean;
  enableContentNegotiation: boolean;
}

// API 版本配置
export const API_VERSIONING_CONFIG: VersioningConfig = {
  defaultVersion: 'v1',
  supportedVersions: [
    {
      version: 'v1',
      isSupported: true,
      isDeprecated: false,
    },
    {
      version: 'v2',
      isSupported: true,
      isDeprecated: false,
    },
  ],
  enablePathVersioning: true,
  enableHeaderVersioning: true,
  enableContentNegotiation: true,
};

/**
 * 從請求中提取 API 版本
 */
export function extractApiVersion(request: NextRequest): {
  version: string;
  source: 'path' | 'header' | 'default';
  originalPath: string;
} {
  const pathname = request.nextUrl.pathname;

  // 1. 優先檢查 URL 路徑版本 /api/v1/, /api/v2/
  if (API_VERSIONING_CONFIG.enablePathVersioning) {
    const pathVersionMatch = pathname.match(/^\/api\/(v\d+)\/(.*)/);
    if (pathVersionMatch) {
      const [, version, remainingPath] = pathVersionMatch;
      return {
        version,
        source: 'path',
        originalPath: `/api/${remainingPath}`,
      };
    }
  }

  // 2. 檢查 Header 版本協商
  if (API_VERSIONING_CONFIG.enableHeaderVersioning) {
    const acceptVersion =
      request.headers.get('Accept-Version') ||
      request.headers.get('API-Version') ||
      request.headers.get('X-API-Version');

    if (acceptVersion) {
      // 標準化版本格式 (移除可能的 'v' 前綴並添加回來)
      const normalizedVersion = acceptVersion.startsWith('v') ? acceptVersion : `v${acceptVersion}`;

      return {
        version: normalizedVersion,
        source: 'header',
        originalPath: pathname,
      };
    }
  }

  // 3. 使用預設版本
  return {
    version: API_VERSIONING_CONFIG.defaultVersion,
    source: 'default',
    originalPath: pathname,
  };
}

/**
 * 驗證 API 版本是否受支援
 */
export function validateApiVersion(version: string): {
  isValid: boolean;
  versionInfo?: ApiVersion;
  error?: string;
} {
  const versionInfo = API_VERSIONING_CONFIG.supportedVersions.find(v => v.version === version);

  if (!versionInfo) {
    return {
      isValid: false,
      error: `API version ${version} is not supported. Supported versions: ${API_VERSIONING_CONFIG.supportedVersions
        .map(v => v.version)
        .join(', ')}`,
    };
  }

  if (!versionInfo.isSupported) {
    return {
      isValid: false,
      versionInfo,
      error: `API version ${version} is no longer supported`,
    };
  }

  return {
    isValid: true,
    versionInfo,
  };
}

/**
 * 創建版本化的回應 headers
 */
export function createVersionHeaders(
  version: string,
  versionInfo?: ApiVersion
): Record<string, string> {
  const headers: Record<string, string> = {
    'API-Version': version,
    'X-API-Version': version,
  };

  if (versionInfo?.isDeprecated) {
    headers['Deprecation'] = 'true';
    if (versionInfo.deprecationDate) {
      headers['Deprecation-Date'] = versionInfo.deprecationDate;
    }
    if (versionInfo.supportEndDate) {
      headers['Sunset'] = versionInfo.supportEndDate;
    }
  }

  // 列出支援的版本
  headers['X-Supported-Versions'] = API_VERSIONING_CONFIG.supportedVersions
    .filter(v => v.isSupported)
    .map(v => v.version)
    .join(', ');

  return headers;
}

/**
 * 重寫請求 URL 為版本化路徑
 */
export function rewriteVersionedUrl(
  request: NextRequest,
  targetVersion: string,
  originalPath: string
): NextRequest {
  // 如果已經是版本化路徑，不需要重寫
  if (originalPath !== request.nextUrl.pathname) {
    return request;
  }

  // 將 /api/endpoint 重寫為 /api/v1/endpoint
  if (originalPath.startsWith('/api/') && !originalPath.match(/^\/api\/v\d+\//)) {
    const newPath = originalPath.replace(/^\/api\//, `/api/${targetVersion}/`);
    const url = request.nextUrl.clone();
    url.pathname = newPath;

    // 創建新的請求對象
    return new NextRequest(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }

  return request;
}

/**
 * 處理 API 版本協商和路由
 */
export async function handleApiVersioning(
  request: NextRequest,
  correlationId: string
): Promise<{
  request: NextRequest;
  response?: NextResponse;
  version: string;
  versionInfo?: ApiVersion;
}> {
  const startTime = Date.now();

  try {
    // 提取 API 版本
    const { version, source, originalPath } = extractApiVersion(request);

    // 驗證版本
    const { isValid, versionInfo, error } = validateApiVersion(version);

    // 記錄版本使用情況
    middlewareLogger.info(
      {
        correlationId,
        version,
        source,
        originalPath,
        pathname: request.nextUrl.pathname,
        isValid,
        isDeprecated: versionInfo?.isDeprecated || false,
      },
      'API version detected and validated'
    );

    if (!isValid) {
      // 返回版本不支援錯誤
      const errorResponse = NextResponse.json(
        {
          error: 'Unsupported API Version',
          message: error,
          supportedVersions: API_VERSIONING_CONFIG.supportedVersions
            .filter(v => v.isSupported)
            .map(v => v.version),
          correlationId,
        },
        { status: 400 }
      );

      // 添加版本 headers
      const versionHeaders = createVersionHeaders(version);
      Object.entries(versionHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return {
        request,
        response: errorResponse,
        version,
      };
    }

    // 記錄廢棄版本警告
    if (versionInfo?.isDeprecated) {
      middlewareLogger.warn(
        {
          correlationId,
          version,
          deprecationDate: versionInfo.deprecationDate,
          supportEndDate: versionInfo.supportEndDate,
        },
        'Deprecated API version used'
      );
    }

    // 重寫請求 URL (如果需要)
    const rewrittenRequest = rewriteVersionedUrl(request, version, originalPath);

    // 記錄處理時間
    const duration = Date.now() - startTime;
    middlewareLogger.debug(
      {
        correlationId,
        version,
        source,
        duration,
        rewritten: rewrittenRequest !== request,
      },
      'API versioning processing completed'
    );

    return {
      request: rewrittenRequest,
      version,
      versionInfo,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    middlewareLogger.error(
      {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      },
      'API versioning processing failed'
    );

    // 回退到預設版本
    return {
      request,
      version: API_VERSIONING_CONFIG.defaultVersion,
    };
  }
}

/**
 * 添加版本 headers 到回應
 */
export function addVersionHeadersToResponse(
  response: NextResponse,
  version: string,
  versionInfo?: ApiVersion
): NextResponse {
  const versionHeaders = createVersionHeaders(version, versionInfo);

  Object.entries(versionHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * 獲取版本統計信息
 */
export interface VersionStats {
  version: string;
  requestCount: number;
  errorCount: number;
  lastUsed: Date;
}

// 簡單的內存統計 (生產環境應使用 Redis 或數據庫)
const versionStats = new Map<string, VersionStats>();

/**
 * 記錄版本使用統計
 */
export function recordVersionUsage(version: string, isError: boolean = false): void {
  const existing = versionStats.get(version);

  if (existing) {
    existing.requestCount++;
    if (isError) existing.errorCount++;
    existing.lastUsed = new Date();
  } else {
    versionStats.set(version, {
      version,
      requestCount: 1,
      errorCount: isError ? 1 : 0,
      lastUsed: new Date(),
    });
  }
}

/**
 * 獲取版本使用統計
 */
export function getVersionStats(): VersionStats[] {
  return Array.from(versionStats.values());
}

/**
 * 清除版本統計
 */
export function clearVersionStats(): void {
  versionStats.clear();
}
