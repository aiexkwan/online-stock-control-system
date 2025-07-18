/**
 * Unified Spacing System
 * 統一間距系統 - 基於 8px 網格系統
 */

/**
 * Base Unit
 * 基礎單位 - 8px
 */
export const BASE_UNIT = 8;

/**
 * Spacing Scale
 * 間距比例 - 基於 Tailwind 的設計
 */
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  1.5: '0.375rem',    // 6px
  2: '0.5rem',        // 8px - 基礎單位
  2.5: '0.625rem',    // 10px
  3: '0.75rem',       // 12px
  3.5: '0.875rem',    // 14px
  4: '1rem',          // 16px - 2x 基礎單位
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px - 3x 基礎單位
  7: '1.75rem',       // 28px
  8: '2rem',          // 32px - 4x 基礎單位
  9: '2.25rem',       // 36px
  10: '2.5rem',       // 40px - 5x 基礎單位
  11: '2.75rem',      // 44px
  12: '3rem',         // 48px - 6x 基礎單位
  14: '3.5rem',       // 56px
  16: '4rem',         // 64px - 8x 基礎單位
  20: '5rem',         // 80px
  24: '6rem',         // 96px
  28: '7rem',         // 112px
  32: '8rem',         // 128px
  36: '9rem',         // 144px
  40: '10rem',        // 160px
  44: '11rem',        // 176px
  48: '12rem',        // 192px
  52: '13rem',        // 208px
  56: '14rem',        // 224px
  60: '15rem',        // 240px
  64: '16rem',        // 256px
  72: '18rem',        // 288px
  80: '20rem',        // 320px
  96: '24rem',        // 384px
  
  // 語義化間距
  small: '0.5rem',    // 8px
  medium: '1rem',     // 16px
  large: '1.5rem',    // 24px
  
  // Gap values for flexbox and grid
  gap: {
    0: '0px',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
    
    // 語義化間距
    small: '0.5rem',    // 8px
    medium: '1rem',     // 16px
    large: '1.5rem',    // 24px
  },
} as const;

/**
 * Component Spacing
 * 組件間距 - 用於統一組件內部間距
 */
export const componentSpacing = {
  // 內邊距
  padding: {
    xs: spacing[2],     // 8px
    sm: spacing[3],     // 12px
    base: spacing[4],   // 16px
    md: spacing[5],     // 20px
    lg: spacing[6],     // 24px
    xl: spacing[8],     // 32px
  },
  
  // 外邊距
  margin: {
    xs: spacing[1],     // 4px
    sm: spacing[2],     // 8px
    base: spacing[4],   // 16px
    md: spacing[6],     // 24px
    lg: spacing[8],     // 32px
    xl: spacing[12],    // 48px
  },
  
  // 間隙
  gap: {
    xs: spacing[1],     // 4px
    sm: spacing[2],     // 8px
    base: spacing[3],   // 12px
    md: spacing[4],     // 16px
    lg: spacing[6],     // 24px
    xl: spacing[8],     // 32px
  },
} as const;

/**
 * Widget Spacing
 * Widget 間距規範
 */
export const widgetSpacing = {
  // Widget 內部內邊距
  containerPadding: spacing[4],        // 16px
  
  // Widget 容器內邊距（用於統一 Widget 內部間距）
  container: 'p-4',                    // 16px - Tailwind 類名
  
  // Widget 標題與內容間距
  headerGap: spacing[4],               // 16px
  
  // Widget 之間的間距
  betweenWidgets: spacing[4],          // 16px
  
  // 卡片內部間距
  card: {
    padding: spacing[4],               // 16px
    paddingCompact: spacing[3],        // 12px
    paddingLarge: spacing[6],          // 24px
  },
  
  // 列表項間距
  listItem: {
    gap: spacing[2],                   // 8px
    paddingY: spacing[2],              // 8px
    paddingX: spacing[3],              // 12px
  },
  
  // 表單元素間距
  form: {
    fieldGap: spacing[4],              // 16px
    labelGap: spacing[2],              // 8px
    groupGap: spacing[6],              // 24px
  },
} as const;

/**
 * Layout Spacing
 * 佈局間距 - 用於頁面級別的間距
 */
export const layoutSpacing = {
  // 頁面內邊距
  page: {
    mobile: spacing[4],                // 16px
    tablet: spacing[6],                // 24px
    desktop: spacing[8],               // 32px
  },
  
  // 區域間距
  section: {
    gap: spacing[8],                   // 32px
    gapLarge: spacing[12],             // 48px
  },
  
  // 網格間距
  grid: {
    gap: spacing[4],                   // 16px
    gapCompact: spacing[2],            // 8px
    gapLarge: spacing[6],              // 24px
  },
  
  // 側邊欄
  sidebar: {
    width: '16rem',                    // 256px
    collapsedWidth: '4rem',            // 64px
    gap: spacing[4],                   // 16px
  },
} as const;

/**
 * Border Radius
 * 圓角半徑 - 統一圓角設計
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  base: '0.25rem',    // 4px
  md: '0.375rem',     // 6px
  lg: '0.5rem',       // 8px
  xl: '0.75rem',      // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

/**
 * Breakpoints
 * 響應式斷點
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Z-Index Scale
 * 層級系統
 */
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
} as const;

/**
 * Helper Functions
 * 輔助函數
 */

/**
 * 獲取間距值
 */
export function getSpacing(value: keyof typeof spacing): string {
  const result = spacing[value];
  // If it's the gap object, return a default
  if (typeof result === 'object') {
    return '0px';
  }
  return result;
}

/**
 * 獲取組件間距
 */
export function getComponentSpacing(
  type: keyof typeof componentSpacing,
  size: string
): string {
  return (componentSpacing[type] as any)?.[size] || spacing[4];
}

/**
 * 計算基於網格的間距
 */
export function calculateGridSpacing(units: number): string {
  return `${units * BASE_UNIT}px`;
}

/**
 * 獲取響應式間距類
 */
export function getResponsiveSpacing(
  mobile: keyof typeof spacing,
  tablet?: keyof typeof spacing,
  desktop?: keyof typeof spacing
): string {
  const classes = [`p-${mobile}`];
  if (tablet) classes.push(`md:p-${tablet}`);
  if (desktop) classes.push(`lg:p-${desktop}`);
  return classes.join(' ');
}

/**
 * CSS Variables
 * CSS 變量定義
 */
export const spacingCssVariables = `
  :root {
    /* Base Unit */
    --spacing-unit: ${BASE_UNIT}px;
    
    /* Common Spacings */
    --spacing-xs: ${spacing[2]};
    --spacing-sm: ${spacing[3]};
    --spacing-base: ${spacing[4]};
    --spacing-md: ${spacing[6]};
    --spacing-lg: ${spacing[8]};
    --spacing-xl: ${spacing[12]};
    
    /* Component Spacings */
    --padding-xs: ${componentSpacing.padding.xs};
    --padding-sm: ${componentSpacing.padding.sm};
    --padding-base: ${componentSpacing.padding.base};
    --padding-lg: ${componentSpacing.padding.lg};
    
    /* Border Radius */
    --radius-sm: ${borderRadius.sm};
    --radius-base: ${borderRadius.base};
    --radius-md: ${borderRadius.md};
    --radius-lg: ${borderRadius.lg};
    --radius-xl: ${borderRadius.xl};
    
    /* Widget Specific */
    --widget-padding: ${widgetSpacing.containerPadding};
    --widget-gap: ${widgetSpacing.headerGap};
    --widget-spacing: ${widgetSpacing.betweenWidgets};
  }
`;

/**
 * Spacing Utilities
 * 間距工具類 - 用於快速應用間距
 */
export const spacingUtilities = {
  // 容器類
  container: {
    base: 'px-4 md:px-6 lg:px-8',
    compact: 'px-3 md:px-4 lg:px-6',
    wide: 'px-6 md:px-8 lg:px-12',
  } as { [key: string]: string },
  
  // Widget 類
  widget: {
    container: 'p-4',
    header: 'mb-4',
    content: 'space-y-4',
  },
  
  // 表單類
  form: {
    group: 'space-y-4',
    field: 'space-y-2',
    inline: 'flex items-center gap-3',
  },
  
  // 列表類
  list: {
    container: 'space-y-2',
    item: 'py-2 px-3',
    compact: 'space-y-1',
  },
  
  // 網格類
  grid: {
    base: 'grid gap-4',
    compact: 'grid gap-2',
    wide: 'grid gap-6',
  },
  
  // Margin 類
  margin: {
    // 全方向 margin
    none: 'm-0',
    xs: 'm-1',
    sm: 'm-2',
    base: 'm-4',
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-12',
    
    // 頂部 margin
    top: {
      none: 'mt-0',
      xs: 'mt-1',
      sm: 'mt-2',
      base: 'mt-4',
      md: 'mt-6',
      lg: 'mt-8',
      xl: 'mt-12',
    },
    
    // 右側 margin
    right: {
      none: 'mr-0',
      xs: 'mr-1',
      sm: 'mr-2',
      base: 'mr-4',
      md: 'mr-6',
      lg: 'mr-8',
      xl: 'mr-12',
    },
    
    // 底部 margin
    bottom: {
      none: 'mb-0',
      xs: 'mb-1',
      sm: 'mb-2',
      base: 'mb-4',
      md: 'mb-6',
      lg: 'mb-8',
      xl: 'mb-12',
      medium: 'mb-4', // 兼容現有代碼
    },
    
    // 左側 margin
    left: {
      none: 'ml-0',
      xs: 'ml-1',
      sm: 'ml-2',
      base: 'ml-4',
      md: 'ml-6',
      lg: 'ml-8',
      xl: 'ml-12',
    },
    
    // 橫向 margin
    horizontal: {
      none: 'mx-0',
      xs: 'mx-1',
      sm: 'mx-2',
      base: 'mx-4',
      md: 'mx-6',
      lg: 'mx-8',
      xl: 'mx-12',
    },
    
    // 縱向 margin
    vertical: {
      none: 'my-0',
      xs: 'my-1',
      sm: 'my-2',
      base: 'my-4',
      md: 'my-6',
      lg: 'my-8',
      xl: 'my-12',
    },
  },
} as const;