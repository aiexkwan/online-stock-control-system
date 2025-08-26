/**
 * API Router - GraphQL/REST 切換機制 (v1.2.3)
 *
 * 過渡性切換機制，用於安全地從 GraphQL 遷移到 REST API
 * 最終目標：v1.4 完全移除 GraphQL
 */

import { featureFlagManager } from '@/lib/feature-flags/FeatureFlagManager';
import { KnownFeatureFlags } from '@/lib/feature-flags/types';
import { logger } from '@/lib/logger';

export interface APIRouterConfig {
  userId?: string;
  userEmail?: string;
  environment?: 'development' | 'staging' | 'production';
  customAttributes?: Record<string, unknown>;
}

export interface APIRouterResult {
  useRestAPI: boolean;
  fallbackEnabled: boolean;
  percentage: number;
  reason: string;
}

/**
 * API Router 類
 * 決定使用 GraphQL 或 REST API
 */
export class APIRouter {
  private config: APIRouterConfig;

  constructor(config: APIRouterConfig = {}) {
    this.config = config;
  }

  /**
   * 決定使用哪個 API
   */
  async route(): Promise<APIRouterResult> {
    const context = {
      userId: this.config.userId,
      userEmail: this.config.userEmail,
      environment: this.config.environment || 'development',
      customAttributes: this.config.customAttributes,
      timestamp: new Date(),
    };

    try {
      // 檢查 REST API 是否啟用
      const restApiEnabled = await featureFlagManager.evaluate(
        KnownFeatureFlags.ENABLE_REST_API,
        context
      );

      if (!restApiEnabled.enabled) {
        logger.debug(
          {
            userId: context.userId,
            reason: restApiEnabled.reason,
          },
          'REST API disabled, using GraphQL'
        );

        return {
          useRestAPI: false,
          fallbackEnabled: false,
          percentage: 0,
          reason: 'REST API disabled',
        };
      }

      // 獲取 REST API 使用百分比
      const percentageFlag = await featureFlagManager.evaluate(
        KnownFeatureFlags.REST_API_PERCENTAGE,
        context
      );

      const percentage = percentageFlag.variant ? parseInt(percentageFlag.variant) : 0;

      // 檢查是否啟用 fallback
      const fallbackEnabled = await featureFlagManager.isEnabled(
        KnownFeatureFlags.FALLBACK_TO_GRAPHQL,
        context
      );

      // 根據百分比決定使用 REST API
      const useRestAPI = this.shouldUseRestAPI(percentage, context.userId);

      logger.info(
        {
          userId: context.userId,
          useRestAPI,
          percentage,
          fallbackEnabled,
        },
        'API routing decision'
      );

      return {
        useRestAPI,
        fallbackEnabled,
        percentage,
        reason: useRestAPI
          ? `User in ${percentage}% REST API group`
          : `User in ${100 - percentage}% GraphQL group`,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: context.userId,
        },
        'API routing error, defaulting to GraphQL'
      );

      return {
        useRestAPI: false,
        fallbackEnabled: true,
        percentage: 0,
        reason: 'Error occurred, defaulting to GraphQL',
      };
    }
  }

  /**
   * 根據百分比和用戶 ID 決定是否使用 REST API
   */
  private shouldUseRestAPI(percentage: number, userId?: string): boolean {
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    // 基於用戶 ID 的一致性哈希
    const hash = this.hashUserId(userId || 'anonymous');
    return hash < percentage;
  }

  /**
   * 簡單哈希函數，確保相同用戶總是獲得相同結果
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 轉為 32 位整數
    }
    return Math.abs(hash) % 100;
  }
}

// 全局 API Router 實例
let globalRouter: APIRouter | null = null;

export function getAPIRouter(config?: APIRouterConfig): APIRouter {
  if (!globalRouter) {
    globalRouter = new APIRouter(config);
  }
  return globalRouter;
}

// 便利函數
export async function shouldUseRestAPI(config?: APIRouterConfig): Promise<boolean> {
  const router = getAPIRouter(config);
  const result = await router.route();
  return result.useRestAPI;
}

export async function getAPIRoutingInfo(config?: APIRouterConfig): Promise<APIRouterResult> {
  const router = getAPIRouter(config);
  return router.route();
}
