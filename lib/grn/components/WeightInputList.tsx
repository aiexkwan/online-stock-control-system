'use client';

import React, { useState, useEffect } from 'react';
import {
  PALLET_WEIGHTS,
  PACKAGE_WEIGHTS,
  LABEL_MODES,
  getPalletLabel,
  calculateNetWeight,
  type PalletTypeKey,
  type PackageTypeKey,
  type LabelMode,
} from '@/app/constants/grnConstants';
import {
  EnhancedWeightInputListProps,
  DEFAULT_GRN_THEME,
  DEFAULT_GRN_LAYOUT,
} from '@/lib/types/grn-props';

// Legacy interface for backward compatibility
interface WeightInputListProps {
  grossWeights: string[];
  onChange: (index: number, value: string) => void;
  onRemove?: (index: number) => void;
  labelMode: LabelMode;
  selectedPalletType?: PalletTypeKey;
  selectedPackageType?: PackageTypeKey;
  maxItems?: number;
  disabled?: boolean;
}

// Union type for backward compatibility
type WeightInputListPropsUnion = WeightInputListProps | EnhancedWeightInputListProps;

export const WeightInputList: React.FC<WeightInputListPropsUnion> = props => {
  // Handle both legacy and enhanced props
  const {
    grossWeights,
    onChange,
    onRemove,
    labelMode,
    selectedPalletType = 'notIncluded',
    selectedPackageType = 'notIncluded',
    maxItems = 22,
    disabled = false,
    // Enhanced props with defaults
    className = '',
    theme,
    layout,
    validation,
    performance,
    onWeightCalculated,
    onListExpanded,
    onMaxItemsReached,
    showIndex = false,
    showNetWeight = true,
    showTotalWeight = true,
    placeholder: inputPlaceholder = 'Enter weight/qty...',
  } = props as EnhancedWeightInputListProps;

  // Merge configurations with defaults
  const config = React.useMemo(
    () => ({
      theme: {
        accentColor: (theme?.accentColor || DEFAULT_GRN_THEME.accentColor) as
          | 'orange'
          | 'blue'
          | 'green'
          | 'purple'
          | 'red',
        customClasses: {
          container: theme?.customClasses?.container || '',
          content: theme?.customClasses?.content || '',
        },
      },
      layout: {
        compactMode: layout?.compactMode ?? DEFAULT_GRN_LAYOUT.compactMode,
        autoExpandThreshold: layout?.autoExpandThreshold ?? DEFAULT_GRN_LAYOUT.autoExpandThreshold,
        showWeightSummary: layout?.showWeightSummary ?? DEFAULT_GRN_LAYOUT.showWeightSummary,
      },
      validation: {
        enableRealTimeValidation: validation?.enableRealTimeValidation ?? true,
      },
      performance: {
        validationDebounce: performance?.validationDebounce ?? 300,
        enableVirtualScrolling: performance?.enableVirtualScrolling ?? false,
      },
    }),
    [theme, layout, validation, performance]
  );

  const effectiveMaxItems = Math.min(maxItems, 50); // Hard limit for performance

  // Local state for immediate UI updates - ensure it has enough slots
  const [localWeights, setLocalWeights] = React.useState<string[]>(() => {
    // Initialize with props but ensure at least one empty slot for expansion (if not at max)
    const initialWeights = [...grossWeights];
    if (
      initialWeights.length < effectiveMaxItems &&
      (initialWeights.length === 0 || initialWeights[initialWeights.length - 1].trim() !== '')
    ) {
      initialWeights.push(''); // Add empty slot only if not at max capacity
    }
    return initialWeights;
  });

  // Sync local state with props and maintain expansion capability
  React.useEffect(() => {
    setLocalWeights(_prev => {
      const newWeights = [...grossWeights];
      // Only add empty slot if we haven't reached max capacity and last item has content
      if (
        newWeights.length < effectiveMaxItems &&
        (newWeights.length === 0 || newWeights[newWeights.length - 1].trim() !== '')
      ) {
        newWeights.push('');
      }
      return newWeights;
    });
  }, [grossWeights, effectiveMaxItems]);

  // Only use confirmed weights from props, not local state
  const confirmedWeightsCount = grossWeights.filter((w: string) => w.trim() !== '').length;
  const [isExpanded, setIsExpanded] = useState(false);

  // Show all local weights since the array auto-expands as needed
  const visibleInputCount = Math.min(localWeights.length, effectiveMaxItems);

  // Enhanced state for tracking expanded state changes
  const [previousExpandedState, setPreviousExpandedState] = useState(isExpanded);

  // 當輸入超過配置閾值時自動展開 - use confirmed weights only
  useEffect(() => {
    const threshold = config.layout.autoExpandThreshold;
    if (confirmedWeightsCount > threshold && !isExpanded) {
      setIsExpanded(true);
    }
  }, [confirmedWeightsCount, isExpanded, config.layout.autoExpandThreshold]);

  // Notify parent about expansion changes
  useEffect(() => {
    if (isExpanded !== previousExpandedState) {
      setPreviousExpandedState(isExpanded);
      if (onListExpanded) {
        onListExpanded(isExpanded);
      }
    }
  }, [isExpanded, previousExpandedState, onListExpanded]);

  // Sync local changes back to parent on blur/finish
  const syncToParent = React.useCallback(() => {
    // Filter out empty slots and sync to parent
    const validWeights = localWeights.filter((w: string) => w.trim() !== '');

    // Only update parent if there's a real change
    const currentValid = grossWeights.filter((w: string) => w.trim() !== '');

    // Simple comparison - if different lengths or different values, sync
    const needsSync =
      validWeights.length !== currentValid.length ||
      validWeights.some((weight, index) => weight !== currentValid[index]);

    if (needsSync) {
      // Only sync the actual filled weights, don't pad to 22
      // This prevents all 22 boxes from showing when only a few are filled

      // Sync to parent without logging for clean production

      // Update only the filled positions
      validWeights.forEach((weight, index) => {
        onChange(index, weight);
      });

      // Clear any extra positions that were previously filled but now empty
      if (currentValid.length > validWeights.length) {
        for (let i = validWeights.length; i < currentValid.length; i++) {
          onChange(i, '');
        }
      }
    }
  }, [localWeights, grossWeights, onChange]);

  const handleWeightChange = React.useCallback(
    (index: number, value: string) => {
      if (disabled) return;

      // Update local state and expand array if needed for new input boxes
      setLocalWeights(prev => {
        const newWeights = [...prev];
        newWeights[index] = value;

        // If typing in the last box and there's content, add one more empty slot
        if (
          index === newWeights.length - 1 &&
          value.trim() !== '' &&
          newWeights.length < effectiveMaxItems
        ) {
          newWeights.push(''); // Add one empty slot for the next input
        }

        return newWeights;
      });

      // No debouncing, no calculations during typing - but sync on input completion
    },
    [disabled, effectiveMaxItems]
  );

  // Sync to parent when user finishes input (onBlur)
  const handleInputBlur = React.useCallback(() => {
    // Force sync immediately to ensure print button updates
    syncToParent();
  }, [syncToParent]);

  // Also sync on Enter key press for immediate confirmation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        syncToParent();
      }
    },
    [syncToParent]
  );

  const handleRemove = (index: number) => {
    if (disabled || !onRemove) return;

    // Check if we're at max items and notify - use confirmed weights only
    if (confirmedWeightsCount >= effectiveMaxItems && onMaxItemsReached) {
      onMaxItemsReached();
    }

    onRemove(index);
  };

  return (
    <div className='space-y-3'>
      {/* 摘要信息 */}
      <div className='mb-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='bg-gradient-to-r from-white to-orange-200 bg-clip-text text-sm font-semibold text-transparent'>
            {labelMode === LABEL_MODES.QUANTITY ? 'Quantity' : 'Gross Weight / Qty'}
          </h3>
          <span className='rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-400'>
            {confirmedWeightsCount} / {effectiveMaxItems} pallets
          </span>
        </div>
      </div>

      {/* 重量/數量輸入列表容器 */}
      <div className={`relative ${className}`}>
        {/* 輸入列表 - Enhanced with configuration */}
        <div
          className={`weight-input-scroll-container custom-scrollbar grid grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
            config.layout.compactMode ? 'gap-y-1' : 'gap-y-2'
          } ${isExpanded ? 'max-h-[500px]' : 'max-h-[280px]'} ${config.theme.customClasses?.container || ''}`}
          style={{ height: isExpanded ? 'calc(100% - 120px)' : 'auto' }}
        >
          {localWeights.slice(0, visibleInputCount).map((weight, idx) => {
            const hasValue = weight.trim() !== '';
            const isLast = idx === visibleInputCount - 1;

            return (
              <div key={idx} className='flex items-center space-x-2'>
                {/* 托盤編號徽章 */}
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    hasValue
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-slate-600/30 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </div>

                {/* 重量/數量輸入 */}
                <input
                  type='number'
                  value={weight}
                  onChange={e => handleWeightChange(idx, e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className={`w-20 rounded-lg border px-2 py-1 text-right text-sm transition-all duration-300 ${
                    hasValue
                      ? 'border-slate-600/50 bg-slate-700/50 text-white focus:border-orange-400/70 focus:ring-orange-400/30'
                      : 'border-slate-600/30 bg-slate-700/30 text-slate-300 focus:border-orange-400/70 focus:ring-orange-400/30'
                  }`}
                  placeholder={isLast && visibleInputCount < effectiveMaxItems ? 'Enter' : '0'}
                  min='0'
                  step={labelMode === LABEL_MODES.QUANTITY ? '1' : '0.1'}
                  maxLength={5}
                  disabled={disabled}
                />
                <span className='whitespace-nowrap text-xs text-slate-500'>
                  {labelMode === LABEL_MODES.QUANTITY ? 'pcs' : 'kg'}
                </span>

                {/* 移除按鈕 */}
                {hasValue && !isLast && onRemove && (
                  <button
                    onClick={() => handleRemove(idx)}
                    className='flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500/80 text-xs text-white transition-all duration-300 hover:scale-110 hover:bg-red-500'
                    title='Remove this pallet'
                    disabled={disabled}
                    tabIndex={-1}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部漸變效果 - 提示仲有內容 - use confirmed weights only */}
        {!isExpanded && confirmedWeightsCount > 5 && (
          <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent' />
        )}
      </div>
    </div>
  );
};

export default WeightInputList;
