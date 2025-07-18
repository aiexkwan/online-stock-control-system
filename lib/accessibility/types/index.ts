/**
 * Accessibility Types
 * 無障礙性類型定義 - WCAG 2.1 AA 合規標準
 */

/**
 * WCAG 合規級別
 */
export type WcagLevel = 'A' | 'AA' | 'AAA';

/**
 * 色彩對比度比率
 * WCAG AA 標準：正常文字 4.5:1，大文字 3:1
 */
export interface ColorContrastRatio {
  ratio: number;
  level: WcagLevel;
  isCompliant: boolean;
}

/**
 * 無障礙性偏好設定
 */
export interface AccessibilityPreferences {
  // 動作偏好
  reducedMotion: boolean;
  animationsEnabled: boolean;
  
  // 視覺偏好
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'light' | 'dark' | 'auto';
  
  // 互動偏好
  focusOutlineAlwaysVisible: boolean;
  skipLinksEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  
  // 螢幕閱讀器
  screenReaderEnabled: boolean;
  announceChanges: boolean;
  verboseDescriptions: boolean;
}

/**
 * 焦點管理配置
 */
export interface FocusManagementConfig {
  // 焦點陷阱設定
  trapFocus: boolean;
  restoreFocusOnExit: boolean;
  autoFocus: boolean;
  
  // 焦點指示器
  outlineStyle: 'default' | 'enhanced' | 'custom';
  outlineWidth: number;
  outlineColor: string;
  
  // 跳過行為
  skipHiddenElements: boolean;
  skipDisabledElements: boolean;
}

/**
 * ARIA 標籤配置
 */
export interface AriaConfig {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * 鍵盤導航配置
 */
export interface KeyboardNavigationConfig {
  // 方向鍵導航
  arrowKeys: boolean;
  homeEndKeys: boolean;
  pageUpDownKeys: boolean;
  
  // Tab 導航
  tabNavigation: boolean;
  shiftTabNavigation: boolean;
  
  // 快捷鍵
  shortcuts: Record<string, () => void>;
  
  // Escape 行為
  escapeAction?: () => void;
  
  // Enter/Space 行為
  enterAction?: () => void;
  spaceAction?: () => void;
}

/**
 * 無障礙性測試結果
 */
export interface AccessibilityAuditResult {
  component: string;
  timestamp: Date;
  
  // 合規性檢查
  wcagCompliance: {
    level: WcagLevel;
    passed: boolean;
    issues: AccessibilityIssue[];
  };
  
  // 具體檢查項目
  checks: {
    colorContrast: boolean;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
    focusManagement: boolean;
    ariaLabels: boolean;
    semanticHtml: boolean;
  };
  
  // 性能指標
  performance: {
    renderTime: number;
    interactionDelay: number;
    focusDelay: number;
  };
}

/**
 * 無障礙性問題
 */
export interface AccessibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  type: 'color-contrast' | 'focus-management' | 'aria-labels' | 'keyboard-navigation' | 'semantic-html';
  element: string;
  description: string;
  suggestion: string;
  wcagReference: string;
}

/**
 * 螢幕閱讀器支援
 */
export interface ScreenReaderSupport {
  enabled: boolean;
  announcements: boolean;
  regionLabels: boolean;
  landmarkNavigation: boolean;
  headingNavigation: boolean;
  listNavigation: boolean;
  tableNavigation: boolean;
}

/**
 * 無障礙性 Context 類型
 */
export interface AccessibilityContextType {
  // 偏好設定
  preferences: AccessibilityPreferences;
  updatePreferences: (newPrefs: Partial<AccessibilityPreferences>) => void;
  
  // 焦點管理
  focusConfig: FocusManagementConfig;
  updateFocusConfig: (config: Partial<FocusManagementConfig>) => void;
  
  // 鍵盤導航
  keyboardConfig: KeyboardNavigationConfig;
  updateKeyboardConfig: (config: Partial<KeyboardNavigationConfig>) => void;
  
  // 螢幕閱讀器
  screenReader: ScreenReaderSupport;
  updateScreenReader: (config: Partial<ScreenReaderSupport>) => void;
  
  // 測試和監控
  runAccessibilityAudit: (component: string) => Promise<AccessibilityAuditResult>;
  getAccessibilityIssues: () => AccessibilityIssue[];
  
  // 工具函數
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  checkColorContrast: (foreground: string, background: string) => ColorContrastRatio;
  isElementFocusable: (element: HTMLElement) => boolean;
}

/**
 * 無障礙性 Hook 返回類型
 */
export interface UseAccessibilityReturn extends AccessibilityContextType {
  // 便利狀態
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isScreenReaderActive: boolean;
  isKeyboardUser: boolean;
  
  // 快速操作
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleScreenReader: () => void;
}

/**
 * 焦點管理 Hook 返回類型
 */
export interface UseFocusManagementReturn {
  // 焦點狀態
  currentFocus: HTMLElement | null;
  focusHistory: HTMLElement[];
  
  // 焦點操作
  setFocus: (element: HTMLElement | string) => void;
  restoreFocus: () => void;
  trapFocus: (container: HTMLElement) => () => void;
  releaseFocusTrap: () => void;
  
  // 焦點查詢
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
  getNextFocusableElement: (current: HTMLElement) => HTMLElement | null;
  getPreviousFocusableElement: (current: HTMLElement) => HTMLElement | null;
  
  // 焦點事件
  onFocusEnter: (callback: (element: HTMLElement) => void) => void;
  onFocusLeave: (callback: (element: HTMLElement) => void) => void;
}

/**
 * ARIA Hook 返回類型
 */
export interface UseAriaReturn {
  // ARIA 屬性生成器
  getAriaProps: (config: Partial<AriaConfig>) => Record<string, string | boolean | number | undefined>;
  getAriaLabel: (text: string, context?: string) => string;
  getAriaDescribedBy: (descriptions: string[]) => string;
  
  // 動態 ARIA 更新
  updateAriaLive: (message: string, priority?: 'polite' | 'assertive') => void;
  updateAriaExpanded: (elementId: string, expanded: boolean) => void;
  updateAriaSelected: (elementId: string, selected: boolean) => void;
  
  // ARIA 驗證
  validateAriaStructure: (element: HTMLElement) => AccessibilityIssue[];
  ensureAriaCompliance: (element: HTMLElement) => void;
}

/**
 * 鍵盤導航 Hook 返回類型
 */
export interface UseKeyboardNavigationReturn {
  // 鍵盤事件處理
  handleKeyDown: (event: KeyboardEvent) => void;
  handleKeyUp: (event: KeyboardEvent) => void;
  
  // 導航功能
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  navigateToFirst: () => void;
  navigateToLast: () => void;
  
  // 快捷鍵管理
  registerShortcut: (key: string, action: () => void) => void;
  unregisterShortcut: (key: string) => void;
  listShortcuts: () => Record<string, string>;
  
  // 鍵盤狀態
  isKeyboardActive: boolean;
  lastKeyPressed: string | null;
  modifierKeys: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
}

/**
 * 無障礙性組件 Props
 */
export interface AccessibleComponentProps {
  // 基本無障礙性
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  
  // 互動狀態
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  
  // 實時更新
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  
  // 角色和結構
  role?: string;
  tabIndex?: number;
  
  // 自定義無障礙性
  accessibilityConfig?: Partial<AriaConfig>;
  focusConfig?: Partial<FocusManagementConfig>;
  keyboardConfig?: Partial<KeyboardNavigationConfig>;
}