/**
 * Extraction Monitor - 訂單提取監控服務
 * 
 * 功能特點：
 * - 實時監控 AI 提取性能
 * - Token 使用量追蹤和成本分析
 * - 準確性指標監控
 * - 健康檢查和警報機制
 * - A/B Testing 支援
 * 
 * @version 1.0.0
 * @author Extraction Monitoring System
 */

import { systemLogger } from '@/lib/logger';
import { EventEmitter } from 'events';

// 提取結果監控接口
export interface ExtractionResult {
  success: boolean;
  extractionTime: number;
  tokensUsed: number;
  orderCount: number;
  correctedCount: number;
  invalidCount: number;
  cacheHitCount: number;
  method: 'chat-completion' | 'chat-completion-fallback' | 'chat-completion-chunked';
  model: string;
  promptVariant?: string; // A/B Testing 用
  complexity?: 'simple' | 'medium' | 'complex';
  error?: string;
  fileName?: string;
}

// 監控指標
export interface MonitoringMetrics {
  totalExtractions: number;
  successRate: number;
  averageExtractionTime: number;
  tokenEfficiency: number; // tokens per order
  accuracyRate: number;
  cacheHitRate: number;
  costEstimate: number;
  p95ExtractionTime: number;
  hourlyExtractions: number;
  failureReasons: Array<{ reason: string; count: number }>;
}

// 健康檢查結果
export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  extractionRate: number;
  errorRate: number;
  avgResponseTime: number;
  recentFailures: number;
  recommendations: string[];
}

// A/B 測試變體定義
export interface PromptVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 流量分配權重
  prompt: string;
  config?: {
    temperature?: number;
    maxTokens?: number;
    complexity?: 'simple' | 'medium' | 'complex';
  };
}

// 性能閾值配置
interface PerformanceThresholds {
  maxExtractionTime: number;    // ms
  maxTokensPerOrder: number;
  minSuccessRate: number;       // percentage
  maxErrorRate: number;         // percentage
  minCacheHitRate: number;      // percentage
}

/**
 * 訂單提取監控器
 */
export class ExtractionMonitor extends EventEmitter {
  private static instance: ExtractionMonitor;
  
  private extractions: (ExtractionResult & { timestamp: number })[] = [];
  private readonly maxHistorySize = 1000;
  private readonly reportingInterval = 5 * 60 * 1000; // 5 minutes
  
  // A/B Testing 變體
  private promptVariants: PromptVariant[] = [];
  private variantStats = new Map<string, { used: number; success: number; totalTime: number; totalTokens: number }>();
  
  // 性能閾值
  private thresholds: PerformanceThresholds = {
    maxExtractionTime: 10000,   // 10 seconds
    maxTokensPerOrder: 50,      // 50 tokens per order
    minSuccessRate: 95,         // 95% success rate
    maxErrorRate: 5,            // 5% error rate
    minCacheHitRate: 70,        // 70% cache hit rate
  };
  
  // Token 成本 (OpenAI 定價，美元/1K tokens)
  private readonly tokenCosts = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
  };

  private constructor() {
    super();
    this.initializeDefaultVariants();
    this.startPeriodicReporting();
  }

  public static getInstance(): ExtractionMonitor {
    if (!ExtractionMonitor.instance) {
      ExtractionMonitor.instance = new ExtractionMonitor();
    }
    return ExtractionMonitor.instance;
  }

  /**
   * 記錄提取結果
   */
  public trackExtraction(result: ExtractionResult): void {
    // 添加時間戳
    const timestampedResult = {
      ...result,
      timestamp: Date.now(),
    };
    
    this.extractions.push(timestampedResult);
    
    // 維護歷史記錄大小
    if (this.extractions.length > this.maxHistorySize) {
      this.extractions.shift();
    }
    
    // 更新 A/B 測試統計
    if (result.promptVariant) {
      this.updateVariantStats(result);
    }
    
    // 檢查性能閾值
    this.checkPerformanceThresholds(result);
    
    // 詳細日誌記錄
    systemLogger.info({
      success: result.success,
      extractionTime: result.extractionTime,
      tokensUsed: result.tokensUsed,
      orderCount: result.orderCount,
      method: result.method,
      model: result.model,
      promptVariant: result.promptVariant,
      complexity: result.complexity,
      tokenEfficiency: result.orderCount > 0 ? result.tokensUsed / result.orderCount : 0,
    }, '[ExtractionMonitor] Tracking extraction result');
  }

  /**
   * 獲取監控指標
   */
  public getMetrics(windowMs: number = 60 * 60 * 1000): MonitoringMetrics {
    const cutoff = Date.now() - windowMs;
    const recentExtractions = this.extractions.filter(r => r.timestamp >= cutoff);
    
    if (recentExtractions.length === 0) {
      return this.getEmptyMetrics();
    }
    
    const successful = recentExtractions.filter(r => r.success);
    const failed = recentExtractions.filter(r => !r.success);
    
    // 基本統計
    const totalExtractions = recentExtractions.length;
    const successRate = (successful.length / totalExtractions) * 100;
    
    // 時間統計
    const extractionTimes = successful.map(r => r.extractionTime).sort((a, b) => a - b);
    const averageExtractionTime = this.calculateAverage(extractionTimes);
    const p95ExtractionTime = this.calculatePercentile(extractionTimes, 95);
    
    // Token 效率
    const totalTokens = recentExtractions.reduce((sum, r) => sum + r.tokensUsed, 0);
    const totalOrders = recentExtractions.reduce((sum, r) => sum + r.orderCount, 0);
    const tokenEfficiency = totalOrders > 0 ? totalTokens / totalOrders : 0;
    
    // 準確性計算
    const totalCorrected = recentExtractions.reduce((sum, r) => sum + (r.correctedCount || 0), 0);
    const totalInvalid = recentExtractions.reduce((sum, r) => sum + (r.invalidCount || 0), 0);
    const accuracyRate = totalOrders > 0 ? ((totalOrders - totalInvalid) / totalOrders) * 100 : 0;
    
    // 快取命中率
    const totalCacheHits = recentExtractions.reduce((sum, r) => sum + (r.cacheHitCount || 0), 0);
    const cacheHitRate = totalOrders > 0 ? (totalCacheHits / totalOrders) * 100 : 0;
    
    // 成本估算
    const costEstimate = this.calculateCostEstimate(recentExtractions);
    
    // 每小時提取數量
    const hourlyExtractions = (totalExtractions / (windowMs / (60 * 60 * 1000)));
    
    // 失敗原因統計
    const failureReasons = this.analyzeFailureReasons(failed);
    
    return {
      totalExtractions,
      successRate: Math.round(successRate * 10) / 10,
      averageExtractionTime: Math.round(averageExtractionTime),
      tokenEfficiency: Math.round(tokenEfficiency * 10) / 10,
      accuracyRate: Math.round(accuracyRate * 10) / 10,
      cacheHitRate: Math.round(cacheHitRate * 10) / 10,
      costEstimate: Math.round(costEstimate * 1000) / 1000,
      p95ExtractionTime: Math.round(p95ExtractionTime),
      hourlyExtractions: Math.round(hourlyExtractions * 10) / 10,
      failureReasons,
    };
  }

  /**
   * 執行健康檢查
   */
  public async checkHealthThresholds(): Promise<HealthCheck> {
    const metrics = this.getMetrics(15 * 60 * 1000); // 15分鐘窗口
    const recommendations: string[] = [];
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // 檢查成功率
    if (metrics.successRate < this.thresholds.minSuccessRate) {
      status = metrics.successRate < 80 ? 'unhealthy' : 'degraded';
      recommendations.push(`Success rate (${metrics.successRate}%) below threshold (${this.thresholds.minSuccessRate}%)`);
    }
    
    // 檢查響應時間
    if (metrics.p95ExtractionTime > this.thresholds.maxExtractionTime) {
      if (status === 'healthy') status = 'degraded';
      recommendations.push(`P95 response time (${metrics.p95ExtractionTime}ms) exceeds threshold (${this.thresholds.maxExtractionTime}ms)`);
    }
    
    // 檢查 Token 效率
    if (metrics.tokenEfficiency > this.thresholds.maxTokensPerOrder) {
      if (status === 'healthy') status = 'degraded';
      recommendations.push(`Token efficiency (${metrics.tokenEfficiency} tokens/order) exceeds threshold (${this.thresholds.maxTokensPerOrder})`);
    }
    
    // 檢查快取命中率
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      if (status === 'healthy') status = 'degraded';
      recommendations.push(`Cache hit rate (${metrics.cacheHitRate}%) below threshold (${this.thresholds.minCacheHitRate}%)`);
    }
    
    // 檢查最近失敗數量
    const recentFailures = this.extractions
      .filter(r => r.timestamp > Date.now() - 5 * 60 * 1000 && !r.success)
      .length;
    
    if (recentFailures > 5) {
      status = 'unhealthy';
      recommendations.push(`Too many recent failures (${recentFailures} in last 5 minutes)`);
    }
    
    return {
      status,
      extractionRate: metrics.hourlyExtractions,
      errorRate: 100 - metrics.successRate,
      avgResponseTime: metrics.averageExtractionTime,
      recentFailures,
      recommendations,
    };
  }

  /**
   * 獲取 A/B 測試變體
   */
  public getPromptVariant(): PromptVariant | null {
    if (this.promptVariants.length === 0) {
      return null;
    }
    
    // 基於權重的隨機選擇
    const totalWeight = this.promptVariants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const variant of this.promptVariants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant;
      }
    }
    
    // 後備選項
    return this.promptVariants[0];
  }

  /**
   * 獲取 A/B 測試統計
   */
  public getVariantStats(): Array<{
    variant: PromptVariant;
    stats: {
      usage: number;
      successRate: number;
      avgTime: number;
      avgTokens: number;
      confidence: number;
    };
  }> {
    return this.promptVariants.map(variant => {
      const stats = this.variantStats.get(variant.id) || { used: 0, success: 0, totalTime: 0, totalTokens: 0 };
      
      return {
        variant,
        stats: {
          usage: stats.used,
          successRate: stats.used > 0 ? (stats.success / stats.used) * 100 : 0,
          avgTime: stats.used > 0 ? stats.totalTime / stats.used : 0,
          avgTokens: stats.used > 0 ? stats.totalTokens / stats.used : 0,
          confidence: this.calculateStatisticalConfidence(stats.used),
        },
      };
    });
  }

  /**
   * 添加新的 prompt 變體
   */
  public addPromptVariant(variant: PromptVariant): void {
    this.promptVariants.push(variant);
    this.variantStats.set(variant.id, { used: 0, success: 0, totalTime: 0, totalTokens: 0 });
    
    systemLogger.info({
      variantId: variant.id,
      variantName: variant.name,
      weight: variant.weight,
    }, '[ExtractionMonitor] Added new prompt variant');
  }

  /**
   * 移除 prompt 變體
   */
  public removePromptVariant(variantId: string): void {
    this.promptVariants = this.promptVariants.filter(v => v.id !== variantId);
    this.variantStats.delete(variantId);
    
    systemLogger.info({
      variantId,
    }, '[ExtractionMonitor] Removed prompt variant');
  }

  /**
   * 更新性能閾值
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    
    systemLogger.info({
      thresholds: this.thresholds,
    }, '[ExtractionMonitor] Updated performance thresholds');
  }

  /**
   * 生成詳細報告
   */
  public async generateDetailedReport(): Promise<string> {
    const metrics = this.getMetrics(24 * 60 * 60 * 1000); // 24小時
    const health = await this.checkHealthThresholds();
    const variantStats = this.getVariantStats();
    
    let report = '# Extraction Monitoring Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // 健康狀態
    report += `## Health Status: ${health.status.toUpperCase()}\n\n`;
    if (health.recommendations.length > 0) {
      report += '### Recommendations:\n';
      health.recommendations.forEach((rec: string) => {
        report += `- ${rec}\n`;
      });
      report += '\n';
    }
    
    // 核心指標
    report += '## Core Metrics (Last 24 Hours)\n';
    report += `- Total Extractions: ${metrics.totalExtractions}\n`;
    report += `- Success Rate: ${metrics.successRate}%\n`;
    report += `- Average Response Time: ${metrics.averageExtractionTime}ms\n`;
    report += `- P95 Response Time: ${metrics.p95ExtractionTime}ms\n`;
    report += `- Token Efficiency: ${metrics.tokenEfficiency} tokens/order\n`;
    report += `- Accuracy Rate: ${metrics.accuracyRate}%\n`;
    report += `- Cache Hit Rate: ${metrics.cacheHitRate}%\n`;
    report += `- Estimated Cost: $${metrics.costEstimate}\n`;
    report += `- Hourly Rate: ${metrics.hourlyExtractions} extractions/hour\n\n`;
    
    // A/B 測試結果
    if (variantStats.length > 0) {
      report += '## A/B Testing Results\n';
      variantStats.forEach(({ variant, stats }) => {
        report += `### ${variant.name} (${variant.id})\n`;
        report += `- Usage: ${stats.usage} extractions\n`;
        report += `- Success Rate: ${stats.successRate.toFixed(1)}%\n`;
        report += `- Avg Response Time: ${Math.round(stats.avgTime)}ms\n`;
        report += `- Avg Tokens: ${Math.round(stats.avgTokens)}\n`;
        report += `- Statistical Confidence: ${stats.confidence.toFixed(1)}%\n\n`;
      });
    }
    
    // 失敗分析
    if (metrics.failureReasons.length > 0) {
      report += '## Failure Analysis\n';
      metrics.failureReasons.forEach(({ reason, count }) => {
        const percentage = ((count / metrics.totalExtractions) * 100).toFixed(1);
        report += `- ${reason}: ${count} occurrences (${percentage}%)\n`;
      });
      report += '\n';
    }
    
    return report;
  }

  // === 私有輔助方法 ===

  private initializeDefaultVariants(): void {
    // 添加預設的 prompt 變體
    this.addPromptVariant({
      id: 'default',
      name: 'Default Prompt',
      description: 'Standard extraction prompt',
      weight: 80,
      prompt: '', // 將由 ChatCompletionService 填充
    });
    
    this.addPromptVariant({
      id: 'simplified',
      name: 'Simplified Prompt',
      description: 'Minimal token usage prompt',
      weight: 20,
      prompt: '', // 將由 ChatCompletionService 填充
      config: {
        temperature: 0.05,
        maxTokens: 2048,
      },
    });
  }

  private updateVariantStats(result: ExtractionResult): void {
    if (!result.promptVariant) return;
    
    const stats = this.variantStats.get(result.promptVariant) || { used: 0, success: 0, totalTime: 0, totalTokens: 0 };
    
    stats.used++;
    if (result.success) stats.success++;
    stats.totalTime += result.extractionTime;
    stats.totalTokens += result.tokensUsed;
    
    this.variantStats.set(result.promptVariant, stats);
  }

  private checkPerformanceThresholds(result: ExtractionResult): void {
    if (result.extractionTime > this.thresholds.maxExtractionTime) {
      this.emit('threshold-exceeded', {
        type: 'extraction-time',
        value: result.extractionTime,
        threshold: this.thresholds.maxExtractionTime,
        result,
      });
    }
    
    const tokensPerOrder = result.orderCount > 0 ? result.tokensUsed / result.orderCount : result.tokensUsed;
    if (tokensPerOrder > this.thresholds.maxTokensPerOrder) {
      this.emit('threshold-exceeded', {
        type: 'token-efficiency',
        value: tokensPerOrder,
        threshold: this.thresholds.maxTokensPerOrder,
        result,
      });
    }
  }

  private startPeriodicReporting(): void {
    if (process.env.EXTRACTION_MONITOR_REPORTING !== 'true') {
      return;
    }
    
    setInterval(() => {
      const metrics = this.getMetrics();
      const health = this.checkHealthThresholds();
      
      systemLogger.info({
        metrics,
        health,
      }, '[ExtractionMonitor] Periodic health report');
      
      this.emit('health-report', { metrics, health });
    }, this.reportingInterval);
  }

  private calculateCostEstimate(extractions: ExtractionResult[]): number {
    return extractions.reduce((total, extraction) => {
      const modelCosts = this.tokenCosts[extraction.model as keyof typeof this.tokenCosts];
      if (!modelCosts) return total;
      
      // 簡化假設：70% input, 30% output
      const inputTokens = extraction.tokensUsed * 0.7;
      const outputTokens = extraction.tokensUsed * 0.3;
      
      const cost = (inputTokens / 1000) * modelCosts.input + (outputTokens / 1000) * modelCosts.output;
      return total + cost;
    }, 0);
  }

  private analyzeFailureReasons(failedExtractions: ExtractionResult[]): Array<{ reason: string; count: number }> {
    const reasonCounts = new Map<string, number>();
    
    failedExtractions.forEach(extraction => {
      const reason = extraction.error || 'Unknown error';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });
    
    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 前10個最常見的錯誤
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, Math.min(index, sortedNumbers.length - 1))];
  }

  private calculateStatisticalConfidence(sampleSize: number): number {
    // 簡化的統計信心計算：基於樣本大小
    if (sampleSize < 10) return 0;
    if (sampleSize < 30) return 50;
    if (sampleSize < 100) return 75;
    if (sampleSize < 500) return 90;
    return 95;
  }

  private getEmptyMetrics(): MonitoringMetrics {
    return {
      totalExtractions: 0,
      successRate: 0,
      averageExtractionTime: 0,
      tokenEfficiency: 0,
      accuracyRate: 0,
      cacheHitRate: 0,
      costEstimate: 0,
      p95ExtractionTime: 0,
      hourlyExtractions: 0,
      failureReasons: [],
    };
  }

  /**
   * 清理資源（測試用）
   */
  public cleanup(): void {
    this.extractions = [];
    this.variantStats.clear();
    this.removeAllListeners();
    
    systemLogger.info('ExtractionMonitor cleaned up');
  }
}

// 導出單例實例
export const extractionMonitor = ExtractionMonitor.getInstance();