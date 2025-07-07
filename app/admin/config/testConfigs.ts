/**
 * 測試頁面配置
 */

import { Play, Pause, RotateCcw, Download, Zap, CheckCircle, Users, Layers, Package } from 'lucide-react';

export interface TestConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'performance' | 'migration' | 'verification' | 'system';
  features: string[];
  defaultControls?: any;
}

export const testConfigs: Record<string, TestConfig> = {
  'ab-testing': {
    id: 'ab-testing',
    title: 'A/B Testing Dashboard',
    description: 'Manage and monitor A/B tests for gradual widget migration',
    icon: Users,
    category: 'migration',
    features: ['Traffic Split Control', 'Performance Monitoring', 'Auto Rollback', 'Simulation Mode'],
    defaultControls: {
      v2Percentage: 50,
      autoRollback: true,
      performanceThreshold: 20,
      simulationMode: false
    }
  },
  
  'dual-run': {
    id: 'dual-run',
    title: 'Dual Run Verification',
    description: 'Run and compare old and new widget systems side by side',
    icon: Layers,
    category: 'verification',
    features: ['Single Widget Test', 'Batch Testing', 'Performance Comparison', 'Export Reports'],
    defaultControls: {
      parallelRun: true,
      captureMetrics: true,
      compareVisual: false
    }
  },
  
  'optimizations': {
    id: 'optimizations',
    title: 'Widget Optimization Testing',
    description: 'Test and validate performance optimizations',
    icon: Zap,
    category: 'performance',
    features: ['Code Splitting Test', 'React.memo Verification', 'Bundle Analysis', 'Route Preloading'],
    defaultControls: {
      enableVirtualization: true,
      enablePreloading: true,
      measureRenderTime: true
    }
  },
  
  'widget-migration': {
    id: 'widget-migration',
    title: 'Widget Migration Testing',
    description: 'Test widget migration status and compatibility',
    icon: Package,
    category: 'migration',
    features: ['Side-by-side Comparison', 'Migration Checklist', 'Regression Testing', 'Performance Delta'],
    defaultControls: {
      showOldVersion: true,
      showNewVersion: true,
      highlightDifferences: true
    }
  },
  
  'widget-registry': {
    id: 'widget-registry',
    title: 'Widget Registry Test Suite',
    description: 'Comprehensive testing for widget registry system',
    icon: CheckCircle,
    category: 'system',
    features: ['Registry Initialization', 'Lazy Loading Test', 'GraphQL Toggle', 'Bundle Size Check'],
    defaultControls: {
      testLazyLoading: true,
      testPreloading: true,
      useGraphQL: false,
      measureBundleSize: true
    }
  }
};

export const testCategories = {
  performance: {
    label: 'Performance',
    description: 'Performance optimization and benchmarking tests',
    color: 'text-green-500'
  },
  migration: {
    label: 'Migration',
    description: 'Widget migration and compatibility tests',
    color: 'text-blue-500'
  },
  verification: {
    label: 'Verification',
    description: 'System verification and comparison tests',
    color: 'text-purple-500'
  },
  system: {
    label: 'System',
    description: 'Core system functionality tests',
    color: 'text-orange-500'
  }
};

export function getTestConfig(testType: string): TestConfig | null {
  return testConfigs[testType] || null;
}

export function getTestsByCategory(category: string): TestConfig[] {
  return Object.values(testConfigs).filter(config => config.category === category);
}