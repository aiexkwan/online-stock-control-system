/**
 * Dialog System Unified Exports
 * Centralized exports for the reorganized dialog system
 * 
 * This module provides clear separation between:
 * - Business Dialog Types: Used for business logic dialogs (askDatabase, loadStock, etc.)
 * - UI Dialog Variants: Used for UI styling and animation variants (notification, error, etc.)
 */

// Business Dialog System - For business logic dialogs
export type { 
  BusinessDialogType,
  BusinessDialogData,
  BusinessDialogContextType,
  BusinessDialogHookResult
} from './business/types';

export { 
  BusinessDialogProvider,
  useBusinessDialog,
  useUploadDialog
} from './business/context';

// UI Dialog System - For UI styling and animations
export {
  dialogAnimationClasses,
  dialogVariants,
  dialogIconColors,
  dialogTitleStyles,
  dialogButtonStyles,
  type DialogVariants,
  type UIDialogVariant
} from './ui/animation';

// Legacy exports for backward compatibility (deprecated)
// These will be removed in the next major version
export type {
  BusinessDialogType as DialogType,
  BusinessDialogData as DialogData,
  BusinessDialogContextType as DialogContextType,
  BusinessDialogHookResult as DialogHookResult
} from './business/types';

export {
  BusinessDialogProvider as DialogProvider,
  useBusinessDialog as useDialog
} from './business/context';