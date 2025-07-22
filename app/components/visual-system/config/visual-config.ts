/**
 * Visual System Configuration
 * 統一視覺系統配置中心
 */

export const VISUAL_CONFIG = {
  // WebGL星空背景配置
  starfield: {
    enabled: true,
    density: 200.0,
    brightness: {
      min: 0.4,
      max: 1.4,
    },
    animation: {
      speed: 1.0,
      threshold: 8.0,
      exposure: 200.0,
    },
    fallback: {
      // 低性能設備降級方案
      useCSSAnimation: true,
      particleCount: 50,
    },
  },

  // 玻璃態效果配置
  glassmorphism: {
    // 背景模糊強度
    blur: {
      default: 10, // px
      strong: 20,
      light: 5,
    },
    // 背景透明度
    opacity: {
      default: 0.7,
      strong: 0.85,
      light: 0.5,
    },
    // 邊框效果
    border: {
      width: 1,
      opacity: 0.2,
      color: 'rgba(255, 255, 255, 0.2)',
    },
    // 陰影效果
    shadow: {
      default: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      hover: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
    },
  },

  // 容器邊框效果預設
  containerBorders: {
    none: {
      border: 'none',
    },
    subtle: {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
    },
    glow: {
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
    },
    gradient: {
      border: '1px solid transparent',
      borderRadius: '16px',
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
    },
  },

  // 底部導航欄配置
  bottomNav: {
    // 顯示規則
    visibility: {
      // 不顯示導航欄的路徑
      hiddenPaths: [
        '/main-login',
        '/main-login/register',
        '/main-login/reset',
        '/main-login/change',
        '/new-password',
        '/change-password',
      ],
      // 總是顯示導航欄的路徑（優先級高於hiddenPaths）
      alwaysShowPaths: ['/admin'],
    },
    // 動畫配置
    animation: {
      duration: 300, // ms
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // 樣式配置
    style: {
      height: 64,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },

  // 過渡動畫配置
  transitions: {
    page: {
      duration: 300,
      easing: 'ease-in-out',
    },
    element: {
      duration: 200,
      easing: 'ease-out',
    },
  },

  // 性能配置
  performance: {
    // 是否啟用性能監控
    monitoring: true,
    // FPS目標
    targetFPS: 60,
    // 最低可接受FPS
    minFPS: 30,
    // 是否在開發環境顯示性能指標
    showMetricsInDev: true,
  },

  // 可訪問性配置
  accessibility: {
    // 是否支援減少動畫
    respectPrefersReducedMotion: true,
    // 高對比度模式調整
    highContrastAdjustments: true,
  },
} as const;

// 類型導出
export type VisualConfig = typeof VISUAL_CONFIG;
export type GlassmorphismVariant = 'default' | 'strong' | 'light';
export type ContainerBorderVariant = keyof typeof VISUAL_CONFIG.containerBorders;