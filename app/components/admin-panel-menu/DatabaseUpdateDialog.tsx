'use client';

import React, { useState } from 'react';
import { XMarkIcon, CubeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import ProductUpdateTab from './ProductUpdateTab';
import SupplierUpdateTab from './SupplierUpdateTab';

interface DatabaseUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DatabaseUpdateDialog({ isOpen, onClose }: DatabaseUpdateDialogProps) {
  const [activeTab, setActiveTab] = useState<'product' | 'supplier'>('product');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
        onClick={onClose}
        style={{ zIndex: 60 }}
      />
      
      {/* Dialog */}
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ zIndex: 70 }}
      >
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent">
                  Database Update
                </h2>
                <p className="text-sm text-slate-400">Manage product and supplier information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-600/50">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === 'product'
                  ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CubeIcon className="w-4 h-4" />
                Product Update
              </div>
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === 'supplier'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4" />
                Material Supplier Update
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'product' ? (
              <div className="h-full overflow-y-auto">
                <ProductUpdateTab />
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <SupplierUpdateTab />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 