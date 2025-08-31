'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { VISUAL_CONFIG } from '../config/visual-config';
import { PERFORMANCE_CONFIG } from '../config/performance-config';

// 擴展Navigator接口以包含deviceMemory屬性（實驗性API）
interface ExtendedNavigator extends Navigator {
  deviceMemory?: number;
}

// 類型定義
interface VisualSystemState {
  // 系統狀態
  isInitialized: boolean;
  webglSupported: boolean;
  performanceTier: 'high' | 'medium' | 'low';

  // 視覺效果狀態
  starfieldEnabled: boolean;
  glassmorphismEnabled: boolean;
  animationsEnabled: boolean;

  // 性能指標
  currentFPS: number;
  memoryUsage: number;

  // 用戶偏好
  prefersReducedMotion: boolean;
  highContrastMode: boolean;

  // 導航欄狀態
  bottomNavVisible: boolean;

  // 當前配置
  currentTheme: 'default' | string;
  containerBorderStyle: string;
}

interface VisualSystemContextType {
  state: VisualSystemState;
  actions: {
    setStarfieldEnabled: (enabled: boolean) => void;
    setGlassmorphismEnabled: (enabled: boolean) => void;
    setAnimationsEnabled: (enabled: boolean) => void;
    setBottomNavVisible: (visible: boolean) => void;
    setContainerBorderStyle: (style: string) => void;
    updatePerformanceMetrics: (fps: number, memory: number) => void;
    setPerformanceTier: (tier: 'high' | 'medium' | 'low') => void;
  };
  _config: typeof VISUAL_CONFIG;
  performanceConfig: typeof PERFORMANCE_CONFIG;
}

// Action types
type Action =
  | {
      type: 'INIT_COMPLETE';
      payload: { webglSupported: boolean; performanceTier: 'high' | 'medium' | 'low' };
    }
  | { type: 'SET_STARFIELD_ENABLED'; payload: boolean }
  | { type: 'SET_GLASSMORPHISM_ENABLED'; payload: boolean }
  | { type: 'SET_ANIMATIONS_ENABLED'; payload: boolean }
  | { type: 'SET_BOTTOM_NAV_VISIBLE'; payload: boolean }
  | { type: 'SET_CONTAINER_BORDER_STYLE'; payload: string }
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: { fps: number; memory: number } }
  | { type: 'SET_PERFORMANCE_TIER'; payload: 'high' | 'medium' | 'low' }
  | {
      type: 'SET_USER_PREFERENCES';
      payload: { prefersReducedMotion: boolean; highContrastMode: boolean };
    };

// 初始狀態
const initialState: VisualSystemState = {
  isInitialized: false,
  webglSupported: false,
  performanceTier: 'medium',
  starfieldEnabled: true,
  glassmorphismEnabled: true,
  animationsEnabled: true,
  currentFPS: 60,
  memoryUsage: 0,
  prefersReducedMotion: false,
  highContrastMode: false,
  bottomNavVisible: true,
  currentTheme: 'default',
  containerBorderStyle: 'subtle',
};

// Reducer
function visualSystemReducer(state: VisualSystemState, action: Action): VisualSystemState {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return {
        ...state,
        isInitialized: true,
        webglSupported: action.payload.webglSupported,
        performanceTier: action.payload.performanceTier,
      };
    case 'SET_STARFIELD_ENABLED':
      return { ...state, starfieldEnabled: action.payload };
    case 'SET_GLASSMORPHISM_ENABLED':
      return { ...state, glassmorphismEnabled: action.payload };
    case 'SET_ANIMATIONS_ENABLED':
      return { ...state, animationsEnabled: action.payload };
    case 'SET_BOTTOM_NAV_VISIBLE':
      return { ...state, bottomNavVisible: action.payload };
    case 'SET_CONTAINER_BORDER_STYLE':
      return { ...state, containerBorderStyle: action.payload };
    case 'UPDATE_PERFORMANCE_METRICS':
      return { ...state, currentFPS: action.payload.fps, memoryUsage: action.payload.memory };
    case 'SET_PERFORMANCE_TIER':
      return { ...state, performanceTier: action.payload };
    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        prefersReducedMotion: action.payload.prefersReducedMotion,
        highContrastMode: action.payload.highContrastMode,
        animationsEnabled: !action.payload.prefersReducedMotion,
      };
    default:
      return state;
  }
}

// Context
const VisualSystemContext = createContext<VisualSystemContextType | null>(null);

// Provider Props
interface VisualSystemProviderProps {
  children: ReactNode;
  overrides?: Partial<VisualSystemState>;
}

// Provider Component
export function VisualSystemProvider({ children, overrides }: VisualSystemProviderProps) {
  const [state, dispatch] = useReducer(visualSystemReducer, { ...initialState, ...overrides });

  // 初始化效果
  useEffect(() => {
    // 檢測WebGL支援
    const checkWebGLSupport = (): boolean => {
      if (typeof window === 'undefined') return false;

      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch {
        return false;
      }
    };

    // 檢測性能層級
    const detectPerformanceTier = (): 'high' | 'medium' | 'low' => {
      if (typeof window === 'undefined') return 'medium';

      // 簡單的性能檢測邏輯
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as ExtendedNavigator).deviceMemory || 4;

      if (cores >= 8 && memory >= 8) return 'high';
      if (cores >= 4 && memory >= 4) return 'medium';
      return 'low';
    };

    // 檢測用戶偏好
    const detectUserPreferences = () => {
      if (typeof window === 'undefined') return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const highContrastMode = window.matchMedia('(prefers-contrast: high)').matches;

      dispatch({
        type: 'SET_USER_PREFERENCES',
        payload: { prefersReducedMotion, highContrastMode },
      });
    };

    // 執行初始化
    const webglSupported = checkWebGLSupport();
    const performanceTier = detectPerformanceTier();

    dispatch({
      type: 'INIT_COMPLETE',
      payload: { webglSupported, performanceTier },
    });

    detectUserPreferences();

    // 監聽用戶偏好變化
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      dispatch({
        type: 'SET_USER_PREFERENCES',
        payload: {
          prefersReducedMotion: e.matches,
          highContrastMode: contrastQuery.matches,
        },
      });
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      dispatch({
        type: 'SET_USER_PREFERENCES',
        payload: {
          prefersReducedMotion: motionQuery.matches,
          highContrastMode: e.matches,
        },
      });
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Actions
  const actions = {
    setStarfieldEnabled: (enabled: boolean) =>
      dispatch({ type: 'SET_STARFIELD_ENABLED', payload: enabled }),
    setGlassmorphismEnabled: (enabled: boolean) =>
      dispatch({ type: 'SET_GLASSMORPHISM_ENABLED', payload: enabled }),
    setAnimationsEnabled: (enabled: boolean) =>
      dispatch({ type: 'SET_ANIMATIONS_ENABLED', payload: enabled }),
    setBottomNavVisible: (visible: boolean) =>
      dispatch({ type: 'SET_BOTTOM_NAV_VISIBLE', payload: visible }),
    setContainerBorderStyle: (style: string) =>
      dispatch({ type: 'SET_CONTAINER_BORDER_STYLE', payload: style }),
    updatePerformanceMetrics: (fps: number, memory: number) =>
      dispatch({ type: 'UPDATE_PERFORMANCE_METRICS', payload: { fps, memory } }),
    setPerformanceTier: (tier: 'high' | 'medium' | 'low') =>
      dispatch({ type: 'SET_PERFORMANCE_TIER', payload: tier }),
  };

  const value = {
    state,
    actions,
    _config: VISUAL_CONFIG,
    performanceConfig: PERFORMANCE_CONFIG,
  };

  return <VisualSystemContext.Provider value={value}>{children}</VisualSystemContext.Provider>;
}

// Hook to use the context
export function useVisualSystem() {
  const context = useContext(VisualSystemContext);
  if (!context) {
    throw new Error('useVisualSystem must be used within a VisualSystemProvider');
  }
  return context;
}

// Export types
export type { VisualSystemState, VisualSystemContextType };
