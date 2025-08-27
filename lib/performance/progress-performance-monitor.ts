/**
 * Progress Performance Monitor
 * 監控進度更新的性能指標，用於驗證防抖機制的效果
 */

import { useMemo, useCallback } from 'react';

export interface ProgressPerformanceMetrics {
  /** Total number of progress updates requested */
  totalUpdates: number;
  /** Number of actual DOM updates performed */
  actualUpdates: number;
  /** Number of updates that were debounced/batched */
  debouncedUpdates: number;
  /** Average time between updates (ms) */
  averageUpdateInterval: number;
  /** Maximum update frequency (updates per second) */
  maxUpdateFrequency: number;
  /** Number of render cycles triggered */
  renderCycles: number;
  /** Total time spent in update operations (ms) */
  totalUpdateTime: number;
  /** Performance improvement ratio (0-1) */
  performanceImprovement: number;
  /** Memory usage statistics */
  memoryStats?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
}

export interface ProgressUpdateEvent {
  timestamp: number;
  type: 'progress' | 'status' | 'batch';
  itemIndex?: number;
  debounced: boolean;
  renderTriggered: boolean;
  updateTime: number;
}

export class ProgressPerformanceMonitor {
  private events: ProgressUpdateEvent[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;
  private renderCount: number = 0;
  private lastUpdateTime: number = 0;
  private maxHistorySize: number = 1000;

  /**
   * Start monitoring progress performance
   */
  public startMonitoring(): void {
    this.isMonitoring = true;
    this.startTime = performance.now();
    this.events = [];
    this.renderCount = 0;
    this.lastUpdateTime = 0;
  }

  /**
   * Stop monitoring and return metrics
   */
  public stopMonitoring(): ProgressPerformanceMetrics {
    this.isMonitoring = false;
    return this.calculateMetrics();
  }

  /**
   * Record a progress update event
   */
  public recordProgressUpdate(
    type: 'progress' | 'status' | 'batch',
    debounced: boolean = false,
    renderTriggered: boolean = true,
    itemIndex?: number
  ): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const updateTime = this.lastUpdateTime > 0 ? now - this.lastUpdateTime : 0;
    this.lastUpdateTime = now;

    if (renderTriggered) {
      this.renderCount++;
    }

    const event: ProgressUpdateEvent = {
      timestamp: now,
      type,
      itemIndex,
      debounced,
      renderTriggered,
      updateTime,
    };

    this.events.push(event);

    // Maintain history size limit
    if (this.events.length > this.maxHistorySize) {
      this.events.shift();
    }
  }

  /**
   * Record a render cycle
   */
  public recordRender(): void {
    if (!this.isMonitoring) return;
    this.renderCount++;
  }

  /**
   * Get current metrics without stopping monitoring
   */
  public getCurrentMetrics(): ProgressPerformanceMetrics {
    return this.calculateMetrics();
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.events = [];
    this.renderCount = 0;
    this.lastUpdateTime = 0;
    this.startTime = performance.now();
  }

  /**
   * Get a performance comparison between debounced and non-debounced updates
   */
  public getPerformanceComparison(): {
    debounced: Partial<ProgressPerformanceMetrics>;
    nonDebounced: Partial<ProgressPerformanceMetrics>;
    improvement: number;
  } {
    const debouncedEvents = this.events.filter(e => e.debounced);
    const nonDebouncedEvents = this.events.filter(e => !e.debounced);

    const debouncedMetrics = this.calculateMetricsForEvents(debouncedEvents);
    const nonDebouncedMetrics = this.calculateMetricsForEvents(nonDebouncedEvents);

    const improvement = nonDebouncedEvents.length > 0
      ? (nonDebouncedEvents.length - debouncedEvents.length) / nonDebouncedEvents.length
      : 0;

    return {
      debounced: debouncedMetrics,
      nonDebounced: nonDebouncedMetrics,
      improvement,
    };
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    metadata: {
      monitoringDuration: number;
      totalEvents: number;
      renderCount: number;
    };
    events: ProgressUpdateEvent[];
    metrics: ProgressPerformanceMetrics;
  } {
    return {
      metadata: {
        monitoringDuration: performance.now() - this.startTime,
        totalEvents: this.events.length,
        renderCount: this.renderCount,
      },
      events: [...this.events],
      metrics: this.calculateMetrics(),
    };
  }

  /**
   * Generate a performance report
   */
  public generateReport(): string {
    const metrics = this.calculateMetrics();
    const comparison = this.getPerformanceComparison();

    return `
# Progress Update Performance Report

## Overall Metrics
- Total Updates: ${metrics.totalUpdates}
- Actual DOM Updates: ${metrics.actualUpdates}
- Debounced Updates: ${metrics.debouncedUpdates}
- Render Cycles: ${metrics.renderCycles}
- Performance Improvement: ${(metrics.performanceImprovement * 100).toFixed(2)}%

## Update Frequency
- Average Update Interval: ${metrics.averageUpdateInterval.toFixed(2)}ms
- Max Update Frequency: ${metrics.maxUpdateFrequency.toFixed(2)} updates/sec
- Total Update Time: ${metrics.totalUpdateTime.toFixed(2)}ms

## Debouncing Effectiveness
- Debounced Events: ${comparison.debounced.totalUpdates || 0}
- Non-debounced Events: ${comparison.nonDebounced.totalUpdates || 0}
- Improvement Ratio: ${(comparison.improvement * 100).toFixed(2)}%

## Memory Usage
${metrics.memoryStats ? `
- Heap Used: ${(metrics.memoryStats.heapUsed / 1024 / 1024).toFixed(2)} MB
- Heap Total: ${(metrics.memoryStats.heapTotal / 1024 / 1024).toFixed(2)} MB
- External: ${(metrics.memoryStats.external / 1024 / 1024).toFixed(2)} MB
` : 'Memory stats not available'}

## Recommendations
${this.generateRecommendations(metrics)}
    `.trim();
  }

  private calculateMetrics(): ProgressPerformanceMetrics {
    return this.calculateMetricsForEvents(this.events);
  }

  private calculateMetricsForEvents(events: ProgressUpdateEvent[]): ProgressPerformanceMetrics {
    const totalUpdates = events.length;
    const debouncedUpdates = events.filter(e => e.debounced).length;
    const actualUpdates = events.filter(e => e.renderTriggered).length;
    
    const updateIntervals = events
      .map(e => e.updateTime)
      .filter(time => time > 0);
    
    const averageUpdateInterval = updateIntervals.length > 0
      ? updateIntervals.reduce((sum, time) => sum + time, 0) / updateIntervals.length
      : 0;

    const totalUpdateTime = updateIntervals.reduce((sum, time) => sum + time, 0);

    // Calculate max update frequency in a sliding window
    const windowSize = 1000; // 1 second window
    let maxFrequency = 0;
    
    for (let i = 0; i < events.length; i++) {
      const windowStart = events[i].timestamp;
      const windowEnd = windowStart + windowSize;
      const eventsInWindow = events.filter(
        e => e.timestamp >= windowStart && e.timestamp <= windowEnd
      ).length;
      maxFrequency = Math.max(maxFrequency, eventsInWindow);
    }

    const performanceImprovement = totalUpdates > 0
      ? (totalUpdates - actualUpdates) / totalUpdates
      : 0;

    // Get memory stats if available (browser environment)
    let memoryStats;
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      memoryStats = {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.usedJSHeapSize,
      };
    }

    return {
      totalUpdates,
      actualUpdates,
      debouncedUpdates,
      averageUpdateInterval,
      maxUpdateFrequency: maxFrequency,
      renderCycles: this.renderCount,
      totalUpdateTime,
      performanceImprovement,
      memoryStats,
    };
  }

  private generateRecommendations(metrics: ProgressPerformanceMetrics): string {
    const recommendations: string[] = [];

    if (metrics.performanceImprovement < 0.3) {
      recommendations.push('- Consider increasing debounce delay for better performance');
    }

    if (metrics.maxUpdateFrequency > 10) {
      recommendations.push('- High update frequency detected, enable smart batching');
    }

    if (metrics.renderCycles > metrics.totalUpdates * 1.5) {
      recommendations.push('- Too many render cycles, optimize component memoization');
    }

    if (metrics.averageUpdateInterval < 50) {
      recommendations.push('- Very frequent updates, consider throttling');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Performance looks good! Current optimization is effective.');
    }

    return recommendations.join('\n');
  }
}

// Global instance for easy access
export const progressPerformanceMonitor = new ProgressPerformanceMonitor();

/**
 * React hook for monitoring progress performance
 */
export function useProgressPerformanceMonitor() {
  const monitor = useMemo(() => new ProgressPerformanceMonitor(), []);

  const startMonitoring = useCallback(() => {
    monitor.startMonitoring();
  }, [monitor]);

  const stopMonitoring = useCallback(() => {
    return monitor.stopMonitoring();
  }, [monitor]);

  const recordUpdate = useCallback((
    type: 'progress' | 'status' | 'batch',
    debounced = false,
    renderTriggered = true,
    itemIndex?: number
  ) => {
    monitor.recordProgressUpdate(type, debounced, renderTriggered, itemIndex);
  }, [monitor]);

  const getReport = useCallback(() => {
    return monitor.generateReport();
  }, [monitor]);

  return {
    startMonitoring,
    stopMonitoring,
    recordUpdate,
    getReport,
    getCurrentMetrics: monitor.getCurrentMetrics.bind(monitor),
    exportData: monitor.exportData.bind(monitor),
  };
}

// Helper function for performance testing
export function createProgressPerformanceTest(
  testName: string,
  progressUpdates: Array<{ type: 'progress' | 'status'; delay?: number; count?: number }>
): Promise<ProgressPerformanceMetrics> {
  return new Promise((resolve) => {
    const monitor = new ProgressPerformanceMonitor();
    monitor.startMonitoring();

    let updateIndex = 0;
    
    const processNext = () => {
      if (updateIndex >= progressUpdates.length) {
        const metrics = monitor.stopMonitoring();
        console.log(`Performance Test "${testName}" completed:`, metrics);
        resolve(metrics);
        return;
      }

      const update = progressUpdates[updateIndex];
      const count = update.count || 1;
      const delay = update.delay || 0;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          monitor.recordProgressUpdate(update.type, false, true, i);
          if (i === count - 1) {
            updateIndex++;
            setTimeout(processNext, delay);
          }
        }, i * 10); // Small delay between batch updates
      }
    };

    processNext();
  });
}