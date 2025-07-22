'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { getFrequentPaths } from '@/lib/constants/navigation-paths';
import { getNavigationInfo } from '@/config/navigation-map';
import { cn } from '@/lib/utils';

interface QuickAccessProps {
  userId: string;
  className?: string;
}

interface QuickAccessItem {
  path: string;
  label: string;
  icon?: React.ElementType;
  gradient?: string;
}

export function QuickAccess({ userId, className }: QuickAccessProps) {
  const [frequentPaths, setFrequentPaths] = useState<QuickAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadFrequentPaths = async () => {
      try {
        const paths = getFrequentPaths(3);

        // Map paths to navigation items
        const items: QuickAccessItem[] = paths.map(path => {
          const info = getNavigationInfo(path);
          return {
            path,
            ...info,
          };
        });

        setFrequentPaths(items);
      } catch (error) {
        console.error('Failed to load frequent paths:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadFrequentPaths();
    }
  }, [userId]);

  const handleQuickAccess = (path: string) => {
    router.push(path);
  };

  if (isLoading || frequentPaths.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Quick Access Items */}
      <AnimatePresence>
        {frequentPaths.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleQuickAccess(item.path)}
              className={cn(
                'group relative',
                'px-3 py-2',
                'rounded-xl',
                'transition-all duration-200',
                'hover:scale-105'
              )}
              style={{
                background:
                  item.gradient ||
                  'radial-gradient(circle, rgba(156,163,175,0.15) 0%, rgba(107,114,128,0.06) 50%)',
              }}
            >
              {/* Hover Background */}
              <div className='absolute inset-0 rounded-xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100' />

              {/* Content */}
              <div
                className='relative flex items-center gap-2'
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {Icon && <Icon className='h-4 w-4 text-white/80' />}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className='overflow-hidden whitespace-nowrap text-sm font-medium text-white/90'
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Tooltip */}
              <div className='pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
                Quick access to {item.label}
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
