/**
 * Testing Features Hook
 *
 * 整合 Feature Flags 與測試基礎設施
 */

import { useCallback, useEffect, useState } from 'react';
import { useFeatureFlag, useFeatureFlags } from './useFeatureFlag';
import { shouldRunTests, getCurrentCoverageTarget } from '../configs/phase4-rollout';
import { KnownFeatureFlags } from '../types';
import { isTest } from '@/lib/utils/env';

interface TestingFeatures {
  // Feature 狀態
  isTestingEnabled: boolean;
  isJestEnabled: boolean;
  isCIEnabled: boolean;
  isE2EEnabled: boolean;
  isCoverageEnforced: boolean;
  isPerformanceMonitoringEnabled: boolean;

  // 配置
  e2eMode: 'disabled' | 'smoke_tests' | 'full_suite';
  performanceMode: 'disabled' | 'basic' | 'advanced';
  coverageTarget: number;

  // 功能檢查
  shouldRunUnitTests: () => boolean;
  shouldRunE2ETests: () => boolean;
  shouldEnforceCoverage: () => boolean;

  // 性能監控
  trackTestExecution: (testName: string, duration: number) => void;
  getTestMetrics: () => TestMetrics;
}

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageDuration: number;
  slowestTest: { name: string; duration: number } | null;
}

export function useTestingFeatures(): TestingFeatures {
  const [testMetrics, setTestMetrics] = useState<TestMetrics>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageDuration: 0,
    slowestTest: null,
  });

  // 獲取所有相關的 feature flags
  const { flags } = useFeatureFlags([
    'phase4_testing_infrastructure',
    'jest_unit_tests',
    'github_actions_ci',
    'e2e_testing',
    'test_coverage_enforcement',
    'performance_monitoring',
  ]);

  // 提取狀態
  const isTestingEnabled = flags.phase4_testing_infrastructure?.enabled || false;
  const isJestEnabled = flags.jest_unit_tests?.enabled || false;
  const isCIEnabled = flags.github_actions_ci?.enabled || false;
  const isE2EEnabled = flags.e2e_testing?.enabled || false;
  const isCoverageEnforced = flags.test_coverage_enforcement?.enabled || false;
  const isPerformanceMonitoringEnabled = flags.performance_monitoring?.enabled || false;

  // 獲取變體配置
  const e2eMode = (flags.e2e_testing?.variant || 'disabled') as
    | 'disabled'
    | 'smoke_tests'
    | 'full_suite';
  const performanceMode = (flags.performance_monitoring?.variant || 'basic') as
    | 'disabled'
    | 'basic'
    | 'advanced';

  // 獲取當前覆蓋率目標
  const coverageTarget = getCurrentCoverageTarget();

  // 檢查是否應該運行單元測試
  const shouldRunUnitTests = useCallback(() => {
    if (!isTestingEnabled || !isJestEnabled) return false;

    return shouldRunTests({
      environment: process.env.NODE_ENV || 'development',
      testType: 'unit',
    });
  }, [isTestingEnabled, isJestEnabled]);

  // 檢查是否應該運行 E2E 測試
  const shouldRunE2ETests = useCallback(() => {
    if (!isTestingEnabled || !isE2EEnabled) return false;
    if (e2eMode === 'disabled') return false;

    return shouldRunTests({
      environment: process.env.NODE_ENV || 'development',
      testType: 'e2e',
    });
  }, [isTestingEnabled, isE2EEnabled, e2eMode]);

  // 檢查是否應該強制執行覆蓋率
  const shouldEnforceCoverage = useCallback(() => {
    if (!isTestingEnabled || !isCoverageEnforced) return false;

    // 只在 CI 環境或明確設置時強制執行
    return process.env.CI === 'true' || process.env.ENFORCE_COVERAGE === 'true';
  }, [isTestingEnabled, isCoverageEnforced]);

  // 追蹤測試執行
  const trackTestExecution = useCallback(
    (testName: string, duration: number) => {
      if (!isPerformanceMonitoringEnabled) return;

      setTestMetrics(prev => {
        const newTotal = prev.totalTests + 1;
        const newAverage = (prev.averageDuration * prev.totalTests + duration) / newTotal;
        const newSlowest =
          !prev.slowestTest || duration > prev.slowestTest.duration
            ? { name: testName, duration }
            : prev.slowestTest;

        return {
          ...prev,
          totalTests: newTotal,
          averageDuration: newAverage,
          slowestTest: newSlowest,
        };
      });

      // 如果是高級模式，發送到分析服務
      if (performanceMode === 'advanced') {
        // TODO: 實現分析服務集成
        console.log(`[Performance] Test "${testName}" completed in ${duration}ms`);
      }
    },
    [isPerformanceMonitoringEnabled, performanceMode]
  );

  // 獲取測試指標
  const getTestMetrics = useCallback(() => testMetrics, [testMetrics]);

  // 監聽測試結果（如果在測試環境中）
  useEffect(() => {
    if (!isPerformanceMonitoringEnabled) return;

    // 監聽 Jest 測試結果（如果可用）
    if (typeof window !== 'undefined' && (window as any).__JEST_TEST_RESULTS__) {
      const results = (window as any).__JEST_TEST_RESULTS__ as Record<string, unknown>;
      setTestMetrics({
        totalTests: (results?.numTotalTests as number) || 0,
        passedTests: (results?.numPassedTests as number) || 0,
        failedTests: (results?.numFailedTests as number) || 0,
        averageDuration: 0,
        slowestTest: null,
      });
    }
  }, [isPerformanceMonitoringEnabled]);

  return {
    // Feature 狀態
    isTestingEnabled,
    isJestEnabled,
    isCIEnabled,
    isE2EEnabled,
    isCoverageEnforced,
    isPerformanceMonitoringEnabled,

    // 配置
    e2eMode,
    performanceMode,
    coverageTarget,

    // 功能檢查
    shouldRunUnitTests,
    shouldRunE2ETests,
    shouldEnforceCoverage,

    // 性能監控
    trackTestExecution,
    getTestMetrics,
  };
}

/**
 * 測試運行守衛 HOC
 *
 * 只在 feature flag 啟用時運行測試
 */
export function withTestingFeature<P extends object>(
  Component: React.ComponentType<P>,
  testType: 'unit' | 'e2e' = 'unit'
): React.ComponentType<P> {
  return function TestingFeatureWrapper(props: P) {
    const { shouldRunUnitTests, shouldRunE2ETests } = useTestingFeatures();

    const shouldRun = testType === 'unit' ? shouldRunUnitTests() : shouldRunE2ETests();

    if (!shouldRun) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Jest 測試配置助手
 * 不使用 React Hook，直接獲取特徵標誌值
 */
export function getJestConfig() {
  // 直接檢查特徵標誌而不使用 Hook
  const jestEnabled = isTest() || process.env.JEST_WORKER_ID !== undefined;

  if (!jestEnabled) {
    return null;
  }

  const coverageTarget = 80; // 默認覆蓋率目標
  const shouldEnforce = isTest();

  return {
    collectCoverage: true,
    coverageThreshold: shouldEnforce
      ? {
          global: {
            branches: coverageTarget,
            functions: coverageTarget,
            lines: coverageTarget,
            statements: coverageTarget,
          },
        }
      : undefined,
    testTimeout: process.env.CI ? 30000 : 10000,
  };
}
