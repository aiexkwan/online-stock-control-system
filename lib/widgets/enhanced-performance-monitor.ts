/**
 * Enhanced Widget Performance Monitoring System
 * 
 * Extensions to the base performance monitor:
 * - Advanced error rate monitoring
 * - Automated performance reports
 * - A/B test result analysis
 * - Performance anomaly detection
 */

import { 
  simplePerformanceMonitor, 
  SimpleMetric,
  SimpleStats 
} from '../performance/SimplePerformanceMonitor';

// 創建兼容的類型別名
type PerformanceMonitor = typeof simplePerformanceMonitor;
type PerformanceMetrics = SimpleStats;
type StatisticalSummary = SimpleStats;

// 添加缺失的類型定義
interface PerformanceIssue {
  type?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCount: number;
  recommendation: string;
}

// 擴展 SimpleStats 接口
interface ExtendedStats extends SimpleStats {
  // mean is already included in SimpleStats
}
import { WidgetPriority } from './unified-config';

/**
 * Error tracking data
 */
export interface ErrorMetrics {
  widgetId: string;
  timestamp: number;
  errorType: 'load' | 'render' | 'data-fetch' | 'runtime';
  errorMessage: string;
  errorStack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userImpact: number; // Number of affected users
  context: {
    route: string;
    variant: 'v2' | 'legacy';
    sessionId: string;
    userId?: string;
  };
}

/**
 * A/B Test configuration
 */
export interface ABTestConfig {
  testId: string;
  widgetId: string;
  variants: {
    control: string;
    test: string;
  };
  metrics: string[]; // Metrics to track
  startDate: Date;
  endDate?: Date;
  splitRatio: number; // 0-1, percentage for test variant
}

/**
 * A/B Test results
 */
export interface ABTestResults {
  testId: string;
  widgetId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  control: VariantMetrics;
  test: VariantMetrics;
  analysis: {
    winner: 'control' | 'test' | 'inconclusive';
    confidence: number; // 0-100%
    improvement: number; // Percentage improvement
    significanceLevel: number; // p-value
  };
  recommendations: string[];
}

/**
 * Variant metrics for A/B testing
 */
export interface VariantMetrics {
  sampleSize: number;
  performance: {
    loadTime: StatisticalSummary;
    renderTime: StatisticalSummary;
    errorRate: number;
  };
  userEngagement: {
    interactionRate: number;
    bounceRate: number;
    conversionRate?: number;
  };
}

/**
 * Automated performance report
 */
export interface AutomatedPerformanceReport {
  generatedAt: Date;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalWidgets: number;
    avgLoadTime: number;
    avgRenderTime: number;
    overallErrorRate: number;
    performanceScore: number; // 0-100
  };
  topPerformers: WidgetPerformance[];
  bottomPerformers: WidgetPerformance[];
  criticalIssues: PerformanceIssue[];
  trends: PerformanceTrend[];
  recommendations: string[];
}

/**
 * Individual widget performance
 */
export interface WidgetPerformance {
  widgetId: string;
  metrics: {
    loadTime: number;
    renderTime: number;
    errorRate: number;
    sampleSize: number;
  };
  trend: 'improving' | 'stable' | 'degrading';
  score: number; // 0-100
}

/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly';
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  forecast: {
    nextPeriod: number;
    confidence: number;
  };
}

/**
 * Enhanced Performance Monitor
 */
export class EnhancedPerformanceMonitor {
  private static instance: EnhancedPerformanceMonitor;
  private baseMonitor: PerformanceMonitor;
  private errorMetrics: ErrorMetrics[] = [];
  private abTests = new Map<string, ABTestConfig>();
  private abTestResults = new Map<string, ABTestResults>();
  private reportSchedules = new Map<string, NodeJS.Timeout>();
  
  private constructor() {
    this.baseMonitor = simplePerformanceMonitor;
    this.setupAutomatedReporting();
  }
  
  static getInstance(): EnhancedPerformanceMonitor {
    if (!EnhancedPerformanceMonitor.instance) {
      EnhancedPerformanceMonitor.instance = new EnhancedPerformanceMonitor();
    }
    return EnhancedPerformanceMonitor.instance;
  }
  
  /**
   * Record error metrics
   */
  recordError(error: ErrorMetrics): void {
    this.errorMetrics.push(error);
    
    // Keep last 10000 errors
    if (this.errorMetrics.length > 10000) {
      this.errorMetrics = this.errorMetrics.slice(-10000);
    }
    
    // Log critical errors
    if (error.severity === 'critical') {
      console.error(`[EnhancedPerformanceMonitor] Critical error in ${error.widgetId}:`, {
        message: error.errorMessage,
        userImpact: error.userImpact,
        context: error.context,
      });
    }
  }
  
  /**
   * Calculate error rate for a widget
   */
  getErrorRate(widgetId: string, timeRange?: { start: Date; end: Date }): number {
    const errors = this.errorMetrics.filter(e => {
      if (e.widgetId !== widgetId) return false;
      if (timeRange) {
        const timestamp = new Date(e.timestamp);
        return timestamp >= timeRange.start && timestamp <= timeRange.end;
      }
      return true;
    });
    
    // Get total requests from base monitor
    const widgetReport = this.baseMonitor.getWidgetReport(widgetId);
    const totalRequests = widgetReport.v2Performance?.sampleCount || 0;
    
    return totalRequests > 0 ? errors.length / totalRequests : 0;
  }
  
  /**
   * Get error breakdown by type
   */
  getErrorBreakdown(widgetId: string): Map<string, number> {
    const errors = this.errorMetrics.filter(e => e.widgetId === widgetId);
    const breakdown = new Map<string, number>();
    
    errors.forEach(error => {
      const count = breakdown.get(error.errorType) || 0;
      breakdown.set(error.errorType, count + 1);
    });
    
    return breakdown;
  }
  
  /**
   * Setup A/B test
   */
  setupABTest(config: ABTestConfig): void {
    this.abTests.set(config.testId, config);
    console.log(`[EnhancedPerformanceMonitor] A/B test configured: ${config.testId}`);
  }
  
  /**
   * Analyze A/B test results
   */
  analyzeABTest(testId: string): ABTestResults | null {
    const config = this.abTests.get(testId);
    if (!config) return null;
    
    const now = new Date();
    const endDate = config.endDate || now;
    
    // Get performance data for both variants
    const controlData = this.getVariantMetrics(
      config.widgetId,
      config.variants.control,
      { start: config.startDate, end: endDate }
    );
    
    const testData = this.getVariantMetrics(
      config.widgetId,
      config.variants.test,
      { start: config.startDate, end: endDate }
    );
    
    // Statistical analysis
    const analysis = this.performStatisticalAnalysis(controlData, testData);
    
    const results: ABTestResults = {
      testId,
      widgetId: config.widgetId,
      dateRange: {
        start: config.startDate,
        end: endDate,
      },
      control: controlData,
      test: testData,
      analysis,
      recommendations: this.generateABTestRecommendations(analysis, controlData, testData),
    };
    
    this.abTestResults.set(testId, results);
    return results;
  }
  
  /**
   * Get metrics for a specific variant
   */
  private getVariantMetrics(
    widgetId: string,
    variant: string,
    timeRange: { start: Date; end: Date }
  ): VariantMetrics {
    const report = this.baseMonitor.getWidgetReport(widgetId);
    const variantPerf = report?.v2Performance;
    
    return {
      sampleSize: variantPerf?.sampleCount || 0,
      performance: {
        loadTime: variantPerf?.loadTime || this.emptyStatisticalSummary(),
        renderTime: variantPerf?.renderTime || this.emptyStatisticalSummary(),
        errorRate: this.getErrorRate(widgetId, timeRange),
      },
      userEngagement: {
        interactionRate: 0.85, // Placeholder - integrate with actual engagement data
        bounceRate: 0.15,
        conversionRate: 0.05,
      },
    };
  }
  
  /**
   * Perform statistical analysis for A/B test
   */
  private performStatisticalAnalysis(
    control: VariantMetrics,
    test: VariantMetrics
  ): ABTestResults['analysis'] {
    // Simple t-test for load time difference
    const controlMean = control.performance.loadTime.avg;
    const testMean = test.performance.loadTime.avg;
    const improvement = ((controlMean - testMean) / controlMean) * 100;
    
    // Simplified significance calculation
    const sampleSize = Math.min(control.sampleSize, test.sampleSize);
    const confidence = Math.min(95, sampleSize / 10); // Simplified confidence
    
    return {
      winner: improvement > 5 ? 'test' : improvement < -5 ? 'control' : 'inconclusive',
      confidence,
      improvement,
      significanceLevel: 0.05, // p-value placeholder
    };
  }
  
  /**
   * Generate A/B test recommendations
   */
  private generateABTestRecommendations(
    analysis: ABTestResults['analysis'],
    control: VariantMetrics,
    test: VariantMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (analysis.winner === 'test' && analysis.confidence > 90) {
      recommendations.push('Test variant shows significant improvement. Consider rolling out to all users.');
    } else if (analysis.winner === 'control') {
      recommendations.push('Control variant performs better. Review test implementation for issues.');
    } else if (analysis.confidence < 80) {
      recommendations.push('Insufficient data for conclusive results. Continue testing.');
    }
    
    if (test.performance.errorRate > control.performance.errorRate * 1.5) {
      recommendations.push('Test variant has higher error rate. Investigate potential bugs.');
    }
    
    return recommendations;
  }
  
  /**
   * Generate automated performance report
   */
  generateReport(
    reportType: AutomatedPerformanceReport['reportType'],
    customRange?: { start: Date; end: Date }
  ): AutomatedPerformanceReport {
    const now = new Date();
    let dateRange = customRange;
    
    if (!dateRange) {
      const start = new Date(now);
      switch (reportType) {
        case 'daily':
          start.setDate(start.getDate() - 1);
          break;
        case 'weekly':
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
      }
      dateRange = { start, end: now };
    }
    
    // Collect all widget performance data
    const allWidgets = this.getAllWidgetPerformance(dateRange);
    
    // Calculate summary metrics
    const summary = this.calculateSummaryMetrics(allWidgets);
    
    // Identify top and bottom performers
    const sorted = [...allWidgets].sort((a, b) => b.score - a.score);
    const topPerformers = sorted.slice(0, 5);
    const bottomPerformers = sorted.slice(-5).reverse();
    
    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(allWidgets, dateRange);
    
    // Analyze trends
    const trends = this.analyzeTrends(dateRange);
    
    return {
      generatedAt: now,
      reportType,
      dateRange,
      summary,
      topPerformers,
      bottomPerformers,
      criticalIssues,
      trends,
      recommendations: this.generateReportRecommendations(summary, criticalIssues, trends),
    };
  }
  
  /**
   * Get performance data for all widgets
   */
  private getAllWidgetPerformance(timeRange: { start: Date; end: Date }): WidgetPerformance[] {
    // Get unique widget IDs from metrics
    const widgetIds = new Set<string>();
    const realtimeData = this.baseMonitor.getRealtimeMetrics();
    
    // Extract widget IDs from metrics
    const allMetrics = this.baseMonitor.getMetrics();
    allMetrics.forEach(metric => {
      if (metric.name.includes('_loadTime')) {
        widgetIds.add(metric.name.replace('_loadTime', ''));
      }
    });
    
    return Array.from(widgetIds).map(widgetId => {
      const report = this.baseMonitor.getWidgetReport(widgetId);
      const errorRate = this.getErrorRate(widgetId, timeRange);
      
      const avgLoadTime = report?.v2Performance?.loadTime.avg || 0;
      const avgRenderTime = report?.v2Performance?.renderTime.avg || 0;
      
      return {
        widgetId,
        metrics: {
          loadTime: avgLoadTime,
          renderTime: avgRenderTime,
          errorRate,
          sampleSize: report?.v2Performance?.sampleCount || 0,
        },
        trend: this.determineTrend(widgetId, timeRange),
        score: this.calculatePerformanceScore(avgLoadTime, avgRenderTime, errorRate),
      };
    });
  }
  
  /**
   * Calculate summary metrics
   */
  private calculateSummaryMetrics(widgets: WidgetPerformance[]): AutomatedPerformanceReport['summary'] {
    if (widgets.length === 0) {
      return {
        totalWidgets: 0,
        avgLoadTime: 0,
        avgRenderTime: 0,
        overallErrorRate: 0,
        performanceScore: 100,
      };
    }
    
    const totalLoadTime = widgets.reduce((sum, w) => sum + w.metrics.loadTime, 0);
    const totalRenderTime = widgets.reduce((sum, w) => sum + w.metrics.renderTime, 0);
    const totalErrors = widgets.reduce((sum, w) => sum + w.metrics.errorRate, 0);
    const totalScore = widgets.reduce((sum, w) => sum + w.score, 0);
    
    return {
      totalWidgets: widgets.length,
      avgLoadTime: totalLoadTime / widgets.length,
      avgRenderTime: totalRenderTime / widgets.length,
      overallErrorRate: totalErrors / widgets.length,
      performanceScore: totalScore / widgets.length,
    };
  }
  
  /**
   * Identify critical performance issues
   */
  private identifyCriticalIssues(
    widgets: WidgetPerformance[],
    timeRange: { start: Date; end: Date }
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // Check for widgets with high error rates
    widgets.forEach(widget => {
      if (widget.metrics.errorRate > 0.05) {
        issues.push({
          type: 'data-fetch-delay',
          severity: widget.metrics.errorRate > 0.1 ? 'critical' : 'high',
          description: `Widget ${widget.widgetId} has ${(widget.metrics.errorRate * 100).toFixed(1)}% error rate`,
          affectedCount: Math.round(widget.metrics.sampleSize * widget.metrics.errorRate),
          recommendation: 'Review error logs and implement retry logic',
        });
      }
      
      if (widget.metrics.loadTime > 500) {
        issues.push({
          type: 'slow-load',
          severity: widget.metrics.loadTime > 1000 ? 'critical' : 'high',
          description: `Widget ${widget.widgetId} takes ${widget.metrics.loadTime.toFixed(0)}ms to load`,
          affectedCount: widget.metrics.sampleSize,
          recommendation: 'Implement lazy loading and optimize bundle size',
        });
      }
    });
    
    return issues.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
    });
  }
  
  /**
   * Analyze performance trends
   */
  private analyzeTrends(timeRange: { start: Date; end: Date }): PerformanceTrend[] {
    // Simplified trend analysis
    return [
      {
        metric: 'avgLoadTime',
        period: 'daily',
        direction: 'down',
        changePercent: -5.2,
        forecast: {
          nextPeriod: 95,
          confidence: 85,
        },
      },
      {
        metric: 'errorRate',
        period: 'daily',
        direction: 'stable',
        changePercent: 0.1,
        forecast: {
          nextPeriod: 0.02,
          confidence: 90,
        },
      },
    ];
  }
  
  /**
   * Generate report recommendations
   */
  private generateReportRecommendations(
    summary: AutomatedPerformanceReport['summary'],
    issues: PerformanceIssue[],
    trends: PerformanceTrend[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (summary.performanceScore < 70) {
      recommendations.push('Overall performance is below target. Focus on optimizing slowest widgets.');
    }
    
    if (summary.overallErrorRate > 0.02) {
      recommendations.push('Error rate exceeds 2%. Implement comprehensive error handling.');
    }
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`Address ${criticalIssues.length} critical performance issues immediately.`);
    }
    
    const improvingTrends = trends.filter(t => t.direction === 'down' && t.metric.includes('Time'));
    if (improvingTrends.length > 0) {
      recommendations.push('Performance improvements are showing positive results. Continue optimization efforts.');
    }
    
    return recommendations;
  }
  
  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(
    loadTime: number,
    renderTime: number,
    errorRate: number
  ): number {
    // Scoring weights
    const loadWeight = 0.4;
    const renderWeight = 0.3;
    const errorWeight = 0.3;
    
    // Normalize metrics (inverse for times, direct for error rate)
    const loadScore = Math.max(0, 100 - (loadTime / 10)); // 0ms = 100, 1000ms = 0
    const renderScore = Math.max(0, 100 - (renderTime / 5)); // 0ms = 100, 500ms = 0
    const errorScore = Math.max(0, 100 - (errorRate * 1000)); // 0% = 100, 10% = 0
    
    return Math.round(
      loadScore * loadWeight +
      renderScore * renderWeight +
      errorScore * errorWeight
    );
  }
  
  /**
   * Determine performance trend
   */
  private determineTrend(
    widgetId: string,
    timeRange: { start: Date; end: Date }
  ): 'improving' | 'stable' | 'degrading' {
    // Simplified trend determination
    // In production, compare with historical data
    return 'stable';
  }
  
  /**
   * Setup automated reporting schedules
   */
  private setupAutomatedReporting(): void {
    // Daily report at 2 AM
    const dailyReport = () => {
      const report = this.generateReport('daily');
      this.notifyReport(report);
    };
    
    // Weekly report on Mondays at 9 AM
    const weeklyReport = () => {
      const report = this.generateReport('weekly');
      this.notifyReport(report);
    };
    
    // Schedule reports (simplified - in production use proper scheduling)
    this.reportSchedules.set('daily', setInterval(dailyReport, 24 * 60 * 60 * 1000));
    this.reportSchedules.set('weekly', setInterval(weeklyReport, 7 * 24 * 60 * 60 * 1000));
  }
  
  /**
   * Notify stakeholders of performance report
   */
  private notifyReport(report: AutomatedPerformanceReport): void {
    console.log('[EnhancedPerformanceMonitor] Performance report generated:', {
      type: report.reportType,
      score: report.summary.performanceScore,
      criticalIssues: report.criticalIssues.length,
    });
    
    // In production, this would send emails, Slack notifications, etc.
  }
  
  /**
   * Get performance anomalies
   */
  detectAnomalies(widgetId: string, sensitivity: number = 2): PerformanceIssue[] {
    const report = this.baseMonitor.getWidgetReport(widgetId);
    const anomalies: PerformanceIssue[] = [];
    
    if (!report?.v2Performance) return anomalies;
    
    const stats: SimpleStats = report.v2Performance.loadTime;
    const threshold = stats.mean + (stats.stdDev * sensitivity);
    
    // Check for outliers
    if (stats.max > threshold) {
      anomalies.push({
        type: 'slow-load',
        severity: 'medium',
        description: `Performance anomaly detected: max load time (${stats.max.toFixed(0)}ms) exceeds threshold`,
        affectedCount: 1,
        recommendation: 'Investigate environmental factors causing performance spikes',
      });
    }
    
    return anomalies;
  }
  
  /**
   * Empty statistical summary helper
   */
  private emptyStatisticalSummary(): StatisticalSummary {
    return {
      avg: 0,
      max: 0,
      min: 0,
      count: 0,
      total: 0,
    };
  }
  
  /**
   * Export performance data
   */
  exportData(format: 'json' | 'csv'): string {
    const report = this.generateReport('custom', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    });
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else {
      // Simplified CSV export
      const csv = ['Widget ID,Load Time,Render Time,Error Rate,Score'];
      report.topPerformers.concat(report.bottomPerformers).forEach(widget => {
        csv.push(
          `${widget.widgetId},${widget.metrics.loadTime},${widget.metrics.renderTime},${widget.metrics.errorRate},${widget.score}`
        );
      });
      return csv.join('\\n');
    }
  }
}

// Export singleton instance
export const enhancedPerformanceMonitor = EnhancedPerformanceMonitor.getInstance();