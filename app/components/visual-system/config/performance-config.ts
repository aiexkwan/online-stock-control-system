/**
 * Performance Configuration
 * 性能優化配置
 */

export const PERFORMANCE_CONFIG = {
  // WebGL性能配置
  webgl: {
    // 是否使用單例模式
    useSingleton: true,
    // 最大WebGL上下文數量
    maxContexts: 1,
    // 紋理大小限制
    maxTextureSize: 2048,
    // 是否在頁面不可見時暫停渲染
    pauseWhenHidden: true,
    // 渲染節流（毫秒）
    renderThrottle: 16, // ~60fps
  },

  // 設備檢測配置
  deviceDetection: {
    // GPU性能分級
    gpuTiers: {
      high: {
        minScore: 15000,
        settings: {
          particleDensity: 1.0,
          enablePostProcessing: true,
          enableReflections: true,
        },
      },
      medium: {
        minScore: 5000,
        settings: {
          particleDensity: 0.6,
          enablePostProcessing: true,
          enableReflections: false,
        },
      },
      low: {
        minScore: 0,
        settings: {
          particleDensity: 0.3,
          enablePostProcessing: false,
          enableReflections: false,
        },
      },
    },
    // 移動設備檢測
    mobile: {
      // 是否在移動設備上降級
      autoDowngrade: true,
      // 移動設備粒子密度倍數
      particleDensityMultiplier: 0.5,
    },
  },

  // 資源加載配置
  resourceLoading: {
    // 是否使用懶加載
    lazyLoad: true,
    // 預加載策略
    preloadStrategy: 'viewport', // 'viewport' | 'interaction' | 'none'
    // 資源快取時間（秒）
    cacheTimeout: 3600,
  },

  // 記憶體管理配置
  memoryManagement: {
    // 是否自動清理未使用資源
    autoCleanup: true,
    // 清理間隔（毫秒）
    cleanupInterval: 60000, // 1分鐘
    // 最大記憶體使用量（MB）
    maxMemoryUsage: 128,
    // 記憶體警告閾值（MB）
    warningThreshold: 100,
  },

  // 監控配置
  monitoring: {
    // 是否收集性能指標
    collectMetrics: true,
    // 指標收集間隔（毫秒）
    metricsInterval: 1000,
    // 要監控的指標
    metrics: ['fps', 'memory', 'gpu', 'renderTime'],
    // 是否發送到分析服務
    sendAnalytics: false,
  },

  // 降級策略配置
  fallbackStrategies: {
    // WebGL不支援時的降級方案
    noWebGL: {
      useCSS: true,
      cssAnimationType: 'keyframes', // 'keyframes' | 'transitions' | 'none'
    },
    // 低性能時的降級方案
    lowPerformance: {
      threshold: 30, // FPS閾值
      actions: {
        disableAnimations: true,
        reduceQuality: true,
        simplifyEffects: true,
      },
    },
    // 記憶體不足時的降級方案
    lowMemory: {
      threshold: 80, // 百分比
      actions: {
        clearCache: true,
        disableEffects: true,
        reduceTextureSize: true,
      },
    },
  },
} as const;

// 類型導出
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type GPUTier = keyof typeof PERFORMANCE_CONFIG.deviceDetection.gpuTiers;
export type PreloadStrategy = 'viewport' | 'interaction' | 'none';
