/**
 * Web Vitals 收集器
 * 收集 Core Web Vitals 指標並整合到性能監控系統
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { SimplePerformanceMonitor } from './SimplePerformanceMonitor';

// Web Vitals 指標類型
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

// 性能預算配置
export interface PerformanceBudget {
  LCP: { good: number; needsImprovement: number; poor: number };
  INP: { good: number; needsImprovement: number; poor: number };
  CLS: { good: number; needsImprovement: number; poor: number };
  FCP: { good: number; needsImprovement: number; poor: number };
  TTFB: { good: number; needsImprovement: number; poor: number };
}

// 預算驗證結果
export interface BudgetValidationResult {
  metric: string;
  value: number;
  budget: { good: number; needsImprovement: number; poor: number };
  rating: 'good' | 'needs-improvement' | 'poor';
  passed: boolean;
  percentage: number;
}

/**
 * Web Vitals 收集器類
 */
export class WebVitalsCollector {
  private performanceMonitor: SimplePerformanceMonitor;
  private budget: PerformanceBudget;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private isInitialized = false;

  constructor(performanceMonitor: SimplePerformanceMonitor) {
    this.performanceMonitor = performanceMonitor;
    this.budget = this.getDefaultBudget();
  }

  /**
   * 獲取默認性能預算（基於 Google 建議）
   */
  private getDefaultBudget(): PerformanceBudget {
    return {
      LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
      INP: { good: 200, needsImprovement: 500, poor: 500 },
      CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
      TTFB: { good: 800, needsImprovement: 1800, poor: 1800 },
    };
  }

  /**
   * 初始化 Web Vitals 收集
   */
  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    // 收集 LCP (Largest Contentful Paint)
    onLCP(metric => {
      this.handleMetric('LCP', metric);
    });

    // 收集 INP (Interaction to Next Paint)
    onINP(metric => {
      this.handleMetric('INP', metric);
    });

    // 收集 CLS (Cumulative Layout Shift)
    onCLS(metric => {
      this.handleMetric('CLS', metric);
    });

    // 收集 FCP (First Contentful Paint)
    onFCP(metric => {
      this.handleMetric('FCP', metric);
    });

    // 收集 TTFB (Time to First Byte)
    onTTFB(metric => {
      this.handleMetric('TTFB', metric);
    });

    this.isInitialized = true;
    console.log('[WebVitalsCollector] Initialized successfully');
  }

  /**
   * 處理 Web Vitals 指標
   */
  private handleMetric(
    name: WebVitalsMetric['name'],
    metric: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
      delta: number;
      id: string;
      navigationType?: string;
    }
  ): void {
    const webVitalsMetric: WebVitalsMetric = {
      name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'unknown',
      timestamp: Date.now(),
    };

    // 儲存指標
    this.metrics.set(name, webVitalsMetric);

    // 記錄到性能監控系統
    this.performanceMonitor.recordMetric(
      `webvitals_${name.toLowerCase()}`,
      metric.value,
      'web-vitals'
    );

    // 驗證預算
    const budgetResult = this.validateBudget(name, metric.value);

    // 如果超過預算，記錄警告
    if (!budgetResult.passed) {
      this.performanceMonitor.recordMetric(
        `webvitals_${name.toLowerCase()}_budget_violation`,
        budgetResult.percentage,
        'budget-violation'
      );
    }

    console.log(`[WebVitals] ${name}: ${metric.value} (${metric.rating})`);
  }

  /**
   * 驗證性能預算
   */
  validateBudget(metric: string, value: number): BudgetValidationResult {
    const budget = this.budget[metric as keyof PerformanceBudget];
    if (!budget) {
      return {
        metric,
        value,
        budget: { good: 0, needsImprovement: 0, poor: 0 },
        rating: 'poor',
        passed: false,
        percentage: 0,
      };
    }

    let rating: 'good' | 'needs-improvement' | 'poor';
    let passed: boolean;
    let percentage: number;

    if (value <= budget.good) {
      rating = 'good';
      passed = true;
      percentage = (value / budget.good) * 100;
    } else if (value <= budget.needsImprovement) {
      rating = 'needs-improvement';
      passed = false;
      percentage = (value / budget.needsImprovement) * 100;
    } else {
      rating = 'poor';
      passed = false;
      percentage = (value / budget.poor) * 100;
    }

    return {
      metric,
      value,
      budget,
      rating,
      passed,
      percentage: Math.round(percentage),
    };
  }

  /**
   * 獲取所有 Web Vitals 指標
   */
  getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 獲取特定指標
   */
  getMetric(name: WebVitalsMetric['name']): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * 獲取性能分數（0-100）
   */
  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good':
          return 100;
        case 'needs-improvement':
          return 60;
        case 'poor':
          return 20;
        default:
          return 0;
      }
    });

    return Math.round(
      scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
    );
  }

  /**
   * 獲取預算驗證報告
   */
  getBudgetReport(): BudgetValidationResult[] {
    const metrics = this.getMetrics();
    return metrics.map(metric => this.validateBudget(metric.name, metric.value));
  }

  /**
   * 更新性能預算
   */
  updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...newBudget };
    console.log('[WebVitalsCollector] Budget updated');
  }

  /**
   * 獲取當前預算配置
   */
  getBudget(): PerformanceBudget {
    return { ...this.budget };
  }

  /**
   * 重置收集器
   */
  reset(): void {
    this.metrics.clear();
    console.log('[WebVitalsCollector] Reset completed');
  }

  /**
   * 獲取 Web Vitals 摘要
   */
  getSummary(): {
    totalMetrics: number;
    performanceScore: number;
    budgetViolations: number;
    goodMetrics: number;
    poorMetrics: number;
  } {
    const metrics = this.getMetrics();
    const budgetReport = this.getBudgetReport();

    return {
      totalMetrics: metrics.length,
      performanceScore: this.getPerformanceScore(),
      budgetViolations: budgetReport.filter(r => !r.passed).length,
      goodMetrics: metrics.filter(m => m.rating === 'good').length,
      poorMetrics: metrics.filter(m => m.rating === 'poor').length,
    };
  }
}

// 創建全局實例
let webVitalsCollector: WebVitalsCollector | null = null;

/**
 * 獲取 Web Vitals 收集器實例
 */
export function getWebVitalsCollector(): WebVitalsCollector {
  if (!webVitalsCollector) {
    // 延遲載入 SimplePerformanceMonitor
    const { SimplePerformanceMonitor } = require('./SimplePerformanceMonitor');
    const monitor = SimplePerformanceMonitor.getInstance();
    webVitalsCollector = new WebVitalsCollector(monitor);
  }
  return webVitalsCollector;
}

/**
 * 初始化 Web Vitals 收集（便利函數）
 */
export function initializeWebVitals(): void {
  if (typeof window !== 'undefined') {
    const collector = getWebVitalsCollector();
    collector.initialize();
  }
}
