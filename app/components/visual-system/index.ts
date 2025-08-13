// Core exports
export { VisualSystemProvider, useVisualSystem } from './core/VisualSystemProvider';
export { UnifiedBackground } from './core/UnifiedBackground';

// Effects exports - 使用統一的 EnhancedGlassmorphicCard 系統
export {
  EnhancedGlassmorphicCard as GlassmorphicCard,
  OperationCard as GlassCard,
  SpecialCard as StrongGlassCard,
  DataCard as LightGlassCard,
} from '@/lib/card-system/EnhancedGlassmorphicCard';

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
