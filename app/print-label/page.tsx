'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

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
  const [debugMsg, setDebugMsg] = useState<string>('');

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
    // 1. Pallet number 格式 ddmmyy/流水號
    const dateStr = format(today, 'ddMMyy');

    // 2. generate_time 格式 dd-mmm-yyyy hh:mm:ss
    const generateTime = format(today, 'dd-MMM-yyyy HH:mm:ss');

    // 3. 查詢最新流水號
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .order('generate_time', { ascending: false })
      .limit(1)
      .single();

    let lastPalletNum = 0;
    if (palletData && palletData.plt_num) {
      const parts = palletData.plt_num.split('/');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        lastPalletNum = parseInt(parts[1]);
      }
    }
    const newPalletNum = `${dateStr}/${lastPalletNum + 1}`;

    // 4. 隨機 12 位 series，並驗證唯一性
    async function generateUniqueSeries() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let unique = false;
      let series = '';
      while (!unique) {
        series = Array.from({length: 12}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        // 查詢是否已存在
        const { data: exist, error: existError } = await supabase
          .from('record_palletinfo')
          .select('series')
          .eq('series', series)
          .limit(1);
        if (!existError && (!exist || exist.length === 0)) {
          unique = true;
        }
      }
      return series;
    }
    const randomSeries = await generateUniqueSeries();

    // 5. 準備要寫入的資料
    const insertData: any = {
      plt_num: newPalletNum,
      generate_time: generateTime,
      product_code: productCode,
      product_qty: quantity,
      series: randomSeries,
    };
    if (operator.trim()) {
      insertData.plt_remark = operator;
    }

    setDebugMsg(
      `Will insert to Supabase:\n` +
      `plt_num: ${insertData.plt_num}\n` +
      `generate_time: ${insertData.generate_time}\n` +
      `product_code: ${insertData.product_code}\n` +
      `product_qty: ${insertData.product_qty}\n` +
      `series: ${insertData.series}\n` +
      (insertData.plt_remark ? `plt_remark: ${insertData.plt_remark}\n` : '')
    );

    // 6. 上傳至 Supabase
    const { error: insertError } = await supabase
      .from('record_palletinfo')
      .insert(insertData);

    if (insertError) {
      setDebugMsg(prev => prev + `\nInsert Error: ${insertError.message}`);
      console.error('Error inserting new pallet info:', insertError);
    } else {
      setDebugMsg(prev => prev + '\nInsert Success!');
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
          {/* Debug message */}
          {debugMsg && (
            <pre className="mt-6 text-xs text-yellow-300 whitespace-pre-wrap bg-gray-900 rounded p-3">{debugMsg}</pre>
          )}
        </div>
      </div>
    </div>
  );
} 