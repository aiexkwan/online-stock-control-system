/**
 * Unified Typography System
 * 統一字體系統 - 確保整個應用的文字一致性
 */

/**
 * Font Families
 * 字體族群
 */
export const fontFamilies = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),

  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Consolas',
    'Monaco',
    'Andale Mono',
    'Ubuntu Mono',
    'monospace',
  ].join(', '),

  display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(', '),
} as const;

/**
 * Font Sizes
 * 字體大小 - 基於 Tailwind 的 scale
 */
export const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
} as const;

/**
 * Line Heights
 * 行高
 */
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

/**
 * Font Weights
 * 字重
 */
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * Letter Spacing
 * 字間距
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Typography Presets
 * 預設排版樣式 - 用於不同場景
 */
export const typography = {
  // 標題
  heading: {
    h1: {
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamilies.display,
    },
    h2: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight,
      fontFamily: fontFamilies.display,
    },
    h3: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      fontFamily: fontFamilies.display,
    },
    h4: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      fontFamily: fontFamilies.display,
    },
    h5: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      fontFamily: fontFamilies.display,
    },
    h6: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      fontFamily: fontFamilies.display,
    },
  },

  // 正文
  body: {
    large: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
    },
    base: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
    },
    small: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
    },
  },

  // 標籤和按鈕
  label: {
    large: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.wide,
    },
    base: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.wide,
    },
    small: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.tight,
    },
  },

  // 代碼
  code: {
    inline: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      fontFamily: fontFamilies.mono,
    },
    block: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.relaxed,
      fontFamily: fontFamilies.mono,
    },
  },

  // Widget 特定樣式
  widget: {
    title: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
    },
    subtitle: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
    },
    metric: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
    },
    caption: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.normal,
      lineHeight: lineHeights.normal,
    },
  },
} as const;

/**
 * Tailwind Class Mappings
 * Tailwind 類名映射
 */
export const textClasses = {
  // 標題類
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-semibold leading-tight tracking-tight',
  h3: 'text-2xl font-semibold leading-snug',
  h4: 'text-xl font-semibold leading-snug',
  h5: 'text-lg font-medium leading-normal',
  h6: 'text-base font-medium leading-normal',

  // 正文類
  'body-large': 'text-lg font-normal leading-relaxed',
  'body-medium': 'text-base font-medium leading-normal',
  'body-base': 'text-base font-normal leading-normal',
  'body-small': 'text-sm font-normal leading-normal',

  // 標籤類
  'label-large': 'text-sm font-medium leading-tight tracking-wide',
  'label-medium': 'text-sm font-normal leading-tight tracking-wide',
  'label-base': 'text-xs font-medium leading-tight tracking-wide',
  'label-small': 'text-xs font-normal leading-tight',

  // Widget 類
  'widget-title': 'text-lg font-semibold leading-tight',
  'widget-subtitle': 'text-sm font-normal leading-normal text-gray-400',
  'widget-metric': 'text-2xl font-bold leading-tight',
  'widget-caption': 'text-xs font-normal leading-normal text-gray-500',

  // 特殊類
  'code-inline': 'text-sm font-mono',
  'code-block': 'text-sm font-mono leading-relaxed',
  uppercase: 'uppercase tracking-wider',
  truncate: 'truncate',
} as { [key: string]: string };

/**
 * Helper Functions
 * 輔助函數
 */

/**
 * 獲取字體樣式對象
 */
export function getTypographyStyle(
  category: keyof typeof typography,
  variant: string
): React.CSSProperties {
  const styles = (typography[category] as Record<string, React.CSSProperties>)?.[variant];
  if (!styles) {
    console.warn(`Typography style not found: ${category}.${variant}`);
    return {};
  }
  return styles;
}

/**
 * 獲取 Tailwind 文字類名
 */
export function getTextClass(preset: keyof typeof textClasses): string {
  return textClasses[preset] || '';
}

/**
 * 組合多個文字類名
 */
export function combineTextClasses(...classes: (keyof typeof textClasses)[]): string {
  return classes
    .map(cls => textClasses[cls])
    .filter(Boolean)
    .join(' ');
}

/**
 * CSS Variables
 * CSS 變量定義
 */
export const typographyCssVariables = `
  :root {
    /* Font Families */
    --font-sans: ${fontFamilies.sans};
    --font-mono: ${fontFamilies.mono};
    --font-display: ${fontFamilies.display};

    /* Font Sizes */
    --text-xs: ${fontSizes.xs};
    --text-sm: ${fontSizes.sm};
    --text-base: ${fontSizes.base};
    --text-lg: ${fontSizes.lg};
    --text-xl: ${fontSizes.xl};
    --text-2xl: ${fontSizes['2xl']};
    --text-3xl: ${fontSizes['3xl']};
    --text-4xl: ${fontSizes['4xl']};

    /* Line Heights */
    --leading-tight: ${lineHeights.tight};
    --leading-snug: ${lineHeights.snug};
    --leading-normal: ${lineHeights.normal};
    --leading-relaxed: ${lineHeights.relaxed};
    --leading-loose: ${lineHeights.loose};
  }
`;

/**
 * Font Import Statements
 * 字體導入語句 - 用於 <head> 或 CSS
 */
export const fontImports = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
`;
