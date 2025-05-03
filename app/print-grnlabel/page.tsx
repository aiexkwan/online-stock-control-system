"use client";
import React, { useState } from 'react';

// 隱藏數字 input 的 spin button
const inputNumberNoSpin: React.CSSProperties = {
  MozAppearance: 'textfield',
  appearance: 'none',
  WebkitAppearance: 'none',
};

export default function PrintGrnLabelPage() {
  // 主表單狀態
  const [form, setForm] = useState({
    grnNumber: '',
    materialSupplier: '',
    productCode: '',
    grossWeight: '',
  });
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

  // 主表單 onChange
  const handleFormChange = (key: keyof typeof form, value: string) => {
    setForm({ ...form, [key]: value });
  };
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

  // 驗證條件
  const isFormFilled = Object.values(form).every(v => v.trim() !== '');
  const isPalletTypeFilled = Object.values(palletType).some(v => v.trim() !== '');
  const isPackageTypeFilled = Object.values(packageType).some(v => v.trim() !== '');
  const canPrint = isFormFilled && isPalletTypeFilled && isPackageTypeFilled;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="flex flex-row gap-12 items-start w-full max-w-5xl">
        {/* 主表單 */}
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Print GRN Label</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">GRN Number</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.grnNumber} onChange={e => handleFormChange('grnNumber', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Material Supplier</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.materialSupplier} onChange={e => handleFormChange('materialSupplier', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Product Code</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.productCode} onChange={e => handleFormChange('productCode', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Gross Weight/Qty</label>
              <input type="text" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.grossWeight} onChange={e => handleFormChange('grossWeight', e.target.value)} />
            </div>
          </form>
        </div>
        {/* 右側 Pallet Type + Package Type 區塊（橫向排列） */}
        <div className="flex flex-row gap-10 min-w-[600px]">
          {/* Pallet Type 區塊 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">Pallet Type</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">White - Dry</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteDry} onChange={e => handlePalletTypeChange('whiteDry', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">White - Wet</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteWet} onChange={e => handlePalletTypeChange('whiteWet', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Chep - Dry</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepDry} onChange={e => handlePalletTypeChange('chepDry', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Chep - Wet</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepWet} onChange={e => handlePalletTypeChange('chepWet', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Euro</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.euro} onChange={e => handlePalletTypeChange('euro', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.notIncluded} onChange={e => handlePalletTypeChange('notIncluded', e.target.value)} />
              </div>
            </div>
          </div>
          {/* Package Type 區塊 */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Package Type</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Still</label>
                  <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.still} onChange={e => handlePackageTypeChange('still', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Bag</label>
                  <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.bag} onChange={e => handlePackageTypeChange('bag', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Tote</label>
                  <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.tote} onChange={e => handlePackageTypeChange('tote', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Octo</label>
                  <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.octo} onChange={e => handlePackageTypeChange('octo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                  <input type="number" min="0" inputMode="numeric" style={inputNumberNoSpin} className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.notIncluded} onChange={e => handlePackageTypeChange('notIncluded', e.target.value)} />
                </div>
              </div>
            </div>
            <button type="button" className={`mt-8 w-full py-2 rounded-md text-white font-semibold transition-colors ${canPrint ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`} disabled={!canPrint}>
              Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 