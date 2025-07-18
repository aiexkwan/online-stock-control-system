/**
 * Lazy Widget Loader Component
 * 實現 widget 懶加載功能，只在 widget 進入視窗時加載
 */

import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyWidgetLoaderProps {
  children: React.ReactNode;
  height: number;
  placeholder?: React.ReactNode;
}

export const LazyWidgetLoader: React.FC<LazyWidgetLoaderProps> = React.memo(
  ({ children, height, placeholder }) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current || hasLoaded) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !hasLoaded) {
              setIsIntersecting(true);
              setHasLoaded(true);
              observer.disconnect();
            }
          });
        },
        {
          // Load when widget is within 100px of viewport
          rootMargin: '100px',
          threshold: 0.01,
        }
      );

      observer.observe(containerRef.current);

      return () => {
        observer.disconnect();
      };
    }, [hasLoaded]);

    return (
      <div ref={containerRef} style={{ minHeight: height }} className='h-full w-full'>
        {isIntersecting
          ? children
          : placeholder || (
              <div className='h-full w-full space-y-3 p-4'>
                <Skeleton className='h-4 w-3/4 bg-slate-700' />
                <Skeleton className='h-4 w-1/2 bg-slate-700' />
                <Skeleton className='h-20 w-full bg-slate-700' />
              </div>
            )}
      </div>
    );
  }
);

LazyWidgetLoader.displayName = 'LazyWidgetLoader';
