'use client';

import React, { CSSProperties, ReactNode } from 'react';
import { useVisualSystem } from '../core/VisualSystemProvider';
import { ContainerBorderVariant } from '../config/visual-config';

interface BorderContainerProps {
  children: ReactNode;
  variant?: ContainerBorderVariant;
  className?: string;
  style?: CSSProperties;
  animate?: boolean;
}

export function BorderContainer({
  children,
  variant = 'subtle',
  className = '',
  style,
  animate = false,
}: BorderContainerProps) {
  const { state, config } = useVisualSystem();

  const borderConfig = config.containerBorders[variant];

  // 基礎樣式
  const containerStyles: CSSProperties = {
    ...borderConfig,
    position: 'relative',
    transition:
      state.animationsEnabled && animate ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    ...style,
  };

  // 特殊效果處理
  if (variant === 'gradient' && state.animationsEnabled && animate) {
    const animatedGradientStyles: CSSProperties = {
      ...containerStyles,
      backgroundSize: '200% 200%',
      animation: 'gradient-shift 3s ease infinite',
    };

    return (
      <div className={className} style={animatedGradientStyles}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} style={containerStyles}>
      {children}
    </div>
  );
}

// 特殊效果：脈衝邊框
export function PulseBorder({
  children,
  color = 'rgba(255, 255, 255, 0.5)',
  duration = 2,
}: {
  children: ReactNode;
  color?: string;
  duration?: number;
}) {
  const { state } = useVisualSystem();

  if (!state.animationsEnabled) {
    return <>{children}</>;
  }

  const pulseStyles: CSSProperties = {
    borderRadius: '16px',
    position: 'relative',
    animation: `pulse-border ${duration}s infinite`,
  };

  return <div style={pulseStyles}>{children}</div>;
}

// 特殊效果：霓虹邊框
export function NeonBorder({
  children,
  color = '#00ffff',
  intensity = 1,
}: {
  children: ReactNode;
  color?: string;
  intensity?: number;
}) {
  const { state } = useVisualSystem();

  const neonStyles: CSSProperties = {
    border: `2px solid ${color}`,
    borderRadius: '16px',
    boxShadow: state.animationsEnabled
      ? `
      0 0 ${5 * intensity}px ${color},
      0 0 ${10 * intensity}px ${color},
      0 0 ${20 * intensity}px ${color},
      inset 0 0 ${5 * intensity}px ${color}
    `
      : `0 0 5px ${color}`,
    position: 'relative',
  };

  return <div style={neonStyles}>{children}</div>;
}

// 組合容器：結合玻璃態和邊框效果
export function GlassBorderContainer({
  children,
  glassVariant = 'default',
  borderVariant = 'subtle',
  className = '',
  style,
}: {
  children: ReactNode;
  glassVariant?: 'default' | 'strong' | 'light';
  borderVariant?: ContainerBorderVariant;
  className?: string;
  style?: CSSProperties;
}) {
  const { config } = useVisualSystem();

  const combinedStyles: CSSProperties = {
    ...config.containerBorders[borderVariant],
    backdropFilter: `blur(${config.glassmorphism.blur[glassVariant]}px)`,
    WebkitBackdropFilter: `blur(${config.glassmorphism.blur[glassVariant]}px)`,
    backgroundColor: `rgba(255, 255, 255, ${config.glassmorphism.opacity[glassVariant] * 0.1})`,
    ...style,
  };

  return (
    <div className={className} style={combinedStyles}>
      {children}
    </div>
  );
}
