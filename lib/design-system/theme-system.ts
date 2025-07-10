// Unified Theme System - NewPennine 統一主題系統
// 整合 Admin 同 Main App 嘅主題配置

import { designTokens } from './tokens';

export interface ThemeConfig {
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  effects: ThemeEffects;
  typography: ThemeTypography;
}

interface ThemeColors {
  // 背景層級
  background: {
    primary: string; // 主背景
    secondary: string; // 次要背景（卡片、面板）
    tertiary: string; // 第三層背景
    overlay: string; // 遮罩層
  };

  // 前景顏色
  foreground: {
    primary: string; // 主要文字
    secondary: string; // 次要文字
    muted: string; // 輔助文字
    inverted: string; // 反色文字
  };

  // 邊框顏色
  border: {
    default: string;
    muted: string;
    strong: string;
  };

  // 功能色彩
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // 語義化顏色（繼承自 design tokens）
  semantic: typeof designTokens.colors.semantic;
}

interface ThemeEffects {
  // 發光效果
  glow: {
    enabled: boolean;
    colors: Record<string, string>;
    intensity: 'subtle' | 'moderate' | 'strong';
  };

  // 玻璃擬態
  glassmorphism: {
    enabled: boolean;
    blur: string;
    opacity: number;
  };

  // 動畫
  animations: {
    enabled: boolean;
    duration: 'fast' | 'normal' | 'slow';
    easing: string;
  };

  // 特殊效果
  special: {
    starfield?: boolean;
    particles?: boolean;
    gradients?: boolean;
  };
}

interface ThemeTypography {
  // 字體配置
  fonts: {
    sans: string;
    mono: string;
    display?: string;
  };

  // 字重映射
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

// 基礎深色主題（共享配置）
const baseDarkTheme: Partial<ThemeConfig> = {
  mode: 'dark',
  colors: {
    background: {
      primary: '#000000',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },
    foreground: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      muted: '#999999',
      inverted: '#000000',
    },
    border: {
      default: '#333333',
      muted: '#222222',
      strong: '#555555',
    },
    accent: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      tertiary: '#ec4899',
    },
    semantic: designTokens.colors.semantic,
  },
  typography: {
    fonts: {
      sans: designTokens.typography.fontFamily.sans.join(', '),
      mono: designTokens.typography.fontFamily.mono.join(', '),
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

// Main App 主題
export const mainTheme: ThemeConfig = {
  name: 'main',
  mode: 'dark',
  colors: {
    background: {
      primary: 'hsl(215, 40%, 10%)', // #0f172a
      secondary: 'hsl(215, 30%, 15%)',
      tertiary: 'hsl(215, 25%, 20%)',
      overlay: 'hsla(215, 40%, 5%, 0.8)',
    },
    foreground: {
      primary: 'hsl(0, 0%, 95%)',
      secondary: 'hsl(0, 0%, 70%)',
      muted: 'hsl(0, 0%, 50%)',
      inverted: 'hsl(0, 0%, 10%)',
    },
    border: {
      default: 'hsl(215, 20%, 25%)',
      muted: 'hsl(215, 15%, 20%)',
      strong: 'hsl(215, 25%, 35%)',
    },
    accent: {
      primary: 'hsl(217, 91%, 60%)',
      secondary: 'hsl(187, 74%, 48%)',
      tertiary: 'hsl(262, 83%, 58%)',
    },
    semantic: designTokens.colors.semantic,
  },
  effects: {
    glow: {
      enabled: false,
      colors: {},
      intensity: 'subtle',
    },
    glassmorphism: {
      enabled: false,
      blur: '10px',
      opacity: 0.8,
    },
    animations: {
      enabled: true,
      duration: 'normal',
      easing: designTokens.easing.inOut,
    },
    special: {
      starfield: true,
      particles: false,
      gradients: true,
    },
  },
  typography: baseDarkTheme.typography!,
};

// Admin 主題
export const adminTheme: ThemeConfig = {
  name: 'admin',
  mode: 'dark',
  colors: {
    background: {
      primary: 'hsl(240, 7%, 9%)', // #16161A
      secondary: 'hsl(240, 6%, 13%)', // #1F1F23
      tertiary: 'hsl(240, 5%, 17%)', // #28282E
      overlay: 'hsla(240, 7%, 5%, 0.9)',
    },
    foreground: {
      primary: 'hsl(0, 0%, 93%)', // #EEEEEE
      secondary: 'hsl(0, 0%, 67%)', // #AAAAAA
      muted: 'hsl(0, 0%, 47%)', // #777777
      inverted: 'hsl(0, 0%, 9%)',
    },
    border: {
      default: 'hsl(240, 5%, 22%)', // #353539
      muted: 'hsl(240, 4%, 18%)',
      strong: 'hsl(240, 6%, 30%)',
    },
    accent: {
      primary: 'hsl(250, 89%, 65%)', // #7C4DFF
      secondary: 'hsl(187, 74%, 48%)', // #21C7EC
      tertiary: 'hsl(28, 89%, 55%)', // #FF7522
    },
    semantic: designTokens.colors.semantic,
  },
  effects: {
    glow: {
      enabled: true,
      colors: {
        primary: '#7C4DFF',
        secondary: '#21C7EC',
        tertiary: '#FF7522',
        success: '#52C41A',
        warning: '#FAAD14',
        error: '#FF4D4F',
      },
      intensity: 'moderate',
    },
    glassmorphism: {
      enabled: true,
      blur: '16px',
      opacity: 0.85,
    },
    animations: {
      enabled: true,
      duration: 'normal',
      easing: designTokens.easing.inOut,
    },
    special: {
      starfield: false,
      particles: true,
      gradients: true,
    },
  },
  typography: baseDarkTheme.typography!,
};

// Tab 主題顏色（Admin 專用）
export const adminTabThemes = {
  production: {
    primary: '#7C4DFF',
    gradient: 'linear-gradient(135deg, #7C4DFF 0%, #B620E0 100%)',
  },
  warehouse: {
    primary: '#21C7EC',
    gradient: 'linear-gradient(135deg, #21C7EC 0%, #17A2D0 100%)',
  },
  inventory: {
    primary: '#52C41A',
    gradient: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)',
  },
  reports: {
    primary: '#FF7522',
    gradient: 'linear-gradient(135deg, #FF7522 0%, #E64100 100%)',
  },
  analytics: {
    primary: '#722ED1',
    gradient: 'linear-gradient(135deg, #722ED1 0%, #531DAB 100%)',
  },
  tracking: {
    primary: '#13C2C2',
    gradient: 'linear-gradient(135deg, #13C2C2 0%, #08979C 100%)',
  },
  qc: {
    primary: '#EB2F96',
    gradient: 'linear-gradient(135deg, #EB2F96 0%, #C41D7F 100%)',
  },
  settings: {
    primary: '#8C8C8C',
    gradient: 'linear-gradient(135deg, #8C8C8C 0%, #595959 100%)',
  },
} as const;

// 主題切換功能
export const themes = {
  main: mainTheme,
  admin: adminTheme,
} as const;

export type ThemeName = keyof typeof themes;

// CSS 變量生成器
export const generateCSSVariables = (theme: ThemeConfig): Record<string, string> => {
  const vars: Record<string, string> = {};

  // 背景顏色
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    vars[`--background-${key}`] = value;
  });

  // 前景顏色
  Object.entries(theme.colors.foreground).forEach(([key, value]) => {
    vars[`--foreground-${key}`] = value;
  });

  // 邊框顏色
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    vars[`--border-${key}`] = value;
  });

  // 強調色
  Object.entries(theme.colors.accent).forEach(([key, value]) => {
    vars[`--accent-${key}`] = value;
  });

  // 字體
  vars['--font-sans'] = theme.typography.fonts.sans;
  vars['--font-mono'] = theme.typography.fonts.mono;

  return vars;
};

// Tailwind 整合配置
export const tailwindThemeExtend = {
  colors: {
    background: {
      DEFAULT: 'var(--background-primary)',
      secondary: 'var(--background-secondary)',
      tertiary: 'var(--background-tertiary)',
    },
    foreground: {
      DEFAULT: 'var(--foreground-primary)',
      secondary: 'var(--foreground-secondary)',
      muted: 'var(--foreground-muted)',
    },
    border: {
      DEFAULT: 'var(--border-default)',
      muted: 'var(--border-muted)',
      strong: 'var(--border-strong)',
    },
    accent: {
      DEFAULT: 'var(--accent-primary)',
      secondary: 'var(--accent-secondary)',
      tertiary: 'var(--accent-tertiary)',
    },
  },
};

// React Context 類型
export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
  isAdmin: boolean;
  tabTheme?: keyof typeof adminTabThemes;
}

// 輔助函數：獲取當前主題
export const getCurrentTheme = (pathname: string): ThemeName => {
  return pathname.startsWith('/admin') ? 'admin' : 'main';
};

// 輔助函數：應用主題到 DOM
export const applyTheme = (theme: ThemeConfig): void => {
  const root = document.documentElement;
  const cssVars = generateCSSVariables(theme);

  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // 設置 mode class
  root.classList.remove('light', 'dark');
  root.classList.add(theme.mode);

  // 設置主題 data attribute
  root.setAttribute('data-theme', theme.name);
};
