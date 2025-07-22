/**
 * UniversalProvider - 統一佈局系統提供器
 * 全域管理主題、響應式狀態、佈局配置和錯誤處理
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UniversalTheme, ResponsiveBreakpoints } from './types';
import { THEMES, BREAKPOINTS } from './constants';
import { ErrorProvider } from '@/lib/error-handling';
import { LoadingProvider } from '@/lib/loading/providers/LoadingProvider';

interface UniversalLayoutContextType {
  // 主題管理
  currentTheme: string;
  theme: UniversalTheme;
  setTheme: (themeName: string) => void;

  // 響應式狀態
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: string;

  // 佈局狀態
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 全域配置
  config: {
    animationsEnabled: boolean;
    reducedMotion: boolean;
    debugMode: boolean;
  };
  updateConfig: (newConfig: Partial<UniversalLayoutContextType['config']>) => void;
}

const UniversalLayoutContext = createContext<UniversalLayoutContextType | undefined>(undefined);

interface UniversalProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  animationsEnabled?: boolean;
  debugMode?: boolean;
  // Error handling settings
  enableErrorHandling?: boolean;
  maxErrorHistory?: number;
  enableAutoErrorCleanup?: boolean;
  // Loading management settings
  enableLoadingManagement?: boolean;
  enablePerformanceAware?: boolean;
}

export const UniversalProvider: React.FC<UniversalProviderProps> = ({
  children,
  defaultTheme = 'neutral',
  animationsEnabled = true,
  debugMode = false,
  enableErrorHandling = true,
  maxErrorHistory = 100,
  enableAutoErrorCleanup = true,
  enableLoadingManagement = true,
  enablePerformanceAware = true,
}) => {
  // 主題狀態
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [theme, setThemeConfig] = useState(THEMES[defaultTheme]);

  // 響應式狀態
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [breakpoint, setBreakpoint] = useState('xl');

  // 佈局狀態
  const [isLoading, setIsLoading] = useState(false);

  // 全域配置
  const [config, setConfig] = useState({
    animationsEnabled,
    reducedMotion: false,
    debugMode,
  });

  // 響應式監聽器
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      const width = window.innerWidth;

      // 檢測斷點
      let currentBreakpoint = 'xs';
      if (width >= BREAKPOINTS['2xl']!) currentBreakpoint = '2xl';
      else if (width >= BREAKPOINTS.xl!) currentBreakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg!) currentBreakpoint = 'lg';
      else if (width >= BREAKPOINTS.md!) currentBreakpoint = 'md';
      else if (width >= BREAKPOINTS.sm!) currentBreakpoint = 'sm';

      // 更新狀態
      const newIsMobile = width < BREAKPOINTS.md!;
      const newIsTablet = width >= BREAKPOINTS.md! && width < BREAKPOINTS.lg!;
      const newIsDesktop = width >= BREAKPOINTS.lg!;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);
      setIsDesktop(newIsDesktop);
      setBreakpoint(currentBreakpoint);

      // 調試模式日誌
      if (debugMode) {
        console.log(`Universal Layout: Breakpoint changed to ${currentBreakpoint} (${width}px)`);
      }
    };

    // 初始檢測
    checkBreakpoint();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkBreakpoint);

    return () => {
      window.removeEventListener('resize', checkBreakpoint);
    };
  }, [debugMode]);

  // 檢測用戶的動畫偏好
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({
        ...prev,
        reducedMotion: e.matches,
        animationsEnabled: animationsEnabled && !e.matches,
      }));
    };

    // 初始設置
    setConfig(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches,
      animationsEnabled: animationsEnabled && !mediaQuery.matches,
    }));

    // 監聽變化
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [animationsEnabled]);

  // 主題切換函數
  const setTheme = (themeName: string) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
      setThemeConfig(THEMES[themeName]);

      if (debugMode) {
        console.log(`Universal Layout: Theme changed to ${themeName}`);
      }
    } else {
      console.warn(`Universal Layout: Theme "${themeName}" not found`);
    }
  };

  // 配置更新函數
  const updateConfig = (newConfig: Partial<UniversalLayoutContextType['config']>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));

    if (debugMode) {
      console.log('Universal Layout: Config updated', newConfig);
    }
  };

  const contextValue: UniversalLayoutContextType = {
    // 主題
    currentTheme,
    theme,
    setTheme,

    // 響應式
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,

    // 狀態
    isLoading,
    setIsLoading,

    // 配置
    config,
    updateConfig,
  };

  // 渲染內容，根據設置包裹相應的 Provider
  const renderContent = () => {
    let content = (
      <UniversalLayoutContext.Provider value={contextValue}>
        {children}
      </UniversalLayoutContext.Provider>
    );

    // 包裹 Loading Provider
    if (enableLoadingManagement) {
      content = (
        <LoadingProvider enablePerformanceAware={enablePerformanceAware} enableAutoCleanup={true}>
          {content}
        </LoadingProvider>
      );
    }

    // 包裹 Error Provider
    if (enableErrorHandling) {
      content = (
        <ErrorProvider maxErrorHistory={maxErrorHistory} enableAutoCleanup={enableAutoErrorCleanup}>
          {content}
        </ErrorProvider>
      );
    }

    return content;
  };

  return renderContent();
};

// Hook 用於訪問佈局上下文
export const useUniversalLayout = (): UniversalLayoutContextType => {
  const context = useContext(UniversalLayoutContext);

  if (context === undefined) {
    throw new Error('useUniversalLayout must be used within a UniversalProvider');
  }

  return context;
};

// 便利 Hook: 只獲取響應式狀態
export const useResponsive = () => {
  const { isMobile, isTablet, isDesktop, breakpoint } = useUniversalLayout();
  return { isMobile, isTablet, isDesktop, breakpoint };
};

// 便利 Hook: 只獲取主題
export const useUniversalTheme = () => {
  const { currentTheme, theme, setTheme } = useUniversalLayout();
  return { currentTheme, theme, setTheme };
};

// 便利 Hook: 媒體查詢 (兼容現有的 useMediaQuery)
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

export default UniversalProvider;
