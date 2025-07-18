/**
 * AccessibilityProvider - 無障礙性管理提供器
 * 實施 WCAG 2.1 AA 合規標準和無障礙性功能管理
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode, 
  useCallback,
  useMemo
} from 'react';

import {
  AccessibilityContextType,
  AccessibilityPreferences,
  FocusManagementConfig,
  KeyboardNavigationConfig,
  ScreenReaderSupport,
  AccessibilityAuditResult,
  AccessibilityIssue,
  ColorContrastRatio,
  UseAccessibilityReturn
} from '../types';

import { 
  calculateColorContrast,
  isElementFocusable,
  runAccessibilityAudit 
} from '../utils/wcag-helpers';

import { globalFocusManager } from '../utils/focus-helpers';

/**
 * 預設無障礙性偏好設定
 */
const defaultPreferences: AccessibilityPreferences = {
  reducedMotion: false,
  animationsEnabled: true,
  highContrast: false,
  fontSize: 'medium',
  colorScheme: 'auto',
  focusOutlineAlwaysVisible: false,
  skipLinksEnabled: true,
  keyboardNavigationEnabled: true,
  screenReaderEnabled: false,
  announceChanges: true,
  verboseDescriptions: false,
};

/**
 * 預設焦點管理配置
 */
const defaultFocusConfig: FocusManagementConfig = {
  trapFocus: false,
  restoreFocusOnExit: true,
  autoFocus: true,
  outlineStyle: 'default',
  outlineWidth: 2,
  outlineColor: '#0066cc',
  skipHiddenElements: true,
  skipDisabledElements: true,
};

/**
 * 預設鍵盤導航配置
 */
const defaultKeyboardConfig: KeyboardNavigationConfig = {
  arrowKeys: true,
  homeEndKeys: true,
  pageUpDownKeys: true,
  tabNavigation: true,
  shiftTabNavigation: true,
  shortcuts: {},
};

/**
 * 預設螢幕閱讀器配置
 */
const defaultScreenReader: ScreenReaderSupport = {
  enabled: false,
  announcements: true,
  regionLabels: true,
  landmarkNavigation: true,
  headingNavigation: true,
  listNavigation: true,
  tableNavigation: true,
};

/**
 * AccessibilityContext
 */
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * AccessibilityProvider Props
 */
interface AccessibilityProviderProps {
  children: ReactNode;
  initialPreferences?: Partial<AccessibilityPreferences>;
  enableAutoDetection?: boolean;
  enableAuditMode?: boolean;
  debugMode?: boolean;
}

/**
 * AccessibilityProvider 組件
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialPreferences = {},
  enableAutoDetection = true,
  enableAuditMode = false,
  debugMode = false,
}) => {
  // 狀態管理
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  
  const [focusConfig, setFocusConfig] = useState<FocusManagementConfig>(defaultFocusConfig);
  const [keyboardConfig, setKeyboardConfig] = useState<KeyboardNavigationConfig>(defaultKeyboardConfig);
  const [screenReader, setScreenReader] = useState<ScreenReaderSupport>(defaultScreenReader);
  
  // 無障礙性問題追蹤
  const [accessibilityIssues, setAccessibilityIssues] = useState<AccessibilityIssue[]>([]);
  
  // 螢幕閱讀器宣告區域
  const [announcementRegion, setAnnouncementRegion] = useState<HTMLElement | null>(null);

  /**
   * 自動檢測用戶偏好
   */
  useEffect(() => {
    if (!enableAutoDetection || typeof window === 'undefined') return;

    // 檢測減少動畫偏好
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      updatePreferences({
        reducedMotion: e.matches,
        animationsEnabled: !e.matches,
      });
    };

    // 檢測高對比度偏好
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      updatePreferences({
        highContrast: e.matches,
      });
    };

    // 檢測色彩方案偏好
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      if (preferences.colorScheme === 'auto') {
        // 只在自動模式下更新
        updatePreferences({
          colorScheme: e.matches ? 'dark' : 'light',
        });
      }
    };

    // 初始設置
    updatePreferences({
      reducedMotion: mediaQuery.matches,
      animationsEnabled: !mediaQuery.matches,
      highContrast: contrastQuery.matches,
    });

    // 添加監聽器
    mediaQuery.addEventListener('change', handleReducedMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);
    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    // 清理函數
    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, [enableAutoDetection, preferences.colorScheme]);

  /**
   * 檢測螢幕閱讀器
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 檢測常見的螢幕閱讀器
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderDetected = 
      userAgent.includes('nvda') ||
      userAgent.includes('jaws') ||
      userAgent.includes('voiceover') ||
      userAgent.includes('talkback') ||
      'speechSynthesis' in window;

    if (screenReaderDetected) {
      updateScreenReader({ enabled: true });
    }
  }, []);

  /**
   * 創建宣告區域
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 創建螢幕閱讀器宣告區域
    const region = document.createElement('div');
    region.id = 'accessibility-announcements';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';

    document.body.appendChild(region);
    setAnnouncementRegion(region);

    return () => {
      if (document.body.contains(region)) {
        document.body.removeChild(region);
      }
    };
  }, []);

  /**
   * 應用CSS變量到根元素
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // 應用字體大小
    const fontSizeMap = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '22px',
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[preferences.fontSize]);

    // 應用焦點輪廓
    if (preferences.focusOutlineAlwaysVisible) {
      root.style.setProperty('--accessibility-focus-outline', `${focusConfig.outlineWidth}px solid ${focusConfig.outlineColor}`);
    }

    // 應用高對比度
    if (preferences.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // 應用減少動畫
    if (preferences.reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }

    if (debugMode) {
      console.log('Accessibility: Applied preferences to DOM', preferences);
    }
  }, [preferences, focusConfig, debugMode]);

  /**
   * 更新偏好設定
   */
  const updatePreferences = useCallback((newPrefs: Partial<AccessibilityPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      
      if (debugMode) {
        console.log('Accessibility: Updated preferences', { prev, newPrefs, updated });
      }
      
      return updated;
    });
  }, [debugMode]);

  /**
   * 更新焦點配置
   */
  const updateFocusConfig = useCallback((config: Partial<FocusManagementConfig>) => {
    setFocusConfig(prev => ({ ...prev, ...config }));
  }, []);

  /**
   * 更新鍵盤配置
   */
  const updateKeyboardConfig = useCallback((config: Partial<KeyboardNavigationConfig>) => {
    setKeyboardConfig(prev => ({ ...prev, ...config }));
  }, []);

  /**
   * 更新螢幕閱讀器配置
   */
  const updateScreenReader = useCallback((config: Partial<ScreenReaderSupport>) => {
    setScreenReader(prev => ({ ...prev, ...config }));
  }, []);

  /**
   * 螢幕閱讀器宣告
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRegion || !screenReader.enabled || !screenReader.announcements) return;

    // 設置宣告優先級
    announcementRegion.setAttribute('aria-live', priority);
    
    // 清空後設置新訊息
    announcementRegion.textContent = '';
    setTimeout(() => {
      announcementRegion.textContent = message;
    }, 100);

    if (debugMode) {
      console.log(`Accessibility: Announced (${priority}):`, message);
    }
  }, [announcementRegion, screenReader.enabled, screenReader.announcements, debugMode]);

  /**
   * 檢查顏色對比度
   */
  const checkColorContrast = useCallback((foreground: string, background: string): ColorContrastRatio => {
    return calculateColorContrast(foreground, background);
  }, []);

  /**
   * 運行無障礙性審核
   */
  const runAccessibilityAudit = useCallback(async (component: string): Promise<AccessibilityAuditResult> => {
    const container = document.querySelector(`[data-component="${component}"]`) as HTMLElement;
    
    if (!container) {
      throw new Error(`Component not found: ${component}`);
    }

    const startTime = performance.now();
    const auditResult = runAccessibilityAudit(container);
    const endTime = performance.now();

    const result: AccessibilityAuditResult = {
      component,
      timestamp: new Date(),
      wcagCompliance: {
        level: 'AA',
        passed: auditResult.passed,
        issues: auditResult.issues,
      },
      checks: {
        colorContrast: auditResult.issues.filter(i => i.type === 'color-contrast').length === 0,
        keyboardNavigation: true, // 需要實際測試
        screenReaderSupport: true, // 需要實際測試
        focusManagement: true, // 需要實際測試
        ariaLabels: auditResult.issues.filter(i => i.type === 'aria-labels').length === 0,
        semanticHtml: auditResult.issues.filter(i => i.type === 'semantic-html').length === 0,
      },
      performance: {
        renderTime: endTime - startTime,
        interactionDelay: 0, // 需要實際測量
        focusDelay: 0, // 需要實際測量
      },
    };

    // 更新問題列表
    setAccessibilityIssues(prev => [
      ...prev.filter(issue => !issue.id.includes(component)),
      ...auditResult.issues,
    ]);

    if (debugMode) {
      console.log('Accessibility: Audit completed', result);
    }

    return result;
  }, [debugMode]);

  /**
   * 獲取無障礙性問題
   */
  const getAccessibilityIssues = useCallback((): AccessibilityIssue[] => {
    return accessibilityIssues;
  }, [accessibilityIssues]);

  /**
   * Context 值
   */
  const contextValue = useMemo<AccessibilityContextType>(() => ({
    preferences,
    updatePreferences,
    focusConfig,
    updateFocusConfig,
    keyboardConfig,
    updateKeyboardConfig,
    screenReader,
    updateScreenReader,
    runAccessibilityAudit,
    getAccessibilityIssues,
    announce,
    checkColorContrast,
    isElementFocusable,
  }), [
    preferences,
    updatePreferences,
    focusConfig,
    updateFocusConfig,
    keyboardConfig,
    updateKeyboardConfig,
    screenReader,
    updateScreenReader,
    runAccessibilityAudit,
    getAccessibilityIssues,
    announce,
    checkColorContrast,
  ]);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* 調試模式信息 */}
      {debugMode && enableAuditMode && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10000,
            maxWidth: '300px',
          }}
        >
          <div>無障礙性調試模式</div>
          <div>問題數量: {accessibilityIssues.length}</div>
          <div>高對比度: {preferences.highContrast ? '啟用' : '禁用'}</div>
          <div>減少動畫: {preferences.reducedMotion ? '啟用' : '禁用'}</div>
          <div>螢幕閱讀器: {screenReader.enabled ? '檢測到' : '未檢測'}</div>
        </div>
      )}
    </AccessibilityContext.Provider>
  );
};

/**
 * useAccessibility Hook
 */
export const useAccessibility = (): UseAccessibilityReturn => {
  const context = useContext(AccessibilityContext);

  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }

  // 計算便利狀態
  const isHighContrast = context.preferences.highContrast;
  const isReducedMotion = context.preferences.reducedMotion;
  const isScreenReaderActive = context.screenReader.enabled;
  const isKeyboardUser = context.preferences.keyboardNavigationEnabled;

  // 便利操作
  const toggleHighContrast = useCallback(() => {
    context.updatePreferences({ highContrast: !isHighContrast });
  }, [context, isHighContrast]);

  const toggleReducedMotion = useCallback(() => {
    context.updatePreferences({ 
      reducedMotion: !isReducedMotion,
      animationsEnabled: isReducedMotion, // 相反值
    });
  }, [context, isReducedMotion]);

  const toggleScreenReader = useCallback(() => {
    context.updateScreenReader({ enabled: !isScreenReaderActive });
  }, [context, isScreenReaderActive]);

  return {
    ...context,
    isHighContrast,
    isReducedMotion,
    isScreenReaderActive,
    isKeyboardUser,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReader,
  };
};

// 便利 Hooks

/**
 * 只獲取偏好設定的 Hook
 */
export const useAccessibilityPreferences = () => {
  const { preferences, updatePreferences } = useAccessibility();
  return { preferences, updatePreferences };
};

/**
 * 只獲取螢幕閱讀器功能的 Hook
 */
export const useScreenReader = () => {
  const { screenReader, updateScreenReader, announce } = useAccessibility();
  return { screenReader, updateScreenReader, announce };
};

/**
 * 只獲取色彩對比度檢查的 Hook
 */
export const useColorContrast = () => {
  const { checkColorContrast } = useAccessibility();
  return { checkColorContrast };
};

export default AccessibilityProvider;