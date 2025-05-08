"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import ReviewTemplate from '../../components/print-label-pdf/ReviewTemplate';
import { generateAndUploadPdf } from '../print-label-pdf/PdfGenerator';

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

  // 新增 ACO/Slate 動態欄位
  const [acoOrderRef, setAcoOrderRef] = useState('');
  const [slateDetail, setSlateDetail] = useState({
    firstOffDate: '',
    batchNumber: '',
    setterName: '',
    machNum: '',
    material: '',
    weight: '',
    topThickness: '',
    bottomThickness: '',
    length: '',
    width: '',
    centreHole: '',
    lengthMiddleHoleToBottom: '',
    colour: '',
    shapes: '',
    flameTest: '',
    remark: ''
  });

  const [acoRemain, setAcoRemain] = useState<string | null>(null);
  const [acoSearchLoading, setAcoSearchLoading] = useState(false);
  const canSearchAco = acoOrderRef.trim().length >= 5;

  // 新增 New ACO Ref Detected 相關變數
  const [acoNewRef, setAcoNewRef] = useState(false);
  const [acoNewProductCode, setAcoNewProductCode] = useState('');
  const [acoNewOrderQty, setAcoNewOrderQty] = useState('');

  // 動態 ACO Order Detail 多組 input 狀態
  const [acoOrderDetails, setAcoOrderDetails] = useState([{ code: '', qty: '' }]);

  // 新增：ACO Order Detail 欄位驗證錯誤狀態
  const [acoOrderDetailErrors, setAcoOrderDetailErrors] = useState<string[]>([]);

  // PDF 批次進度狀態
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; status: string[] }>({ current: 0, total: 0, status: [] });

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

  // 驗證條件
  const isAcoValid = productInfo?.type === 'ACO' ? acoOrderRef.trim() !== '' : true;
  const isSlateValid = productInfo?.type === 'Slate'
    ? Object.entries(slateDetail)
        .filter(([k]) => k !== 'remark')
        .every(([, v]) => v.trim() !== '')
    : true;
  const isAcoOrderFullfilled = acoRemain === 'Order Been Fullfilled';
  // 新增：判斷剩餘數量不足
  let isAcoOrderExcess = false;
  let acoRemainQty = null;
  if (acoRemain && acoRemain.startsWith('Order Remain Qty : ')) {
    const match = acoRemain.match(/Order Remain Qty : (\d+)/);
    if (match) {
      acoRemainQty = parseInt(match[1], 10);
      if (!isNaN(acoRemainQty) && quantity.trim() && parseInt(quantity, 10) > acoRemainQty) {
        isAcoOrderExcess = true;
      }
    }
  }
  const isFormValid = productCode.trim() && quantity.trim() && count.trim() && isAcoValid && isSlateValid && !isAcoOrderFullfilled && !isAcoOrderExcess;

  const handlePrintLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    let debugMsg = '';
    let inventoryUpdated = false;
    let acoUpdated = false;
    if (!isFormValid) return;

    // 先組合 query string
    const today = new Date();
    const dateStr = format(today, 'ddMMyy'); // 用於 palletNum/plt_num
    const dateLabel = format(today, 'dd-MMM-yyyy'); // 只給 PDF label 顯示
    const operatorNum = operator.trim() ? operator.trim() : '-';
    const qcNum = userId || '-';
    let workOrderType = '-';
    let workOrderValue = '-';
    let workOrderNumber = '-';
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      workOrderType = 'ACO Order Ref';
      workOrderValue = acoOrderRef.trim();
      workOrderNumber = acoOrderRef.trim();
    } else if (productInfo?.type) {
      workOrderType = productInfo.type;
      workOrderNumber = productInfo.type;
    }

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
    const palletNum = `${dateStr}/${maxNum + 1}`;

    const generateTime = format(today, 'dd-MMM-yyyy HH:mm:ss');
    const countNum = Math.max(1, parseInt(count, 10) || 1);

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
    const insertDataArr = Array.from({length: productInfo?.type === 'Slate' ? 1 : countNum}).map((_, i) => {
      const thisPalletNum = `${dateStr}/${maxNum + 1 + i}`;
      const data: any = {
        plt_num: thisPalletNum,
        generate_time: generateTime,
        product_code: productCode,
        product_qty: quantity,
        series: seriesArr[i],
      };
      if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
        data.plt_remark = `ACO Ref : ${acoOrderRef.trim()}`;
      } else if (productInfo?.type === 'Slate') {
        data.plt_remark = `Batch Number : ${slateDetail.batchNumber}`;
      } else if (operator.trim()) {
        data.plt_remark = operator;
      }
      return data;
    });

    // 先執行 Supabase 插入
    const { error: insertError } = await supabase
      .from('record_palletinfo')
      .insert(insertDataArr);

    // Debug: 顯示所有要插入的 pallet
    if (!insertError) {
      insertDataArr.forEach(d => {
        debugMsg += `Product Code : ${d.product_code}\nPallet Number : ${d.plt_num}\nQty : ${d.product_qty}\n\n`;
      });
    }

    // === 新增：同步更新 record_inventory await 欄位（加強 debug） ===
    for (const d of insertDataArr) {
      const qty = Number(d.product_qty);
      const { data: inv, error: invError } = await supabase
        .from('record_inventory')
        .select('uuid, await')
        .eq('product_code', d.product_code)
        .maybeSingle();
      if (invError) {
        continue;
      }
      if (inv && inv.uuid) {
        const oldAwait = Number(inv.await) || 0;
        const newAwait = oldAwait + qty;
        const { error: updateError } = await supabase
          .from('record_inventory')
          .update({ await: newAwait })
          .eq('uuid', inv.uuid);
        if (!updateError) {
          inventoryUpdated = true;
        }
      } else {
        const { error: insertInvError } = await supabase
          .from('record_inventory')
          .insert({ product_code: d.product_code, await: qty });
        if (!insertInvError) {
          inventoryUpdated = true;
        }
      }
    }
    if (inventoryUpdated) debugMsg += 'Inventory Update Confirmed\n\n';

    // === ACO ORDER EVENT ===
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      for (const d of insertDataArr) {
        const { data: acoRow, error: acoError } = await supabase
          .from('record_aco')
          .select('uuid, remain_qty')
          .eq('order_ref', Number(acoOrderRef.trim()))
          .eq('code', d.product_code)
          .maybeSingle();
        if (!acoError && acoRow && typeof acoRow.remain_qty === 'number') {
          const newRemain = acoRow.remain_qty - Number(d.product_qty);
          const { error: updateAcoError } = await supabase
            .from('record_aco')
            .update({ remain_qty: newRemain })
            .eq('uuid', acoRow.uuid);
          if (!updateAcoError) {
            acoUpdated = true;
          }
        }
      }
    }
    if (acoUpdated) debugMsg += 'ACO Order Update Confirmed\n\n';

    debugMsg += '======  END  ======';
    setDebugMsg(debugMsg);

    // 這裡直接用 workOrderType/workOrderValue 組裝
    const isAco = workOrderType === 'ACO Order Ref';
    let workOrderLabel = isAco ? 'ACO Order' : 'Work Order Number';
    let workOrderValueFinal = workOrderValue;
    if (isAco) {
      // 查詢 plt_remark 出現次數
      const { count: acoPltCount } = await supabase
        .from('record_palletinfo')
        .select('plt_remark', { count: 'exact', head: true })
        .eq('plt_remark', `ACO Ref : ${acoOrderRef.trim()}`);
      const version = (acoPltCount ?? 0) + 1;
      function getOrdinal(n: number) {
        if (n % 10 === 1 && n % 100 !== 11) return `${n}st`;
        if (n % 10 === 2 && n % 100 !== 12) return `${n}nd`;
        if (n % 10 === 3 && n % 100 !== 13) return `${n}rd`;
        return `${n}th`;
      }
      workOrderValueFinal = `${acoOrderRef.trim()} - ${getOrdinal(version)} PLT`;
    }
    const qrValue = Array.isArray(seriesArr) ? seriesArr[0] : '';

    try {
      await generateAndUploadPdf({
        productCode,
        description: productInfo?.description || '',
        quantity: Number(quantity),
        date: dateLabel,
        operatorClockNum: operatorNum,
        qcClockNum: qcNum,
        workOrderNumber,
        palletNum,
        qrValue,
        onSuccess: (url) => {
          setDebugMsg(prev => prev + `\nPDF uploaded: ${url}`);
        },
        onError: (error) => {
          setDebugMsg(prev => prev + `\nPDF upload error: ${error.message}`);
        }
      });
    } catch (error) {
      setDebugMsg(prev => prev + `\nPDF generation/upload error: ${error instanceof Error ? error.message : String(error)}`);
    }

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
      setProductCode('');
      setQuantity('');
      setCount('');
      setOperator('');
      setAcoOrderRef('');
      setSlateDetail({
        firstOffDate: '', batchNumber: '', setterName: '', machNum: '', material: '', weight: '',
        topThickness: '', bottomThickness: '', length: '', width: '', centreHole: '', lengthMiddleHoleToBottom: '',
        colour: '', shapes: '', flameTest: '', remark: ''
      });
      setProductInfo(null);
      setAcoRemain(null);
    }
  };

  // 即時查詢 productInfo
  useEffect(() => {
    if (!productCode.trim()) {
      setProductInfo(null);
      setProductError(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('data_code')
      .select('code, description, standard_qty, type')
      .ilike('code', productCode.trim())
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setProductInfo(null);
          setProductError("Product Code Don't Exist. Please Check Again Or Update Product Code List.");
        } else {
          setProductInfo(data);
          setProductError(null);
        }
      });
    return () => { cancelled = true; };
  }, [productCode]);

  const handleAcoSearch = async () => {
    setAcoSearchLoading(true);
    setAcoRemain(null);
    setAcoNewRef(false);
    const { data, error } = await supabase
      .from('record_aco')
      .select('remain_qty')
      .eq('order_ref', Number(acoOrderRef.trim()))
      .eq('code', productCode.trim())
      .maybeSingle();
    if (error || !data) {
      setAcoRemain('New Order, Please Enter Detail');
      setAcoNewRef(true);
    } else if (typeof data.remain_qty !== 'undefined') {
      if (Number(data.remain_qty) === 0) {
        setAcoRemain('Order Been Fullfilled');
      } else {
        setAcoRemain(`Order Remain Qty : ${String(data.remain_qty)}`);
      }
    }
    setAcoSearchLoading(false);
  };

  // 驗證 ACO Order Detail Product Code
  const validateAcoOrderDetailCode = async (idx: number, code: string) => {
    if (!code.trim()) {
      setAcoOrderDetailErrors(prev => {
        const next = [...prev];
        next[idx] = '';
        return next;
      });
      return;
    }
    const { data, error } = await supabase
      .from('data_code')
      .select('code, type')
      .ilike('code', code.trim())
      .maybeSingle();
    if (error || !data) {
      setAcoOrderDetailErrors(prev => {
        const next = [...prev];
        next[idx] = 'Code Not Exist';
        return next;
      });
    } else if (data.type !== 'ACO') {
      setAcoOrderDetailErrors(prev => {
        const next = [...prev];
        next[idx] = 'Code Not For ACO';
        return next;
      });
    } else {
      // 自動修正 input 內容為正確 code
      setAcoOrderDetails(prev => {
        const next = prev.map((item, i) => i === idx ? { ...item, code: data.code } : item);
        return next;
      });
      setAcoOrderDetailErrors(prev => {
        const next = [...prev];
        next[idx] = '';
        return next;
      });
    }
  };

  // 修改 handleAcoOrderDetailChange，只有當 code 驗證通過且 qty 也有值時才自動新增下一組
  const handleAcoOrderDetailChange = (idx: number, key: 'code' | 'qty', value: string) => {
    setAcoOrderDetails(prev => {
      const next = prev.map((item, i) => i === idx ? { ...item, [key]: value } : item);
      // 僅當 code 驗證通過且 code/qty 都有值時才新增
      if (
        idx === next.length - 1 &&
        next.length < 10 &&
        next[idx].code.trim() &&
        next[idx].qty.trim() &&
        !acoOrderDetailErrors[idx]
      ) {
        return [...next, { code: '', qty: '' }];
      }
      return next;
    });
  };

  // 新增：ACO Order Detail 上傳功能
  const handleAcoOrderDetailUpdate = async () => {
    // 過濾掉沒填 code 或 qty 的行
    const validRows = acoOrderDetails.filter(row => row.code.trim() && row.qty.trim() && !acoOrderDetailErrors[acoOrderDetails.indexOf(row)]);
    if (!acoOrderRef.trim() || validRows.length === 0) {
      setDebugMsg('Please enter ACO Order Ref and at least one valid Product Code/Qty.');
      return;
    }
    const now = new Date();
    const latestUpdate = format(now, 'dd-MMM-yyyy HH:mm:ss');
    const insertArr = validRows.map(row => ({
      order_ref: Number(acoOrderRef.trim()),
      code: row.code.trim(),
      required_qty: Number(row.qty.trim()),
      remain_qty: Number(row.qty.trim()),
      latest_update: latestUpdate
    }));
    const { error } = await supabase.from('record_aco').insert(insertArr);
    if (error) {
      setDebugMsg('Insert record_aco failed: ' + error.message);
    } else {
      setDebugMsg('Insert record_aco success!');
      setAcoNewRef(false); // 隱藏區塊
      setAcoOrderDetails([{ code: '', qty: '' }]); // 清空 input
      handleAcoSearch(); // 重新查詢 ACO Order Ref
    }
  };

  useEffect(() => {
    if (productInfo?.type === 'Slate') {
      setCount('1');
    }
  }, [productInfo]);

  return (
    <div className="flex flex-row gap-8 w-full max-w-screen-lg mx-auto">
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
              onChange={e => { setProductCode(e.target.value); setDebugMsg(''); }}
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
              value={productInfo?.type === 'Slate' ? '1' : count}
              onChange={e => setCount(e.target.value)}
              placeholder="Required"
              disabled={productInfo?.type === 'Slate'}
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
        {/* Debug Message 區塊 */}
        {pdfProgress.total > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs text-gray-200">
              PDF Upload Progress: {pdfProgress.current} / {pdfProgress.total}
            </div>
            {/* 進度條 */}
            <div className="w-full bg-gray-700 rounded h-4 overflow-hidden mb-2">
              <div
                className="bg-blue-500 h-4 transition-all duration-300"
                style={{
                  width: `${(pdfProgress.current / pdfProgress.total) * 100}%`
                }}
              />
            </div>
            {/* Pallet 狀態點 */}
            <div className="flex flex-row gap-2 mt-1">
              {pdfProgress.status.map((s, i) => (
                <div
                  key={i}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${s === 'Success' ? 'bg-green-500 text-white' : s === 'Failed' ? 'bg-red-500 text-white' : 'bg-gray-400 text-gray-900'}
                  `}
                  title={`Pallet ${i + 1}: ${s}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* 右側：Instruction + ACO Order Detail */}
      <div className="flex flex-col flex-1 min-w-[320px] max-w-md gap-8">
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Instruction</h2>
          <ul className="text-gray-300 text-sm list-disc pl-5 space-y-2">
            <li>Enter all required pallet details.</li>
            <li>Click <b>Print Label</b> to generate and save the label(s).</li>
          </ul>
          {/* ACO Order Ref 輸入欄位 - 移至右側 Instruction 區塊 */}
          {productInfo?.type?.trim().toUpperCase() === 'ACO' && (
            <div className="mt-6">
              <label className="block text-sm text-gray-300 mb-1">ACO Order Ref</label>
              <input
                type="text"
                className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={acoOrderRef}
                onChange={e => setAcoOrderRef(e.target.value)}
                placeholder="Required"
              />
              <button
                type="button"
                className={`mt-3 w-full py-2 rounded-md font-semibold transition-colors ${canSearchAco ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-gray-300 cursor-not-allowed'}`}
                disabled={!canSearchAco}
                onClick={handleAcoSearch}
              >
                Search
              </button>
              {acoRemain && (
                <div className="mt-2 text-sm font-semibold text-yellow-300 bg-gray-900 rounded px-3 py-2">{acoRemain}</div>
              )}
              {isAcoOrderExcess && (
                <div className="mt-2 text-sm font-semibold text-red-400 bg-gray-900 rounded px-3 py-2">Input Quantity Excess Order Remain</div>
              )}
            </div>
          )}
        </div>
        {/* Instruction 區塊下方：Slate 專用區塊 */}
        {productInfo?.type === 'Slate' && (
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg mt-4">
            <h3 className="text-lg font-semibold text-white mb-4">Please Choose First-Off Date</h3>
            <div className="flex flex-row gap-4 items-center mb-4">
              <input
                type="text"
                className="w-56 rounded-md bg-transparent border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please Enter First-Off Date"
                value={slateDetail.firstOffDate}
                onChange={e => setSlateDetail({ ...slateDetail, firstOffDate: e.target.value })}
                list="firstoffdate-list"
              />
              <datalist id="firstoffdate-list">
                {/* 可根據實際需求動態生成選項 */}
              </datalist>
              <input
                type="date"
                className="w-44 rounded-md bg-transparent border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={slateDetail.firstOffDate}
                onChange={e => setSlateDetail({ ...slateDetail, firstOffDate: e.target.value })}
              />
            </div>
            {slateDetail.firstOffDate && (
              <div className="flex flex-col gap-2 mt-2">
                {[
                  { key: 'batchNumber', label: 'Batch Number' },
                  { key: 'setterName', label: 'Setter Name' },
                  { key: 'material', label: 'Material' },
                  { key: 'weight', label: 'Weight' },
                  { key: 'topThickness', label: 'Top Thickness' },
                  { key: 'bottomThickness', label: 'Bottom Thickness' },
                  { key: 'length', label: 'Length' },
                  { key: 'width', label: 'Width' },
                  { key: 'lengthMiddleHoleToBottom', label: 'Length (Middle Hole To Bottom)' },
                  { key: 'colour', label: 'Colour' },
                  { key: 'shapes', label: 'Shapes' },
                  { key: 'flameTest', label: 'Flame Test' },
                  { key: 'remark', label: 'Remark' },
                ].map(field => (
                  <input
                    key={field.key}
                    type="text"
                    className="w-full rounded-md bg-transparent border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    placeholder={field.label}
                    value={slateDetail[field.key as keyof typeof slateDetail]}
                    onChange={e => setSlateDetail({ ...slateDetail, [field.key]: e.target.value })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {acoNewRef && (
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-[480px] mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Please Enter ACO Order Detail</h3>
            <div className="flex flex-col gap-4">
              {acoOrderDetails.map((row, idx) => (
                <div className="flex flex-col gap-1" key={idx}>
                  <div className="flex flex-row gap-4 items-center">
                    <input
                      type="text"
                      className="w-40 rounded-md bg-transparent border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Product Code"
                      value={row.code}
                      onChange={e => handleAcoOrderDetailChange(idx, 'code', e.target.value)}
                      onBlur={e => validateAcoOrderDetailCode(idx, e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-44 rounded-md bg-transparent border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Order Required Qty"
                      value={row.qty}
                      onChange={e => handleAcoOrderDetailChange(idx, 'qty', e.target.value)}
                      disabled={!!acoOrderDetailErrors[idx]}
                    />
                  </div>
                  {acoOrderDetailErrors[idx] && (
                    <div className="text-red-500 text-xs font-semibold mt-1 ml-1">{acoOrderDetailErrors[idx]}</div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 w-full"
                onClick={handleAcoOrderDetailUpdate}
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 