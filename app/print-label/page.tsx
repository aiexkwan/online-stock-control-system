'use client';

import React, { useState } from 'react';

export default function PrintLabelPage() {
  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [count, setCount] = useState('');
  const [operator, setOperator] = useState('');

  const isFormValid = productCode.trim() && quantity.trim() && count.trim();

  return (
    <div className="pl-64 pt-16 min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-row gap-12 items-start justify-center w-full max-w-4xl">
        {/* Pallet Detail 區塊 */}
        <div className="bg-gray-800 rounded-lg p-8 flex-1 min-w-[320px] max-w-md shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Pallet Detail</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Product Code</label>
              <input
                type="text"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Quantity Of Pallet</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Count of Pallet</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={count}
                onChange={e => setCount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Operator Clock Number <span className="text-gray-500">(Optional)</span></label>
              <input
                type="text"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <button
              type="submit"
              className={`mt-4 w-full py-2 rounded-md text-white font-semibold transition-colors ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`}
              disabled={!isFormValid}
            >
              Print Label
            </button>
          </form>
        </div>
        {/* Instruction 區塊 */}
        <div className="bg-gray-800 rounded-lg p-8 flex-1 min-w-[320px] max-w-md shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Instruction</h2>
          <ul className="text-gray-300 text-sm list-disc pl-5 space-y-2">
            <li>Fill in all required pallet details on the left.</li>
            <li>Operator Clock Number is optional.</li>
            <li>Click <b>Print Label</b> only when all required fields are completed.</li>
            <li>The button will be disabled if any required field is missing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 