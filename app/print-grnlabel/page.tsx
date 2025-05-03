"use client";
import React, { useState } from 'react';

export default function PrintGrnLabelPage() {
  // Pallet Type 狀態
  const [palletType, setPalletType] = useState({
    whiteDry: '',
    whiteWet: '',
    chepDry: '',
    chepWet: '',
    euro: '',
    notIncluded: '',
  });
  // Package Type 狀態
  const [packageType, setPackageType] = useState({
    still: '',
    bag: '',
    tote: '',
    octo: '',
    notIncluded: '',
  });

  // Pallet Type 互斥邏輯
  const handlePalletTypeChange = (key: keyof typeof palletType, value: string) => {
    setPalletType({
      whiteDry: '',
      whiteWet: '',
      chepDry: '',
      chepWet: '',
      euro: '',
      notIncluded: '',
      [key]: value,
    });
  };
  // Package Type 互斥邏輯
  const handlePackageTypeChange = (key: keyof typeof packageType, value: string) => {
    setPackageType({
      still: '',
      bag: '',
      tote: '',
      octo: '',
      notIncluded: '',
      [key]: value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="flex flex-row gap-12 items-start w-full max-w-4xl">
        {/* 主表單 */}
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Print GRN Label</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">GRN Number</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Material Supplier</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Product Code</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Gross Weight/Qty</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." />
            </div>
          </form>
        </div>
        {/* 右側 Pallet Type + Package Type 區塊 */}
        <div className="flex flex-col gap-10 min-w-[260px]">
          {/* Pallet Type 區塊 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Pallet Type</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">White - Dry</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteDry} onChange={e => handlePalletTypeChange('whiteDry', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">White - Wet</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteWet} onChange={e => handlePalletTypeChange('whiteWet', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Chep - Dry</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepDry} onChange={e => handlePalletTypeChange('chepDry', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Chep - Wet</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepWet} onChange={e => handlePalletTypeChange('chepWet', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Euro</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.euro} onChange={e => handlePalletTypeChange('euro', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.notIncluded} onChange={e => handlePalletTypeChange('notIncluded', e.target.value)} />
              </div>
            </div>
          </div>
          {/* Package Type 區塊 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Package Type</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Still</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.still} onChange={e => handlePackageTypeChange('still', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Bag</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.bag} onChange={e => handlePackageTypeChange('bag', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tote</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.tote} onChange={e => handlePackageTypeChange('tote', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Octo</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.octo} onChange={e => handlePackageTypeChange('octo', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.notIncluded} onChange={e => handlePackageTypeChange('notIncluded', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 