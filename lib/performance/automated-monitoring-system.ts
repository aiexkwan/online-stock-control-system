/**
 * Automated Performance Monitoring System
 * 
 * 提供持續性能監控和自動報告功能
 * 整合Web Vitals、實時性能指標及自動化警告機制
 */

import {
  PerformanceBaselineFramework,
  PerformanceMeasurement,
  RegressionDetectionResult
} from './performance-baseline-framework';
import { GRNLabelCardBenchmarks } from './grn-label-card-benchmarks';

// 監控配置介面
export interface MonitoringConfig {
  components: string[];
  intervals: {
    realTimeCheck: number; // 實時檢查間隔(毫秒)
    periodicReport: number; // 定期報告間隔(毫秒)
    regressionCheck: number; // 回歸檢測間隔(毫秒)
  };
  thresholds: {
    criticalRenderTime: number; // 關鍵渲染時間闾值(ms)
    criticalMemoryUsage: number; // 關鍵記憶體使用闾值(MB)
    warningRenderTime: number; // 警告渲染時間闾值(ms)
    warningMemoryUsage: number; // 警告記憶體使用闾值(MB)
  };
  alerts: {
    enableEmailAlerts: boolean;
    enableConsoleAlerts: boolean;
    enableStorageAlerts: boolean;
  };
  storage: {
    enableLocalStorage: boolean;
    enableSessionStorage: boolean;
    maxHistoryEntries: number;
  };
}

// 預設監控配置
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  components: ['GRNLabelCard'],
  intervals: {
    realTimeCheck: 5000, // 5秒
    periodicReport: 60000, // 1分鐘
    regressionCheck: 300000, // 5分鐘
  },
  thresholds: {
    criticalRenderTime: 300,
    criticalMemoryUsage: 8.0,
    warningRenderTime: 200,
    warningMemoryUsage: 5.0,
  },
  alerts: {
    enableEmailAlerts: false, // 預設關閉，需要配置郵件服務
    enableConsoleAlerts: true,
    enableStorageAlerts: true,
  },
  storage: {
    enableLocalStorage: true,
    enableSessionStorage: false,
    maxHistoryEntries: 100,
  },
};

// 警告信息介面
export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  componentName: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  message: string;
  timestamp: number;
  resolved: boolean;
  recommendations: string[];
}

// 監控結果介面
export interface MonitoringReport {
  timestamp: number;
  timeRange: {
    start: number;
    end: number;
  };
  components: Array<{
    name: string;
    status: 'good' | 'warning' | 'critical';
    metrics: {
      averageRenderTime: number;
      averageMemoryUsage: number;
      totalMeasurements: number;
      regressionCount: number;
    };
    alerts: PerformanceAlert[];
    webVitals: {
      LCP?: number;
      FID?: number;
      CLS?: number;
      FCP?: number;
      TTFB?: number;
    };
  }>;
  systemHealth: {
    overallStatus: 'good' | 'warning' | 'critical';
    score: number;
    activeAlerts: number;
    resolvedAlerts: number;
  };
  trends: {
    renderTimeChange: number; // 百分比變化
    memoryUsageChange: number; // 百分比變化
    performanceScore: number; // 0-100
  };
}

/**
 * 自動化性能監控系統類
 */
export class AutomatedMonitoringSystem {
  private config: MonitoringConfig;
  private framework: PerformanceBaselineFramework;
  private benchmarks: GRNLabelCardBenchmarks;
  private alerts: Map<string, PerformanceAlert> = new Map();
  private isMonitoring = false;
  private intervals: {
    realTime?: NodeJS.Timeout;
    periodic?: NodeJS.Timeout;
    regression?: NodeJS.Timeout;
  } = {};
  private measurementHistory: PerformanceMeasurement[] = [];
  private reportHistory: MonitoringReport[] = [];

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.framework = new PerformanceBaselineFramework();
    this.benchmarks = new GRNLabelCardBenchmarks();
    
    // 初始化時加載歷史數據
    this.loadHistoryFromStorage();
    
    console.log('[AutomatedMonitoring] System initialized with config:', this.config);
  }

  /**
   * 開始監控
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('[AutomatedMonitoring] Monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    console.log('[AutomatedMonitoring] Starting automated monitoring system...');

    // 設置實時檢查
    this.intervals.realTime = setInterval(() => {
      this.performRealTimeCheck();
    }, this.config.intervals.realTimeCheck);

    // 設置定期報告
    this.intervals.periodic = setInterval(() => {
      this.generatePeriodicReport();
    }, this.config.intervals.periodicReport);

    // 設置回歸檢測
    this.intervals.regression = setInterval(() => {
      this.performRegressionCheck();
    }, this.config.intervals.regressionCheck);

    console.log('[AutomatedMonitoring] All monitoring intervals started');
  }

  /**
   * 停止監控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('[AutomatedMonitoring] Monitoring is not active');
      return;
    }

    this.isMonitoring = false;

    // 清除所有定時器
    Object.values(this.intervals).forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
    this.intervals = {};

    // 保存歷史數據
    this.saveHistoryToStorage();

    console.log('[AutomatedMonitoring] Monitoring stopped and data saved');
  }

  /**
   * 執行實時檢查
   */
  private async performRealTimeCheck(): Promise<void> {
    try {
      console.log('[AutomatedMonitoring] Performing real-time performance check...');

      // 檢查當前頁面的性能指標
      const currentMetrics = await this.collectCurrentMetrics();
      
      if (currentMetrics) {
        this.measurementHistory.push(currentMetrics);
        
        // 檢查是否超過闾值
        await this.checkThresholds(currentMetrics);
        
        // 保持歷史記錄在限制內
        if (this.measurementHistory.length > this.config.storage.maxHistoryEntries) {
          this.measurementHistory = this.measurementHistory.slice(-this.config.storage.maxHistoryEntries);
        }
      }
    } catch (error) {
      console.error('[AutomatedMonitoring] Error during real-time check:', error);
    }
  }

  /**
   * 收集當前性能指標
   */
  private async collectCurrentMetrics(): Promise<PerformanceMeasurement | null> {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    try {
      // 使用 Navigation Timing API 收集基本指標
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (window.performance as any).memory;
      
      const metrics: PerformanceMeasurement = {
        componentName: 'System',
        testName: 'real-time-monitoring',
        metrics: {
          renderTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          memoryUsage: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
          apiResponseTime: navigation ? navigation.responseEnd - navigation.requestStart : 0,
          interactiveTime: navigation ? navigation.domInteractive - navigation.domContentLoadedEventStart : 0,
          bundleSize: 0, // 需要別的方式測量
        },
        webVitals: await this.collectWebVitals(),
        timestamp: Date.now(),
        environment: {
          userAgent: navigator.userAgent,
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          deviceType: this.getDeviceType(),
          networkCondition: this.getNetworkCondition(),
        },
      };

      return metrics;
    } catch (error) {
      console.error('[AutomatedMonitoring] Error collecting metrics:', error);
      return null;
    }
  }

  /**
   * 收集 Web Vitals 指標
   */
  private async collectWebVitals(): Promise<PerformanceMeasurement['webVitals']> {
    if (typeof window === 'undefined' || !window.performance) {
      return {};
    }

    const vitals: PerformanceMeasurement['webVitals'] = {};

    // 使用 PerformanceObserver 收集 Web Vitals
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              vitals.LCP = entry.startTime;
              break;
            case 'first-input':
              vitals.FID = (entry as any).processingStart - entry.startTime;
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                vitals.CLS = (vitals.CLS || 0) + (entry as any).value;
              }
              break;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // 超時機制
        setTimeout(() => {
          observer.disconnect();
          resolve(vitals);
        }, 1000);
      } catch (error) {
        console.warn('[AutomatedMonitoring] Web Vitals collection not supported:', error);
        resolve(vitals);
      }
    });
  }

  /**
   * 檢查闾值並生成警告
   */
  private async checkThresholds(measurement: PerformanceMeasurement): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // 檢查渲染時間
    if (measurement.metrics.renderTime > this.config.thresholds.criticalRenderTime) {
      alerts.push(this.createAlert(
        'critical',
        measurement.componentName,
        'renderTime',
        measurement.metrics.renderTime,
        this.config.thresholds.criticalRenderTime,
        'Render time exceeds critical threshold',
        ['Consider optimizing component rendering', 'Check for memory leaks', 'Review heavy computations']
      ));
    } else if (measurement.metrics.renderTime > this.config.thresholds.warningRenderTime) {
      alerts.push(this.createAlert(
        'warning',
        measurement.componentName,
        'renderTime',
        measurement.metrics.renderTime,
        this.config.thresholds.warningRenderTime,
        'Render time exceeds warning threshold',
        ['Monitor render time trends', 'Consider minor optimizations']
      ));
    }

    // 檢查記憶體使用
    if (measurement.metrics.memoryUsage > this.config.thresholds.criticalMemoryUsage) {
      alerts.push(this.createAlert(
        'critical',
        measurement.componentName,
        'memoryUsage',
        measurement.metrics.memoryUsage,
        this.config.thresholds.criticalMemoryUsage,
        'Memory usage exceeds critical threshold',
        ['Check for memory leaks', 'Review cleanup functions', 'Optimize data structures']
      ));
    } else if (measurement.metrics.memoryUsage > this.config.thresholds.warningMemoryUsage) {
      alerts.push(this.createAlert(
        'warning',
        measurement.componentName,
        'memoryUsage',
        measurement.metrics.memoryUsage,
        this.config.thresholds.warningMemoryUsage,
        'Memory usage exceeds warning threshold',
        ['Monitor memory usage trends', 'Review component lifecycle']
      ));
    }

    // 處理新警告
    for (const alert of alerts) {
      await this.handleAlert(alert);
    }
  }

  /**
   * 創建警告
   */
  private createAlert(
    type: PerformanceAlert['type'],
    componentName: string,
    metric: string,
    currentValue: number,
    thresholdValue: number,
    message: string,
    recommendations: string[]
  ): PerformanceAlert {
    return {
      id: `${componentName}-${metric}-${Date.now()}`,
      type,
      componentName,
      metric,
      currentValue,
      thresholdValue,
      message,
      timestamp: Date.now(),
      resolved: false,
      recommendations,
    };
  }

  /**
   * 處理警告
   */
  private async handleAlert(alert: PerformanceAlert): Promise<void> {
    // 儲存警告
    this.alerts.set(alert.id, alert);

    // 控制台警告
    if (this.config.alerts.enableConsoleAlerts) {
      const logMethod = alert.type === 'critical' ? 'error' : 'warn';
      console[logMethod](`[PerformanceAlert] ${alert.type.toUpperCase()}: ${alert.message}`, {
        component: alert.componentName,
        metric: alert.metric,
        value: alert.currentValue,
        threshold: alert.thresholdValue,
        recommendations: alert.recommendations
      });
    }

    // 储存警告
    if (this.config.alerts.enableStorageAlerts) {
      this.saveAlertToStorage(alert);
    }

    // TODO: 郵件警告（需要配置郵件服務）
    if (this.config.alerts.enableEmailAlerts) {
      console.log('[AutomatedMonitoring] Email alerts not yet implemented');
    }
  }

  /**
   * 執行回歸檢測
   */
  private async performRegressionCheck(): Promise<void> {
    try {
      console.log('[AutomatedMonitoring] Performing regression check...');

      for (const componentName of this.config.components) {
        const recentMeasurements = this.measurementHistory
          .filter(m => m.componentName === componentName)
          .slice(-5); // 取最近5次測量

        if (recentMeasurements.length > 0) {
          const latestMeasurement = recentMeasurements[recentMeasurements.length - 1];
          const regressionResult = this.framework.detectRegression(componentName, latestMeasurement);

          if (regressionResult.hasRegression) {
            console.warn(`[AutomatedMonitoring] Performance regression detected for ${componentName}:`, regressionResult);
            
            // 將回歸轉換為警告
            for (const detail of regressionResult.regressionDetails) {
              const alert = this.createAlert(
                detail.severity,
                componentName,
                detail.metric,
                detail.currentValue,
                detail.baselineValue,
                `Performance regression detected: ${detail.metric} changed by ${detail.percentageChange.toFixed(1)}%`,
                regressionResult.recommendations
              );
              await this.handleAlert(alert);
            }
          }
        }
      }
    } catch (error) {
      console.error('[AutomatedMonitoring] Error during regression check:', error);
    }
  }

  /**
   * 生成定期報告
   */
  private async generatePeriodicReport(): Promise<void> {
    try {
      console.log('[AutomatedMonitoring] Generating periodic performance report...');

      const reportTimeRange = {
        start: Date.now() - this.config.intervals.periodicReport,
        end: Date.now(),
      };

      const componentReports = this.config.components.map(componentName => {
        const measurements = this.measurementHistory
          .filter(m => 
            m.componentName === componentName &&
            m.timestamp >= reportTimeRange.start &&
            m.timestamp <= reportTimeRange.end
          );

        const componentAlerts = Array.from(this.alerts.values())
          .filter(a => a.componentName === componentName && a.timestamp >= reportTimeRange.start);

        // 計算平均指標
        const averageRenderTime = measurements.length > 0
          ? measurements.reduce((sum, m) => sum + m.metrics.renderTime, 0) / measurements.length
          : 0;
        
        const averageMemoryUsage = measurements.length > 0
          ? measurements.reduce((sum, m) => sum + m.metrics.memoryUsage, 0) / measurements.length
          : 0;

        // 決定狀態
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (componentAlerts.some(a => a.type === 'critical')) {
          status = 'critical';
        } else if (componentAlerts.some(a => a.type === 'warning')) {
          status = 'warning';
        }

        // 收集 Web Vitals
        const webVitals = measurements.length > 0 ? measurements[measurements.length - 1].webVitals : {};

        return {
          name: componentName,
          status,
          metrics: {
            averageRenderTime,
            averageMemoryUsage,
            totalMeasurements: measurements.length,
            regressionCount: componentAlerts.filter(a => a.message.includes('regression')).length,
          },
          alerts: componentAlerts,
          webVitals,
        };
      });

      // 計算系統健康度
      const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
      const resolvedAlerts = Array.from(this.alerts.values()).filter(a => a.resolved).length;
      const criticalComponents = componentReports.filter(c => c.status === 'critical').length;
      
      let overallStatus: 'good' | 'warning' | 'critical' = 'good';
      if (criticalComponents > 0) {
        overallStatus = 'critical';
      } else if (componentReports.some(c => c.status === 'warning')) {
        overallStatus = 'warning';
      }

      // 計算趋勢
      const trends = this.calculateTrends();

      const report: MonitoringReport = {
        timestamp: Date.now(),
        timeRange: reportTimeRange,
        components: componentReports,
        systemHealth: {
          overallStatus,
          score: this.calculateHealthScore(componentReports),
          activeAlerts,
          resolvedAlerts,
        },
        trends,
      };

      // 保存報告
      this.reportHistory.push(report);
      
      // 保持報告歷史在限制內
      if (this.reportHistory.length > 50) {
        this.reportHistory = this.reportHistory.slice(-50);
      }

      console.log('[AutomatedMonitoring] Periodic report generated:', {
        overallStatus: report.systemHealth.overallStatus,
        score: report.systemHealth.score,
        activeAlerts: report.systemHealth.activeAlerts,
        componentsCount: report.components.length
      });

      // 保存到储存
      this.saveReportToStorage(report);
    } catch (error) {
      console.error('[AutomatedMonitoring] Error generating periodic report:', error);
    }
  }

  /**
   * 計算性能趋勢
   */
  private calculateTrends(): MonitoringReport['trends'] {
    if (this.reportHistory.length < 2) {
      return {
        renderTimeChange: 0,
        memoryUsageChange: 0,
        performanceScore: 100,
      };
    }

    const currentReport = this.reportHistory[this.reportHistory.length - 1];
    const previousReport = this.reportHistory[this.reportHistory.length - 2];

    // 計算平均指標變化
    const currentAvgRender = currentReport.components.reduce((sum, c) => sum + c.metrics.averageRenderTime, 0) / currentReport.components.length;
    const previousAvgRender = previousReport.components.reduce((sum, c) => sum + c.metrics.averageRenderTime, 0) / previousReport.components.length;
    
    const currentAvgMemory = currentReport.components.reduce((sum, c) => sum + c.metrics.averageMemoryUsage, 0) / currentReport.components.length;
    const previousAvgMemory = previousReport.components.reduce((sum, c) => sum + c.metrics.averageMemoryUsage, 0) / previousReport.components.length;

    const renderTimeChange = previousAvgRender > 0 
      ? ((currentAvgRender - previousAvgRender) / previousAvgRender) * 100
      : 0;
    
    const memoryUsageChange = previousAvgMemory > 0
      ? ((currentAvgMemory - previousAvgMemory) / previousAvgMemory) * 100
      : 0;

    return {
      renderTimeChange,
      memoryUsageChange,
      performanceScore: currentReport.systemHealth.score,
    };
  }

  /**
   * 計算健康度評分
   */
  private calculateHealthScore(components: MonitoringReport['components']): number {
    let score = 100;

    components.forEach(component => {
      if (component.status === 'critical') {
        score -= 30;
      } else if (component.status === 'warning') {
        score -= 15;
      }

      // 根據警告數量扣分
      const criticalAlerts = component.alerts.filter(a => a.type === 'critical').length;
      const warningAlerts = component.alerts.filter(a => a.type === 'warning').length;
      
      score -= criticalAlerts * 10;
      score -= warningAlerts * 5;
    });

    return Math.max(0, Math.round(score));
  }

  /**
   * 獲取裝置類型
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * 獲取網絡狀況
   */
  private getNetworkCondition(): 'fast' | 'slow' | 'offline' {
    if (typeof navigator === 'undefined') return 'fast';
    
    if (!navigator.onLine) return 'offline';
    
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return 'slow';
    }
    
    return 'fast';
  }

  /**
   * 保存歷史數據到本地储存
   */
  private saveHistoryToStorage(): void {
    if (typeof window === 'undefined' || !this.config.storage.enableLocalStorage) {
      return;
    }

    try {
      const data = {
        measurements: this.measurementHistory.slice(-this.config.storage.maxHistoryEntries),
        reports: this.reportHistory.slice(-20),
        alerts: Array.from(this.alerts.values()).slice(-50),
        timestamp: Date.now(),
      };
      
      localStorage.setItem('performance-monitoring-data', JSON.stringify(data));
      console.log('[AutomatedMonitoring] History data saved to localStorage');
    } catch (error) {
      console.error('[AutomatedMonitoring] Failed to save history to localStorage:', error);
    }
  }

  /**
   * 從本地储存加載歷史數據
   */
  private loadHistoryFromStorage(): void {
    if (typeof window === 'undefined' || !this.config.storage.enableLocalStorage) {
      return;
    }

    try {
      const savedData = localStorage.getItem('performance-monitoring-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        if (data.measurements) {
          this.measurementHistory = data.measurements;
        }
        if (data.reports) {
          this.reportHistory = data.reports;
        }
        if (data.alerts) {
          data.alerts.forEach((alert: PerformanceAlert) => {
            this.alerts.set(alert.id, alert);
          });
        }
        
        console.log('[AutomatedMonitoring] History data loaded from localStorage');
      }
    } catch (error) {
      console.error('[AutomatedMonitoring] Failed to load history from localStorage:', error);
    }
  }

  /**
   * 保存警告到储存
   */
  private saveAlertToStorage(alert: PerformanceAlert): void {
    if (typeof window === 'undefined' || !this.config.storage.enableLocalStorage) {
      return;
    }

    try {
      const alertsKey = 'performance-alerts';
      const existingAlerts = JSON.parse(localStorage.getItem(alertsKey) || '[]');
      existingAlerts.push(alert);
      
      // 保持最多100個警告
      if (existingAlerts.length > 100) {
        existingAlerts.splice(0, existingAlerts.length - 100);
      }
      
      localStorage.setItem(alertsKey, JSON.stringify(existingAlerts));
    } catch (error) {
      console.error('[AutomatedMonitoring] Failed to save alert to localStorage:', error);
    }
  }

  /**
   * 保存報告到储存
   */
  private saveReportToStorage(report: MonitoringReport): void {
    if (typeof window === 'undefined' || !this.config.storage.enableLocalStorage) {
      return;
    }

    try {
      const reportsKey = 'performance-reports';
      const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
      existingReports.push(report);
      
      // 保持最多50個報告
      if (existingReports.length > 50) {
        existingReports.splice(0, existingReports.length - 50);
      }
      
      localStorage.setItem(reportsKey, JSON.stringify(existingReports));
    } catch (error) {
      console.error('[AutomatedMonitoring] Failed to save report to localStorage:', error);
    }
  }

  // 公開 API 方法

  /**
   * 獲取當前所有警告
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * 解決警告
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.alerts.set(alertId, alert);
      return true;
    }
    return false;
  }

  /**
   * 獲取最新報告
   */
  getLatestReport(): MonitoringReport | null {
    return this.reportHistory.length > 0 ? this.reportHistory[this.reportHistory.length - 1] : null;
  }

  /**
   * 獲取所有報告歷史
   */
  getReportHistory(limit?: number): MonitoringReport[] {
    if (limit) {
      return this.reportHistory.slice(-limit);
    }
    return [...this.reportHistory];
  }

  /**
   * 獲取測量歷史
   */
  getMeasurementHistory(componentName?: string, limit?: number): PerformanceMeasurement[] {
    let measurements = componentName 
      ? this.measurementHistory.filter(m => m.componentName === componentName)
      : this.measurementHistory;
    
    if (limit) {
      measurements = measurements.slice(-limit);
    }
    
    return measurements;
  }

  /**
   * 清除所有數據
   */
  clearAllData(): void {
    this.measurementHistory = [];
    this.reportHistory = [];
    this.alerts.clear();
    
    if (typeof window !== 'undefined' && this.config.storage.enableLocalStorage) {
      localStorage.removeItem('performance-monitoring-data');
      localStorage.removeItem('performance-alerts');
      localStorage.removeItem('performance-reports');
    }
    
    console.log('[AutomatedMonitoring] All monitoring data cleared');
  }

  /**
   * 獲取監控狀態
   */
  getMonitoringStatus(): {
    isActive: boolean;
    config: MonitoringConfig;
    stats: {
      measurementCount: number;
      reportCount: number;
      activeAlerts: number;
      resolvedAlerts: number;
    };
  } {
    return {
      isActive: this.isMonitoring,
      config: this.config,
      stats: {
        measurementCount: this.measurementHistory.length,
        reportCount: this.reportHistory.length,
        activeAlerts: this.getActiveAlerts().length,
        resolvedAlerts: Array.from(this.alerts.values()).filter(a => a.resolved).length,
      },
    };
  }
}

// 創建單例實例
export const automatedMonitoringSystem = new AutomatedMonitoringSystem();

// 便利函數
export function startPerformanceMonitoring(config?: Partial<MonitoringConfig>): void {
  if (config) {
    // 如果提供新配置，創建新實例
    const customMonitoring = new AutomatedMonitoringSystem(config);
    customMonitoring.startMonitoring();
  } else {
    // 使用預設實例
    automatedMonitoringSystem.startMonitoring();
  }
}

export function stopPerformanceMonitoring(): void {
  automatedMonitoringSystem.stopMonitoring();
}

export function getPerformanceStatus() {
  return automatedMonitoringSystem.getMonitoringStatus();
}
