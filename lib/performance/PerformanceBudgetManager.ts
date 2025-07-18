/**
 * 性能預算管理器
 * 管理性能預算配置、驗證和報告
 */

import { WebVitalsCollector, PerformanceBudget, BudgetValidationResult } from './WebVitalsCollector';
import { SimplePerformanceMonitor } from './SimplePerformanceMonitor';

// 預算配置檔案
export interface BudgetProfile {
  id: string;
  name: string;
  description: string;
  budget: PerformanceBudget;
  environment: 'development' | 'staging' | 'production';
  createdAt: number;
  updatedAt: number;
}

// 預算違規警報
export interface BudgetAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

// 趨勢分析結果
export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  percentage: number;
  period: string;
  samples: number;
}

/**
 * 性能預算管理器類
 */
export class PerformanceBudgetManager {
  private webVitalsCollector: WebVitalsCollector;
  private performanceMonitor: SimplePerformanceMonitor;
  private currentProfile: BudgetProfile;
  private profiles: Map<string, BudgetProfile> = new Map();
  private alerts: BudgetAlert[] = [];
  private historicalData: Map<string, number[]> = new Map();

  constructor(
    webVitalsCollector: WebVitalsCollector,
    performanceMonitor: SimplePerformanceMonitor
  ) {
    this.webVitalsCollector = webVitalsCollector;
    this.performanceMonitor = performanceMonitor;
    this.currentProfile = this.createDefaultProfile();
    this.initializeProfiles();
  }

  /**
   * 創建默認預算配置
   */
  private createDefaultProfile(): BudgetProfile {
    return {
      id: 'default',
      name: 'Default Profile',
      description: 'Default performance budget based on Google recommendations',
      budget: {
        LCP: { good: 2500, needsImprovement: 4000, poor: 4000 },
        INP: { good: 200, needsImprovement: 500, poor: 500 },
        CLS: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
        FCP: { good: 1800, needsImprovement: 3000, poor: 3000 },
        TTFB: { good: 800, needsImprovement: 1800, poor: 1800 }
      },
      environment: 'development',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * 初始化預設配置檔案
   */
  private initializeProfiles(): void {
    // 開發環境配置 - 較寬鬆
    const developmentProfile: BudgetProfile = {
      id: 'development',
      name: 'Development',
      description: 'Relaxed budget for development environment',
      budget: {
        LCP: { good: 3000, needsImprovement: 5000, poor: 5000 },
        INP: { good: 300, needsImprovement: 600, poor: 600 },
        CLS: { good: 0.15, needsImprovement: 0.3, poor: 0.3 },
        FCP: { good: 2200, needsImprovement: 3500, poor: 3500 },
        TTFB: { good: 1000, needsImprovement: 2000, poor: 2000 }
      },
      environment: 'development',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 生產環境配置 - 嚴格
    const productionProfile: BudgetProfile = {
      id: 'production',
      name: 'Production',
      description: 'Strict budget for production environment',
      budget: {
        LCP: { good: 2000, needsImprovement: 3000, poor: 3000 },
        INP: { good: 150, needsImprovement: 300, poor: 300 },
        CLS: { good: 0.08, needsImprovement: 0.2, poor: 0.2 },
        FCP: { good: 1500, needsImprovement: 2500, poor: 2500 },
        TTFB: { good: 600, needsImprovement: 1200, poor: 1200 }
      },
      environment: 'production',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.profiles.set('default', this.currentProfile);
    this.profiles.set('development', developmentProfile);
    this.profiles.set('production', productionProfile);

    // 根據環境選擇配置
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      this.setActiveProfile('production');
    } else {
      this.setActiveProfile('development');
    }
  }

  /**
   * 設定活動配置檔案
   */
  setActiveProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error(`[BudgetManager] Profile "${profileId}" not found`);
      return false;
    }

    this.currentProfile = profile;
    this.webVitalsCollector.updateBudget(profile.budget);
    
    console.log(`[BudgetManager] Active profile set to: ${profile.name}`);
    return true;
  }

  /**
   * 獲取當前配置檔案
   */
  getCurrentProfile(): BudgetProfile {
    return { ...this.currentProfile };
  }

  /**
   * 獲取所有配置檔案
   */
  getAllProfiles(): BudgetProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * 創建新配置檔案
   */
  createProfile(profile: Omit<BudgetProfile, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `custom_${Date.now()}`;
    const newProfile: BudgetProfile = {
      ...profile,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.profiles.set(id, newProfile);
    console.log(`[BudgetManager] Created new profile: ${newProfile.name}`);
    
    return id;
  }

  /**
   * 更新配置檔案
   */
  updateProfile(profileId: string, updates: Partial<BudgetProfile>): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error(`[BudgetManager] Profile "${profileId}" not found`);
      return false;
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      id: profile.id, // 保持 ID 不變
      createdAt: profile.createdAt, // 保持創建時間
      updatedAt: Date.now()
    };

    this.profiles.set(profileId, updatedProfile);

    // 如果更新的是當前配置，則應用更新
    if (this.currentProfile.id === profileId) {
      this.currentProfile = updatedProfile;
      this.webVitalsCollector.updateBudget(updatedProfile.budget);
    }

    console.log(`[BudgetManager] Updated profile: ${updatedProfile.name}`);
    return true;
  }

  /**
   * 刪除配置檔案
   */
  deleteProfile(profileId: string): boolean {
    if (profileId === 'default') {
      console.error('[BudgetManager] Cannot delete default profile');
      return false;
    }

    const deleted = this.profiles.delete(profileId);
    if (deleted) {
      console.log(`[BudgetManager] Deleted profile: ${profileId}`);
      
      // 如果刪除的是當前配置，切換到默認配置
      if (this.currentProfile.id === profileId) {
        this.setActiveProfile('default');
      }
    }

    return deleted;
  }

  /**
   * 驗證當前性能指標
   */
  validateCurrentMetrics(): BudgetValidationResult[] {
    return this.webVitalsCollector.getBudgetReport();
  }

  /**
   * 檢查預算違規並生成警報
   */
  checkBudgetViolations(): BudgetAlert[] {
    const validationResults = this.validateCurrentMetrics();
    const newAlerts: BudgetAlert[] = [];

    validationResults.forEach(result => {
      if (!result.passed) {
        const severity = result.percentage > 150 ? 'critical' : 'warning';
        
        const alert: BudgetAlert = {
          id: `alert_${Date.now()}_${result.metric}`,
          metric: result.metric,
          value: result.value,
          threshold: result.budget.good,
          severity,
          timestamp: Date.now(),
          resolved: false
        };

        newAlerts.push(alert);
        this.alerts.push(alert);
      }
    });

    // 限制警報數量
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return newAlerts;
  }

  /**
   * 解決警報
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    return true;
  }

  /**
   * 獲取未解決的警報
   */
  getActiveAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * 獲取所有警報
   */
  getAllAlerts(): BudgetAlert[] {
    return [...this.alerts];
  }

  /**
   * 記錄歷史數據
   */
  recordHistoricalData(metric: string, value: number): void {
    if (!this.historicalData.has(metric)) {
      this.historicalData.set(metric, []);
    }

    const data = this.historicalData.get(metric)!;
    data.push(value);

    // 限制歷史數據數量 (保留最近 100 個數據點)
    if (data.length > 100) {
      data.shift();
    }
  }

  /**
   * 分析趨勢
   */
  analyzeTrends(): TrendAnalysis[] {
    const analyses: TrendAnalysis[] = [];

    this.historicalData.forEach((data, metric) => {
      if (data.length < 5) return; // 需要至少 5 個數據點

      const recent = data.slice(-5);
      const older = data.slice(-10, -5);

      if (older.length === 0) return;

      const recentAvg = recent.reduce((sum: number, val: number) => sum + val, 0) / recent.length;
      const olderAvg = older.reduce((sum: number, val: number) => sum + val, 0) / older.length;

      const percentage = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'degrading';
      if (Math.abs(percentage) < 5) {
        trend = 'stable';
      } else if (percentage < 0) {
        trend = 'improving'; // 值減少通常表示性能改善
      } else {
        trend = 'degrading';
      }

      analyses.push({
        metric,
        trend,
        percentage: Math.abs(percentage),
        period: 'last 10 samples',
        samples: data.length
      });
    });

    return analyses;
  }

  /**
   * 獲取預算使用報告
   */
  getBudgetUsageReport(): {
    profile: BudgetProfile;
    metrics: BudgetValidationResult[];
    overallScore: number;
    violations: number;
    trends: TrendAnalysis[];
    recommendations: string[];
  } {
    const metrics = this.validateCurrentMetrics();
    const trends = this.analyzeTrends();
    const violations = metrics.filter(m => !m.passed).length;
    const overallScore = this.webVitalsCollector.getPerformanceScore();

    // 生成建議
    const recommendations: string[] = [];
    
    if (violations > 0) {
      recommendations.push('Consider optimizing assets and reducing bundle size');
    }
    
    if (overallScore < 70) {
      recommendations.push('Performance needs significant improvement');
    }
    
    trends.forEach(trend => {
      if (trend.trend === 'degrading') {
        recommendations.push(`${trend.metric} is degrading - investigate recent changes`);
      }
    });

    return {
      profile: this.getCurrentProfile(),
      metrics,
      overallScore,
      violations,
      trends,
      recommendations
    };
  }

  /**
   * 重置管理器
   */
  reset(): void {
    this.alerts = [];
    this.historicalData.clear();
    console.log('[BudgetManager] Reset completed');
  }
}

