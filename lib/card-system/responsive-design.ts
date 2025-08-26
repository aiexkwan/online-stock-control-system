/**
 * Responsive Design System for Cards
 * 卡片響應式設計系統
 *
 * Created: 2025-08-12
 * Purpose: Comprehensive responsive design patterns for all card types
 */

import { cardBreakpoints } from './theme';

/**
 * 響應式佈局配置
 * 定義不同螢幕尺寸下的卡片佈局規則
 */
export const responsiveLayouts = {
  // 網格佈局配置
  grid: {
    mobile: {
      columns: 1,
      gap: '16px',
      padding: '16px',
      maxWidth: '100%',
    },
    tablet: {
      columns: 2,
      gap: '20px',
      padding: '24px',
      maxWidth: '100%',
    },
    desktop: {
      columns: 3,
      gap: '24px',
      padding: '32px',
      maxWidth: '1200px',
    },
    wide: {
      columns: 4,
      gap: '32px',
      padding: '40px',
      maxWidth: '1600px',
    },
  },

  // 卡片尺寸配置
  cardSizes: {
    mobile: {
      minHeight: '200px',
      maxHeight: '400px',
      padding: '16px',
      headerHeight: '60px',
      contentHeight: 'auto',
    },
    tablet: {
      minHeight: '240px',
      maxHeight: '500px',
      padding: '20px',
      headerHeight: '70px',
      contentHeight: 'auto',
    },
    desktop: {
      minHeight: '280px',
      maxHeight: '600px',
      padding: '24px',
      headerHeight: '80px',
      contentHeight: 'auto',
    },
    wide: {
      minHeight: '320px',
      maxHeight: '700px',
      padding: '32px',
      headerHeight: '90px',
      contentHeight: 'auto',
    },
  },

  // 特殊卡片類型的尺寸調整
  specialTypes: {
    chart: {
      mobile: { aspectRatio: '16/9' },
      tablet: { aspectRatio: '4/3' },
      desktop: { aspectRatio: '16/10' },
      wide: { aspectRatio: '21/9' },
    },
    analysis: {
      mobile: { minHeight: '300px' },
      tablet: { minHeight: '400px' },
      desktop: { minHeight: '500px' },
      wide: { minHeight: '600px' },
    },
    operation: {
      mobile: { maxWidth: '100%' },
      tablet: { maxWidth: '400px' },
      desktop: { maxWidth: '350px' },
      wide: { maxWidth: '400px' },
    },
  },
} as const;

/**
 * 響應式文字系統
 * 根據螢幕尺寸調整文字大小和間距
 */
export const responsiveTypography = {
  headings: {
    h1: {
      mobile: { fontSize: '24px', lineHeight: '32px', letterSpacing: '-0.025em' },
      tablet: { fontSize: '30px', lineHeight: '38px', letterSpacing: '-0.025em' },
      desktop: { fontSize: '36px', lineHeight: '44px', letterSpacing: '-0.025em' },
      wide: { fontSize: '42px', lineHeight: '50px', letterSpacing: '-0.025em' },
    },
    h2: {
      mobile: { fontSize: '20px', lineHeight: '28px', letterSpacing: '-0.025em' },
      tablet: { fontSize: '24px', lineHeight: '32px', letterSpacing: '-0.025em' },
      desktop: { fontSize: '30px', lineHeight: '38px', letterSpacing: '-0.025em' },
      wide: { fontSize: '36px', lineHeight: '44px', letterSpacing: '-0.025em' },
    },
    h3: {
      mobile: { fontSize: '18px', lineHeight: '26px', letterSpacing: '-0.025em' },
      tablet: { fontSize: '20px', lineHeight: '28px', letterSpacing: '-0.025em' },
      desktop: { fontSize: '24px', lineHeight: '32px', letterSpacing: '-0.025em' },
      wide: { fontSize: '28px', lineHeight: '36px', letterSpacing: '-0.025em' },
    },
  },

  body: {
    large: {
      mobile: { fontSize: '16px', lineHeight: '24px' },
      tablet: { fontSize: '18px', lineHeight: '28px' },
      desktop: { fontSize: '18px', lineHeight: '28px' },
      wide: { fontSize: '20px', lineHeight: '30px' },
    },
    base: {
      mobile: { fontSize: '14px', lineHeight: '22px' },
      tablet: { fontSize: '16px', lineHeight: '24px' },
      desktop: { fontSize: '16px', lineHeight: '24px' },
      wide: { fontSize: '16px', lineHeight: '24px' },
    },
    small: {
      mobile: { fontSize: '12px', lineHeight: '18px' },
      tablet: { fontSize: '14px', lineHeight: '20px' },
      desktop: { fontSize: '14px', lineHeight: '20px' },
      wide: { fontSize: '14px', lineHeight: '20px' },
    },
  },

  metrics: {
    large: {
      mobile: { fontSize: '28px', lineHeight: '36px', fontWeight: '700' },
      tablet: { fontSize: '32px', lineHeight: '40px', fontWeight: '700' },
      desktop: { fontSize: '36px', lineHeight: '44px', fontWeight: '700' },
      wide: { fontSize: '42px', lineHeight: '50px', fontWeight: '700' },
    },
    base: {
      mobile: { fontSize: '24px', lineHeight: '32px', fontWeight: '600' },
      tablet: { fontSize: '28px', lineHeight: '36px', fontWeight: '600' },
      desktop: { fontSize: '32px', lineHeight: '40px', fontWeight: '600' },
      wide: { fontSize: '36px', lineHeight: '44px', fontWeight: '600' },
    },
  },
} as const;

/**
 * 圖表響應式配置
 * 針對不同卡片中的圖表組件
 */
export const responsiveCharts = {
  // 圖表容器尺寸
  containers: {
    mobile: {
      height: '200px',
      margins: { top: 10, right: 10, bottom: 30, left: 40 },
      showLegend: false,
      showAxesLabels: false,
      maxDataPoints: 10,
    },
    tablet: {
      height: '300px',
      margins: { top: 15, right: 15, bottom: 40, left: 50 },
      showLegend: true,
      showAxesLabels: true,
      maxDataPoints: 20,
    },
    desktop: {
      height: '400px',
      margins: { top: 20, right: 20, bottom: 50, left: 60 },
      showLegend: true,
      showAxesLabels: true,
      maxDataPoints: 50,
    },
    wide: {
      height: '500px',
      margins: { top: 25, right: 25, bottom: 60, left: 70 },
      showLegend: true,
      showAxesLabels: true,
      maxDataPoints: 100,
    },
  },

  // 圖表元素大小調整
  elements: {
    mobile: {
      strokeWidth: 1.5,
      pointRadius: 2,
      fontSize: 10,
      legendItemSpacing: 8,
    },
    tablet: {
      strokeWidth: 2,
      pointRadius: 3,
      fontSize: 12,
      legendItemSpacing: 10,
    },
    desktop: {
      strokeWidth: 2.5,
      pointRadius: 4,
      fontSize: 14,
      legendItemSpacing: 12,
    },
    wide: {
      strokeWidth: 3,
      pointRadius: 5,
      fontSize: 16,
      legendItemSpacing: 15,
    },
  },

  // 特定圖表類型的響應式規則
  chartTypes: {
    line: {
      mobile: {
        simplifyPath: true,
        reduceDataPoints: true,
        hideMinorGridLines: true,
      },
      tablet: {
        simplifyPath: false,
        reduceDataPoints: false,
        hideMinorGridLines: false,
      },
      desktop: {
        simplifyPath: false,
        reduceDataPoints: false,
        hideMinorGridLines: false,
      },
    },
    bar: {
      mobile: {
        barThickness: 'auto',
        maxBars: 8,
        stackedLayout: true,
      },
      tablet: {
        barThickness: 'auto',
        maxBars: 12,
        stackedLayout: false,
      },
      desktop: {
        barThickness: 'auto',
        maxBars: 20,
        stackedLayout: false,
      },
    },
    pie: {
      mobile: {
        showLabels: false,
        innerRadius: 0.3,
        outerRadius: 0.8,
      },
      tablet: {
        showLabels: true,
        innerRadius: 0.4,
        outerRadius: 0.9,
      },
      desktop: {
        showLabels: true,
        innerRadius: 0.5,
        outerRadius: 1.0,
      },
    },
  },
} as const;

/**
 * 交互響應式配置
 * 根據設備類型調整交互行為
 */
export const responsiveInteractions = {
  // 觸控設備優化
  touch: {
    minTouchTarget: '44px',
    tapHighlight: 'transparent',
    userSelect: 'none',
    touchAction: 'manipulation',
    // 增大點擊區域
    expandedHitArea: '8px',
  },

  // 鼠標設備優化
  mouse: {
    hoverEffects: true,
    cursorPointer: true,
    rightClickMenu: true,
    keyboardNavigation: true,
  },

  // 手勢支援
  gestures: {
    mobile: {
      swipeToRefresh: true,
      pinchToZoom: false, // 卡片內容不支援縮放
      longPressMenu: true,
    },
    tablet: {
      swipeToRefresh: true,
      pinchToZoom: true, // 平板支援圖表縮放
      longPressMenu: true,
      twoFingerScroll: true,
    },
  },
} as const;

/**
 * 自適應內容策略
 * 根據可用空間動態調整內容顯示
 */
export const adaptiveContent = {
  // 內容優先級
  contentPriority: {
    essential: ['title', 'primaryMetric', 'status'],
    important: ['subtitle', 'secondaryMetrics', 'actions'],
    optional: ['description', 'metadata', 'timestamps'],
    decorative: ['animations', 'gradients', 'shadowEffects'],
  },

  // 內容摺疊規則
  collapsing: {
    mobile: {
      hideOptional: true,
      hideDecorative: true,
      collapseLongText: true,
      maxTextLines: 2,
    },
    tablet: {
      hideOptional: false,
      hideDecorative: false,
      collapseLongText: true,
      maxTextLines: 3,
    },
    desktop: {
      hideOptional: false,
      hideDecorative: false,
      collapseLongText: false,
      maxTextLines: 'unlimited',
    },
  },

  // 動態佈局調整
  dynamicLayout: {
    stackingBreakpoint: '768px', // 小於此寬度時垂直排列
    horizontalScrollThreshold: '640px', // 啟用水平滾動的閾值
    gridCollapsePoint: '480px', // 網格摺疊為單列的點
  },
} as const;

/**
 * 效能優化的響應式規則
 * 根據設備能力調整視覺效果
 */
export const performanceResponsive = {
  // 低效能設備檢測
  lowPerformanceIndicators: [
    'connection.effectiveType === "slow-2g"',
    'connection.effectiveType === "2g"',
    'navigator.hardwareConcurrency < 4',
    'navigator.deviceMemory < 4',
  ],

  // 效能優化策略
  optimizations: {
    lowPerformance: {
      disableAnimations: true,
      reduceBlurEffects: true,
      simplifyGradients: true,
      lowerFrameRate: true,
      enableVirtualization: true,
    },
    mediumPerformance: {
      disableAnimations: false,
      reduceBlurEffects: false,
      simplifyGradients: false,
      lowerFrameRate: false,
      enableVirtualization: false,
    },
    highPerformance: {
      disableAnimations: false,
      reduceBlurEffects: false,
      simplifyGradients: false,
      lowerFrameRate: false,
      enableVirtualization: false,
    },
  },
} as const;

/**
 * 響應式工具函數
 */
export const responsiveUtils = {
  // 獲取當前螢幕尺寸類別
  getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1280) return 'desktop';
    return 'wide';
  },

  // 檢測是否為觸控設備
  isTouchDevice(): boolean {
    return (
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  },

  // 獲取設備效能等級
  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    if (typeof navigator === 'undefined') return 'medium';

    interface NavigatorExtended extends Navigator {
      deviceMemory?: number;
      connection?: {
        effectiveType?: string;
      };
    }

    const nav = navigator as NavigatorExtended;
    const { hardwareConcurrency, deviceMemory } = nav;
    const connection = nav.connection;

    // 簡化的效能檢測邏輯
    if (
      hardwareConcurrency < 4 ||
      (deviceMemory !== undefined && deviceMemory < 4) ||
      (connection &&
        connection.effectiveType &&
        ['slow-2g', '2g'].includes(connection.effectiveType))
    ) {
      return 'low';
    }

    if (hardwareConcurrency >= 8 && deviceMemory !== undefined && deviceMemory >= 8) {
      return 'high';
    }

    return 'medium';
  },

  // 動態生成響應式 CSS 類
  generateResponsiveClasses(baseClass: string, variations: Record<string, string>): string {
    const breakpoint = this.getCurrentBreakpoint();
    return `${baseClass} ${variations[breakpoint] || variations.desktop || ''}`;
  },
};

const responsiveDesign = {
  layouts: responsiveLayouts,
  typography: responsiveTypography,
  charts: responsiveCharts,
  interactions: responsiveInteractions,
  content: adaptiveContent,
  performance: performanceResponsive,
  utils: responsiveUtils,
};

export default responsiveDesign;
