import { 
  FeatureFlagProvider, 
  FeatureFlag, 
  FeatureContext, 
  FeatureEvaluation,
  FeatureRule,
  FeatureVariant
} from '../types';

/**
 * 基礎 Feature Flag 提供者
 * 提供通用的評估邏輯
 */
export abstract class BaseFeatureFlagProvider implements FeatureFlagProvider {
  protected subscribers: Set<(flags: FeatureFlag[]) => void> = new Set();
  protected cache: Map<string, FeatureFlag> = new Map();
  protected cacheExpiry: number = 0;

  abstract initialize(): Promise<void>;
  abstract getAllFlags(): Promise<FeatureFlag[]>;
  abstract getFlag(key: string): Promise<FeatureFlag | null>;
  abstract updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void>;

  /**
   * 評估 Feature Flag
   */
  async evaluate(key: string, context: FeatureContext): Promise<FeatureEvaluation> {
    const flag = await this.getFlag(key);
    
    if (!flag) {
      return {
        enabled: false,
        reason: 'Flag not found'
      };
    }

    // 檢查狀態
    if (flag.status === 'disabled') {
      return {
        enabled: false,
        reason: 'Flag is disabled'
      };
    }

    // 檢查日期範圍
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return {
        enabled: false,
        reason: 'Flag not yet active'
      };
    }
    if (flag.endDate && now > flag.endDate) {
      return {
        enabled: false,
        reason: 'Flag has expired'
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
          reason: 'Not in rollout percentage'
        };
      }
    }

    // 默認啟用
    return this.getEvaluationResult(flag, context, 'Default enabled');
  }

  /**
   * 批量評估
   */
  async evaluateAll(context: FeatureContext): Promise<Record<string, FeatureEvaluation>> {
    const flags = await this.getAllFlags();
    const results: Record<string, FeatureEvaluation> = {};

    await Promise.all(
      flags.map(async (flag) => {
        results[flag.key] = await this.evaluate(flag.key, context);
      })
    );

    return results;
  }

  /**
   * 訂閱變更
   */
  subscribe(callback: (flags: FeatureFlag[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * 通知訂閱者
   */
  protected notifySubscribers(flags: FeatureFlag[]) {
    this.subscribers.forEach(callback => callback(flags));
  }

  /**
   * 評估單個規則
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
   * 評估用戶規則
   */
  private evaluateUserRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.userId) return false;

    const targetUsers = Array.isArray(rule.value) ? rule.value : [rule.value];
    return targetUsers.includes(context.userId);
  }

  /**
   * 評估群組規則
   */
  private evaluateGroupRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.userGroups || context.userGroups.length === 0) return false;

    const targetGroups = Array.isArray(rule.value) ? rule.value : [rule.value];
    return context.userGroups.some(group => targetGroups.includes(group));
  }

  /**
   * 評估百分比規則
   */
  private evaluatePercentageRule(rule: FeatureRule, context: FeatureContext): boolean {
    const percentage = Number(rule.value);
    if (isNaN(percentage)) return false;

    const hash = this.hashContext('percentage', context);
    const bucket = Math.abs(hash) % 100;
    
    return bucket < percentage;
  }

  /**
   * 評估環境規則
   */
  private evaluateEnvironmentRule(rule: FeatureRule, context: FeatureContext): boolean {
    if (!context.environment) return false;

    const targetEnvs = Array.isArray(rule.value) ? rule.value : [rule.value];
    return targetEnvs.includes(context.environment);
  }

  /**
   * 評估日期規則
   */
  private evaluateDateRule(rule: FeatureRule, context: FeatureContext): boolean {
    const now = context.timestamp || new Date();
    const targetDate = new Date(rule.value);

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

    const attributeValue = context.customAttributes[rule.value.attribute];
    if (attributeValue === undefined) return false;

    switch (rule.operator) {
      case 'equals':
        return attributeValue === rule.value.value;
      case 'contains':
        return String(attributeValue).includes(rule.value.value);
      case 'gt':
        return Number(attributeValue) > Number(rule.value.value);
      case 'lt':
        return Number(attributeValue) < Number(rule.value.value);
      case 'gte':
        return Number(attributeValue) >= Number(rule.value.value);
      case 'lte':
        return Number(attributeValue) <= Number(rule.value.value);
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
      reason
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
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash;
  }
}