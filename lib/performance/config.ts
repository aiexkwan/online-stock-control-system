/**
 * Performance Monitoring Configuration
 * 統一管理性能監控的配置
 */

export interface PerformanceConfig {
  // 日誌配置
  logging: {
    enabled: boolean;
    level: 'none' | 'error' | 'warn' | 'info' | 'debug';
    maxConsoleMessages: number;
  };
  
  // 閾值配置
  thresholds: {
    loadTime: {
      warning: number;
      critical: number;
    };
    renderTime: {
      warning: number;
      critical: number;
    };
    dataFetchTime: {
      warning: number;
      critical: number;
    };
  };
  
  // 監控配置
  monitoring: {
    enabled: boolean;
    throttleInterval: number;
    maxMetrics: number;
    bufferSize: number;
  };
}

// 默認配置
const defaultConfig: PerformanceConfig = {
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: process.env.NODE_ENV === 'development' ? 'warn' : 'error',
    maxConsoleMessages: 100, // 限制控制台訊息數量
  },
  
  thresholds: {
    loadTime: {
      warning: 2000, // 2 seconds
      critical: 5000, // 5 seconds
    },
    renderTime: {
      warning: 500, // 500ms
      critical: 1000, // 1 second
    },
    dataFetchTime: {
      warning: 1000, // 1 second
      critical: 3000, // 3 seconds
    },
  },
  
  monitoring: {
    enabled: true,
    throttleInterval: 2000, // 2 seconds between logs per widget
    maxMetrics: 1000, // 限制記錄的指標數量
    bufferSize: 100, // 緩衝區大小
  },
};

// 環境特定的配置覆蓋
const environmentOverrides: Partial<PerformanceConfig> = {
  // 生產環境：只記錄錯誤
  ...(process.env.NODE_ENV === 'production' && {
    logging: {
      enabled: false,
      level: 'error' as const,
      maxConsoleMessages: 10,
    },
    monitoring: {
      enabled: false,
      throttleInterval: 5000,
      maxMetrics: 100,
      bufferSize: 50,
    },
  }),
  
  // 測試環境：禁用日誌
  ...(process.env.NODE_ENV === 'test' && {
    logging: {
      enabled: false,
      level: 'none' as const,
      maxConsoleMessages: 0,
    },
    monitoring: {
      enabled: false,
      throttleInterval: 10000,
      maxMetrics: 10,
      bufferSize: 5,
    },
  }),
};

// 合併配置
export const performanceConfig: PerformanceConfig = {
  ...defaultConfig,
  ...environmentOverrides,
  logging: {
    ...defaultConfig.logging,
    ...environmentOverrides.logging,
  },
  thresholds: {
    ...defaultConfig.thresholds,
    ...environmentOverrides.thresholds,
  },
  monitoring: {
    ...defaultConfig.monitoring,
    ...environmentOverrides.monitoring,
  },
};

// 日誌計數器
let consoleMessageCount = 0;

// 受控制的日誌函數
export const performanceLogger = {
  error: (message: string, ...args: any[]) => {
    if (performanceConfig.logging.enabled && 
        performanceConfig.logging.level !== 'none' && 
        consoleMessageCount < performanceConfig.logging.maxConsoleMessages) {
      console.error(message, ...args);
      consoleMessageCount++;
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (performanceConfig.logging.enabled && 
        ['warn', 'info', 'debug'].includes(performanceConfig.logging.level) &&
        consoleMessageCount < performanceConfig.logging.maxConsoleMessages) {
      console.warn(message, ...args);
      consoleMessageCount++;
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (performanceConfig.logging.enabled && 
        ['info', 'debug'].includes(performanceConfig.logging.level) &&
        consoleMessageCount < performanceConfig.logging.maxConsoleMessages) {
      console.log(message, ...args);
      consoleMessageCount++;
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (performanceConfig.logging.enabled && 
        performanceConfig.logging.level === 'debug' &&
        consoleMessageCount < performanceConfig.logging.maxConsoleMessages) {
      console.debug(message, ...args);
      consoleMessageCount++;
    }
  },
  
  // 重置計數器
  resetCount: () => {
    consoleMessageCount = 0;
  },
  
  // 獲取當前計數
  getCount: () => consoleMessageCount,
};

// 每小時重置計數器
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceLogger.resetCount();
  }, 60 * 60 * 1000); // 1 hour
} 