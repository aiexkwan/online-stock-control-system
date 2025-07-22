'use client';

import React, { CSSProperties, ReactNode } from 'react';
import { useVisualSystem } from '../core/VisualSystemProvider';
import { GlassmorphismVariant } from '../config/visual-config';

interface GlassmorphicCardProps {
  children: ReactNode;
  variant?: GlassmorphismVariant;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  borderGlow?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function GlassmorphicCard({
  children,
  variant = 'default',
  className = '',
  style,
  onClick,
  hover = false,
  borderGlow = false,
  padding = 'medium',
}: GlassmorphicCardProps) {
  const { state, config } = useVisualSystem();

  // 如果禁用玻璃態效果，返回簡單卡片
  if (!state.glassmorphismEnabled) {
    return (
      <div
        className={`glassmorphic-fallback ${className}`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: getPaddingValue(padding),
          ...style,
        }}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  const glassConfig = config.glassmorphism;
  const variantConfig = {
    blur: glassConfig.blur[variant],
    opacity: glassConfig.opacity[variant],
  };

  // 構建樣式
  const cardStyles: CSSProperties = {
    backgroundColor: `rgba(255, 255, 255, ${variantConfig.opacity * 0.1})`,
    backdropFilter: `blur(${variantConfig.blur}px)`,
    WebkitBackdropFilter: `blur(${variantConfig.blur}px)`,
    border: glassConfig.border.width + 'px solid ' + glassConfig.border.color,
    borderRadius: '16px',
    boxShadow: glassConfig.shadow.default,
    padding: getPaddingValue(padding),
    position: 'relative',
    overflow: 'hidden',
    transition: state.animationsEnabled 
      ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      : 'none',
    ...style,
  };

  // Hover效果
  if (hover && state.animationsEnabled) {
    cardStyles.cursor = 'pointer';
  }

  // 邊框發光效果通過className和style標籤處理，不在這裡定義

  // Apply hover styles dynamically
  if (hover && state.animationsEnabled) {
    const hoverHandler = {
      onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = glassConfig.shadow.hover;
      },
      onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = glassConfig.shadow.default;
      },
    };
    
    return (
      <div
        className={`glassmorphic-card ${className}`}
        style={cardStyles}
        onClick={onClick}
        {...hoverHandler}
      >
        {borderGlow && (
          <div
            className="absolute inset-[-2px] rounded-[inherit] opacity-50 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, #ff0080, #ff8c00, #ffd700, #00ff00, #00ffff, #ff0080)',
              animation: state.animationsEnabled ? 'spin 3s linear infinite' : 'none',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              padding: '2px',
            }}
          />
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      className={`glassmorphic-card ${className}`}
      style={cardStyles}
      onClick={onClick}
    >
      {borderGlow && (
        <div
          className="absolute inset-[-2px] rounded-[inherit] opacity-50 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, #ff0080, #ff8c00, #ffd700, #00ff00, #00ffff, #ff0080)',
            animation: state.animationsEnabled ? 'spin 3s linear infinite' : 'none',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '2px',
          }}
        />
      )}
      {children}
    </div>
  );
}

// 輔助函數
function getPaddingValue(padding: 'none' | 'small' | 'medium' | 'large'): string {
  const paddingMap = {
    none: '0',
    small: '8px',
    medium: '16px',
    large: '24px',
  };
  return paddingMap[padding];
}

// 預設導出一些常用變體
export const GlassCard = (props: Omit<GlassmorphicCardProps, 'variant'>) => (
  <GlassmorphicCard {...props} variant="default" />
);

export const StrongGlassCard = (props: Omit<GlassmorphicCardProps, 'variant'>) => (
  <GlassmorphicCard {...props} variant="strong" />
);

export const LightGlassCard = (props: Omit<GlassmorphicCardProps, 'variant'>) => (
  <GlassmorphicCard {...props} variant="light" />
);