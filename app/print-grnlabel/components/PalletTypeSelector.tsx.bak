'use client';

import React, { useState } from 'react';
import { PALLET_TYPE_OPTIONS, type PalletTypeKey } from '../../constants/grnConstants';

interface PalletTypeData {
  whiteDry: string;
  whiteWet: string;
  chepDry: string;
  chepWet: string;
  euro: string;
  notIncluded: string;
}

interface PalletTypeSelectorProps {
  palletType: PalletTypeData;
  onChange: (key: PalletTypeKey, value: string) => void;
  disabled?: boolean;
}

export const PalletTypeSelector: React.FC<PalletTypeSelectorProps> = ({
  palletType,
  onChange,
  disabled = false,
}) => {
  // 找出當前選中的托盤類型
  const selectedType = Object.entries(palletType).find(
    ([_, value]) => value && parseInt(value) > 0
  )?.[0] as PalletTypeKey | undefined;

  const selectedQuantity = selectedType ? palletType[selectedType] : '';

  const handleTypeChange = (newType: string) => {
    const key = newType as PalletTypeKey;
    // 清空所有其他類型，設置新類型的數量為 1
    Object.keys(palletType).forEach(k => {
      onChange(k as PalletTypeKey, '');
    });
    onChange(key, '1');
  };

  const handleQuantityChange = (value: string) => {
    if (selectedType) {
      onChange(selectedType, value);
    }
  };

  return (
    <div className='space-y-2'>
      <div className='group'>
        <label className='mb-1 block text-xs font-medium text-slate-300 transition-colors duration-200 group-focus-within:text-orange-400'>
          Pallet Type
        </label>
        <select
          value={selectedType || ''}
          onChange={e => handleTypeChange(e.target.value)}
          className='w-full cursor-pointer appearance-none rounded-xl border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 ease-out hover:border-orange-500/50 hover:bg-slate-800/60 focus:border-orange-400/70 focus:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-orange-400/30'
          disabled={disabled}
        >
          <option value='' className='bg-slate-800'>
            Select pallet type...
          </option>
          {PALLET_TYPE_OPTIONS.map(option => (
            <option key={option.key} value={option.key} className='bg-slate-800'>
              {option.label}
            </option>
          ))}
        </select>
        <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100'></div>
      </div>

      {selectedType && (
        <div className='animate-fadeIn group'>
          <label className='mb-1 block text-xs font-medium text-slate-300 transition-colors duration-200 group-focus-within:text-orange-400'>
            Quantity
          </label>
          <div className='relative'>
            <input
              type='number'
              value={selectedQuantity}
              onChange={e => handleQuantityChange(e.target.value)}
              className='w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300 ease-out hover:border-orange-500/50 hover:bg-slate-800/60 focus:border-orange-400/70 focus:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-orange-400/30'
              placeholder='Enter quantity...'
              min='1'
              disabled={disabled}
            />
            <div className='pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100'></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PalletTypeSelector;
