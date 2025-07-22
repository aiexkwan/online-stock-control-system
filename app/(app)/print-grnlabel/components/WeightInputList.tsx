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

export const WeightInputList: React.FC<WeightInputListProps> = ({
  grossWeights,
  onChange,
  onRemove,
  labelMode,
  selectedPalletType = 'notIncluded',
  selectedPackageType = 'notIncluded',
  maxItems = 22,
  disabled = false,
}) => {
  const filledWeightsCount = grossWeights.filter(w => w.trim() !== '').length;
  const [isExpanded, setIsExpanded] = useState(false);

  // 當輸入超過 5 個時自動展開
  useEffect(() => {
    if (filledWeightsCount > 5 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [filledWeightsCount, isExpanded]);

  const handleWeightChange = (index: number, value: string) => {
    onChange(index, value);
  };

  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
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
            {filledWeightsCount} / {maxItems} pallets
          </span>
        </div>

        {/* Total Net Weight Display */}
        {labelMode === LABEL_MODES.WEIGHT && totalNetWeight > 0 && (
          <div className='flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2'>
            <span className='text-sm text-slate-300'>Total Net Weight:</span>
            <span className='text-lg font-bold text-orange-400'>
              {totalNetWeight.toFixed(1)} kg
            </span>
          </div>
        )}
      </div>

      {/* 重量/數量輸入列表容器 */}
      <div className='relative'>
        {/* 輸入列表 - 2x11 格式 */}
        <div
          className={`weight-input-scroll-container custom-scrollbar grid grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px]' : 'max-h-[280px]'} `}
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
