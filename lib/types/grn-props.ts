/**
 * GRN Label Card Enhanced Props Interface
 *
 * This file provides enhanced TypeScript Props interfaces for all GRN-related components,
 * offering better flexibility, customization options, and maintainability while ensuring
 * backward compatibility with existing implementations.
 *
 * Features:
 * - Strong type definitions with comprehensive documentation
 * - Default values and optional configuration
 * - Backward compatibility with existing props
 * - Configuration validation and error handling
 * - Theme and styling customization options
 *
 * @see /app/(app)/admin/cards/GRNLabelCard.tsx
 * @see /app/(app)/print-grnlabel/components/
 */

import { z } from 'zod';
import type { GrnProductInfo, GrnSupplierInfo, GrnFormData } from './grn-validation';
import type { PalletTypeKey, PackageTypeKey, LabelMode } from './grn';

/**
 * Theme and visual configuration options
 */
export interface GrnThemeConfig {
  /** Primary accent color (default: 'orange') */
  accentColor?: 'orange' | 'blue' | 'green' | 'purple' | 'red';

  /** Card border style (default: 'glass') */
  borderStyle?: 'glass' | 'solid' | 'gradient' | 'none';

  /** Enable glow effects (default: true) */
  enableGlow?: boolean;

  /** Enable animations (default: true) */
  enableAnimations?: boolean;

  /** Custom CSS classes for different parts */
  customClasses?: {
    container?: string;
    header?: string;
    content?: string;
    button?: string;
    input?: string;
  };
}

/**
 * Layout and behavior configuration
 */
export interface GrnLayoutConfig {
  /** Maximum number of weight inputs (default: 22) */
  maxWeightInputs?: number;

  /** Auto-expand weight list threshold (default: 5) */
  autoExpandThreshold?: number;

  /** Enable compact mode (default: false) */
  compactMode?: boolean;

  /** Show progress bar (default: true) */
  showProgressBar?: boolean;

  /** Show weight calculation summary (default: true) */
  showWeightSummary?: boolean;

  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Validation and security configuration
 */
export interface GrnValidationConfig {
  /** Enable real-time validation (default: true) */
  enableRealTimeValidation?: boolean;

  /** Strict mode for data validation (default: true) */
  strictMode?: boolean;

  /** Custom validation rules */
  customValidators?: {
    productCode?: (code: string) => boolean | string;
    supplierCode?: (code: string) => boolean | string;
    grnNumber?: (number: string) => boolean | string;
    clockNumber?: (number: string) => boolean | string;
  };

  /** Enable sanitization logging (default: true) */
  enableSanitization?: boolean;
}

/**
 * Feature toggles and optional functionality
 */
export interface GrnFeatureConfig {
  /** Enable print functionality (default: true) */
  enablePrinting?: boolean;

  /** Enable clock number confirmation dialog (default: true) */
  enableClockNumberDialog?: boolean;

  /** Enable automatic supplier lookup (default: true) */
  enableSupplierLookup?: boolean;

  /** Enable automatic product lookup (default: true) */
  enableProductLookup?: boolean;

  /** Enable weight calculation helpers (default: true) */
  enableWeightCalculation?: boolean;

  /** Enable undo/redo functionality (default: false) */
  enableUndoRedo?: boolean;

  /** Enable data export functionality (default: false) */
  enableDataExport?: boolean;
}

/**
 * Callback function types for enhanced event handling
 */
export interface GrnCallbacks {
  /** Triggered when form data changes */
  onFormChange?: (formData: GrnFormData, field: keyof GrnFormData) => void;

  /** Triggered when validation state changes */
  onValidationChange?: (isValid: boolean, errors: string[]) => void;

  /** Triggered before print operation */
  onBeforePrint?: (data: GrnFormData, weights: string[]) => boolean | Promise<boolean>;

  /** Triggered after successful print */
  onPrintSuccess?: (labelCount: number) => void;

  /** Triggered on print error */
  onPrintError?: (error: string) => void;

  /** Triggered when user data is loaded */
  onUserLoad?: (userId: string) => void;

  /** Triggered on state changes for external monitoring */
  onStateChange?: (state: any) => void;

  /** Triggered on validation errors */
  onValidationError?: (field: string, error: string) => void;

  /** Triggered when max items reached */
  onMaxItemsReached?: () => void;
}

/**
 * Performance optimization options
 */
export interface GrnPerformanceConfig {
  /** Enable component memoization (default: true) */
  enableMemoization?: boolean;

  /** Debounce delay for input validation (default: 300ms) */
  validationDebounce?: number;

  /** Debounce delay for auto-save (default: 1000ms) */
  autoSaveDebounce?: number;

  /** Enable virtual scrolling for large lists (default: false) */
  enableVirtualScrolling?: boolean;

  /** Lazy load non-critical components (default: true) */
  enableLazyLoading?: boolean;
}

/**
 * Accessibility configuration
 */
export interface GrnAccessibilityConfig {
  /** ARIA labels for screen readers */
  ariaLabels?: {
    mainForm?: string;
    weightInputs?: string;
    printButton?: string;
    progressBar?: string;
  };

  /** Keyboard navigation configuration */
  keyboardNavigation?: {
    enabled?: boolean;
    skipLinks?: boolean;
    focusTrap?: boolean;
  };

  /** High contrast mode support (default: false) */
  highContrastMode?: boolean;

  /** Reduced motion support (default: true) */
  respectReducedMotion?: boolean;
}

/**
 * Enhanced Props interface for GRNLabelCard component
 * Provides comprehensive configuration while maintaining backward compatibility
 */
export interface EnhancedGRNLabelCardProps {
  /** Basic styling (backward compatibility) */
  className?: string;

  /** Component ID for testing and accessibility */
  id?: string;

  /** Theme configuration */
  theme?: GrnThemeConfig;

  /** Layout and behavior configuration */
  layout?: GrnLayoutConfig;

  /** Validation configuration */
  validation?: GrnValidationConfig;

  /** Feature toggles */
  features?: GrnFeatureConfig;

  /** Event callbacks */
  callbacks?: GrnCallbacks;

  /** Performance optimizations */
  performance?: GrnPerformanceConfig;

  /** Accessibility options */
  accessibility?: GrnAccessibilityConfig;

  /** Initial form data (optional) */
  initialData?: Partial<GrnFormData>;

  /** Initial weights (optional) */
  initialWeights?: string[];

  /** Disable the entire component */
  disabled?: boolean;

  /** Read-only mode */
  readOnly?: boolean;

  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Enhanced Props interface for GrnDetailCard component
 */
export interface EnhancedGrnDetailCardProps {
  /** Core data props (required for backward compatibility) */
  formData: GrnFormData;
  labelMode: LabelMode;
  productInfo: GrnProductInfo | null;
  supplierInfo: GrnSupplierInfo | null;
  supplierError: string | null;
  currentUserId: string;
  palletType: Record<PalletTypeKey, string>;
  packageType: Record<PackageTypeKey, string>;

  /** Core callback props (required for backward compatibility) */
  onFormChange: (field: keyof GrnFormData, value: string) => void;
  onSupplierInfoChange: (supplierInfo: GrnSupplierInfo | null) => void;
  onProductInfoChange: (productInfo: GrnProductInfo | null) => void;
  onLabelModeChange: (mode: LabelMode) => void;
  onPalletTypeChange: (key: PalletTypeKey, value: string) => void;
  onPackageTypeChange: (key: PackageTypeKey, value: string) => void;

  /** Enhanced configuration options */
  disabled?: boolean;
  className?: string;
  theme?: Pick<GrnThemeConfig, 'accentColor' | 'customClasses'>;
  validation?: Pick<GrnValidationConfig, 'enableRealTimeValidation' | 'customValidators'>;
  features?: Pick<GrnFeatureConfig, 'enableSupplierLookup' | 'enableProductLookup'>;

  /** Enhanced callbacks */
  onValidationError?: (field: string, error: string) => void;
  onFieldFocus?: (field: keyof GrnFormData) => void;
  onFieldBlur?: (field: keyof GrnFormData, value: string) => void;
}

/**
 * Enhanced Props interface for WeightInputList component
 */
export interface EnhancedWeightInputListProps {
  /** Core props (required for backward compatibility) */
  grossWeights: string[];
  onChange: (index: number, value: string) => void;
  labelMode: LabelMode;

  /** Enhanced core props */
  onRemove?: (index: number) => void;
  selectedPalletType?: PalletTypeKey;
  selectedPackageType?: PackageTypeKey;
  maxItems?: number;
  disabled?: boolean;

  /** Configuration options */
  className?: string;
  theme?: Pick<GrnThemeConfig, 'accentColor' | 'customClasses'>;
  layout?: Pick<GrnLayoutConfig, 'compactMode' | 'autoExpandThreshold' | 'showWeightSummary'>;
  validation?: Pick<GrnValidationConfig, 'enableRealTimeValidation'>;
  performance?: Pick<GrnPerformanceConfig, 'validationDebounce' | 'enableVirtualScrolling'>;

  /** Enhanced callbacks */
  onWeightCalculated?: (index: number, netWeight: number) => void;
  onListExpanded?: (expanded: boolean) => void;
  onMaxItemsReached?: () => void;

  /** Display options */
  showIndex?: boolean;
  showNetWeight?: boolean;
  showTotalWeight?: boolean;
  placeholder?: string;
}

/**
 * Default configuration values
 * These provide sensible defaults while allowing customization
 */
export const DEFAULT_GRN_THEME: Required<GrnThemeConfig> = {
  accentColor: 'orange',
  borderStyle: 'glass',
  enableGlow: true,
  enableAnimations: true,
  customClasses: {},
};

export const DEFAULT_GRN_LAYOUT: Required<GrnLayoutConfig> = {
  maxWeightInputs: 22,
  autoExpandThreshold: 5,
  compactMode: false,
  showProgressBar: true,
  showWeightSummary: true,
  enableKeyboardShortcuts: true,
};

export const DEFAULT_GRN_VALIDATION: Required<GrnValidationConfig> = {
  enableRealTimeValidation: true,
  strictMode: true,
  enableSanitization: true,
  customValidators: {},
};

export const DEFAULT_GRN_FEATURES: Required<GrnFeatureConfig> = {
  enablePrinting: true,
  enableClockNumberDialog: true,
  enableSupplierLookup: true,
  enableProductLookup: true,
  enableWeightCalculation: true,
  enableUndoRedo: false,
  enableDataExport: false,
};

export const DEFAULT_GRN_PERFORMANCE: Required<GrnPerformanceConfig> = {
  enableMemoization: true,
  validationDebounce: 300,
  autoSaveDebounce: 1000,
  enableVirtualScrolling: false,
  enableLazyLoading: true,
};

export const DEFAULT_GRN_ACCESSIBILITY: Required<
  Omit<GrnAccessibilityConfig, 'ariaLabels' | 'keyboardNavigation'>
> = {
  highContrastMode: false,
  respectReducedMotion: true,
};

/**
 * Configuration validation schemas
 * These ensure type safety for configuration objects
 */
export const GrnThemeConfigSchema = z.object({
  accentColor: z.enum(['orange', 'blue', 'green', 'purple', 'red']).optional(),
  borderStyle: z.enum(['glass', 'solid', 'gradient', 'none']).optional(),
  enableGlow: z.boolean().optional(),
  enableAnimations: z.boolean().optional(),
  customClasses: z
    .object({
      container: z.string().optional(),
      header: z.string().optional(),
      content: z.string().optional(),
      button: z.string().optional(),
      input: z.string().optional(),
    })
    .optional(),
});

export const GrnLayoutConfigSchema = z.object({
  maxWeightInputs: z.number().int().min(1).max(50).optional(),
  autoExpandThreshold: z.number().int().min(1).optional(),
  compactMode: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  showWeightSummary: z.boolean().optional(),
  enableKeyboardShortcuts: z.boolean().optional(),
});

/**
 * Utility functions for working with enhanced props
 */

/**
 * Merges user-provided configuration with defaults
 */
export function mergeGrnConfig<T extends Record<string, any>>(
  userConfig: Partial<T> | undefined,
  defaultConfig: T
): T {
  if (!userConfig) {
    return defaultConfig;
  }

  return {
    ...defaultConfig,
    ...userConfig,
    // Deep merge for nested objects
    ...(userConfig.customClasses && defaultConfig.customClasses
      ? {
          customClasses: {
            ...defaultConfig.customClasses,
            ...userConfig.customClasses,
          },
        }
      : {}),
  };
}

/**
 * Validates configuration objects at runtime
 */
export function validateGrnThemeConfig(config: unknown): GrnThemeConfig | null {
  const result = GrnThemeConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

export function validateGrnLayoutConfig(config: unknown): GrnLayoutConfig | null {
  const result = GrnLayoutConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

/**
 * Type guards for enhanced props
 */
export function isEnhancedGRNLabelCardProps(props: any): props is EnhancedGRNLabelCardProps {
  return typeof props === 'object' && props !== null;
}

/**
 * Backward compatibility helper
 * Converts legacy props to enhanced props format
 */
export function convertLegacyProps(legacyProps: { className?: string }): EnhancedGRNLabelCardProps {
  return {
    className: legacyProps.className,
    theme: DEFAULT_GRN_THEME,
    layout: DEFAULT_GRN_LAYOUT,
    validation: DEFAULT_GRN_VALIDATION,
    features: DEFAULT_GRN_FEATURES,
    performance: DEFAULT_GRN_PERFORMANCE,
    accessibility: DEFAULT_GRN_ACCESSIBILITY,
  };
}

/**
 * Props factory functions for common configurations
 */
export function createCompactGrnProps(
  baseProps?: Partial<EnhancedGRNLabelCardProps>
): EnhancedGRNLabelCardProps {
  return {
    ...baseProps,
    layout: {
      ...DEFAULT_GRN_LAYOUT,
      ...baseProps?.layout,
      compactMode: true,
      showProgressBar: false,
      maxWeightInputs: 10,
    },
    theme: {
      ...DEFAULT_GRN_THEME,
      ...baseProps?.theme,
      enableAnimations: false,
    },
  };
}

export function createDebugGrnProps(
  baseProps?: Partial<EnhancedGRNLabelCardProps>
): EnhancedGRNLabelCardProps {
  return {
    ...baseProps,
    debug: true,
    validation: {
      ...DEFAULT_GRN_VALIDATION,
      ...baseProps?.validation,
      strictMode: true,
      enableRealTimeValidation: true,
    },
    performance: {
      ...DEFAULT_GRN_PERFORMANCE,
      ...baseProps?.performance,
      validationDebounce: 100,
    },
  };
}

export function createReadOnlyGrnProps(
  baseProps?: Partial<EnhancedGRNLabelCardProps>
): EnhancedGRNLabelCardProps {
  return {
    ...baseProps,
    readOnly: true,
    features: {
      ...DEFAULT_GRN_FEATURES,
      ...baseProps?.features,
      enablePrinting: false,
      enableClockNumberDialog: false,
    },
  };
}
