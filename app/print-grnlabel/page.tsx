"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { PrintLabelPdf } from '../../components/print-label-pdf';
import dynamic from 'next/dynamic';
// For PDF generation and upload
import { pdf } from '@react-pdf/renderer';

const ManualPdfDownloadButton = dynamic(
  () => import('../../components/print-label-pdf/ManualPdfDownloadButton'),
  { ssr: false }
);

// Define ProgressStatus type similar to QcLabelForm
type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

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
  const grossWeightRef = useRef<HTMLInputElement>(null);
  const [supplierInfo, setSupplierInfo] = useState<string | null>(null);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<null | {
    productCode: string;
    description: string;
    quantity: string | number;
    date: string;
    operatorClockNum: string;
    qcClockNum: string;
    series: string;
    palletNum: string;
  }>(null);
  // 1. 新增 grossWeights 狀態
  const [grossWeights, setGrossWeights] = useState<string[]>(['']);
  const [userId, setUserId] = useState<string>('');
  // Update pdfProgress state to match QcLabelForm structure
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; status: ProgressStatus[] }>({ current: 0, total: 0, status: [] });
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false); // This might be refactored or used alongside new progress

  // 2. 動態計算 pallet 數量（以 Pallet Type 欄位總和為主，最大 22）
  const palletCount = Math.min(22, Object.values(palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0) || 1);

  // 3. 當 palletCount 變動時，自動調整 grossWeights 長度
  React.useEffect(() => {
    setGrossWeights(prev => {
      if (palletCount > prev.length) {
        return [...prev, ...Array(palletCount - prev.length).fill('')];
      } else if (palletCount < prev.length) {
        return prev.slice(0, palletCount);
      }
      return prev;
    });
  }, [palletCount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUserId(userData.id || '');
        } catch (e) {
          console.error("Failed to parse user data from localStorage", e);
          setUserId('');
        }
      }
    }
  }, []);

  // 4. 處理 input 變動
  const handleGrossWeightChange = (idx: number, value: string) => {
    setGrossWeights(prev => {
      const next = prev.map((v, i) => (i === idx ? value : v));
      // 若是最後一個且有值且未超過22個，則自動新增一個
      if (idx === prev.length - 1 && value.trim() !== '' && prev.length < 22) {
        return [...next, ''];
      }
      return next;
    });
  };

  // 5. Pallet 標籤生成
  const getPalletLabel = (idx: number) => {
    const n = idx + 1;
    if (n === 1) return '1st Pallet';
    if (n === 2) return '2nd Pallet';
    if (n === 3) return '3rd Pallet';
    if (n === 21) return '21st Pallet';
    if (n === 22) return '22nd Pallet';
    return `${n}th Pallet`;
  };

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
  const isFormFilledWithoutGrossWeight = ['grnNumber', 'materialSupplier', 'productCode'].every(key => form[key as keyof typeof form].trim() !== '');
  const isPalletTypeFilled = Object.values(palletType).some(v => v.trim() !== '');
  const isPackageTypeFilled = Object.values(packageType).some(v => v.trim() !== '');
  const isAnyGrossWeightFilled = grossWeights.some(v => v.trim() !== '');
  const canPrint = isFormFilledWithoutGrossWeight && isPalletTypeFilled && isPackageTypeFilled && isAnyGrossWeightFilled && !!productInfo && !!supplierInfo;

  // Pallet/Package Type 對應重量
  const PALLET_WEIGHT: Record<string, number> = {
    whiteDry: 14,
    whiteWet: 18,
    chepDry: 26,
    chepWet: 38,
    euro: 22,
    notIncluded: 1,
  };
  const PACKAGE_WEIGHT: Record<string, number> = {
    still: 50,
    bag: 1,
    tote: 6,
    octo: 14,
    notIncluded: 1,
  };

  // Material Supplier 查詢（debounced）
  const debouncedSupplierQuery = useCallback(
    debounce(async (valueUpper: string) => {
      if (!valueUpper.trim()) {
        setSupplierInfo(null);
        setSupplierError(null);
        return;
      }
      const { data, error } = await supabase
        .from('data_supplier')
        .select('supplier_code, supplier_name')
        .eq('supplier_code', valueUpper);
      if (error) {
        setSupplierInfo(null);
        setSupplierError('Supplier Code Not Found');
        return;
      }
      if (data && data.length > 0) {
        setSupplierError(null);
        setSupplierInfo(data[0].supplier_name);
        setForm(f => ({ ...f, materialSupplier: data[0].supplier_code }));
      } else {
        setSupplierInfo(null);
        setSupplierError('Supplier Code Not Found');
      }
    }, 300),
    []
  );

  const handleSupplierChange = (value: string) => {
    const valueUpper = value.toUpperCase();
    setForm(f => ({ ...f, materialSupplier: valueUpper }));
    debouncedSupplierQuery(valueUpper);
  };

  // Product Code 查詢（debounced）
  const debouncedProductQuery = useCallback(
    debounce(async (value: string) => {
      if (!value || !value.trim()) {
        setProductInfo(null);
        setProductError(null);
        return;
      }
      const { data, error } = await supabase
        .from('data_code')
        .select('code, description')
        .ilike('code', `%${value.trim()}%`);
      if (error) {
        setProductInfo(null);
        setProductError('Product Code Not Found');
        return;
      }
      if (data && data.length > 0) {
        setProductError(null);
        setProductInfo(data[0].description);
        setForm(f => ({ ...f, productCode: data[0].code }));
      } else {
        setProductInfo(null);
        setProductError('Product Code Not Found');
      }
    }, 300),
    []
  );

  const handleProductCodeChange = (value: string) => {
    setForm(f => ({ ...f, productCode: value }));
    debouncedProductQuery(value);
  };

  // 新增 onBlur 查詢 function
  const handleSupplierBlur = async (value: string) => {
    if (!value.trim()) {
      setSupplierInfo(null);
      setSupplierError(null);
      return;
    }
    const { data, error } = await supabase
      .from('data_supplier')
      .select('supplier_code, supplier_name')
      .eq('supplier_code', value.trim().toUpperCase());
    if (error || !data || data.length === 0) {
      setSupplierInfo(null);
      setSupplierError('Supplier Code Not Found');
    } else {
      setSupplierError(null);
      setSupplierInfo(data[0].supplier_name);
      setForm(f => ({ ...f, materialSupplier: data[0].supplier_code }));
    }
  };
  const handleProductCodeBlur = async (value: string) => {
    if (!value.trim()) {
      setProductInfo(null);
      setProductError(null);
      return;
    }
    const { data, error } = await supabase
      .from('data_code')
      .select('code, description')
      .ilike('code', value.trim());
    if (error || !data || data.length === 0) {
      setProductInfo(null);
      setProductError('Product Code Not Found');
    } else {
      setProductError(null);
      setProductInfo(data[0].description);
      setForm(f => ({ ...f, productCode: data[0].code }));
    }
  };

  const PALLET_TYPE_DB_VAL: Record<string, string> = {
    whiteDry: 'White_Dry',
    whiteWet: 'White_Wet',
    chepDry: 'Chep_Dry',
    chepWet: 'Chep_Wet',
    euro: 'Euro',
    notIncluded: 'Not_Included_Pallet',
  };
  const PACKAGE_TYPE_DB_VAL: Record<string, string> = {
    still: 'Still',
    bag: 'Bag',
    tote: 'Tote',
    octo: 'Octo',
    notIncluded: 'Not_Included_Package',
  };

  // Helper function for PDF generation and upload
  async function generateAndUploadGrnPdf(pdfDocData: any, fileName: string, supabaseClient: any) {
    const blob = await pdf(<PrintLabelPdf {...pdfDocData} />).toBlob();
    if (!(blob instanceof Blob)) {
      throw new Error('PDF generation did not return a Blob.');
    }
    const filePath = `grn_labels/${fileName}`;
    const { data, error } = await supabaseClient.storage
      .from('pallet-label-pdf')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });
    if (error) throw new Error(error.message || 'Failed to upload PDF to Supabase.');
    if (!data || !data.path) throw new Error(`Upload for ${filePath} succeeded but no path was returned.`);
    const { data: publicUrlData } = supabaseClient.storage.from('pallet-label-pdf').getPublicUrl(data.path);
    if (!publicUrlData || !publicUrlData.publicUrl) throw new Error(`Failed to get public URL for ${data.path}.`);
    return publicUrlData.publicUrl;
  }

  const handlePrintLabel = async () => {
    // Initialize/reset progress state correctly
    const validGrossWeights = grossWeights.filter(gw => gw && gw.trim() !== '');
    const totalPdfsToProcess = validGrossWeights.length;
    if (totalPdfsToProcess === 0) return; // Nothing to process

    setPdfProgress({ current: 0, total: totalPdfsToProcess, status: Array(totalPdfsToProcess).fill('Pending') });
    setPdfUploadSuccess(false);

    const todayForSeries = new Date();

    async function generateUniqueSeries() {
      const datePart = format(todayForSeries, 'yyMMddHH');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      while (true) {
        const randomPart = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const series = `${datePart}-${randomPart}`;
        const { data: exist } = await supabase.from('record_palletinfo').select('series').eq('series', series).limit(1);
        if (!exist || exist.length === 0) return series;
      }
    }

    const today = new Date();
    const dateStr = format(today, 'ddMMyy');
    const { data: todayPlts } = await supabase.from('record_palletinfo').select('plt_num').like('plt_num', `${dateStr}/%`);
    let maxNum = 0;
    if (todayPlts && todayPlts.length > 0) {
      todayPlts.forEach(row => {
        const parts = row.plt_num.split('/');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) maxNum = Math.max(maxNum, parseInt(parts[1]));
      });
    }
    let nextPalletNum = maxNum + 1;
    const generateTime = format(today, 'dd-MMM-yyyy HH:mm:ss');
    const grnRefForRemark = form.grnNumber.trim();

    let processedDbOperations = 0;

    for (let i = 0; i < totalPdfsToProcess; i++) {
      const gw = validGrossWeights[i]; // Use item from filtered list
      // Update status to Processing for the current item
      setPdfProgress(prev => ({
        ...prev,
        status: prev.status.map((s, idx) => idx === i ? 'Processing' : s)
      }));

      const grossWeight = Number(gw);
      const netWeight = grossWeight - ( (PALLET_WEIGHT[Object.keys(palletType).find(k => palletType[k as keyof typeof palletType].trim() !== '') as keyof typeof PALLET_WEIGHT || 'notIncluded'] || 0) + (PACKAGE_WEIGHT[Object.keys(packageType).find(k => packageType[k as keyof typeof packageType].trim() !== '') as keyof typeof PACKAGE_WEIGHT || 'notIncluded'] || 0) );
      const palletNum = `${dateStr}/${nextPalletNum + i}`; // Ensure palletNum is unique for this batch
      const series = await generateUniqueSeries();
      const currentUserId = userId ? parseInt(userId, 10) : null;

      try {
        // DB Operations
        const palletInfoData = { plt_num: palletNum, generate_time: generateTime, product_code: form.productCode.trim(), product_qty: netWeight, series, plt_remark: `Material GRN - ${grnRefForRemark}` };
        const { error: palletInfoError } = await supabase.from('record_palletinfo').insert([palletInfoData]);
        if (palletInfoError) throw new Error(`PalletInfo Insert: ${palletInfoError.message}`);

        const grnRecordData = { grn_ref: parseInt(form.grnNumber.trim(), 10), sup_code: form.materialSupplier.trim(), material_code: form.productCode.trim(), gross_weight: grossWeight, net_weight: netWeight, plt_num: palletNum, pallet: PALLET_TYPE_DB_VAL[Object.keys(palletType).find(k => palletType[k as keyof typeof palletType].trim() !== '') || 'notIncluded'], package: PACKAGE_TYPE_DB_VAL[Object.keys(packageType).find(k => packageType[k as keyof typeof packageType].trim() !== '') || 'notIncluded'] };
        const { error: grnInsertError } = await supabase.from('record_grn').insert([grnRecordData]);
        if (grnInsertError) throw new Error(`GRN Record Insert: ${grnInsertError.message}`);
        
        const { data: inv, error: invError } = await supabase.from('record_inventory').select('await, uuid').eq('product_code', form.productCode.trim()).maybeSingle();
        if (invError) throw new Error(`Inventory Query: ${invError.message}`);
        if (inv) {
          const newAwait = (Number(inv.await) || 0) + netWeight;
          const { error: updateError } = await supabase.from('record_inventory').update({ await: newAwait, latest_update: new Date().toISOString() }).eq('uuid', inv.uuid);
          if (updateError) throw new Error(`Inventory Update: ${updateError.message}`);
        } else {
          const { error: insertInvError } = await supabase.from('record_inventory').insert({ product_code: form.productCode.trim(), await: netWeight, latest_update: new Date().toISOString() });
          if (insertInvError) throw new Error(`Inventory Insert: ${insertInvError.message}`);
        }

        const historyData = { action: 'Material Receive', time: format(new Date(), 'dd-MMM-yyyy HH:mm:ss'), id: currentUserId, plt_num: palletNum, loc: 'Fold Mill', remark: `GRN ${grnRefForRemark} - ${form.materialSupplier.trim()}` };
        const { error: historyError } = await supabase.from('record_history').insert([historyData]);
        if (historyError) throw new Error(`History Insert: ${historyError.message}`);
        
        processedDbOperations++; // Only increment if all DB ops for this pallet succeed

        // PDF Generation and Upload
        const pdfDocData = { productCode: form.productCode.trim(), description: productInfo || '', quantity: netWeight.toString(), date: format(today, 'dd-MMM-yyyy'), operatorClockNum: '-', qcClockNum: currentUserId ? String(currentUserId) : '-', series, palletNum, workOrderName: 'GRN Receive Ref', workOrderNumber: `${form.grnNumber.trim()} (${form.materialSupplier.trim().toUpperCase()})`, labelType: 'GRN' };
        const uploadFileName = `GRN_${palletNum.replace(/\//g, '-')}.pdf`;
        await generateAndUploadGrnPdf(pdfDocData, uploadFileName, supabase);

        setPdfProgress(prev => ({
          current: prev.current + 1,
          total: prev.total,
          status: prev.status.map((s, idx) => idx === i ? 'Success' : s)
        }));
      } catch (error: any) {
        console.error(`Error processing pallet ${i + 1} (Num: ${palletNum}):`, error.message);
        setPdfProgress(prev => ({
          ...prev, // Keep current count as is, or increment if preferred for failed attempts
          status: prev.status.map((s, idx) => idx === i ? 'Failed' : s)
        }));
        // Optionally, log this error to Supabase 'report_log' table
      }
    }
    nextPalletNum += totalPdfsToProcess; // Adjust for next batch after loop

    const allSuccessful = processedDbOperations === totalPdfsToProcess && pdfProgress.status.every(s => s === 'Success');

    if (allSuccessful) {
      setPdfUploadSuccess(true); // Maybe rename this or integrate into pdfProgress.status check
      console.log(`Successfully processed and uploaded ${totalPdfsToProcess} PDF(s).`);
      setTimeout(() => {
        setPdfProgress({ current: 0, total: 0, status: [] });
        setPdfUploadSuccess(false);
        setForm(prevForm => ({ ...prevForm, productCode: '' }));
        setProductInfo(null);
        setProductError(null);
        setPalletType({ whiteDry: '', whiteWet: '', chepDry: '', chepWet: '', euro: '', notIncluded: '' });
        setPackageType({ still: '', bag: '', tote: '', octo: '', notIncluded: '' });
        setGrossWeights(['']);
      }, 3000);
    } else {
      console.error(`Not all operations were successful. DB ops: ${processedDbOperations}/${totalPdfsToProcess}. Check status lights.`);
      // Keep progress bar as is to show failures. Reset after a longer timeout or manually.
      setTimeout(() => {
        // Optionally reset only if there were no successes, or based on other criteria
        // setPdfProgress({ current: 0, total: 0, status: [] }); 
      }, 7000);
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Chrome, Safari, Edge, Opera */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gray-900">
        <div className="flex flex-col gap-8 w-full max-w-2xl mt-4">
          {/* GRN Detail 區塊 */}
          <div className="bg-gray-800 rounded-lg p-8 w-full shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-6">GRN Detail</h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-center">
                <label className="text-sm text-gray-300 mr-4 min-w-[120px]">GRN Number</label>
                <input type="text" className="flex-1 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.grnNumber} onChange={e => handleFormChange('grnNumber', e.target.value)} />
              </div>
              <div className="flex items-center">
                <label className="text-sm text-gray-300 mr-4 min-w-[120px]">Material Supplier</label>
                <input type="text" className="flex-1 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.materialSupplier} onChange={e => setForm(f => ({ ...f, materialSupplier: e.target.value }))} onBlur={e => handleSupplierBlur(e.target.value)} />
                {supplierInfo && !supplierError && (
                  <div className="text-white text-sm font-semibold ml-4">{supplierInfo}</div>
                )}
                {supplierError && (
                  <div className="text-red-500 text-sm font-semibold ml-4">{supplierError}</div>
                )}
              </div>
              <div className="flex items-center">
                <label className="text-sm text-gray-300 mr-4 min-w-[120px]">Product Code</label>
                <input type="text" className="flex-1 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Please Enter..." value={form.productCode} onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))} onBlur={e => handleProductCodeBlur(e.target.value)} />
                {productInfo && !productError && (
                  <div className="text-white text-sm font-semibold ml-4">{productInfo}</div>
                )}
                {productError && (
                  <div className="text-red-500 text-sm font-semibold ml-4">{productError}</div>
                )}
              </div>
            </div>
          </div>
          {/* Pallet Type + Package Type 區塊（左右排列） */}
          <div className="flex flex-row gap-8">
            {/* Pallet Type 區塊 */}
            <div className="bg-gray-800 rounded-lg p-8 w-fit shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Pallet Type</h3>
              <div className="flex flex-col gap-4">
                {([
                  { key: 'whiteDry' as keyof typeof palletType, label: 'White - Dry' },
                  { key: 'whiteWet' as keyof typeof palletType, label: 'White - Wet' },
                  { key: 'chepDry' as keyof typeof palletType, label: 'Chep - Dry' },
                  { key: 'chepWet' as keyof typeof palletType, label: 'Chep - Wet' },
                  { key: 'euro' as keyof typeof palletType, label: 'Euro' },
                  { key: 'notIncluded' as keyof typeof palletType, label: '(Not Included)' }
                ] as const).map(item => (
                  <div className="flex items-center" key={item.key}>
                    <label className="text-sm text-gray-300 mr-4 min-w-[120px]">{item.label}</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      className="w-16 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2"
                      value={palletType[item.key]}
                      onChange={e => handlePalletTypeChange(item.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Package Type 區塊 */}
            <div className="bg-gray-800 rounded-lg p-8 w-fit shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Package Type</h3>
              <div className="flex flex-col gap-4">
                {([
                  { key: 'still' as keyof typeof packageType, label: 'Still' },
                  { key: 'bag' as keyof typeof packageType, label: 'Bag' },
                  { key: 'tote' as keyof typeof packageType, label: 'Tote' },
                  { key: 'octo' as keyof typeof packageType, label: 'Octo' },
                  { key: 'notIncluded' as keyof typeof packageType, label: '(Not Included)' }
                ] as const).map(item => (
                  <div className="flex items-center" key={item.key}>
                    <label className="text-sm text-gray-300 mr-4 min-w-[120px]">{item.label}</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      className="w-16 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2"
                      value={packageType[item.key]}
                      onChange={e => handlePackageTypeChange(item.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Print GRN Label 區塊（動態 Gross Weight/Qty） */}
          <div className="bg-gray-800 rounded-lg p-8 w-full shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-6">Print GRN Label</h2>
            <div className="flex flex-col gap-4 mb-8">
              {grossWeights.map((val, idx) => (
                <div className="flex items-center" key={idx}>
                  <label className="text-sm text-gray-300 mr-4 min-w-[180px]">
                    <span className="text-white">Gross Weight / Qty</span>
                    <span className="text-red-500 ml-1">[{getPalletLabel(idx)}]</span>
                  </label>
                  <input
                    type="text"
                    className="flex-1 rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please Enter..."
                    value={val}
                    onChange={e => handleGrossWeightChange(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button type="button" className={`w-full py-2 rounded-md text-white font-semibold transition-colors ${canPrint ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`} disabled={!canPrint} onClick={handlePrintLabel}>
              Print Label
            </button>
            
            {/* New Progress Bar UI (similar to QcLabelForm) */}
            {pdfProgress.total > 0 && (
            <div className="mt-4">
                <div className="mb-2 text-xs text-gray-200">
                PDF Generation Progress: {pdfProgress.current} / {pdfProgress.total}
                </div>
                <div className="w-full bg-gray-700 rounded h-4 overflow-hidden mb-2">
                <div
                    className="bg-blue-500 h-4 transition-all duration-300"
                    style={{
                    width: `${pdfProgress.total > 0 ? (pdfProgress.current / pdfProgress.total) * 100 : 0}%`,
                    }}
                />
                </div>
                <div className="flex flex-row gap-1 mt-1 flex-wrap">
                {pdfProgress.status.map((s, i) => (
                    <div
                    key={i}
                    className={`
                        w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
                        ${s === 'Success' ? 'bg-green-500 text-white' : s === 'Failed' ? 'bg-red-500 text-white' : s === 'Processing' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-400 text-gray-900'}
                    `}
                    title={`Pallet ${i + 1}: ${s}`}
                    >
                    {/* Optionally show numbers or icons based on status */}
                    {s === 'Success' ? '✓' : s === 'Failed' ? '✗' : ''} {/* Show pallet num only if pending, or nothing*/}
                    </div>
                ))}
                </div>
            </div>
            )}
            {/* End New Progress Bar UI */}
          </div>
        </div>
      </div>
    </>
  );
} 