"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateAndUploadPdf } from '../../../app/components/print-label-pdf/PdfGenerator';
import { toast } from 'sonner';
import { QcInputData, prepareQcLabelData, mergeAndPrintPdfs } from '../../../lib/pdfUtils';
import { generateMultipleUniqueSeries } from '../../../lib/seriesUtils';
import { generatePalletNumbers } from '../../../lib/palletNumUtils';
import { PasswordConfirmationDialog } from '../../../components/ui/PasswordConfirmationDialog';
import { verifyCurrentUserPasswordAction } from '../../../app/actions/authActions';

// Server action import (assuming it's in a sibling 'actions' folder or similar)
// import { createQcLabelEntries } from '../actions/qcLabelActions'; // Placeholder

// Helper function to insert pallet info records
async function insertPalletInfoRecords(
  supabaseClient: any, // Consider using a more specific SupabaseClient type if available
  palletInfoArray: any[]
): Promise<{ error: Error | null }> {
  if (!palletInfoArray || palletInfoArray.length === 0) {
    console.log('[insertPalletInfoRecords] No pallet info to insert.');
    return { error: null }; // Nothing to insert
  }
  console.log('[insertPalletInfoRecords] Attempting to insert pallet info:', palletInfoArray);
  const { error } = await supabaseClient
    .from('record_palletinfo')
    .insert(palletInfoArray);
  if (error) {
    console.error('[insertPalletInfoRecords] Error inserting pallet info:', error);
  } else {
    console.log('[insertPalletInfoRecords] Pallet info inserted successfully.');
  }
  return { error };
}

// Helper function to insert history records
async function insertHistoryRecords(
  supabaseClient: any, // Consider using a more specific SupabaseClient type if available
  historyArray: any[]
): Promise<{ error: Error | null }> {
  if (!historyArray || historyArray.length === 0) {
    console.log('[insertHistoryRecords] No history records to insert.');
    return { error: null }; // Nothing to insert
  }
  console.log('[insertHistoryRecords] Attempting to insert history records:', historyArray);
  const { error } = await supabaseClient
    .from('record_history')
    .insert(historyArray);
  if (error) {
    console.error('[insertHistoryRecords] Error inserting history records:', error);
  } else {
    console.log('[insertHistoryRecords] History records inserted successfully.');
  }
  return { error };
}

export default function QcLabelForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); // For potentially clearing URL params
  const productCodeInputRef = useRef<HTMLInputElement>(null); // Ref for product code input

  const [productCode, setProductCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [count, setCount] = useState('');
  const [operator, setOperator] = useState('');
  const [userId, setUserId] = useState<string>('');

  const [productInfo, setProductInfo] = useState<{
    code: string;
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

  // Password Confirmation Dialog State
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [printEventToProceed, setPrintEventToProceed] = useState<React.FormEvent | null>(null);

  // New states for void correction data
  const [sourceAction, setSourceAction] = useState<string | null>(null);
  const [originalPltNum, setOriginalPltNum] = useState<string | null>(null);
  const [targetLocation, setTargetLocation] = useState<string | null>(null);

  // --- Product Code Search Logic --- START ---
  const handleProductCodeBlur = useCallback(async () => {
    if (!productCode.trim()) {
      setProductInfo(null);
      setProductError(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('data_code')
        .select('code, description, standard_qty, type')
        .ilike('code', productCode.trim())
        .single();

      if (error) {
        setProductInfo(null);
        if (error.code === 'PGRST116') { 
            setProductError(`Product Code ${productCode.trim()} Not Found. Please Check Again.`);
        } else {
            setProductError('Error fetching product info.');
        }
        console.error('Error fetching product info:', error);
      } else if (data) {
        setProductInfo(data as { code: string; description: string; standard_qty: string; type: string });
        setProductCode(data.code);
        setProductError(null);
        if (data.standard_qty && !quantity) { 
          setQuantity(data.standard_qty);
        }
      } else {
        setProductInfo(null);
        setProductError('Product code not found.');
        toast.error('Product code not found.');
      }
    } catch (e: any) {
      setProductInfo(null);
      setProductError('An unexpected error occurred while fetching product data.');
      toast.error('An unexpected error occurred while fetching product data.');
      console.error('Exception fetching product info:', e);
    }
  }, [productCode, quantity, setProductInfo, setProductError, setQuantity, supabase, toast]);
  // --- Product Code Search Logic --- END ---

  useEffect(() => {
    console.log("[QcLabelForm] isPasswordConfirmOpen state changed to:", isPasswordConfirmOpen);
  }, [isPasswordConfirmOpen]);

  // 取得登入用戶 id
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clockNumber = localStorage.getItem('loggedInUserClockNumber'); // Get the clock number directly
      if (clockNumber) {
        setUserId(clockNumber); // Set the clock number as the userId
      } else {
        // Optional: handle case where clockNumber might not be found, though login flow should prevent this
        console.warn('[QcLabelForm] loggedInUserClockNumber not found in localStorage.');
        setUserId(''); // Set to empty or handle appropriately
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
          toast.error('Error fetching historical first-off dates for Slate.');
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
        const { data, error } = await supabase
          .from('record_aco')
          .select('order_ref, remain_qty'); 

        if (error) {
          toast.error('Error fetching historical ACO order refs.');
          setAvailableAcoOrderRefs([]);
        } else if (data) {
          const groupedByOrderRef = data.reduce<Record<string, { totalRemainQty: number }>>((acc, record) => {
            const orderRefStr = String(record.order_ref);
            if (record.order_ref !== null && record.order_ref !== undefined) {
              acc[orderRefStr] = acc[orderRefStr] || { totalRemainQty: 0 };
              acc[orderRefStr].totalRemainQty += (record.remain_qty || 0);
            }
            return acc;
          }, {});
          const activeOrderRefs = Object.entries(groupedByOrderRef)
            .filter(([, value]) => value.totalRemainQty > 0)
            .map(([key]) => parseInt(key, 10))
            .filter(ref => !isNaN(ref));
          const uniqueSortedActiveRefs = Array.from(new Set(activeOrderRefs)).sort((a, b) => a - b);
          setAvailableAcoOrderRefs(uniqueSortedActiveRefs);
        }
      };
      fetchAcoOrderRefs();
    } else {
      setAvailableAcoOrderRefs([]);
    }
  }, [productInfo?.type]);

  // Effect to handle URL parameters for void correction
  useEffect(() => {
    const productCodeFromUrl = searchParams.get('product_code');
    const quantityFromUrl = searchParams.get('quantity');
    const sourceActionFromUrl = searchParams.get('source_action');
    const originalPltNumFromUrl = searchParams.get('original_plt_num');
    const targetLocationFromUrl = searchParams.get('target_location');

    if (sourceActionFromUrl === 'void_correction' || sourceActionFromUrl === 'void_correction_damage_partial') {
      if (productCodeFromUrl) {
        setProductCode(productCodeFromUrl);
      }
      if (quantityFromUrl) {
        setQuantity(quantityFromUrl);
      }
      setCount('1');
      setSourceAction(sourceActionFromUrl);
      if (originalPltNumFromUrl) {
        setOriginalPltNum(originalPltNumFromUrl);
      }
      if (targetLocationFromUrl) {
        setTargetLocation(targetLocationFromUrl);
      }

      let infoMessage = `Preparing correction label for voided pallet ${originalPltNumFromUrl || ''}. Please confirm information and print.`;
      if (sourceActionFromUrl === 'void_correction_damage_partial' && targetLocationFromUrl) {
        infoMessage = `Preparing label for remaining quantity of partially damaged pallet ${originalPltNumFromUrl || ''} (original location: ${targetLocationFromUrl}). Please confirm information and print.`;
      }

      toast.info(infoMessage, {
        duration: 8000, 
      });
    }
  }, [searchParams, router]); // Keep router if it was used for clearing params, otherwise it can be removed if not used

  // New useEffect to automatically fetch product info when productCode is set from URL params in a void correction flow
  useEffect(() => {
    if (
      (sourceAction === 'void_correction' || sourceAction === 'void_correction_damage_partial') &&
      productCode.trim() &&
      (!productInfo || productInfo.code !== productCode.trim())
    ) {
      handleProductCodeBlur();
    }
  }, [productCode, sourceAction, productInfo, handleProductCodeBlur]);

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
    isAcoReadyForPrint && // Use the new comprehensive ACO check
    // NEW CONDITION: If coming from a void correction with a product code (sourceAction is set),
    // ensure productInfo is loaded. If not a correction, this part defaults to true.
    (!(sourceAction && productCode.trim()) || productInfo);

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
    e.preventDefault(); // Prevent default form submission immediately
    if (!isFormValid) {
      toast.error('Form is not valid. Please check inputs and ACO/Slate details.');
      return;
    }
    // Instead of proceeding, open the password dialog
    setPrintEventToProceed(e); // Store the event/args needed for proceedWithPrint
    setIsPasswordConfirmOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!userId) {
      toast.error('User ID not found. Cannot verify password.');
      setIsPasswordConfirmOpen(false); // Close dialog
      setPrintEventToProceed(null);
      return;
    }
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      toast.error('Invalid User ID format. Cannot verify password.');
      setIsPasswordConfirmOpen(false); // Close dialog
      setPrintEventToProceed(null);
      return;
    }

    setIsVerifyingPassword(true);
    const result = await verifyCurrentUserPasswordAction(numericUserId, password);
    setIsVerifyingPassword(false);

    if (result.success) {
      toast.success('Password verified successfully!');
      setIsPasswordConfirmOpen(false);
      if (printEventToProceed) {
        await proceedWithPrint(printEventToProceed); // Call the original logic
      }
      setPrintEventToProceed(null); // Clear the stored event
    } else {
      toast.error(result.error || 'Incorrect password. Please try again.');
      // Keep dialog open for retry by default, or close it:
      // setIsPasswordConfirmOpen(false);
      // setPrintEventToProceed(null);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordConfirmOpen(false);
    setPrintEventToProceed(null);
    toast.info('Print action cancelled by user.');
  };

  const proceedWithPrint = async (event: React.FormEvent) => {
    // All the original logic of handlePrintLabel will go here
    // event.preventDefault(); // Already called before opening dialog

    let debugMsg = '';
    let inventoryUpdated = false;
    let acoUpdated = false;
    if (!isFormValid) {
      toast.error('Form is not valid. Please check inputs and ACO/Slate details.');
      return;
    }

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

    // Determine the plt_remark for the entire batch
    let base_plt_remark_for_batch = '-'; // Default remark
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      base_plt_remark_for_batch = `ACO Ref : ${acoOrderRef.trim()}`;
    } else if (productInfo?.type === 'Slate') {
      base_plt_remark_for_batch = `Batch Number : ${slateDetail.batchNumber}`;
    } else if (operator.trim()) {
      base_plt_remark_for_batch = operator.trim();
    }
    // If no specific remark condition is met, and it's a void correction, ensure remark indicates this.
    // This part might be redundant if the later logic correctly appends or sets the correction remark.
    // else if (sourceAction === 'void_correction' && originalPltNum) {
    //   base_plt_remark_for_batch = `Corrected for voided: ${originalPltNum}`;
    // }

    let startingOrdinalForAco = 1;
    if (productInfo?.type === 'ACO' && acoOrderRef.trim()) {
      const remarkToSearch = `ACO Ref : ${acoOrderRef.trim()}`;
      const { count: existingPalletCountForOrdinal, error: countErrorOrdinal } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .eq('plt_remark', remarkToSearch);

      if (countErrorOrdinal) {
        console.error('[QcLabelForm] Error fetching existing pallet count for ACO remark:', countErrorOrdinal);
        setDebugMsg(prev => prev + `\nError fetching ACO pallet count: ${countErrorOrdinal.message}`);
        logErrorReport(`Error fetching ACO pallet count for order ${acoOrderRef.trim()}: ${countErrorOrdinal.message}`, "ACO Pallet Count Fetch").catch(console.error);
      } else if (existingPalletCountForOrdinal !== null) {
        startingOrdinalForAco = existingPalletCountForOrdinal + 1;
        console.log(`[QcLabelForm] Existing pallets for ${remarkToSearch}: ${existingPalletCountForOrdinal}. Next ordinal starts at: ${startingOrdinalForAco}`);
      }
    }

    // 準備多筆 insert 資料
    const numberOfPalletsToGenerate = productInfo?.type === 'Slate' ? 1 : countNum;
    const palletNumbersToUse = await generatePalletNumbers(supabase, numberOfPalletsToGenerate);
    
    const seriesArr = await generateMultipleUniqueSeries(countNum, supabase);

    let insertDataArr = Array.from({length: numberOfPalletsToGenerate}).map((_, i) => {
      let currentPltRemark = base_plt_remark_for_batch; // Start with the batch remark

      // Check if this is a void correction and add to remark
      if ((sourceAction === 'void_correction' || sourceAction === 'void_correction_damage_partial') && originalPltNum) {
        const correctionText = `Reprint for voided: ${originalPltNum}`;
        currentPltRemark = (currentPltRemark && currentPltRemark !== '-') 
                           ? `${currentPltRemark}; ${correctionText}` 
                           : correctionText;
      }

      // 根據 sourceAction 同 targetLocation 決定 plt_loc
      let final_plt_loc = "Await"; // Default location
      if ((sourceAction === 'void_correction' || sourceAction === 'void_correction_damage_partial') && targetLocation) {
          final_plt_loc = targetLocation;
      }

      const palletData: any = {
        plt_num: palletNumbersToUse[i],
        //generate_time: generateTime, // Auto by DB
        product_code: productCode,
        product_qty: quantity,
        series: seriesArr[i],
        plt_remark: currentPltRemark, 
        plt_loc: final_plt_loc, // 添加 plt_loc 到 palletData
      };
      return palletData;
    });

    // Use helper function to insert pallet info
    const palletInfoResult = await insertPalletInfoRecords(supabase, insertDataArr);
    let palletInfoInsertError: Error | null = palletInfoResult.error; // Keep original variable name for later checks

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

    // === Update record_inventory (New Logic: Always Insert) ===
    let inventoryInsertError: Error | null = null; 
    inventoryUpdated = false; // Reset inventoryUpdated flag before the loop

    for (const d of insertDataArr) { // insertDataArr NOW INCLUDES plt_loc
        const qty = Number(d.product_qty);
        
        // 根據 d.plt_loc 決定庫存欄位名稱
        let inventory_column_name = "await"; // Default inventory column
        const final_pallet_location = d.plt_loc || "Await"; // 確保 d.plt_loc 有值，否則預設 Await

        // 如果唔係 Await，嘗試映射到特定庫存欄位
        if (final_pallet_location !== "Await") {
            const locationToColumnMap: { [key: string]: string } = {
                "Production": "injection",
                "PipeLine": "pipeline",
                "Pre-Book": "prebook",
                "Fold Mill": "fold",
                "Bulk Room": "bulk",
                "Back Car Park": "backcarpark"
                // 記得呢度嘅 key 必須同 final_pallet_location 傳入嘅值完全匹配
            };
            inventory_column_name = locationToColumnMap[final_pallet_location] || "await"; // 如果映射唔到，都係返 await
        }

        const inventoryRecord: { [key: string]: any } = {
            product_code: d.product_code, 
            plt_num: d.plt_num,
            // 所有其他數量欄位應由數據庫預設為 0
        };
        inventoryRecord[inventory_column_name] = qty; // 動態設定正確嘅庫存欄位同數量

        const { error: insertError } = await supabase
            .from('record_inventory')
            .insert(inventoryRecord); // 使用動態構建嘅 record

        if (insertError) {
            inventoryInsertError = insertError; 
            setDebugMsg(prev => prev + `\nInventory Insert Error for ${d.product_code} (Pallet: ${d.plt_num}): ${insertError.message}`);
            logErrorReport(`Inventory Insert Error for ${d.product_code} (Pallet: ${d.plt_num}): ${insertError.message}`, JSON.stringify(d)).catch(console.error);
            break; 
        } else {
            inventoryUpdated = true; 
        }
    }
    if (inventoryInsertError) { 
        return; 
    }
    if (inventoryUpdated) { 
        debugMsg += 'Inventory Records Inserted Confirmed\n\n'; 
    }

    // === Add record_history ===
    const now = new Date();
    const historyArr = insertDataArr.map((d) => {
      // 新邏輯: 使用 insertDataArr 中嘅 d.plt_loc
      const final_history_loc = d.plt_loc || "Await"; // 使用早前決定嘅 plt_loc，如果冇就預設 Await

      let history_action = 'Production Finished Q.C.';
      let history_remark = operator.trim() ? 'Pre-Booking (Print Before Product Is Ready)' : 'QC Done (Product Finished And Ready)';

      // 如果係作廢更正，調整 action 同 remark
      if (sourceAction === 'void_correction_damage_partial' && originalPltNum) {
        history_action = 'Void Correction Label (Partial Damage)';
        // targetLocation state 應該可以直接喺呢度用，因為佢喺 proceedWithPrint 嘅 scope 之內
        history_remark = `New label for remaining qty of voided pallet ${originalPltNum}.`;
      } else if (sourceAction === 'void_correction' && originalPltNum) {
        history_action = 'Void Correction Label';
        history_remark = `New label for voided pallet ${originalPltNum}.`;
      }

      return {
        time: now.toISOString(),
        id: userId ? parseInt(userId, 10) : null,
        remark: history_remark, // 使用可能已修改嘅 remark
        plt_num: d.plt_num,
        loc: final_history_loc, // 使用 final_history_loc
        action: history_action, // 使用可能已修改嘅 action
      };
    });
    
    const historyResult = await insertHistoryRecords(supabase, historyArr);
    let historyError: Error | null = historyResult.error; // Keep original variable name

    if (historyError) {
      setDebugMsg(prev => prev + `\nHistory Insert Error: ${historyError!.message}`); // Use historyError directly
      logErrorReport(`History Insert Error: ${historyError!.message}`, JSON.stringify(historyArr)).catch(console.error);
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
    console.log('[DEBUG] Errors before PDF loop check:', { palletInfoInsertError, slateInsertError, acoUpdateError, inventoryInsertError, historyError });
    
    const totalPdfs = insertDataArr.length;
    setPdfProgress({ current: 0, total: totalPdfs, status: Array(totalPdfs).fill('Pending') });
    console.log('PDF Progress Initialized:', { total: totalPdfs, current: 0, status: Array(totalPdfs).fill('Pending') });
    console.log('[DEBUG] Before PDF loop: countNum =', countNum, 'insertDataArr.length =', insertDataArr.length);

    const generatedPdfArrayBuffers: ArrayBuffer[] = []; // For mergeAndPrintPdfs
    let successfulPdfGenerations = 0; // To count actual successes for merging condition

    for (let i = 0; i < totalPdfs; i++) {
      console.log(`[DEBUG] Entering PDF generation loop, iteration: ${i + 1}/${totalPdfs}`);
      const palletData = insertDataArr[i];
      
      // 1. Construct QcInputData for prepareQcLabelData
      const qcInputForLabel: QcInputData = {
        productCode: palletData.product_code,
        productDescription: productInfo?.description || '-',
        quantity: Number(palletData.product_qty), // Ensure quantity is a number
        series: palletData.series,
        palletNum: palletData.plt_num,
        operatorClockNum: operatorNum, // from form state
        qcClockNum: qcNum, // from form state (userId)
        workOrderNumber: (() => { // Logic for workOrderNumber based on product type
          const type = productInfo?.type;
          const trimmedAcoOrderRef = acoOrderRef.trim();

          if (type === 'ACO' && trimmedAcoOrderRef) {
            const currentPalletOrdinal = startingOrdinalForAco + i;
            return `${trimmedAcoOrderRef} - ${currentPalletOrdinal}${getOrdinalSuffix(currentPalletOrdinal)} PLT`;
          }
          // For Slate and any other non-ACO types, the work order value should be '-'.
          return '-';
        })(),
        productType: productInfo?.type || '',
        workOrderName: productInfo?.type === 'ACO' ? 'ACO Order' : (productInfo?.type === 'Slate' ? 'SLATE Order' : productInfo?.type) // Example for workOrderName
      };

      // 2. Call prepareQcLabelData to get props including qrCodeDataUrl
      const currentPdfProps = await prepareQcLabelData(qcInputForLabel);
      console.log('[QcLabelForm] currentPdfProps from prepareQcLabelData:', JSON.stringify(currentPdfProps, null, 2));

      // 3. Call generateAndUploadPdf from PdfGenerator.tsx with the prepared props
      const pdfResult = await generateAndUploadPdf({
        pdfData: currentPdfProps, 
        fileName: `pallet-label-${palletData.series}.pdf`, 
        folderName: palletData.plt_num, 
        setPdfProgress: setPdfProgress,
        index: i,
        // onSuccess and onError callbacks in generateAndUploadPdf props are now optional 
        // as we handle the result directly.
      });

      if (pdfResult && pdfResult.blob) {
        generatedPdfArrayBuffers.push(await pdfResult.blob.arrayBuffer());
        successfulPdfGenerations++; // Increment successful generations
        // Optionally, store pdfResult.publicUrl if needed for other purposes, e.g., updating a DB field
        // (but per user instruction, no DB changes here)

        // setPdfProgress for success is handled inside generateAndUploadPdf if setPdfProgress and index are passed.
        // If not, or to be certain, you could add it here:
        // setPdfProgress(prev => {
        //   const newStatus = [...prev.status];
        //   newStatus[i] = 'Success'; 
        //   return { ...prev, current: prev.current + 1, status: newStatus };
        // });

      } else {
        // PDF generation/upload failed for this item. 
        // generateAndUploadPdf should have called setPdfProgress to 'Failed' and logged the error.
        console.warn(`PDF generation/upload failed for pallet ${palletData.plt_num}.`);
      }
    }

    // After the loop, attempt to merge and print if any PDFs were successful
    if (generatedPdfArrayBuffers.length > 0 && generatedPdfArrayBuffers.length === successfulPdfGenerations) {
      // This implies all PDFs that were attempted and expected (totalPdfs) were successful if successfulPdfGenerations === totalPdfs
      // Or if we only want to print if at least one was successful, then just check generatedPdfArrayBuffers.length > 0
      try {
        const firstPalletNumForName = insertDataArr.length > 0 ? insertDataArr[0].plt_num : 'QC_Labels';
        await mergeAndPrintPdfs(generatedPdfArrayBuffers, `Merged_QC_Labels_${firstPalletNumForName.replace(/\//g, '_')}.pdf`);
        toast.success(`${generatedPdfArrayBuffers.length} PDF(s) merged and sent to print.`);
      } catch (mergeError) {
        console.error("Error during PDF merge and print:", mergeError);
        toast.error("Failed to merge and print PDFs. Please check console.");
      }
    } else if (generatedPdfArrayBuffers.length > 0) { // Some PDFs succeeded, but not all expected (if totalPdfs > successfulPdfGenerations)
        toast.warning(`Only ${generatedPdfArrayBuffers.length} of ${totalPdfs} PDFs were successful. Attempting to print what was generated.`);
        try {
            const firstPalletNumForName = insertDataArr.length > 0 ? insertDataArr[0].plt_num : 'QC_Labels';
            await mergeAndPrintPdfs(generatedPdfArrayBuffers, `Partially_Merged_QC_Labels_${firstPalletNumForName.replace(/\//g, '_')}.pdf`);
            toast.info(`${generatedPdfArrayBuffers.length} PDF(s) merged and sent to print (partial success).`);
        } catch (mergeError) {
            console.error("Error during partial PDF merge and print:", mergeError);
            toast.error("Failed to merge and print partially successful PDFs. Please check console.");
        }
    } else if (totalPdfs > 0) { // No PDFs were successful, but an attempt was made
      toast.error('No PDFs were successfully generated to merge and print.');
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
  };

  // --- Error Logging Function --- START ---
  const logErrorReport = async (errorPart: string, context: string) => {
    const logEntry = {
      time: new Date().toISOString(),
      id: userId || 'unknown_user', // Directly use the userId state variable
      action: 'Error Report',
      loc: null,
      plt_num: null,
      remark: `Part: ${errorPart}, Context: ${context}`
    };
    console.error(`[QcLabelForm Error Report] User: ${userId}, Part: ${errorPart}, Context: ${context}`); // Keep console for backend logging
    toast.error(`Error during ${errorPart}. Details logged.`); // User-facing toast
    try {
      await supabase.from('record_history').insert(logEntry);
    } catch (historyError) {
      console.error('[QcLabelForm] Failed to log error report to history:', historyError);
      // Don't show another toast for failing to log an error
    }
  };
  // --- Error Logging Function --- END ---

  const handleAcoSearch = async () => {
    if (!acoOrderRef.trim() || !productCode.trim()) {
      // toast.info('Please enter both Product Code and ACO Order Ref to search.'); // Optional: Info toast if needed
      return;
    }
    setAcoSearchLoading(true);
    setAcoRemain(null);
    setAcoNewRef(false);
    setAcoOrderDetails([{ code: '', qty: '' }]); // Reset details on new search
    
    try {
      const { data, error } = await supabase
        .from('record_aco')
        .select('uuid, code, required_qty, remain_qty')
        .eq('order_ref', acoOrderRef.trim());

      if (error) {
        // console.error('[QcLabelForm] Error searching ACO order:', error);
        // setAcoRemain('Error searching order.');
        toast.error(`Error searching ACO order ${acoOrderRef}: ${error.message}`);
        await logErrorReport('ACO Search', `DB error searching order ${acoOrderRef}: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        // setAcoRemain('Order Ref Not Found! You need to input New Order Details.');
        toast.info(`New ACO order : ${acoOrderRef} found. Please provide new order details below.`);
        setAcoNewRef(true);
        setAcoNewProductCode(productCode.trim()); // Pre-fill product code for new order detail
        setAcoOrderDetails([{ code: productCode.trim(), qty: '' }]); // Start with current product code
      } else {
        // Order found, check if product code exists in this order
        // console.log('[ACO Search Debug] productCode state:', productCode);
        // console.log('[ACO Search Debug] productCode.trim():', productCode.trim(), 'Type:', typeof productCode.trim());
        // console.log('[ACO Search Debug] Data from Supabase (raw):', JSON.stringify(data));
        // data.forEach((item, index) => {
        //   console.log(`[ACO Search Debug] Item ${index} code: '${item.code}', Type: ${typeof item.code}, Length: ${item.code?.length}`);
        //   console.log(`[ACO Search Debug] Comparison: item.code ('${item.code}') === productCode.trim() ('${productCode.trim()}') -> ${item.code === productCode.trim()}`);
        // });

        const productEntry = data.find(item => item.code === productCode.trim()); 
        // console.log('[ACO Search Debug] productEntry found:', productEntry);

        if (productEntry) {
          if (productEntry.remain_qty <= 0) {
            // setAcoRemain('Order Been Fullfilled');
            toast.warning(`Product ${productCode} in order ${acoOrderRef} has already been fulfilled (Remaining Qty: 0).`);
            setAcoRemain('Order Been Fullfilled'); // Keep state for validation logic
          } else {
            setAcoRemain(`Order Remain Qty : ${productEntry.remain_qty}`);
            toast.success(`Order ${acoOrderRef} found. Remaining quantity for ${productCode}: ${productEntry.remain_qty}`);
          }
        } else {
          // Order exists, but product code is not part of it
          // setAcoRemain('Product Code Not Included In This Order');
          toast.error(`Product Code ${productCode} is not part of ACO Order ${acoOrderRef}.`);
          setAcoRemain('Product Code Not Included In This Order'); // Keep state for validation
          // Optionally, log this as an error report or specific history entry
          await logErrorReport('ACO Search', `Product ${productCode} not found in existing order ${acoOrderRef}`);
        }
        setAcoNewRef(false); // Found existing order, not a new ref scenario
      }
    } catch (err: any) {
      // console.error('[QcLabelForm] Unexpected error searching ACO order:', err);
      // setAcoRemain('Unexpected error during search.');
      toast.error(`Unexpected error searching ACO order: ${err.message}`);
      await logErrorReport('ACO Search', `Unexpected error: ${err.message}`);
    } finally {
      setAcoSearchLoading(false);
    }
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
    // Basic validation: check if order ref is entered
    if (!acoOrderRef.trim()) {
        toast.error('Please enter ACO Order Ref first before adding details.');
        return;
    }
    
    // Validate all rows have product code and quantity, BUT IGNORE completely empty rows
    let isValidOverall = true;
    const errors: string[] = []; 
    const filledOrderDetails = acoOrderDetails.filter(
      detail => detail.code.trim() !== '' || detail.qty.trim() !== ''
    );

    if (filledOrderDetails.length === 0) {
      toast.info("Please enter at least one ACO order detail.");
      setAcoOrderDetailErrors([]); // Clear any previous errors
      return;
    }

    filledOrderDetails.forEach((detail, index) => {
        let rowError = '';
        if (!detail.code.trim()) {
            isValidOverall = false;
            rowError = 'Product code is required.';
        }
        // Ensure qty is a positive number if present, or if code is present but qty is not
        if (!detail.qty.trim() || parseInt(detail.qty.trim(), 10) <= 0) {
            isValidOverall = false;
            rowError = (rowError ? rowError + ' ' : '') + 'Valid quantity (>0) is required.';
        }
        // We need to map errors back to the original acoOrderDetails index if displaying them per row
        // For simplicity, if any filled row has an error, we show a general message.
        // Or, find the original index to set specific error:
        const originalIndex = acoOrderDetails.findIndex(originalDetail => originalDetail === detail);
        errors[originalIndex] = rowError;
    });
    
    // Update errors for all rows, including potentially empty ones that were not validated
    const allErrors = acoOrderDetails.map((_, idx) => errors[idx] || '');
    setAcoOrderDetailErrors(allErrors);

    if (!isValidOverall) {
        toast.error('Please fill in all Product Code and Quantity fields correctly for the entered rows.');
        return;
    }
    
    setAcoSearchLoading(true); 
    
    try {
        const recordsToInsert = filledOrderDetails.map(detail => ({ // Use filtered list
            order_ref: parseInt(acoOrderRef.trim(), 10),
            code: detail.code.trim(), // Corrected to 'code'
            required_qty: parseInt(detail.qty.trim(), 10), // Corrected to 'required_qty'
            remain_qty: parseInt(detail.qty.trim(), 10), 
            latest_update: new Date().toISOString(), 
        }));    

        if (recordsToInsert.length === 0) { // Should not happen due to earlier check, but as a safeguard
            toast.info("No valid order details to save.");
            setAcoSearchLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('record_aco')
            .insert(recordsToInsert)
            .select(); 
            
        if (error) {
            toast.error(`Failed to save ACO Order Details: ${error.message}`);
            await logErrorReport('ACO New Order Save', `DB error: ${error.message}`);
        } else {
            toast.success('New ACO Order Details saved successfully!');
            setAcoNewRef(false);
            setAcoOrderDetails([{ code: '', qty: '' }]); // Reset to a single empty line
            setAcoOrderDetailErrors([]); // Clear errors
            handleAcoSearch(); 
        }
    } catch (err: any) {
        toast.error('An unexpected error occurred while saving ACO details.');
        await logErrorReport('ACO New Order Save', `Unexpected error: ${err}`);
    } finally {
        setAcoSearchLoading(false); 
    }
  };

  useEffect(() => {
    if (productInfo?.type === 'Slate') {
      setCount('1');
    }
  }, [productInfo]);

  return (
    <div className="flex flex-row gap-8 w-full max-w-screen-lg mx-auto">
      <PasswordConfirmationDialog
        isOpen={isPasswordConfirmOpen}
        onOpenChange={setIsPasswordConfirmOpen}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        isLoading={isVerifyingPassword}
        title="Confirm Print Action"
        description="Please enter your password to proceed with printing the labels."
      />
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