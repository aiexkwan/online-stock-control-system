// Core exports
export { VisualSystemProvider, useVisualSystem } from './core/VisualSystemProvider';
export { UnifiedBackground } from './core/UnifiedBackground';

// Effects exports
export {
  GlassmorphicCard,
  GlassCard,
  StrongGlassCard,
  LightGlassCard,
} from './effects/GlassmorphicCard';

export {
  BorderContainer,
  PulseBorder,
  NeonBorder,
  GlassBorderContainer,
} from './effects/BorderEffects';

// Navigation - Using existing DynamicActionBar from components/ui/dynamic-action-bar

// Hooks exports
export { usePerformanceMonitor, withPerformanceOptimization } from './hooks/usePerformanceMonitor';
export { useVisualEffects } from './hooks/useVisualEffects';

// Config exports
export { VISUAL_CONFIG } from './config/visual-config';
export { PERFORMANCE_CONFIG } from './config/performance-config';

// Type exports
export type { VisualSystemState, VisualSystemContextType } from './core/VisualSystemProvider';

export type {
  VisualConfig,
  GlassmorphismVariant,
  ContainerBorderVariant,
} from './config/visual-config';

export type { PerformanceConfig, GPUTier, PreloadStrategy } from './config/performance-config';
