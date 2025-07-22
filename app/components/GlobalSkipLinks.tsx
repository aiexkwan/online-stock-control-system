/**
 * GlobalSkipLinks Component
 * 全局跳轉連結組件 - 根據當前路徑自動提供適當的跳轉連結
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SkipLinks } from '@/lib/accessibility/components/SkipLink';

interface SkipLinkConfig {
  href: string;
  label: string;
  id?: string;
}

/**
 * 根據路徑獲取跳轉連結配置
 */
function getSkipLinksForPath(pathname: string): SkipLinkConfig[] {
  // Admin 頁面
  if (pathname.startsWith('/admin')) {
    // Admin Dashboard 特定跳轉
    if (
      pathname.includes('/operations') ||
      pathname.includes('/data-management') ||
      pathname.includes('/analytics')
    ) {
      return [
        { href: '#main-content', label: 'Skip to main content' },
        { href: '#dashboard-widgets', label: 'Skip to dashboard widgets' },
        { href: '#history-tree', label: 'Skip to history panel' },
        { href: '#navigation-bar', label: 'Skip to navigation' },
      ];
    }

    // Stock Count 頁面
    if (pathname.includes('/stock-count')) {
      return [
        { href: '#main-content', label: 'Skip to main content' },
        { href: '#stock-count-form', label: 'Skip to stock count form' },
        { href: '#validation-results', label: 'Skip to validation results' },
        { href: '#navigation-bar', label: 'Skip to navigation' },
      ];
    }

    // 通用 Admin 跳轉
    return [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#admin-content', label: 'Skip to admin panel' },
      { href: '#navigation-bar', label: 'Skip to navigation' },
    ];
  }

  // Stock Transfer 頁面
  if (pathname.startsWith('/stock-transfer')) {
    return [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#search-section', label: 'Skip to search' },
      { href: '#transfer-form', label: 'Skip to transfer form' },
      { href: '#transfer-log', label: 'Skip to transfer log' },
      { href: '#navigation-bar', label: 'Skip to navigation' },
    ];
  }

  // Order Loading 頁面
  if (pathname.startsWith('/order-loading')) {
    return [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#order-form', label: 'Skip to order form' },
      { href: '#order-list', label: 'Skip to order list' },
      { href: '#navigation-bar', label: 'Skip to navigation' },
    ];
  }

  // Label Printing 頁面
  if (pathname.startsWith('/print-label') || pathname.startsWith('/print-grnlabel')) {
    return [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#label-form', label: 'Skip to label form' },
      { href: '#preview-section', label: 'Skip to preview' },
      { href: '#navigation-bar', label: 'Skip to navigation' },
    ];
  }

  // Void Pallet 頁面
  if (pathname.startsWith('/void-pallet')) {
    return [
      { href: '#main-content', label: 'Skip to main content' },
      { href: '#void-form', label: 'Skip to void pallet form' },
      { href: '#history-section', label: 'Skip to history' },
      { href: '#navigation-bar', label: 'Skip to navigation' },
    ];
  }

  // 預設跳轉連結
  return [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation-bar', label: 'Skip to navigation' },
    { href: '#footer', label: 'Skip to footer' },
  ];
}

/**
 * 全局跳轉連結組件
 */
export function GlobalSkipLinks() {
  const pathname = usePathname();

  // 排除登入頁面
  if (!pathname || pathname === '/' || pathname.startsWith('/main-login')) {
    return null;
  }

  const links = getSkipLinksForPath(pathname);

  return (
    <SkipLinks links={links} position='top-left' className='sr-only focus-within:not-sr-only' />
  );
}

export default GlobalSkipLinks;
