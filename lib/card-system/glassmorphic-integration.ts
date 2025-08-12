/**
 * Glassmorphic Integration with Card Theme System
 * 玻璃態效果與卡片主題系統整合
 * 
 * Created: 2025-08-12
 * Purpose: Seamless integration of glassmorphic effects with the new card theme system
 */

import { cardThemes } from './theme';

/**
 * 類別特定的玻璃態效果配置
 * 每個卡片類別都有獨特的玻璃態色調
 */
export const glassmorphicThemes = {
  operation: {
    background: 'rgba(6, 182, 212, 0.08)',      // cyan tint
    borderColor: 'rgba(6, 182, 212, 0.2)',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    backdropBlur: '16px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  analysis: {
    background: 'rgba(192, 132, 252, 0.08)',    // purple tint
    borderColor: 'rgba(192, 132, 252, 0.2)',
    glowColor: 'rgba(192, 132, 252, 0.3)',
    backdropBlur: '20px', // 分析類需要更強的背景模糊
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  data: {
    background: 'rgba(52, 211, 153, 0.06)',     // emerald tint (較淡，保持數據清晰)
    borderColor: 'rgba(52, 211, 153, 0.15)',
    glowColor: 'rgba(52, 211, 153, 0.2)',
    backdropBlur: '12px', // 較少模糊，保持數據可讀性
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },
  report: {
    background: 'rgba(249, 115, 22, 0.1)',      // orange tint
    borderColor: 'rgba(249, 115, 22, 0.25)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    backdropBlur: '18px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  },
  chart: {
    background: 'rgba(99, 102, 241, 0.08)',     // indigo tint
    borderColor: 'rgba(99, 102, 241, 0.2)',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    backdropBlur: '24px', // 圖表背景需要最強模糊
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },
  special: {
    background: 'rgba(167, 139, 250, 0.1)',     // violet tint
    borderColor: 'rgba(167, 139, 250, 0.3)',
    glowColor: 'rgba(167, 139, 250, 0.5)',
    backdropBlur: '20px',
    innerGlow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
 * 動態邊框發光效果
 * 根據交互狀態和卡片類別調整
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
            rgba(var(--card-glow-rgb), 0.8), 
            rgba(var(--card-glow-rgb), 0.4), 
            rgba(var(--card-glow-rgb), 0.8)
          );
        }
        25% { 
          background: linear-gradient(135deg, 
            rgba(var(--card-glow-rgb), 0.8), 
            rgba(var(--card-glow-rgb), 0.4), 
            rgba(var(--card-glow-rgb), 0.8)
          );
        }
        50% { 
          background: linear-gradient(225deg, 
            rgba(var(--card-glow-rgb), 0.8), 
            rgba(var(--card-glow-rgb), 0.4), 
            rgba(var(--card-glow-rgb), 0.8)
          );
        }
        75% { 
          background: linear-gradient(315deg, 
            rgba(var(--card-glow-rgb), 0.8), 
            rgba(var(--card-glow-rgb), 0.4), 
            rgba(var(--card-glow-rgb), 0.8)
          );
        }
        100% { 
          background: linear-gradient(45deg, 
            rgba(var(--card-glow-rgb), 0.8), 
            rgba(var(--card-glow-rgb), 0.4), 
            rgba(var(--card-glow-rgb), 0.8)
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
 * 工具函數：獲取優化的玻璃態樣式
 */
export function getOptimizedGlassmorphicStyle(
  cardType: keyof typeof glassmorphicThemes,
  variant: keyof typeof glassmorphicVariants = 'default',
  performanceLevel: keyof typeof performanceOptimizations = 'highPerformance'
) {
  const theme = glassmorphicThemes[cardType];
  const variantConfig = glassmorphicVariants[variant];
  const perfConfig = performanceOptimizations[performanceLevel];

  // 如果是低性能設備，返回簡化樣式
  if (performanceLevel === 'lowPerformance') {
    return {
      backgroundColor: 'fallbackBackground' in perfConfig ? perfConfig.fallbackBackground : 'rgba(0, 0, 0, 0.8)',
      border: `1px solid ${theme.borderColor}`,
      borderRadius: '12px',
      backdropFilter: 'none',
    };
  }

  // 構建完整的玻璃態樣式
  const blur = perfConfig.useBackdropFilter 
    ? `blur(${Math.min(parseInt(variantConfig.blur), parseInt(perfConfig.maxBlurRadius))}px)`
    : 'none';

  return {
    backgroundColor: theme.background,
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    border: `1px solid ${theme.borderColor}`,
    borderRadius: '12px',
    boxShadow: theme.innerGlow,
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
  const cardTheme = cardThemes[cardType];
  
  // 提取 RGB 值用於 CSS 變量
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const accentRgb = hexToRgb(cardTheme.accent);
  
  return {
    '--card-glow-rgb': accentRgb ? `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}` : '99, 102, 241',
    '--card-bg': theme.background,
    '--card-border': theme.borderColor,
    '--card-blur': theme.backdropBlur,
    '--card-inner-glow': theme.innerGlow,
  };
}

const glassmorphicIntegration = {
  themes: glassmorphicThemes,
  variants: glassmorphicVariants,
  borderGlow: dynamicBorderGlow,
  performance: performanceOptimizations,
  getOptimizedStyle: getOptimizedGlassmorphicStyle,
  generateCSSVariables: generateGlassmorphicCSSVariables,
};

export default glassmorphicIntegration;