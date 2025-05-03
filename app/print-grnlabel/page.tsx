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
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-6">Print GRN Label</h2>
        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">GRN Number</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter GRN Number"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Material Supplier</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Material Supplier"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Code</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Product Code"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Gross Weight/Qty</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Gross Weight or Quantity"
            />
          </div>

          {/* Pallet Type 區塊 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Pallet Type</h3>
            <div className="flex flex-col gap-2">
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="White - Dry" value={palletType.whiteDry} onChange={e => handlePalletTypeChange('whiteDry', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="White - Wet" value={palletType.whiteWet} onChange={e => handlePalletTypeChange('whiteWet', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Chep - Dry" value={palletType.chepDry} onChange={e => handlePalletTypeChange('chepDry', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Chep - Wet" value={palletType.chepWet} onChange={e => handlePalletTypeChange('chepWet', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Euro" value={palletType.euro} onChange={e => handlePalletTypeChange('euro', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="(Not Included)" value={palletType.notIncluded} onChange={e => handlePalletTypeChange('notIncluded', e.target.value)} />
            </div>
          </div>

          {/* Package Type 區塊 */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Package Type</h3>
            <div className="flex flex-col gap-2">
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Still" value={packageType.still} onChange={e => handlePackageTypeChange('still', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Bag" value={packageType.bag} onChange={e => handlePackageTypeChange('bag', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Tote" value={packageType.tote} onChange={e => handlePackageTypeChange('tote', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Octo" value={packageType.octo} onChange={e => handlePackageTypeChange('octo', e.target.value)} />
              <input type="number" min="0" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="(Not Included)" value={packageType.notIncluded} onChange={e => handlePackageTypeChange('notIncluded', e.target.value)} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 