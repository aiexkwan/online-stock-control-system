'use client';

import React, { useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { useProgressDebounce } from '@/lib/hooks/useProgressDebounce';
import { useResourceCleanup } from '@/lib/hooks/useResourceCleanup';
import { getOptimizedClient } from '@/app/utils/supabase/optimized-client';
import { getGrnDatabaseService } from '@/lib/database/grn-database-service';
import { toast } from 'sonner';
import { grnErrorHandler } from '@/app/(app)/print-grnlabel/services/ErrorHandler';
import { EnhancedProgressBar } from '../components/EnhancedProgressBar';
import ClockNumberConfirmDialog from '../components/ClockNumberConfirmDialog';
import { SpecialCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createGrnLogger } from '@/lib/security/grn-logger';
import {
  validateProductInfo,
  validateSupplierInfo,
  validateClockNumber,
  validateGrossWeight,
  validateGrossWeights,
  type GrnProductInfo as ValidatedGrnProductInfo,
  type GrnSupplierInfo,
  type GrnFormData,
} from '@/lib/types/grn-validation';

// Import new modular components from print-grnlabel
import { GrnDetailCard } from '@/app/(app)/print-grnlabel/components/GrnDetailCard';
import { WeightInputList } from '@/app/(app)/print-grnlabel/components/WeightInputList';

// Import constants
import {
  LABEL_MODES,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';

// Import custom hooks
import { useGrnFormReducer } from '@/app/(app)/print-grnlabel/hooks/useGrnFormReducer';
import { useAdminGrnLabelBusiness } from '../hooks/useAdminGrnLabelBusiness';

// Import enhanced Props types
import { 
  EnhancedGRNLabelCardProps,
  DEFAULT_GRN_THEME,
  DEFAULT_GRN_LAYOUT,
  DEFAULT_GRN_VALIDATION,
  DEFAULT_GRN_FEATURES,
  DEFAULT_GRN_PERFORMANCE,
  DEFAULT_GRN_ACCESSIBILITY,
  mergeGrnConfig,
  convertLegacyProps
} from '@/lib/types/grn-props';

// Type definitions - keeping interface for backward compatibility
interface GrnProductInfo {
  code: string;
  description: string;
  weight: string;
  supplier: string;
}

// Use validated types for new implementations
type SafeGrnProductInfo = ValidatedGrnProductInfo;
type SafeGrnSupplierInfo = GrnSupplierInfo;

// Legacy Props interface for backward compatibility
export interface GRNLabelCardProps {
  className?: string;
}

// Enhanced Props type combining legacy and new interfaces
export type GRNLabelCardPropsUnion = GRNLabelCardProps | EnhancedGRNLabelCardProps;

// Optimized theme constants for better performance (moved from inline objects)
const GRN_THEME = {
  borderColor: 'border-orange-500/20',
  glowColor: 'shadow-orange-500/10',
  accentColor: 'text-orange-400',
  headerBg: 'bg-orange-500/10',
} as const;

const GRN_BUTTON_STYLES = {
  enabled: 'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500',
  disabled: 'cursor-not-allowed bg-white/5 text-slate-400',
} as const;

const GRN_BADGE_STYLES = {
  labelCount: 'ml-auto rounded-full bg-orange-600/80 px-2 py-1 font-medium text-white',
  buttonBadge: 'rounded-full bg-orange-800 px-2 py-0.5 font-bold',
} as const;

// Optimized CSS classes for better performance
const GRN_CSS_CLASSES = {
  spinner: 'h-4 w-4 animate-spin rounded-full border-b-2 border-white',
} as const;

const GRNLabelCardComponent: React.FC<GRNLabelCardPropsUnion> = (props) => {
  // Handle both legacy and enhanced props
  const enhancedProps: EnhancedGRNLabelCardProps = React.useMemo(() => {
    // Check if this is legacy props (only has className)
    if ('className' in props && Object.keys(props).length === 1) {
      return convertLegacyProps(props as GRNLabelCardProps);
    }
    // This is enhanced props
    return props as EnhancedGRNLabelCardProps;
  }, [props]);

  // Merge with defaults
  const config = React.useMemo(() => ({
    theme: mergeGrnConfig(enhancedProps.theme, DEFAULT_GRN_THEME),
    layout: mergeGrnConfig(enhancedProps.layout, DEFAULT_GRN_LAYOUT),
    validation: mergeGrnConfig(enhancedProps.validation, DEFAULT_GRN_VALIDATION),
    features: mergeGrnConfig(enhancedProps.features, DEFAULT_GRN_FEATURES),
    performance: mergeGrnConfig(enhancedProps.performance, DEFAULT_GRN_PERFORMANCE),
    accessibility: mergeGrnConfig(enhancedProps.accessibility, DEFAULT_GRN_ACCESSIBILITY),
  }), [enhancedProps]);

  const {
    className = '',
    id,
    disabled = false,
    readOnly = false,
    debug = false,
    initialData,
    initialWeights,
    callbacks
  } = enhancedProps;
  // Initialize resource cleanup for this component
  const resourceCleanup = useResourceCleanup('GRNLabelCard', debug);
  
  // Initialize GRN logger for this component
  const logger = useMemo(() => {
    const loggerInstance = createGrnLogger('GRNLabelCard');
    if (debug) {
      loggerInstance.info('GRN Label Card initialized with config:', {
        theme: config.theme.accentColor,
        layout: config.layout.compactMode ? 'compact' : 'full',
        features: Object.keys(config.features).filter(k => config.features[k as keyof typeof config.features]),
        disabled,
        readOnly
      });
    }
    return loggerInstance;
  }, [debug, config, disabled, readOnly]);
  
  // Use optimized Supabase client with singleton pattern
  const [supabase] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return getOptimizedClient();
    }
    return null;
  });
  
  // Initialize GRN database service for optimized operations
  const grnDbService = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return getGrnDatabaseService();
    }
    return null;
  }, []);

  // 使用統一的 state 管理
  const { state, actions } = useGrnFormReducer();
  
  // Apply initial data if provided
  useEffect(() => {
    if (initialData) {
      // Only apply fields that exist in our form
      const supportedFields = ['grnNumber', 'materialSupplier', 'productCode'] as const;
      supportedFields.forEach((field) => {
        const value = initialData[field];
        if (value !== undefined && typeof value === 'string') {
          actions.setFormField(field, value);
        }
      });
      logger.info('Applied initial form data', initialData);
    }
    if (initialWeights && initialWeights.length > 0) {
      actions.setGrossWeights(initialWeights);
      logger.info('Applied initial weights', { count: initialWeights.length });
    }
  }, [initialData, initialWeights, actions, logger]);

  // 當前用戶 ID
  const [currentUserId, setCurrentUserId] = React.useState<string>('');

  // Adapter function to convert QC Label ProductInfo to GRN ProductInfo
  // Now uses Zod validation for runtime type safety
  const adaptProductInfo = useCallback(
    (qcProductInfo: unknown): SafeGrnProductInfo | null => {
      // Use Zod validation instead of manual type checking
      const validated = validateProductInfo(qcProductInfo);
      
      if (!validated) {
        logger.warn('Invalid product info received', { qcProductInfo });
        return null;
      }

      return validated;
    },
    [logger]
  );

  // Setup debounced progress updates for better performance
  const handleProgressUpdate = useCallback((update: any) => {
    if (update.current !== undefined || update.total !== undefined) {
      actions.setProgress({
        current: update.current ?? state.progress.current,
        total: update.total ?? state.progress.total,
        status: update.status ?? state.progress.status,
      });
    }
    if (update.statusUpdate) {
      actions.updateProgressStatus(update.statusUpdate.index, update.statusUpdate.status);
    }
  }, [actions, state.progress]);
  
  const {
    updateProgress: debouncedUpdateProgress,
    updateProgressCount,
    updateProgressStatus: debouncedUpdateProgressStatus,
    flushUpdates,
    getMetrics,
  } = useProgressDebounce(handleProgressUpdate, {
    progressDelay: 100,
    statusDelay: 50,
    enableSmartBatching: true,
    maxBatchSize: 3,
  });

  // Use the business logic hook with debounced progress updates and resource management
  const { 
    weightCalculation, 
    processPrintRequest, 
    cancelCurrentOperation 
  } = useAdminGrnLabelBusiness({
    state,
    actions: {
      ...actions,
      // Enhance actions with debounced progress updates
      setProgress: (progress) => {
        if (resourceCleanup.isMounted()) {
          debouncedUpdateProgress({ 
            current: progress.current, 
            total: progress.total, 
            status: progress.status 
          });
        }
      },
      updateProgressStatus: (index, status) => {
        if (resourceCleanup.isMounted()) {
          debouncedUpdateProgressStatus(index, status, status === 'Success' || status === 'Failed');
        }
      },
    },
    currentUserId,
  });

  // Initialize user with enhanced cancellation support
  useEffect(() => {
    const abortController = resourceCleanup.createAbortController('userInitialization');
    
    const initializeUser = async () => {
      try {
        if (abortController.signal.aborted) return;
        
        if (!supabase) {
          logger.error('Supabase client not initialized');
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Check if component is still mounted and operation not aborted
        if (abortController.signal.aborted || !resourceCleanup.isMounted()) return;

        if (user?.email) {
          const clockNumber = user.email.split('@')[0];
          setCurrentUserId(clockNumber);
        } else {
          grnErrorHandler.handleDatabaseError(
            new Error('User session not found. Please log in again.'),
            {
              component: 'GRNLabelCard',
              action: 'auth_initialization',
            },
            'authentication'
          );
        }
      } catch (error) {
        // Check if component is still mounted and operation not aborted before handling error
        if (abortController.signal.aborted || !resourceCleanup.isMounted()) return;
        
        logger.error('Error getting user info', error);
        grnErrorHandler.handleDatabaseError(
          error as Error,
          {
            component: 'GRNLabelCard',
            action: 'auth_initialization',
          },
          'authentication'
        );
      }
    };

    initializeUser();

    // Cleanup is handled by resourceCleanup hook
  }, [supabase, logger, resourceCleanup]);

  // 確保初始狀態有至少一個輸入框
  useEffect(() => {
    if (state.grossWeights.length === 0) {
      actions.setGrossWeights(['']);
    }
  }, [actions, state.grossWeights.length]);
  
  // Enhanced callbacks integration
  useEffect(() => {
    if (callbacks?.onStateChange) {
      callbacks.onStateChange(state);
    }
  }, [state, callbacks]);
  
  // Form handlers - optimized dependency arrays
  const handleFormChange = useCallback(
    (field: keyof typeof state.formData, value: string) => {
      // Skip if disabled or read-only
      if (disabled || readOnly) {
        logger.warn('Form change blocked - component is disabled or read-only');
        return;
      }
      
      // Apply custom validation if available
      if (config.validation.customValidators?.[field as keyof typeof config.validation.customValidators]) {
        const validator = config.validation.customValidators[field as keyof typeof config.validation.customValidators];
        const validationResult = validator!(value);
        if (validationResult !== true) {
          const errorMessage = typeof validationResult === 'string' ? validationResult : 'Invalid value';
          logger.warn(`Custom validation failed for ${field}:`, errorMessage);
          if (callbacks?.onValidationError) {
            callbacks.onValidationError(field, errorMessage);
          }
          return;
        }
      }
      
      actions.setFormField(field, value);
      logger.debug('Form field updated:', { field, value });
      
      // Trigger form change callback
      if (callbacks?.onFormChange) {
        // Create a compatible form data object for callback
        const callbackFormData = {
          grnNumber: state.formData.grnNumber,
          materialSupplier: state.formData.materialSupplier,
          productCode: state.formData.productCode,
          batchNumber: '',
          expiryDate: '',
          notes: ''
        } as GrnFormData;
        callbacks.onFormChange(callbackFormData, field as keyof typeof state.formData);
      }
    },
    [actions, disabled, readOnly, config.validation, callbacks, logger, state.formData]
  );

  // Enhanced cleanup with resource management
  useEffect(() => {
    return () => {
      // Cancel any ongoing print operations
      if (cancelCurrentOperation) {
        cancelCurrentOperation();
      }
      
      // Flush any pending progress updates
      flushUpdates();
      
      // Force cleanup all resources
      resourceCleanup.forceCleanup();
      
      // Legacy timeout cleanup for backwards compatibility
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [cancelCurrentOperation, flushUpdates, resourceCleanup]);


  const handleSupplierInfoChange = useCallback(
    (supplierInfo: unknown) => {
      // Use Zod validation instead of manual type checking
      const validated = validateSupplierInfo(supplierInfo);
      
      if (validated) {
        actions.setSupplierInfo(validated);
        actions.setSupplierError(null);
      } else {
        logger.warn('Invalid supplier info received', { supplierInfo });
        actions.setSupplierError('Invalid supplier information format');
      }
    },
    [actions, logger]
  );

  // Handle label mode change - optimized with ref pattern
  const handleLabelModeChange = useCallback(
    (mode: LabelMode) => {
      if (disabled || readOnly) {
        logger.warn('Label mode change blocked - component is disabled or read-only');
        return;
      }
      
      actions.setLabelMode(mode);
      logger.info('Label mode changed:', mode);

      if (mode === 'qty') {
        // Set Not Included = 1 for both pallet and package types
        Object.keys(stateRef.current.palletType).forEach(key => {
          actions.setPalletType(key as PalletTypeKey, key === 'notIncluded' ? '1' : '');
        });
        Object.keys(stateRef.current.packageType).forEach(key => {
          actions.setPackageType(key as PackageTypeKey, key === 'notIncluded' ? '1' : '');
        });
      } else {
        // Reset both pallet and package types when switching to weight mode
        Object.keys(stateRef.current.palletType).forEach(key => {
          actions.setPalletType(key as PalletTypeKey, '');
        });
        Object.keys(stateRef.current.packageType).forEach(key => {
          actions.setPackageType(key as PackageTypeKey, '');
        });
      }
    },
    [actions, disabled, readOnly, logger]
  );

  const handlePalletTypeChange = useCallback(
    (key: PalletTypeKey, value: string) => {
      // 先清空所有托盤類型
      Object.keys(stateRef.current.palletType).forEach(k => {
        actions.setPalletType(k as PalletTypeKey, '');
      });
      // 設置選中的托盤類型
      actions.setPalletType(key, value);
    },
    [actions] // Use ref instead of state dependency
  );

  const handlePackageTypeChange = useCallback(
    (key: PackageTypeKey, value: string) => {
      // 先清空所有包裝類型
      Object.keys(stateRef.current.packageType).forEach(k => {
        actions.setPackageType(k as PackageTypeKey, '');
      });
      // 設置選中的包裝類型
      actions.setPackageType(key, value);
    },
    [actions] // Use ref instead of state dependency
  );

  // 使用 ref 來避免閉包問題和存儲 timeout ID
  const stateRef = useRef(state);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  stateRef.current = state;

  const handleGrossWeightChange = useCallback(
    (idx: number, value: string) => {
      if (disabled || readOnly) {
        logger.warn('Weight change blocked - component is disabled or read-only');
        return;
      }
      
      const currentState = stateRef.current;
      const maxItems = config.layout.maxWeightInputs;

      // Validate weight input using Zod
      if (value.trim() !== '' && !validateGrossWeight(value)) {
        logger.warn('Invalid weight format', { weight: value, index: idx });
        if (callbacks?.onValidationError) {
          callbacks.onValidationError('grossWeight', `Invalid weight format: "${value}". Please enter a valid number.`);
        }
        grnErrorHandler.handleValidationError(
          'form',
          `Invalid weight format: "${value}". Please enter a valid number.`,
          {
            component: 'GRNLabelCard',
            action: 'weight_input_validation',
            clockNumber: currentUserId,
            additionalData: { weight: value, index: idx },
          }
        );
        return;
      }

      actions.setGrossWeight(idx, value);
      logger.debug('Weight updated:', { index: idx, value, maxItems });

      // 清理之前的 timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // 自動添加新行 - 使用配置的最大項目數和資源管理
      if (
        idx === currentState.grossWeights.length - 1 &&
        value.trim() !== '' &&
        currentState.grossWeights.length < maxItems
      ) {
        if (currentState.grossWeights.length >= maxItems - 1 && callbacks?.onMaxItemsReached) {
          callbacks.onMaxItemsReached();
        }
        
        // Use managed timeout with resource cleanup
        timeoutRef.current = resourceCleanup.createTimeout(() => {
          if (resourceCleanup.isMounted()) {
            actions.addGrossWeight();
          }
          timeoutRef.current = null;
        }, 0, `autoAddWeight_${idx}`);
      }
    },
    [actions, currentUserId, logger, disabled, readOnly, config.layout.maxWeightInputs, callbacks]
  );

  // Memoized weight remove callback to prevent unnecessary re-renders
  const handleWeightRemove = useCallback(
    (idx: number) => {
      actions.removeGrossWeight(idx);
      // 確保至少有一個輸入框
      const currentWeights = stateRef.current.grossWeights;
      if (
        currentWeights.length === 1 ||
        (currentWeights.length === 2 &&
          currentWeights[currentWeights.length - 1].trim() !== '')
      ) {
        actions.addGrossWeight();
      }
    },
    [actions]
  );

  // Optimized form validation with memoized sub-computations
  const hasRequiredFields = useMemo(() => {
    return (
      state.formData.grnNumber.trim() !== '' &&
      state.formData.materialSupplier.trim() !== '' &&
      state.formData.productCode.trim() !== '' &&
      state.productInfo &&
      state.supplierInfo
    );
  }, [
    state.formData.grnNumber,
    state.formData.materialSupplier,
    state.formData.productCode,
    state.productInfo,
    state.supplierInfo,
  ]);

  const hasValidLabelModeConfig = useMemo(() => {
    return (
      state.labelMode === 'qty' ||
      (Object.values(state.palletType).some(v => v.trim() !== '') &&
        Object.values(state.packageType).some(v => v.trim() !== ''))
    );
  }, [state.labelMode, state.palletType, state.packageType]);

  const validWeights = useMemo(() => {
    return validateGrossWeights(state.grossWeights.filter(w => w.trim() !== ''));
  }, [state.grossWeights]);

  const isFormValid = useMemo(() => {
    return hasRequiredFields && hasValidLabelModeConfig && validWeights.length > 0;
  }, [hasRequiredFields, hasValidLabelModeConfig, validWeights]);

  // Print handler
  const handlePrintClick = useCallback(async () => {
    if (!config.features.enablePrinting) {
      logger.warn('Print functionality is disabled');
      return;
    }
    
    if (disabled || readOnly) {
      logger.warn('Print blocked - component is disabled or read-only');
      return;
    }
    
    if (!isFormValid) {
      const errors = ['Please fill all required fields and ensure product/supplier details are loaded'];
      if (callbacks?.onValidationChange) {
        callbacks.onValidationChange(false, errors);
      }
      grnErrorHandler.handleValidationError(
        'form',
        errors[0],
        {
          component: 'GRNLabelCard',
          action: 'form_validation',
          clockNumber: currentUserId,
        }
      );
      return;
    }
    
    // Call before print callback
    if (callbacks?.onBeforePrint) {
      // Create compatible form data for callback
      const callbackFormData = {
        grnNumber: state.formData.grnNumber,
        materialSupplier: state.formData.materialSupplier,
        productCode: state.formData.productCode,
        batchNumber: '',
        expiryDate: '',
        notes: ''
      } as GrnFormData;
      const allowPrint = await callbacks.onBeforePrint(
        callbackFormData,
        state.grossWeights.filter(w => w.trim() !== '')
      );
      if (!allowPrint) {
        logger.info('Print operation cancelled by beforePrint callback');
        return;
      }
    }
    
    logger.info('Initiating print process', {
      labelCount: state.grossWeights.filter(w => w.trim() !== '').length,
      mode: state.labelMode
    });
    
    if (config.features.enableClockNumberDialog) {
      actions.toggleClockNumberDialog();
    } else {
      // Direct print without dialog
      await processPrintRequest(currentUserId);
    }
  }, [isFormValid, actions, currentUserId, config.features, disabled, readOnly, callbacks, logger, state, processPrintRequest]);

  // Clock number confirmation with validation
  const handleClockNumberConfirm = useCallback(
    async (clockNumber: string) => {
      // Validate clock number format
      let validatedClockNumber = validateClockNumber(clockNumber);
      
      // Apply custom clock number validation if provided
      if (config.validation.customValidators?.clockNumber && validatedClockNumber) {
        const customValidation = config.validation.customValidators.clockNumber(validatedClockNumber);
        if (customValidation !== true) {
          const errorMessage = typeof customValidation === 'string' ? customValidation : 'Invalid clock number';
          logger.warn('Custom clock number validation failed:', errorMessage);
          if (callbacks?.onValidationError) {
            callbacks.onValidationError('clockNumber', errorMessage);
          }
          grnErrorHandler.handleValidationError('form', errorMessage, {
            component: 'GRNLabelCard',
            action: 'clock_number_validation',
            clockNumber: currentUserId,
          });
          return;
        }
      }
      
      if (!validatedClockNumber) {
        const errorMessage = 'Invalid clock number format. Please use alphanumeric characters only.';
        if (callbacks?.onValidationError) {
          callbacks.onValidationError('clockNumber', errorMessage);
        }
        grnErrorHandler.handleValidationError('form', errorMessage, {
          component: 'GRNLabelCard',
          action: 'clock_number_validation',
          clockNumber: currentUserId,
        });
        return;
      }

      actions.toggleClockNumberDialog();
      logger.info('Clock number confirmed, starting print process:', validatedClockNumber);
      
      try {
        await processPrintRequest(validatedClockNumber);
        if (callbacks?.onPrintSuccess) {
          callbacks.onPrintSuccess(state.grossWeights.filter(w => w.trim() !== '').length);
        }
      } catch (error) {
        logger.error('Print process failed:', error);
        if (callbacks?.onPrintError) {
          callbacks.onPrintError(error instanceof Error ? error.message : 'Unknown print error');
        }
      }
    },
    [processPrintRequest, actions, currentUserId, config.validation, callbacks, logger, state.grossWeights]
  );

  // Theme configuration is now externalized above for performance

  // Apply theme-based styling
  const themeClasses = React.useMemo(() => {
    const base = `h-full ${className || ''}`;
    const themeColor = config.theme.accentColor;
    const customContainer = config.theme.customClasses?.container || '';
    
    return cn(base, customContainer, {
      'transition-all duration-300': config.theme.enableAnimations,
      'opacity-50 pointer-events-none': disabled,
    });
  }, [className, config.theme, disabled]);

  return (
    <div className={themeClasses} id={id}>
        <SpecialCard
          variant='glass'
          isHoverable={false}
          borderGlow={false}
          className={`h-full overflow-hidden transition-all duration-300 ${GRN_THEME.borderColor} ${GRN_THEME.glowColor}`}
          padding='none'
        >
          <div className='flex h-full flex-col'>
            {/* Header */}
            <div
              className={`border-b border-slate-700/50 p-4 transition-all duration-300 ${GRN_THEME.headerBg}`}
            >
              <div className='flex items-center gap-2'>
                <Package className={`h-6 w-6 ${GRN_THEME.accentColor}`} />
                <h2 className={cn(cardTextStyles.title, 'text-white')}>GRN Label Generation</h2>
                {state.grossWeights.filter(w => w.trim() !== '').length > 0 && (
                  <span
                    className={cn(
                      cardTextStyles.body,
                      GRN_BADGE_STYLES.labelCount
                    )}
                  >
                    {state.grossWeights.filter(w => w.trim() !== '').length} labels
                  </span>
                )}
              </div>
              <p className={cn(cardTextStyles.body, 'text-slate-300')}>
                Generate and print GRN labels for received goods
              </p>
            </div>

            {/* Main Content */}
            <div className='min-h-0 flex-1 overflow-auto p-4'>
              <div className='space-y-6'>
                {/* GRN Details Section */}
                <div className='space-y-4'>
                  <GrnDetailCard
                    formData={state.formData}
                    labelMode={state.labelMode}
                    productInfo={state.productInfo}
                    supplierInfo={state.supplierInfo}
                    supplierError={state.ui.supplierError}
                    currentUserId={currentUserId}
                    palletType={state.palletType}
                    packageType={state.packageType}
                    onFormChange={handleFormChange}
                    onSupplierInfoChange={handleSupplierInfoChange}
                    onProductInfoChange={(qcProductInfo: unknown) => {
                      const adaptedInfo = adaptProductInfo(qcProductInfo);
                      actions.setProductInfo(adaptedInfo);
                    }}
                    onLabelModeChange={(mode: LabelMode) => handleLabelModeChange(mode)}
                    onPalletTypeChange={handlePalletTypeChange}
                    onPackageTypeChange={handlePackageTypeChange}
                    disabled={state.ui.isProcessing}
                  />
                </div>

                {/* Weight Input Section */}
                <div className='space-y-4 border-t border-slate-700/30 pt-6'>
                  <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>
                    Weight/Quantity Input
                  </h3>
                  <WeightInputList
                    grossWeights={state.grossWeights}
                    onChange={handleGrossWeightChange}
                    onRemove={handleWeightRemove}
                    labelMode={state.labelMode}
                    selectedPalletType={
                      (Object.entries(state.palletType).find(
                        ([, value]) => (parseInt(value) || 0) > 0
                      )?.[0] || 'notIncluded') as PalletTypeKey
                    }
                    selectedPackageType={
                      (Object.entries(state.packageType).find(
                        ([, value]) => (parseInt(value) || 0) > 0
                      )?.[0] || 'notIncluded') as PackageTypeKey
                    }
                    maxItems={22}
                    disabled={state.ui.isProcessing}
                  />
                </div>

                {/* Progress Bar */}
                {state.progress.total > 0 && (
                  <div className='space-y-4 border-t border-slate-700/30 pt-6'>
                    <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>
                      Generation Progress
                    </h3>
                    <EnhancedProgressBar
                      current={state.progress.current}
                      total={state.progress.total}
                      status={state.progress.status}
                      title='GRN Label Generation'
                      variant='compact'
                      showPercentage={true}
                      showItemDetails={true}
                      className='w-full'
                      enableDebounce={true}
                      debounceDelay={100}
                      enablePerformanceMonitoring={debug}
                      onPerformanceMetrics={(metrics) => {
                        if (debug) {
                          logger.debug('Progress bar performance metrics:', metrics);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Action Button */}
                <div className='space-y-4 border-t border-slate-700/30 pt-6'>
                  <div className='flex space-x-2'>
                    <button
                      onClick={handlePrintClick}
                      disabled={!isFormValid || state.ui.isProcessing}
                      className={`flex-1 flex items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
                        !isFormValid || state.ui.isProcessing
                          ? GRN_BUTTON_STYLES.disabled
                          : GRN_BUTTON_STYLES.enabled
                      }`}
                    >
                      {state.ui.isProcessing ? (
                        <>
                          <div className={GRN_CSS_CLASSES.spinner}></div>
                          <span>Processing Labels...</span>
                        </>
                      ) : (
                        <>
                          <Package className='h-4 w-4' />
                          <span>Print GRN Label(s)</span>
                          {state.grossWeights.filter(w => w.trim() !== '').length > 0 && (
                            <span
                              className={cn(
                                cardTextStyles.labelSmall,
                                GRN_BADGE_STYLES.buttonBadge
                              )}
                            >
                              {state.grossWeights.filter(w => w.trim() !== '').length}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                    
                    {/* Cancel button when processing */}
                    {state.ui.isProcessing && (
                      <button
                        onClick={() => {
                          cancelCurrentOperation();
                        }}
                        className='px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors'
                        title='Cancel Operation'
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SpecialCard>

      <ClockNumberConfirmDialog
        isOpen={state.ui.isClockNumberDialogOpen}
        onOpenChange={() => actions.toggleClockNumberDialog()}
        onConfirm={handleClockNumberConfirm}
        onCancel={() => actions.toggleClockNumberDialog()}
        title='Confirm Printing'
        description='Please enter your clock number to proceed with printing GRN labels.'
        isLoading={state.ui.isProcessing}
      />
    </div>
  );
};

// Memoize the component for performance optimization
export const GRNLabelCard = memo(GRNLabelCardComponent);

export default GRNLabelCard;
