/**
 * Phase 4 Testing Infrastructure 漸進式發布配置
 *
 * 這個配置用於控制測試基礎設施的漸進式發布
 */

import { FeatureFlag, FeatureFlagStatus } from '../types';

export const phase4FeatureFlags: FeatureFlag[] = [
  {
    key: 'phase4_testing_infrastructure',
    name: 'Phase 4 Testing Infrastructure',
    description: '啟用新的測試基礎設施（Jest, Coverage, CI/CD）',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 10, // 開始 10% 發布
    rules: [
      {
        type: 'environment',
        value: 'development',
        operator: 'equals',
      },
      {
        type: 'user',
        value: ['test@pennineindustries.com', 'akwan@pennineindustries.com'],
        operator: 'contains',
      },
    ],
    tags: ['infrastructure', 'testing', 'phase4'],
    metadata: {
      phase: 4,
      startDate: new Date('2025-01-06'),
      targetCompletion: new Date('2025-01-20'),
    },
  },

  {
    key: 'jest_unit_tests',
    name: 'Jest Unit Tests',
    description: '啟用 Jest 單元測試',
    type: 'boolean',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    tags: ['testing', 'jest'],
    metadata: {
      coverage: {
        current: 10.4,
        target: 80,
        milestones: [
          { percentage: 30, date: '2025-01-10' },
          { percentage: 50, date: '2025-01-13' },
          { percentage: 80, date: '2025-01-20' },
        ],
      },
    },
  },

  {
    key: 'github_actions_ci',
    name: 'GitHub Actions CI/CD',
    description: '啟用 GitHub Actions 持續集成',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 50, // 50% 用戶啟用
    rules: [
      {
        type: 'custom',
        value: 'has_github_access',
      },
    ],
    tags: ['ci-cd', 'github', 'automation'],
  },

  {
    key: 'e2e_testing',
    name: 'E2E Testing with Playwright',
    description: '啟用 Playwright E2E 測試',
    type: 'variant',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: 'disabled',
    variants: [
      { key: 'disabled', name: 'Disabled', weight: 70 },
      { key: 'smoke_tests', name: 'Smoke Tests Only', weight: 20 },
      { key: 'full_suite', name: 'Full Test Suite', weight: 10 },
    ],
    tags: ['testing', 'e2e', 'playwright'],
  },

  {
    key: 'test_coverage_enforcement',
    name: 'Test Coverage Enforcement',
    description: '強制執行測試覆蓋率標準',
    type: 'percentage',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: false,
    rolloutPercentage: 0, // 暫時關閉，等覆蓋率達到 30% 後開啟
    metadata: {
      thresholds: {
        statements: 10,
        branches: 10,
        functions: 10,
        lines: 10,
      },
      enforcementLevel: 'warning', // 'warning' | 'error'
    },
    tags: ['testing', 'quality', 'coverage'],
  },

  {
    key: 'performance_monitoring',
    name: 'Performance Monitoring',
    description: '啟用性能監控系統',
    type: 'variant',
    status: FeatureFlagStatus.PARTIAL,
    defaultValue: 'basic',
    variants: [
      { key: 'disabled', name: 'Disabled', weight: 30 },
      { key: 'basic', name: 'Basic Metrics', weight: 50 },
      { key: 'advanced', name: 'Advanced Analytics', weight: 20 },
    ],
    tags: ['performance', 'monitoring', 'analytics'],
  },

  {
    key: 'gradual_migration',
    name: 'Gradual Migration Strategy',
    description: '漸進式遷移策略',
    type: 'release',
    status: FeatureFlagStatus.ENABLED,
    defaultValue: true,
    startDate: new Date('2025-01-06'),
    endDate: new Date('2025-01-20'),
    metadata: {
      phases: [
        { name: 'Testing Infrastructure', progress: 100 },
        { name: 'Unit Tests', progress: 10 },
        { name: 'Integration Tests', progress: 0 },
        { name: 'E2E Tests', progress: 0 },
        { name: 'Performance Tests', progress: 0 },
      ],
    },
    tags: ['migration', 'strategy', 'phase4'],
  },
];

/**
 * 獲取用戶的 Feature Flags 設置
 */
export function getUserFeatureFlags(userId: string): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  phase4FeatureFlags.forEach(flag => {
    // 檢查用戶特定規則
    const userRule = flag.rules?.find(r => r.type === 'user');
    if (userRule && Array.isArray(userRule.value)) {
      flags[flag.key] = userRule.value.includes(userId);
      return;
    }

    // 檢查百分比發布
    if (flag.type === 'percentage' && flag.rolloutPercentage !== undefined) {
      // 使用更好的哈希函數來決定是否啟用
      let hash = 0;
      const str = `${flag.key}-${userId}`;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const bucketValue = Math.abs(hash) % 100;
      flags[flag.key] = bucketValue < flag.rolloutPercentage;
      return;
    }

    // 預設值
    flags[flag.key] = flag.defaultValue as boolean;
  });

  return flags;
}

/**
 * 檢查是否應該執行測試
 */
export function shouldRunTests(context: {
  environment: string;
  userId?: string;
  testType: 'unit' | 'integration' | 'e2e';
}): boolean {
  // 開發環境總是執行測試
  if (context.environment === 'development') {
    return true;
  }

  // 檢查對應的 feature flag
  const flagKey =
    context.testType === 'unit'
      ? 'jest_unit_tests'
      : context.testType === 'e2e'
        ? 'e2e_testing'
        : 'phase4_testing_infrastructure';

  const flag = phase4FeatureFlags.find(f => f.key === flagKey);
  if (!flag) return false;

  // 檢查狀態
  if (flag.status === FeatureFlagStatus.DISABLED) return false;
  if (flag.status === FeatureFlagStatus.ENABLED) return true;

  // 部分啟用 - 檢查規則
  if (context.userId) {
    const userFlags = getUserFeatureFlags(context.userId);
    return userFlags[flagKey] || false;
  }

  return flag.defaultValue as boolean;
}

/**
 * 獲取當前測試覆蓋率目標
 */
export function getCurrentCoverageTarget(): number {
  const flag = phase4FeatureFlags.find(f => f.key === 'jest_unit_tests');
  const metadata = flag?.metadata as any;

  if (!metadata?.coverage) return 10;

  const today = new Date();
  const milestones = metadata.coverage.milestones;

  for (let i = milestones.length - 1; i >= 0; i--) {
    const milestone = milestones[i];
    if (new Date(milestone.date) <= today) {
      return milestone.percentage;
    }
  }

  return metadata.coverage.current;
}
