/**
 * Testing Configuration Type Definitions
 * Test configuration and control interfaces
 */

import { LucideIcon } from 'lucide-react';

// Test control types
export interface ABTestingControls {
  v2Percentage: number;
  autoRollback: boolean;
  performanceThreshold: number;
  simulationMode: boolean;
}

export interface DualRunControls {
  parallelRun: boolean;
  captureMetrics: boolean;
  compareVisual: boolean;
}

export interface OptimizationControls {
  enableVirtualization: boolean;
  enablePreloading: boolean;
  measureRenderTime: boolean;
}

export interface MigrationControls {
  showOldVersion: boolean;
  showNewVersion: boolean;
  highlightDifferences: boolean;
}

export interface RegistryControls {
  testLazyLoading: boolean;
  testPreloading: boolean;
  measureBundleSize: boolean;
}

// Union type for all test controls
export type TestControlsUnion =
  | ABTestingControls
  | DualRunControls
  | OptimizationControls
  | MigrationControls
  | RegistryControls;

// Test categories
export type TestCategory = 'performance' | 'migration' | 'verification' | 'system';

// Test configuration interface
export interface TestConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: TestCategory;
  features: string[];
  defaultControls?: TestControlsUnion;
}

// Test category configuration
export interface TestCategoryConfig {
  label: string;
  description: string;
  color: string;
}
