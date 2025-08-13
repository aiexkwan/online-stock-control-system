/**
 * Glassmorphic Integration with Card Theme System
 * 玻璃態效果與卡片主題系統整合
 * 
 * Created: 2025-08-12
 * Purpose: Seamless integration of glassmorphic effects with the new card theme system
 */

import { cardThemes } from './theme';

/**
 * 純透明玻璃態效果配置
 * 所有卡片類別使用統一的純透明毛玻璃效果，無色彩污染
 */
export const glassmorphicThemes = {
  operation: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'transparent', // 完全透明邊框
    backdropBlur: '16px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowDepth: 'default',
    cornerIndicator: 'circle-left',
    iconStyle: 'filled',
    glowColor: 'rgba(255, 255, 255, 0.4)',
  },
  analysis: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'transparent', // 移除邊框 0.10)',
    backdropBlur: '20px', // 分析類需要更強的背景模糊
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowDepth: 'strong',
    cornerIndicator: 'hexagon-right',
    iconStyle: 'outline',
    glowColor: 'rgba(255, 255, 255, 0.4)',
  },
  data: {
    background: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'transparent', // 移除邊框 0.08)',
    backdropBlur: '12px', // 較少模糊，保持數據可讀性
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    shadowDepth: 'subtle',
    cornerIndicator: 'square-left',
    iconStyle: 'dotted',
    glowColor: 'rgba(255, 255, 255, 0.3)',
  },
  report: {
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'transparent', // 移除邊框 0.12)',
    backdropBlur: '18px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.10)',
    shadowDepth: 'intense',
    cornerIndicator: 'diamond-right',
    iconStyle: 'striped',
    glowColor: 'rgba(255, 255, 255, 0.5)',
  },
  chart: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'transparent', // 移除邊框 0.10)',
    backdropBlur: '24px', // 圖表背景需要最強模糊
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    shadowDepth: 'strong',
    cornerIndicator: 'triangle-left',
    iconStyle: 'segmented',
    glowColor: 'rgba(255, 255, 255, 0.4)',
  },
  special: {
    background: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'transparent', // 移除邊框 0.14)',
    backdropBlur: '20px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    shadowDepth: 'intense',
    cornerIndicator: 'star-right',
    iconStyle: 'gradient',
    glowColor: 'rgba(255, 255, 255, 0.6)',
  },
} as const;

/**
 * 玻璃態效果變體
 * 根據使用場景提供不同強度的效果
 */
export const glassmorphicVariants = {
  subtle: {
    backgroundOpacity: 0.05,
    borderOpacity: 0.1,
    blur: '8px',
    glow: 'none',
  },
  default: {
    backgroundOpacity: 0.08,
    borderOpacity: 0.2,
    blur: '16px',
    glow: 'subtle',
  },
  strong: {
    backgroundOpacity: 0.12,
    borderOpacity: 0.3,
    blur: '24px',
    glow: 'moderate',
  },
  intense: {
    backgroundOpacity: 0.15,
    borderOpacity: 0.4,
    blur: '32px',
    glow: 'strong',
  },
} as const;

/**
 * 陰影深度配置系統
 * 通過不同深度的陰影來區分卡片類型，取代色彩區分
 */
export const shadowDepthSystem = {
  subtle: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.08)',
    hoverShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  default: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.12)',
    hoverShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.16)',
  },
  strong: {
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.16)',
    hoverShadow: '0 12px 32px rgba(0, 0, 0, 0.16), 0 6px 16px rgba(0, 0, 0, 0.20)',
  },
  intense: {
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15), 0 6px 14px rgba(0, 0, 0, 0.20)',
    hoverShadow: '0 16px 40px rgba(0, 0, 0, 0.20), 0 8px 20px rgba(0, 0, 0, 0.24)',
  },
} as const;

/**
 * 角標指示器系統
 * 通過不同形狀和位置的角標來區分卡片類型
 */
export const cornerIndicatorSystem = {
  'circle-left': {
    shape: 'w-3 h-3 rounded-full',
    position: 'top-3 left-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
  },
  'hexagon-right': {
    shape: 'w-3 h-3',
    position: 'top-3 right-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  },
  'square-left': {
    shape: 'w-3 h-3 rounded-sm',
    position: 'top-3 left-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
  },
  'diamond-right': {
    shape: 'w-3 h-3 rotate-45',
    position: 'top-3 right-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
  },
  'triangle-left': {
    shape: 'w-3 h-3',
    position: 'top-3 left-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  },
  'star-right': {
    shape: 'w-3 h-3',
    position: 'top-3 right-3',
    background: 'bg-white/20',
    border: 'border-none', // 移除邊框
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  },
} as const;

/**
 * 圖標樣式系統
 * 通過不同的圖標樣式來進一步區分卡片類型
 */
export const iconStyleSystem = {
  filled: 'fill-current stroke-none',
  outline: 'fill-none stroke-current stroke-2',
  dotted: 'fill-none stroke-current stroke-2 stroke-dasharray-[2,2]',
  striped: 'fill-current stroke-current stroke-1',
  segmented: 'fill-none stroke-current stroke-2 stroke-dasharray-[8,4]',
  gradient: 'fill-current stroke-none opacity-80',
} as const;

/**
 * 動態邊框發光效果 (保留用於特殊交互狀態)
 * 使用純白色發光，不添加任何顏色
 */
export const dynamicBorderGlow = {
  // 基礎發光動畫關鍵幀
  keyframes: {
    breathe: `
      @keyframes cardBreathe {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(var(--card-glow-rgb), 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        50% { 
          box-shadow: 0 0 40px rgba(var(--card-glow-rgb), 0.5),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
      }
    `,
    pulse: `
      @keyframes cardPulse {
        0% { 
          box-shadow: 0 0 0 0 rgba(var(--card-glow-rgb), 0.4);
        }
        70% { 
          box-shadow: 0 0 0 10px rgba(var(--card-glow-rgb), 0);
        }
        100% { 
          box-shadow: 0 0 0 0 rgba(var(--card-glow-rgb), 0);
        }
      }
    `,
    rotate: `
      @keyframes cardRotateGlow {
        0% { 
          background: linear-gradient(45deg, 
            rgba(255, 255, 255, 0.3), 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.3)
          );
        }
        25% { 
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.3), 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.3)
          );
        }
        50% { 
          background: linear-gradient(225deg, 
            rgba(255, 255, 255, 0.3), 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.3)
          );
        }
        75% { 
          background: linear-gradient(315deg, 
            rgba(255, 255, 255, 0.3), 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.3)
          );
        }
        100% { 
          background: linear-gradient(45deg, 
            rgba(255, 255, 255, 0.3), 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.3)
          );
        }
      }
    `,
  },

  // 交互狀態對應的發光效果
  states: {
    idle: {
      animation: 'none',
      intensity: 0.2,
    },
    hover: {
      animation: 'cardBreathe 2s ease-in-out infinite',
      intensity: 0.4,
    },
    active: {
      animation: 'cardPulse 1s ease-out',
      intensity: 0.6,
    },
    focus: {
      animation: 'cardBreathe 1.5s ease-in-out infinite',
      intensity: 0.5,
    },
    loading: {
      animation: 'cardRotateGlow 2s linear infinite',
      intensity: 0.3,
    },
  },
} as const;

/**
 * 性能優化的玻璃態實現
 * 針對不同設備能力提供優化方案
 */
export const performanceOptimizations = {
  // 高性能設備（桌面、高端移動設備）
  highPerformance: {
    useBackdropFilter: true,
    enableAnimations: true,
    useComplexGradients: true,
    maxBlurRadius: '32px',
  },

  // 中等性能設備
  mediumPerformance: {
    useBackdropFilter: true,
    enableAnimations: 'reduced', // 僅基礎動畫
    useComplexGradients: false,
    maxBlurRadius: '16px',
  },

  // 低性能設備
  lowPerformance: {
    useBackdropFilter: false, // 使用簡單背景色替代
    enableAnimations: false,
    useComplexGradients: false,
    maxBlurRadius: '0px',
    fallbackBackground: 'rgba(0, 0, 0, 0.8)',
  },
} as const;

/**
 * 工具函數：獲取優化的純透明玻璃態樣式
 */
export function getOptimizedGlassmorphicStyle(
  cardType: keyof typeof glassmorphicThemes,
  variant: keyof typeof glassmorphicVariants = 'default',
  performanceLevel: keyof typeof performanceOptimizations = 'highPerformance'
) {
  const theme = glassmorphicThemes[cardType];
  const variantConfig = glassmorphicVariants[variant];
  const perfConfig = performanceOptimizations[performanceLevel];
  const shadowConfig = shadowDepthSystem[theme.shadowDepth];

  // 如果是低性能設備，返回簡化樣式
  if (performanceLevel === 'lowPerformance') {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      border: 'none', // 移除邊框
      borderRadius: '12px',
      backdropFilter: 'none',
      boxShadow: shadowConfig.boxShadow,
    };
  }

  // 構建完整的純透明玻璃態樣式
  const blur = perfConfig.useBackdropFilter 
    ? `blur(${Math.min(parseInt(variantConfig.blur), parseInt(perfConfig.maxBlurRadius))}px)`
    : 'none';

  return {
    backgroundColor: theme.background,
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    border: 'none', // 移除邊框
    borderRadius: '12px',
    boxShadow: `${theme.innerGlow}, ${shadowConfig.boxShadow}`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };
}

/**
 * CSS 變量生成器
 * 為動態主題切換生成 CSS 變量
 */
export function generateGlassmorphicCSSVariables(cardType: keyof typeof glassmorphicThemes) {
  const theme = glassmorphicThemes[cardType];
  const shadowConfig = shadowDepthSystem[theme.shadowDepth];
  const cornerConfig = cornerIndicatorSystem[theme.cornerIndicator];
  
  return {
    '--card-glow-rgb': '255, 255, 255', // 統一使用純白色
    '--card-bg': theme.background,
    '--card-border': theme.borderColor,
    '--card-blur': theme.backdropBlur,
    '--card-inner-glow': theme.innerGlow,
    '--card-shadow': shadowConfig.boxShadow,
    '--card-hover-shadow': shadowConfig.hoverShadow,
    '--card-corner-shape': cornerConfig.shape,
    '--card-corner-position': cornerConfig.position,
    '--card-icon-style': iconStyleSystem[theme.iconStyle],
  };
}

const glassmorphicIntegration = {
  themes: glassmorphicThemes,
  variants: glassmorphicVariants,
  shadowDepth: shadowDepthSystem,
  cornerIndicators: cornerIndicatorSystem,
  iconStyles: iconStyleSystem,
  borderGlow: dynamicBorderGlow,
  performance: performanceOptimizations,
  getOptimizedStyle: getOptimizedGlassmorphicStyle,
  generateCSSVariables: generateGlassmorphicCSSVariables,
};

export default glassmorphicIntegration;