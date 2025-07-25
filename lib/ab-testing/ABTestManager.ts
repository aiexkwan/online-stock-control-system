/**
 * A/B Testing Framework - MVP
 * 支援 Widget → Card 遷移的 A/B 測試管理
 */

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  traffic: number; // 0-100, 測試流量百分比
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
  targetAudience?: ABTestAudience;
}

interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, 該變體的流量分配
  config: Record<string, any>;
}

interface ABTestAudience {
  userIds?: string[];
  userRoles?: string[];
  departments?: string[];
  browsers?: string[];
  excludeUserIds?: string[];
}

interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class ABTestManager {
  private static instance: ABTestManager;
  private tests: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private results: ABTestResult[] = [];
  
  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }
  
  /**
   * 註冊 A/B 測試
   */
  registerTest(config: ABTestConfig): void {
    // 驗證配置
    if (!this.validateTestConfig(config)) {
      throw new Error(`Invalid test configuration for ${config.id}`);
    }
    
    this.tests.set(config.id, config);
    
    console.info(`[ABTest] Registered test: ${config.id} (${config.name})`);
  }
  
  /**
   * 獲取用戶的測試變體
   */
  getVariant(testId: string, userId: string): string | null {
    const test = this.tests.get(testId);
    
    if (!test || !test.enabled) {
      return null;
    }
    
    // 檢查測試是否在有效期內
    const now = new Date();
    if (now < test.startDate || (test.endDate && now > test.endDate)) {
      return null;
    }
    
    // 檢查用戶是否符合目標受眾
    if (!this.isUserInAudience(userId, test.targetAudience)) {
      return null;
    }
    
    // 檢查用戶是否已分配變體
    const userTests = this.userAssignments.get(userId);
    if (userTests?.has(testId)) {
      return userTests.get(testId)!;
    }
    
    // 分配新變體
    const variant = this.assignVariant(testId, userId);
    
    if (variant) {
      // 記錄分配結果
      this.recordResult({
        testId,
        variantId: variant,
        userId,
        timestamp: Date.now(),
        metadata: { event: 'assignment' }
      });
    }
    
    return variant;
  }
  
  /**
   * 檢查功能是否應該啟用 (Feature Flag)
   */
  isFeatureEnabled(featureId: string, userId: string): boolean {
    const variant = this.getVariant(featureId, userId);
    
    if (!variant) {
      return false;
    }
    
    const test = this.tests.get(featureId);
    const variantConfig = test?.variants.find(v => v.id === variant);
    
    return variantConfig?.config?.enabled === true;
  }
  
  /**
   * 記錄測試事件 (點擊、轉換等)
   */
  recordEvent(testId: string, userId: string, eventType: string, metadata?: Record<string, any>): void {
    const variant = this.getVariant(testId, userId);
    
    if (variant) {
      this.recordResult({
        testId,
        variantId: variant,
        userId,
        timestamp: Date.now(),
        metadata: { event: eventType, ...metadata }
      });
    }
  }
  
  /**
   * 獲取測試統計
   */
  getTestStats(testId: string): {
    totalUsers: number;
    variantStats: Record<string, {
      users: number;
      events: Record<string, number>;
    }>;
  } {
    const testResults = this.results.filter(r => r.testId === testId);
    const variantStats: Record<string, { users: number; events: Record<string, number> }> = {};
    
    testResults.forEach(result => {
      if (!variantStats[result.variantId]) {
        variantStats[result.variantId] = {
          users: new Set<string>().size,
          events: {}
        };
      }
      
      const eventType = result.metadata?.event || 'unknown';
      variantStats[result.variantId].events[eventType] = 
        (variantStats[result.variantId].events[eventType] || 0) + 1;
    });
    
    // 計算每個變體的用戶數
    Object.keys(variantStats).forEach(variantId => {
      const uniqueUsers = new Set(
        testResults
          .filter(r => r.variantId === variantId)
          .map(r => r.userId)
      );
      variantStats[variantId].users = uniqueUsers.size;
    });
    
    return {
      totalUsers: new Set(testResults.map(r => r.userId)).size,
      variantStats
    };
  }
  
  /**
   * 分配變體給用戶
   */
  private assignVariant(testId: string, userId: string): string | null {
    const test = this.tests.get(testId);
    if (!test) return null;
    
    // 檢查是否參與測試 (基於流量百分比)
    const hash = this.hashUserId(userId, testId);
    const trafficThreshold = test.traffic / 100;
    
    if (hash > trafficThreshold) {
      return null; // 用戶不參與測試
    }
    
    // 根據權重分配變體
    const variants = test.variants.sort((a, b) => a.weight - b.weight);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = hash * totalWeight / trafficThreshold;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        // 保存分配結果
        if (!this.userAssignments.has(userId)) {
          this.userAssignments.set(userId, new Map());
        }
        this.userAssignments.get(userId)!.set(testId, variant.id);
        
        return variant.id;
      }
    }
    
    return variants[0]?.id || null;
  }
  
  /**
   * 生成用戶哈希值 (用於一致性分配)
   */
  private hashUserId(userId: string, testId: string): number {
    const str = `${userId}-${testId}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32位整數
    }
    
    return Math.abs(hash) / Math.pow(2, 31); // 返回 0-1 的浮點數
  }
  
  /**
   * 檢查用戶是否符合目標受眾
   */
  private isUserInAudience(userId: string, audience?: ABTestAudience): boolean {
    if (!audience) return true;
    
    // 排除用戶檢查
    if (audience.excludeUserIds?.includes(userId)) {
      return false;
    }
    
    // 包含用戶檢查
    if (audience.userIds && !audience.userIds.includes(userId)) {
      return false;
    }
    
    // 這裡可以添加更多受眾檢查邏輯 (角色、部門等)
    
    return true;
  }
  
  /**
   * 驗證測試配置
   */
  private validateTestConfig(config: ABTestConfig): boolean {
    if (!config.id || !config.name || !config.variants) {
      return false;
    }
    
    if (config.variants.length === 0) {
      return false;
    }
    
    // 檢查權重總和
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      console.warn(`[ABTest] Warning: variant weights sum to ${totalWeight}%, not 100%`);
    }
    
    return true;
  }
  
  /**
   * 記錄測試結果
   */
  private recordResult(result: ABTestResult): void {
    this.results.push(result);
    
    // 保留最近 10000 條記錄
    if (this.results.length > 10000) {
      this.results = this.results.slice(-10000);
    }
  }
  
  /**
   * 導出測試數據
   */
  exportTestData(testId?: string): ABTestResult[] {
    if (testId) {
      return this.results.filter(r => r.testId === testId);
    }
    return [...this.results];
  }
  
  /**
   * 清除測試數據
   */
  clearTestData(testId?: string): void {
    if (testId) {
      this.results = this.results.filter(r => r.testId !== testId);
    } else {
      this.results = [];
    }
  }
}

// 全局 A/B 測試管理器實例
export const abTestManager = ABTestManager.getInstance();

// 便捷方法
export const getVariant = (testId: string, userId: string) => abTestManager.getVariant(testId, userId);
export const isFeatureEnabled = (featureId: string, userId: string) => abTestManager.isFeatureEnabled(featureId, userId);
export const recordEvent = (testId: string, userId: string, eventType: string, metadata?: Record<string, any>) => 
  abTestManager.recordEvent(testId, userId, eventType, metadata);