"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { PrintLabelPdf } from '../../components/print-label-pdf';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
// For PDF generation and upload
import { pdf } from '@react-pdf/renderer';

// Import PDF utilities
import { prepareGrnLabelData, generateAndUploadPdf, GrnInputData, mergeAndPrintPdfs } from '../../lib/pdfUtils';
import { PrintLabelPdfProps } from '../../components/print-label-pdf/PrintLabelPdf'; // Still needed for latestGeneratedPdfProps state type
import { generateUniqueSeries as generateSingleUniqueSeries } from '../../lib/seriesUtils'; // Import and alias to avoid name collision if any local var is named generateUniqueSeries
import { generatePalletNumbers } from '../../lib/palletNumUtils'; // Import the new pallet number utility
import { PasswordConfirmationDialog } from '../../components/ui/PasswordConfirmationDialog'; // Added
import { verifyCurrentUserPasswordAction } from '../../app/actions/authActions'; // Added

// Helper function to insert pallet info records
async function insertPalletInfoRecords(
  supabaseClient: any, 
  palletInfoArray: any[]
): Promise<{ error: Error | null }> {
  if (!palletInfoArray || palletInfoArray.length === 0) {
    return { error: null }; 
  }
  const { error } = await supabaseClient
    .from('record_palletinfo')
    .insert(palletInfoArray);
  if (error) {
    console.error('[insertPalletInfoRecords] Error inserting pallet info:', error);
  }
  return { error };
}

// Helper function to insert history records
async function insertHistoryRecords(
  supabaseClient: any, 
  historyArray: any[]
): Promise<{ error: Error | null }> {
  if (!historyArray || historyArray.length === 0) {
    return { error: null }; 
  }
  const { error } = await supabaseClient
    .from('record_history')
    .insert(historyArray);
  if (error) {
    console.error('[insertHistoryRecords] Error inserting history records:', error);
  }
  return { error };
}

const ManualPdfDownloadButton = dynamic(
() => import('../../components/print-label-pdf/ManualPdfDownloadButton'),
{ ssr: false }
);

// Define ProgressStatus type similar to QcLabelForm
type ProgressStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

interface ProductInfoType { // Ensure this is defined, or imported if it lives elsewhere
product_code: string;
description: string;
product_type: string | null;
}

interface FormState {
grnNumber: string;
materialSupplier: string;
productCode: string;
// grossWeight: string; // This was in old form, now managed by grossWeights array
}

export default function PrintGrnLabelPage() {
// 主表單狀態
const [form, setForm] = useState<FormState>({
grnNumber: '',
materialSupplier: '',
productCode: '',
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
const [productInfo, setProductInfo] = useState<ProductInfoType | null>(null);
const [productInfoDisplay, setProductInfoDisplay] = useState<string | null>(null);
const [productError, setProductError] = useState<string | null>(null);
const [pdfProps, setPdfProps] = useState<null | {
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

// Password Confirmation Dialog State for GRN
const [isGrnPasswordConfirmOpen, setIsGrnPasswordConfirmOpen] = useState(false); // Added
const [isGrnVerifyingPassword, setIsGrnVerifyingPassword] = useState(false); // Added
const [grnPrintEventToProceed, setGrnPrintEventToProceed] = useState<boolean>(false); // Added - boolean as no event object

// 2. 動態計算 pallet 數量（以 Pallet Type 欄位總和為主，最大 22）
const palletCount = Math.min(22, Object.values(palletType).reduce((sum, v) => sum + (parseInt(v) || 0), 0) || 1);

// 3. 當 palletCount 變動時，自動調整 grossWeights 長度
React.useEffect(() => {
setGrossWeights(prev => {
let currentGrossWeights = [...prev];
// If palletCount decreases, truncate the array.
if (palletCount < currentGrossWeights.length) {
currentGrossWeights = currentGrossWeights.slice(0, palletCount);
}
// Ensure there's always at least one input field if palletCount is >= 1 and array is currently empty.
// (palletCount is always >= 1 due to `|| 1` in its definition)
if (currentGrossWeights.length === 0 && palletCount >= 1) { // Check palletCount >= 1 explicitly
return [''];
}
// If palletCount increases, we DON'T add new fields here automatically.
// User interaction via handleGrossWeightChange will add them if needed.
return currentGrossWeights;
});
}, [palletCount]);

useEffect(() => {
    if (typeof window !== 'undefined') { 
      const clockNumber = localStorage.getItem('loggedInUserClockNumber');
      if (clockNumber) {
        setUserId(clockNumber);
      } else {
        console.warn('[PrintGrnLabelPage] loggedInUserClockNumber not found in localStorage.');
        toast.error('User session not found. Please log in again.'); // Added toast for better UX
        setUserId(''); // Or handle appropriately, e.g., redirect to login
      }
    }
    //The above code is correct in terms of custom login, but it has been modified by the user to use the old user format.
    //I will use the user's version of the code below.
    // if (typeof window !== 'undefined') {
    //   const userStr = localStorage.getItem('user');
    //   if (userStr) {
    //     try {
    //       const userData = JSON.parse(userStr);
    //       setUserId(userData.id || '');
    //     } catch (e) {
    //       console.error("Failed to parse user data from localStorage", e);
    //       setUserId('');
    //     }
    //   }
    // }
}, []);

// 4. 處理 input 變動
const handleGrossWeightChange = (idx: number, value: string) => {
setGrossWeights(prev => {
const next = prev.map((v, i) => (i === idx ? value : v));
// Add new field if:
// 1. This is the last input field (idx === prev.length - 1)
// 2. The user has entered some text into it (value.trim() !== '')
// 3. The current number of fields is less than the hard cap of 22 (prev.length < 22)
// The condition `prev.length < palletCount` has been removed to allow adding up to 22 fields
// regardless of palletCount, which will be used later to determine how many filled fields to process.
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
notIncluded: 0,
};
const PACKAGE_WEIGHT: Record<string, number> = {
still: 50,
bag: 1,
tote: 6,
octo: 14,
notIncluded: 0,
};

// New function to query supplier code on blur with exact match
const querySupplierCode = async (value: string) => {
const valueUpper = value.trim().toUpperCase();
if (!valueUpper) {
setSupplierInfo(null);
setSupplierError(null);
// Optionally clear form.materialSupplier if input is empty after trim
// setForm(f => ({ ...f, materialSupplier: '' })); 
return;
}
const { data, error } = await supabase
.from('data_supplier')
.select('supplier_code, supplier_name')
.eq('supplier_code', valueUpper);

if (error) {
setSupplierInfo(null);
setSupplierError('Supplier Code Not Found Or Error');
return;
}
if (data && data.length > 0) {
setSupplierError(null);
setSupplierInfo(data[0].supplier_name);
setForm(f => ({ ...f, materialSupplier: data[0].supplier_code })); // Update with validated/canonical code
} else {
setSupplierInfo(null);
setSupplierError('Supplier Code Not Found');
}
};

const handleSupplierChange = (value: string) => {
// Only update the form state as the user types
setForm(f => ({ ...f, materialSupplier: value })); 
};

// This is the function that will be called by onBlur in the JSX
const handleSupplierBlur = (value: string) => {
querySupplierCode(value);
};

// Product Code 查詢 - modified to be called onBlur directly
const queryProductCode = async (value: string) => {
const codeToQuery = value.trim().toUpperCase();
if (!codeToQuery) {
setProductInfo(null);
setProductInfoDisplay(null); // Clear display string
setProductError(null);
// Optionally, clear the input in the form state if it's now empty
// setForm(f => ({ ...f, productCode: '' }));
return;
}

try {
const { data, error } = await supabase
.from('data_code') // Corrected table name to data_code
.select('code, description') // Select columns based on the screenshot (code, description)
.eq('code', codeToQuery); // Match against code column

if (error) {
setProductInfo(null);
setProductInfoDisplay(null);
setProductError('Error fetching product data.');
console.error('Error fetching product data:', error);
toast.error('Failed to fetch product details. Please try again.');
return;
}

if (data && data.length > 0) {
const fetchedProduct = data[0];
setProductInfo({
product_code: fetchedProduct.code, // Use fetchedProduct.code
description: fetchedProduct.description,
product_type: null, // data_code table does not seem to have product_type
});
// Update display string for the UI
setProductInfoDisplay(`${fetchedProduct.code} - ${fetchedProduct.description}`);
setProductError(null);
// Update form's productCode with the canonical version from DB (if casing differs etc.)
setForm(f => ({ ...f, productCode: fetchedProduct.code }));
} else {
setProductInfo(null);
setProductInfoDisplay(null);
setProductError('Product Code Not Found.');
toast.warning('Product Code Not Found.');
}
} catch (e) {
setProductInfo(null);
setProductInfoDisplay(null);
setProductError('An unexpected error occurred.');
console.error('Unexpected error in queryProductCode:', e);
toast.error('An unexpected error occurred while fetching product details.');
}
};

const handleProductCodeChange = (value: string) => {
setForm(f => ({ ...f, productCode: value }));
// Query is now called onBlur, not onChange
};

// Modified handleProductCodeBlur to use the new queryProductCode function
const handleProductCodeBlur = (value: string) => {
queryProductCode(value);
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

  // Helper function to parse count values according to the new logic
  const parseCountValue = (valueStr: string | undefined): number => {
    if (!valueStr || valueStr.trim() === '') {
      return 0;
    }
    const num = parseFloat(valueStr.trim());
    if (isNaN(num)) {
      return 0; // Or handle error as appropriate
    }
    // Check if the number is an integer (e.g., 1.0, 2.0)
    if (num % 1 === 0) {
      return Math.floor(num); // Return as integer
    }
    return num; // Return with decimals
  };

// New function to contain the original print logic
const proceedWithGrnPrint = async () => {
  const validGrossWeights = grossWeights.filter(gw => gw && gw.trim() !== '' && parseFloat(gw) > 0);

  if (validGrossWeights.length === 0) {
    toast.error('Please enter at least one valid gross weight.');
    return;
  }
  if (!productInfo) {
    toast.error('Product details not loaded. Please select a valid product code.');
    return;
  }
  if (!form.grnNumber.trim() || !form.materialSupplier.trim()) {
    toast.error('GRN Number and Material Supplier are required.');
    return;
  }

  // --- Overall Process Start Toast ---
  toast.info('Starting GRN processing...');
  setPdfProgress({ current: 0, total: validGrossWeights.length, status: Array(validGrossWeights.length).fill('Pending') });
  setPdfUploadSuccess(false);

  // --- 2. Data Preparation Loop (Collect data for batch DB ops and PDF props) ---
  const palletInfoBatch: any[] = [];
  const grnIndividualRecordBatch: any[] = [];
  const historyBatch: any[] = [];
  const pdfLabelPropsBatch: any[] = [];
  let inventoryUpdateErrorOccurred = false;

  // Pre-generate all pallet numbers for this batch to ensure uniqueness before DB ops
  const palletNumbersToUse = await generatePalletNumbers(supabase, validGrossWeights.length);
  if (palletNumbersToUse.length !== validGrossWeights.length) {
    toast.error('Failed to generate the required number of pallet numbers. Please try again.');
    return;
  }

  // Get the selected pallet and package types and their counts ONCE before the loop
  const selectedPalletTypeKey = Object.keys(palletType).find(k => palletType[k as keyof typeof palletType].trim() !== '') as keyof typeof PALLET_WEIGHT || 'notIncluded';
  const palletCountForRecord = parseCountValue(palletType[selectedPalletTypeKey as keyof typeof palletType]);
  const palletDbValueForRecord = PALLET_TYPE_DB_VAL[selectedPalletTypeKey];
  const palletWeightToSubtract = PALLET_WEIGHT[selectedPalletTypeKey] || 0;

  const selectedPackageTypeKey = Object.keys(packageType).find(k => packageType[k as keyof typeof packageType].trim() !== '') as keyof typeof PACKAGE_WEIGHT || 'notIncluded';
  const packageCountForRecord = parseCountValue(packageType[selectedPackageTypeKey as keyof typeof packageType]);
  const packageDbValueForRecord = PACKAGE_TYPE_DB_VAL[selectedPackageTypeKey];
  const packageWeightToSubtract = PACKAGE_WEIGHT[selectedPackageTypeKey] || 0;

  for (let i = 0; i < validGrossWeights.length; i++) {
    const gw = validGrossWeights[i];
    // Update progress for data preparation stage (can be more granular if needed)
    // setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Processing Data' : s) })); 

    const grossWeight = parseFloat(gw);
    // Pallet and package weight subtractions are now determined before the loop
    const netWeight = grossWeight - palletWeightToSubtract - packageWeightToSubtract;

    if (netWeight <= 0) {
      toast.warning(`Pallet ${i + 1}: Net weight is not positive. Skipping this pallet.`);
      // Optionally mark this specific item as 'Skipped' or 'Failed' in pdfProgress
      // For now, it will remain 'Pending' or its last state from the overall setPdfProgress
      setPdfProgress(prev => ({
        ...prev,
        status: prev.status.map((s, idx) => idx === i ? 'Failed' : s)
      }));
      continue;
    }

    const palletNum = palletNumbersToUse[i];
    const series = await generateSingleUniqueSeries(supabase);
    const currentUserIdInt = userId ? parseInt(userId, 10) : null;
    const currentTimeISO = new Date().toISOString();

    // Add to PalletInfo Batch
    palletInfoBatch.push({
      plt_num: palletNum,
      generate_time: currentTimeISO,
      product_code: productInfo!.product_code,
      product_qty: netWeight,
      series,
      plt_remark: `Material GRN - ${form.grnNumber.trim()}`
    });

    // Add to GRN Individual Record Batch
    grnIndividualRecordBatch.push({
      grn_ref: parseInt(form.grnNumber.trim(), 10),
      sup_code: form.materialSupplier.trim(),
      material_code: productInfo!.product_code,
      gross_weight: grossWeight,
      net_weight: netWeight,
      plt_num: palletNum,
      pallet: palletDbValueForRecord, // Use pre-loop determined value
      package: packageDbValueForRecord, // Use pre-loop determined value
      pallet_count: palletCountForRecord, // Add pallet_count from form
      package_count: packageCountForRecord // Add package_count from form
    });
    
    // Add to History Batch
    historyBatch.push({
      action: 'Material Receive',
      time: currentTimeISO,
      id: currentUserIdInt,
      plt_num: palletNum,
      loc: 'Awaiting',
      remark: `GRN ${form.grnNumber.trim()} - ${form.materialSupplier.trim()}`
    });

    // Inventory Update (remains in loop due to select-then-update logic per item)
    try {
      const { data: inv, error: invError } = await supabase.from('record_inventory').select('await, uuid, plt_num').eq('product_code', productInfo!.product_code).eq('plt_num', palletNum).maybeSingle();
      if (invError && invError.code !== 'PGRST116') throw new Error(`Inventory Query: ${invError.message}`);
      
      if (inv) { // If a record with the same product_code and plt_num exists, update it (this scenario might be unlikely if plt_num is always new)
        const newAwait = (Number(inv.await) || 0) + netWeight;
        const { error: updateError } = await supabase.from('record_inventory').update({ await: newAwait, latest_update: currentTimeISO }).eq('uuid', inv.uuid);
        if (updateError) throw new Error(`Inventory Update: ${updateError.message}`);
      } else { // No existing record for this specific plt_num, or no record for product_code at all (if not also filtering by plt_num initially)
         // Check if a general product_code entry exists to sum up, or insert new if not.
         // The original logic implies summing up if product_code exists, or inserting if not.
         // For GRN, each pallet is distinct. We should insert a new inventory record for each pallet_num.
        const { error: insertInvError } = await supabase.from('record_inventory').insert({ 
            product_code: productInfo!.product_code, 
            plt_num: palletNum, // Ensure plt_num is part of the inventory record
            await: netWeight, 
            injection:0, pipeline:0, prebook:0, fold:0, bulk:0, backcarpark:0, // Explicitly set others to 0
            latest_update: currentTimeISO 
        });
        if (insertInvError) throw new Error(`Inventory Insert: ${insertInvError.message}`);
      }
    } catch (error: any) {
      toast.error(`Pallet ${i + 1} (${palletNum}): Inventory update failed: ${error.message}`);
      inventoryUpdateErrorOccurred = true;
      // Continue to prepare other data but this pallet might be problematic
    }

    // Prepare PDF Props
    const grnInputPayload: GrnInputData = {
      grnNumber: form.grnNumber.trim(),
      materialSupplier: form.materialSupplier.trim(),
      productCode: productInfo!.product_code,
      productDescription: productInfo!.description,
      productType: productInfo!.product_type, // This was ProductInfoType.product_type, ensure it's correctly populated
      netWeight: netWeight,
      series: series,
      palletNum: palletNum,
      receivedBy: userId || 'N/A',
    };
    const grnLabelProps = await prepareGrnLabelData(grnInputPayload);
    pdfLabelPropsBatch.push(grnLabelProps);
  }

  if (inventoryUpdateErrorOccurred) {
    toast.error('One or more inventory updates failed. Please check logs. Other DB operations will be attempted.');
    // Decide whether to proceed if inventory fails. For now, we attempt other batch DB ops.
  }

  // --- 3. Batch Database Operations ---
  let dbBatchOpsSuccess = false;
  try {
    if (palletInfoBatch.length > 0) {
      const { error } = await insertPalletInfoRecords(supabase, palletInfoBatch);
      if (error) throw new Error(`Batch PalletInfo Insert Failed: ${error.message}`);
    }
    if (grnIndividualRecordBatch.length > 0) {
      const { error } = await supabase.from('record_grn').insert(grnIndividualRecordBatch);
      if (error) throw new Error(`Batch GRN Record Insert Failed: ${error.message}`);
    }
    if (historyBatch.length > 0) {
      const { error } = await insertHistoryRecords(supabase, historyBatch);
      if (error) throw new Error(`Batch History Insert Failed: ${error.message}`);
    }
    toast.success('Batch database operations completed successfully.');
    dbBatchOpsSuccess = true;
  } catch (error: any) {
    console.error('Error during batch database operations:', error.message);
    toast.error(`Database batch operations failed: ${error.message}`);
    // Do not proceed to PDF generation if DB ops fail
    return;
  }

  if (!dbBatchOpsSuccess) {
    // This case should ideally be caught by errors thrown above and returned.
    toast.error('Database operations did not complete successfully. Halting PDF generation.');
    return;
  }

  // --- 4. PDF Generation and Upload Phase ---
  const pdfBlobs: ArrayBuffer[] = [];
  let allPdfsGeneratedSuccessfully = true;
  setPdfProgress({ current: 0, total: pdfLabelPropsBatch.length, status: Array(pdfLabelPropsBatch.length).fill('Pending') }); // Reset progress for PDF gen

  for (let i = 0; i < pdfLabelPropsBatch.length; i++) {
    const currentPdfProps = pdfLabelPropsBatch[i];
    const palletNumForFile = currentPdfProps.palletNum; // Assuming palletNum is part of the props
    
    setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Processing' : s) }));

    const uploadFileName = `GRN_${palletNumForFile.replace(/\//g, '-')}.pdf`;
    const result = await generateAndUploadPdf({
      pdfProps: currentPdfProps,
      fileName: uploadFileName,
      storagePath: 'grn_labels',
      supabaseClient: supabase
    });

    if (result && result.blob) {
      const arrayBuffer = await result.blob.arrayBuffer();
      pdfBlobs.push(arrayBuffer);
      // Update progress here after successful PDF generation and upload for this item
      setPdfProgress(prev => ({
        ...prev,
        current: prev.current + 1, // Increment current count of processed PDFs
        status: prev.status.map((s, idx) => idx === i ? 'Success' : s)
      }));
    } else {
      allPdfsGeneratedSuccessfully = false;
      console.error(`Error generating PDF for pallet ${palletNumForFile}: PDF blob was not returned or an error occurred.`);
      // Update progress here for failed PDF generation for this item
      setPdfProgress(prev => ({
        ...prev,
        current: prev.current + 1, // Still increment as an attempt was made
        status: prev.status.map((s, idx) => idx === i ? 'Failed' : s)
      }));
    }
  }

  // --- 5. Final Merging and Printing Phase ---
  if (pdfBlobs.length > 0 && pdfBlobs.length === pdfLabelPropsBatch.length && allPdfsGeneratedSuccessfully) {
    toast.success('All GRN labels generated successfully. Preparing to print.');
    try {
      await mergeAndPrintPdfs(pdfBlobs, `Merged_GRN_Labels_${form.grnNumber.trim()}.pdf`);
      toast.success('Merged GRN labels sent to print dialog.');
    } catch (printError) {
      console.error('Error merging or printing GRN PDFs:', printError);
      toast.error('Could not merge or print GRN labels. Download manually if needed.');
    }
  } else if (pdfBlobs.length > 0) {
    toast.warning(`Only ${pdfBlobs.length} of ${pdfLabelPropsBatch.length} PDFs were successful. Attempting to print what was generated.`);
     try {
      await mergeAndPrintPdfs(pdfBlobs, `Partially_Merged_GRN_Labels_${form.grnNumber.trim()}.pdf`);
      toast.info('Partially successful GRN labels sent to print.');
    } catch (printError) {
      console.error('Error merging or printing partial GRN PDFs:', printError);
      toast.error('Could not merge or print partially successful GRN labels.');
    }
  } else if (pdfLabelPropsBatch.length > 0) {
    toast.error('No GRN PDFs were successfully generated to print.');
  }

  // --- 6. Form Reset ---
  // Conditional reset based on overall success might be better, but for now, standard reset after a timeout.
  setTimeout(() => {
    setPdfProgress({ current: 0, total: 0, status: [] });
    setPdfUploadSuccess(false);
    setForm(prevForm => ({ ...prevForm, productCode: '' }));
    setProductInfo(null);
    setProductInfoDisplay(null);
    setProductError(null);
    setPalletType({ whiteDry: '', whiteWet: '', chepDry: '', chepWet: '', euro: '', notIncluded: '' });
    setPackageType({ still: '', bag: '', tote: '', octo: '', notIncluded: '' });
    setGrossWeights(['']);
    console.log('[PrintGrnLabelPage] GRN processing completed, form partially reset.');
  }, 3000);
};

// Modified handlePrintLabel to open dialog
const handlePrintLabel = async () => {
if (!canPrint) { // Ensure form is valid before attempting to open dialog
toast.error('Please fill all required fields and ensure product/supplier details are loaded.');
return;
}
setGrnPrintEventToProceed(true); // Mark that we intend to print
setIsGrnPasswordConfirmOpen(true); // Open the dialog
};

// Handler for password confirmation
const handleGrnPasswordConfirm = async (password: string) => {
if (!userId) {
toast.error('User ID not found. Cannot verify password.');
setIsGrnPasswordConfirmOpen(false);
setGrnPrintEventToProceed(false);
return;
}
const numericUserId = parseInt(userId, 10);
if (isNaN(numericUserId)) {
toast.error('Invalid User ID format. Cannot verify password.');
setIsGrnPasswordConfirmOpen(false);
setGrnPrintEventToProceed(false);
return;
}

setIsGrnVerifyingPassword(true);
const result = await verifyCurrentUserPasswordAction(numericUserId, password);
setIsGrnVerifyingPassword(false);

if (result.success) {
toast.success('Password verified successfully! Proceeding with GRN print.');
setIsGrnPasswordConfirmOpen(false);
if (grnPrintEventToProceed) {
await proceedWithGrnPrint(); // Call the original logic
}
setGrnPrintEventToProceed(false); // Clear the flag
} else {
toast.error(result.error || 'Incorrect password. Please try again.');
}
};

// Handler for password cancellation
const handleGrnPasswordCancel = () => {
setIsGrnPasswordConfirmOpen(false);
setGrnPrintEventToProceed(false);
toast.info('GRN print action cancelled by user.');
};

return (
<>
<PasswordConfirmationDialog
isOpen={isGrnPasswordConfirmOpen}
onOpenChange={setIsGrnPasswordConfirmOpen} // Or handleGrnPasswordCancel if preferred on close via X/overlay
onConfirm={handleGrnPasswordConfirm}
onCancel={handleGrnPasswordCancel}
isLoading={isGrnVerifyingPassword}
title="Confirm GRN Label Print"
description="Please enter your password to proceed with printing GRN labels."
/>
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
<div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
<div className="container mx-auto max-w-screen-xl">
<h1 className="text-3xl font-bold text-center text-orange-500 mb-10">Material Receiving</h1>

<div className="flex flex-col lg:flex-row gap-8">
{/* Left Column */} 
<div className="flex-grow lg:w-2/3 space-y-8">
{/* GRN Detail Card */}
<div className="bg-gray-800 p-6 rounded-lg shadow-xl">
<h2 className="text-xl font-semibold text-orange-400 mb-6">GRN Detail</h2>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label htmlFor="grnNumber" className="block text-sm font-medium mb-1">GRN Number</label>
<input
type="text"
id="grnNumber"
value={form.grnNumber}
onChange={e => handleFormChange('grnNumber', e.target.value)}
className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
placeholder="Please Enter..."
/>
</div>
<div>
<label htmlFor="materialSupplier" className="block text-sm font-medium mb-1">Material Supplier</label>
<input
type="text"
id="materialSupplier"
value={form.materialSupplier}
onChange={e => handleSupplierChange(e.target.value)}
onBlur={e => handleSupplierBlur(e.target.value)}                    
className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
placeholder="Please Enter..."
/>
{supplierError && <p className="text-red-500 text-xs mt-1">{supplierError}</p>}
{supplierInfo && <p className="text-green-400 text-xs mt-1">{supplierInfo}</p>}
</div>
<div className="md:col-span-2">
<label htmlFor="productCode" className="block text-sm font-medium mb-1">Product Code</label>
<input
type="text"
id="productCode"
value={form.productCode}
onChange={e => handleProductCodeChange(e.target.value)}
onBlur={e => handleProductCodeBlur(e.target.value)}
className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
placeholder="Please Enter..."
/>
{productError && <p className="text-red-500 text-xs mt-1">{productError}</p>}
{productInfoDisplay && <p className="text-green-400 text-xs mt-1">{productInfoDisplay}</p>}
</div>
</div>
</div>

{/* Pallet & Package Type Row */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
{/* Pallet Type Card */}
<div className="bg-gray-800 p-6 rounded-lg shadow-xl">
<h2 className="text-xl font-semibold text-orange-400 mb-6">Pallet Type</h2>
<div className="space-y-3">
{Object.entries(palletType).map(([key, value]) => (
<div key={key} className="flex justify-between items-center">
<label htmlFor={`pallet-${key}`} className="text-sm">
{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
</label>
<input
type="number"
id={`pallet-${key}`}
value={value}
onChange={e => handlePalletTypeChange(key as keyof typeof palletType, e.target.value)}
className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-center"
placeholder="Qty"
min="0"
/>
</div>
))}
</div>
</div>

{/* Package Type Card */}
<div className="bg-gray-800 p-6 rounded-lg shadow-xl">
<h2 className="text-xl font-semibold text-orange-400 mb-6">Package Type</h2>
<div className="space-y-3">
{Object.entries(packageType).map(([key, value]) => (
<div key={key} className="flex justify-between items-center">
<label htmlFor={`package-${key}`} className="text-sm">
{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
</label>
<input
type="number"
id={`package-${key}`}
value={value}
onChange={e => handlePackageTypeChange(key as keyof typeof packageType, e.target.value)}
className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 text-center"
placeholder="Qty"
min="0"
/>
</div>
))}
</div>
</div>
</div>
</div>

{/* Right Column */} 
<div className="flex-grow lg:w-1/3">
{/* Print GRN Label Card */}
<div className="bg-gray-800 p-6 rounded-lg shadow-xl sticky top-8">
<h2 className="text-xl font-semibold text-orange-400 mb-6">Print GRN Label</h2>
<div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
{grossWeights.map((weight, idx) => (
<div key={idx} className="flex items-center justify-between">
<label htmlFor={`grossWeight-${idx}`} className="block text-sm font-medium text-gray-300 mr-3 whitespace-nowrap">
Gross Weight / Qty <span className="text-yellow-400">[{getPalletLabel(idx)}]</span>
</label>
<input
type="number"
id={`grossWeight-${idx}`}
ref={idx === grossWeights.length -1 ? grossWeightRef : null} 
value={weight}
onChange={e => handleGrossWeightChange(idx, e.target.value)}
className="p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500 w-28 text-right"
placeholder="Weight/Qty"
/>
</div>
))}
</div>
<button
onClick={handlePrintLabel}
disabled={!canPrint || pdfProgress.status.some(s => s === 'Processing')}
className={`w-full p-3 rounded-md font-semibold transition-colors 
                   ${!canPrint || pdfProgress.status.some(s => s === 'Processing') 
                     ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                     : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
>
{pdfProgress.status.some(s => s === 'Processing') ? 'Processing Labels...' : 'Print GRN Label(s)'}
</button>

{/* PDF Progress UI */}
{pdfProgress.total > 0 && (
<div className="mt-6">
<div className="mb-2 text-xs text-gray-300 flex justify-between">
<span>PDF Generation Progress: {pdfProgress.current} / {pdfProgress.total}</span>
</div>
<div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
<div
className="bg-green-500 h-2.5 rounded-full transition-all duration-300 ease-out"
style={{ width: `${(pdfProgress.current / pdfProgress.total) * 100}%` }}
/>
</div>
<div className="flex flex-wrap gap-1 mt-2">
{pdfProgress.status.map((s, i) => (
<span 
key={i} 
title={`Pallet ${i + 1}: ${s}`}
className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full
                           ${s === 'Success' ? 'bg-green-500 text-white' : 
                             s === 'Failed' ? 'bg-red-500 text-white' : 
                             s === 'Processing' ? 'bg-yellow-500 text-gray-900 animate-pulse' : 
                             'bg-gray-500 text-gray-200'}`
}
>
{s === 'Success' ? '✓' : s === 'Failed' ? '✗' : ''}
</span>
))}
</div>
</div>
)}
{/* End PDF Progress UI */}

{/* Manual PDF Download Button - Removed */}
{/* {latestGeneratedPdfProps && ( */}
{/* <ManualPdfDownloadButton {...latestGeneratedPdfProps} /> */}
{/* )} */}

</div>
</div>
</div>
</div>
</div>
</>
);
} 