'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PrintLabelPage() {
  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [count, setCount] = useState('');
  const [operator, setOperator] = useState('');

  const [productInfo, setProductInfo] = useState<{
    description: string;
    standard_qty: string;
    type: string;
  } | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  // 查詢 Product Code
  React.useEffect(() => {
    if (!productCode.trim()) {
      setProductInfo(null);
      setProductError(null);
      return;
    }
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('data_code')
        .select('description, standard_qty, type')
        .ilike('code', productCode.trim())
        .single();
      if (error || !data) {
        setProductInfo(null);
        setProductError("Product Code Don't Exist. Please Check Again Or Update Product Code List.");
      } else {
        setProductInfo(data);
        setProductError(null);
        if (data.standard_qty !== '-') {
          setQuantity(data.standard_qty);
        }
      }
    };
    fetchProduct();
  }, [productCode]);

  const isFormValid = productCode.trim() && quantity.trim() && count.trim();

  const handlePrintLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, '');

    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .order('generate_time', { ascending: false })
      .limit(1)
      .single();

    if (palletError) {
      console.error('Error fetching pallet info:', palletError);
      return;
    }

    const lastPalletNum = palletData ? parseInt(palletData.plt_num.split('/')[1]) : 0;
    const newPalletNum = `${dateStr}/${lastPalletNum + 1}`;

    const { error: insertError } = await supabase
      .from('record_palletinfo')
      .insert({ plt_num: newPalletNum, generate_time: today.toISOString() });

    if (insertError) {
      console.error('Error inserting new pallet info:', insertError);
    } else {
      console.log('New pallet number generated:', newPalletNum);
    }
  };

  return (
    <div className="pl-64 pt-16 min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-row gap-12 items-start justify-center w-full max-w-4xl">
        {/* Pallet Detail 區塊 */}
        <div className="bg-gray-800 rounded-lg p-8 flex-1 min-w-[320px] max-w-md shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Pallet Detail</h2>
          <form className="flex flex-col gap-4" onSubmit={handlePrintLabel}>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Product Code</label>
              <input
                type="text"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productCode}
                onChange={e => setProductCode(e.target.value)}
                required
                placeholder="Required"
              />
            </div>
            {/* 查詢結果或錯誤訊息顯示區塊 */}
            <div>
              {productError && (
                <div className="text-red-500 text-sm font-semibold mb-2">{productError}</div>
              )}
              {productInfo && (
                <div className="text-red-500 text-sm font-semibold mb-2 space-y-1">
                  <div>Product Description: {productInfo.description}</div>
                  <div>Product Standard Qty: {productInfo.standard_qty}</div>
                  <div>Product Type: {productInfo.type}</div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Quantity Of Pallet</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Required"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Count of Pallet</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={count}
                onChange={e => setCount(e.target.value)}
                placeholder="Required"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Operator Clock Number</label>
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
            <li>Fill in all required pallet details.</li>
            <li>Operator Clock Number is optional.</li>
            <li>Click <b>Print Label</b> to print the label.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 