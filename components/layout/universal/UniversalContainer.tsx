/**
 * UniversalContainer - 統一容器組件
 * 支援所有現有佈局模式，完全向後兼容
 */

'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { StarfieldBackground } from '@/app/components/StarfieldBackground';
import {
  LayoutVariant,
  MaxWidthSize,
  SpacingSize,
  LegacyResponsiveLayoutProps,
  LegacyResponsiveContainerProps,
} from './types';
import { MAX_WIDTH_CLASSES, SPACING_CLASSES, LAYOUT_VARIANTS } from './constants';
// 內建 useMediaQuery hook，避免外部依賴
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

interface UniversalContainerProps {
  children: React.ReactNode;
  variant?: keyof typeof LAYOUT_VARIANTS;
  background?: 'starfield' | 'gradient' | 'solid' | 'glass' | 'transparent';
  padding?: SpacingSize;
  margin?: SpacingSize;
  maxWidth?: MaxWidthSize;
  responsive?: boolean;
  className?: string;
  // 向後兼容性 props
  legacy?: boolean;
}

// 完全兼容現有 ResponsiveLayout
interface ResponsiveLayoutCompatProps extends LegacyResponsiveLayoutProps {
  __legacy?: true;
}

// 完全兼容現有 ResponsiveContainer
interface ResponsiveContainerCompatProps extends LegacyResponsiveContainerProps {
  __legacy?: true;
}

export const UniversalContainer = forwardRef<HTMLDivElement, UniversalContainerProps>(
  (
    {
      children,
      variant = 'section',
      background = 'transparent',
      padding,
      margin,
      maxWidth,
      responsive = true,
      className = '',
      legacy = false,
    },
    ref
  ) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');

    // 獲取預設配置
    const config = LAYOUT_VARIANTS[variant];

    // 使用 props 覆蓋預設值
    const finalPadding = padding || config.padding;
    const finalMargin = margin || config.margin;
    const finalMaxWidth = maxWidth || config.maxWidth;

    // 構建類名
    const containerClasses = cn(
      // 基礎佈局
      'w-full',

      // 響應式 padding (兼容原有 ResponsiveLayout 邏輯)
      responsive && isMobile
        ? `px-${SPACING_CLASSES[finalPadding]} py-${SPACING_CLASSES.lg}`
        : responsive && isTablet
          ? `px-${SPACING_CLASSES.lg} py-${SPACING_CLASSES.xl}`
          : responsive
            ? `px-${SPACING_CLASSES.xl} py-${SPACING_CLASSES['2xl']}`
            : `p-${SPACING_CLASSES[finalPadding]}`,

      // Margin
      finalMargin !== 'none' && `m-${SPACING_CLASSES[finalMargin]}`,

      // 最大寬度
      finalMaxWidth !== 'full' && MAX_WIDTH_CLASSES[finalMaxWidth],
      finalMaxWidth !== 'full' && 'mx-auto',

      // 最小高度 (兼容原有邏輯)
      variant === 'page' && 'min-h-screen',

      // 自定義類名
      className
    );

    // 背景包裝器
    const renderWithBackground = (content: React.ReactNode) => {
      switch (background) {
        case 'starfield':
          return <StarfieldBackground>{content}</StarfieldBackground>;

        case 'gradient':
          return (
            <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
              {content}
            </div>
          );

        case 'glass':
          return (
            <div className='bg-white/3 rounded-xl border border-slate-600/30 backdrop-blur-md'>
              {content}
            </div>
          );

        case 'solid':
          return <div className='bg-slate-800'>{content}</div>;

        case 'transparent':
        default:
          return content;
      }
    };

    const content = (
      <div ref={ref} className={containerClasses}>
        {children}
      </div>
    );

    return renderWithBackground(content);
  }
);

// 完全兼容現有 ResponsiveLayout 的包裝器
export const ResponsiveLayout = forwardRef<HTMLDivElement, ResponsiveLayoutCompatProps>(
  ({ children, className = '' }, ref) => {
    return (
      <UniversalContainer
        ref={ref}
        variant='page'
        background='transparent'
        responsive={true}
        className={className}
        legacy={true}
      >
        {children}
      </UniversalContainer>
    );
  }
);

// 完全兼容現有 ResponsiveContainer 的包裝器
export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerCompatProps>(
  ({ children, maxWidth = 'lg', padding = true, className = '' }, ref) => {
    return (
      <UniversalContainer
        ref={ref}
        variant='section'
        background='transparent'
        maxWidth={maxWidth}
        padding={padding ? 'md' : 'none'}
        responsive={true}
        className={className}
        legacy={true}
      >
        {children}
      </UniversalContainer>
    );
  }
);

// 設置 displayName 以便調試
UniversalContainer.displayName = 'UniversalContainer';
ResponsiveLayout.displayName = 'ResponsiveLayout';
ResponsiveContainer.displayName = 'ResponsiveContainer';

export default UniversalContainer;
