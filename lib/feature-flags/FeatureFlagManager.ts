import { isProduction } from '../utils/env';
import { featureFlagLogger } from '../logger';
import {
  FeatureFlagProvider,
  FeatureFlagConfig,
  FeatureContext,
  FeatureEvaluation,
  FeatureFlag,
  FeatureFlagStatus,
  FeatureFlagMonitor,
  FeatureFlagEvent,
  KnownFeatureFlags,
} from './types';
import { LocalFeatureFlagProvider } from './providers/LocalProvider';
import { SupabaseFeatureFlagProvider } from './providers/SupabaseProvider';

/**
 * Feature Flag 管理器
 * 統一管理所有 Feature Flag 操作
 */
export class FeatureFlagManager {
  private provider: FeatureFlagProvider;
  private config: FeatureFlagConfig;
  private monitor?: FeatureFlagMonitor;
  private defaultContext: Partial<FeatureContext> = {};
  private initialized = false;
  private initPromise?: Promise<void>;

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    this.defaultContext = config.defaultContext || {};

    // 創建提供者
    this.provider = this.createProvider();
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      featureFlagLogger.debug('Feature flag manager already initialized');
      return;
    }

    // 避免重複初始化
    if (this.initPromise) {
      featureFlagLogger.debug('Initialization already in progress');
      return this.initPromise;
    }

    featureFlagLogger.info(
      {
        provider: this.config.provider,
        cacheEnabled: this.config.cacheEnabled,
        cacheTTL: this.config.cacheTTL,
      },
      'Initializing feature flag manager'
    );

    this.initPromise = this.provider
      .initialize()
      .then(() => {
        this.initialized = true;
        featureFlagLogger.info('Feature flag manager initialized successfully');
      })
      .catch(error => {
        this.handleError(error);
        throw error;
      });

    return this.initPromise;
  }

  /**
   * 評估 Feature Flag
   */
  async evaluate(key: string, context?: Partial<FeatureContext>): Promise<FeatureEvaluation> {
    await this.ensureInitialized();

    const mergedContext = this.getMergedContext(context);
    const startTime = Date.now();

    try {
      featureFlagLogger.debug(
        {
          flagKey: key,
          context: mergedContext,
        },
        'Evaluating feature flag'
      );

      const result = await this.provider.evaluate(key, mergedContext);

      featureFlagLogger.info(
        {
          flagKey: key,
          enabled: result.enabled,
          variant: result.variant,
          reason: result.reason,
        },
        'Feature flag evaluated'
      );

      // 記錄事件
      this.trackEvent({
        type: 'evaluated',
        flagKey: key,
        context: mergedContext,
        result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.handleError(error as Error);

      // 記錄錯誤事件
      this.trackEvent({
        type: 'error',
        flagKey: key,
        context: mergedContext,
        error: error as Error,
        timestamp: new Date(),
      });

      // 返回默認值
      return {
        enabled: false,
        reason: 'Evaluation error',
      };
    } finally {
      // 性能監控
      const duration = Date.now() - startTime;
      if (duration > 100) {
        featureFlagLogger.warn(
          {
            flagKey: key,
            duration,
            threshold: 100,
          },
          'Feature flag evaluation exceeded performance threshold'
        );
      }
    }
  }

  /**
   * 批量評估 Feature Flags
   */
  async evaluateAll(context?: Partial<FeatureContext>): Promise<Record<string, FeatureEvaluation>> {
    await this.ensureInitialized();

    const mergedContext = this.getMergedContext(context);

    try {
      return await this.provider.evaluateAll(mergedContext);
    } catch (error) {
      this.handleError(error as Error);
      return {};
    }
  }

  /**
   * 獲取所有 Feature Flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    await this.ensureInitialized();
    return this.provider.getAllFlags();
  }

  /**
   * 獲取單個 Feature Flag
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    await this.ensureInitialized();
    return this.provider.getFlag(key);
  }

  /**
   * 更新 Feature Flag
   */
  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void> {
    await this.ensureInitialized();

    featureFlagLogger.info(
      {
        flagKey: key,
        updates,
      },
      'Updating feature flag'
    );

    try {
      await this.provider.updateFlag(key, updates);

      featureFlagLogger.info(
        {
          flagKey: key,
          updates,
        },
        'Feature flag updated successfully'
      );

      // 記錄事件
      this.trackEvent({
        type: 'updated',
        flagKey: key,
        timestamp: new Date(),
      });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * 切換 Feature Flag（開發環境）
   */
  async toggleFlag(key: string): Promise<void> {
    if (isProduction()) {
      featureFlagLogger.error(
        {
          flagKey: key,
          environment: 'production',
        },
        'Attempted to toggle feature flag in production'
      );
      throw new Error('Feature flag toggling is not allowed in production');
    }

    featureFlagLogger.info(
      {
        flagKey: key,
      },
      'Toggling feature flag'
    );

    const flag = await this.getFlag(key);
    if (!flag) {
      featureFlagLogger.error(
        {
          flagKey: key,
        },
        'Feature flag not found for toggle'
      );
      throw new Error(`Feature flag ${key} not found`);
    }

    const newStatus =
      flag.status === FeatureFlagStatus.ENABLED
        ? FeatureFlagStatus.DISABLED
        : FeatureFlagStatus.ENABLED;

    featureFlagLogger.info(
      {
        flagKey: key,
        oldStatus: flag.status,
        newStatus,
      },
      'Toggling feature flag status'
    );

    await this.updateFlag(key, {
      status: newStatus,
    });
  }

  /**
   * 訂閱 Feature Flag 變更
   */
  subscribe(callback: (flags: FeatureFlag[]) => void): () => void {
    return this.provider.subscribe(callback);
  }

  /**
   * 檢查已知的 Feature Flag
   */
  async isEnabled(key: KnownFeatureFlags, context?: Partial<FeatureContext>): Promise<boolean> {
    const evaluation = await this.evaluate(key, context);
    return evaluation.enabled;
  }

  /**
   * 獲取變體
   */
  async getVariant(key: string, context?: Partial<FeatureContext>): Promise<string | undefined> {
    const evaluation = await this.evaluate(key, context);
    return evaluation.variant;
  }

  /**
   * 設置監控器
   */
  setMonitor(monitor: FeatureFlagMonitor): void {
    this.monitor = monitor;
  }

  /**
   * 獲取合併的上下文
   */
  getMergedContext(context?: Partial<FeatureContext>): FeatureContext {
    return {
      ...this.defaultContext,
      ...context,
      timestamp: context?.timestamp || new Date(),
      environment: context?.environment || this.getEnvironment(),
    } as FeatureContext;
  }

  /**
   * 清理資源
   */
  dispose(): void {
    // Strategy 2: DTO/自定義 type interface - 定義清晰的型別轉換
    interface DisposableProvider extends FeatureFlagProvider {
      dispose(): void;
    }

    function isDisposable(provider: FeatureFlagProvider): provider is DisposableProvider {
      return (
        'dispose' in provider && typeof (provider as DisposableProvider).dispose === 'function'
      );
    }

    if (isDisposable(this.provider)) {
      this.provider.dispose();
    }
  }

  /**
   * 創建提供者
   */
  private createProvider(): FeatureFlagProvider {
    switch (this.config.provider) {
      case 'supabase':
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase configuration missing');
        }

        return new SupabaseFeatureFlagProvider(supabaseUrl, supabaseKey, {
          cacheTTL: this.config.cacheTTL,
          pollingInterval: this.config.pollingInterval,
        });

      case 'local':
      default:
        return new LocalFeatureFlagProvider();
    }
  }

  /**
   * 確保已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 獲取當前環境
   */
  private getEnvironment(): 'development' | 'staging' | 'production' {
    const env = process.env.NODE_ENV;

    if (env === 'production') return 'production';
    if (env === 'test') return 'staging';
    return 'development';
  }

  /**
   * 處理錯誤
   */
  private handleError(error: Error): void {
    featureFlagLogger.error(
      {
        error: error.message,
        stack: error.stack,
        name: error.name,
      },
      'Feature flag manager error'
    );

    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * 記錄事件
   */
  private trackEvent(event: FeatureFlagEvent): void {
    if (this.monitor) {
      this.monitor.trackEvaluation(event);
    }
  }
}

// 創建默認實例
const defaultConfig: FeatureFlagConfig = {
  provider: isProduction() ? 'supabase' : 'local',
  cacheEnabled: true,
  cacheTTL: 60000, // 1 分鐘
  pollingInterval: isProduction() ? 300000 : undefined, // 5 分鐘（生產環境）
};

export const featureFlagManager = new FeatureFlagManager(defaultConfig);

// 自動初始化（在瀏覽器環境）
if (typeof window !== 'undefined') {
  featureFlagManager.initialize().catch(error => {
    featureFlagLogger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        phase: 'auto-initialization',
      },
      'Failed to auto-initialize feature flag manager'
    );
  });
}
