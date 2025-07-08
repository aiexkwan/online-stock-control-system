'use client';

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { NavigationItem } from './NavigationItem';
import { NavigationItem as NavItemType } from '@/config/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedNavigationProps {
  items: NavItemType[];
  activeItem: string | null;
  onActiveChange: (itemId: string | null) => void;
  className?: string;
}

export function VirtualizedNavigation({
  items,
  activeItem,
  onActiveChange,
  className,
}: VirtualizedNavigationProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 監測容器寬度變化
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.offsetWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 計算每個項目的寬度（假設固定寬度）
  const itemWidth = 120; // 可以根據實際需要調整
  const gap = 8; // 項目之間的間隙

  // 使用虛擬化來優化大量導航項的渲染
  const virtualizer = useVirtualizer({
    horizontal: true,
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => itemWidth + gap, []),
    overscan: 3, // 預渲染前後 3 個項目
  });

  // 優化的渲染函數
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`scrollbar-hide flex items-center gap-2 overflow-x-auto ${className}`}
      style={{
        contain: 'layout style paint', // CSS containment 優化
      }}
    >
      <div
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map(virtualItem => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${itemWidth}px`,
                height: '100%',
                transform: `translateX(${virtualItem.start}px)`,
              }}
            >
              <NavigationItem
                item={item}
                isActive={activeItem === item.id}
                onActiveChange={onActiveChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 用於大量子菜單項的虛擬化列表
interface VirtualizedSubMenuProps {
  items: any[];
  onItemClick: (item: any) => void;
  className?: string;
}

export function VirtualizedSubMenu({ items, onItemClick, className }: VirtualizedSubMenuProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemHeight = 48; // 每個子菜單項的高度

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => itemHeight, []),
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`max-h-[300px] overflow-y-auto ${className}`}
      style={{
        contain: 'layout style paint',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map(virtualItem => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${itemHeight}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <button
                onClick={() => onItemClick(item)}
                className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5'
              >
                <span className='text-sm font-medium'>{item.label}</span>
                {item.description && (
                  <span className='text-xs text-white/60'>{item.description}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
