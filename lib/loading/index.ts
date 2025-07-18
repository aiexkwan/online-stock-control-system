/**
 * Loading System Core Module
 * 智能載入管理系統核心模組
 * 
 * 提供統一的載入狀態管理、性能感知載入策略和智能載入組件
 * 與 NewPennine 現有架構完全整合
 */

// Core Management
export * from './providers/LoadingProvider';
export * from './contexts/LoadingContext';
export * from './hooks/useLoading';
export * from './hooks/useSmartLoading';
export * from './hooks/useLoadingTimeout';

// Performance-Aware Components
export * from './components/SmartLoadingSpinner';
export * from './components/AdaptiveSkeletonLoader';
export * from './components/ProgressIndicator';
export * from './components/LoadingOverlay';

// Strategies
export * from './strategies/LoadingStrategy';

// Utilities
export * from './utils/loadingUtils';
export * from './utils/performanceDetector';
export * from './utils/debounceLoader';

// Types
export * from './types';