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
  visible 
}: RemainToCountProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center justify-center mb-4">
        <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Remain To Count</h2>
      </div>

      <div className="space-y-4">
        {/* 產品信息 */}
        <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-400">Product Code</label>
              <p className="text-lg font-mono text-white">{productCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Description</label>
              <p className="text-lg text-white truncate" title={productDesc}>
                {productDesc}
              </p>
            </div>
          </div>
        </div>

        {/* 剩餘數量顯示 */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
          <div className="text-center">
            <label className="text-sm font-medium text-blue-300 block mb-2">
              Remaining Quantity
            </label>
            <motion.div
              key={remainQty} // 當數量改變時觸發動畫
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent"
            >
              {remainQty.toLocaleString()}
            </motion.div>
            <p className="text-sm text-slate-400 mt-2">
              Units remaining to be counted
            </p>
          </div>
        </div>

        {/* 狀態指示器 */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Ready for next scan</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 