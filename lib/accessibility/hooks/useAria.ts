/**
 * useAria Hook
 * ARIA 支援Hook - 提供完整的ARIA屬性管理和輔助功能
 */

'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { UseAriaReturn, AriaConfig, AccessibilityIssue } from '../types';
import { useAccessibility } from '../providers/AccessibilityProvider';
import { validateAriaLabels } from '../utils/wcag-helpers';

/**
 * ARIA Hook
 * @param defaultConfig 預設配置
 * @returns ARIA 功能
 */
export function useAria(defaultConfig?: Partial<AriaConfig>): UseAriaReturn {
  const { announce } = useAccessibility();
  const liveRegionsRef = useRef<Map<string, HTMLElement>>(new Map());

  /**
   * 生成ARIA屬性
   * @param config ARIA配置
   * @returns ARIA屬性對象
   */
  const getAriaProps = useCallback((config: Partial<AriaConfig> = {}): Record<string, string | boolean | number | undefined> => {
    const mergedConfig = { ...defaultConfig, ...config };
    const props: Record<string, string | boolean | number | undefined> = {};

    // 基本標籤屬性
    if (mergedConfig.label) {
      props['aria-label'] = mergedConfig.label;
    }
    
    if (mergedConfig.labelledBy) {
      props['aria-labelledby'] = mergedConfig.labelledBy;
    }
    
    if (mergedConfig.describedBy) {
      props['aria-describedby'] = mergedConfig.describedBy;
    }

    // 狀態屬性
    if (mergedConfig.expanded !== undefined) {
      props['aria-expanded'] = mergedConfig.expanded;
    }
    
    if (mergedConfig.selected !== undefined) {
      props['aria-selected'] = mergedConfig.selected;
    }
    
    if (mergedConfig.checked !== undefined) {
      props['aria-checked'] = mergedConfig.checked;
    }
    
    if (mergedConfig.disabled !== undefined) {
      props['aria-disabled'] = mergedConfig.disabled;
    }
    
    if (mergedConfig.hidden !== undefined) {
      props['aria-hidden'] = mergedConfig.hidden;
    }

    // 實時更新屬性
    if (mergedConfig.live) {
      props['aria-live'] = mergedConfig.live;
    }
    
    if (mergedConfig.atomic !== undefined) {
      props['aria-atomic'] = mergedConfig.atomic;
    }
    
    if (mergedConfig.relevant) {
      props['aria-relevant'] = mergedConfig.relevant;
    }

    return props;
  }, [defaultConfig]);

  /**
   * 生成ARIA標籤
   * @param text 標籤文字
   * @param context 上下文
   * @returns 完整的ARIA標籤
   */
  const getAriaLabel = useCallback((text: string, context?: string): string => {
    if (context) {
      return `${context}: ${text}`;
    }
    return text;
  }, []);

  /**
   * 生成ARIA描述ID
   * @param descriptions 描述陣列
   * @returns 空格分隔的ID字符串
   */
  const getAriaDescribedBy = useCallback((descriptions: string[]): string => {
    return descriptions.join(' ');
  }, []);

  /**
   * 更新ARIA實時區域
   * @param message 訊息
   * @param priority 優先級
   */
  const updateAriaLive = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    // 使用全域宣告功能
    announce(message, priority);

    // 同時更新本地實時區域（如果存在）
    const regionId = `live-region-${priority}`;
    const region = liveRegionsRef.current.get(regionId);
    
    if (region) {
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }, [announce]);

  /**
   * 更新ARIA展開狀態
   * @param elementId 元素ID
   * @param expanded 是否展開
   */
  const updateAriaExpanded = useCallback((elementId: string, expanded: boolean): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
      
      // 宣告狀態變化
      const label = element.getAttribute('aria-label') || element.textContent || '元素';
      updateAriaLive(`${label} ${expanded ? '已展開' : '已收合'}`);
    }
  }, [updateAriaLive]);

  /**
   * 更新ARIA選中狀態
   * @param elementId 元素ID
   * @param selected 是否選中
   */
  const updateAriaSelected = useCallback((elementId: string, selected: boolean): void => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-selected', selected.toString());
      
      // 宣告狀態變化
      const label = element.getAttribute('aria-label') || element.textContent || '項目';
      if (selected) {
        updateAriaLive(`已選擇 ${label}`);
      }
    }
  }, [updateAriaLive]);

  /**
   * 驗證ARIA結構
   * @param element 要驗證的元素
   * @returns 驗證問題陣列
   */
  const validateAriaStructure = useCallback((element: HTMLElement): AccessibilityIssue[] => {
    return validateAriaLabels(element);
  }, []);

  /**
   * 確保ARIA合規性
   * @param element 元素
   */
  const ensureAriaCompliance = useCallback((element: HTMLElement): void => {
    const issues = validateAriaStructure(element);
    
    // 自動修復一些常見問題
    issues.forEach(issue => {
      if (issue.type === 'aria-labels') {
        if (issue.description.includes('缺少可訪問的名稱')) {
          // 嘗試從內容生成標籤
          const textContent = element.textContent?.trim();
          if (textContent && !element.getAttribute('aria-label')) {
            element.setAttribute('aria-label', textContent);
          }
        }
      }
    });

    // 記錄剩餘問題
    const remainingIssues = validateAriaStructure(element);
    if (remainingIssues.length > 0) {
      console.warn('ARIA合規性問題:', remainingIssues);
    }
  }, [validateAriaStructure]);

  return {
    getAriaProps,
    getAriaLabel,
    getAriaDescribedBy,
    updateAriaLive,
    updateAriaExpanded,
    updateAriaSelected,
    validateAriaStructure,
    ensureAriaCompliance,
  };
}

/**
 * ARIA標籤生成器Hook
 * @param options 配置選項
 */
export function useAriaLabels(options: {
  prefix?: string;
  includeIndex?: boolean;
  includeTotal?: boolean;
} = {}) {
  const { getAriaLabel } = useAria();

  /**
   * 生成列表項標籤
   * @param item 項目內容
   * @param index 索引
   * @param total 總數
   * @returns ARIA標籤
   */
  const getListItemLabel = useCallback((
    item: string,
    index?: number,
    total?: number
  ): string => {
    let label = item;
    
    if (options.prefix) {
      label = `${options.prefix} ${label}`;
    }
    
    if (options.includeIndex && index !== undefined) {
      label = `第 ${index + 1} 項: ${label}`;
    }
    
    if (options.includeTotal && total !== undefined) {
      label = `${label} (共 ${total} 項中的第 ${(index || 0) + 1} 項)`;
    }
    
    return getAriaLabel(label);
  }, [getAriaLabel, options]);

  /**
   * 生成按鈕標籤
   * @param action 動作
   * @param target 目標
   * @param state 狀態
   * @returns ARIA標籤
   */
  const getButtonLabel = useCallback((
    action: string,
    target?: string,
    state?: string
  ): string => {
    let label = action;
    
    if (target) {
      label = `${action} ${target}`;
    }
    
    if (state) {
      label = `${label} (${state})`;
    }
    
    return getAriaLabel(label);
  }, [getAriaLabel]);

  /**
   * 生成狀態標籤
   * @param element 元素名稱
   * @param status 狀態
   * @param value 值
   * @returns ARIA標籤
   */
  const getStatusLabel = useCallback((
    element: string,
    status: string,
    value?: string | number
  ): string => {
    let label = `${element} ${status}`;
    
    if (value !== undefined) {
      label = `${label}: ${value}`;
    }
    
    return getAriaLabel(label);
  }, [getAriaLabel]);

  return {
    getListItemLabel,
    getButtonLabel,
    getStatusLabel,
  };
}

/**
 * ARIA實時區域Hook
 * @param regionId 區域ID
 * @param priority 預設優先級
 */
export function useAriaLiveRegion(
  regionId?: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const regionRef = useRef<HTMLDivElement>(null);
  const { updateAriaLive } = useAria();

  // 創建實時區域
  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;

    // 設置ARIA屬性
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('aria-relevant', 'additions text');
    
    // 隱藏但保持可訪問
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';

    if (regionId) {
      region.id = regionId;
    }
  }, [regionId, priority]);

  /**
   * 宣告訊息
   * @param message 訊息內容
   * @param customPriority 自訂優先級
   */
  const announce = useCallback((
    message: string,
    customPriority?: 'polite' | 'assertive'
  ): void => {
    const region = regionRef.current;
    if (!region) {
      // 回退到全域宣告
      updateAriaLive(message, customPriority || priority);
      return;
    }

    // 更新優先級（如果指定）
    if (customPriority) {
      region.setAttribute('aria-live', customPriority);
    }

    // 清空後設置新訊息
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // 恢復原優先級
    if (customPriority && customPriority !== priority) {
      setTimeout(() => {
        region.setAttribute('aria-live', priority);
      }, 1000);
    }
  }, [priority, updateAriaLive]);

  return {
    regionRef,
    announce,
  };
}

/**
 * ARIA描述Hook
 * @param descriptions 描述配置
 */
export function useAriaDescriptions(descriptions: Array<{
  id: string;
  content: string;
  persistent?: boolean;
}>) {
  const descriptionsRef = useRef<Map<string, HTMLElement>>(new Map());

  // 創建描述元素
  useEffect(() => {
    descriptions.forEach(({ id, content, persistent = true }) => {
      if (descriptionsRef.current.has(id)) return;

      const element = document.createElement('div');
      element.id = id;
      element.textContent = content;
      element.style.display = 'none';

      document.body.appendChild(element);
      descriptionsRef.current.set(id, element);
    });

    // 清理函數
    return () => {
      const currentDescriptions = descriptionsRef.current;
      if (!descriptions.some(d => d.persistent)) {
        currentDescriptions.forEach((element, id) => {
          const desc = descriptions.find(d => d.id === id);
          if (!desc?.persistent && document.body.contains(element)) {
            document.body.removeChild(element);
            currentDescriptions.delete(id);
          }
        });
      }
    };
  }, [descriptions]);

  /**
   * 更新描述內容
   * @param id 描述ID
   * @param content 新內容
   */
  const updateDescription = useCallback((id: string, content: string): void => {
    const element = descriptionsRef.current.get(id);
    if (element) {
      element.textContent = content;
    }
  }, []);

  /**
   * 獲取描述ID字符串
   * @param ids 描述ID陣列
   * @returns 空格分隔的ID字符串
   */
  const getDescribedBy = useCallback((ids: string[]): string => {
    return ids.filter(id => descriptionsRef.current.has(id)).join(' ');
  }, []);

  return {
    updateDescription,
    getDescribedBy,
  };
}

/**
 * ARIA角色Hook
 * @param defaultRole 預設角色
 */
export function useAriaRole(defaultRole?: string) {
  /**
   * 獲取角色屬性
   * @param role 角色名稱
   * @param additionalProps 額外屬性
   * @returns 角色相關屬性
   */
  const getRoleProps = useCallback((
    role?: string,
    additionalProps?: Record<string, unknown>
  ): Record<string, unknown> => {
    const props: Record<string, unknown> = {
      role: role || defaultRole,
      ...additionalProps,
    };

    // 根據角色添加必要的屬性
    const currentRole = role || defaultRole;
    
    switch (currentRole) {
      case 'button':
        if (!props['aria-pressed'] && !props['aria-expanded']) {
          props.tabIndex = props.tabIndex ?? 0;
        }
        break;
        
      case 'tab':
        props['aria-selected'] = props['aria-selected'] ?? false;
        break;
        
      case 'tabpanel':
        props.tabIndex = props.tabIndex ?? 0;
        break;
        
      case 'menuitem':
        props.tabIndex = props.tabIndex ?? -1;
        break;
        
      case 'option':
        props['aria-selected'] = props['aria-selected'] ?? false;
        break;
        
      case 'checkbox':
        props['aria-checked'] = props['aria-checked'] ?? false;
        break;
        
      case 'radio':
        props['aria-checked'] = props['aria-checked'] ?? false;
        break;
    }

    return props;
  }, [defaultRole]);

  return { getRoleProps };
}

export default useAria;