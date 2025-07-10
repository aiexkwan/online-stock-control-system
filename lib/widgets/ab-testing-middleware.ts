/**
 * A/B Testing Middleware
 * 整合 A/B 測試到 Widget 加載流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { abTestManager, ABTestContext } from './ab-testing-framework';
import { dualLoadingAdapter } from './dual-loading-adapter';

// 中間件配置
export interface ABTestMiddlewareConfig {
  enabled: boolean;
  cookieName?: string;
  headerName?: string;
  excludedPaths?: string[];
  forcedVariants?: Map<string, string>; // 用於測試
}

const defaultConfig: ABTestMiddlewareConfig = {
  enabled: true,
  cookieName: 'ab_test_variant',
  headerName: 'X-AB-Test-Variant',
  excludedPaths: ['/api', '/static', '/_next'],
};

/**
 * A/B 測試中間件處理器
 */
export class ABTestMiddleware {
  private config: ABTestMiddlewareConfig;

  constructor(config: Partial<ABTestMiddlewareConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 處理請求
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    if (!this.config.enabled) {
      return NextResponse.next();
    }

    // 檢查是否應該跳過
    if (this.shouldSkip(request)) {
      return NextResponse.next();
    }

    // 構建測試上下文
    const context = this.buildContext(request);

    // 獲取 A/B 測試決策
    const decision = abTestManager.getDecision(context);

    if (decision) {
      // 創建響應
      const response = NextResponse.next();

      // 設置 cookie
      if (this.config.cookieName) {
        response.cookies.set(this.config.cookieName, decision.variantId, {
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 天
        });
      }

      // 設置 header
      if (this.config.headerName) {
        response.headers.set(this.config.headerName, decision.variantId);
      }

      // 記錄決策
      console.log(
        `[ABTestMiddleware] Assigned variant ${decision.variantId} to session ${context.sessionId}`
      );

      return response;
    }

    return NextResponse.next();
  }

  /**
   * 檢查是否應該跳過
   */
  private shouldSkip(request: NextRequest): boolean {
    const path = request.nextUrl.pathname;

    // 檢查排除路徑
    if (this.config.excludedPaths) {
      for (const excludedPath of this.config.excludedPaths) {
        if (path.startsWith(excludedPath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 構建測試上下文
   */
  private buildContext(request: NextRequest): ABTestContext {
    // 獲取或生成 session ID
    const sessionId = this.getOrCreateSessionId(request);

    // 獲取用戶 ID（如果有）
    const userId = this.getUserId(request);

    // 獲取功能標記
    const features = this.getFeatures(request);

    return {
      sessionId,
      userId,
      route: request.nextUrl.pathname,
      features,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      customData: {
        referrer: request.headers.get('referer'),
        ip: (request as any).ip,
      },
    };
  }

  /**
   * 獲取或創建 Session ID
   */
  private getOrCreateSessionId(request: NextRequest): string {
    // 從 cookie 中獲取
    const cookieSessionId = request.cookies.get('session_id')?.value;
    if (cookieSessionId) {
      return cookieSessionId;
    }

    // 生成新的 session ID
    return globalThis.crypto?.randomUUID?.() || Math.random().toString(36);
  }

  /**
   * 獲取用戶 ID
   */
  private getUserId(request: NextRequest): string | undefined {
    // 從 cookie 或 header 中獲取用戶 ID
    return request.cookies.get('user_id')?.value || request.headers.get('x-user-id') || undefined;
  }

  /**
   * 獲取功能標記
   */
  private getFeatures(request: NextRequest): string[] {
    const features: string[] = [];

    // 從 cookie 中獲取功能標記
    const featureCookie = request.cookies.get('features')?.value;
    if (featureCookie) {
      try {
        features.push(...JSON.parse(featureCookie));
      } catch (e) {
        console.error('[ABTestMiddleware] Failed to parse features cookie:', e);
      }
    }

    // 從 header 中獲取功能標記
    const featureHeader = request.headers.get('x-features');
    if (featureHeader) {
      features.push(...featureHeader.split(',').map(f => f.trim()));
    }

    return features;
  }
}

// 導出默認實例
export const abTestMiddleware = new ABTestMiddleware();

/**
 * Widget 加載時的 A/B 測試集成
 */
export async function applyABTestToWidgetLoad(
  widgetId: string,
  sessionId: string
): Promise<{
  useV2: boolean;
  enableGraphQL: boolean;
}> {
  // 獲取當前用戶的 A/B 測試決策
  const decision = abTestManager.getDecision({
    sessionId,
    route: window.location.pathname,
    timestamp: Date.now(),
  });

  if (!decision) {
    // 沒有活躍的測試，使用默認配置
    return {
      useV2: false,
      enableGraphQL: false,
    };
  }

  // 從 decision 中獲取測試 ID（需要擴展 ABTestResult 接口）
  // 暫時硬編碼測試 ID
  const testId = 'widget-registry-v2-rollout';

  // 獲取變體配置（避免直接訪問 private 屬性）
  let variant;
  try {
    const report = abTestManager.getTestReport(testId);
    variant = report.variants.find(v => v.variantId === decision.variantId);
  } catch (e) {
    console.error('[ABTestMiddleware] Failed to get test report:', e);
  }

  if (!variant) {
    return {
      useV2: false,
      enableGraphQL: false,
    };
  }

  // 基於變體 ID 決定配置
  // 由於無法直接訪問 variant 的配置，我們根據變體 ID 判斷
  if (decision.variantId === 'v2-system') {
    return {
      useV2: true,
      enableGraphQL: true,
    };
  } else {
    return {
      useV2: false,
      enableGraphQL: false,
    };
  }
}

/**
 * 記錄 Widget 加載性能
 */
export function recordWidgetLoadPerformance(
  widgetId: string,
  loadTime: number,
  variant: string
): void {
  abTestManager.recordMetric({
    testId: 'widget-registry-v2-rollout',
    variantId: variant,
    metricName: 'widget_load_time',
    value: loadTime,
    timestamp: Date.now(),
    context: {
      customData: { widgetId },
    },
  });
}

/**
 * 記錄 Widget 錯誤
 */
export function recordWidgetError(widgetId: string, error: Error, variant: string): void {
  abTestManager.recordMetric({
    testId: 'widget-registry-v2-rollout',
    variantId: variant,
    metricName: 'error_rate',
    value: 1, // 每個錯誤計為 1
    timestamp: Date.now(),
    context: {
      customData: {
        widgetId,
        errorMessage: error.message,
        errorStack: error.stack,
      },
    },
  });
}

/**
 * 記錄用戶互動
 */
export function recordWidgetInteraction(
  widgetId: string,
  interactionType: string,
  variant: string
): void {
  abTestManager.recordMetric({
    testId: 'widget-registry-v2-rollout',
    variantId: variant,
    metricName: 'user_engagement',
    value: 1, // 每次互動計為 1
    timestamp: Date.now(),
    context: {
      customData: {
        widgetId,
        interactionType,
      },
    },
  });
}
