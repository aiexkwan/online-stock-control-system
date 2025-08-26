/**
 * Visual Design Guidelines for Card System
 * 卡片系統視覺設計指南 - 確保所有6個類別的一致性
 *
 * Created: 2025-08-12
 * Purpose: Unified visual language across all card categories
 */

export const cardVisualGuidelines = {
  /**
   * 卡片類別視覺標識
   * 每個類別有獨特但一致的視覺語言
   */
  categoryIdentifiers: {
    operation: {
      iconStyle: 'filled', // 實心圖標突出操作性
      cornerRadius: '12px', // 較圓潤，友好感
      shadowIntensity: 'medium',
      glowEffect: 'subtle',
      visualWeight: 'bold', // 突出操作重要性
    },
    analysis: {
      iconStyle: 'outlined', // 線條圖標，理性感
      cornerRadius: '8px', // 較尖銳，專業感
      shadowIntensity: 'strong',
      glowEffect: 'moderate',
      visualWeight: 'medium',
    },
    data: {
      iconStyle: 'outlined',
      cornerRadius: '6px', // 最尖銳，數據感
      shadowIntensity: 'light',
      glowEffect: 'none',
      visualWeight: 'light', // 簡潔乾淨
    },
    report: {
      iconStyle: 'filled',
      cornerRadius: '10px',
      shadowIntensity: 'medium',
      glowEffect: 'strong', // 突出重要報表
      visualWeight: 'medium',
    },
    chart: {
      iconStyle: 'dual-tone', // 雙色調，層次感
      cornerRadius: '8px',
      shadowIntensity: 'strong',
      glowEffect: 'data-driven', // 根據數據動態調整
      visualWeight: 'medium',
    },
    special: {
      iconStyle: 'custom', // 自定義樣式
      cornerRadius: '16px', // 最圓潤，特殊感
      shadowIntensity: 'dynamic',
      glowEffect: 'animated', // 動態發光
      visualWeight: 'bold',
    },
  },

  /**
   * 層次結構設計
   * Z-index 和視覺層次管理
   */
  hierarchy: {
    background: {
      zIndex: 0,
      opacity: 0.4,
    },
    card: {
      zIndex: 10,
      opacity: 0.9,
    },
    content: {
      zIndex: 20,
      opacity: 1,
    },
    modal: {
      zIndex: 1000,
      opacity: 0.95,
    },
    tooltip: {
      zIndex: 1100,
      opacity: 0.98,
    },
  },

  /**
   * 間距系統
   * 保持視覺韻律的一致性
   */
  spacing: {
    micro: '2px', // 細微調整
    tiny: '4px', // 圖標與文字間距
    small: '8px', // 組件內部間距
    base: '16px', // 標準間距
    large: '24px', // 區塊間距
    huge: '32px', // 卡片間距
    massive: '48px', // 頁面級間距
  },

  /**
   * 陰影系統
   * 創造深度和層次感
   */
  shadows: {
    none: 'none',
    light: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    strong: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    dynamic: 'var(--card-dynamic-shadow)', // 根據交互狀態變化
  },

  /**
   * 發光效果系統
   * 增強玻璃態美學
   */
  glowEffects: {
    none: 'none',
    subtle: '0 0 20px rgba(var(--card-accent-rgb), 0.1)',
    moderate: '0 0 30px rgba(var(--card-accent-rgb), 0.2)',
    strong: '0 0 40px rgba(var(--card-accent-rgb), 0.3)',
    animated: {
      keyframes: 'cardGlow',
      duration: '3s',
      timing: 'ease-in-out',
      iteration: 'infinite',
      direction: 'alternate',
    },
  },
} as const;

/**
 * 響應式視覺調整
 * 根據螢幕尺寸調整視覺密度
 */
export const responsiveVisualAdjustments = {
  mobile: {
    // 減少視覺複雜度
    cornerRadius: '8px', // 統一較小圓角
    shadowIntensity: 'light', // 減少陰影
    glowEffect: 'none', // 關閉發光效果節省性能
    spacing: 'compact', // 緊湊間距
  },
  tablet: {
    cornerRadius: 'category-default', // 使用類別預設
    shadowIntensity: 'medium',
    glowEffect: 'subtle',
    spacing: 'comfortable',
  },
  desktop: {
    cornerRadius: 'category-default',
    shadowIntensity: 'category-default',
    glowEffect: 'category-default',
    spacing: 'spacious',
  },
} as const;

/**
 * 動畫一致性規則
 * 確保所有卡片動畫和諧統一
 */
export const animationConsistency = {
  // 基礎動畫時長
  durations: {
    instant: '0.1s', // 點擊反饋
    quick: '0.2s', // Hover 效果
    normal: '0.3s', // 標準過渡
    slow: '0.5s', // 載入狀態
    ambient: '3s', // 環境動畫
  },

  // 緩動函數
  easings: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // 動畫編排
  orchestration: {
    stagger: '0.05s', // 多個元素依序出現的間隔
    cascade: '0.1s', // 層級動畫間隔
    parallel: '0s', // 同步動畫
  },
} as const;

/**
 * 無障礙設計考量
 * 確保所有用戶都能良好使用
 */
export const accessibilityGuidelines = {
  // 顏色對比度最低要求
  contrastRatios: {
    normalText: 4.5, // WCAG AA 標準
    largeText: 3.0, // 18pt+ 或 14pt+ bold
    uiComponents: 3.0, // 圖形和 UI 元素
    focus: 3.0, // 焦點指示器
  },

  // 互動區域最小尺寸
  touchTargets: {
    minimum: '44px', // WCAG AAA 標準
    recommended: '48px', // Material Design 建議
    comfortable: '56px', // 舒適操作尺寸
  },

  // 動畫無障礙
  motionAccessibility: {
    respectsPrefersReducedMotion: true,
    providesAlternativeIndicators: true, // 為動畫提供非動畫替代方案
    maintainsCoreFunction: true, // 關閉動畫不影響核心功能
  },
} as const;

const visualGuidelines = {
  visual: cardVisualGuidelines,
  responsive: responsiveVisualAdjustments,
  animation: animationConsistency,
  accessibility: accessibilityGuidelines,
};

export default visualGuidelines;
