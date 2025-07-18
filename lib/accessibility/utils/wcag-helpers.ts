/**
 * WCAG Compliance Helpers
 * WCAG 合規性輔助工具 - 實施 WCAG 2.1 AA 標準
 */

import { ColorContrastRatio, WcagLevel, AccessibilityIssue } from '../types';

/**
 * 計算色彩對比度比率
 * @param foreground 前景色 (hex, rgb, 或 rgba)
 * @param background 背景色 (hex, rgb, 或 rgba)
 * @returns 對比度比率和合規性資訊
 */
export function calculateColorContrast(
  foreground: string,
  background: string
): ColorContrastRatio {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  
  // 計算對比度比率 (較亮色 + 0.05) / (較暗色 + 0.05)
  const ratio = foregroundLuminance > backgroundLuminance
    ? (foregroundLuminance + 0.05) / (backgroundLuminance + 0.05)
    : (backgroundLuminance + 0.05) / (foregroundLuminance + 0.05);
  
  // 判定合規級別
  let level: WcagLevel = 'A';
  let isCompliant = false;
  
  if (ratio >= 7) {
    level = 'AAA';
    isCompliant = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    isCompliant = true;
  } else if (ratio >= 3) {
    level = 'A';
    isCompliant = false; // AA 標準要求至少 4.5:1
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    isCompliant
  };
}

/**
 * 計算相對亮度 (Relative Luminance)
 * @param color 顏色值
 * @returns 0-1 的相對亮度值
 */
function getRelativeLuminance(color: string): number {
  const rgb = parseColorToRgb(color);
  
  // 轉換為線性 RGB 值
  const linearRgb = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // 計算相對亮度
  return 0.2126 * linearRgb[0] + 0.7152 * linearRgb[1] + 0.0722 * linearRgb[2];
}

/**
 * 解析顏色為 RGB 值
 * @param color 顏色字符串 (支援 hex, rgb, rgba, hsl)
 * @returns [r, g, b] 陣列
 */
function parseColorToRgb(color: string): [number, number, number] {
  // 移除空格並轉小寫
  const cleanColor = color.replace(/\s/g, '').toLowerCase();
  
  // Hex 格式
  if (cleanColor.startsWith('#')) {
    const hex = cleanColor.slice(1);
    
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16)
      ];
    } else if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
  }
  
  // RGB 格式
  const rgbMatch = cleanColor.match(/rgba?\((\d+),(\d+),(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10)
    ];
  }
  
  // HSL 格式 (簡化處理)
  const hslMatch = cleanColor.match(/hsla?\((\d+),(\d+)%,(\d+)%/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10) / 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;
    
    return hslToRgb(h, s, l);
  }
  
  // 預設為黑色
  console.warn(`無法解析顏色: ${color}`);
  return [0, 0, 0];
}

/**
 * HSL 轉 RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // 灰階
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

/**
 * 檢查大文字的對比度要求 (3:1)
 * @param foreground 前景色
 * @param background 背景色
 * @param fontSize 字體大小 (px)
 * @param fontWeight 字體粗細
 * @returns 是否符合大文字對比度要求
 */
export function checkLargeTextContrast(
  foreground: string,
  background: string,
  fontSize: number,
  fontWeight: number | string = 'normal'
): boolean {
  const contrast = calculateColorContrast(foreground, background);
  
  // 判斷是否為大文字 (18pt+ 或 14pt+ bold)
  const isLargeText = fontSize >= 24 || (fontSize >= 18 && (fontWeight === 'bold' || fontWeight >= 700));
  
  return isLargeText ? contrast.ratio >= 3 : contrast.ratio >= 4.5;
}

/**
 * 生成 WCAG 合規的色彩建議
 * @param baseColor 基礎顏色
 * @param background 背景顏色
 * @param targetRatio 目標對比度比率
 * @returns 調整後的顏色建議
 */
export function generateCompliantColor(
  baseColor: string,
  background: string,
  targetRatio: number = 4.5
): string {
  const backgroundLuminance = getRelativeLuminance(background);
  const baseLuminance = getRelativeLuminance(baseColor);
  
  // 計算需要的亮度
  let targetLuminance: number;
  
  if (baseLuminance > backgroundLuminance) {
    // 前景色較亮，需要調亮
    targetLuminance = (backgroundLuminance + 0.05) * targetRatio - 0.05;
  } else {
    // 前景色較暗，需要調暗
    targetLuminance = (backgroundLuminance + 0.05) / targetRatio - 0.05;
  }
  
  // 限制在有效範圍內
  targetLuminance = Math.max(0, Math.min(1, targetLuminance));
  
  // 調整原色彩的亮度
  const baseRgb = parseColorToRgb(baseColor);
  const adjustedRgb = adjustLuminance(baseRgb, targetLuminance);
  
  return `rgb(${adjustedRgb[0]}, ${adjustedRgb[1]}, ${adjustedRgb[2]})`;
}

/**
 * 調整RGB顏色的亮度到目標亮度
 */
function adjustLuminance(
  rgb: [number, number, number],
  targetLuminance: number
): [number, number, number] {
  // 簡化調整：等比例調整所有通道
  const currentLuminance = getRelativeLuminance(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  const factor = Math.sqrt(targetLuminance / currentLuminance);
  
  return [
    Math.round(Math.min(255, rgb[0] * factor)),
    Math.round(Math.min(255, rgb[1] * factor)),
    Math.round(Math.min(255, rgb[2] * factor))
  ];
}

/**
 * 檢查元素是否可聚焦
 * @param element HTML 元素
 * @returns 是否可聚焦
 */
export function isElementFocusable(element: HTMLElement): boolean {
  // 檢查基本條件
  if (!element || element.tabIndex === -1) return false;
  
  // 檢查是否被隱藏
  if (element.hidden || 
      getComputedStyle(element).display === 'none' ||
      getComputedStyle(element).visibility === 'hidden') {
    return false;
  }
  
  // 檢查是否被禁用
  if (element.hasAttribute('disabled')) return false;
  
  // 可聚焦的元素類型
  const focusableSelectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];
  
  return focusableSelectors.some(selector => element.matches(selector));
}

/**
 * 獲取容器內所有可聚焦元素
 * @param container 容器元素
 * @returns 可聚焦元素陣列
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
  
  return elements.filter(element => {
    return isElementFocusable(element) && 
           isElementVisible(element);
  });
}

/**
 * 檢查元素是否可見
 * @param element HTML 元素
 * @returns 是否可見
 */
function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  
  return rect.width > 0 && 
         rect.height > 0 && 
         style.opacity !== '0' &&
         style.display !== 'none' &&
         style.visibility !== 'hidden';
}

/**
 * 驗證 ARIA 標籤的有效性
 * @param element HTML 元素
 * @returns 驗證問題陣列
 */
export function validateAriaLabels(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // 檢查必要的 ARIA 標籤
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  
  // 互動元素必須有可訪問的名稱
  if (isElementFocusable(element) && !ariaLabel && !ariaLabelledBy && !element.textContent?.trim()) {
    issues.push({
      id: `missing-accessible-name-${Date.now()}`,
      severity: 'error',
      type: 'aria-labels',
      element: element.tagName.toLowerCase(),
      description: '互動元素缺少可訪問的名稱',
      suggestion: '添加 aria-label 或 aria-labelledby 屬性',
      wcagReference: 'WCAG 4.1.2'
    });
  }
  
  // 檢查 ARIA 狀態
  if (role === 'button' || element.tagName.toLowerCase() === 'button') {
    const ariaExpanded = element.getAttribute('aria-expanded');
    const ariaPressed = element.getAttribute('aria-pressed');
    
    if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
      issues.push({
        id: `invalid-aria-expanded-${Date.now()}`,
        severity: 'error',
        type: 'aria-labels',
        element: element.tagName.toLowerCase(),
        description: 'aria-expanded 屬性值無效',
        suggestion: '使用 "true" 或 "false"',
        wcagReference: 'WCAG 4.1.2'
      });
    }
  }
  
  return issues;
}

/**
 * 檢查語義化 HTML 結構
 * @param container 容器元素
 * @returns 語義化問題陣列
 */
export function validateSemanticStructure(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // 檢查標題層級
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && level !== 1) {
      issues.push({
        id: `heading-start-${Date.now()}`,
        severity: 'warning',
        type: 'semantic-html',
        element: heading.tagName.toLowerCase(),
        description: '頁面應該從 h1 開始',
        suggestion: '使用 h1 作為主標題',
        wcagReference: 'WCAG 1.3.1'
      });
    }
    
    if (level > previousLevel + 1) {
      issues.push({
        id: `heading-skip-${Date.now()}`,
        severity: 'warning',
        type: 'semantic-html',
        element: heading.tagName.toLowerCase(),
        description: '跳過標題層級',
        suggestion: `在 h${previousLevel} 後使用 h${previousLevel + 1}`,
        wcagReference: 'WCAG 1.3.1'
      });
    }
    
    previousLevel = level;
  });
  
  // 檢查地標元素
  const hasMain = container.querySelector('main');
  if (!hasMain && container.tagName.toLowerCase() !== 'main') {
    issues.push({
      id: `missing-main-${Date.now()}`,
      severity: 'warning',
      type: 'semantic-html',
      element: 'document',
      description: '缺少 main 地標',
      suggestion: '添加 <main> 元素包裹主要內容',
      wcagReference: 'WCAG 1.3.1'
    });
  }
  
  return issues;
}

/**
 * 檢查顏色對比度合規性
 * @param container 容器元素
 * @returns 對比度問題陣列
 */
export function auditColorContrast(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  
  // 獲取所有文字元素
  const textElements = container.querySelectorAll('*');
  
  textElements.forEach(element => {
    const style = getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;
    
    // 如果背景色透明，尋找父元素的背景色
    let actualBackground = backgroundColor;
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      let parent = element.parentElement;
      while (parent && actualBackground === 'rgba(0, 0, 0, 0)') {
        actualBackground = getComputedStyle(parent).backgroundColor;
        parent = parent.parentElement;
      }
      // 如果仍然透明，假設為白色背景
      if (actualBackground === 'rgba(0, 0, 0, 0)') {
        actualBackground = '#ffffff';
      }
    }
    
    // 檢查對比度
    const contrast = calculateColorContrast(color, actualBackground);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = style.fontWeight;
    
    if (!checkLargeTextContrast(color, actualBackground, fontSize, fontWeight)) {
      issues.push({
        id: `color-contrast-${Date.now()}`,
        severity: 'error',
        type: 'color-contrast',
        element: element.tagName.toLowerCase(),
        description: `顏色對比度不足 (${contrast.ratio}:1)`,
        suggestion: '增加顏色對比度至少 4.5:1 (普通文字) 或 3:1 (大文字)',
        wcagReference: 'WCAG 1.4.3'
      });
    }
  });
  
  return issues;
}

/**
 * 運行完整的無障礙性審核
 * @param container 要審核的容器
 * @returns 完整的審核結果
 */
export function runAccessibilityAudit(container: HTMLElement): {
  passed: boolean;
  issues: AccessibilityIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
} {
  const allIssues: AccessibilityIssue[] = [
    ...validateSemanticStructure(container),
    ...auditColorContrast(container),
    ...validateAriaLabels(container)
  ];
  
  const summary = {
    total: allIssues.length,
    errors: allIssues.filter(issue => issue.severity === 'error').length,
    warnings: allIssues.filter(issue => issue.severity === 'warning').length,
    info: allIssues.filter(issue => issue.severity === 'info').length
  };
  
  return {
    passed: summary.errors === 0,
    issues: allIssues,
    summary
  };
}