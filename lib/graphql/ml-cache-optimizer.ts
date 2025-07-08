/**
 * 機器學習驅動的緩存策略優化器
 * 使用歷史數據和用戶行為模式來預測最佳緩存配置
 */

interface CacheMetrics {
  fieldName: string;
  hitRate: number;
  missRate: number;
  accessFrequency: number; // 每小時訪問次數
  avgResponseTime: number;
  dataFreshness: number; // 數據新鮮度要求 (0-1)
  businessPriority: number; // 業務優先級 (0-1)
  timestamp: number;
}

interface PredictedCacheConfig {
  ttl: number;
  cacheSize: number;
  shouldCache: boolean;
  confidence: number; // 預測信心度
  reasons: string[]; // 決策原因
}

interface MLFeatures {
  // 時間特征
  hourOfDay: number;
  dayOfWeek: number;
  isBusinessHours: boolean;

  // 訪問模式特征
  accessFrequency: number;
  accessPattern: 'peak' | 'steady' | 'sporadic';

  // 性能特征
  hitRate: number;
  avgResponseTime: number;

  // 業務特征
  dataType: 'static' | 'transactional' | 'realtime';
  businessPriority: number;
  dataFreshness: number;
}

class MLCacheOptimizer {
  private metricsHistory: Map<string, CacheMetrics[]> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly minDataPoints = 50; // 最少需要的數據點數量

  /**
   * 記錄緩存指標
   */
  recordMetrics(metrics: CacheMetrics): void {
    const history = this.metricsHistory.get(metrics.fieldName) || [];
    history.push(metrics);

    // 保持歷史記錄在合理範圍內
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    this.metricsHistory.set(metrics.fieldName, history);
  }

  /**
   * 提取機器學習特征
   */
  private extractFeatures(fieldName: string, currentTime: Date = new Date()): MLFeatures {
    const history = this.metricsHistory.get(fieldName) || [];

    if (history.length === 0) {
      return this.getDefaultFeatures(fieldName);
    }

    // 最近 24 小時的數據
    const recentHistory = history.filter(
      m => currentTime.getTime() - m.timestamp < 24 * 60 * 60 * 1000
    );

    const avgHitRate = this.average(recentHistory.map(m => m.hitRate));
    const avgResponseTime = this.average(recentHistory.map(m => m.avgResponseTime));
    const accessFrequency = this.calculateAccessFrequency(recentHistory);

    return {
      hourOfDay: currentTime.getHours(),
      dayOfWeek: currentTime.getDay(),
      isBusinessHours: this.isBusinessHours(currentTime),
      accessFrequency,
      accessPattern: this.determineAccessPattern(recentHistory),
      hitRate: avgHitRate,
      avgResponseTime,
      dataType: this.inferDataType(fieldName),
      businessPriority: this.getBusinessPriority(fieldName),
      dataFreshness: this.average(recentHistory.map(m => m.dataFreshness)),
    };
  }

  /**
   * 預測最佳緩存配置
   */
  async predictOptimalConfig(fieldName: string): Promise<PredictedCacheConfig> {
    const features = this.extractFeatures(fieldName);
    const history = this.metricsHistory.get(fieldName) || [];

    if (history.length < this.minDataPoints) {
      return this.getBootstrapConfig(fieldName, features);
    }

    // 使用多個模型預測
    const ttlPrediction = this.predictTTL(features, history);
    const cacheSizePrediction = this.predictCacheSize(features, history);
    const shouldCachePrediction = this.predictShouldCache(features, history);

    const confidence = this.calculateConfidence(features, history);
    const reasons = this.generateReasons(features, ttlPrediction);

    return {
      ttl: Math.max(30, Math.min(3600000, ttlPrediction)), // 30秒到1小時
      cacheSize: Math.max(10, Math.min(1000, cacheSizePrediction)),
      shouldCache: shouldCachePrediction,
      confidence,
      reasons,
    };
  }

  /**
   * TTL 預測模型 (線性回歸 + 規則)
   */
  private predictTTL(features: MLFeatures, history: CacheMetrics[]): number {
    // 基礎 TTL 根據數據類型
    let baseTTL = this.getBaseTTL(features.dataType);

    // 根據命中率調整：高命中率增加 TTL
    const hitRateMultiplier = 0.5 + features.hitRate * 1.5;
    baseTTL *= hitRateMultiplier;

    // 根據訪問頻率調整：高頻訪問增加 TTL
    const frequencyMultiplier = Math.min(2.0, 0.8 + features.accessFrequency / 100);
    baseTTL *= frequencyMultiplier;

    // 根據業務優先級調整
    baseTTL *= 0.7 + features.businessPriority * 0.6;

    // 工作時間調整：工作時間內減少 TTL 以保持數據新鮮
    if (features.isBusinessHours) {
      baseTTL *= 0.7;
    }

    // 數據新鮮度要求調整
    baseTTL *= 1.1 - features.dataFreshness * 0.4;

    return Math.round(baseTTL);
  }

  /**
   * 緩存大小預測模型
   */
  private predictCacheSize(features: MLFeatures, history: CacheMetrics[]): number {
    let baseSize = 50; // 基礎緩存大小

    // 根據訪問頻率調整
    baseSize *= Math.min(3.0, 0.5 + features.accessFrequency / 50);

    // 根據命中率調整
    baseSize *= 0.3 + features.hitRate * 1.4;

    // 根據業務優先級調整
    baseSize *= 0.8 + features.businessPriority * 0.4;

    return Math.round(baseSize);
  }

  /**
   * 是否應該緩存的決策模型
   */
  private predictShouldCache(features: MLFeatures, history: CacheMetrics[]): boolean {
    // 決策樹邏輯
    if (features.accessFrequency < 5) {
      return false; // 低頻訪問不緩存
    }

    if (features.hitRate < 0.3 && history.length > 100) {
      return false; // 長期低命中率不緩存
    }

    if (features.dataFreshness > 0.8 && features.dataType === 'realtime') {
      return false; // 實時數據且新鮮度要求高不緩存
    }

    if (features.businessPriority > 0.7 || features.hitRate > 0.6) {
      return true; // 高優先級或高命中率緩存
    }

    return features.accessFrequency > 20; // 中高頻訪問緩存
  }

  /**
   * 計算預測信心度
   */
  private calculateConfidence(features: MLFeatures, history: CacheMetrics[]): number {
    let confidence = 0.5; // 基礎信心度

    // 數據量越多，信心度越高
    confidence += Math.min(0.3, history.length / 500);

    // 訪問模式穩定性
    if (features.accessPattern === 'steady') {
      confidence += 0.2;
    } else if (features.accessPattern === 'sporadic') {
      confidence -= 0.1;
    }

    // 命中率穩定性
    if (history.length > 50) {
      const hitRateVariance = this.calculateVariance(history.map(m => m.hitRate));
      confidence += Math.max(0, 0.2 - hitRateVariance * 2);
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * 生成決策原因
   */
  private generateReasons(features: MLFeatures, ttl: number): string[] {
    const reasons: string[] = [];

    if (features.hitRate > 0.7) {
      reasons.push('高緩存命中率顯示該數據適合緩存');
    }

    if (features.accessFrequency > 50) {
      reasons.push('高訪問頻率建議使用較長的 TTL');
    }

    if (features.isBusinessHours) {
      reasons.push('工作時間內調整為較短 TTL 以保持數據新鮮');
    }

    if (features.businessPriority > 0.8) {
      reasons.push('高業務優先級數據優化緩存配置');
    }

    if (features.dataType === 'static') {
      reasons.push('靜態數據類型適合長期緩存');
    } else if (features.dataType === 'realtime') {
      reasons.push('實時數據需要短期緩存策略');
    }

    return reasons;
  }

  /**
   * 獲取自適應配置更新
   */
  async getAdaptiveUpdate(fieldName: string): Promise<{
    shouldUpdate: boolean;
    newConfig?: PredictedCacheConfig;
    reason: string;
  }> {
    const history = this.metricsHistory.get(fieldName) || [];

    if (history.length < 10) {
      return { shouldUpdate: false, reason: '數據點不足，暫不更新' };
    }

    const recentMetrics = history.slice(-10);
    const avgRecentHitRate = this.average(recentMetrics.map(m => m.hitRate));
    const features = this.extractFeatures(fieldName);

    // 檢查是否需要更新
    if (avgRecentHitRate < 0.3 && features.accessFrequency > 20) {
      const newConfig = await this.predictOptimalConfig(fieldName);
      return {
        shouldUpdate: true,
        newConfig,
        reason: '低命中率但高訪問頻率，調整緩存策略',
      };
    }

    if (avgRecentHitRate > 0.8 && features.accessFrequency > 50) {
      const newConfig = await this.predictOptimalConfig(fieldName);
      return {
        shouldUpdate: true,
        newConfig,
        reason: '高命中率和高訪問頻率，優化 TTL 配置',
      };
    }

    return { shouldUpdate: false, reason: '當前配置表現良好' };
  }

  // 工具方法
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return this.average(squareDiffs);
  }

  private calculateAccessFrequency(history: CacheMetrics[]): number {
    if (history.length === 0) return 0;
    const timeSpan = Math.max(1, (Date.now() - history[0].timestamp) / (1000 * 60 * 60)); // 小時
    return history.length / timeSpan;
  }

  private determineAccessPattern(history: CacheMetrics[]): 'peak' | 'steady' | 'sporadic' {
    if (history.length < 10) return 'sporadic';

    const frequencies = history.map(m => m.accessFrequency);
    const variance = this.calculateVariance(frequencies);
    const avg = this.average(frequencies);

    if (variance / avg > 0.5) return 'sporadic';
    if (Math.max(...frequencies) > avg * 2) return 'peak';
    return 'steady';
  }

  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  private inferDataType(fieldName: string): 'static' | 'transactional' | 'realtime' {
    const staticFields = ['products', 'users', 'warehouses', 'suppliers'];
    const realtimeFields = ['movements', 'notifications', 'stocktakeScans'];

    if (staticFields.some(field => fieldName.includes(field))) return 'static';
    if (realtimeFields.some(field => fieldName.includes(field))) return 'realtime';
    return 'transactional';
  }

  private getBusinessPriority(fieldName: string): number {
    const highPriorityFields = ['inventory', 'orders', 'pallets'];
    const mediumPriorityFields = ['products', 'movements'];
    const lowPriorityFields = ['logs', 'statistics'];

    if (highPriorityFields.some(field => fieldName.includes(field))) return 0.9;
    if (mediumPriorityFields.some(field => fieldName.includes(field))) return 0.6;
    if (lowPriorityFields.some(field => fieldName.includes(field))) return 0.3;
    return 0.5;
  }

  private getBaseTTL(dataType: 'static' | 'transactional' | 'realtime'): number {
    switch (dataType) {
      case 'static':
        return 1800000; // 30 分鐘
      case 'transactional':
        return 300000; // 5 分鐘
      case 'realtime':
        return 60000; // 1 分鐘
    }
  }

  private getDefaultFeatures(fieldName: string): MLFeatures {
    const dataType = this.inferDataType(fieldName);
    return {
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      isBusinessHours: this.isBusinessHours(new Date()),
      accessFrequency: 10,
      accessPattern: 'steady',
      hitRate: 0.5,
      avgResponseTime: 200,
      dataType,
      businessPriority: this.getBusinessPriority(fieldName),
      dataFreshness: 0.5,
    };
  }

  private getBootstrapConfig(fieldName: string, features: MLFeatures): PredictedCacheConfig {
    return {
      ttl: this.getBaseTTL(features.dataType),
      cacheSize: 50,
      shouldCache: features.businessPriority > 0.5,
      confidence: 0.3,
      reasons: ['使用預設配置，數據點不足進行 ML 預測'],
    };
  }
}

// 導出單例實例
export const mlCacheOptimizer = new MLCacheOptimizer();
export type { CacheMetrics, PredictedCacheConfig, MLFeatures };
