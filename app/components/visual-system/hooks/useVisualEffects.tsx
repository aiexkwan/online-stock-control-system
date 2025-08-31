'use client';

import { useVisualSystem } from '../core/VisualSystemProvider';
import { GlassmorphismVariant, ContainerBorderVariant } from '../config/visual-config';

export function useVisualEffects() {
  const { state, _config: config, actions } = useVisualSystem();

  // 獲取玻璃態樣式
  const getGlassmorphicStyles = (variant: GlassmorphismVariant = 'default') => {
    if (!state.glassmorphismEnabled) {
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      };
    }

    const glassConfig = config.glassmorphism;
    return {
      backgroundColor: `rgba(255, 255, 255, ${glassConfig.opacity[variant] * 0.1})`,
      backdropFilter: `blur(${glassConfig.blur[variant]}px)`,
      WebkitBackdropFilter: `blur(${glassConfig.blur[variant]}px)`,
      border: `${glassConfig.border.width}px solid ${glassConfig.border.color}`,
      boxShadow: glassConfig.shadow.default,
    };
  };

  // 獲取容器邊框樣式
  const getContainerBorderStyles = (variant: ContainerBorderVariant = 'subtle') => {
    return config.containerBorders[variant];
  };

  // 獲取動畫樣式
  const getTransitionStyles = (type: 'page' | 'element' = 'element') => {
    if (!state.animationsEnabled || state.prefersReducedMotion) {
      return { transition: 'none' };
    }

    const transitionConfig = config.transitions[type];
    return {
      transition: `all ${transitionConfig.duration}ms ${transitionConfig.easing}`,
    };
  };

  // 檢查是否應該顯示某個視覺效果
  const shouldShowEffect = (effect: 'starfield' | 'glassmorphism' | 'animations') => {
    switch (effect) {
      case 'starfield':
        return state.starfieldEnabled && state.webglSupported && !state.prefersReducedMotion;
      case 'glassmorphism':
        return state.glassmorphismEnabled;
      case 'animations':
        return state.animationsEnabled && !state.prefersReducedMotion;
      default:
        return false;
    }
  };

  // 獲取性能優化的樣式
  const getOptimizedStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {};

    // 根據性能層級調整
    if (state.performanceTier === 'low') {
      baseStyles.willChange = 'auto';
      baseStyles.transform = 'translateZ(0)'; // 停用GPU加速
    } else if (state.performanceTier === 'high') {
      baseStyles.willChange = 'transform';
      baseStyles.transform = 'translateZ(0)'; // 啟用GPU加速
    }

    return baseStyles;
  };

  return {
    // 樣式獲取器
    getGlassmorphicStyles,
    getContainerBorderStyles,
    getTransitionStyles,
    getOptimizedStyles,

    // 狀態檢查
    shouldShowEffect,

    // 快捷方法
    glassStyles: getGlassmorphicStyles(),
    borderStyles: getContainerBorderStyles(),
    transitionStyles: getTransitionStyles(),

    // 狀態
    isHighPerformance: state.performanceTier === 'high',
    isLowPerformance: state.performanceTier === 'low',
    animationsEnabled: state.animationsEnabled && !state.prefersReducedMotion,

    // 操作
    toggleStarfield: () => actions.setStarfieldEnabled(!state.starfieldEnabled),
    toggleGlassmorphism: () => actions.setGlassmorphismEnabled(!state.glassmorphismEnabled),
    toggleAnimations: () => actions.setAnimationsEnabled(!state.animationsEnabled),
  };
}
