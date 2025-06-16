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
  const totalProgress = orderData.reduce((acc, item) => {
    const totalQty = parseInt(item.product_qty || '0');
    const loadedQty = parseInt(item.loaded_qty || '0');
    const percentage = totalQty > 0 ? (loadedQty / totalQty) * 100 : 0;
    return acc + percentage;
  }, 0) / (orderData.length || 1);

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Total Progress</span>
          <span className="text-cyan-400 font-medium">{totalProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}