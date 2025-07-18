/**
 * SkipLink Component
 * 跳過連結組件 - 提供鍵盤用戶快速跳轉的無障礙功能
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkipLinkProps {
  /**
   * 跳轉目標的ID或選擇器
   */
  href: string;
  
  /**
   * 連結文字
   */
  children: React.ReactNode;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * 連結位置
   */
  position?: 'top-left' | 'top-center' | 'top-right';
  
  /**
   * 點擊回調
   */
  onClick?: () => void;
}

/**
 * SkipLink 組件
 * 實施 WCAG 2.1 AA 標準的跳過連結功能
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className,
  position = 'top-left',
  onClick,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector(href);
    
    if (target) {
      event.preventDefault();
      
      // 設置焦點到目標元素
      if (target instanceof HTMLElement) {
        target.focus();
        
        // 如果目標元素不可聚焦，設置 tabindex
        if (target.tabIndex === -1) {
          target.tabIndex = -1;
          target.focus();
        }
        
        // 滾動到目標元素
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
    
    onClick?.();
  };

  const positionClasses = {
    'top-left': 'left-2 top-2',
    'top-center': 'left-1/2 top-2 -translate-x-1/2',
    'top-right': 'right-2 top-2',
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        // 基本樣式
        'fixed z-[10001] px-4 py-2 text-white font-medium',
        'bg-blue-600 border-2 border-blue-700 rounded-md',
        'text-sm leading-none whitespace-nowrap',
        
        // 隱藏和顯示邏輯
        'opacity-0 pointer-events-none',
        'transform -translate-y-12 transition-all duration-200',
        
        // 聚焦時顯示
        'focus:opacity-100 focus:pointer-events-auto focus:translate-y-0',
        
        // 位置
        positionClasses[position],
        
        // 高對比度支援
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600',
        
        className
      )}
      // 無障礙性屬性
      aria-label={typeof children === 'string' ? children : '跳過連結'}
      tabIndex={0}
    >
      {children}
    </a>
  );
};

/**
 * SkipLinks 組件 - 管理多個跳過連結
 */
export interface SkipLinksProps {
  /**
   * 跳過連結列表
   */
  links: Array<{
    href: string;
    label: string;
    id?: string;
  }>;
  
  /**
   * 容器位置
   */
  position?: 'top-left' | 'top-center' | 'top-right';
  
  /**
   * 自定義CSS類名
   */
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links,
  position = 'top-left',
  className,
}) => {
  if (links.length === 0) return null;

  const positionClasses = {
    'top-left': 'left-2 top-2',
    'top-center': 'left-1/2 top-2 -translate-x-1/2',
    'top-right': 'right-2 top-2',
  };

  return (
    <nav
      className={cn(
        'fixed z-[10001] flex flex-col gap-1',
        positionClasses[position],
        className
      )}
      aria-label="跳過連結導航"
    >
      {links.map((link, index) => (
        <SkipLink
          key={link.id || index}
          href={link.href}
          position={position}
          className="relative left-0 top-0 transform-none" // 重置位置樣式
        >
          {link.label}
        </SkipLink>
      ))}
    </nav>
  );
};

/**
 * 常用的跳過連結預設配置
 */
export const commonSkipLinks = {
  /**
   * 標準網頁跳過連結
   */
  standard: [
    { href: '#main-content', label: '跳到主要內容' },
    { href: '#main-navigation', label: '跳到主導航' },
    { href: '#search', label: '跳到搜索' },
    { href: '#footer', label: '跳到頁腳' },
  ],
  
  /**
   * 管理頁面跳過連結
   */
  admin: [
    { href: '#main-content', label: '跳到主要內容' },
    { href: '#sidebar-navigation', label: '跳到側邊欄導航' },
    { href: '#dashboard-widgets', label: '跳到儀表板組件' },
    { href: '#user-menu', label: '跳到用戶選單' },
  ],
  
  /**
   * 表單頁面跳過連結
   */
  form: [
    { href: '#form-content', label: '跳到表單' },
    { href: '#form-errors', label: '跳到錯誤訊息' },
    { href: '#form-actions', label: '跳到表單動作' },
  ],
  
  /**
   * 列表/表格頁面跳過連結
   */
  table: [
    { href: '#table-content', label: '跳到表格內容' },
    { href: '#table-filters', label: '跳到篩選器' },
    { href: '#table-pagination', label: '跳到分頁' },
  ],
};

/**
 * useSkipLinks Hook - 便於在組件中使用跳過連結
 */
export function useSkipLinks(type: keyof typeof commonSkipLinks = 'standard') {
  const links = commonSkipLinks[type];
  
  return {
    links,
    SkipLinksComponent: (props: Omit<SkipLinksProps, 'links'>) => (
      <SkipLinks links={links} {...props} />
    ),
  };
}

export default SkipLink;