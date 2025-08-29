/**
 * Feature Flag 使用示例
 *
 * 這個文件展示了如何在實際應用中使用 Feature Flag 系統
 */

import React from 'react';
import { isDevelopment, isNotProduction } from '@/lib/utils/env';
import {
  FeatureFlag,
  FeatureVariant,
  useFeatureFlag,
  useFeatureFlags,
  useFeatureFlagToggle,
  withFeatureFlag,
  KnownFeatureFlags,
} from '../index';

/**
 * 示例 1: 基本使用 - 條件渲染組件
 */
export function Example1_BasicUsage() {
  return (
    <div>
      <h2>Basic Feature Flag Usage</h2>

      {/* 只在 feature flag 啟用時顯示 */}
      <FeatureFlag flag={KnownFeatureFlags.NEW_DASHBOARD}>
        <div className='rounded bg-blue-100 p-4'>
          <p>This is the new dashboard! 🎉</p>
        </div>
      </FeatureFlag>

      {/* 使用 fallback */}
      <FeatureFlag flag={KnownFeatureFlags.ADVANCED_SEARCH} fallback={<BasicSearch />}>
        <AdvancedSearch />
      </FeatureFlag>
    </div>
  );
}

/**
 * 示例 2: 使用 Hook
 */
export function Example2_UsingHook() {
  const { enabled, loading, error } = useFeatureFlag(KnownFeatureFlags.DARK_MODE);

  if (loading) return <div>Loading theme settings...</div>;
  if (error) return <div>Error loading theme settings</div>;

  return (
    <div className={enabled ? 'dark-theme' : 'light-theme'}>
      <h2>Theme: {enabled ? 'Dark' : 'Light'}</h2>
      <p>Content goes here...</p>
    </div>
  );
}

/**
 * 示例 3: 批量檢查多個 Feature Flags
 */
export function Example3_MultipleFlags() {
  const { flags, loading } = useFeatureFlags([
    KnownFeatureFlags.BATCH_OPERATIONS,
    KnownFeatureFlags.VIRTUAL_SCROLLING,
    KnownFeatureFlags.LAZY_LOADING,
  ]);

  if (loading) return <div>Loading features...</div>;

  return (
    <div>
      <h2>Feature Status</h2>
      <ul>
        <li>Batch Operations: {flags.batch_operations?.enabled ? '✅' : '❌'}</li>
        <li>Virtual Scrolling: {flags.virtual_scrolling?.enabled ? '✅' : '❌'}</li>
        <li>Lazy Loading: {flags.lazy_loading?.enabled ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}

/**
 * 示例 4: A/B 測試變體
 */
export function Example4_Variants() {
  return (
    <FeatureVariant
      flag='theme_variant'
      variants={{
        default: <DefaultTheme />,
        modern: <ModernTheme />,
        classic: <ClassicTheme />,
      }}
      defaultContent={<DefaultTheme />}
    />
  );
}

/**
 * 示例 5: 帶上下文的 Feature Flag
 */
export function Example5_WithContext() {
  const userContext = {
    userId: 'user123',
    userGroups: ['beta-testers', 'premium'],
    customAttributes: {
      accountAge: 90, // days
      subscriptionTier: 'premium',
    },
  };

  return (
    <FeatureFlag flag='premium_features' context={userContext}>
      <PremiumFeatures />
    </FeatureFlag>
  );
}

/**
 * 示例 6: 高階組件使用
 */
const EnhancedComponent = withFeatureFlag(KnownFeatureFlags.AI_PREDICTIONS, {
  fallback: BasicPredictions,
})(AIPredictions);

export function Example6_HOC() {
  return (
    <div>
      <h2>Predictions</h2>
      <EnhancedComponent />
    </div>
  );
}

/**
 * 示例 7: 程序化檢查
 */
export function Example7_ProgrammaticCheck() {
  const { enabled: isBatchEnabled } = useFeatureFlag(KnownFeatureFlags.BATCH_OPERATIONS);

  const handleAction = async () => {
    if (isBatchEnabled) {
      // 執行批量操作
      await performBatchOperation();
    } else {
      // 執行單個操作
      await performSingleOperation();
    }
  };

  return <button onClick={handleAction}>{isBatchEnabled ? 'Batch Process' : 'Process'}</button>;
}

/**
 * 示例 8: 開發環境切換
 */
export function Example8_DevToggle() {
  const { enabled, toggle, loading } = useFeatureFlagToggle(KnownFeatureFlags.DEBUG_MODE);

  if (!isDevelopment()) {
    return null;
  }

  return (
    <div className='fixed bottom-20 right-4 rounded bg-gray-800 p-2 text-white'>
      <label className='flex items-center gap-2'>
        <input type='checkbox' checked={enabled} onChange={toggle} disabled={loading} />
        Debug Mode
      </label>
    </div>
  );
}

/**
 * 示例 9: 漸進式發布
 */
export function Example9_GradualRollout() {
  // Feature flag 配置了 30% 的發布比例
  return (
    <FeatureFlag flag='new_checkout_flow'>
      <div className='rounded border-2 border-green-500 p-4'>
        <p>🎉 You&apos;re seeing the new checkout flow!</p>
        <p>You&apos;re part of the 30% rollout group.</p>
      </div>
    </FeatureFlag>
  );
}

/**
 * 示例 10: 完整應用示例
 */
export function Example10_CompleteApp() {
  const { flags } = useAllFeatureFlags();

  return (
    <div className={flags.dark_mode?.enabled ? 'dark' : ''}>
      <nav>
        <FeatureFlag flag={KnownFeatureFlags.NEW_DASHBOARD}>
          <a href='/new-dashboard'>New Dashboard</a>
        </FeatureFlag>
      </nav>

      <main>
        <FeatureVariant
          flag='layout_variant'
          variants={{
            grid: <GridLayout />,
            list: <ListLayout />,
            card: <CardLayout />,
          }}
        />
      </main>

      {/* 開發環境顯示 Feature Flag 面板 */}
      {isDevelopment() && <FeatureFlagPanel />}
    </div>
  );
}

// 模擬組件
function BasicSearch() {
  return <div>Basic Search</div>;
}

function AdvancedSearch() {
  return <div>Advanced Search with Filters</div>;
}

function DefaultTheme() {
  return <div>Default Theme</div>;
}

function ModernTheme() {
  return <div>Modern Theme</div>;
}

function ClassicTheme() {
  return <div>Classic Theme</div>;
}

function PremiumFeatures() {
  return <div>Premium Features</div>;
}

function AIPredictions() {
  return <div>AI-Powered Predictions</div>;
}

function BasicPredictions() {
  return <div>Basic Predictions</div>;
}

function GridLayout() {
  return <div>Grid Layout</div>;
}

function ListLayout() {
  return <div>List Layout</div>;
}

function CardLayout() {
  return <div>Card Layout</div>;
}

function FeatureFlagPanel() {
  return <div>Feature Flag Panel</div>;
}

async function performBatchOperation() {
  console.log('Performing batch operation...');
}

async function performSingleOperation() {
  console.log('Performing single operation...');
}

import { useAllFeatureFlags } from '../hooks/useFeatureFlag';
