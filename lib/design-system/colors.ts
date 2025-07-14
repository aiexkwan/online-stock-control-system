/**
 * Unified Color System
 * 統一色彩系統 - 基於 NewPennine 品牌指南
 */

/**
 * Brand Colors
 * 品牌主色調
 */
export const brandColors = {
  primary: {
    50: '#fff7ed',    // 最淺
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',   // 主色 - 橙色
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',   // 最深
  },
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',   // 次要色 - 藍色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
} as const;

/**
 * Semantic Colors
 * 語義色彩 - 用於特定功能
 */
export const semanticColors = {
  success: {
    light: '#22c55e',   // 成功 - 綠色
    DEFAULT: '#16a34a',
    dark: '#15803d',
    bg: '#dcfce7',
    border: '#86efac',
  },
  warning: {
    light: '#facc15',   // 警告 - 黃色
    DEFAULT: '#eab308',
    dark: '#ca8a04',
    bg: '#fef3c7',
    border: '#fde047',
  },
  error: {
    light: '#f87171',   // 錯誤 - 紅色
    DEFAULT: '#ef4444',
    dark: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
  },
  info: {
    light: '#60a5fa',   // 信息 - 藍色
    DEFAULT: '#3b82f6',
    dark: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
} as const;

/**
 * Neutral Colors
 * 中性色 - 用於文字和背景
 */
export const neutralColors = {
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // 深色模式專用
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
} as const;

/**
 * Widget Category Colors
 * Widget 分類色彩 - 統一各類 Widget 的配色
 */
export const widgetColors = {
  stats: {
    gradient: 'from-blue-500 to-cyan-500',
    icon: brandColors.secondary[500],
    text: brandColors.secondary[600],
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  lists: {
    gradient: 'from-purple-500 to-pink-500',
    icon: '#a855f7',
    text: '#9333ea',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  uploads: {
    gradient: 'from-green-500 to-emerald-500',
    icon: semanticColors.success.DEFAULT,
    text: semanticColors.success.dark,
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  reports: {
    gradient: 'from-orange-500 to-red-500',
    icon: brandColors.primary[500],
    text: brandColors.primary[600],
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  charts: {
    gradient: 'from-indigo-500 to-purple-500',
    icon: '#6366f1',
    text: '#4f46e5',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  operations: {
    gradient: 'from-yellow-500 to-orange-500',
    icon: semanticColors.warning.DEFAULT,
    text: semanticColors.warning.dark,
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
} as const;

/**
 * Chart Colors
 * 圖表配色方案 - 用於數據可視化
 */
export const chartColors = {
  primary: [
    brandColors.primary[500],
    brandColors.secondary[500],
    '#22c55e',
    '#a855f7',
    '#facc15',
    '#f87171',
  ],
  extended: [
    '#f97316', // orange-500
    '#0ea5e9', // sky-500
    '#22c55e', // green-500
    '#a855f7', // purple-500
    '#facc15', // yellow-400
    '#f87171', // red-400
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
    '#c084fc', // purple-400
    '#fbbf24', // yellow-400
  ],
} as const;

/**
 * Background Patterns
 * 背景模式 - 用於不同場景
 */
export const backgrounds = {
  // 主要背景
  primary: {
    light: neutralColors.white,
    dark: neutralColors.slate[900],
  },
  // 次要背景（卡片等）
  secondary: {
    light: neutralColors.gray[50],
    dark: neutralColors.slate[800],
  },
  // 高亮背景
  elevated: {
    light: neutralColors.white,
    dark: 'rgba(30, 41, 59, 0.5)', // slate-800 with opacity
  },
  // 交互背景
  interactive: {
    hover: {
      light: neutralColors.gray[100],
      dark: neutralColors.slate[700],
    },
    active: {
      light: neutralColors.gray[200],
      dark: neutralColors.slate[600],
    },
  },
} as const;

/**
 * Text Colors
 * 文字顏色 - 確保可讀性
 */
export const textColors = {
  primary: {
    light: neutralColors.gray[900],
    dark: neutralColors.white,
  },
  secondary: {
    light: neutralColors.gray[600],
    dark: neutralColors.slate[300],
  },
  muted: {
    light: neutralColors.gray[500],
    dark: neutralColors.slate[400],
  },
  disabled: {
    light: neutralColors.gray[400],
    dark: neutralColors.slate[500],
  },
} as const;

/**
 * Helper Functions
 * 輔助函數
 */

/**
 * 獲取語義色彩類名
 */
export function getSemanticColorClass(
  type: keyof typeof semanticColors,
  variant: 'bg' | 'text' | 'border' = 'text'
): string {
  const colorMap = {
    bg: {
      success: 'bg-green-500/10',
      warning: 'bg-yellow-500/10',
      error: 'bg-red-500/10',
      info: 'bg-blue-500/10',
    },
    text: {
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      info: 'text-blue-600',
    },
    border: {
      success: 'border-green-500/30',
      warning: 'border-yellow-500/30',
      error: 'border-red-500/30',
      info: 'border-blue-500/30',
    },
  };

  return colorMap[variant][type];
}

/**
 * 獲取 Widget 類別色彩
 */
export function getWidgetCategoryColor(
  category: keyof typeof widgetColors,
  property: keyof typeof widgetColors.stats = 'gradient'
): string {
  return widgetColors[category][property];
}

/**
 * 獲取圖表顏色
 */
export function getChartColor(index: number, extended = false): string {
  const colors = extended ? chartColors.extended : chartColors.primary;
  return colors[index % colors.length];
}

/**
 * CSS Variables
 * CSS 變量定義 - 用於全局樣式
 */
export const cssVariables = `
  :root {
    /* Brand Colors */
    --color-primary: ${brandColors.primary[500]};
    --color-primary-light: ${brandColors.primary[400]};
    --color-primary-dark: ${brandColors.primary[600]};
    --color-secondary: ${brandColors.secondary[500]};
    --color-secondary-light: ${brandColors.secondary[400]};
    --color-secondary-dark: ${brandColors.secondary[600]};
    
    /* Semantic Colors */
    --color-success: ${semanticColors.success.DEFAULT};
    --color-warning: ${semanticColors.warning.DEFAULT};
    --color-error: ${semanticColors.error.DEFAULT};
    --color-info: ${semanticColors.info.DEFAULT};
    
    /* Background Colors */
    --bg-primary: ${backgrounds.primary.light};
    --bg-secondary: ${backgrounds.secondary.light};
    --bg-elevated: ${backgrounds.elevated.light};
    
    /* Text Colors */
    --text-primary: ${textColors.primary.light};
    --text-secondary: ${textColors.secondary.light};
    --text-muted: ${textColors.muted.light};
  }
  
  .dark {
    /* Background Colors */
    --bg-primary: ${backgrounds.primary.dark};
    --bg-secondary: ${backgrounds.secondary.dark};
    --bg-elevated: ${backgrounds.elevated.dark};
    
    /* Text Colors */
    --text-primary: ${textColors.primary.dark};
    --text-secondary: ${textColors.secondary.dark};
    --text-muted: ${textColors.muted.dark};
  }
`;