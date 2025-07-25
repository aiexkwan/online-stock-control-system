/**
 * Feature Flag 系統
 *
 * 提供功能開關、A/B 測試和漸進式發布功能
 */

// 類型導出
export * from './types';

// 管理器導出
export { FeatureFlagManager } from './FeatureFlagManager';
import { featureFlagManager } from './FeatureFlagManager';

// 提供者導出
export { BaseFeatureFlagProvider } from './providers/BaseProvider';
export { LocalFeatureFlagProvider } from './providers/LocalProvider';
export { SupabaseFeatureFlagProvider } from './providers/SupabaseProvider';

// React Hooks 導出
export {
  useFeatureFlag,
  useFeatureFlags,
  useAllFeatureFlags,
  useFeatureFlagToggle,
  useFeatureFlagManager,
} from './hooks/useFeatureFlag';

// React 組件導出
export {
  FeatureFlag,
  FeatureVariant,
  FeatureFlagsProvider,
  useFeatureFlagsContext,
  withFeatureFlag,
} from './components/FeatureFlag';

export { FeatureFlagPanel } from './components/FeatureFlagPanel';

// 配置導出
export { phase4FeatureFlags } from './configs/phase4-rollout';
export { cardsMigrationFlags, shouldUseCard, shouldUseGraphQL, getMigrationProgress } from './configs/cards-migration';

/**
 * 快捷函數
 */

/**
 * 檢查 Feature Flag 是否啟用
 */
export async function isFeatureEnabled(
  key: string,
  context?: Record<string, unknown>
): Promise<boolean> {
  const evaluation = await featureFlagManager.evaluate(key, context);
  return evaluation.enabled;
}

/**
 * 獲取 Feature Flag 變體
 */
export async function getFeatureVariant(
  key: string,
  context?: Record<string, unknown>
): Promise<string | undefined> {
  const evaluation = await featureFlagManager.evaluate(key, context);
  return evaluation.variant;
}

/**
 * 批量檢查 Feature Flags
 */
export async function checkFeatures(
  keys: string[],
  context?: Record<string, unknown>
): Promise<Record<string, boolean>> {
  const evaluations = await Promise.all(
    keys.map(async key => {
      const evaluation = await featureFlagManager.evaluate(key, context);
      return [key, evaluation.enabled];
    })
  );

  return Object.fromEntries(evaluations);
}
