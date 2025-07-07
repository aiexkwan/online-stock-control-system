/**
 * Virtual Container React Component
 * 用於測試和使用虛擬化功能
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VirtualWidgetContainer } from '../enhanced-registry';
import { WidgetDefinition } from '../types';

export interface VirtualContainerProps {
  widgets: WidgetDefinition[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  children?: (visibleWidgets: WidgetDefinition[]) => React.ReactNode;
}

export const VirtualContainer: React.FC<VirtualContainerProps> = ({
  widgets,
  itemHeight,
  containerHeight,
  overscan = 2,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [virtualizer] = useState(() => 
    new VirtualWidgetContainer({
      widgets,
      itemHeight,
      containerHeight,
      overscan
    })
  );
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetDefinition[]>([]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      virtualizer.updateScrollPosition(containerRef.current.scrollTop);
      setVisibleWidgets(virtualizer.getVisibleWidgets());
    }
  }, [virtualizer]);

  useEffect(() => {
    // Initial render
    setVisibleWidgets(virtualizer.getVisibleWidgets());
  }, [virtualizer]);

  const totalHeight = widgets.length * itemHeight;
  const visibleRange = virtualizer.getVisibleRange();

  return (
    <div
      ref={containerRef}
      className="virtual-container"
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {children ? (
          children(visibleWidgets)
        ) : (
          visibleWidgets.map((widget, index) => (
            <div
              key={widget.id}
              data-testid={`widget-${widget.id}`}
              style={{
                position: 'absolute',
                top: (visibleRange.start + index) * itemHeight,
                height: itemHeight,
                width: '100%'
              }}
            >
              {widget.name || widget.id}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Hook for using virtualization
 */
export const useVirtualization = (config: {
  widgets: WidgetDefinition[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [virtualizer] = useState(() => new VirtualWidgetContainer(config));
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetDefinition[]>([]);

  const updateScrollPosition = useCallback((scrollTop: number) => {
    virtualizer.updateScrollPosition(scrollTop);
    setVisibleWidgets(virtualizer.getVisibleWidgets());
  }, [virtualizer]);

  useEffect(() => {
    setVisibleWidgets(virtualizer.getVisibleWidgets());
  }, [virtualizer]);

  return {
    visibleWidgets,
    totalHeight: config.widgets.length * config.itemHeight,
    updateScrollPosition,
    visibleRange: virtualizer.getVisibleRange()
  };
};