'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/mobile-config';

interface OrderSummary {
  orderRef: string;
  totalQty: number;
  loadedQty: number;
  percentage: number;
  itemCount: number;
  completedItems: number;
}

interface VirtualizedOrderListProps {
  orders: string[];
  orderSummaries: Map<string, OrderSummary>;
  selectedOrderRef: string | null;
  searchQuery: string;
  onOrderSelect: (orderRef: string) => void;
  itemHeight?: number;
  containerHeight?: number;
}

export function VirtualizedOrderList({
  orders,
  orderSummaries,
  selectedOrderRef,
  searchQuery,
  onOrderSelect,
  itemHeight = 80,
  containerHeight = 400,
}: VirtualizedOrderListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // Filter orders based on search query
  const filteredOrders = orders.filter(orderRef =>
    orderRef.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalHeight = filteredOrders.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const buffer = 5; // Number of items to render outside visible area

  // Calculate visible range
  useEffect(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(filteredOrders.length, start + visibleCount + buffer * 2);
    setVisibleRange({ start, end });
  }, [scrollTop, filteredOrders.length, itemHeight, visibleCount, buffer]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll selected item into view only on initial selection
  useEffect(() => {
    if (selectedOrderRef && containerRef.current && !scrollTop) {
      const index = filteredOrders.indexOf(selectedOrderRef);
      if (index !== -1) {
        const itemTop = index * itemHeight;
        const itemBottom = itemTop + itemHeight;
        const containerScrollTop = containerRef.current.scrollTop;
        const containerBottom = containerScrollTop + containerHeight;

        // Only scroll if item is not visible
        if (itemTop < containerScrollTop || itemBottom > containerBottom) {
          const scrollPosition = Math.max(0, itemTop - containerHeight / 2 + itemHeight / 2);
          containerRef.current.scrollTop = scrollPosition;
        }
      }
    }
  }, [selectedOrderRef, filteredOrders, scrollTop, itemHeight, containerHeight]);

  const visibleItems = filteredOrders.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className='custom-scrollbar relative overflow-y-auto rounded-lg border border-slate-600/30'
      style={{ height: `${containerHeight}px`, minHeight: '200px' }}
      onScroll={handleScroll}
    >
      {/* Virtual scroll spacer */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Render only visible items */}
        {visibleItems.map((orderRef, index) => {
          const actualIndex = visibleRange.start + index;
          const summary = orderSummaries.get(orderRef);
          const isSelected = selectedOrderRef === orderRef;
          const isComplete = summary && summary.percentage === 100;

          return (
            <div
              key={orderRef}
              style={{
                position: 'absolute',
                top: `${actualIndex * itemHeight}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`,
                padding: '8px',
              }}
            >
              <button
                onClick={() => onOrderSelect(orderRef)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 transition-all duration-200',
                  'flex items-center justify-between',
                  isSelected
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : isComplete
                      ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                )}
              >
                <div className='flex items-center gap-3'>
                  <span className='font-semibold'>{orderRef}</span>
                  {isComplete && <CheckCircleIcon className='h-5 w-5 text-green-400' />}
                </div>
                {summary && (
                  <div className='flex items-center gap-4 text-sm'>
                    <span
                      className={cn('font-medium', isComplete ? 'text-green-400' : 'text-gray-400')}
                    >
                      {summary.loadedQty}/{summary.totalQty}
                    </span>
                    <div className='h-2 w-20 rounded-full bg-gray-700'>
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${summary.percentage}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-12 text-right font-medium',
                        isComplete ? 'text-green-400' : 'text-gray-400'
                      )}
                    >
                      {Math.round(summary.percentage)}%
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 自定義滾動條樣式
export const virtualScrollStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1f2937;
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
`;
