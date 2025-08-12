'use client';

import React from 'react';
import { ClipboardDocumentCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CountData } from '../../hooks/useStockCount';

interface StockCountResultProps {
  data: CountData;
  countedQuantity?: string;
  onQuantityChange?: (value: string) => void;
  onQuantitySubmit?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  compact?: boolean; // For card layout optimization
}

export default function StockCountResult({ 
  data, 
  countedQuantity, 
  onQuantityChange, 
  onQuantitySubmit, 
  onReset, 
  isLoading = false,
  compact = false
}: StockCountResultProps) {
  
  if (data.need_input && onQuantityChange && onQuantitySubmit) {
    // Show quantity input form
    return (
      <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
        <div className="flex items-center">
          <ClipboardDocumentCheckIcon className={`mr-3 ${compact ? 'h-6 w-6' : 'h-8 w-8'} text-yellow-400`} />
          <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-white`}>
            Enter Counted Quantity
          </h3>
        </div>
        
        <div className={`${compact ? 'space-y-1' : 'space-y-2'} text-sm`}>
          <p className="text-slate-300">
            Product: <span className="font-medium text-white">{data.product_code}</span>
          </p>
          <p className="text-slate-300">
            Pallet: <span className="font-medium text-white">{data.plt_num}</span>
          </p>
          {!compact && (
            <p className="text-slate-300">
              Description: <span className="font-medium text-white">{data.product_desc}</span>
            </p>
          )}
          {data.current_remain_qty !== undefined && (
            <p className="text-slate-300">
              Current Stock: <span className="font-medium text-white">{data.current_remain_qty}</span>
            </p>
          )}
        </div>
        
        <div>
          <input
            type="number"
            min="0"
            value={countedQuantity || ''}
            onChange={(e) => onQuantityChange(e.target.value)}
            placeholder="Enter quantity"
            className={`w-full rounded-lg border border-slate-600 bg-slate-900 px-4 ${
              compact ? 'py-2' : 'py-3'
            } text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            autoFocus
          />
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className={`flex-1 rounded-lg bg-red-600 px-4 ${
              compact ? 'py-2' : 'py-3'
            } font-semibold text-white transition-colors hover:bg-red-700`}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onQuantitySubmit}
            className={`flex-1 rounded-lg bg-green-600 px-4 ${
              compact ? 'py-2' : 'py-3'
            } font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50`}
            disabled={isLoading || !countedQuantity}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show count result
  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="flex items-center justify-center">
        <CheckCircleIcon className={`mr-3 ${compact ? 'h-6 w-6' : 'h-8 w-8'} text-green-400`} />
        <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-white`}>
          Count Recorded
        </h2>
      </div>

      <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
        <div className="rounded-lg border border-slate-600/50 bg-slate-900/50 p-3">
          <div className={`grid grid-cols-1 ${compact ? 'gap-2' : 'gap-4 md:grid-cols-2'}`}>
            <div>
              <label className="text-xs font-medium text-slate-400">Product Code</label>
              <p className={`font-mono ${compact ? 'text-sm' : 'text-lg'} text-white`}>
                {data.product_code}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Pallet Number</label>
              <p className={`font-mono ${compact ? 'text-sm' : 'text-lg'} text-white`}>
                {data.plt_num}
              </p>
            </div>
          </div>
          {!compact && (
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-400">Description</label>
              <p className="text-base text-white">{data.product_desc}</p>
            </div>
          )}
        </div>

        <div className={`rounded-lg border border-green-500/30 bg-gradient-to-r from-green-600/20 to-blue-600/20 ${
          compact ? 'p-3' : 'p-6'
        }`}>
          <div className="text-center">
            <label className={`mb-1 block ${compact ? 'text-xs' : 'text-sm'} font-medium text-green-300`}>
              Remaining Quantity
            </label>
            <div className={`bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text ${
              compact ? 'text-2xl' : 'text-4xl'
            } font-bold text-transparent`}>
              {data.remain_qty.toLocaleString()}
            </div>
            {!compact && (
              <p className="mt-2 text-sm text-slate-400">Units remaining to be counted</p>
            )}
            {data.counted_qty !== undefined && (
              <p className="mt-1 text-sm text-slate-300">
                Counted: <span className="font-medium text-white">{data.counted_qty}</span>
              </p>
            )}
          </div>
        </div>

        {onReset && (
          <div className="flex justify-center">
            <button
              onClick={onReset}
              className={`rounded-lg bg-slate-700 px-6 ${
                compact ? 'py-2' : 'py-3'
              } font-semibold text-white transition-colors hover:bg-slate-600`}
            >
              Scan Next Pallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}