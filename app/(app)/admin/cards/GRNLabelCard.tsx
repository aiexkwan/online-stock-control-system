'use client';

import React, { useCallback, useEffect, useRef, useMemo, memo } from 'react';
// import { _toast } from 'sonner'; // Removed - not used
import { Package } from 'lucide-react';
import { getOptimizedClient } from '@/app/utils/supabase/optimized-client';
import { getGrnDatabaseService } from '@/lib/database/grn-database-service';
// Imports moved to unified @/lib/grn below
// const UserIdVerificationDialog = React.lazy(() => import('../components/UserIdVerificationDialog')); // COMMENTED OUT DUE TO CLEANUP
import { SpecialCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import { cardTextStyles } from '@/lib/card-system/theme';
import { useResourceCleanup } from '@/lib/hooks/useResourceCleanup';
import { useProgressDebounce, type ProgressUpdate } from '@/lib/hooks/useProgressDebounce';
import { cn } from '@/lib/utils';
import { createGrnLogger } from '@/lib/security/grn-logger';
import { useCurrentUserId } from '@/app/hooks/useAuth';
import {
  validateProductInfo,
  validateSupplierInfo,
  // validateClockNumber, // Removed - not used
  validateGrossWeight,
  validateGrossWeights,
  type GrnProductInfo as ValidatedGrnProductInfo,
  // type GrnSupplierInfo, // Removed - not used
  type GrnFormData,
} from '@/lib/types/grn-validation';

// Import new modular components from unified grn library

// Import constants
import {
  // LABEL_MODES, // Removed - not used
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';

// Import GRN modules from unified library
import { grnErrorHandler, GrnDetailCard, WeightInputList, useGrnFormReducer } from '@/lib/grn';

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
  convertLegacyProps,
} from '@/lib/types/grn-props';
import { EnhancedProgressBar } from '@/components/business/shared/EnhancedProgressBar';
import { useAdminGrnLabelBusiness } from '../hooks/useAdminGrnLabelBusiness';

// Type definitions - keeping interface for backward compatibility
// interface GrnProductInfo { // Removed - not used
//   code: string;
//   description: string;
//   weight: string;
//   supplier: string;
// }

// Use validated types for new implementations
// type SafeGrnProductInfo = ValidatedGrnProductInfo; // Removed - not used
// type SafeGrnSupplierInfo = GrnSupplierInfo; // Removed - not used

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
  enabled:
    'bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500',
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

const GRNLabelCardComponent: React.FC<GRNLabelCardPropsUnion> = props => {
  // Handle both legacy and enhanced props
  const enhancedProps: EnhancedGRNLabelCardProps = React.useMemo(() => {
    // Check if this is legacy props (only has _className)
    if ('className' in props && Object.keys(props).length === 1) {
      return convertLegacyProps(props as GRNLabelCardProps);
    }
    // This is enhanced props
    return props as EnhancedGRNLabelCardProps;
  }, [props]);

  // Merge with defaults
  const _config = React.useMemo(
    () => ({
      theme: mergeGrnConfig(enhancedProps.theme, DEFAULT_GRN_THEME),
      layout: mergeGrnConfig(enhancedProps.layout, DEFAULT_GRN_LAYOUT),
      validation: mergeGrnConfig(enhancedProps.validation, DEFAULT_GRN_VALIDATION),
      features: mergeGrnConfig(enhancedProps.features, DEFAULT_GRN_FEATURES),
      performance: mergeGrnConfig(enhancedProps.performance, DEFAULT_GRN_PERFORMANCE),
      accessibility: mergeGrnConfig(enhancedProps.accessibility, DEFAULT_GRN_ACCESSIBILITY),
    }),
    [enhancedProps]
  );

  const {
    className = '',
    id,
    disabled = false,
    readOnly = false,
    debug = false,
    initialData,
    initialWeights,
    callbacks,
  } = enhancedProps;
  // Initialize resource cleanup for this component
  const resourceCleanup = useResourceCleanup('GRNLabelCard', debug);

  // Initialize GRN logger for this component
  const logger = useMemo(() => {
    const loggerInstance = createGrnLogger('GRNLabelCard');
    if (debug) {
      loggerInstance.info('GRN Label Card initialized with _config:', {
        theme: _config.theme.accentColor,
        layout: _config.layout.compactMode ? 'compact' : 'full',
        features: Object.keys(_config.features).filter(
          k => _config.features[k as keyof typeof _config.features]
        ),
        disabled,
        readOnly,
      });
    }
    return loggerInstance;
  }, [debug, _config, disabled, readOnly]);

  // Use optimized Supabase client with singleton pattern
  const [supabase] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return getOptimizedClient();
    }
    return null;
  });

  // Initialize GRN database service for optimized operations
  const _grnDbService = React.useMemo(() => {
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
      supportedFields.forEach(field => {
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

  // 使用現有的 useCurrentUserId hook，它會自動從 metadata 中提取 user_id
  const currentUserId = useCurrentUserId();

  // Adapter function to convert QC Label ProductInfo to GRN ProductInfo
  // Simplified to only extract what GRN needs: code and description
  const adaptProductInfo = useCallback(
    (qcProductInfo: unknown): ValidatedGrnProductInfo | null => {
      // 處理 null 或 undefined 輸入
      if (qcProductInfo === null || qcProductInfo === undefined) {
        logger.debug('Product info is null/undefined, returning null');
        return null;
      }

      // 如果是來自 ProductCodeInput 的完整產品資訊，只提取 GRN 需要的欄位
      if (
        typeof qcProductInfo === 'object' &&
        qcProductInfo !== null &&
        'code' in qcProductInfo &&
        'description' in qcProductInfo
      ) {
        const productData = qcProductInfo as { code?: string; description?: string };
        if (productData.code && productData.description) {
          const simplifiedInfo = {
            code: productData.code,
            description: productData.description,
          };
          logger.debug('Simplified product info for GRN', simplifiedInfo);
          return simplifiedInfo;
        }
      }

      // 備用：使用 Zod 驗證（用於其他來源的資料）
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
  const handleProgressUpdate = useCallback(
    (update: ProgressUpdate) => {
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
    },
    [actions, state.progress]
  );

  const {
    updateProgress: debouncedUpdateProgress,
    updateProgressStatus: debouncedUpdateProgressStatus,
    flushUpdates,
  } = useProgressDebounce(handleProgressUpdate, {
    progressDelay: 100,
    statusDelay: 50,
    enableSmartBatching: true,
    maxBatchSize: 3,
  });

  // Use the business logic hook with debounced progress updates and resource management
  const { processPrintRequest, cancelCurrentOperation } = useAdminGrnLabelBusiness({
    state,
    actions: {
      ...actions,
      // Enhance actions with debounced progress updates
      setProgress: progress => {
        if (resourceCleanup.isMounted()) {
          debouncedUpdateProgress({
            current: progress.current,
            total: progress.total,
            status: progress.status,
          });
        }
      },
      updateProgressStatus: (index, status) => {
        if (resourceCleanup.isMounted()) {
          debouncedUpdateProgressStatus(index, status, status === 'Success' || status === 'Failed');
        }
      },
    },
    currentUserId: currentUserId || '',
  });

  // User ID 驗證對話框狀態
  const [showUserIdDialog, setShowUserIdDialog] = React.useState(false);

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
      if (
        _config.validation.customValidators?.[
          field as keyof typeof _config.validation.customValidators
        ]
      ) {
        const validator =
          _config.validation.customValidators[
            field as keyof typeof _config.validation.customValidators
          ];
        const validationResult = validator!(value);
        if (validationResult !== true) {
          const errorMessage =
            typeof validationResult === 'string' ? validationResult : 'Invalid value';
          logger.warn(`Custom validation failed for ${String(field)}:`, errorMessage);
          if (callbacks?.onValidationError) {
            callbacks.onValidationError(String(field), errorMessage);
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
          notes: '',
        } as GrnFormData;
        callbacks.onFormChange(callbackFormData, field as keyof typeof state.formData);
      }
    },
    [actions, disabled, readOnly, callbacks, logger, state, _config]
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
      // 檢查是否為 null
      if (supplierInfo === null || supplierInfo === undefined) {
        actions.setSupplierInfo(null);
        actions.setSupplierError(null);
        return;
      }

      // 檢查是否已經是正確的 SupplierInfo 格式（從 MaterialSupplierInput 傳入）
      if (
        typeof supplierInfo === 'object' &&
        supplierInfo !== null &&
        'code' in supplierInfo &&
        'name' in supplierInfo
      ) {
        const typedSupplierInfo = supplierInfo as { code?: string; name?: string };
        if (typedSupplierInfo.code && typedSupplierInfo.name) {
          actions.setSupplierInfo({
            code: typedSupplierInfo.code,
            name: typedSupplierInfo.name,
          });
          actions.setSupplierError(null);
          logger.debug('Supplier info set successfully', typedSupplierInfo);
          return;
        }
      }

      // 嘗試使用原有的 Zod 驗證（用於其他來源的資料）
      const validated = validateSupplierInfo(supplierInfo);
      if (validated && validated.code && validated.name) {
        // 確保必需屬性存在
        actions.setSupplierInfo({
          code: validated.code,
          name: validated.name,
        });
        actions.setSupplierError(null);
        logger.debug('Supplier info validated and set', validated);
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
      const maxItems = _config.layout.maxWeightInputs;

      // Validate weight input using Zod
      if (value.trim() !== '' && !validateGrossWeight(value)) {
        logger.warn('Invalid weight format', { weight: value, index: idx });
        if (callbacks?.onValidationError) {
          callbacks.onValidationError(
            'grossWeight',
            `Invalid weight format: "${value}". Please enter a valid number.`
          );
        }
        grnErrorHandler.handleValidationError(
          'form',
          `Invalid weight format: "${value}". Please enter a valid number.`,
          {
            component: 'GRNLabelCard',
            action: 'weight_input_validation',
            clockNumber: currentUserId || '',
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
        timeoutRef.current = resourceCleanup.createTimeout(
          () => {
            if (resourceCleanup.isMounted()) {
              actions.addGrossWeight();
            }
            timeoutRef.current = null;
          },
          0,
          `autoAddWeight_${idx}`
        );
      }
    },
    [
      actions,
      currentUserId,
      logger,
      disabled,
      readOnly,
      callbacks,
      resourceCleanup,
      _config.layout.maxWeightInputs,
    ]
  );

  // Memoized weight remove callback to prevent unnecessary re-renders
  const handleWeightRemove = useCallback(
    (idx: number) => {
      actions.removeGrossWeight(idx);
      // 確保至少有一個輸入框
      const currentWeights = stateRef.current.grossWeights;
      if (
        currentWeights.length === 1 ||
        (currentWeights.length === 2 && currentWeights[currentWeights.length - 1].trim() !== '')
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
      (Object.values(state.palletType).some(v => typeof v === 'string' && v.trim() !== '') &&
        Object.values(state.packageType).some(v => typeof v === 'string' && v.trim() !== ''))
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
    if (!_config.features.enablePrinting) {
      logger.warn('Print functionality is disabled');
      return;
    }

    if (disabled || readOnly) {
      logger.warn('Print blocked - component is disabled or read-only');
      return;
    }

    // 檢查是否需要用戶 ID 驗證
    if (
      !currentUserId ||
      currentUserId === '' ||
      currentUserId === 'null' ||
      currentUserId === 'undefined'
    ) {
      logger.info('No user ID found, showing user ID verification dialog');
      setShowUserIdDialog(true);
      return;
    }

    if (!isFormValid) {
      const errors = [
        'Please fill all required fields and ensure product/supplier details are loaded',
      ];
      if (callbacks?.onValidationChange) {
        callbacks.onValidationChange(false, errors);
      }
      grnErrorHandler.handleValidationError('form', errors[0], {
        component: 'GRNLabelCard',
        action: 'form_validation',
        clockNumber: currentUserId || '',
      });
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
        notes: '',
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
      mode: state.labelMode,
    });

    // 直接使用 currentUserId 進行打印
    try {
      await processPrintRequest(currentUserId || '');
      if (callbacks?.onPrintSuccess) {
        callbacks.onPrintSuccess(state.grossWeights.filter(w => w.trim() !== '').length);
      }
    } catch (error) {
      logger.error('Print process failed:', error);
      if (callbacks?.onPrintError) {
        callbacks.onPrintError(error instanceof Error ? error.message : 'Unknown print error');
      }
    }
  }, [
    isFormValid,
    currentUserId,
    disabled,
    readOnly,
    callbacks,
    logger,
    state,
    processPrintRequest,
    _config.features.enablePrinting,
  ]);

  // User ID 驗證處理函數
  const handleUserIdVerified = React.useCallback(
    (_userId: string) => {
      setShowUserIdDialog(false);
      // 驗證完成後繼續打印流程
      setTimeout(async () => {
        try {
          await processPrintRequest(_userId);
          if (callbacks?.onPrintSuccess) {
            callbacks.onPrintSuccess(state.grossWeights.filter(w => w.trim() !== '').length);
          }
        } catch (error) {
          logger.error('Print process failed:', error);
          if (callbacks?.onPrintError) {
            callbacks.onPrintError(error instanceof Error ? error.message : 'Unknown print error');
          }
        }
      }, 100);
    },
    [processPrintRequest, callbacks, logger, state.grossWeights]
  );

  const handleUserIdVerificationCancel = React.useCallback(() => {
    setShowUserIdDialog(false);
  }, []);

  // Theme configuration is now externalized above for performance

  // Apply theme-based styling
  const themeClasses = React.useMemo(() => {
    const base = `h-full ${className || ''}`;
    const customContainer = _config.theme.customClasses?.container || '';

    return cn(base, customContainer, {
      'transition-all duration-300': _config.theme.enableAnimations,
      'opacity-50 pointer-events-none': disabled,
    });
  }, [disabled, _config.theme, className]);

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
                <span className={cn(cardTextStyles.body, GRN_BADGE_STYLES.labelCount)}>
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
                  currentUserId={currentUserId || ''}
                  palletType={state.palletType}
                  packageType={state.packageType}
                  onFormChange={handleFormChange}
                  onSupplierInfoChange={handleSupplierInfoChange}
                  onProductInfoChange={(qcProductInfo: unknown) => {
                    const adaptedInfo = adaptProductInfo(qcProductInfo);
                    if (adaptedInfo && adaptedInfo.code && adaptedInfo.description) {
                      actions.setProductInfo({
                        code: adaptedInfo.code,
                        description: adaptedInfo.description,
                      });
                    }
                  }}
                  onLabelModeChange={(mode: LabelMode) => handleLabelModeChange(mode)}
                  onPalletTypeChange={handlePalletTypeChange}
                  onPackageTypeChange={handlePackageTypeChange}
                  disabled={state.ui.isProcessing}
                />
              </div>

              {/* Weight Input Section */}
              <div className='space-y-4 border-t border-slate-700/30 pt-6'>
                <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>Weight/Quantity Input</h3>
                <WeightInputList
                  grossWeights={state.grossWeights}
                  onChange={handleGrossWeightChange}
                  onRemove={handleWeightRemove}
                  labelMode={state.labelMode}
                  selectedPalletType={
                    (Object.entries(state.palletType).find(
                      ([, value]) => (parseInt(String(value)) || 0) > 0
                    )?.[0] || 'notIncluded') as PalletTypeKey
                  }
                  selectedPackageType={
                    (Object.entries(state.packageType).find(
                      ([, value]) => (parseInt(String(value)) || 0) > 0
                    )?.[0] || 'notIncluded') as PackageTypeKey
                  }
                  maxItems={22}
                  disabled={state.ui.isProcessing}
                />
              </div>

              {/* Progress Bar */}
              {state.progress.total > 0 && (
                <div className='space-y-4 border-t border-slate-700/30 pt-6'>
                  <h3 className={cn(cardTextStyles.subtitle, 'text-white')}>Generation Progress</h3>
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
                    onPerformanceMetrics={metrics => {
                      if (debug) {
                        logger.debug(
                          'Progress bar performance metrics:',
                          metrics as unknown as Record<string, unknown>
                        );
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
                    className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 font-medium transition-colors ${
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
                            className={cn(cardTextStyles.labelSmall, GRN_BADGE_STYLES.buttonBadge)}
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
                      className='rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700'
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

      {/* User ID Verification Dialog - DISABLED DUE TO CLEANUP */}
      {showUserIdDialog && (
        <div className='fixed inset-0 flex items-center justify-center bg-black/50'>
          <div className='mx-4 max-w-md rounded-lg bg-slate-800 p-6'>
            <h3 className='mb-2 text-lg font-semibold text-white'>User ID Required</h3>
            <p className='mb-4 text-slate-300'>
              User ID verification is temporarily disabled due to system cleanup.
            </p>
            <button
              onClick={handleUserIdVerificationCancel}
              className='rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-700'
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* 
      <React.Suspense
        fallback={
          <div className='fixed inset-0 flex items-center justify-center bg-black/50'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent' />
          </div>
        }
      >
        <UserIdVerificationDialog
          isOpen={showUserIdDialog}
          onOpenChange={setShowUserIdDialog}
          onVerified={handleUserIdVerified}
          onCancel={handleUserIdVerificationCancel}
          title='User ID Required'
          description='Your account metadata does not contain a User ID. Please enter your User ID to continue.'
          isLoading={state.ui.isProcessing}
        />
      </React.Suspense>
      */}
    </div>
  );
};

// Memoize the component for performance optimization
export const GRNLabelCard = memo(GRNLabelCardComponent);

export default GRNLabelCard;
