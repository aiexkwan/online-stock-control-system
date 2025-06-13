'use client';

import React from 'react';
import { AcoOrderDetail } from './types';

interface AcoOrderFormProps {
  acoOrderRef: string;
  onAcoOrderRefChange: (value: string) => void;
  availableAcoOrderRefs: number[];
  acoRemain: string | null;
  acoSearchLoading: boolean;
  canSearchAco: boolean;
  onAcoSearch: () => void;
  acoNewRef: boolean;
  acoOrderDetails: AcoOrderDetail[];
  acoOrderDetailErrors: string[];
  onAcoOrderDetailChange: (idx: number, field: 'code' | 'qty', value: string) => void;
  onAcoOrderDetailUpdate: () => void;
  onValidateAcoOrderDetailCode: (code: string, idx: number) => void;
  isAcoOrderExcess?: boolean;
  disabled?: boolean;
}

export const AcoOrderForm: React.FC<AcoOrderFormProps> = React.memo(({
  acoOrderRef,
  onAcoOrderRefChange,
  availableAcoOrderRefs,
  acoRemain,
  acoSearchLoading,
  canSearchAco,
  onAcoSearch,
  acoNewRef,
  acoOrderDetails,
  acoOrderDetailErrors,
  onAcoOrderDetailChange,
  onAcoOrderDetailUpdate,
  onValidateAcoOrderDetailCode,
  isAcoOrderExcess = false,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">ACO Order Record</h3>
        <p className="text-blue-600 text-sm mb-4">
          Select from existing orders uploaded via PDF analysis
        </p>
        
        {/* ACO Order Ref Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-blue-700">
            Select Existing Order Reference
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {/* Dropdown for existing orders */}
          <select
            className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={acoOrderRef}
            onChange={(e) => onAcoOrderRefChange(e.target.value)}
            disabled={disabled || acoSearchLoading}
          >
            <option value="">Select Existing Order Ref</option>
            {availableAcoOrderRefs.map(ref => (
              <option key={ref} value={String(ref)}>{ref}</option>
            ))}
          </select>
          
          {/* Search Button */}
          <button
            type="button"
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              canSearchAco && !acoSearchLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!canSearchAco || acoSearchLoading || disabled}
            onClick={onAcoSearch}
          >
            {acoSearchLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </span>
            ) : (
              'Search Order'
            )}
          </button>
        </div>
        
        {/* Search Results */}
        {acoRemain && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">{acoRemain}</div>
          </div>
        )}
        
        {isAcoOrderExcess && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm font-medium text-red-800">
              ⚠️ Input Quantity Exceeds Order Remaining
            </div>
            <div className="text-xs text-red-600 mt-1">
              The total quantity (Quantity × Count) exceeds the remaining quantity for this ACO order. Please adjust your input or contact management.
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Set display name for debugging
AcoOrderForm.displayName = 'AcoOrderForm';

export default AcoOrderForm; 