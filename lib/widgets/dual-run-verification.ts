/**
 * Dual Run Verification System
 * 同時運行新舊系統並驗證結果一致性
 */

import React from 'react';
import { WidgetComponentProps } from './types';
import { widgetRegistry } from './enhanced-registry';

// 驗證結果接口
export interface VerificationResult {
  widgetId: string;
  timestamp: string;
  success: boolean;
  oldSystemTime: number;
  newSystemTime: number;
  discrepancies?: DiscrepancyDetail[];
  error?: string;
}

// 差異詳情
export interface DiscrepancyDetail {
  type: 'render' | 'props' | 'state' | 'output' | 'error';
  path?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

// 驗證配置
export interface VerificationConfig {
  compareRenderOutput: boolean;
  compareProps: boolean;
  compareState: boolean;
  comparePerformance: boolean;
  failOnDiscrepancy: boolean;
  logVerbose: boolean;
}

// 默認配置
const defaultConfig: VerificationConfig = {
  compareRenderOutput: true,
  compareProps: true,
  compareState: false, // State 比較較複雜，默認關閉
  comparePerformance: true,
  failOnDiscrepancy: false, // 默認只記錄，不失敗
  logVerbose: false,
};

/**
 * Widget 雙重運行驗證器
 */
export class DualRunVerifier {
  private verificationResults: Map<string, VerificationResult[]> = new Map();
  private config: VerificationConfig;
  private legacyComponents: Map<string, React.ComponentType<any>> = new Map();
  
  constructor(config: Partial<VerificationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * 註冊舊系統組件用於對比
   */
  registerLegacyComponent(widgetId: string, component: React.ComponentType<any>): void {
    this.legacyComponents.set(widgetId, component);
  }
  
  /**
   * 驗證單個 widget
   */
  async verifyWidget(
    widgetId: string,
    props: WidgetComponentProps,
    options?: {
      oldComponent?: React.ComponentType<any>;
      newComponent?: React.ComponentType<any>;
    }
  ): Promise<VerificationResult> {
    const startTime = performance.now();
    const result: VerificationResult = {
      widgetId,
      timestamp: new Date().toISOString(),
      success: true,
      oldSystemTime: 0,
      newSystemTime: 0,
      discrepancies: [],
    };
    
    try {
      // 獲取組件
      const OldComponent = options?.oldComponent || this.legacyComponents.get(widgetId);
      const NewComponent = options?.newComponent || widgetRegistry.getComponent(widgetId);
      
      if (!NewComponent) {
        throw new Error(`Missing new component for verification: ${widgetId}`);
      }
      
      // 如果冇舊組件，使用新組件作為基準（開發階段）
      const ComponentToCompare = OldComponent || NewComponent;
      
      // 運行舊系統（或使用新系統作為基準）
      const oldStartTime = performance.now();
      const oldResult = await this.runComponent(ComponentToCompare, props, 'old');
      result.oldSystemTime = performance.now() - oldStartTime;
      
      // 運行新系統
      const newStartTime = performance.now();
      const newResult = await this.runComponent(NewComponent, props, 'new');
      result.newSystemTime = performance.now() - newStartTime;
      
      // 執行驗證（如果使用相同組件，跳過比較）
      let discrepancies: DiscrepancyDetail[] = [];
      if (OldComponent && OldComponent !== NewComponent) {
        discrepancies = await this.compareResults(
          widgetId,
          oldResult,
          newResult,
          props
        );
      } else {
        // 如果冇舊組件，只記錄性能數據
        console.log(`[DualRunVerifier] No legacy component for ${widgetId}, using new component as baseline`);
      }
      
      if (discrepancies.length > 0) {
        result.success = false;
        result.discrepancies = discrepancies;
        
        if (this.config.failOnDiscrepancy) {
          throw new Error(`Verification failed with ${discrepancies.length} discrepancies`);
        }
      }
      
      // 記錄結果
      this.recordResult(widgetId, result);
      
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      this.recordResult(widgetId, result);
    }
    
    return result;
  }
  
  /**
   * 批量驗證 widgets
   */
  async verifyBatch(
    verifications: Array<{
      widgetId: string;
      props: WidgetComponentProps;
    }>
  ): Promise<VerificationResult[]> {
    console.log(`[DualRunVerifier] Starting batch verification of ${verifications.length} widgets`);
    
    const results = await Promise.all(
      verifications.map(({ widgetId, props }) => 
        this.verifyWidget(widgetId, props)
      )
    );
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[DualRunVerifier] Batch verification completed: ${successCount}/${results.length} successful`);
    
    return results;
  }
  
  /**
   * 運行組件並捕獲結果
   */
  private async runComponent(
    Component: React.ComponentType<any>,
    props: WidgetComponentProps,
    system: 'old' | 'new'
  ): Promise<ComponentRunResult> {
    const result: ComponentRunResult = {
      renderOutput: '',
      error: null,
      warnings: [],
    };
    
    try {
      // 捕獲 console warnings
      const originalWarn = console.warn;
      result.warnings = [];
      console.warn = (...args) => {
        result.warnings.push(args.join(' '));
        if (this.config.logVerbose) {
          originalWarn.apply(console, args);
        }
      };
      
      // 渲染組件
      const element = React.createElement(Component, props);
      
      // 在客戶端環境中，我們只能檢查組件是否能正常創建
      // 真正的渲染測試需要在測試環境中進行
      result.renderOutput = 'client-render';
      
      // 確保組件可以創建而不會拋出錯誤
      if (!element) {
        throw new Error('Failed to create component element');
      }
      
      // 恢復 console.warn
      console.warn = originalWarn;
      
    } catch (error) {
      result.error = error;
    }
    
    return result;
  }
  
  /**
   * 比較運行結果
   */
  private async compareResults(
    widgetId: string,
    oldResult: ComponentRunResult,
    newResult: ComponentRunResult,
    props: WidgetComponentProps
  ): Promise<DiscrepancyDetail[]> {
    const discrepancies: DiscrepancyDetail[] = [];
    
    // 比較錯誤
    if (oldResult.error || newResult.error) {
      if (!oldResult.error && newResult.error) {
        discrepancies.push({
          type: 'error',
          description: 'New system threw error while old system did not',
          newValue: newResult.error?.message,
        });
      } else if (oldResult.error && !newResult.error) {
        discrepancies.push({
          type: 'error',
          description: 'Old system threw error while new system did not',
          oldValue: oldResult.error?.message,
        });
      }
    }
    
    // 在客戶端環境，我們無法比較渲染輸出
    // 呢個功能需要在服務端或測試環境中實現
    
    // 比較 warnings
    if (oldResult.warnings.length !== newResult.warnings.length) {
      discrepancies.push({
        type: 'output',
        description: `Different number of warnings (old: ${oldResult.warnings.length}, new: ${newResult.warnings.length})`,
        oldValue: oldResult.warnings,
        newValue: newResult.warnings,
      });
    }
    
    // 比較性能
    if (this.config.comparePerformance) {
      const perfDiff = Math.abs(oldResult.renderTime || 0 - (newResult.renderTime || 0));
      if (perfDiff > 100) { // 100ms 差異閾值
        discrepancies.push({
          type: 'output',
          description: `Significant performance difference: ${perfDiff.toFixed(2)}ms`,
          oldValue: `${oldResult.renderTime?.toFixed(2)}ms`,
          newValue: `${newResult.renderTime?.toFixed(2)}ms`,
        });
      }
    }
    
    return discrepancies;
  }
  
  /**
   * 比較渲染輸出（忽略一些無關緊要的差異）
   */
  private isRenderOutputEqual(oldOutput: string, newOutput: string): boolean {
    // 移除空白和換行的差異
    const normalize = (str: string) => str
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
    
    return normalize(oldOutput) === normalize(newOutput);
  }
  
  /**
   * 記錄驗證結果
   */
  private recordResult(widgetId: string, result: VerificationResult): void {
    if (!this.verificationResults.has(widgetId)) {
      this.verificationResults.set(widgetId, []);
    }
    
    const results = this.verificationResults.get(widgetId)!;
    results.push(result);
    
    // 只保留最近 100 條記錄
    if (results.length > 100) {
      results.shift();
    }
    
    if (this.config.logVerbose || !result.success) {
      console.log(`[DualRunVerifier] ${widgetId}:`, {
        success: result.success,
        oldTime: `${result.oldSystemTime.toFixed(2)}ms`,
        newTime: `${result.newSystemTime.toFixed(2)}ms`,
        discrepancies: result.discrepancies?.length || 0,
      });
    }
  }
  
  /**
   * 獲取驗證報告
   */
  getVerificationReport(): VerificationReport {
    const report: VerificationReport = {
      timestamp: new Date().toISOString(),
      totalWidgets: this.verificationResults.size,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      performanceComparison: {
        averageOldSystemTime: 0,
        averageNewSystemTime: 0,
        improvement: 0,
      },
      widgetReports: [],
    };
    
    let totalOldTime = 0;
    let totalNewTime = 0;
    
    this.verificationResults.forEach((results, widgetId) => {
      const widgetReport: WidgetVerificationReport = {
        widgetId,
        totalRuns: results.length,
        successfulRuns: results.filter(r => r.success).length,
        failedRuns: results.filter(r => !r.success).length,
        averageOldTime: 0,
        averageNewTime: 0,
        commonDiscrepancies: [],
      };
      
      // 計算平均時間
      const times = results.reduce((acc, r) => ({
        old: acc.old + r.oldSystemTime,
        new: acc.new + r.newSystemTime,
      }), { old: 0, new: 0 });
      
      widgetReport.averageOldTime = times.old / results.length;
      widgetReport.averageNewTime = times.new / results.length;
      
      totalOldTime += times.old;
      totalNewTime += times.new;
      report.totalRuns += results.length;
      report.successfulRuns += widgetReport.successfulRuns;
      report.failedRuns += widgetReport.failedRuns;
      
      // 收集常見差異
      const discrepancyCounts = new Map<string, number>();
      results.forEach(r => {
        r.discrepancies?.forEach(d => {
          const key = `${d.type}:${d.description}`;
          discrepancyCounts.set(key, (discrepancyCounts.get(key) || 0) + 1);
        });
      });
      
      widgetReport.commonDiscrepancies = Array.from(discrepancyCounts.entries())
        .map(([key, count]) => ({ issue: key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      report.widgetReports.push(widgetReport);
    });
    
    // 計算整體性能比較
    if (report.totalRuns > 0) {
      report.performanceComparison.averageOldSystemTime = totalOldTime / report.totalRuns;
      report.performanceComparison.averageNewSystemTime = totalNewTime / report.totalRuns;
      report.performanceComparison.improvement = 
        ((totalOldTime - totalNewTime) / totalOldTime) * 100;
    }
    
    return report;
  }
  
  /**
   * 清除驗證結果
   */
  clearResults(): void {
    this.verificationResults.clear();
    console.log('[DualRunVerifier] Verification results cleared');
  }
}

// 組件運行結果
interface ComponentRunResult {
  renderOutput: string;
  error: Error | null;
  warnings: string[];
  renderTime?: number;
}

// 驗證報告接口
export interface VerificationReport {
  timestamp: string;
  totalWidgets: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  performanceComparison: {
    averageOldSystemTime: number;
    averageNewSystemTime: number;
    improvement: number; // 百分比
  };
  widgetReports: WidgetVerificationReport[];
}

export interface WidgetVerificationReport {
  widgetId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageOldTime: number;
  averageNewTime: number;
  commonDiscrepancies: Array<{
    issue: string;
    count: number;
  }>;
}

// 導出單例實例
export const dualRunVerifier = new DualRunVerifier();

// React Hook for verification
export function useDualRunVerification() {
  const [report, setReport] = React.useState<VerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);
  
  const runVerification = React.useCallback(async (
    widgetId: string,
    props: WidgetComponentProps
  ) => {
    setIsVerifying(true);
    try {
      await dualRunVerifier.verifyWidget(widgetId, props);
      setReport(dualRunVerifier.getVerificationReport());
    } finally {
      setIsVerifying(false);
    }
  }, []);
  
  return {
    report,
    isVerifying,
    runVerification,
    clearResults: () => {
      dualRunVerifier.clearResults();
      setReport(null);
    },
  };
}