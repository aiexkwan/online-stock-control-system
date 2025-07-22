'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface RemainToCountProps {
  remainQty: number;
  productCode: string;
  productDesc: string;
  visible: boolean;
}

export default function RemainToCount({
  remainQty,
  productCode,
  productDesc,
  visible,
}: RemainToCountProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className='rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-xl'
    >
      <div className='mb-4 flex items-center justify-center'>
        <ClipboardDocumentCheckIcon className='mr-3 h-8 w-8 text-green-400' />
        <h2 className='text-xl font-bold text-white'>Remain To Count</h2>
      </div>

      <div className='space-y-4'>
        {/* 產品信息 */}
        <div className='rounded-lg border border-slate-600/50 bg-slate-900/50 p-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='text-sm font-medium text-slate-400'>Product Code</label>
              <p className='font-mono text-lg text-white'>{productCode}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-slate-400'>Description</label>
              <p className='truncate text-lg text-white' title={productDesc}>
                {productDesc}
              </p>
            </div>
          </div>
        </div>

        {/* 剩餘數量顯示 */}
        <div className='rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6'>
          <div className='text-center'>
            <label className='mb-2 block text-sm font-medium text-blue-300'>
              Remaining Quantity
            </label>
            <motion.div
              key={remainQty} // 當數量改變時觸發動畫
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className='bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-4xl font-bold text-transparent'
            >
              {remainQty.toLocaleString()}
            </motion.div>
            <p className='mt-2 text-sm text-slate-400'>Units remaining to be counted</p>
          </div>
        </div>

        {/* 狀態指示器 */}
        <div className='flex items-center justify-center'>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-green-400'></div>
            <span className='text-sm text-green-400'>Ready for next scan</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
