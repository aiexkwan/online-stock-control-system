/**
 * Layout Virtualization Hook
 * 統一處理各個 Layout 組件的虛擬化初始化
 */

import { useEffect, useRef } from 'react';
import { widgetRegistry } from '@/lib/widgets/enhanced-registry';

interface UseLayoutVirtualizationOptions {
  widgetCount: number;
  theme: string;
  threshold?: number;
}

export function useLayoutVirtualization(options: UseLayoutVirtualizationOptions) {
  const { widgetCount, theme, threshold = 100 } = options;
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化 GridVirtualizer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 建立 GridVirtualizer
    const gridVirtualizer = widgetRegistry.createGridVirtualizer({
      widgets: Array.from({ length: widgetCount }, (_, index) => ({
        id: `${theme}-widget-${index}`,
        gridArea: `item-${index + 1}`,
      })),
      viewportHeight: window.innerHeight,
      threshold,
    });

    return () => {
      // 清理 virtualizer
      const currentVirtualizer = widgetRegistry.getGridVirtualizer();
      if (currentVirtualizer) {
        currentVirtualizer.destroy();
      }
    };
  }, [widgetCount, theme, threshold]);

  // 監聽視口變化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const currentVirtualizer = widgetRegistry.getGridVirtualizer();
      if (currentVirtualizer && containerRef.current) {
        // 更新視口高度
        const newConfig = {
          widgets: Array.from({ length: widgetCount }, (_, index) => ({
            id: `${theme}-widget-${index}`,
            gridArea: `item-${index + 1}`,
          })),
          viewportHeight: window.innerHeight,
          threshold,
        };

        // 重新創建 virtualizer
        widgetRegistry.createGridVirtualizer(newConfig);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [widgetCount, theme, threshold]);

  return containerRef;
}
