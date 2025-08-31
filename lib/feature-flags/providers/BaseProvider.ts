import { safeGet, safeString } from '../../../types/database/helpers';
import {
  FeatureFlagProvider,
  FeatureFlag,
  FeatureContext,
  FeatureEvaluation,
  FeatureRule,
  FeatureVariant,
  FeatureFlagStatus,
} from '../types';

/**
 * 基礎 Feature Flag 提供者抽象類
 *
 * 提供了完整的 Feature Flag 評估邏輯實現，包括：
 * - 規則評估引擎
 * - 變體選擇算法
 * - 漸進式發布支持
 * - 訂閱者管理
 * - 類型安全的評估流程
 *
 * 子類只需實現具體的存儲和檢索方法。
 */
/**
 * 配置約束接口 - 確保配置對象的基本結構
 */
export interface ProviderConfig {
  readonly cacheEnabled?: boolean;
  readonly cacheTTL?: number;
  readonly pollInterval?: number;
}

/**
 * 基礎 Feature Flag 提供者抽象類
 *
 * @template TConfig 提供者配置類型，必須繼承 ProviderConfig
 */
export abstract class BaseFeatureFlagProvider<TConfig extends ProviderConfig = ProviderConfig>
  implements FeatureFlagProvider
{
  protected subscribers: Set<(flags: FeatureFlag[]) => void> = new Set();
  protected cache: Map<string, FeatureFlag> = new Map();
  protected cacheExpiry: number = 0;
  protected readonly config?: TConfig;

  constructor(config?: TConfig) {
    this.config = config;
    // 設置緩存過期時間
    if (config?.cacheTTL) {
      this.cacheExpiry = Date.now() + config.cacheTTL;
    }
  }

  /**
   * 檢查緩存是否過期
   */
  protected isCacheExpired(): boolean {
    return this.cacheExpiry > 0 && Date.now() > this.cacheExpiry;
  }

  /**
   * 清除過期的緩存
   */
  protected clearExpiredCache(): void {
    if (this.isCacheExpired()) {
      this.cache.clear();
      this.cacheExpiry = 0;
    }
  }

  // 抽象方法 - 子類必須實現的存儲操作
  /**
   * 初始化提供者
   * @throws {Error} 當初始化失敗時
   */
  abstract initialize(): Promise<void>;

  /**
   * 獲取所有 Feature Flags
   * @returns Promise<FeatureFlag[]> 所有可用的 Feature Flags
   */
  abstract getAllFlags(): Promise<FeatureFlag[]>;

  /**
   * 根據 key 獲取單個 Feature Flag
   * @param key Feature Flag 的唯一標識符
   * @returns Promise<FeatureFlag | null> 找到的 Flag 或 null
   */
  abstract getFlag(key: string): Promise<FeatureFlag | null>;

  /**
   * 更新 Feature Flag
   * @param key Feature Flag 的唯一標識符
   * @param updates 要更新的字段
   * @throws {Error} 當 Flag 不存在或更新失敗時
   */
  abstract updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void>;

  /**
   * 評估 Feature Flag
   *
   * 完整的評估流程包括：
   * 1. 檢查 Flag 是否存在
   * 2. 驗證 Flag 狀態
   * 3. 檢查生效日期範圍
   * 4. 評估業務規則
   * 5. 處理漸進式發布
   * 6. 選擇變體（如適用）
   *
   * @param key Feature Flag 的唯一標識符
   * @param context 評估上下文，包含用戶和環境信息
   * @returns Promise<FeatureEvaluation> 評估結果
   */
  async evaluate(key: string, context: FeatureContext): Promise<FeatureEvaluation> {
    const flag = await this.getFlag(key);

    if (!flag) {
      return {
        enabled: false,
        reason: 'Flag not found',
      };
    }

    // 檢查狀態
    if (flag.status === FeatureFlagStatus.DISABLED) {
      return {
        enabled: false,
        reason: 'Flag is disabled',
      };
    }

    // 檢查日期範圍
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return {
        enabled: false,
        reason: 'Flag not yet active',
      };
    }
    if (flag.endDate && now > flag.endDate) {
      return {
        enabled: false,
        reason: 'Flag has expired',
      };
    }

    // 評估規則
    if (flag.rules && flag.rules.length > 0) {
      for (const rule of flag.rules) {
        const ruleResult = this.evaluateRule(rule, context);
        if (ruleResult) {
          return this.getEvaluationResult(flag, context, 'Rule matched');
        }
      }
    }

    // 檢查漸進式發布
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashContext(key, context);
      const bucket = Math.abs(hash) % 100;

      if (bucket >= flag.rolloutPercentage) {
        return {
          enabled: false,
          reason: 'Not in rollout percentage',
        };
      }
    }

    // 默認啟用
    return this.getEvaluationResult(flag, context, 'Default enabled');
  }

  /**
   * 批量評估所有 Feature Flags
   *
   * @param context 評估上下文
   * @returns Promise<Record<string, FeatureEvaluation>> 所有 Flag 的評估結果
   */
  async evaluateAll(context: FeatureContext): Promise<Record<string, FeatureEvaluation>> {
    const flags = await this.getAllFlags();
    const results: Record<string, FeatureEvaluation> = {};

    await Promise.all(
      flags.map(async flag => {
        results[flag.key] = await this.evaluate(flag.key, context);
      })
    );

    return results;
  }

  /**
   * 訂閱 Feature Flag 變更
   *
   * @param callback 當 Flags 變更時的回調函數
   * @returns 取消訂閱的函數
   */
  subscribe(callback: (flags: FeatureFlag[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * 通知所有訂閱者 Feature Flags 已更新
   *
   * @param flags 更新後的 Feature Flags 列表
   */
  protected notifySubscribers(flags: FeatureFlag[]): void {
    this.subscribers.forEach(callback => callback(flags));
  }

  /**
   * 評估單個業務規則
   *
   * 支持的規則類型：
   * - user: 用戶 ID 匹配
   * - group: 用戶群組匹配
   * - percentage: 百分比發布
   * - environment: 環境匹配
   * - date: 日期比較
   * - custom: 自定義屬性匹配
   *
   * @param rule 要評估的規則
   * @param context 評估上下文
   * @returns boolean 規則是否匹配
   */
  private evaluateRule(rule: FeatureRule, context: FeatureContext): boolean {
    switch (rule.type) {
      case 'user':
        return this.evaluateUserRule(rule, context);

      case 'group':
        return this.evaluateGroupRule(rule, context);

      case 'percentage':
        return this.evaluatePercentageRule(rule, context);

      case 'environment':
        return this.evaluateEnvironmentRule(rule, context);

      case 'date':
        return this.evaluateDateRule(rule, context);

      case 'custom':
        return this.evaluateCustomRule(rule, context);

      default:
        return false;
    }
  }

  /**
   * 評估用戶 ID 規則
   *
   * 使用類型安全的方式檢查用戶 ID 是否在目標列表中
   *
   * @param rule 用戶規則
   * @param context 評估上下文
   * @returns boolean 用戶是否在目標用戶列表中
   */
  private evaluateUserRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.userId) return false;

    // 類型安全的值提取
    const ruleValue = rule.value;
    if (typeof ruleValue === 'string') {
      return context.userId === ruleValue;
    }

    if (Array.isArray(ruleValue)) {
      return ruleValue.some(val => typeof val === 'string' && val === context.userId);
    }

    return false;
  }

  /**
   * 評估用戶群組規則
   *
   * 檢查用戶是否屬於目標群組中的任一群組
   *
   * @param rule 群組規則
   * @param context 評估上下文
   * @returns boolean 用戶是否在目標群組中
   */
  private evaluateGroupRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.userGroups || context.userGroups.length === 0) return false;

    // 類型安全的值提取
    const ruleValue = rule.value;
    if (typeof ruleValue === 'string') {
      return context.userGroups.includes(ruleValue);
    }

    if (Array.isArray(ruleValue)) {
      const stringValues = ruleValue.filter((val): val is string => typeof val === 'string');
      return context.userGroups.some(group => stringValues.includes(group));
    }

    return false;
  }

  /**
   * 評估百分比發布規則
   *
   * 使用一致性哈希確保同一用戶總是得到相同的結果
   *
   * @param rule 百分比規則
   * @param context 評估上下文
   * @returns boolean 用戶是否在發布百分比範圍內
   */
  private evaluatePercentageRule(rule: FeatureRule, context: FeatureContext): boolean {
    // 類型安全的數值提取
    let percentage: number;

    if (typeof rule.value === 'number') {
      percentage = rule.value;
    } else if (typeof rule.value === 'string') {
      percentage = Number(rule.value);
    } else {
      return false;
    }

    // 驗證百分比範圍
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return false;
    }

    const hash = this.hashContext('percentage', context);
    const bucket = Math.abs(hash) % 100;

    return bucket < percentage;
  }

  /**
   * 評估環境規則
   *
   * 檢查當前環境是否在目標環境列表中
   *
   * @param rule 環境規則
   * @param context 評估上下文
   * @returns boolean 當前環境是否在目標環境列表中
   */
  private evaluateEnvironmentRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.environment) return false;

    // 類型安全的值提取
    const ruleValue = rule.value;
    if (typeof ruleValue === 'string') {
      return context.environment === ruleValue;
    }

    if (Array.isArray(ruleValue)) {
      const stringValues = ruleValue.filter((val): val is string => typeof val === 'string');
      return stringValues.includes(context.environment);
    }

    return false;
  }

  /**
   * 評估日期規則 - 策略 4: 類型安全的規則評估
   */
  private evaluateDateRule(rule: FeatureRule, context: FeatureContext): boolean {
    const now = context.timestamp || new Date();
    const targetDate = new Date(safeString(safeGet(rule, 'value')));

    switch (rule.operator) {
      case 'gt':
        return now > targetDate;
      case 'lt':
        return now < targetDate;
      case 'gte':
        return now >= targetDate;
      case 'lte':
        return now <= targetDate;
      default:
        return false;
    }
  }

  /**
   * 評估自定義規則
   */
  private evaluateCustomRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.customAttributes) return false;

    const ruleValue = safeGet(rule, 'value');
    const attributeName = safeString(safeGet(ruleValue, 'attribute'));
    const expectedValue = safeGet(ruleValue, 'value');

    const attributeValue = context.customAttributes[attributeName];
    if (attributeValue === undefined) return false;

    switch (rule.operator) {
      case 'equals':
        return attributeValue === expectedValue;
      case 'contains':
        return String(attributeValue).includes(String(expectedValue));
      case 'gt':
        return Number(attributeValue) > Number(expectedValue);
      case 'lt':
        return Number(attributeValue) < Number(expectedValue);
      case 'gte':
        return Number(attributeValue) >= Number(expectedValue);
      case 'lte':
        return Number(attributeValue) <= Number(expectedValue);
      default:
        return false;
    }
  }

  /**
   * 獲取評估結果
   */
  private getEvaluationResult(
    flag: FeatureFlag,
    context: FeatureContext,
    reason: string
  ): FeatureEvaluation {
    const result: FeatureEvaluation = {
      enabled: true,
      reason,
    };

    // 處理變體
    if (flag.type === 'variant' && flag.variants && flag.variants.length > 0) {
      const variant = this.selectVariant(flag.variants, context, flag.key);
      result.variant = variant.key;
      result.metadata = variant.payload;
    }

    return result;
  }

  /**
   * 選擇變體
   */
  private selectVariant(
    variants: FeatureVariant[],
    context: FeatureContext,
    flagKey: string
  ): FeatureVariant {
    // 計算總權重
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 0), 0);

    if (totalWeight === 0) {
      // 如果沒有權重，平均分配
      const hash = this.hashContext(flagKey, context);
      const index = Math.abs(hash) % variants.length;
      return variants[index];
    }

    // 根據權重選擇
    const hash = this.hashContext(flagKey, context);
    const bucket = (Math.abs(hash) % totalWeight) + 1;

    let accumWeight = 0;
    for (const variant of variants) {
      accumWeight += variant.weight || 0;
      if (bucket <= accumWeight) {
        return variant;
      }
    }

    // 默認返回第一個
    return variants[0];
  }

  /**
   * 生成上下文哈希
   */
  private hashContext(seed: string, context: FeatureContext): number {
    const str = seed + (context.userId || '') + (context.userEmail || '');
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash;
  }
}
