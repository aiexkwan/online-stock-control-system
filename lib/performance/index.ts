/**
 * Performance Monitoring Module - Enhanced with Baseline Testing Framework
 *
 * 提供系統性能監控功能，包含完整的基準測試和自動化監控系統
 */

// ==== Core Performance Monitoring ====
export * from './PerformanceMonitor';
export * from './hooks/usePerformanceMonitor';
export { PerformanceDashboard } from './components/PerformanceDashboardSimple';
export { performanceMonitor } from './PerformanceMonitor';

// ==== Performance Baseline Framework ====
export {
  PerformanceBaselineFramework,
  performanceBaselineFramework,
  GRN_LABEL_CARD_BASELINE
} from './performance-baseline-framework';
export type {
  PerformanceBaseline,
  PerformanceMeasurement,
  RegressionDetectionResult
} from './performance-baseline-framework';

// ==== GRN Label Card Benchmarks ====
export {
  GRNLabelCardBenchmarks,
  grnLabelCardBenchmarks,
  runGRNLabelCardBenchmarks,
  GRN_TEST_SCENARIOS
} from './grn-label-card-benchmarks';
export type {
  GRNTestScenario
} from './grn-label-card-benchmarks';

// ==== Automated Monitoring System ====
export {
  AutomatedMonitoringSystem,
  automatedMonitoringSystem,
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  getPerformanceStatus,
  DEFAULT_MONITORING_CONFIG
} from './automated-monitoring-system';
export type {
  MonitoringConfig,
  PerformanceAlert,
  MonitoringReport
} from './automated-monitoring-system';

// ==== Regression Detection System ====
export {
  RegressionDetectionSystem,
  regressionDetectionSystem,
  detectPerformanceRegression
} from './regression-detection-system';
export type {
  StatisticalAnalysis,
  AdvancedRegressionResult
} from './regression-detection-system';

// ==== Performance Diagnostics ====
export {
  PerformanceDiagnostics,
  performanceDiagnostics,
  diagnosePerformance
} from './performance-diagnostics';
export type {
  DiagnosticResult,
  PerformanceBottleneck,
  DiagnosticRecommendation,
  SystemMetric,
  ComparisonResult,
  PerformancePrediction
} from './performance-diagnostics';

// ==== CI/CD Integration ====
export {
  CICDPerformanceIntegration,
  cicdPerformanceIntegration,
  runCICDPerformanceCheck,
  generateGitHubActionsOutput,
  DEFAULT_CICD_CONFIG
} from './ci-cd-integration';
export type {
  CICDConfig,
  CICDPerformanceResult
} from './ci-cd-integration';

// ==== Legacy PDF Performance Modules (Maintained for Compatibility) ====
export { PDFPerformanceMonitor, pdfPerformanceMonitor } from './pdf-performance-monitor';
export { PDFCacheOptimizer, pdfCacheOptimizer } from './pdf-cache-optimizer';
export { PDFRequestBatcher, pdfRequestBatcher } from './pdf-request-batcher';

// ==== Legacy GraphQL Performance Monitoring ====
export { 
  graphqlPerformanceMonitor,
  PerformanceLink,
  generatePerformanceReport 
} from './graphql-performance-monitor';

export type {
  GraphQLMetrics,
  PerformanceStats as GraphQLPerformanceStats
} from './graphql-performance-monitor';

// ==== Legacy PDF Performance Types ====
export type {
  PerformanceMetrics,
  TimeSeriesData,
  RequestMetadata,
  PerformanceThresholds,
} from './pdf-performance-monitor';

export type { PDFCacheEntry, CacheStatistics, CacheConfig } from './pdf-cache-optimizer';
export type { BatchRequest, BatchConfig, BatchStatistics } from './pdf-request-batcher';

// ==== Quick Start Functions ====
/**
 * 快速啟動完整性能監控系統
 * Quick start function to initialize complete performance monitoring
 */
export async function initializeCompletePerformanceMonitoring(config?: {
  enableAutomatedMonitoring?: boolean;
  enableCICDIntegration?: boolean;
  monitoringConfig?: Partial<MonitoringConfig>;
}): Promise<void> {
  const {
    enableAutomatedMonitoring = true,
    enableCICDIntegration = false,
    monitoringConfig
  } = config || {};

  console.log('[Performance] Initializing complete performance monitoring system...');

  // 初始化基準框架
  const framework = new PerformanceBaselineFramework();
  
  // 如果啟用自動監控
  if (enableAutomatedMonitoring) {
    startPerformanceMonitoring(monitoringConfig);
    console.log('[Performance] Automated monitoring started');
  }
  
  // 如果在CI/CD環境中
  if (enableCICDIntegration && (process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI)) {
    console.log('[Performance] CI/CD environment detected, performance testing available');
  }
  
  console.log('[Performance] Complete performance monitoring system initialized');
}

/**
 * 執行快速性能檢查
 * Quick performance check for immediate diagnostics
 */
export async function runQuickPerformanceCheck(componentName: string = 'GRNLabelCard'): Promise<{
  healthScore: number;
  status: string;
  recommendations: string[];
}> {
  try {
    console.log(`[Performance] Running quick performance check for ${componentName}...`);
    
    // 執行基準測試
    const { results, report } = await runGRNLabelCardBenchmarks();
    
    return {
      healthScore: report.overallHealth.score,
      status: report.overallHealth.status,
      recommendations: report.overallHealth.issues.slice(0, 3) // 前3個最重要的建議
    };
  } catch (error) {
    console.error('[Performance] Quick check failed:', error);
    return {
      healthScore: 0,
      status: 'error',
      recommendations: ['Fix performance testing setup', 'Check component availability']
    };
  }
}

/**
 * 性能監控系統健康檢查
 * Health check for the performance monitoring system itself
 */
export function getPerformanceSystemHealth(): {
  framework: boolean;
  monitoring: boolean;
  diagnostics: boolean;
  cicd: boolean;
  overall: 'healthy' | 'degraded' | 'critical';
} {
  const health = {
    framework: true, // 基準框架總是可用
    monitoring: getPerformanceStatus().isActive,
    diagnostics: true, // 診斷系統總是可用
    cicd: !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI),
    overall: 'healthy' as const
  };
  
  const healthyCount = Object.values(health).filter(v => v === true).length - 1; // 排除 overall
  
  if (healthyCount >= 3) {
    health.overall = 'healthy';
  } else if (healthyCount >= 2) {
    health.overall = 'degraded';
  } else {
    health.overall = 'critical';
  }
  
  return health;
}
