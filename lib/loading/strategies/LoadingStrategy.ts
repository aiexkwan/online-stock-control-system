/**
 * Loading Strategy
 * 載入策略管理
 *
 * 根據載入類型、優先級和性能指標創建最適合的載入策略
 */

import { LoadingStrategy, LoadingType, LoadingPriority, PerformanceMetrics } from '../types';

// 預設策略配置
const DEFAULT_STRATEGIES: Record<string, LoadingStrategy> = {
  // 頁面級載入
  page: {
    name: 'page',
    debounceTime: 0,
    timeout: 30000,
    minShowTime: 300,
    useSkeleton: true,
    showProgress: true,
    retryCount: 2,
    performanceAware: true,
  },

  // 組件級載入
  component: {
    name: 'component',
    debounceTime: 100,
    timeout: 10000,
    minShowTime: 200,
    useSkeleton: true,
    showProgress: false,
    retryCount: 3,
    performanceAware: true,
  },

  // 數據載入
  data: {
    name: 'data',
    debounceTime: 300,
    timeout: 15000,
    minShowTime: 150,
    useSkeleton: false,
    showProgress: false,
    retryCount: 3,
    performanceAware: true,
  },

  // 圖片載入
  image: {
    name: 'image',
    debounceTime: 50,
    timeout: 20000,
    minShowTime: 100,
    useSkeleton: true,
    showProgress: false,
    retryCount: 2,
    performanceAware: true,
  },

  // API 請求
  api: {
    name: 'api',
    debounceTime: 200,
    timeout: 15000,
    minShowTime: 100,
    useSkeleton: false,
    showProgress: false,
    retryCount: 3,
    performanceAware: true,
  },

  // Widget 載入
  widget: {
    name: 'widget',
    debounceTime: 150,
    timeout: 12000,
    minShowTime: 200,
    useSkeleton: true,
    showProgress: false,
    retryCount: 2,
    performanceAware: true,
  },

  // 背景載入
  background: {
    name: 'background',
    debounceTime: 500,
    timeout: 60000,
    minShowTime: 0,
    useSkeleton: false,
    showProgress: false,
    retryCount: 5,
    performanceAware: false,
  },
};

// 優先級調整係數
const PRIORITY_MODIFIERS: Record<
  LoadingPriority,
  {
    debounceMultiplier: number;
    timeoutMultiplier: number;
    minShowTimeMultiplier: number;
    retryMultiplier: number;
  }
> = {
  critical: {
    debounceMultiplier: 0, // 立即執行
    timeoutMultiplier: 2, // 更長超時
    minShowTimeMultiplier: 0.5, // 更短最小顯示時間
    retryMultiplier: 1.5, // 更多重試
  },
  high: {
    debounceMultiplier: 0.5,
    timeoutMultiplier: 1.5,
    minShowTimeMultiplier: 0.7,
    retryMultiplier: 1.2,
  },
  medium: {
    debounceMultiplier: 1,
    timeoutMultiplier: 1,
    minShowTimeMultiplier: 1,
    retryMultiplier: 1,
  },
  low: {
    debounceMultiplier: 2,
    timeoutMultiplier: 0.7,
    minShowTimeMultiplier: 1.5,
    retryMultiplier: 0.8,
  },
};

// 性能調整係數
const PERFORMANCE_MODIFIERS = {
  lowEndDevice: {
    debounceMultiplier: 1.5,
    timeoutMultiplier: 1.5,
    minShowTimeMultiplier: 1.2,
    retryMultiplier: 0.8,
  },
  slowNetwork: {
    debounceMultiplier: 1.3,
    timeoutMultiplier: 2,
    minShowTimeMultiplier: 1.1,
    retryMultiplier: 1.5,
  },
  fastNetwork: {
    debounceMultiplier: 0.8,
    timeoutMultiplier: 0.8,
    minShowTimeMultiplier: 0.9,
    retryMultiplier: 1,
  },
};

/**
 * 創建載入策略
 */
export function createLoadingStrategy(
  type: LoadingType,
  priority: LoadingPriority = 'medium',
  userOverrides?: Partial<LoadingStrategy>,
  performanceMetrics?: PerformanceMetrics
): LoadingStrategy {
  // 獲取基礎策略
  const baseStrategy = DEFAULT_STRATEGIES[type] || DEFAULT_STRATEGIES.component;

  // 應用優先級調整
  const priorityModifier = PRIORITY_MODIFIERS[priority];

  // 應用性能調整
  let performanceModifier = {
    debounceMultiplier: 1,
    timeoutMultiplier: 1,
    minShowTimeMultiplier: 1,
    retryMultiplier: 1,
  };

  if (performanceMetrics && baseStrategy.performanceAware) {
    if (performanceMetrics.isLowEndDevice) {
      performanceModifier = combineModifiers(
        performanceModifier,
        PERFORMANCE_MODIFIERS.lowEndDevice
      );
    }

    if (performanceMetrics.isSlowNetwork) {
      performanceModifier = combineModifiers(
        performanceModifier,
        PERFORMANCE_MODIFIERS.slowNetwork
      );
    } else if (!performanceMetrics.isSlowNetwork && performanceMetrics.downlink > 5) {
      performanceModifier = combineModifiers(
        performanceModifier,
        PERFORMANCE_MODIFIERS.fastNetwork
      );
    }
  }

  // 計算最終值
  const strategy: LoadingStrategy = {
    ...baseStrategy,
    name: `${type}-${priority}`,
    debounceTime: Math.round(
      (baseStrategy.debounceTime || 0) *
        priorityModifier.debounceMultiplier *
        performanceModifier.debounceMultiplier
    ),
    timeout: Math.round(
      (baseStrategy.timeout || 15000) *
        priorityModifier.timeoutMultiplier *
        performanceModifier.timeoutMultiplier
    ),
    minShowTime: Math.round(
      (baseStrategy.minShowTime || 200) *
        priorityModifier.minShowTimeMultiplier *
        performanceModifier.minShowTimeMultiplier
    ),
    retryCount: Math.round(
      (baseStrategy.retryCount || 3) *
        priorityModifier.retryMultiplier *
        performanceModifier.retryMultiplier
    ),
    // 覆蓋用戶自定義設置
    ...userOverrides,
  };

  return strategy;
}

/**
 * 合併調整係數
 */
function combineModifiers(
  base: {
    debounceMultiplier: number;
    timeoutMultiplier: number;
    minShowTimeMultiplier: number;
    retryMultiplier: number;
  },
  additional: {
    debounceMultiplier: number;
    timeoutMultiplier: number;
    minShowTimeMultiplier: number;
    retryMultiplier: number;
  }
) {
  return {
    debounceMultiplier: base.debounceMultiplier * additional.debounceMultiplier,
    timeoutMultiplier: base.timeoutMultiplier * additional.timeoutMultiplier,
    minShowTimeMultiplier: base.minShowTimeMultiplier * additional.minShowTimeMultiplier,
    retryMultiplier: base.retryMultiplier * additional.retryMultiplier,
  };
}

/**
 * 獲取預設策略
 */
export function getDefaultStrategy(type: LoadingType): LoadingStrategy {
  return DEFAULT_STRATEGIES[type] || DEFAULT_STRATEGIES.component;
}

/**
 * 獲取所有可用策略類型
 */
export function getAvailableStrategies(): LoadingType[] {
  return Object.keys(DEFAULT_STRATEGIES) as LoadingType[];
}

/**
 * 性能感知策略建議
 */
export function getPerformanceAwareStrategySuggestion(performanceMetrics: PerformanceMetrics): {
  useSkeleton: boolean;
  showProgress: boolean;
  complexity: 'simple' | 'medium' | 'detailed';
  animation: 'pulse' | 'wave' | 'none';
} {
  const { isLowEndDevice, isSlowNetwork } = performanceMetrics;

  if (isLowEndDevice && isSlowNetwork) {
    return {
      useSkeleton: true,
      showProgress: false,
      complexity: 'simple',
      animation: 'none',
    };
  } else if (isLowEndDevice || isSlowNetwork) {
    return {
      useSkeleton: true,
      showProgress: true,
      complexity: 'medium',
      animation: 'pulse',
    };
  } else {
    return {
      useSkeleton: true,
      showProgress: true,
      complexity: 'detailed',
      animation: 'wave',
    };
  }
}
