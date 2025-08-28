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
  mergeGrnConfig,
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
    placeholder = 'Enter weight/qty...',
  } = props as EnhancedWeightInputListProps;

  // Merge configurations with defaults
  const config = React.useMemo(
    () => ({
      theme: {
        accentColor: (theme?.accentColor || 'orange') as
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
        compactMode: layout?.compactMode ?? false,
        autoExpandThreshold: layout?.autoExpandThreshold ?? 5,
        showWeightSummary: layout?.showWeightSummary ?? true,
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
  const filledWeightsCount = grossWeights.filter(w => w.trim() !== '').length;
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced state for tracking expanded state changes
  const [previousExpandedState, setPreviousExpandedState] = useState(isExpanded);

  // 當輸入超過配置閾值時自動展開
  useEffect(() => {
    const threshold = config.layout.autoExpandThreshold;
    if (filledWeightsCount > threshold && !isExpanded) {
      setIsExpanded(true);
    }
  }, [filledWeightsCount, isExpanded, config.layout.autoExpandThreshold]);

  // Notify parent about expansion changes
  useEffect(() => {
    if (isExpanded !== previousExpandedState) {
      setPreviousExpandedState(isExpanded);
      if (onListExpanded) {
        onListExpanded(isExpanded);
      }
    }
  }, [isExpanded, previousExpandedState, onListExpanded]);

  const handleWeightChange = (index: number, value: string) => {
    if (disabled) return;

    // Apply validation debouncing if configured
    const debounceMs = config.performance.validationDebounce;

    if (debounceMs > 0) {
      // Simple debouncing implementation
      clearTimeout((handleWeightChange as any).timeoutId);
      (handleWeightChange as any).timeoutId = setTimeout(() => {
        onChange(index, value);
        handleWeightCalculation(index, value);
      }, debounceMs);
    } else {
      onChange(index, value);
      handleWeightCalculation(index, value);
    }
  };

  const handleWeightCalculation = (index: number, value: string) => {
    if (labelMode === LABEL_MODES.WEIGHT && onWeightCalculated) {
      const grossWeight = parseFloat(value);
      if (!isNaN(grossWeight) && grossWeight > 0) {
        const netWeight = calculateNetWeight(grossWeight, selectedPalletType, selectedPackageType);
        onWeightCalculated(index, netWeight);
      }
    }
  };

  const handleRemove = (index: number) => {
    if (disabled || !onRemove) return;

    // Check if we're at max items and notify
    if (filledWeightsCount >= effectiveMaxItems && onMaxItemsReached) {
      onMaxItemsReached();
    }

    onRemove(index);
  };

  // Calculate total net weight
  const totalNetWeight = React.useMemo(() => {
    if (labelMode !== LABEL_MODES.WEIGHT) return 0;

    return grossWeights.reduce((total, weight) => {
      const grossWeight = parseFloat(weight);
      if (!isNaN(grossWeight) && grossWeight > 0) {
        return total + calculateNetWeight(grossWeight, selectedPalletType, selectedPackageType);
      }
      return total;
    }, 0);
  }, [grossWeights, labelMode, selectedPalletType, selectedPackageType]);

  return (
    <div className='space-y-3'>
      {/* 摘要信息 */}
      <div className='mb-4 space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='bg-gradient-to-r from-white to-orange-200 bg-clip-text text-sm font-semibold text-transparent'>
            {labelMode === LABEL_MODES.QUANTITY ? 'Quantity' : 'Gross Weight / Qty'}
          </h3>
          <span className='rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-400'>
            {filledWeightsCount} / {effectiveMaxItems} pallets
          </span>
        </div>

        {/* Total Net Weight Display - Enhanced with configuration */}
        {labelMode === LABEL_MODES.WEIGHT &&
          totalNetWeight > 0 &&
          showTotalWeight &&
          config.layout.showWeightSummary && (
            <div
              className={`flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2 ${config.theme.customClasses?.content || ''}`}
            >
              <span className='text-sm text-slate-300'>Total Net Weight:</span>
              <span
                className={`text-lg font-bold ${
                  config.theme.accentColor === 'orange'
                    ? 'text-orange-400'
                    : config.theme.accentColor === 'blue'
                      ? 'text-blue-400'
                      : config.theme.accentColor === 'green'
                        ? 'text-green-400'
                        : config.theme.accentColor === 'purple'
                          ? 'text-purple-400'
                          : config.theme.accentColor === 'red'
                            ? 'text-red-400'
                            : 'text-orange-400'
                }`}
              >
                {totalNetWeight.toFixed(1)} kg
              </span>
            </div>
          )}
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
          {grossWeights.map((weight, idx) => {
            const hasValue = weight.trim() !== '';
            const isLast = idx === grossWeights.length - 1;

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
                  className={`w-20 rounded-lg border px-2 py-1 text-right text-sm transition-all duration-300 ${
                    hasValue
                      ? 'border-slate-600/50 bg-slate-700/50 text-white focus:border-orange-400/70 focus:ring-orange-400/30'
                      : 'border-slate-600/30 bg-slate-700/30 text-slate-300 focus:border-orange-400/70 focus:ring-orange-400/30'
                  }`}
                  placeholder={isLast ? 'Enter' : '0'}
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

        {/* 底部漸變效果 - 提示仲有內容 */}
        {!isExpanded && filledWeightsCount > 5 && (
          <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent' />
        )}
      </div>
    </div>
  );
};

export default WeightInputList;
