/**
 * Accessibility Module
 * 無障礙性模塊 - WCAG 2.1 AA 合規的完整無障礙性解決方案
 */

// Internal imports for use within this file
import {
  runAccessibilityAudit as runAudit,
  auditColorContrast as auditContrast,
  getFocusableElements,
} from './utils/wcag-helpers';
import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { commonSkipLinks } from './components/SkipLink';

// 類型定義
export * from './types';

// Provider和Context
export {
  AccessibilityProvider,
  useAccessibility,
  useAccessibilityPreferences,
  useScreenReader,
  useColorContrast,
} from './providers/AccessibilityProvider';

// Hooks
export {
  useFocusManagement,
  useFocusTrap,
  useAutoFocus,
  useFocusVisible,
  useFocusAreas,
} from './hooks/useFocusManagement';

export {
  useAria,
  useAriaLabels,
  useAriaLiveRegion,
  useAriaDescriptions,
  useAriaRole,
} from './hooks/useAria';

export {
  useKeyboardNavigation,
  useSimpleKeyboardNavigation,
  useShortcuts,
  useDirectionalNavigation,
  useSearchableNavigation,
} from './hooks/useKeyboardNavigation';

// 組件
export { SkipLink, SkipLinks, commonSkipLinks, useSkipLinks } from './components/SkipLink';

export {
  ScreenReaderOnly,
  VisuallyHidden,
  LiveRegion,
  Status,
  Alert,
  Description,
  Label,
  Instructions,
  Progress,
  Count,
  useLiveRegion,
  withScreenReaderSupport,
} from './components/ScreenReaderOnly';

export {
  FocusTrap,
  DialogFocusTrap,
  MenuFocusTrap,
  FormFocusTrap,
  FocusScope,
  useFocusTrapRef,
  withFocusTrap,
} from './components/FocusTrap';

// 工具函數
export {
  calculateColorContrast,
  checkLargeTextContrast,
  generateCompliantColor,
  isElementFocusable,
  getFocusableElements,
  validateAriaLabels,
  validateSemanticStructure,
  auditColorContrast,
  runAccessibilityAudit,
} from './utils/wcag-helpers';

export {
  FocusManager,
  FocusTrap as FocusTrapClass,
  FocusObserver,
  globalFocusManager,
  globalFocusObserver,
  createSimpleFocusTrap,
  autoFocusFirst,
  withFocusRestore,
} from './utils/focus-helpers';

// 設計系統擴展 - Temporarily removed (deprecated design-system)
// These utilities are now available in lib/design-system-deprecated/colors.ts
// TODO: Migrate accessibility features to new card-system or standalone module

/**
 * 無障礙性配置常數
 */
export const ACCESSIBILITY_CONFIG = {
  // WCAG 合規級別
  WCAG_LEVELS: ['A', 'AA', 'AAA'] as const,

  // 色彩對比度要求
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5,
    AA_LARGE: 3,
    AAA_NORMAL: 7,
    AAA_LARGE: 4.5,
  },

  // 字體大小閾值
  FONT_SIZE_THRESHOLDS: {
    LARGE_TEXT_PX: 18,
    LARGE_TEXT_PT: 14,
    BOLD_LARGE_TEXT_PX: 14,
    BOLD_LARGE_TEXT_PT: 11,
  },

  // 焦點管理
  FOCUS_CONFIG: {
    OUTLINE_WIDTH: 2,
    OUTLINE_OFFSET: 2,
    ENHANCED_OUTLINE_WIDTH: 3,
    FOCUS_DELAY: 100,
  },

  // 鍵盤導航
  KEYBOARD_CONFIG: {
    SEARCH_DELAY: 1000,
    REPEAT_DELAY: 500,
  },

  // 螢幕閱讀器
  SCREEN_READER_CONFIG: {
    ANNOUNCEMENT_DELAY: 100,
    LIVE_REGION_CLEAR_DELAY: 50,
  },
} as const;

/**
 * 無障礙性工具類別
 */
export class AccessibilityUtils {
  /**
   * 檢查瀏覽器是否支援無障礙性功能
   */
  static checkBrowserSupport() {
    const support = {
      ariaLive: 'ariaLive' in document.createElement('div'),
      focusVisible: CSS.supports('selector(:focus-visible)'),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion)').matches !== undefined,
      prefersColorScheme: window.matchMedia('(prefers-color-scheme)').matches !== undefined,
      prefersContrast: window.matchMedia('(prefers-contrast)').matches !== undefined,
    };

    return support;
  }

  /**
   * 檢測螢幕閱讀器
   */
  static detectScreenReader() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaders = {
      jaws: userAgent.includes('jaws'),
      nvda: userAgent.includes('nvda'),
      voiceOver: /mac os x/.test(userAgent) && 'speechSynthesis' in window,
      talkback: /android/.test(userAgent) && 'speechSynthesis' in window,
      windowsNarrator: /windows/.test(userAgent) && 'speechSynthesis' in window,
    };

    const detected = Object.entries(screenReaders).find(([_, supported]) => supported)?.[0];

    return {
      detected: !!detected,
      type: detected || null,
      details: screenReaders,
    };
  }

  /**
   * 生成無障礙性報告
   */
  static async generateAccessibilityReport(container: HTMLElement = document.body) {
    const audit = runAudit(container);
    const browserSupport = this.checkBrowserSupport();
    const screenReader = this.detectScreenReader();

    return {
      timestamp: new Date().toISOString(),
      container: container.tagName.toLowerCase(),
      audit,
      browserSupport,
      screenReader,
      summary: {
        wcagCompliant: audit.passed,
        totalIssues: audit.issues.length,
        criticalIssues: audit.issues.filter(i => i.severity === 'error').length,
        warningIssues: audit.issues.filter(i => i.severity === 'warning').length,
        infoIssues: audit.issues.filter(i => i.severity === 'info').length,
      },
    };
  }
}

/**
 * 無障礙性測試工具
 */
export class AccessibilityTester {
  private static instance: AccessibilityTester;
  private issues: Array<{
    element: HTMLElement;
    issue: string;
    severity: 'error' | 'warning';
    suggestion?: string;
  }> = [];

  static getInstance() {
    if (!this.instance) {
      this.instance = new AccessibilityTester();
    }
    return this.instance;
  }

  /**
   * 運行完整的無障礙性測試
   */
  async runFullTest(
    options: {
      container?: HTMLElement;
      includePerformance?: boolean;
      includeBrowserSupport?: boolean;
    } = {}
  ) {
    const {
      container = document.body,
      includePerformance = true,
      includeBrowserSupport = true,
    } = options;

    const results = {
      basic: runAudit(container),
      performance: includePerformance ? await this.runPerformanceTest(container) : null,
      browserSupport: includeBrowserSupport ? AccessibilityUtils.checkBrowserSupport() : null,
      recommendations: this.generateRecommendations(),
    };

    return results;
  }

  /**
   * 運行性能測試
   */
  private async runPerformanceTest(container: HTMLElement) {
    const startTime = performance.now();

    // 測試焦點性能
    const focusableElements = getFocusableElements(container);
    const focusTime = performance.now() - startTime;

    // 測試色彩對比度檢查性能
    const contrastStartTime = performance.now();
    auditContrast(container);
    const contrastTime = performance.now() - contrastStartTime;

    return {
      focusableElementsCount: focusableElements.length,
      focusDiscoveryTime: focusTime,
      contrastAuditTime: contrastTime,
      totalTime: performance.now() - startTime,
    };
  }

  /**
   * 生成改進建議
   */
  private generateRecommendations() {
    return [
      {
        category: 'focus-management',
        title: '焦點管理最佳實踐',
        recommendations: [
          '確保所有互動元素都可以通過鍵盤訪問',
          '為模態框和對話框實施焦點陷阱',
          '提供清晰的焦點指示器',
          '實施適當的Tab順序',
        ],
      },
      {
        category: 'aria-labels',
        title: 'ARIA標籤最佳實踐',
        recommendations: [
          '為所有互動元素提供有意義的標籤',
          '使用適當的ARIA角色',
          '實施實時區域用於動態內容更新',
          '確保ARIA狀態與視覺狀態同步',
        ],
      },
      {
        category: 'color-contrast',
        title: '色彩對比度最佳實踐',
        recommendations: [
          '確保文字與背景的對比度至少為4.5:1',
          '大文字的對比度至少為3:1',
          '不要僅依賴顏色來傳達信息',
          '提供高對比度模式選項',
        ],
      },
      {
        category: 'keyboard-navigation',
        title: '鍵盤導航最佳實踐',
        recommendations: [
          '實施一致的鍵盤快捷鍵',
          '提供跳過連結',
          '支援方向鍵導航',
          '確保ESC鍵可以退出模態框',
        ],
      },
    ];
  }
}

/**
 * 便利函數：快速設置無障礙性
 */
export function setupAccessibility(
  options: {
    provider?: React.ComponentType<{ children: React.ReactNode }>;
    enableSkipLinks?: boolean;
    enableFocusManagement?: boolean;
    enableKeyboardNavigation?: boolean;
    debugMode?: boolean;
  } = {}
) {
  const {
    enableSkipLinks: _enableSkipLinks = true, // Renamed unused variable
    enableFocusManagement: _enableFocusManagement = true, // Renamed unused variable
    enableKeyboardNavigation: _enableKeyboardNavigation = true,
    debugMode: _debugMode = false,
  } = options;

  // 設置全域CSS
  if (typeof window !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      /* 無障礙性基礎樣式 */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* 焦點指示器 */
      *:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }

      /* 跳過連結 */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #0066cc;
        color: white;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
      }

      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
  }

  return {
    AccessibilityProvider,
    commonSkipLinks,
    ACCESSIBILITY_CONFIG,
    utils: AccessibilityUtils,
    tester: AccessibilityTester.getInstance(),
  };
}

// 預設導出
const accessibilityExports = {
  AccessibilityProvider,
  setupAccessibility,
  ACCESSIBILITY_CONFIG,
  AccessibilityUtils,
  AccessibilityTester,
};

export default accessibilityExports;
