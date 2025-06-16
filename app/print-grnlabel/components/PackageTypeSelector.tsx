'use client';

import React from 'react';
import { ResponsiveCard } from '../../components/qc-label-form/ResponsiveLayout';
import { PACKAGE_TYPE_OPTIONS, type PackageTypeKey } from '../../constants/grnConstants';

interface PackageTypeData {
  still: string;
  bag: string;
  tote: string;
  octo: string;
  notIncluded: string;
}

interface PackageTypeSelectorProps {
  packageType: PackageTypeData;
  onChange: (key: PackageTypeKey, value: string) => void;
  disabled?: boolean;
}

export const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({
  packageType,
  onChange,
  disabled = false
}) => {
  const handleChange = (key: PackageTypeKey, value: string) => {
    // 當選擇一個類型時，清空其他類型
    const newPackageType: PackageTypeData = {
      still: '',
      bag: '',
      tote: '',
      octo: '',
      notIncluded: '',
      [key]: value,
    };
    
    // 只傳遞改變的 key 和 value
    onChange(key, value);
  };

  return (
    <ResponsiveCard title="Package Type" className="package-type-card">
      <div className="space-y-4">
        {PACKAGE_TYPE_OPTIONS.map((option) => {
          const key = option.key as PackageTypeKey;
          const value = packageType[key];
          
          return (
            <div 
              key={key} 
              className="group flex justify-between items-center p-1 bg-slate-800/30 rounded-xl border border-slate-600/20 hover:border-orange-500/30 hover:bg-slate-800/50 transition-all duration-300"
            >
              <label className="text-xs text-slate-300 font-medium whitespace-nowrap pl-1">
                {option.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-14 px-2 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-center text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 hover:border-orange-500/50"
                  placeholder="Qty"
                  min="0"
                  disabled={disabled}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ResponsiveCard>
  );
};

export default PackageTypeSelector;