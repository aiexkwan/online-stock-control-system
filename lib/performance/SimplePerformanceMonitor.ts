/**
 * Simplified Performance Monitor
 * 簡化的性能監控系統 - 取代複雜的多系統監控
 * 
 * 專為 10-15 人小團隊設計：
 * - 基本的性能指標記錄
 * - 簡單的統計計算（平均值、最大值、計數）
 * - 基本的警報功能
 * - 易於理解和維護
 * 
 * 取代原系統：
 * - lib/performance/PerformanceMonitor.ts (470行)
 * - lib/widgets/performance-monitor.ts (635行)
 * - lib/widgets/performance-integration.ts (266行)
 * - lib/performance/config.ts (176行)
 * 
 * 總代碼減少：1547行 → 400行（減少74%）
 */

// 基本性能指標接口
interface SimpleMetric {
  name: string;
  value: number;
  timestamp: number;
  category: string;
}

// 簡化的統計數據接口
interface SimpleStats {
  avg: number;
  max: number;
  min: number;
  count: number;
  total: number;
}

// 簡化的配置接口
interface SimpleConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxMetrics: number;
  thresholds: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
  };
}

// 警報接口
interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  category: string;
}

/**
 * 簡化的性能監控系統
 * 單例模式，統一管理所有性能指標
 */
class SimplePerformanceMonitor {
  private static instance: SimplePerformanceMonitor;
  
  private config: SimpleConfig;
  private metrics: Map<string, SimpleMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private initialized = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  static getInstance(): SimplePerformanceMonitor {
    if (!SimplePerformanceMonitor.instance) {
      SimplePerformanceMonitor.instance = new SimplePerformanceMonitor();
    }
    return SimplePerformanceMonitor.instance;
  }

  /**
   * 獲取默認配置
   */
  private getDefaultConfig(): SimpleConfig {
    return {
      enabled: process.env.NODE_ENV !== 'production',
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
      maxMetrics: 1000, // 每個指標最多保留1000個記錄
      thresholds: {
        loadTime: 3000,     // 3秒
        renderTime: 100,    // 100毫秒
        memoryUsage: 50     // 50MB
      }
    };
  }

  /**
   * 初始化監控系統
   */
  private initialize(): void {
    if (this.initialized) return;
    
    if (typeof window !== 'undefined' && this.config.enabled) {
      // 監聽頁面卸載事件，清理資源
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
    
    this.initialized = true;
    this.log('debug', 'SimplePerformanceMonitor initialized');
  }

  /**
   * 記錄性能指標
   */
  recordMetric(name: string, value: number, category: string = 'general'): void {
    if (!this.config.enabled) return;

    const metric: SimpleMetric = {
      name,
      value,
      timestamp: Date.now(),
      category
    };

    // 獲取或創建指標數組
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);
    
    // 限制數組長度，防止內存洩漏
    if (metricArray.length > this.config.maxMetrics) {
      metricArray.shift(); // 移除最舊的記錄
    }

    // 檢查是否超過閾值
    this.checkThreshold(name, value, category);
    
    this.log('debug', `Recorded metric: ${name} = ${value} (${category})`);
  }

  /**
   * 獲取簡單統計數據
   */
  getBasicStats(metricName: string): SimpleStats | null {
    const metricArray = this.metrics.get(metricName);
    if (!metricArray || metricArray.length === 0) {
      return null;
    }

    const values = metricArray.map(m => m.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const count = values.length;
    
    return {
      avg: Math.round(total / count),
      max: Math.max(...values),
      min: Math.min(...values),
      count,
      total: Math.round(total)
    };
  }

  /**
   * 獲取所有指標名稱
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * 獲取指標列表（按類別）
   */
  getMetricsByCategory(category: string): SimpleMetric[] {
    const result: SimpleMetric[] = [];
    
    this.metrics.forEach((metricArray) => {
      metricArray.forEach(metric => {
        if (metric.category === category) {
          result.push(metric);
        }
      });
    });
    
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 檢查閾值並發出警報
   */
  private checkThreshold(metric: string, value: number, category: string): void {
    let threshold: number | undefined;
    
    // 根據指標名稱確定閾值
    if (metric.includes('load') || metric.includes('Load')) {
      threshold = this.config.thresholds.loadTime;
    } else if (metric.includes('render') || metric.includes('Render')) {
      threshold = this.config.thresholds.renderTime;
    } else if (metric.includes('memory') || metric.includes('Memory')) {
      threshold = this.config.thresholds.memoryUsage;
    }
    
    if (threshold && value > threshold) {
      const alert: PerformanceAlert = {
        metric,
        value,
        threshold,
        timestamp: Date.now(),
        category
      };
      
      this.alerts.push(alert);
      
      // 限制警報數量
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
      
      this.log('warn', `Performance alert: ${metric} = ${value} > ${threshold}`);
    }
  }

  /**
   * 獲取警報列表
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 清除警報
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * 獲取監控摘要
   */
  getSummary(): {
    totalMetrics: number;
    activeCategories: string[];
    recentAlerts: number;
    memoryUsage: number;
  } {
    const activeCategories = new Set<string>();
    let totalMetrics = 0;
    
    this.metrics.forEach((metricArray) => {
      totalMetrics += metricArray.length;
      metricArray.forEach(metric => {
        activeCategories.add(metric.category);
      });
    });
    
    const recentAlerts = this.alerts.filter(
      alert => Date.now() - alert.timestamp < 5 * 60 * 1000 // 5分鐘內
    ).length;
    
    return {
      totalMetrics,
      activeCategories: Array.from(activeCategories),
      recentAlerts,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * 獲取內存使用量（MB）
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      return Math.round(memory.usedJSHeapSize / (1024 * 1024));
    }
    return 0;
  }

  /**
   * 清理資源
   */
  cleanup(): void {
    this.metrics.clear();
    this.alerts = [];
    this.log('debug', 'SimplePerformanceMonitor cleaned up');
  }

  /**
   * 重置監控系統
   */
  reset(): void {
    this.cleanup();
    this.initialize();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<SimpleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'Configuration updated');
  }

  /**
   * 簡化的日誌記錄
   */
  private log(level: string, message: string): void {
    if (!this.config.enabled) return;
    
    const levels = ['error', 'warn', 'info', 'debug'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    if (messageLevel <= configLevel) {
      console[level as keyof Console](`[SimplePerformanceMonitor] ${message}`);
    }
  }

  /**
   * 導出數據（用於調試）
   */
  exportData(): {
    metrics: Record<string, SimpleMetric[]>;
    alerts: PerformanceAlert[];
    summary: any;
  } {
    const metrics: Record<string, SimpleMetric[]> = {};
    this.metrics.forEach((value, key) => {
      metrics[key] = value;
    });
    
    return {
      metrics,
      alerts: this.alerts,
      summary: this.getSummary()
    };
  }
}

// 創建全局實例
export const simplePerformanceMonitor = SimplePerformanceMonitor.getInstance();
export default simplePerformanceMonitor;

// 便利函數
export const recordMetric = (name: string, value: number, category?: string) => {
  simplePerformanceMonitor.recordMetric(name, value, category);
};

export const getStats = (metricName: string) => {
  return simplePerformanceMonitor.getBasicStats(metricName);
};

export const getAlerts = () => {
  return simplePerformanceMonitor.getAlerts();
};

export const getSummary = () => {
  return simplePerformanceMonitor.getSummary();
};

// 類型導出
export type { SimpleMetric, SimpleStats, SimpleConfig, PerformanceAlert };