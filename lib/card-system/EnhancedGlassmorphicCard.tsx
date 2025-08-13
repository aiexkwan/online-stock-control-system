/**
 * Enhanced Glassmorphic Card Component
 * 整合新主題系統的增強版玻璃態卡片組件
 * 
 * Created: 2025-08-12
 * Purpose: Unified card component with theme system integration
 */

'use client';

import React, { CSSProperties, ReactNode, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import our new theme systems
import { cardThemes, cardAnimations, cardStatusColors, type CardBaseProps } from './theme';
import { glassmorphicThemes, dynamicBorderGlow, performanceOptimizations, generateGlassmorphicCSSVariables, iconStyleSystem } from './glassmorphic-integration';
import { accessibleCardColors, validateTextContrast } from './accessibility-colors';
import { responsiveUtils } from './responsive-design';
import visualGuidelines from './visual-guidelines';

/**
 * Enhanced Card Props
 * 擴展的卡片屬性接口
 */
export interface EnhancedGlassmorphicCardProps extends CardBaseProps {
  children: ReactNode;
  
  // 視覺效果
  glassmorphicVariant?: 'subtle' | 'default' | 'strong' | 'intense';
  borderGlow?: boolean | 'hover' | 'always' | 'loading';
  shadowIntensity?: 'none' | 'light' | 'medium' | 'strong' | 'dynamic';
  
  // 交互狀態
  isHoverable?: boolean;
  isLoading?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  status?: keyof typeof cardStatusColors;
  
  // 響應式選項
  responsiveHide?: Array<'mobile' | 'tablet' | 'desktop' | 'wide'>;
  adaptiveContent?: boolean;
  
  // 無障礙
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
  
  // 事件處理
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
  
  // 自定義樣式
  style?: CSSProperties;
  innerStyle?: CSSProperties;
}

/**
 * Enhanced Glassmorphic Card Component
 */
export const EnhancedGlassmorphicCard: React.FC<EnhancedGlassmorphicCardProps> = ({
  children,
  theme = 'operation',
  variant = 'glass',
  padding = 'base',
  glassmorphicVariant = 'default',
  borderGlow = false,
  shadowIntensity = 'medium',
  isHoverable = false,
  isLoading = false,
  isSelected = false,
  isDisabled = false,
  status,
  animate = true,
  responsiveHide = [],
  adaptiveContent = true,
  ariaLabel,
  role,
  tabIndex,
  onClick,
  onKeyDown,
  onFocus,
  onBlur,
  className,
  style,
  innerStyle,
}) => {
  // 響應式狀態
  const [currentBreakpoint, setCurrentBreakpoint] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 檢測響應式狀態
  useEffect(() => {
    const updateBreakpoint = () => {
      setCurrentBreakpoint(responsiveUtils.getCurrentBreakpoint());
      setPerformanceLevel(responsiveUtils.getPerformanceLevel());
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // 主題配置
  const cardTheme = useMemo(() => cardThemes[theme], [theme]);
  const glassmorphicTheme = useMemo(() => glassmorphicThemes[theme], [theme]);
  const accessibleTheme = useMemo(() => accessibleCardColors[theme], [theme]);
  const visualConfig = useMemo(() => visualGuidelines.visual.categoryIdentifiers[theme], [theme]);

  // 性能優化配置
  const perfConfig = useMemo(() => {
    const configs = {
      low: performanceOptimizations.lowPerformance,
      medium: performanceOptimizations.mediumPerformance,
      high: performanceOptimizations.highPerformance,
    };
    return configs[performanceLevel];
  }, [performanceLevel]);

  // 邊框發光效果
  const glowElement = useMemo(() => {
    if (!borderGlow || !perfConfig.enableAnimations) return null;

    const shouldShowGlow = 
      borderGlow === 'always' || 
      (borderGlow === 'hover' && isHovered) ||
      (borderGlow === 'loading' && isLoading) ||
      borderGlow === true;

    if (!shouldShowGlow) return null;

    const glowState = isLoading ? 'loading' : isHovered ? 'hover' : 'idle';
    const glowConfig = dynamicBorderGlow.states[glowState];

    return (
      <div
        className="pointer-events-none absolute inset-[-2px] rounded-[inherit] opacity-60"
        style={{
          background: `linear-gradient(45deg, rgba(255, 255, 255, 0.4), transparent, rgba(255, 255, 255, 0.4))`,
          animation: glowConfig.animation,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '2px',
        }}
      />
    );
  }, [borderGlow, perfConfig.enableAnimations, isHovered, isLoading]);

  // 狀態指示器
  const statusIndicator = useMemo(() => {
    if (!status) return null;

    const statusConfig = cardStatusColors[status];
    return (
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
          aria-hidden="true"
        />
        <span className={`text-xs font-medium ${statusConfig.text}`}>
          {statusConfig.text.replace('text-', '').replace('-400', '')}
        </span>
      </div>
    );
  }, [status]);

  // 載入指示器
  const loadingIndicator = useMemo(() => {
    if (!isLoading) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[inherit]">
        <div className="flex items-center gap-2 text-white">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }, [isLoading]);

  // 動態樣式計算
  const dynamicStyles = useMemo((): CSSProperties => {
    const baseStyles: CSSProperties = {
      // 基礎玻璃態效果
      backgroundColor: glassmorphicTheme.background,
      backdropFilter: perfConfig.useBackdropFilter ? `blur(${glassmorphicTheme.backdropBlur})` : 'none',
      WebkitBackdropFilter: perfConfig.useBackdropFilter ? `blur(${glassmorphicTheme.backdropBlur})` : 'none',
      border: 'none', // 移除所有邊框
      borderRadius: visualConfig.cornerRadius,
      
      // 陰影效果
      boxShadow: glassmorphicTheme.innerGlow,
      
      // 過渡效果
      transition: perfConfig.enableAnimations ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      
      // 狀態相關樣式
      opacity: isDisabled ? 0.6 : 1,
      pointerEvents: isDisabled ? 'none' : 'auto',
      cursor: isHoverable && !isDisabled ? 'pointer' : 'default',
      
      // 響應式調整
      minHeight: currentBreakpoint === 'mobile' ? '200px' : '280px',
      
      // 無障礙
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
    };

    // 選中狀態
    if (isSelected) {
      // 移除邊框，只保留陰影效果
      baseStyles.boxShadow = `${glassmorphicTheme.innerGlow}, 0 0 0 1px ${accessibleTheme.accent}20`;
    }

    // 焦點狀態
    if (isFocused) {
      // 移除邊框，使用更細微的陰影
      baseStyles.boxShadow = `${glassmorphicTheme.innerGlow}, 0 0 0 1px ${accessibleTheme.primary}30`;
    }

    // Hover 狀態
    if (isHovered && isHoverable && perfConfig.enableAnimations) {
      baseStyles.transform = 'translateY(-2px)';
      baseStyles.boxShadow = `${glassmorphicTheme.innerGlow}, 0 8px 25px rgba(0, 0, 0, 0.15)`;
    }

    return { ...baseStyles, ...style };
  }, [
    glassmorphicTheme,
    perfConfig,
    visualConfig,
    accessibleTheme,
    isDisabled,
    isSelected,
    isFocused,
    isHovered,
    isHoverable,
    currentBreakpoint,
    style,
  ]);
  
  // 標題渲染邏輯 - 移除未定義變數
  const titleElement = useMemo(() => {
    return null; // 統一由子組件處理標題，避免重複
  }, []);

  // 響應式隱藏檢查
  const shouldHide = responsiveHide.includes(currentBreakpoint);
  if (shouldHide) return null;

  // 鍵盤事件處理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Trigger click handler for keyboard activation
      if (onClick && !isDisabled) {
        // Create a proper synthetic event
        const rect = event.currentTarget.getBoundingClientRect();
        const syntheticEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1,
          screenX: rect.left + rect.width / 2,
          screenY: rect.top + rect.height / 2,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          button: 0,
          buttons: 1,
        });
        
        // Dispatch as React event
        Object.defineProperty(syntheticEvent, 'currentTarget', {
          value: event.currentTarget,
          enumerable: true,
        });
        
        onClick(syntheticEvent as unknown as React.MouseEvent<HTMLDivElement>);
      }
    }
    onKeyDown?.(event);
  };

  // 動畫配置
  const animationProps = animate && perfConfig.enableAnimations ? {
    initial: cardAnimations.fadeIn.initial,
    animate: cardAnimations.fadeIn.animate,
    transition: cardAnimations.fadeIn.transition,
    whileHover: isHoverable ? cardAnimations.hover.whileHover : undefined,
  } : {};

  // CSS 變量
  const cssVariables = generateGlassmorphicCSSVariables(theme);

  return (
    <motion.div
      className={cn(
        'enhanced-glassmorphic-card',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        `focus-visible:ring-${theme}`,
        className
      )}
      style={{
        ...dynamicStyles,
        ...cssVariables,
      }}
      role={role || (isHoverable ? 'button' : 'region')}
      tabIndex={tabIndex ?? (isHoverable ? 0 : -1)}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      aria-selected={isSelected}
      onClick={!isDisabled ? onClick : undefined}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...animationProps}
    >
      {/* 角標指示器已整合到主題系統 */}
      
      {/* 邊框發光效果 */}
      {glowElement}
      
      {/* 狀態指示器 */}
      {statusIndicator}
      
      {/* 容器標題（如果需要且無衝突） */}
      {titleElement}
      
      {/* 主要內容 */}
      <div 
        className="relative z-10 h-full"
        style={{
          ...innerStyle,
          // 應用圖標樣式到內部SVG圖標
          ['--icon-style' as string]: iconStyleSystem[glassmorphicTheme.iconStyle],
        }}
      >
        {children}
      </div>
      
      {/* 載入覆蓋層 */}
      <AnimatePresence>
        {loadingIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20"
          >
            {loadingIndicator}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * 預設變體導出
 */
export const OperationCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="operation" />
);

export const AnalysisCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="analysis" />
);

export const DataCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="data" />
);

export const ReportCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="report" />
);

export const ChartCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="chart" />
);

export const SpecialCard = (props: Omit<EnhancedGlassmorphicCardProps, 'theme'>) => (
  <EnhancedGlassmorphicCard {...props} theme="special" />
);

export default EnhancedGlassmorphicCard;