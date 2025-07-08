'use client';

import React from 'react';

interface LoadingProgressChartProps {
  orderData: Array<{
    product_code: string;
    product_desc: string;
    product_qty: string;
    loaded_qty: string;
  }>;
  recentLoads: Array<{
    product_code: string;
    quantity: number;
    action_time: string;
  }>;
}

export function LoadingProgressChart({ orderData }: LoadingProgressChartProps) {
  // Calculate total progress
  const totalProgress =
    orderData.reduce((acc, item) => {
      const totalQty = parseInt(item.product_qty || '0');
      const loadedQty = parseInt(item.loaded_qty || '0');
      const percentage = totalQty > 0 ? (loadedQty / totalQty) * 100 : 0;
      return acc + percentage;
    }, 0) / (orderData.length || 1);

  return (
    <div className='rounded-xl border border-slate-700/50 bg-slate-800/50 p-6'>
      <div className='mb-2'>
        <div className='mb-1 flex justify-between text-sm'>
          <span className='text-slate-400'>Total Progress</span>
          <span className='font-medium text-cyan-400'>{totalProgress.toFixed(1)}%</span>
        </div>
        <div className='h-3 w-full overflow-hidden rounded-full bg-slate-700'>
          <div
            className='h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-out'
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
