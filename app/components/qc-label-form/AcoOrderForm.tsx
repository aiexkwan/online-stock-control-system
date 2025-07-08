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

export const AcoOrderForm: React.FC<AcoOrderFormProps> = React.memo(
  ({
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
    disabled = false,
  }) => {
    return (
      <div className='space-y-4'>
        <div className='bg-transparent p-4'>
          <p className='mb-4 text-sm text-purple-400'>Select From ACO Order List</p>

          {/* ACO Order Ref Selection */}
          <div className='space-y-3'>
            {/* Dropdown for existing orders */}
            <select
              className='w-full rounded-md border border-purple-600/30 bg-slate-800/50 px-3 py-2 text-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option:first-child]:text-slate-400'
              value={acoOrderRef}
              onChange={e => onAcoOrderRefChange(e.target.value)}
              disabled={disabled || acoSearchLoading}
            >
              <option value='' className='text-slate-400'>
                Select Existing Order Ref
              </option>
              {availableAcoOrderRefs.map(ref => (
                <option key={ref} value={String(ref)} className='text-white'>
                  {ref}
                </option>
              ))}
            </select>

            {/* Confirm Button */}
            <button
              type='button'
              className={`w-full rounded-md px-4 py-2 font-medium transition-colors ${
                canSearchAco && !acoSearchLoading
                  ? 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
                  : 'cursor-not-allowed bg-slate-700 text-slate-400'
              }`}
              disabled={!canSearchAco || acoSearchLoading || disabled}
              onClick={onAcoSearch}
            >
              {acoSearchLoading ? (
                <span className='flex items-center justify-center'>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                  Confirming...
                </span>
              ) : (
                'Confirm'
              )}
            </button>
          </div>

          {/* Search Results */}
          {acoRemain && (
            <div className='mt-3 rounded-md border border-green-500/30 bg-green-900/20 p-3'>
              <div className='text-sm font-medium text-green-400'>{acoRemain}</div>
            </div>
          )}

          {isAcoOrderExcess && (
            <div className='mt-3 rounded-md border border-red-500/30 bg-red-900/20 p-3'>
              <div className='text-sm font-medium text-red-400'>
                ⚠️ Input Quantity Exceeds Order Outstanding
              </div>
              <div className='mt-1 text-xs text-red-300'>
                The total quantity (Quantity × Count) exceeds the outstanding quantity for this ACO
                order. Please adjust your input or contact management.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Set display name for debugging
AcoOrderForm.displayName = 'AcoOrderForm';

export default AcoOrderForm;
