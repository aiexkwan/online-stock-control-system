/**
 * SpotlightCard Component
 * Provides spotlight effect that follows mouse movement
 * Enhanced version with improved gradients, boundary detection and border light effects
 */

'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { THEME } from '../../config/theme';
import { motion } from 'framer-motion';
import { ANIMATIONS } from '../../config/animations';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightSize?: number;
  spotlightIntensity?: number;
  animationDelay?: number;
  disableSpotlight?: boolean;
  theme?: keyof typeof THEME.colors.tabs;
  borderRadius?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightSize = 350,
  spotlightIntensity = 0.15,
  animationDelay = 0,
  disableSpotlight = false,
  theme,
  borderRadius = '1rem',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Get theme-specific colors
  const themeColors = theme ? THEME.colors.tabs[theme] : null;
  const spotlightColor = themeColors ? themeColors.primary : '#3B82F6';

  // Convert hex to RGB for better control
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 59, g: 130, b: 246 }; // fallback to blue
  }, []);

  const rgb = hexToRgb(spotlightColor);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || disableSpotlight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Boundary check - only update if mouse is within the card
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMousePosition({ x, y });
      }
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      // Reset position to center when mouse leaves
      const rect = card.getBoundingClientRect();
      setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [disableSpotlight]);

  // Enhanced spotlight gradient with multiple layers - optimized for smaller range
  const spotlightStyle =
    !disableSpotlight && isHovered
      ? {
          background: `
      radial-gradient(${spotlightSize * 0.25}px circle at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${spotlightIntensity * 0.756}),
        transparent 35%),
      radial-gradient(${spotlightSize * 0.5}px circle at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${spotlightIntensity * 0.42}),
        transparent 55%),
      radial-gradient(${spotlightSize * 0.8}px circle at ${mousePosition.x}px ${mousePosition.y}px,
        rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${spotlightIntensity * 0.168}),
        transparent 75%)
    `,
          opacity: 1,
          transition: 'opacity 0.3s ease, background 0.1s ease',
        }
      : {
          opacity: 0,
          transition: 'opacity 0.3s ease',
          background: 'transparent',
        };

  return (
    <motion.div
      ref={cardRef}
      className={cn('spotlight-card-container group relative', className)}
      initial={ANIMATIONS.fadeInScale.initial}
      animate={ANIMATIONS.fadeInScale.animate}
      transition={{
        ...ANIMATIONS.fadeInScale.transition,
        delay: animationDelay,
      }}
      style={{ borderRadius, overflow: 'visible' }}
    >
      {/* Outer glow/shadow effect */}
      {!disableSpotlight && (
        <div
          className='pointer-events-none absolute z-0'
          style={{
            inset: '-6px',
            borderRadius: `calc(${borderRadius} + 6px)`,
            background: isHovered
              ? `radial-gradient(${spotlightSize * 0.7}px circle at ${mousePosition.x + 6}px ${mousePosition.y + 6}px,
                  rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28),
                  rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.105) 50%,
                  transparent 80%)`
              : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.056)`,
            filter: 'blur(12px)',
            opacity: isHovered ? 1 : 0.3,
            transition: 'all 0.4s ease',
          }}
        />
      )}

      {/* Border light effect - outer ring */}
      {!disableSpotlight && (
        <div
          className='z-5 pointer-events-none absolute inset-0'
          style={{
            borderRadius,
            padding: '2px',
            background: isHovered
              ? `conic-gradient(from 0deg at ${(mousePosition.x / (cardRef.current?.clientWidth || 1)) * 100}% ${(mousePosition.y / (cardRef.current?.clientHeight || 1)) * 100}%,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.56) 0deg,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28) 60deg,
                   transparent 120deg,
                   transparent 240deg,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28) 300deg,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.56) 360deg)`
              : `linear-gradient(135deg,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.07),
                   transparent 50%,
                   rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.07))`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            transition: 'background 0.2s ease, opacity 0.3s ease',
            opacity: isHovered ? 1 : 0.4,
          }}
        />
      )}

      {/* Border light effect - inner ring */}
      {!disableSpotlight && (
        <div
          className='z-15 pointer-events-none absolute inset-0'
          style={{
            borderRadius,
            padding: '1px',
            background: isHovered
              ? `radial-gradient(${spotlightSize * 0.3}px circle at ${mousePosition.x}px ${mousePosition.y}px,
                    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.63),
                    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.21) 40%,
                    rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.07) 60%,
                    transparent 80%)`
              : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.105)`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            transition: 'background 0.2s ease, opacity 0.3s ease',
            opacity: isHovered ? 1 : 0.5,
          }}
        />
      )}

      {/* Main spotlight overlay */}
      {!disableSpotlight && (
        <div
          className='pointer-events-none absolute inset-0 z-10'
          style={{
            ...spotlightStyle,
            borderRadius,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Content with enhanced backdrop */}
      <div
        className='spotlight-card-content relative z-20 h-full w-full overflow-hidden transition-all duration-300'
        style={{ borderRadius }}
      >
        {children}
      </div>
    </motion.div>
  );
}
