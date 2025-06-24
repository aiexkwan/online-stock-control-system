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
  type LabelMode 
} from '../../constants/grnConstants';

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
  disabled = false
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

  const renderWeightInfo = (weight: string) => {
    if (!weight.trim()) return null;

    if (labelMode === LABEL_MODES.WEIGHT) {
      const grossWeight = parseFloat(weight);
      if (!isNaN(grossWeight)) {
        const netWeight = calculateNetWeight(grossWeight, selectedPalletType, selectedPackageType);
        return (
          <div className="text-xs text-orange-300 bg-orange-500/10 px-2 py-1 rounded-full whitespace-nowrap">
            Net: {netWeight.toFixed(1)}kg
          </div>
        );
      }
    } else {
      const quantity = parseFloat(weight);
      if (!isNaN(quantity)) {
        return (
          <div className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full whitespace-nowrap">
            Qty: {quantity.toFixed(0)}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* 摘要信息 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
          {labelMode === LABEL_MODES.QUANTITY ? 'Quantity' : 'Gross Weight / Qty'}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
            {filledWeightsCount} / {maxItems} pallets
          </span>
          {/* 展開/收起按鈕 - 只在有超過 5 個輸入時顯示 */}
          {filledWeightsCount > 5 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors duration-200 flex items-center gap-1"
              disabled={disabled}
            >
              {isExpanded ? (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Collapse
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Expand All ({filledWeightsCount})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 重量/數量輸入列表容器 */}
      <div className="relative">
        {/* 輸入列表 - 可調整高度 */}
        <div 
          className={`
            weight-input-scroll-container space-y-3 overflow-y-auto pr-2 custom-scrollbar
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-[600px]' : 'max-h-[320px]'}
          `}
        >
          {grossWeights.map((weight, idx) => {
            const hasValue = weight.trim() !== '';
            const isLast = idx === grossWeights.length - 1;
            
            return (
              <div 
                key={idx} 
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                  hasValue 
                    ? 'bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600/50 hover:border-orange-500/50' 
                    : isLast 
                      ? 'bg-slate-800/30 border border-dashed border-slate-600/50 hover:border-orange-500/30' 
                      : 'bg-slate-800/20 border border-slate-700/30'
                }`}
              >
                {/* 托盤編號徽章 */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  hasValue 
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25' 
                    : isLast 
                      ? 'bg-slate-600/50 text-slate-300 border-2 border-dashed border-slate-500/50' 
                      : 'bg-slate-600/30 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                
                {/* 托盤標籤和淨重/數量 */}
                <div className="flex-1 min-w-0 flex items-center space-x-2">
                  <div className={`text-sm font-medium whitespace-nowrap ${hasValue ? 'text-white' : 'text-slate-400'}`}>
                    {getPalletLabel(idx)}
                  </div>
                  {renderWeightInfo(weight)}
                </div>
                
                {/* 重量/數量輸入 */}
                <div className="flex-shrink-0 flex items-center space-x-1">
                  <input
                    type="number"
                    value={weight}
                    onChange={e => handleWeightChange(idx, e.target.value)}
                    className={`w-16 px-2 py-2 text-right text-sm rounded-lg border transition-all duration-300 ${
                      hasValue 
                        ? 'bg-slate-700/50 border-slate-600/50 text-white focus:ring-orange-400/30 focus:border-orange-400/70' 
                        : 'bg-slate-700/30 border-slate-600/30 text-slate-300 focus:ring-orange-400/30 focus:border-orange-400/70'
                    }`}
                    placeholder={isLast ? "Enter" : "0"}
                    min="0"
                    step={labelMode === LABEL_MODES.QUANTITY ? "1" : "0.1"}
                    maxLength={5}
                    disabled={disabled}
                  />
                  <span className="text-xs text-slate-500">
                    {labelMode === LABEL_MODES.QUANTITY ? 'pcs' : 'kg'}
                  </span>
                </div>
                
                {/* 移除按鈕 */}
                {hasValue && !isLast && onRemove && (
                  <button
                    onClick={() => handleRemove(idx)}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xs flex items-center justify-center transition-all duration-300 hover:scale-110"
                    title="Remove this pallet"
                    disabled={disabled}
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
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent pointer-events-none" />
        )}
        
        {/* 快速導航按鈕 - 當展開且有超過 10 個輸入時顯示 */}
        {isExpanded && filledWeightsCount > 10 && (
          <div className="sticky bottom-0 mt-2 py-2 bg-slate-900/90 backdrop-blur-sm flex gap-2 justify-center">
            <button
              onClick={() => {
                const container = document.querySelector('.weight-input-scroll-container');
                if (container) container.scrollTop = 0;
              }}
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors duration-200"
              disabled={disabled}
            >
              ↑ Top
            </button>
            <button
              onClick={() => {
                const container = document.querySelector('.weight-input-scroll-container');
                if (container) {
                  // 兼容性更好的方法找最後一個有值的輸入
                  let lastFilledIndex = -1;
                  for (let i = grossWeights.length - 1; i >= 0; i--) {
                    if (grossWeights[i].trim() !== '') {
                      lastFilledIndex = i;
                      break;
                    }
                  }
                  if (lastFilledIndex >= 0) {
                    const element = container.children[lastFilledIndex];
                    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors duration-200"
              disabled={disabled}
            >
              ↓ Last Input
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightInputList;