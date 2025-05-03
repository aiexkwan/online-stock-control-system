"use client";
import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { PrintLabelPdf } from '../../components/print-label-pdf';
import dynamic from 'next/dynamic';

const DownloadPdfButton = dynamic(
  () => import('../../components/print-label-pdf/DownloadPdfButton'),
  { ssr: false }
);

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
  const [debugMsg, setDebugMsg] = useState('');
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

  // 上傳處理
  const handlePrintLabel = async () => {
    // 取得 Pallet Type 有值的 key/value
    const palletKey = Object.keys(palletType).find(k => palletType[k as keyof typeof palletType].trim() !== '');
    const palletVal = palletKey ? Number(palletType[palletKey as keyof typeof palletType]) : 0;
    // 取得 Package Type 有值的 key/value
    const packageKey = Object.keys(packageType).find(k => packageType[k as keyof typeof packageType].trim() !== '');
    const packageVal = packageKey ? Number(packageType[packageKey as keyof typeof packageType]) : 0;
    // Gross Weight
    const grossWeight = Number(form.grossWeight);
    // 計算 net weight
    const palletWeight = palletKey ? (PALLET_WEIGHT[palletKey] * palletVal) : 0;
    const packageWeight = packageKey ? (PACKAGE_WEIGHT[packageKey] * packageVal) : 0;
    const netWeight = grossWeight - palletWeight - packageWeight;

    // === 生成 pallet number ===
    const today = new Date();
    const dateStr = format(today, 'ddMMyy');
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

    // === 生成唯一 series ===
    async function generateUniqueSeries() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      while (true) {
        const series = Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const { data: exist } = await supabase
          .from('record_palletinfo')
          .select('series')
          .eq('series', series)
          .limit(1);
        if (!exist || exist.length === 0) return series;
      }
    }
    const series = await generateUniqueSeries();

    // === 先插入 palletInfo（record_palletinfo） ===
    const palletInfoData: any = {
      plt_num: palletNum,
      generate_time: generateTime,
      product_code: form.productCode,
      product_qty: netWeight,
      series,
      plt_remark: 'Material GRN',
    };
    // 插入 palletInfo
    const { error: palletInfoError } = await supabase.from('record_palletinfo').insert([palletInfoData]);
    if (palletInfoError) {
      setDebugMsg(`Pallet Num: ${palletNum}\nInsert palletInfo failed: ${palletInfoError.message}`);
      setPdfData(null);
      return;
    }

    // === 組合 record_grn insert 資料 ===
    const insertData: any = {
      grn_ref: form.grnNumber,
      sup_code: form.materialSupplier,
      material_code: form.productCode,
      gross_weight: grossWeight,
      net_weight: netWeight,
      plt_num: palletNum,
    };
    // Pallet Type 對應欄位
    if (palletKey && palletVal) {
      if (palletKey === 'whiteDry') insertData.white_dry = palletVal;
      if (palletKey === 'whiteWet') insertData.white_wet = palletVal;
      if (palletKey === 'chepDry') insertData.chep_dry = palletVal;
      if (palletKey === 'chepWet') insertData.chep_wet = palletVal;
      if (palletKey === 'euro') insertData.euro = palletVal;
      if (palletKey === 'notIncluded') insertData.no_plt = palletVal;
    }
    // Package Type 對應欄位
    if (packageKey && packageVal) {
      if (packageKey === 'still') insertData.still = packageVal;
      if (packageKey === 'bag') insertData.bag = packageVal;
      if (packageKey === 'tote') insertData.tote = packageVal;
      if (packageKey === 'octo') insertData.octo = packageVal;
      if (packageKey === 'notIncluded') insertData.no_pack = packageVal;
    }

    // 上傳到 supabase.record_grn
    const { error } = await supabase.from('record_grn').insert([insertData]);
    if (error) {
      setDebugMsg(`Pallet Num: ${palletNum}\nInsert record_grn failed: ${error.message}`);
      setPdfData(null);
    } else {
      setDebugMsg(`Pallet Num: ${palletNum}\nInsert success!`);
      // === 新增/更新 record_inventory ===
      const { data: inv, error: invError } = await supabase
        .from('record_inventory')
        .select('await')
        .eq('product_code', form.productCode)
        .maybeSingle();
      if (invError) {
        setDebugMsg(prev => prev + `\nInventory Query Error: ${invError.message}`);
      } else if (inv) {
        // 有舊記錄，更新 await
        const newAwait = (Number(inv.await) || 0) + netWeight;
        const { error: updateError } = await supabase
          .from('record_inventory')
          .update({ await: newAwait })
          .eq('product_code', form.productCode);
        if (updateError) {
          setDebugMsg(prev => prev + `\nInventory Update Error: ${updateError.message}`);
        } else {
          setDebugMsg(prev => prev + `\nInventory Updated: await = ${newAwait}`);
        }
      } else {
        // 無舊記錄，新增
        const { error: insertInvError } = await supabase
          .from('record_inventory')
          .insert({ product_code: form.productCode, await: netWeight });
        if (insertInvError) {
          setDebugMsg(prev => prev + `\nInventory Insert Error: ${insertInvError.message}`);
        } else {
          setDebugMsg(prev => prev + `\nInventory Inserted: await = ${netWeight}`);
        }
      }
      // === 新增 record_history ===
      const now = new Date();
      const historyData: {
        action: string;
        time: string;
        id: number | null;
        plt_num: string;
        loc: string;
        remark: string;
      } = {
        action: 'Material Receive',
        time: format(now, 'dd-MMM-yyyy HH:mm:ss'),
        id: null,
        plt_num: palletNum,
        loc: 'Fold Mill',
        remark: `GRN ${form.grnNumber} - ${form.materialSupplier}`,
      };
      // 嘗試取得 user id
      let userId: number | null = null;
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userId = typeof userData.id === 'number' ? userData.id : Number(userData.id) || null;
          } catch {}
        }
      }
      historyData.id = userId;
      const { error: historyError } = await supabase.from('record_history').insert([historyData]);
      if (historyError) {
        setDebugMsg(prev => prev + `\nHistory Insert Error: ${historyError.message}`);
      } else {
        setDebugMsg(prev => prev + `\nHistory Inserted!`);
      }
      // 只清空 Gross Weight/Qty，其他 input 保留
      setForm(f => ({ ...f, grossWeight: '' }));
      // 自動 focus Gross Weight/Qty
      setTimeout(() => {
        grossWeightRef.current?.focus();
      }, 0);
      setPalletType(palletType); // 保持原值
      setPackageType(packageType); // 保持原值
      // === 產生 PDF label 資料 ===
      setPdfData({
        productCode: form.productCode,
        description: productInfo || '',
        quantity: netWeight,
        date: generateTime,
        operatorClockNum: '', // 若有 operator clock number 請補上
        qcClockNum: '', // 若有 QC clock number 請補上
        series,
        palletNum,
      });
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
                <input
                  type="text"
                  className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please Enter..."
                  value={form.materialSupplier}
                  onChange={e => setForm(f => ({ ...f, materialSupplier: e.target.value }))}
                  onBlur={e => handleSupplierBlur(e.target.value)}
                />
                {supplierInfo && !supplierError && (
                  <div className="text-white text-sm font-semibold mt-1">{supplierInfo}</div>
                )}
                {supplierError && (
                  <div className="text-red-500 text-sm font-semibold mt-1">{supplierError}</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Product Code</label>
                <input
                  type="text"
                  className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please Enter..."
                  value={form.productCode}
                  onChange={e => setForm(f => ({ ...f, productCode: e.target.value }))}
                  onBlur={e => handleProductCodeBlur(e.target.value)}
                />
                {productInfo && !productError && (
                  <div className="text-white text-sm font-semibold mt-1">{productInfo}</div>
                )}
                {productError && (
                  <div className="text-red-500 text-sm font-semibold mt-1">{productError}</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Gross Weight/Qty</label>
                <input
                  type="text"
                  className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please Enter..."
                  value={form.grossWeight}
                  onChange={e => handleFormChange('grossWeight', e.target.value)}
                  ref={grossWeightRef}
                />
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
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteDry} onChange={e => handlePalletTypeChange('whiteDry', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">White - Wet</label>
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.whiteWet} onChange={e => handlePalletTypeChange('whiteWet', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Chep - Dry</label>
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepDry} onChange={e => handlePalletTypeChange('chepDry', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Chep - Wet</label>
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.chepWet} onChange={e => handlePalletTypeChange('chepWet', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Euro</label>
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.euro} onChange={e => handlePalletTypeChange('euro', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                  <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={palletType.notIncluded} onChange={e => handlePalletTypeChange('notIncluded', e.target.value)} />
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
                    <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.still} onChange={e => handlePackageTypeChange('still', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Bag</label>
                    <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.bag} onChange={e => handlePackageTypeChange('bag', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Tote</label>
                    <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.tote} onChange={e => handlePackageTypeChange('tote', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Octo</label>
                    <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.octo} onChange={e => handlePackageTypeChange('octo', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">(Not Included)</label>
                    <input type="number" min="0" inputMode="numeric" className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2" placeholder="Please Enter..." value={packageType.notIncluded} onChange={e => handlePackageTypeChange('notIncluded', e.target.value)} />
                  </div>
                </div>
              </div>
              <button type="button" className={`mt-8 w-full py-2 rounded-md text-white font-semibold transition-colors ${canPrint ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}`} disabled={!canPrint} onClick={handlePrintLabel}>
                Print Label
              </button>
              {debugMsg && (
                <div className="mt-4 text-sm text-yellow-300 whitespace-pre-wrap bg-gray-900 rounded p-3">{debugMsg}</div>
              )}
              {pdfData && (
                <div className="mt-2">
                  <DownloadPdfButton {...pdfData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 