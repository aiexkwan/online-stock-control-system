/**
 * ThemeProvider - 統一主題管理
 * 提供主題切換同 CSS 變量注入
 */

'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
// Temporarily using deprecated theme system - TODO: Migrate to card-system
import {
  themes,
  applyTheme,
  getCurrentTheme,
  adminTabThemes,
  type ThemeName,
  type ThemeConfig,
  type ThemeContextValue,
} from '@/lib/design-system-deprecated/theme-system';

// Theme Context
const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// 類型守衛函數
const isValidThemeName = (value: string): value is ThemeName => {
  return Object.prototype.hasOwnProperty.call(themes, value);
};

const isValidTabTheme = (value: string): value is keyof typeof adminTabThemes => {
  return Object.prototype.hasOwnProperty.call(adminTabThemes, value);
};

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
  enableSystem?: boolean;
}

/**
 * 主題提供者組件
 *
 * @example
 * <ThemeProvider defaultTheme="main">
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  defaultTheme = 'main',
  storageKey = 'newpennine-theme',
  enableSystem: _enableSystem = false,
}: ThemeProviderProps) {
  const pathname = usePathname();
  const [themeName, setThemeName] = React.useState<ThemeName>(defaultTheme);
  const [mounted, setMounted] = React.useState(false);

  // 根據路徑判斷是否為 Admin
  const isAdmin = pathname.startsWith('/admin');

  // 獲取當前 tab 主題（Admin 專用）
  const getTabTheme = React.useCallback((): keyof typeof adminTabThemes | undefined => {
    if (!isAdmin) return undefined;

    // 從路徑提取 tab 名稱
    const pathSegments = pathname.split('/');
    const tabName = pathSegments[2]; // /admin/{tab}

    if (tabName && isValidTabTheme(tabName)) {
      return tabName;
    }

    return undefined;
  }, [pathname, isAdmin]);

  const tabTheme = getTabTheme();

  // 初始化主題
  React.useEffect(() => {
    setMounted(true);

    // 從 localStorage 讀取主題
    const stored = localStorage.getItem(storageKey);
    if (stored && isValidThemeName(stored)) {
      setThemeName(stored);
    } else {
      // 根據路徑自動選擇主題
      const autoTheme = getCurrentTheme(pathname);
      setThemeName(autoTheme);
    }
  }, [pathname, storageKey]);

  // 應用主題
  React.useEffect(() => {
    if (!mounted) return;

    const theme = themes[themeName];
    applyTheme(theme);

    // 如果是 Admin 且有 tab 主題，注入額外的 CSS 變量
    if (isAdmin && tabTheme && isValidTabTheme(tabTheme)) {
      const root = document.documentElement;
      const tabColors = adminTabThemes[tabTheme];

      root.style.setProperty('--tab-primary', tabColors.primary);
      root.style.setProperty('--tab-gradient', tabColors.gradient);
    }
  }, [themeName, mounted, isAdmin, tabTheme]);

  // 設置主題
  const setTheme = React.useCallback(
    (newTheme: ThemeName) => {
      if (!isValidThemeName(newTheme)) {
        console.warn(`Invalid theme name: ${newTheme}. Using default theme.`);
        return;
      }
      setThemeName(newTheme);
      localStorage.setItem(storageKey, newTheme);
    },
    [storageKey]
  );

  // Context value
  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName],
      setTheme,
      isAdmin,
      tabTheme: tabTheme || undefined,
    }),
    [themeName, setTheme, isAdmin, tabTheme]
  );

  // 避免 SSR 閃爍
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook: 使用主題
export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Hook: 獲取當前主題配置
export function useThemeConfig(): ThemeConfig {
  const { theme } = useTheme();
  return theme;
}

// Hook: 獲取 Admin tab 顏色
export function useTabTheme() {
  const { tabTheme } = useTheme();

  if (!tabTheme || !isValidTabTheme(tabTheme)) {
    return null;
  }

  return adminTabThemes[tabTheme];
}

// Hook: 主題切換器
export function useThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = React.useCallback(() => {
    const newTheme: ThemeName = theme.name === 'main' ? 'admin' : 'main';
    setTheme(newTheme);
  }, [theme.name, setTheme]);

  return {
    theme: theme.name as ThemeName,
    toggle,
    setTheme,
  };
}
