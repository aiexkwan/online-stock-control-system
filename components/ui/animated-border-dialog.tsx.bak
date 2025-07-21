/**
 * Dialog 組件配合光線流動邊框效果
 * 基於 unified-dialog 擴展，加入動態邊框動畫
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dialogAnimationClasses, dialogVariants, type DialogType } from '@/lib/dialog-animation';
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from '@/components/ui/unified-dialog';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

// 動態邊框組件
const AnimatedBorder = ({ type = 'form' }: { type?: DialogType }) => {
  const topRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const leftRef = React.useRef<HTMLDivElement>(null);

  // 根據 dialog 類型設置顏色
  const colorMap = {
    notification: 'from-blue-500 to-cyan-500',
    error: 'from-red-500 to-rose-500',
    warning: 'from-yellow-500 to-amber-500',
    form: 'from-blue-500 to-cyan-500',
    report: 'from-purple-500 to-indigo-500',
    information: 'from-cyan-500 to-teal-500',
  };

  const gradientColor = colorMap[type] || colorMap.form;

  React.useEffect(() => {
    const animateBorder = () => {
      const now = Date.now() / 1000;
      const speed = 0.3; // 動畫速度

      // 計算位置
      const topX = Math.sin(now * speed) * 100;
      const rightY = Math.cos(now * speed) * 100;
      const bottomX = Math.sin(now * speed + Math.PI) * 100;
      const leftY = Math.cos(now * speed + Math.PI) * 100;

      // 應用位置
      if (topRef.current) topRef.current.style.transform = `translateX(${topX}%)`;
      if (rightRef.current) rightRef.current.style.transform = `translateY(${rightY}%)`;
      if (bottomRef.current) bottomRef.current.style.transform = `translateX(${bottomX}%)`;
      if (leftRef.current) leftRef.current.style.transform = `translateY(${leftY}%)`;

      requestAnimationFrame(animateBorder);
    };

    const animationId = requestAnimationFrame(animateBorder);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <>
      {/* 頂部邊框 */}
      <div className='absolute left-0 top-0 h-[2px] w-full overflow-hidden rounded-t-3xl'>
        <div
          ref={topRef}
          className='absolute left-0 top-0 h-full w-full opacity-80'
          style={{
            background:
              type === 'error'
                ? 'linear-gradient(to right, transparent, #ef4444, #f87171, transparent)'
                : type === 'warning'
                  ? 'linear-gradient(to right, transparent, #f59e0b, #fbbf24, transparent)'
                  : type === 'notification'
                    ? 'linear-gradient(to right, transparent, #3b82f6, #06b6d4, transparent)'
                    : type === 'information'
                      ? 'linear-gradient(to right, transparent, #06b6d4, #14b8a6, transparent)'
                      : type === 'report'
                        ? 'linear-gradient(to right, transparent, #8b5cf6, #6366f1, transparent)'
                        : 'linear-gradient(to right, transparent, #3b82f6, #06b6d4, transparent)',
          }}
        />
      </div>

      {/* 右側邊框 */}
      <div className='absolute right-0 top-0 h-full w-[2px] overflow-hidden rounded-r-3xl'>
        <div
          ref={rightRef}
          className='absolute left-0 top-0 h-full w-full opacity-80'
          style={{
            background:
              type === 'error'
                ? 'linear-gradient(to bottom, transparent, #ef4444, #f87171, transparent)'
                : type === 'warning'
                  ? 'linear-gradient(to bottom, transparent, #f59e0b, #fbbf24, transparent)'
                  : type === 'notification'
                    ? 'linear-gradient(to bottom, transparent, #3b82f6, #06b6d4, transparent)'
                    : type === 'information'
                      ? 'linear-gradient(to bottom, transparent, #06b6d4, #14b8a6, transparent)'
                      : type === 'report'
                        ? 'linear-gradient(to bottom, transparent, #8b5cf6, #6366f1, transparent)'
                        : 'linear-gradient(to bottom, transparent, #3b82f6, #06b6d4, transparent)',
          }}
        />
      </div>

      {/* 底部邊框 */}
      <div className='absolute bottom-0 left-0 h-[2px] w-full overflow-hidden rounded-b-3xl'>
        <div
          ref={bottomRef}
          className='absolute left-0 top-0 h-full w-full opacity-80'
          style={{
            background:
              type === 'error'
                ? 'linear-gradient(to right, transparent, #ef4444, #f87171, transparent)'
                : type === 'warning'
                  ? 'linear-gradient(to right, transparent, #f59e0b, #fbbf24, transparent)'
                  : type === 'notification'
                    ? 'linear-gradient(to right, transparent, #3b82f6, #06b6d4, transparent)'
                    : type === 'information'
                      ? 'linear-gradient(to right, transparent, #06b6d4, #14b8a6, transparent)'
                      : type === 'report'
                        ? 'linear-gradient(to right, transparent, #8b5cf6, #6366f1, transparent)'
                        : 'linear-gradient(to right, transparent, #3b82f6, #06b6d4, transparent)',
          }}
        />
      </div>

      {/* 左側邊框 */}
      <div className='absolute left-0 top-0 h-full w-[2px] overflow-hidden rounded-l-3xl'>
        <div
          ref={leftRef}
          className='absolute left-0 top-0 h-full w-full opacity-80'
          style={{
            background:
              type === 'error'
                ? 'linear-gradient(to bottom, transparent, #ef4444, #f87171, transparent)'
                : type === 'warning'
                  ? 'linear-gradient(to bottom, transparent, #f59e0b, #fbbf24, transparent)'
                  : type === 'notification'
                    ? 'linear-gradient(to bottom, transparent, #3b82f6, #06b6d4, transparent)'
                    : type === 'information'
                      ? 'linear-gradient(to bottom, transparent, #06b6d4, #14b8a6, transparent)'
                      : type === 'report'
                        ? 'linear-gradient(to bottom, transparent, #8b5cf6, #6366f1, transparent)'
                        : 'linear-gradient(to bottom, transparent, #3b82f6, #06b6d4, transparent)',
          }}
        />
      </div>

      {/* 角落光點 */}
      <div
        className={cn(
          'absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full',
          type === 'error'
            ? 'bg-red-500'
            : type === 'warning'
              ? 'bg-yellow-500'
              : type === 'notification'
                ? 'bg-blue-500'
                : type === 'information'
                  ? 'bg-cyan-500'
                  : type === 'report'
                    ? 'bg-purple-500'
                    : 'bg-blue-500'
        )}
      />
      <div
        className={cn(
          'absolute bottom-4 left-4 h-2 w-2 animate-pulse rounded-full',
          type === 'error'
            ? 'bg-rose-500'
            : type === 'warning'
              ? 'bg-amber-500'
              : type === 'notification'
                ? 'bg-cyan-500'
                : type === 'information'
                  ? 'bg-teal-500'
                  : type === 'report'
                    ? 'bg-indigo-500'
                    : 'bg-cyan-500'
        )}
      />
    </>
  );
};

// 帶動畫邊框的內容容器
interface AnimatedDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  type?: DialogType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  enableAnimatedBorder?: boolean;
}

const AnimatedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AnimatedDialogContentProps
>(
  (
    { className, children, type = 'form', size = 'md', enableAnimatedBorder = true, ...props },
    ref
  ) => {
    return (
      <DialogContent
        ref={ref}
        type={type}
        size={size}
        className={cn('relative overflow-visible', className)}
        {...props}
      >
        {/* 動態邊框 - 絕對定位在 dialog 外圍 */}
        {enableAnimatedBorder && (
          <div className='pointer-events-none absolute -inset-[2px] overflow-hidden rounded-3xl'>
            <AnimatedBorder type={type} />
          </div>
        )}

        {/* 內容 */}
        <div className='relative z-10'>{children}</div>

        {/* 光暈效果 - 放在 dialog 外部 */}
        {enableAnimatedBorder && (
          <div className='pointer-events-none absolute inset-0'>
            <div
              className={cn(
                'absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-10 blur-3xl',
                type === 'error'
                  ? 'bg-red-500'
                  : type === 'warning'
                    ? 'bg-yellow-500'
                    : type === 'notification'
                      ? 'bg-blue-500'
                      : type === 'information'
                        ? 'bg-cyan-500'
                        : type === 'report'
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
              )}
            />
            <div
              className={cn(
                'absolute -bottom-20 -left-20 h-40 w-40 rounded-full opacity-10 blur-3xl',
                type === 'error'
                  ? 'bg-rose-500'
                  : type === 'warning'
                    ? 'bg-amber-500'
                    : type === 'notification'
                      ? 'bg-cyan-500'
                      : type === 'information'
                        ? 'bg-teal-500'
                        : type === 'report'
                          ? 'bg-indigo-500'
                          : 'bg-cyan-500'
              )}
            />
          </div>
        )}
      </DialogContent>
    );
  }
);
AnimatedDialogContent.displayName = 'AnimatedDialogContent';

// 導出為 AnimatedDialog
const AnimatedDialog = Dialog;
const AnimatedDialogTrigger = DialogTrigger;
const AnimatedDialogClose = DialogClose;

// 導出所有組件
export {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

export type { DialogType };
