/**
 * Layout Virtualization Hook
 * 簡化版 - 移除虛擬化功能，保持接口兼容
 */

import { useRef } from 'react';

interface UseLayoutVirtualizationOptions {
  widgetCount: number;
  theme: string;
  threshold?: number;
}

export function useLayoutVirtualization(options: UseLayoutVirtualizationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 簡化版：只返回 ref，不再實施虛擬化
  // 虛擬化功能已移除，因為現代瀏覽器性能足夠處理合理數量的 widgets
  
  return containerRef;
}
