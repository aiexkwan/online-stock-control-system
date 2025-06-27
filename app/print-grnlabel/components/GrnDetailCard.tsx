'use client';

import React from 'react';
import { UniversalGrid } from '@/components/layout/universal';
import { ProductCodeInput } from '../../components/qc-label-form/ProductCodeInput';
import { LABEL_MODES, type LabelMode, type PalletTypeKey, type PackageTypeKey } from '../../constants/grnConstants';
import { PalletTypeSelector } from './PalletTypeSelector';
import { PackageTypeSelector } from './PackageTypeSelector';

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
}

interface SupplierInfo {
  code: string;
  name: string;
  address?: string;
}

interface ProductInfo {
  code: string;
  description: string;
  standard_qty?: string;
  type?: string;
}

interface PalletTypeData {
  whiteDry: string;
  whiteWet: string;
  chepDry: string;
  chepWet: string;
  euro: string;
  notIncluded: string;
}

interface PackageTypeData {
  still: string;
  bag: string;
  tote: string;
  octo: string;
  notIncluded: string;
}

interface GrnDetailCardProps {
  formData: FormData;
  labelMode: LabelMode;
  productInfo: ProductInfo | null;
  supplierInfo: SupplierInfo | null;
  supplierError: string | null;
  currentUserId: string;
  palletType: PalletTypeData;
  packageType: PackageTypeData;
  onFormChange: (field: keyof FormData, value: string) => void;
  onSupplierBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onProductInfoChange: (productInfo: any) => void;
  onLabelModeChange: (mode: LabelMode) => void;
  onPalletTypeChange: (key: PalletTypeKey, value: string) => void;
  onPackageTypeChange: (key: PackageTypeKey, value: string) => void;
  disabled?: boolean;
}

export const GrnDetailCard: React.FC<GrnDetailCardProps> = ({
  formData,
  labelMode,
  productInfo,
  supplierInfo,
  supplierError,
  currentUserId,
  palletType,
  packageType,
  onFormChange,
  onSupplierBlur,
  onProductInfoChange,
  onLabelModeChange,
  onPalletTypeChange,
  onPackageTypeChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <UniversalGrid columns={{ sm: 1, md: 2 }} gap="sm">
        {/* GRN Number */}
        <div className="group">
          <label className="block text-sm font-medium mb-1 text-slate-300 group-focus-within:text-orange-400 transition-colors duration-200">
            GRN Number <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.grnNumber}
              onChange={e => onFormChange('grnNumber', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 focus:bg-slate-800/70 hover:border-orange-500/50 hover:bg-slate-800/60 backdrop-blur-sm"
              placeholder="Please Enter..."
              required
              disabled={disabled}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
        </div>

        {/* Material Supplier */}
        <div className="group">
          <label className="block text-sm font-medium mb-1 text-slate-300 group-focus-within:text-orange-400 transition-colors duration-200">
            Material Supplier <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.materialSupplier}
              onChange={e => onFormChange('materialSupplier', e.target.value)}
              onBlur={onSupplierBlur}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400/70 focus:bg-slate-800/70 hover:border-orange-500/50 hover:bg-slate-800/60 backdrop-blur-sm"
              placeholder="Please Enter..."
              required
              disabled={disabled}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          {supplierError && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {supplierError}
              </p>
            </div>
          )}
          {supplierInfo && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-xs flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {supplierInfo.name}
              </p>
            </div>
          )}
        </div>

        {/* Product Code */}
        <div className="md:col-span-2">
          <ProductCodeInput
            value={formData.productCode}
            onChange={(value) => onFormChange('productCode', value)}
            onProductInfoChange={onProductInfoChange}
            required
            userId={currentUserId}
            disabled={disabled}
          />
          {productInfo && (
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-mono text-green-300">{productInfo.code}</span>
                <span className="mx-2 text-green-500">-</span>
                <span>{productInfo.description}</span>
              </p>
            </div>
          )}
        </div>

        {/* Label Mode Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-3 text-slate-300">
            Count Method<span className="text-red-400">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="radio"
                  name="labelMode"
                  value={LABEL_MODES.QUANTITY}
                  checked={labelMode === LABEL_MODES.QUANTITY}
                  onChange={() => onLabelModeChange(LABEL_MODES.QUANTITY)}
                  className="sr-only"
                  disabled={disabled}
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  labelMode === LABEL_MODES.QUANTITY
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-slate-500 bg-transparent group-hover:border-orange-400'
                }`}>
                  {labelMode === LABEL_MODES.QUANTITY && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                labelMode === LABEL_MODES.QUANTITY ? 'text-orange-400' : 'text-slate-300 group-hover:text-orange-300'
              }`}>
                Quantity
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="radio"
                  name="labelMode"
                  value={LABEL_MODES.WEIGHT}
                  checked={labelMode === LABEL_MODES.WEIGHT}
                  onChange={() => onLabelModeChange(LABEL_MODES.WEIGHT)}
                  className="sr-only"
                  disabled={disabled}
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  labelMode === LABEL_MODES.WEIGHT
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-slate-500 bg-transparent group-hover:border-orange-400'
                }`}>
                  {labelMode === LABEL_MODES.WEIGHT && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                labelMode === LABEL_MODES.WEIGHT ? 'text-orange-400' : 'text-slate-300 group-hover:text-orange-300'
              }`}>
                Weight
              </span>
            </label>
          </div>
        </div>
      </UniversalGrid>
      
      {/* Pallet & Package Type Section - Only show in Weight mode */}
      {labelMode === 'weight' && (
        <div className="grid grid-cols-2 gap-3">
          <PalletTypeSelector
            palletType={palletType}
            onChange={onPalletTypeChange}
            disabled={disabled}
          />
          <PackageTypeSelector
            packageType={packageType}
            onChange={onPackageTypeChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default GrnDetailCard;