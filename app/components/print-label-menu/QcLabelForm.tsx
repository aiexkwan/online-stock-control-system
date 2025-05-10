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
    material: '',
    weight: '',
    topThickness: '',
    bottomThickness: '',
    length: '',
    width: '',
    centreHole: '',
    // lengthMiddleHoleToBottom: \'\', // REMOVE THIS LINE
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

  // PDF 批次進度狀態 (加入更詳細的狀態)
  type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; status: ProgressStatus[] }>({ current: 0, total: 0, status: [] });

  // 新增：用於 Slate First-Off Date 下拉選單的狀態
  const [availableFirstOffDates, setAvailableFirstOffDates] = useState<string[]>([]);
  // 新增：用於 ACO Order Ref 下拉選單的狀態
  const [availableAcoOrderRefs, setAvailableAcoOrderRefs] = useState<number[]>([]);

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

  // 新增：當 productType 為 Slate 時，獲取歷史 First-Off Dates
  useEffect(() => {
    if (productInfo?.type === 'Slate') {
      const fetchFirstOffDates = async () => {
        const { data, error } = await supabase
          .from('record_slate')
          .select('first_off');

        if (error) {
          console.error('[QcLabelForm] Error fetching first-off dates:', error);
          setAvailableFirstOffDates([]);
        } else if (data) {
          const dates = data.map(item => item.first_off).filter(date => date) as string[];
          const uniqueSortedDates = Array.from(new Set(dates)).sort();
          setAvailableFirstOffDates(uniqueSortedDates);
        }
      };
      fetchFirstOffDates();
    } else {
      setAvailableFirstOffDates([]); // 如果不是 Slate，清空列表
    }
  }, [productInfo?.type]);

  // 新增：當 productType 為 ACO 時，獲取歷史 ACO Order Refs
  useEffect(() => {
    if (productInfo?.type === 'ACO') {
      const fetchAcoOrderRefs = async () => {
        // Select order_ref and remain_qty
        const { data, error } = await supabase
          .from('record_aco')
          .select('order_ref, remain_qty'); 

        if (error) {
          console.error('[QcLabelForm] Error fetching ACO order refs:', error);
          setAvailableAcoOrderRefs([]);
        } else if (data) {
          // Group by order_ref and sum remain_qty
          const groupedByOrderRef = data.reduce<Record<string, { totalRemainQty: number }>>((acc, record) => {
            const orderRefStr = String(record.order_ref); // Ensure order_ref is a string for keying
            if (record.order_ref !== null && record.order_ref !== undefined) {
              acc[orderRefStr] = acc[orderRefStr] || { totalRemainQty: 0 };
              acc[orderRefStr].totalRemainQty += (record.remain_qty || 0);
            }
            return acc;
          }, {});

          // Filter out completed orders (totalRemainQty <= 0) and get unique, sorted refs
          const activeOrderRefs = Object.entries(groupedByOrderRef)
            .filter(([, value]) => value.totalRemainQty > 0)
            .map(([key]) => parseInt(key, 10)) // Convert string key back to number
            .filter(ref => !isNaN(ref)); // Ensure only valid numbers are included
          
          const uniqueSortedActiveRefs = Array.from(new Set(activeOrderRefs)).sort((a, b) => a - b);
          
          console.log('[QcLabelForm] Filtered Active ACO Order Refs:', uniqueSortedActiveRefs);
          setAvailableAcoOrderRefs(uniqueSortedActiveRefs);
        }
      };
      fetchAcoOrderRefs();
    } else {
      setAvailableAcoOrderRefs([]); // Clear if not ACO type
    }
  }, [productInfo?.type]);

  // 驗證條件
  // const isAcoValid = productInfo?.type === 'ACO' ? acoOrderRef.trim() !== '' : true; // Will be replaced

  // --- Debugging isSlateValid --- Start
  let slateFieldsToCheck: Record<string, string> = {};
  if (productInfo?.type === 'Slate') {
    slateFieldsToCheck = Object.fromEntries(
      Object.entries(slateDetail).filter(([k]) => !['remark', 'material', 'colour', 'shapes', 'machNum'].includes(k))
    );
    console.log('[Slate Validation Details] Fields being checked:', slateFieldsToCheck);
    Object.entries(slateFieldsToCheck).forEach(([key, value]) => {
      console.log(`[Slate Validation Details] Field: ${key}, Value: "${value}", Trimmed Value: "${value.trim()}", IsEmptyAfterTrim: ${value.trim() === ''}`);
    });
  }
  // --- Debugging isSlateValid --- End

  const isSlateValid = productInfo?.type === 'Slate'
    ? Object.entries(slateDetail)
        .filter(([k]) => !['remark', 'material', 'colour', 'shapes', 'machNum'].includes(k))
        .every(([, v]) => v.trim() !== '')
    : true;
  const isAcoOrderFullfilled = acoRemain === 'Order Been Fullfilled';
  // 新增：判斷剩餘數量不足
  let isAcoOrderExcess = false;
  let acoRemainQty = null;
  if (productInfo?.type === 'ACO' && acoRemain && acoRemain.startsWith('Order Remain Qty : ')) {
    const match = acoRemain.match(/Order Remain Qty : (\d+)/);
    if (match) {
      acoRemainQty = parseInt(match[1], 10);
      const quantityPerPallet = parseInt(quantity.trim(), 10); // "Quantity of Pallet"
      const palletCount = parseInt(count.trim(), 10);         // "Count of Pallet"

      // Ensure all values are valid numbers before calculation
      if (!isNaN(acoRemainQty) && !isNaN(quantityPerPallet) && !isNaN(palletCount)) {
        if ((quantityPerPallet * palletCount) > acoRemainQty) {
          isAcoOrderExcess = true;
        }
      }
    }
  }

  // --- New ACO Print Readiness Validation --- START ---
  let isAcoReadyForPrint = true; // Default to true, does not affect non-ACO types
  if (productInfo?.type === 'ACO') {
    const isProductIncludedInOrder = acoRemain !== 'Product Code Not Included In This Order'; // New condition
    isAcoReadyForPrint = 
      acoOrderRef.trim() !== '' &&
      !acoSearchLoading &&
      acoRemain !== null && // Ensures search has been performed and acoRemain is set
      isProductIncludedInOrder && // Ensure product code is part of the order if order is found
      !acoNewRef &&       // If it was a 'New Order' flow, ensures new order details have been submitted (acoNewRef becomes false)
      !isAcoOrderFullfilled &&
      !isAcoOrderExcess;
  }
  // --- New ACO Print Readiness Validation --- END ---

  const isFormValid = 
    productCode.trim() !== '' && 
    quantity.trim() !== '' && 
    count.trim() !== '' && // For Slate, count is set to '1' by useEffect, so this check remains valid
    isSlateValid && 
    isAcoReadyForPrint; // Use the new comprehensive ACO check

  // --- 加入這個 console.log (更新以包含 isAcoReadyForPrint) ---
  console.log('[Form Validation] isFormValid:', isFormValid, {
    productCode: productCode.trim(),
    quantity: quantity.trim(),
    count: count.trim(),
    // isAcoValid, // Old variable, removed
    isSlateValid,
    isAcoOrderFullfilled, // Kept for context, though part of isAcoReadyForPrint
    isAcoOrderExcess,     // Kept for context, though part of isAcoReadyForPrint
    acoRemain: acoRemain,     // Added for better debugging of ACO state
    acoNewRef: acoNewRef,     // Added for better debugging of ACO state
    isAcoReadyForPrint    // New validation state for ACO
  });
  // --- 結束 console.log ---

  const handlePrintLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    let debugMsg = '';
    let inventoryUpdated = false;
    let acoUpdated = false;
    if (!isFormValid) return;

    // Helper function to get ordinal suffix
    function getOrdinalSuffix(n: number): string {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    }

    // 先組合 query string
    const today = new Date();
    const dateStr = format(today, 'ddMMyy'); // 用於 palletNum/plt_num
    const dateLabel = format(today, 'dd-MMM-yyyy'); // 只給 PDF label 顯示
    const operatorNum = operator.trim() ? operator.trim() : '-';
    const qcNum = userId || '-';
    const generateTime = format(today, 'dd-MMM-yyyy HH:mm:ss');
    const countNum = Math.max(1, parseInt(count, 10) || 1);

    // Define workOrderNumberVariableForFallback (used for PDF, ensure Slate gets '-')
    let workOrderNumberVariableForFallback = '-'; 
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      const acoRefForPDF = acoOrderRef.trim();
      if (acoRefForPDF) {
        let existingPalletCount = 0;
        const { data: existingPlts, error: countError } = await supabase
          .from('record_palletinfo')
          .select('plt_remark', { count: 'exact' })
          .like('plt_remark', `ACO Ref : ${acoRefForPDF}%`);
        
        if (countError) {
          console.error('[handlePrintLabel] Error counting existing ACO pallets:', countError);
        } else if (existingPlts) {
          existingPalletCount = existingPlts.length;
        }
        workOrderNumberVariableForFallback = `${acoRefForPDF} - ${existingPalletCount + 1}${getOrdinalSuffix(existingPalletCount + 1)} PLT`;
      }
    }

    // --- Step 1 Refactor: Pre-generate pallet numbers and series --- START ---
    let maxNum = 0;
    const { data: todayPlts, error: todayPltsError } = await supabase
      .from('record_palletinfo')
      .select('plt_num')
      .like('plt_num', `${dateStr}/%`);

    if (todayPltsError) {
      setDebugMsg(`ERROR: Failed to query today's pallets for numbering: ${todayPltsError.message}`);
      logErrorReport(`Failed to query today's pallets: ${todayPltsError.message}`, "Pallet Number Generation").catch(console.error);
      return; // Critical error, cannot proceed
    }
    if (todayPlts && todayPlts.length > 0) {
      todayPlts.forEach(row => {
        const parts = row.plt_num.split('/');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          maxNum = Math.max(maxNum, parseInt(parts[1]));
        }
      });
    }

    const numberOfPalletsToGenerate = productInfo?.type === 'Slate' ? 1 : countNum;
    const palletNumbersToUse = Array.from({ length: numberOfPalletsToGenerate }).map((_, i) => `${dateStr}/${maxNum + 1 + i}`);
    
    async function generateUniqueSeriesArr(numToGenerate: number): Promise<string[]> {
      const generatedSeries: string[] = [];
      const datePart = format(new Date(), 'yyMMddHH'); // Get date part once for the batch
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let attempts = 0;
      const maxAttempts = numToGenerate * 5; // Allow more attempts to find unique series

      while (generatedSeries.length < numToGenerate && attempts < maxAttempts) {
        const randomPart = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const candidateSeries = `${datePart}-${randomPart}`;
        attempts++;

        if (!generatedSeries.includes(candidateSeries)) { // Check local uniqueness first
          const { data: dbCheck, error: dbError } = await supabase
            .from('record_palletinfo')
            .select('series')
            .eq('series', candidateSeries)
            .limit(1);

          if (dbError) {
            console.error('Error checking series uniqueness in DB:', dbError);
            // Decide if we should throw, or try again, or skip. For now, log and continue trying.
          } else if (!dbCheck || dbCheck.length === 0) {
            generatedSeries.push(candidateSeries);
          }
        }
      }

      if (generatedSeries.length < numToGenerate) {
        // This case means we couldn't generate enough unique series.
        // Log an error or throw, as this is a critical failure.
        const errorMessage = `Could not generate enough unique series. Requested: ${numToGenerate}, Generated: ${generatedSeries.length}`;
        console.error(errorMessage);
        // await logErrorReport('UniqueSeriesGeneration', errorMessage); // If logErrorReport is available and appropriate
        throw new Error(errorMessage);
      }
      return generatedSeries;
    }

    const seriesArr = await generateUniqueSeriesArr(countNum);

    // Determine the plt_remark for the entire batch
    let plt_remark_for_batch = '-'; // Default remark
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      plt_remark_for_batch = `ACO Ref : ${acoOrderRef.trim()}`;
    } else if (productInfo?.type === 'Slate') {
      plt_remark_for_batch = `Batch Number : ${slateDetail.batchNumber}`;
    } else if (operator.trim()) {
      plt_remark_for_batch = operator.trim();
    }

    let startingOrdinalForAco = 1;
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      const remarkToSearch = `ACO Ref : ${acoOrderRef.trim()}`;
      const { count: existingPalletCount, error: countError } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .eq('plt_remark', remarkToSearch);

      if (countError) {
        console.error('[QcLabelForm] Error fetching existing pallet count for ACO remark:', countError);
        setDebugMsg(prev => prev + `\nError fetching ACO pallet count: ${countError.message}`);
        logErrorReport(`Error fetching ACO pallet count for order ${acoOrderRef.trim()}: ${countError.message}`, "ACO Pallet Count Fetch").catch(console.error);
      } else if (existingPalletCount !== null) {
        startingOrdinalForAco = existingPalletCount + 1;
        console.log(`[QcLabelForm] Existing pallets for ${remarkToSearch}: ${existingPalletCount}. Next ordinal starts at: ${startingOrdinalForAco}`);
      }
    }

    // 準備多筆 insert 資料
    const insertDataArr = Array.from({length: numberOfPalletsToGenerate}).map((_, i) => {
      const palletData: any = {
        plt_num: palletNumbersToUse[i],
        generate_time: generateTime,
        product_code: productCode,
        product_qty: quantity,
        series: seriesArr[i],
        plt_remark: plt_remark_for_batch, // Use the pre-calculated batch remark
      };
      return palletData;
    });

    const { error: insertError } = await supabase
      .from('record_palletinfo')
      .insert(insertDataArr);
    
    // Capture palletInfoInsertError, to be used in later refactoring steps for conditional execution
    let palletInfoInsertError: Error | null = insertError ? insertError : null;

    if (palletInfoInsertError) {
      setDebugMsg(prev => prev + `\nPallet Info Insert Error: ${palletInfoInsertError!.message}`);
      logErrorReport(`Pallet Info Insert Error: ${palletInfoInsertError!.message}`, JSON.stringify(insertDataArr)).catch(console.error);
      return; // Critical error, stop processing
    } else {
        debugMsg += `Pallet Info Insert Confirmed for ${insertDataArr.length} pallet(s).\n`;
    }

    // === SLATE EVENT ===
    let slateInsertError: Error | null = null;
    if (productInfo?.type === 'Slate') {
      const palletInfoForSlate = insertDataArr[0]; // Slate type always has 1 item in insertDataArr
      let materialValueDb = null;
      if (slateDetail.batchNumber && slateDetail.batchNumber.length >= 2) {
        materialValueDb = `Mix Material ${slateDetail.batchNumber.substring(0, 2)}`;
      }
      const slateRecord = {
        plt_num: palletInfoForSlate.plt_num,
        code: palletInfoForSlate.product_code,
        first_off: slateDetail.firstOffDate || null,
        batch_num: slateDetail.batchNumber || null,
        setter: slateDetail.setterName || null,
        mach_num: "Machine No. 14",
        weight: slateDetail.weight ? parseFloat(slateDetail.weight) : null,
        t_thick: slateDetail.topThickness ? parseFloat(slateDetail.topThickness) : null,
        b_thick: slateDetail.bottomThickness ? parseFloat(slateDetail.bottomThickness) : null,
        length: slateDetail.length ? parseFloat(slateDetail.length) : null,
        width: slateDetail.width ? parseFloat(slateDetail.width) : null,
        centre_hole: slateDetail.centreHole ? parseFloat(slateDetail.centreHole) : null,
        flame_test: slateDetail.flameTest || null,
        remark: slateDetail.remark || null,
        material: materialValueDb,
        colour: "Black",
        shape: "Colonial",
      };
      const { error } = await supabase.from('record_slate').insert(slateRecord);
      if (error) {
        slateInsertError = error;
        console.error('Error inserting into record_slate:', error);
        setDebugMsg(prev => prev + `\nSlate Record Insert Error: ${error.message}`);
        logErrorReport(`Slate Record Insert Error for ${palletInfoForSlate.plt_num}: ${error.message}`, JSON.stringify(slateRecord)).catch(console.error);
        return; // Critical error, stop processing
      } else {
        console.log('[QcLabelForm] Slate Record Insert Confirmed for plt_num:', palletInfoForSlate.plt_num);
        debugMsg += 'Slate Record Insert Confirmed\n\n';
      }
    }

    // === ACO ORDER EVENT ===
    let acoUpdateError: Error | null = null;
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      for (const d of insertDataArr) {
        const { data: acoRow, error: acoFetchError } = await supabase
          .from('record_aco')
          .select('uuid, remain_qty')
          .eq('order_ref', Number(acoOrderRef.trim()))
          .eq('code', d.product_code)
          .maybeSingle();

        if (acoFetchError) {
            acoUpdateError = acoFetchError;
            setDebugMsg(prev => prev + `\nError fetching ACO details for ${d.product_code}: ${acoFetchError.message}`);
            logErrorReport(`Error fetching ACO details for ${d.product_code} on order ${acoOrderRef.trim()}: ${acoFetchError.message}`, JSON.stringify(d)).catch(console.error);
            break; 
        }

        if (acoRow && typeof acoRow.remain_qty === 'number') {
          const newRemain = acoRow.remain_qty - Number(d.product_qty);
          const { error: updateAcoDbError } = await supabase
            .from('record_aco')
            .update({ remain_qty: newRemain, latest_update: new Date().toISOString() })
            .eq('uuid', acoRow.uuid);
          if (updateAcoDbError) {
            acoUpdateError = updateAcoDbError;
            setDebugMsg(prev => prev + `\nACO Order Update Error for ${d.product_code}: ${updateAcoDbError.message}`);
            logErrorReport(`ACO Order Update Error for ${d.product_code} on order ${acoOrderRef.trim()}: ${updateAcoDbError.message}`, JSON.stringify(d)).catch(console.error);
            break; 
          } else {
            acoUpdated = true; // Mark as updated if at least one succeeded before potential error
          }
        }
      }
      if (acoUpdateError) {
        return; // Critical error, stop processing
      }
      if (acoUpdated) { // Only add confirmation if an update happened and no error stopped it
         debugMsg += 'ACO Order Update Confirmed\n\n';
      }
    }

    // === Update record_inventory ===
    let inventoryUpdateError: Error | null = null;
    for (const d of insertDataArr) {
        const qty = Number(d.product_qty);
        const { data: inv, error: invFetchError } = await supabase
            .from('record_inventory')
            .select('uuid, await')
            .eq('product_code', d.product_code)
            .maybeSingle();

        if (invFetchError) {
            inventoryUpdateError = invFetchError;
            setDebugMsg(prev => prev + `\nInventory Check Error for ${d.product_code}: ${invFetchError.message}`);
            logErrorReport(`Inventory Check Error for ${d.product_code}: ${invFetchError.message}`, JSON.stringify(d)).catch(console.error);
            break; 
        }

        if (inv && inv.uuid) {
            const oldAwait = Number(inv.await) || 0;
            const newAwait = oldAwait + qty;
            const { error: updateError } = await supabase
                .from('record_inventory')
                .update({ await: newAwait, latest_update: new Date().toISOString() })
                .eq('uuid', inv.uuid);
            if (updateError) {
                inventoryUpdateError = updateError;
                setDebugMsg(prev => prev + `\nInventory Update Error for ${d.product_code}: ${updateError.message}`);
                logErrorReport(`Inventory Update Error for ${d.product_code}: ${updateError.message}`, JSON.stringify(d)).catch(console.error);
                break;
            } else {
                inventoryUpdated = true;
            }
        } else {
            const { error: insertInvError } = await supabase
                .from('record_inventory')
                .insert({ product_code: d.product_code, await: qty, latest_update: new Date().toISOString() });
            if (insertInvError) {
                inventoryUpdateError = insertInvError;
                setDebugMsg(prev => prev + `\nInventory Insert Error for ${d.product_code}: ${insertInvError.message}`);
                logErrorReport(`Inventory Insert Error for ${d.product_code}: ${insertInvError.message}`, JSON.stringify(d)).catch(console.error);
                break;
            } else {
                inventoryUpdated = true;
            }
        }
    }
    if (inventoryUpdateError) {
        return; // Critical error, stop processing
    }
    if (inventoryUpdated) { // Only add confirmation if an update happened and no error stopped it
        debugMsg += 'Inventory Update Confirmed\n\n';
    }

    // === Add record_history ===
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
      logErrorReport(`History Insert Error: ${historyError.message}`, JSON.stringify(historyArr)).catch(console.error);
      return; // Critical error, stop processing
    } else {
      debugMsg += 'History Record Insert Confirmed\n\n';
    }

    // If we reach here, all DB operations were successful.
    // Clear form fields
    setProductCode('');
    setQuantity('');
    setCount('');
    setOperator('');
    setAcoOrderRef('');
    setSlateDetail({
      firstOffDate: '', batchNumber: '', setterName: '', material: '', weight: '',
      topThickness: '', bottomThickness: '', length: '', width: '', centreHole: '',
      colour: '', shapes: '', flameTest: '', remark: ''
    });
    setProductInfo(null);
    setAcoRemain(null);
    
    // Update debugMsg with final success summary (or it already contains error details if an error occurred before a return)
    // The individual error messages are already added. Now add a general success indicator if no return happened.
    debugMsg += 'All database operations completed successfully.\n';

    // === PDF Generation and Upload (Loop) ===
    console.log('[DEBUG] Errors before PDF loop check:', { palletInfoInsertError, slateInsertError, acoUpdateError, inventoryUpdateError, historyError });
    
    const totalPdfs = insertDataArr.length;
    setPdfProgress({ current: 0, total: totalPdfs, status: Array(totalPdfs).fill('Pending') });
    console.log('PDF Progress Initialized:', { total: totalPdfs, current: 0, status: Array(totalPdfs).fill('Pending') });
    console.log('[DEBUG] Before PDF loop: countNum =', countNum, 'insertDataArr.length =', insertDataArr.length);

    const newPdfUrls: { series: string; url?: string; error?: string }[] = Array(totalPdfs).fill(null);

    for (let i = 0; i < totalPdfs; i++) {
      console.log(`[DEBUG] Entering PDF generation loop, iteration: ${i + 1}/${totalPdfs}`);
      const palletData = insertDataArr[i];
      const pdfDocData = {
        productCode: palletData.product_code,
        description: productInfo?.description || '-',
        quantity: palletData.product_qty,
        date: dateLabel,
        operatorClockNum: operatorNum,
        qcClockNum: qcNum,
        palletNum: palletData.plt_num,
        series: palletData.series,
        qrValue: palletData.series,
        productType: productInfo?.type || '',
        ...(productInfo?.type === 'Slate' && {
          // All Slate-specific detail fields are removed as per user request for PDF
          // firstOffDate: slateDetail.firstOffDate || '-', // Removed
          // batchNumber: slateDetail.batchNumber || '-', // Removed
          // setterName: slateDetail.setterName || '-', // Removed
          // weight: slateDetail.weight || '-', // Removed
          // topThickness: slateDetail.topThickness || '-', // Removed
          // bottomThickness: slateDetail.bottomThickness || '-', // Removed
          // length: slateDetail.length || '-', // Removed
          // width: slateDetail.width || '-', // Removed
          // centreHole: slateDetail.centreHole || '-', // Removed
          // lengthMiddleHoleToBottom: slateDetail.lengthMiddleHoleToBottom || '-', // Removed
          // flameTest: slateDetail.flameTest || '-', // Removed
        }),
        workOrderNumber: (() => {
          if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
            const currentPalletOrdinal = startingOrdinalForAco + i; // i is from the surrounding map loop
            return `${acoOrderRef.trim()} - ${currentPalletOrdinal}${getOrdinalSuffix(currentPalletOrdinal)} PLT`;
          } else if (productInfo?.type === 'Slate') {
            return '-';
          } else if (productInfo?.type) {
            return productInfo.type;
          } else {
            return workOrderNumberVariableForFallback; 
          }
        })(),
      };

      console.log('[QcLabelForm] pdfData FOR PDF:', JSON.stringify(pdfDocData, null, 2));

      const pdfUrl = await generateAndUploadPdf({
        pdfData: pdfDocData,
        fileName: `pallet-label-${palletData.series}.pdf`,
        folderName: palletData.plt_num,
        setPdfProgress: setPdfProgress,
        index: i,
        onSuccess: (url) => {
          newPdfUrls[i] = { series: palletData.series, url };
        },
        onError: (error) => {
          console.error(`Error generating/uploading PDF for pallet ${palletData.plt_num}:`, error);
          newPdfUrls[i] = { series: palletData.series, error: error.message };
          logErrorReport(`PDF Generation/Upload Error for ${palletData.plt_num}: ${error.message}`, JSON.stringify(pdfDocData)).catch(console.error);
        }
      });
    }

    // Update debugMsg (containing all messages)
    debugMsg += '\n======  PROCESSING END  ======';
    setDebugMsg(debugMsg);

    // === 清理表單和狀態 (只有在所有 PDF 都不是 Pending/Processing 時才執行) ===
    // This form cleanup was originally conditional on PDF progress.
    // However, the primary form reset (lines ~425-435 in this refactored code) happens *before* PDF generation
    // if all DB ops are successful. This final cleanup might be for a different purpose or can be re-evaluated.
    // For now, keeping its original logic related to pdfProgress.
    const allDone = pdfProgress.status.every(s => s === 'Success' || s === 'Failed');
    if (allDone) {
      // Re-clearing might be redundant if already cleared, but harmless.
      setProductCode('');
      setQuantity('');
      setCount('');
      setOperator('');
      setAcoOrderRef('');
      setSlateDetail({
        firstOffDate: '', batchNumber: '', setterName: '', material: '', weight: '',
        topThickness: '', bottomThickness: '', length: '', width: '', centreHole: '',
        colour: '', shapes: '', flameTest: '', remark: ''
      });
      setProductInfo(null);
      setAcoRemain(null);
    }
  }; // This is the end of handlePrintLabel

  // --- Product Code Search Logic --- START ---
  const handleProductCodeBlur = async () => {
    const currentProductCode = productCode.trim();
    if (!currentProductCode) {
      setProductInfo(null);
      // Do not clear productError if it's a required field error, for example.
      // Let form validation handle empty required fields.
      return;
    }
    const { data, error } = await supabase
      .from('data_code')
      .select('code, description, standard_qty, type')
      .ilike('code', currentProductCode)
      .single();

    if (error || !data) {
      setProductInfo(null);
      setProductError("Product Code Don't Exist. Please Check Again Or Update Product Code List.");
    } else {
      console.log('[QcLabelForm] Product Info Fetched, type:', data.type);
      setProductInfo(data);
      setProductError(null);
      setProductCode(data.code); // Auto-correct Product Code input
    }
  };
  // --- Product Code Search Logic --- END ---

  // --- Error Logging Function --- START ---
  const logErrorReport = async (errorPart: string, context: string) => {
    try {
      const { error: logError } = await supabase
        .from('report_log')
        .insert({ error: errorPart, context: context, state: false });
      if (logError) {
        console.error('Failed to log error to Supabase:', logError);
        // Optionally update debugMsg or show a fallback error
        setDebugMsg(prev => prev + `\nFailed to log error: ${logError.message}`);
      }
    } catch (err) {
      console.error('Exception during error logging:', err);
    }
  };
  // --- Error Logging Function --- END ---

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

    if (error) { // Handle actual errors first
      console.error('[QcLabelForm] Error searching ACO order:', error);
      setAcoRemain(`Error searching order: ${error.message}`);
      // acoNewRef remains false, print label should be disabled due to acoRemain not being a valid state for printing
    } else if (!data) { // No data found for this product_code in this order_ref
      // Check if the order_ref itself exists with other product codes
      const { data: orderExistsData, error: orderExistsError } = await supabase
        .from('record_aco')
        .select('order_ref', { count: 'exact', head: true }) // More efficient check for existence
        .eq('order_ref', Number(acoOrderRef.trim()));
        // No .limit(1) needed with head:true for existence check if that's the goal, 
        // or select a single column and limit 1 if we need to see if *any* row exists for that order_ref.
        // Let's use a simpler existence check by fetching a minimal field with limit 1.

      const { data: orderRefCheck, error: orderRefCheckError } = await supabase
        .from('record_aco')
        .select('order_ref')
        .eq('order_ref', Number(acoOrderRef.trim()))
        .limit(1);

      if (orderRefCheckError) {
        console.error('[QcLabelForm] Error checking if ACO order ref exists:', orderRefCheckError);
        setAcoRemain(`Error verifying order existence: ${orderRefCheckError.message}`);
        // acoNewRef remains false
      } else if (orderRefCheck && orderRefCheck.length > 0) {
        // Order ref exists, but not with the current productCode
        setAcoRemain('Product Code Not Included In This Order');
        // acoNewRef remains false (as set at the beginning of the function)
      } else {
        // Order ref itself does not exist with any product code
        setAcoRemain('New Order, Please Enter Detail');
        setAcoNewRef(true); // This is a genuinely new order ref
      }
    } else if (typeof data.remain_qty !== 'undefined') {
      if (Number(data.remain_qty) === 0) {
        setAcoRemain('Order Been Fullfilled For This Product');
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
      logErrorReport(`Insert record_aco (ACO Order Detail Update) failed for order ${acoOrderRef.trim()}: ${error.message}`, JSON.stringify(insertArr)).catch(console.error);
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
        <form onSubmit={handlePrintLabel} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Code</label>
            <input
              type="text"
              className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={productCode}
              onChange={e => {
                setProductCode(e.target.value);
                setDebugMsg('');
                // Clear related states on input change to avoid showing stale data
                setProductInfo(null);
                setProductError(null);
                setAcoOrderRef(''); // Clear ACO Order Ref when Product Code changes
                setAcoRemain(null); // Also clear ACO related state if product code changes
                setAcoNewRef(false);
                setPdfProgress({ current: 0, total: 0, status: [] }); // Reset PDF progress
              }}
              onBlur={handleProductCodeBlur} // Attach onBlur event
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

        {/* --- 進度條 UI 移到這裡 --- */} 
        {pdfProgress.total > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs text-gray-200">
              PDF Generation Progress: {pdfProgress.current} / {pdfProgress.total}
            </div>
            {/* 進度條 */}
            <div className="w-full bg-gray-700 rounded h-4 overflow-hidden mb-2">
              <div
                className="bg-blue-500 h-4 transition-all duration-300"
                style={{
                  width: `${(pdfProgress.current / pdfProgress.total) * 100}%`,
                }}
              />
            </div>
            {/* Pallet 狀態點 */}
            <div className="flex flex-row gap-2 mt-1 flex-wrap">
              {pdfProgress.status.map((s, i) => (
                <div
                  key={i}
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                    ${s === 'Success' ? 'bg-green-500 text-white' : s === 'Failed' ? 'bg-red-500 text-white' : s === 'Processing' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-400 text-gray-900'}
                  `}
                  title={`Pallet ${i + 1}: ${s}`}
                >
                  {/* Optionally show numbers or icons based on status */}
                  {s === 'Success' ? '✓' : s === 'Failed' ? '✗' : i + 1}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* --- 進度條 UI 結束 --- */}

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
            <>
              <p className="text-yellow-400 text-sm mt-3">
                Choose From Below Or Enter New Order Ref
              </p>
              <div className="mt-4"> {/* Adjusted margin for the hint text*/}
                <label className="block text-sm text-gray-300 mb-1">ACO Order Ref</label>
                <div className="flex flex-col gap-2">
                  <select
                    className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={acoOrderRef} 
                    onChange={e => {
                      setAcoOrderRef(e.target.value);
                      setAcoRemain(null); // Clear previous search result when ref changes
                      setAcoNewRef(false); // Reset new ref flag
                    }}
                  >
                    <option value="">Select Existing Order Ref</option>
                    {availableAcoOrderRefs.map(ref => (
                      <option key={ref} value={String(ref)}>{ref}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="w-full rounded-md bg-gray-900 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={acoOrderRef}
                    onChange={e => {
                      setAcoOrderRef(e.target.value);
                      setAcoRemain(null); // Clear previous search result when ref changes
                      setAcoNewRef(false); // Reset new ref flag
                    }}
                    placeholder="New Order Ref"
                  />
                </div>
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
            </>
          )}
        </div>
        {/* Instruction 區塊下方：Slate 專用區塊 */}
        {productInfo?.type === 'Slate' && (
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg mt-4">
            <h3 className="text-lg font-semibold text-white mb-4">Please Choose First-Off Date</h3>
            <p className="text-sm text-yellow-400 mb-3">
              Please Choose Old First-Off Date (Left) Or<br />
              Pick A New First-Off Date (Right)
            </p>
            <div className="flex flex-row gap-4 items-center mb-4">
              <select
                id="slateFirstOffDateSelect"
                name="slateFirstOffDateSelect"
                value={slateDetail.firstOffDate}
                onChange={(e) => setSlateDetail({ ...slateDetail, firstOffDate: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select existing date</option>
                {availableFirstOffDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
              <input
                id="slateFirstOffDateInput"
                type="date"
                value={slateDetail.firstOffDate}
                onChange={(e) => setSlateDetail({ ...slateDetail, firstOffDate: e.target.value })}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {slateDetail.firstOffDate && (
              <div className="flex flex-col gap-2 mt-2">
                {[
                  { key: 'batchNumber', label: 'Batch Number' },
                  { key: 'setterName', label: 'Setter Name' },
                  { key: 'weight', label: 'Weight' },
                  { key: 'topThickness', label: 'Top Thickness' },
                  { key: 'bottomThickness', label: 'Bottom Thickness' },
                  { key: 'length', label: 'Length' },
                  { key: 'width', label: 'Width' },
                  { key: 'centreHole', label: 'Length (Middle Hole To Bottom)' },
                  { key: 'flameTest', label: 'Flame Test' },
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