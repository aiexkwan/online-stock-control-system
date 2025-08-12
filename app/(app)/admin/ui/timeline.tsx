'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TimelineItem {
  id?: string;
  date: string;
  title: string;
  description?: string;
  href?: string;
  icon?: React.ReactNode;
  className?: string; // Add support for custom className
  dotClassName?: string; // Add support for custom dot color
}

interface TimelineProps {
  items: TimelineItem[];
  initialCount?: number;
  dateFormat?: Intl.DateTimeFormatOptions;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
  dotClassName?: string;
  lineClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg';
  animationDuration?: number;
  animationDelay?: number;
  showAnimation?: boolean;
}

function DesktopTimelineEntry({
  item,
  index,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
}: {
  item: TimelineItem;
  index: number;
  dotClassName?: string;
  lineClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  const isLeft = index % 2 === 0;
  return (
    <div
      className={cn(
        'group relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:grid',
        !item.href && 'pointer-events-none'
      )}
    >
      {/* 左側內容 */}
      <div className={cn('text-right', !isLeft && 'invisible')}>
        {isLeft && (
          <div 
            className='space-y-1 p-3 rounded-lg transition-all hover:scale-[1.02]'
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3
              className={cn(
                'text-base font-medium tracking-tight transition-colors',
                titleClassName,
                item.className
              )}
            >
              {item.title}
            </h3>
            {item.description && (
              <p
                className={cn(
                  'text-sm',
                  descriptionClassName
                )}
              >
                {item.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 中間線同點 */}
      <div className='relative flex flex-col items-center'>
        <div className={cn('h-16 border-l border-border', lineClassName)} />
        <div
          className={cn(
            'absolute top-[1.6875rem] flex h-5 w-5 items-center justify-center rounded-full transition-colors',
            !item.icon && 'h-2.5 w-2.5',
            item.dotClassName || dotClassName || 'bg-primary/60'
          )}
        >
          {item.icon && <div className='h-3 w-3 text-white'>{item.icon}</div>}
        </div>
      </div>

      {/* 右側內容 */}
      <div className={cn('text-left', isLeft && 'invisible')}>
        {!isLeft && (
          <div 
            className='space-y-1 p-3 rounded-lg transition-all hover:scale-[1.02]'
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3
              className={cn(
                'text-base font-medium tracking-tight transition-colors',
                titleClassName,
                item.className
              )}
            >
              {item.title}
            </h3>
            {item.description && (
              <p
                className={cn(
                  'text-sm',
                  descriptionClassName
                )}
              >
                {item.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileTimelineEntry({
  item,
  index,
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
}: {
  item: TimelineItem;
  index: number;
  dotClassName?: string;
  lineClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  const isLeft = index % 2 === 0;
  return (
    <div
      className={cn(
        'flex items-start space-x-4 rounded-lg px-4 py-3 transition-all hover:scale-[1.01] md:hidden',
        isLeft ? 'flex-row' : 'flex-row-reverse space-x-reverse'
      )}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className='relative flex-shrink-0'>
        <div className={cn('h-16 border-l border-white/20', lineClassName)} />
        <div
          className={cn(
            'absolute -left-1 top-5 flex h-5 w-5 items-center justify-center rounded-full',
            !item.icon && 'h-2.5 w-2.5',
            item.dotClassName || dotClassName || 'bg-white/60'
          )}
        >
          {item.icon && <div className='h-3 w-3 text-white'>{item.icon}</div>}
        </div>
      </div>
      <div className={cn('flex-1 space-y-1', !isLeft && 'text-right')}>
        <h3 className={cn('text-base font-medium tracking-tight', titleClassName, item.className)}>
          {item.title}
        </h3>
        {item.description && (
          <p className={cn('text-sm', descriptionClassName)}>
            {item.description}
          </p>
        )}
        <time
          dateTime={item.date}
          className={cn('text-xs')}
        >
          {(() => {
            const date = new Date(item.date);
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${day}${month}, ${hours}:${minutes}`;
          })()}
        </time>
      </div>
    </div>
  );
}

export function Timeline({
  items,
  initialCount = 5,
  className,
  showMoreText = 'Show More',
  showLessText = 'Show Less',
  dotClassName,
  lineClassName,
  titleClassName,
  descriptionClassName,
  buttonVariant = 'ghost',
  buttonSize = 'sm',
  animationDuration = 0.3,
  animationDelay = 0.1,
  showAnimation = true,
}: TimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const sortedItems = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const initialItems = sortedItems.slice(0, initialCount);
  const remainingItems = sortedItems.slice(initialCount);

  return (
    <div className={cn('mx-5 max-w-2xl md:mx-auto', className)}>
      <div>
        <ul className='space-y-4'>
          {initialItems.map((item, index) => (
            <motion.li
              key={item.id || `timeline-item-${index}-${item.date}`}
              initial={showAnimation ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: animationDuration,
                delay: index * animationDelay,
              }}
            >
              <DesktopTimelineEntry
                item={item}
                index={index}
                dotClassName={dotClassName}
                lineClassName={lineClassName}
                titleClassName={titleClassName}
                descriptionClassName={descriptionClassName}
              />
              <MobileTimelineEntry
                item={item}
                index={index}
                dotClassName={dotClassName}
                lineClassName={lineClassName}
                titleClassName={titleClassName}
                descriptionClassName={descriptionClassName}
              />
            </motion.li>
          ))}
          <AnimatePresence>
            {showAll &&
              remainingItems.map((item, index) => (
                <motion.li
                  key={item.id || `timeline-remaining-${index}-${item.date}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: animationDuration,
                    delay: index * animationDelay,
                  }}
                >
                  <DesktopTimelineEntry
                    item={item}
                    index={initialCount + index}
                    dotClassName={dotClassName}
                    lineClassName={lineClassName}
                    titleClassName={titleClassName}
                    descriptionClassName={descriptionClassName}
                      />
                  <MobileTimelineEntry
                    item={item}
                    index={initialCount + index}
                    dotClassName={dotClassName}
                    lineClassName={lineClassName}
                    titleClassName={titleClassName}
                    descriptionClassName={descriptionClassName}
                      />
                </motion.li>
              ))}
          </AnimatePresence>
        </ul>
      </div>
      {remainingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-8 flex justify-center'
        >
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className='gap-2'
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? showLessText : showMoreText}
            <motion.div animate={{ rotate: showAll ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className='h-4 w-4' />
            </motion.div>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
