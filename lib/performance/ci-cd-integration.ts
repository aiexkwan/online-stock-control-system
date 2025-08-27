/**
 * CI/CD Performance Integration
 * 
 * 為CI/CD流程提供性能監控和回歸檢測功能
 * 支援GitHub Actions、GitLab CI等主流CI/CD平台
 */

import {
  PerformanceBaselineFramework,
  PerformanceMeasurement,
  GRN_LABEL_CARD_BASELINE
} from './performance-baseline-framework';
import { GRNLabelCardBenchmarks, runGRNLabelCardBenchmarks } from './grn-label-card-benchmarks';
import { RegressionDetectionSystem, AdvancedRegressionResult } from './regression-detection-system';

// CI/CD環境配置
export interface CICDConfig {
  platform: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'generic';
  thresholds: {
    maxRenderTime: number; // 最大渲染時間(ms)
    maxMemoryUsage: number; // 最大記憶體使用(MB)
    maxRegressionPercent: number; // 最大回歸百分比
    minPerformanceScore: number; // 最小性能評分
  };
  reporting: {
    generateMarkdownReport: boolean;
    generateJUnitXML: boolean;
    generateJSONReport: boolean;
    uploadArtifacts: boolean;
  };
  notifications: {
    onFailure: boolean;
    onRegression: boolean;
    onImprovement: boolean;
  };
}

// 預設CI/CD配置
export const DEFAULT_CICD_CONFIG: CICDConfig = {
  platform: 'github-actions',
  thresholds: {
    maxRenderTime: 300, // 300ms
    maxMemoryUsage: 8.0, // 8MB
    maxRegressionPercent: 15, // 15%
    minPerformanceScore: 70, // 70/100
  },
  reporting: {
    generateMarkdownReport: true,
    generateJUnitXML: true,
    generateJSONReport: true,
    uploadArtifacts: true,
  },
  notifications: {
    onFailure: true,
    onRegression: true,
    onImprovement: false,
  },
};

// CI/CD結果介面
export interface CICDPerformanceResult {
  success: boolean;
  timestamp: number;
  commitHash?: string;
  branch?: string;
  buildNumber?: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallScore: number;
    hasRegressions: boolean;
    regressionCount: number;
  };
  componentResults: Array<{
    name: string;
    passed: boolean;
    metrics: {
      renderTime: number;
      memoryUsage: number;
      apiResponseTime: number;
      interactiveTime: number;
    };
    baseline: {
      renderTime: number;
      memoryUsage: number;
      apiResponseTime: number;
      interactiveTime: number;
    };
    regressionAnalysis?: AdvancedRegressionResult;
    issues: string[];
  }>;
  recommendations: string[];
  artifacts: {
    reportPaths: string[];
    screenshotPaths: string[];
    dataPaths: string[];
  };
}

/**
 * CI/CD性能測試整合器
 */
export class CICDPerformanceIntegration {
  private config: CICDConfig;
  private framework: PerformanceBaselineFramework;
  private benchmarks: GRNLabelCardBenchmarks;
  private regressionSystem: RegressionDetectionSystem;
  private outputDir: string;

  constructor(config: Partial<CICDConfig> = {}, outputDir = './performance-results') {
    this.config = { ...DEFAULT_CICD_CONFIG, ...config };
    this.framework = new PerformanceBaselineFramework();
    this.benchmarks = new GRNLabelCardBenchmarks();
    this.regressionSystem = new RegressionDetectionSystem();
    this.outputDir = outputDir;
    
    console.log('[CICDPerformance] Initialized with config:', this.config);
  }

  /**
   * 執行完整的CI/CD性能測試
   */
  async runCICDPerformanceTests(): Promise<CICDPerformanceResult> {
    console.log('[CICDPerformance] Starting CI/CD performance test suite...');
    
    const startTime = Date.now();
    const environmentInfo = this.getEnvironmentInfo();
    
    try {
      // 1. 執行基準測試
      const benchmarkResults = await this.runBenchmarks();
      
      // 2. 執行回歸檢測
      const regressionResults = await this.runRegressionTests(benchmarkResults.results);
      
      // 3. 驗證闾值
      const thresholdResults = this.validateThresholds(benchmarkResults.results);
      
      // 4. 生成結果
      const result = await this.generateCICDResult(
        benchmarkResults,
        regressionResults,
        thresholdResults,
        environmentInfo
      );
      
      // 5. 生成報告
      if (this.config.reporting.generateMarkdownReport) {
        await this.generateMarkdownReport(result);
      }
      if (this.config.reporting.generateJUnitXML) {
        await this.generateJUnitXMLReport(result);
      }
      if (this.config.reporting.generateJSONReport) {
        await this.generateJSONReport(result);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[CICDPerformance] Test suite completed in ${duration}ms`);
      console.log(`[CICDPerformance] Result: ${result.success ? 'PASS' : 'FAIL'}`);
      console.log(`[CICDPerformance] Score: ${result.summary.overallScore}/100`);
      
      return result;
    } catch (error) {
      console.error('[CICDPerformance] Test suite failed:', error);
      
      // 生成失敗結果
      const failureResult: CICDPerformanceResult = {
        success: false,
        timestamp: Date.now(),
        ...environmentInfo,
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 1,
          overallScore: 0,
          hasRegressions: false,
          regressionCount: 0,
        },
        componentResults: [],
        recommendations: [
          'Fix test execution issues before proceeding',
          error instanceof Error ? error.message : 'Unknown error occurred'
        ],
        artifacts: {
          reportPaths: [],
          screenshotPaths: [],
          dataPaths: [],
        },
      };
      
      await this.generateJSONReport(failureResult);
      return failureResult;
    }
  }

  /**
   * 執行基準測試
   */
  private async runBenchmarks(): Promise<{
    results: any[];
    report: any;
  }> {
    console.log('[CICDPerformance] Running performance benchmarks...');
    return await runGRNLabelCardBenchmarks();
  }

  /**
   * 執行回歸檢測
   */
  private async runRegressionTests(benchmarkResults: any[]): Promise<{
    [componentName: string]: AdvancedRegressionResult;
  }> {
    console.log('[CICDPerformance] Running regression detection...');
    
    const regressionResults: { [componentName: string]: AdvancedRegressionResult } = {};
    
    // 對每個組件結果執行回歸檢測
    for (const result of benchmarkResults) {
      if (result.measurement) {
        try {
          // 設置基準線
          this.regressionSystem.setBaseline(result.scenario, GRN_LABEL_CARD_BASELINE);
          
          // 添加測量數據
          this.regressionSystem.addMeasurement(result.scenario, result.measurement);
          
          // 執行進階回歸檢測
          const regressionResult = await this.regressionSystem.detectAdvancedRegression(result.scenario);
          regressionResults[result.scenario] = regressionResult;
        } catch (error) {
          console.warn(`[CICDPerformance] Regression detection failed for ${result.scenario}:`, error);
        }
      }
    }
    
    return regressionResults;
  }

  /**
   * 驗證性能闾值
   */
  private validateThresholds(benchmarkResults: any[]): {
    [scenario: string]: {
      passed: boolean;
      issues: string[];
    };
  } {
    console.log('[CICDPerformance] Validating performance thresholds...');
    
    const thresholdResults: {
      [scenario: string]: {
        passed: boolean;
        issues: string[];
      };
    } = {};
    
    for (const result of benchmarkResults) {
      const issues: string[] = [];
      let passed = true;
      
      if (result.measurement) {
        const { metrics } = result.measurement;
        
        // 檢查渲染時間
        if (metrics.renderTime > this.config.thresholds.maxRenderTime) {
          issues.push(`Render time ${metrics.renderTime}ms exceeds threshold ${this.config.thresholds.maxRenderTime}ms`);
          passed = false;
        }
        
        // 檢查記憶體使用
        if (metrics.memoryUsage > this.config.thresholds.maxMemoryUsage) {
          issues.push(`Memory usage ${metrics.memoryUsage}MB exceeds threshold ${this.config.thresholds.maxMemoryUsage}MB`);
          passed = false;
        }
      } else {
        issues.push('No measurement data available');
        passed = false;
      }
      
      thresholdResults[result.scenario] = { passed, issues };
    }
    
    return thresholdResults;
  }

  /**
   * 生成CI/CD結果
   */
  private async generateCICDResult(
    benchmarkResults: any,
    regressionResults: { [componentName: string]: AdvancedRegressionResult },
    thresholdResults: any,
    environmentInfo: any
  ): Promise<CICDPerformanceResult> {
    const componentResults = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let regressionCount = 0;
    const allRecommendations: string[] = [];
    
    // 處理每個組件的結果
    for (const result of benchmarkResults.results) {
      totalTests++;
      
      const thresholdResult = thresholdResults[result.scenario];
      const regressionResult = regressionResults[result.scenario];
      
      const passed = result.passed && (thresholdResult?.passed ?? true);
      const hasRegression = regressionResult?.overallHealth.riskLevel === 'high' ||
                           regressionResult?.overallHealth.riskLevel === 'critical';
      
      if (passed && !hasRegression) {
        passedTests++;
      } else {
        failedTests++;
      }
      
      if (hasRegression) {
        regressionCount++;
      }
      
      // 收集建議
      if (regressionResult) {
        allRecommendations.push(...regressionResult.recommendations.immediate);
        allRecommendations.push(...regressionResult.recommendations.shortTerm);
      }
      
      const componentResult = {
        name: result.scenario,
        passed: passed && !hasRegression,
        metrics: result.measurement?.metrics || {
          renderTime: 0,
          memoryUsage: 0,
          apiResponseTime: 0,
          interactiveTime: 0,
        },
        baseline: {
          renderTime: GRN_LABEL_CARD_BASELINE.metrics.renderTime.baseline,
          memoryUsage: GRN_LABEL_CARD_BASELINE.metrics.memoryUsage.baseline,
          apiResponseTime: GRN_LABEL_CARD_BASELINE.metrics.apiResponseTime.baseline,
          interactiveTime: GRN_LABEL_CARD_BASELINE.metrics.interactiveTime.baseline,
        },
        regressionAnalysis: regressionResult,
        issues: [...(result.issues || []), ...(thresholdResult?.issues || [])],
      };
      
      componentResults.push(componentResult);
    }
    
    // 計算整體評分
    const overallScore = Math.round((passedTests / Math.max(totalTests, 1)) * 100);
    const success = overallScore >= this.config.thresholds.minPerformanceScore && regressionCount === 0;
    
    // 去重建議
    const uniqueRecommendations = Array.from(new Set(allRecommendations)).slice(0, 10);
    
    return {
      success,
      timestamp: Date.now(),
      ...environmentInfo,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallScore,
        hasRegressions: regressionCount > 0,
        regressionCount,
      },
      componentResults,
      recommendations: uniqueRecommendations,
      artifacts: {
        reportPaths: [],
        screenshotPaths: [],
        dataPaths: [],
      },
    };
  }

  /**
   * 獲取環境信息
   */
  private getEnvironmentInfo(): {
    commitHash?: string;
    branch?: string;
    buildNumber?: string;
  } {
    const env = process.env;
    
    // GitHub Actions
    if (env.GITHUB_ACTIONS) {
      return {
        commitHash: env.GITHUB_SHA,
        branch: env.GITHUB_REF_NAME,
        buildNumber: env.GITHUB_RUN_NUMBER,
      };
    }
    
    // GitLab CI
    if (env.GITLAB_CI) {
      return {
        commitHash: env.CI_COMMIT_SHA,
        branch: env.CI_COMMIT_REF_NAME,
        buildNumber: env.CI_PIPELINE_ID,
      };
    }
    
    // Jenkins
    if (env.JENKINS_URL) {
      return {
        commitHash: env.GIT_COMMIT,
        branch: env.GIT_BRANCH,
        buildNumber: env.BUILD_NUMBER,
      };
    }
    
    // Generic/Local
    return {
      commitHash: 'local',
      branch: 'local',
      buildNumber: Date.now().toString(),
    };
  }

  /**
   * 生成Markdown報告
   */
  private async generateMarkdownReport(result: CICDPerformanceResult): Promise<void> {
    const reportPath = `${this.outputDir}/performance-report.md`;
    
    try {
      // 確保輸出目錄存在
      await this.ensureDirectoryExists(this.outputDir);
      
      const markdown = this.generateMarkdownContent(result);
      
      // 在Node.js環境中寫入檔案
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        await fs.promises.writeFile(reportPath, markdown, 'utf8');
        console.log(`[CICDPerformance] Markdown report generated: ${reportPath}`);
      }
      
      result.artifacts.reportPaths.push(reportPath);
    } catch (error) {
      console.error('[CICDPerformance] Failed to generate Markdown report:', error);
    }
  }

  /**
   * 生成Markdown內容
   */
  private generateMarkdownContent(result: CICDPerformanceResult): string {
    const statusEmoji = result.success ? '✅' : '❌';
    const timestamp = new Date(result.timestamp).toISOString();
    
    let markdown = `# Performance Test Report ${statusEmoji}\n\n`;
    markdown += `**Test Status:** ${result.success ? 'PASSED' : 'FAILED'}\n`;
    markdown += `**Overall Score:** ${result.summary.overallScore}/100\n`;
    markdown += `**Timestamp:** ${timestamp}\n`;
    
    if (result.commitHash) {
      markdown += `**Commit:** ${result.commitHash}\n`;
    }
    if (result.branch) {
      markdown += `**Branch:** ${result.branch}\n`;
    }
    if (result.buildNumber) {
      markdown += `**Build:** ${result.buildNumber}\n`;
    }
    
    markdown += `\n## Summary\n\n`;
    markdown += `- **Total Tests:** ${result.summary.totalTests}\n`;
    markdown += `- **Passed:** ${result.summary.passedTests}\n`;
    markdown += `- **Failed:** ${result.summary.failedTests}\n`;
    markdown += `- **Regressions:** ${result.summary.regressionCount}\n`;
    
    if (result.componentResults.length > 0) {
      markdown += `\n## Component Results\n\n`;
      markdown += `| Component | Status | Render Time | Memory Usage | Issues |\n`;
      markdown += `|-----------|--------|-------------|--------------|--------|\n`;
      
      for (const comp of result.componentResults) {
        const status = comp.passed ? '✅' : '❌';
        const renderTime = `${comp.metrics.renderTime.toFixed(1)}ms`;
        const memoryUsage = `${comp.metrics.memoryUsage.toFixed(1)}MB`;
        const issues = comp.issues.length > 0 ? comp.issues.join(', ') : 'None';
        
        markdown += `| ${comp.name} | ${status} | ${renderTime} | ${memoryUsage} | ${issues} |\n`;
      }
    }
    
    if (result.recommendations.length > 0) {
      markdown += `\n## Recommendations\n\n`;
      for (const rec of result.recommendations) {
        markdown += `- ${rec}\n`;
      }
    }
    
    // 添加回歸分析細節
    const regressionComponents = result.componentResults.filter(comp => 
      comp.regressionAnalysis && comp.regressionAnalysis.overallHealth.riskLevel !== 'low'
    );
    
    if (regressionComponents.length > 0) {
      markdown += `\n## Regression Analysis\n\n`;
      
      for (const comp of regressionComponents) {
        const analysis = comp.regressionAnalysis!;
        markdown += `### ${comp.name}\n\n`;
        markdown += `- **Risk Level:** ${analysis.overallHealth.riskLevel.toUpperCase()}\n`;
        markdown += `- **Health Score:** ${analysis.overallHealth.score}/100\n`;
        markdown += `- **Trend:** ${analysis.overallHealth.trend}\n`;
        
        if (analysis.recommendations.immediate.length > 0) {
          markdown += `\n**Immediate Actions:**\n`;
          for (const rec of analysis.recommendations.immediate) {
            markdown += `- ${rec}\n`;
          }
        }
      }
    }
    
    return markdown;
  }

  /**
   * 生成JUnit XML報告
   */
  private async generateJUnitXMLReport(result: CICDPerformanceResult): Promise<void> {
    const reportPath = `${this.outputDir}/performance-junit.xml`;
    
    try {
      await this.ensureDirectoryExists(this.outputDir);
      
      const xml = this.generateJUnitXMLContent(result);
      
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        await fs.promises.writeFile(reportPath, xml, 'utf8');
        console.log(`[CICDPerformance] JUnit XML report generated: ${reportPath}`);
      }
      
      result.artifacts.reportPaths.push(reportPath);
    } catch (error) {
      console.error('[CICDPerformance] Failed to generate JUnit XML report:', error);
    }
  }

  /**
   * 生成JUnit XML內容
   */
  private generateJUnitXMLContent(result: CICDPerformanceResult): string {
    const timestamp = new Date(result.timestamp).toISOString();
    const duration = '0'; // 簡化處理
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<testsuite `;
    xml += `name="Performance Tests" `;
    xml += `tests="${result.summary.totalTests}" `;
    xml += `failures="${result.summary.failedTests}" `;
    xml += `errors="0" `;
    xml += `time="${duration}" `;
    xml += `timestamp="${timestamp}">\n`;
    
    for (const comp of result.componentResults) {
      xml += `  <testcase `;
      xml += `name="${comp.name}" `;
      xml += `classname="PerformanceTests.${comp.name}" `;
      xml += `time="${comp.metrics.renderTime / 1000}">\n`;
      
      if (!comp.passed) {
        xml += `    <failure message="Performance test failed">`;
        xml += comp.issues.join('. ');
        xml += `</failure>\n`;
      }
      
      xml += `  </testcase>\n`;
    }
    
    xml += `</testsuite>\n`;
    
    return xml;
  }

  /**
   * 生成JSON報告
   */
  private async generateJSONReport(result: CICDPerformanceResult): Promise<void> {
    const reportPath = `${this.outputDir}/performance-report.json`;
    
    try {
      await this.ensureDirectoryExists(this.outputDir);
      
      const jsonContent = JSON.stringify(result, null, 2);
      
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        await fs.promises.writeFile(reportPath, jsonContent, 'utf8');
        console.log(`[CICDPerformance] JSON report generated: ${reportPath}`);
      }
      
      result.artifacts.reportPaths.push(reportPath);
    } catch (error) {
      console.error('[CICDPerformance] Failed to generate JSON report:', error);
    }
  }

  /**
   * 確保目錄存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      const path = require('path');
      
      try {
        await fs.promises.access(dirPath);
      } catch {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
    }
  }

  /**
   * 設置配置
   */
  setConfig(config: Partial<CICDConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[CICDPerformance] Configuration updated:', this.config);
  }

  /**
   * 獲取配置
   */
  getConfig(): CICDConfig {
    return { ...this.config };
  }
}

// 創建單例實例
export const cicdPerformanceIntegration = new CICDPerformanceIntegration();

// CLI入口點
/**
 * CLI入口點，用於CI/CD環境中執行性能測試
 */
export async function runCICDPerformanceCheck(
  config?: Partial<CICDConfig>,
  outputDir?: string
): Promise<void> {
  const integration = new CICDPerformanceIntegration(config, outputDir);
  
  try {
    const result = await integration.runCICDPerformanceTests();
    
    // 輸出結果到控制台
    console.log('\n=== PERFORMANCE TEST RESULTS ===');
    console.log(`Status: ${result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Score: ${result.summary.overallScore}/100`);
    console.log(`Tests: ${result.summary.passedTests}/${result.summary.totalTests} passed`);
    
    if (result.summary.regressionCount > 0) {
      console.log(`⚠️  ${result.summary.regressionCount} performance regressions detected`);
    }
    
    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.forEach(rec => console.log(`- ${rec}`));
    }
    
    // 設置退出代碼
    if (typeof process !== 'undefined') {
      process.exit(result.success ? 0 : 1);
    }
  } catch (error) {
    console.error('Performance test execution failed:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
    throw error;
  }
}

// GitHub Actions專用函數
export function generateGitHubActionsOutput(result: CICDPerformanceResult): void {
  if (typeof process === 'undefined') return;
  
  // 設置GitHub Actions輸出
  console.log(`::set-output name=success::${result.success}`);
  console.log(`::set-output name=score::${result.summary.overallScore}`);
  console.log(`::set-output name=regressions::${result.summary.regressionCount}`);
  
  // 設置概要變数
  process.env.GITHUB_STEP_SUMMARY = result.artifacts.reportPaths
    .find(path => path.endsWith('.md')) || '';
  
  // 設置失敗註釋
  if (!result.success) {
    const issues = result.componentResults
      .flatMap(comp => comp.issues)
      .slice(0, 3)
      .join('; ');
    
    console.log(`::error::Performance tests failed - ${issues}`);
  }
}
