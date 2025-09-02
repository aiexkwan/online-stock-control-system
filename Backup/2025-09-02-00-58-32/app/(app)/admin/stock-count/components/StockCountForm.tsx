'use client';

import React, { useState } from 'react';
import { CameraIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SimpleQRScanner } from '@/components/business/scanning/simple-qr-scanner';

interface StockCountFormProps {
  onSubmit: (data: {
    qrCode?: string;
    pallet?: string;
    productCode?: string;
    quantity?: number;
  }) => void;
  isLoading: boolean;
}

export default function StockCountForm({ onSubmit, isLoading }: StockCountFormProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    pallet: '',
    productCode: '',
    quantity: '',
  });

  // Handle QR scan result
  const handleScan = (result: string) => {
    setShowScanner(false);
    onSubmit({ qrCode: result });
  };

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pallet.trim()) {
      toast.error('Please enter pallet number');
      return;
    }

    const quantity = formData.quantity ? parseInt(formData.quantity) : undefined;
    if (formData.quantity && (isNaN(quantity!) || quantity! < 0)) {
      toast.error('Please enter a valid quantity');
      return;
    }

    onSubmit({
      pallet: formData.pallet.trim(),
      productCode: formData.productCode.trim() || undefined,
      quantity: quantity,
    });

    // Reset form
    setFormData({ pallet: '', productCode: '', quantity: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className='rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-xl'>
      <div className='mb-6'>
        <h2 className='bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-center text-2xl font-bold text-transparent'>
          Stock Count
        </h2>
      </div>

      {/* Mode Toggle */}
      <div className='mb-6 flex rounded-lg bg-slate-900/50 p-1'>
        <button
          onClick={() => setMode('scan')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'scan' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CameraIcon className='mr-2 inline h-4 w-4' />
          QR Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PencilSquareIcon className='mr-2 inline h-4 w-4' />
          Manual
        </button>
      </div>

      {/* Scan Mode */}
      {mode === 'scan' && (
        <div className='text-center'>
          <p className='mb-4 text-slate-300'>
            Scan the QR code on the pallet label to begin counting
          </p>
          <button
            onClick={() => setShowScanner(true)}
            disabled={isLoading}
            className='w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700'
          >
            {isLoading ? (
              <div className='flex items-center justify-center'>
                <div className='mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Processing...
              </div>
            ) : (
              <>
                <CameraIcon className='mr-2 inline h-5 w-5' />
                Start Scanning
              </>
            )}
          </button>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className='space-y-4'>
          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>Pallet Number *</label>
            <input
              type='text'
              value={formData.pallet}
              onChange={e => handleInputChange('pallet', e.target.value)}
              placeholder='e.g.: 241224/01'
              className='w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              required
              autoFocus
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Product Code (Optional)
            </label>
            <input
              type='text'
              value={formData.productCode}
              onChange={e => handleInputChange('productCode', e.target.value)}
              placeholder='Enter product code'
              className='w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-slate-300'>
              Quantity (Optional)
            </label>
            <input
              type='number'
              min='0'
              value={formData.quantity}
              onChange={e => handleInputChange('quantity', e.target.value)}
              placeholder='Enter quantity'
              className='w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading || !formData.pallet.trim()}
            className='w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isLoading ? (
              <div className='flex items-center justify-center'>
                <div className='mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                Processing...
              </div>
            ) : (
              'Submit Count'
            )}
          </button>
        </form>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <SimpleQRScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScan}
          title='Scan Pallet QR Code'
        />
      )}
    </div>
  );
}
