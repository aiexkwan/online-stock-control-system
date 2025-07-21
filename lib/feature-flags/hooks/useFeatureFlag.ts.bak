import { useEffect, useState, useCallback, useMemo } from 'react';
import { FeatureEvaluation, FeatureContext } from '../types';
import { featureFlagManager } from '../FeatureFlagManager';

/**
 * Hook 用於獲取單個 Feature Flag 的狀態
 */
export function useFeatureFlag(
  key: string,
  context?: Partial<FeatureContext>
): {
  enabled: boolean;
  variant?: string;
  loading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
} {
  const [evaluation, setEvaluation] = useState<FeatureEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  // 合併上下文
  const mergedContext = useMemo(() => {
    return featureFlagManager.getMergedContext(context);
  }, [context]);

  // 評估 Feature Flag
  const evaluate = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await featureFlagManager.evaluate(key, mergedContext);
      setEvaluation(result);
    } catch (err) {
      setError(err as Error);
      setEvaluation({ enabled: false, reason: 'Evaluation error' });
    } finally {
      setLoading(false);
    }
  }, [key, mergedContext]);

  // 初始評估
  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // 訂閱變更
  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(async flags => {
      // 檢查是否包含當前 flag
      if (flags.some(f => f.key === key)) {
        await evaluate();
      }
    });

    return unsubscribe;
  }, [key, evaluate]);

  return {
    enabled: evaluation?.enabled || false,
    variant: evaluation?.variant,
    loading,
    error,
    refresh: evaluate,
  };
}

/**
 * Hook 用於批量獲取多個 Feature Flags
 */
export function useFeatureFlags(
  keys: string[],
  context?: Partial<FeatureContext>
): {
  flags: Record<string, FeatureEvaluation>;
  loading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
} {
  const [flags, setFlags] = useState<Record<string, FeatureEvaluation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  // 合併上下文
  const mergedContext = useMemo(() => {
    return featureFlagManager.getMergedContext(context);
  }, [context]);

  // 評估所有 Feature Flags
  const evaluateAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const evaluations: Record<string, FeatureEvaluation> = {};

      await Promise.all(
        keys.map(async key => {
          const result = await featureFlagManager.evaluate(key, mergedContext);
          evaluations[key] = result;
        })
      );

      setFlags(evaluations);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [keys, mergedContext]);

  // 初始評估
  useEffect(() => {
    evaluateAll();
  }, [evaluateAll]);

  // 訂閱變更
  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(async changedFlags => {
      // 檢查是否有相關的 flags 變更
      const hasRelevantChanges = changedFlags.some(f => keys.includes(f.key));
      if (hasRelevantChanges) {
        await evaluateAll();
      }
    });

    return unsubscribe;
  }, [keys, evaluateAll]);

  return {
    flags,
    loading,
    error,
    refresh: evaluateAll,
  };
}

/**
 * Hook 用於獲取所有 Feature Flags
 */
export function useAllFeatureFlags(context?: Partial<FeatureContext>): {
  flags: Record<string, FeatureEvaluation>;
  loading: boolean;
  error?: Error;
  refresh: () => Promise<void>;
} {
  const [flags, setFlags] = useState<Record<string, FeatureEvaluation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  // 合併上下文
  const mergedContext = useMemo(() => {
    return featureFlagManager.getMergedContext(context);
  }, [context]);

  // 評估所有 Feature Flags
  const evaluateAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const result = await featureFlagManager.evaluateAll(mergedContext);
      setFlags(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [mergedContext]);

  // 初始評估
  useEffect(() => {
    evaluateAll();
  }, [evaluateAll]);

  // 訂閱變更
  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(evaluateAll);
    return unsubscribe;
  }, [evaluateAll]);

  return {
    flags,
    loading,
    error,
    refresh: evaluateAll,
  };
}

/**
 * Hook 用於開發環境中切換 Feature Flag
 */
export function useFeatureFlagToggle(key: string): {
  enabled: boolean;
  toggle: () => Promise<void>;
  loading: boolean;
  error?: Error;
} {
  const { enabled, loading, error, refresh } = useFeatureFlag(key);
  const [toggling, setToggling] = useState(false);

  const toggle = useCallback(async () => {
    try {
      setToggling(true);
      await featureFlagManager.toggleFlag(key);
      await refresh();
    } catch (err) {
      console.error('Failed to toggle feature flag:', err);
    } finally {
      setToggling(false);
    }
  }, [key, refresh]);

  return {
    enabled,
    toggle,
    loading: loading || toggling,
    error,
  };
}

/**
 * Hook 用於獲取 Feature Flag 管理器實例
 */
export function useFeatureFlagManager() {
  return featureFlagManager;
}
