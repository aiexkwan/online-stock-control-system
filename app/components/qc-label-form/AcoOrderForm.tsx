'use client';

import React from 'react';
import { AcoOrderDetail } from './types';

interface AcoOrderFormProps {
  acoOrderRef: string;
  onAcoOrderRefChange: (value: string) => void;
  availableAcoOrderRefs: number[];
  acoRemain: string | null;
  acoSearchLoading: boolean;
  onAutoAcoConfirm: (orderRef: string) => Promise<void>;
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
    onAutoAcoConfirm,
    acoNewRef,
    acoOrderDetails,
    acoOrderDetailErrors,
    onAcoOrderDetailChange,
    onAcoOrderDetailUpdate,
    onValidateAcoOrderDetailCode,
    isAcoOrderExcess = false,
    disabled = false,
  }) => {
    // Handle auto-confirm when order reference is selected
    const handleOrderRefSelect = async (value: string) => {
      onAcoOrderRefChange(value);
      if (value && value.trim()) {
        await onAutoAcoConfirm(value);
      }
    };
    return (
      <div className='space-y-4'>
        <div className='bg-transparent p-4'>
          <p className='mb-4 text-sm text-purple-400'>Select From ACO Order List</p>

          {/* ACO Order Ref Selection */}
          <div className='space-y-3'>
            {/* Dropdown for existing orders - auto-confirms on selection */}
            <select
              className='w-full rounded-md border border-purple-600/30 bg-slate-800/50 px-3 py-2 text-purple-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option:first-child]:text-slate-400'
              value={acoOrderRef}
              onChange={e => handleOrderRefSelect(e.target.value)}
              disabled={disabled || acoSearchLoading}
            >
              <option value='' className='text-slate-400'>
                {acoSearchLoading ? 'Loading...' : 'Select Existing Order Ref'}
              </option>
              {availableAcoOrderRefs.map(ref => (
                <option key={ref} value={String(ref)} className='text-white'>
                  {ref}
                </option>
              ))}
            </select>

            {/* Auto-search status indicator (replace manual confirm button) */}
            {acoSearchLoading && (
              <div className='flex items-center justify-center rounded-md bg-purple-900/20 px-4 py-2 text-purple-300'>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-purple-400'></div>
                Auto-confirming order details...
              </div>
            )}
          </div>

          {/* Auto-search Results */}
          {acoRemain && (
            <div className='mt-3 rounded-md border border-green-500/30 bg-green-900/20 p-3'>
              <div className='flex items-center text-sm font-medium text-green-400'>
                <svg className='mr-2 h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                {acoRemain}
              </div>
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
