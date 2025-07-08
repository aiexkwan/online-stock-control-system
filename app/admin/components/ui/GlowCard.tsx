/**
 * GlowCard Component
 * Provides advanced glow effect with rotating conic gradient
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { THEME } from '../../config/theme';
import { motion } from 'framer-motion';
import { ANIMATIONS } from '../../config/animations';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowOpacity?: number;
  animationDelay?: number;
  disableGlow?: boolean;
  theme?: keyof typeof THEME.colors.tabs;
}

export function GlowCard({
  children,
  className,
  glowOpacity = THEME.glow.opacity,
  animationDelay = 0,
  disableGlow = false,
  theme,
}: GlowCardProps) {
  // Get theme-specific glow colors if provided
  const glowColors = theme
    ? [
        THEME.colors.tabs[theme].primary,
        THEME.colors.tabs[theme].secondary,
        THEME.colors.tabs[theme].primary,
      ]
    : THEME.glow.colors;

  return (
    <motion.div
      className={cn('glow-card relative overflow-visible', className)}
      initial={ANIMATIONS.fadeInScale.initial}
      animate={ANIMATIONS.fadeInScale.animate}
      transition={{
        ...ANIMATIONS.fadeInScale.transition,
        delay: animationDelay,
      }}
    >
      {/* Glow effect layer */}
      {!disableGlow && (
        <div
          className='glow-effect pointer-events-none absolute inset-0 rounded-2xl'
          style={{
            opacity: glowOpacity,
            animation: 'rotate 4s linear infinite',
            mixBlendMode: 'lighten' as any,
          }}
        />
      )}

      {/* Main content */}
      <div className='main-content relative z-10 h-full w-full'>{children}</div>

      {/* CSS for glow effect */}
      <style jsx>{`
        @property --rotation-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotate {
          to {
            --rotation-angle: 360deg;
          }
        }

        .glow-effect {
          background: conic-gradient(from var(--rotation-angle), ${glowColors.join(', ')});
          filter: blur(${THEME.glow.blur});
          box-shadow:
            0 0 ${THEME.glow.spread}
              ${theme ? THEME.colors.tabs[theme].glow : 'rgba(102,153,0,0.18)'},
            0 0 ${THEME.glow.innerSpread}
              ${theme ? THEME.colors.tabs[theme].glow : 'rgba(51,153,204,0.12)'},
            inset 0 0 ${THEME.glow.innerGlow} rgba(204, 238, 102, 0.08);
        }

        .glow-effect::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(
            45deg,
            ${theme ? THEME.colors.tabs[theme].primary : glowColors[0]},
            transparent,
            ${theme ? THEME.colors.tabs[theme].secondary : glowColors[4]}
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.3;
        }
      `}</style>
    </motion.div>
  );
}
