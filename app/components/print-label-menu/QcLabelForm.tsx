"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';

// TODO: 將現有 Print Label 表單內容搬到這裡，並導出 QcLabelForm 組件

export default function QcLabelForm() {
  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [count, setCount] = useState('');
  const [operator, setOperator] = useState('');
  const [userId, setUserId] = useState<string>('');

  const [productInfo, setProductInfo] = useState<{
    description: string;
    standard_qty: string;
    type: string;
  } | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState<string>('');

  // 取得登入用戶 id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUserId(userData.id || '');
        } catch {}
      }
    }
  }, []);

  const isFormValid = productCode.trim() && quantity.trim() && count.trim();

  const handlePrintLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const today = new Date();
    const dateStr = format(today, 'ddMMyy');
    const generateTime = format(today, 'dd-MMM-yyyy HH:mm:ss');
    const countNum = Math.max(1, parseInt(count, 10) || 1);

    // 查詢所有今日 plt_num，取最大流水號
    const { data: todayPlts } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .like('plt_num', `${dateStr}/%`);

    let maxNum = 0;
    if (todayPlts && todayPlts.length > 0) {
      todayPlts.forEach(row => {
        const parts = row.plt_num.split('/');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          maxNum = Math.max(maxNum, parseInt(parts[1]));
        }
      });
    }

    // 生成多個唯一 series
    async function generateUniqueSeriesArr(n: number) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const result: string[] = [];
      while (result.length < n) {
        const series = Array.from({length: 12}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        // 查詢是否已存在
        const { data: exist } = await supabase
          .from('record_palletinfo')
          .select('series')
          .eq('series', series)
          .limit(1);
        if ((!exist || exist.length === 0) && !result.includes(series)) {
          result.push(series);
        }
      }
      return result;
    }
    const seriesArr = await generateUniqueSeriesArr(countNum);

    // 準備多筆 insert 資料
    const insertDataArr = Array.from({length: countNum}).map((_, i) => {
      const palletNum = `${dateStr}/${maxNum + 1 + i}`;
      const data: any = {
        plt_num: palletNum,
        generate_time: generateTime,
        product_code: productCode,
        product_qty: quantity,
        series: seriesArr[i],
      };
      if (operator.trim()) {
        data.plt_remark = operator;
      }
      return data;
    });

    // Debug: 顯示所有要插入的 pallet
    setDebugMsg(
      `Will insert to Supabase (${countNum} records):\n` +
      insertDataArr.map(d =>
        `plt_num: ${d.plt_num}\n` +
        `generate_time: ${d.generate_time}\n` +
        `product_code: ${d.product_code}\n` +
        `product_qty: ${d.product_qty}\n` +
        `series: ${d.series}\n` +
        (d.plt_remark ? `plt_remark: ${d.plt_remark}\n` : '')
      ).join('\n---\n')
    );
    console.log('insertDataArr', insertDataArr);

    // 批量上傳至 Supabase
    const { error: insertError } = await supabase
      .from('record_palletinfo')
      .insert(insertDataArr);

    // === 新增：同步更新 record_inventory await 欄位（加強 debug） ===
    for (const d of insertDataArr) {
      const qty = Number(d.product_qty);
      const { data: inv, error: invError } = await supabase
        .from('record_inventory')
        .select('uuid, await')
        .eq('product_code', d.product_code)
        .maybeSingle();

      if (invError) {
        setDebugMsg(prev => prev + `\nInventory Query Error: ${invError.message}`);
        continue;
      }

      if (inv && inv.uuid) {
        const oldAwait = Number(inv.await) || 0;
        const newAwait = oldAwait + qty;
        const { error: updateError } = await supabase
          .from('record_inventory')
          .update({ await: newAwait })
          .eq('uuid', inv.uuid);
        if (updateError) {
          setDebugMsg(prev => prev + `\nInventory Update Error: ${updateError.message}`);
        } else {
          setDebugMsg(prev => prev + `\nInventory Updated: ${d.product_code} await ${oldAwait} -> ${newAwait}`);
        }
      } else {
        const { error: insertInvError } = await supabase
          .from('record_inventory')
          .insert({ product_code: d.product_code, await: qty });
        if (insertInvError) {
          setDebugMsg(prev => prev + `\nInventory Insert Error: ${insertInvError.message}`);
        } else {
          setDebugMsg(prev => prev + `\nInventory Inserted: ${d.product_code} await ${qty}`);
        }
      }
    }
    // === END ===

    // 新增 record_history
    const now = new Date();
    const historyArr = insertDataArr.map((d) => ({
      time: now.toISOString(),
      id: userId ? parseInt(userId, 10) : null,
      remark: operator.trim() ? 'Pre-Booking (Print Before Product Is Ready)' : 'QC Done (Product Finished And Ready)',
      plt_num: d.plt_num,
      loc: d.product_code.startsWith('U') ? 'PipeLine' : 'Production',
      action: 'Production Finished Q.C.'
    }));
    const { error: historyError } = await supabase.from('record_history').insert(historyArr);
    if (historyError) {
      setDebugMsg(prev => prev + `\nHistory Insert Error: ${historyError.message}`);
      console.error('Error inserting record_history:', historyError);
    }

    if (insertError) {
      setDebugMsg(prev => prev + `\nInsert Error: ${insertError.message}`);
      console.error('Error inserting new pallet info:', insertError);
    } else {
      setDebugMsg(prev => prev + '\nInsert Success!');
      console.log('New pallet numbers generated:', insertDataArr.map(d => d.plt_num));
      // 清空所有 input 狀態
      setProductCode('');
      setQuantity('');
      setCount('');
      setOperator('');
    }
  };

  // onBlur 查詢 function
  const handleProductCodeBlur = async (value: string) => {
    if (!value.trim()) {
      setProductInfo(null);
      setProductError(null);
      return;
    }
    const { data, error } = await supabase
      .from('data_code')
      .select('code, description, standard_qty, type')
      .ilike('code', value.trim())
      .single();
    if (error || !data) {
      setProductInfo(null);
      setProductError("Product Code Don't Exist. Please Check Again Or Update Product Code List.");
    } else {
      setProductInfo(data);
      setProductError(null);
      setProductCode(data.code);
      // 不自動 setQuantity
    }
  };

  return (
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
              onBlur={e => handleProductCodeBlur(e.target.value)}
              required
              placeholder="Required"
            />
          </div>
          {/* 查詢結果或錯誤訊息顯示區塊 */}
          <div>
            {productError && (
              <div className="text-red-500 text-sm font-semibold mb-2">{productError}</div>
            )}
            {productInfo && !productError && (
              <div className="text-white text-sm font-semibold mb-2 space-y-1">
                <div>Product Description: {productInfo.description}</div>
                <div>Product Standard Qty: {productInfo.standard_qty}</div>
                <div>Product Type: {productInfo.type}</div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Quantity of Pallet</label>
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
          <li>Enter all required pallet details.</li>
          <li>Click <b>Print Label</b> to generate and save the label(s).</li>
        </ul>
        {/* Debug message */}
        {debugMsg && (
          <pre className="mt-6 text-xs text-yellow-300 whitespace-pre-wrap bg-gray-900 rounded p-3">{debugMsg}</pre>
        )}
      </div>
    </div>
  );
} 