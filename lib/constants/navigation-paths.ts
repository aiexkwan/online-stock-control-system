/**
 * 常用導航路徑配置
 * 基於業務需求預定義，無需動態追蹤
 */

export const FREQUENT_PATHS = [
  '/admin/operations',
  '/stock-transfer',
  '/qc-label',
  '/order-loading',
  '/admin',
];

export const TIME_BASED_SUGGESTIONS = {
  morning: {
    hours: [8, 9, 10, 11],
    paths: ['/admin/operations', '/stock-transfer', '/qc-label'],
    message: 'Time for warehouse operations',
  },
  afternoon: {
    hours: [12, 13, 14, 15, 16, 17],
    paths: ['/order-loading', '/grn', '/admin/analytics'],
    message: 'Check order processing',
  },
  evening: {
    hours: [18, 19, 20],
    paths: ['/admin/data-management', '/admin/stock-count', '/admin'],
    message: 'Daily review time',
  },
};

export const getFrequentPaths = (limit = 5): string[] => {
  return FREQUENT_PATHS.slice(0, limit);
};

export const getTimeBasedSuggestion = () => {
  const currentHour = new Date().getHours();
  
  for (const [period, config] of Object.entries(TIME_BASED_SUGGESTIONS)) {
    if (config.hours.includes(currentHour)) {
      return {
        period,
        paths: config.paths,
        message: config.message,
        mostActiveHours: config.hours,
      };
    }
  }
  
  return null;
};