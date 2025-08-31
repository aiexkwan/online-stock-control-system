/**
 * Testing Features Hook
 *
 * 整合 Feature Flags 與測試基礎設施
 */

import { useCallback, useEffect, useState } from 'react';
import type { FC, ComponentType } from 'react';
import { isTest } from '../../utils/env';
import { shouldRunTests, getCurrentCoverageTarget } from '../configs/phase4-rollout';
import { useFeatureFlags } from './useFeatureFlag';
import type { FeatureEvaluation } from '../types';

/**
 * E2E 測試模式類型
 */
type E2EMode = 'disabled' | 'smoke_tests' | 'full_suite';

/**
 * 性能監控模式類型
 */
type PerformanceMode = 'disabled' | 'basic' | 'advanced';

/**
 * 測試類型
 */
type TestType = 'unit' | 'e2e';

/**
 * 測試指標接口
 */
interface TestMetrics {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly averageDuration: number;
  readonly slowestTest: { name: string; duration: number } | null;
}

/**
 * 測試功能主接口
 */
interface TestingFeatures {
  // Feature 狀態
  readonly isTestingEnabled: boolean;
  readonly isJestEnabled: boolean;
  readonly isCIEnabled: boolean;
  readonly isE2EEnabled: boolean;
  readonly isCoverageEnforced: boolean;
  readonly isPerformanceMonitoringEnabled: boolean;

  // 配置
  readonly e2eMode: E2EMode;
  readonly performanceMode: PerformanceMode;
  readonly coverageTarget: number;

  // 功能檢查
  readonly shouldRunUnitTests: () => boolean;
  readonly shouldRunE2ETests: () => boolean;
  readonly shouldEnforceCoverage: () => boolean;

  // 性能監控
  readonly trackTestExecution: (testName: string, duration: number) => void;
  readonly getTestMetrics: () => TestMetrics;
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

  // 獲取變體配置 - 確保類型安全
  const e2eMode: E2EMode = (flags.e2e_testing?.variant as E2EMode) || 'disabled';
  const performanceMode: PerformanceMode =
    (flags.performance_monitoring?.variant as PerformanceMode) || 'basic';

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
    const windowWithJest =
      typeof window !== 'undefined'
        ? (window as Window & { __JEST_TEST_RESULTS__?: Record<string, unknown> })
        : null;
    if (windowWithJest?.__JEST_TEST_RESULTS__) {
      const results = windowWithJest.__JEST_TEST_RESULTS__;
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
export function withTestingFeature<P extends Record<string, any>>(
  Component: ComponentType<P>,
  testType: TestType = 'unit'
): ComponentType<P> {
  const TestingFeatureWrapper = (props: P) => {
    const { shouldRunUnitTests, shouldRunE2ETests } = useTestingFeatures();

    const shouldRun = testType === 'unit' ? shouldRunUnitTests() : shouldRunE2ETests();

    if (!shouldRun) {
      return null;
    }

    return <Component {...(props as P)} />;
  };

  // 設定 displayName 以便於開發時除錯
  TestingFeatureWrapper.displayName = `withTestingFeature(${Component.displayName || Component.name || 'Component'})`;

  return TestingFeatureWrapper as ComponentType<P>;
}

/**
 * Jest 覆蓋率閾值類型定義
 */
interface JestCoverageThreshold {
  readonly global: {
    readonly branches: number;
    readonly functions: number;
    readonly lines: number;
    readonly statements: number;
  };
}

/**
 * Jest 配置返回類型
 */
interface JestConfig {
  readonly collectCoverage: boolean;
  readonly coverageThreshold?: JestCoverageThreshold;
  readonly testTimeout: number;
}

/**
 * Jest 測試配置助手
 *
 * 不依賴 React Hook，可以在任何地方使用
 * 直接獲取特徵標誌值並生成 Jest 配置
 *
 * @returns Jest 配置物件或 null（如果不應啟用）
 */
export function getJestConfig(): JestConfig | null {
  // 直接檢查特徵標誌而不使用 Hook
  const jestEnabled = isTest() || process.env.JEST_WORKER_ID !== undefined;

  if (!jestEnabled) {
    return null;
  }

  const coverageTarget = 80; // 默認覆蓋率目標
  const shouldEnforce = isTest();

  const baseConfig: JestConfig = {
    collectCoverage: true,
    testTimeout: process.env.CI ? 30000 : 10000,
  };

  if (shouldEnforce) {
    const configWithCoverage: JestConfig = {
      ...baseConfig,
      coverageThreshold: {
        global: {
          branches: coverageTarget,
          functions: coverageTarget,
          lines: coverageTarget,
          statements: coverageTarget,
        },
      },
    };
    return configWithCoverage;
  }

  return baseConfig;
}
