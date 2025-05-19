"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import { PrintLabelPdf } from '../../components/print-label-pdf';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';

import { prepareGrnLabelData, GrnInputData, mergeAndPrintPdfs, generateAndUploadPdf } from '../../lib/pdfUtils';
import { PrintLabelPdfProps } from '../../components/print-label-pdf/PrintLabelPdf'; 
import { generateUniqueSeries as generateSingleUniqueSeries } from '../../lib/seriesUtils'; 
import { generatePalletNumbers } from '../../lib/palletNumUtils'; 
import { PasswordConfirmationDialog } from '../../components/ui/PasswordConfirmationDialog'; 
import { verifyCurrentUserPasswordAction } from '../../app/actions/authActions'; 
import { createGrnDatabaseEntries, type GrnPalletInfoPayload, type GrnRecordPayload } from '../../app/actions/grnActions';

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
tote: 10,
octo: 20,
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

// Helper function to parse count values, ensuring empty strings or non-numbers become 0
const parseCountValue = (valueStr: string | undefined): number => {
  if (valueStr === undefined || valueStr.trim() === '') {
    return 0; // Or perhaps null/undefined if the database column allows and 0 is a valid distinct value
  }
  const val = parseFloat(valueStr); // Use parseFloat to correctly parse decimals
  return isNaN(val) ? 0 : val; // Return the parsed float value, or 0 if NaN
};

const proceedWithGrnPrint = async () => {
    if (!productInfo || !form.materialSupplier.trim() || !userId) { 
      toast.error('Product info, Material Supplier code, or User ID is missing.');
      setIsGrnPasswordConfirmOpen(false);
      setGrnPrintEventToProceed(false);
      return;
    }

    const filledGrossWeights = grossWeights.map(gw => gw.trim()).filter(gw => gw !== '');
    if (filledGrossWeights.length === 0) {
      toast.error('Please enter at least one gross weight.');
      setIsGrnPasswordConfirmOpen(false);
      setGrnPrintEventToProceed(false);
      return;
    }
    
    const numberOfPalletsToProcess = filledGrossWeights.length;
    const palletCountForGrnRecord = Object.values(palletType).reduce((sum, v) => sum + parseCountValue(v), 0);
    const packageCountForGrnRecord = Object.values(packageType).reduce((sum, v) => sum + parseCountValue(v), 0);
    const selectedPalletTypeString = Object.entries(palletType).find(([, value]) => parseCountValue(value) > 0)?.[0] || 'notIncluded';
    const selectedPackageTypeString = Object.entries(packageType).find(([, value]) => parseCountValue(value) > 0)?.[0] || 'notIncluded';

    setPdfProgress({ current: 0, total: numberOfPalletsToProcess, status: Array(numberOfPalletsToProcess).fill('Pending') });
    const collectedPdfBlobs: Blob[] = [];
    const collectedPdfLabelProps: PrintLabelPdfProps[] = [];
    let anyFailure = false;

    // Pass supabase client to generatePalletNumbers and generateSingleUniqueSeries
    const generatedPalletNumbersList = await generatePalletNumbers(supabase, numberOfPalletsToProcess);
    const uniqueSeriesNumbersList = await Promise.all(
      Array(numberOfPalletsToProcess).fill(null).map(() => generateSingleUniqueSeries(supabase))
    );
    // Store successfully generated series for filename usage
    const successfullyGeneratedSeries: string[] = []; 

    if (generatedPalletNumbersList.length !== numberOfPalletsToProcess || uniqueSeriesNumbersList.filter(s => s).length !== numberOfPalletsToProcess) {
        toast.error('Failed to generate unique pallet numbers or series. Please try again.');
        setIsGrnPasswordConfirmOpen(false);
        setGrnPrintEventToProceed(false);
        return;
    }

    for (let i = 0; i < numberOfPalletsToProcess; i++) {
      setPdfProgress(prev => ({ ...prev, current: i + 1, status: prev.status.map((s, idx) => idx === i ? 'Processing' : s) }));
      
      const currentGrossWeightStr = filledGrossWeights[i];
      const currentGrossWeight = parseFloat(currentGrossWeightStr);
      if (isNaN(currentGrossWeight) || currentGrossWeight <= 0) {
        toast.error(`Pallet ${i + 1} GW Error: ${currentGrossWeightStr}. Skipping.`);
        setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
        anyFailure = true;
        continue; 
      }

      const palletWeight = PALLET_WEIGHT[selectedPalletTypeString] || 0;
      const packageWeight = PACKAGE_WEIGHT[selectedPackageTypeString] || 0;
      const netWeight = currentGrossWeight - palletWeight - packageWeight; // netWeight is a number

      if (netWeight <= 0) {
        toast.error(`Pallet ${i + 1} NW Error: ${netWeight}kg. Skipping.`);
        setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
        anyFailure = true;
        continue;
      }
      
      const palletNum = generatedPalletNumbersList[i];
      const series = uniqueSeriesNumbersList[i];

      if (!palletNum || !series) {
        toast.error(`Pallet ${i + 1} ID Error. Skipping.`);
        setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
        anyFailure = true;
        continue;
      }

      const palletInfoData: GrnPalletInfoPayload = {
        plt_num: palletNum,
        series: series,
        product_code: productInfo.product_code,
        product_qty: Math.round(netWeight), 
        plt_remark: `Material GRN- ${form.grnNumber}`,
      };

      const grnRecordData: GrnRecordPayload = {
        grn_ref: form.grnNumber,
        material_code: productInfo.product_code,
        sup_code: form.materialSupplier, 
        plt_num: palletNum,
        gross_weight: currentGrossWeight,
        net_weight: netWeight, // netWeight is a number here
        pallet_count: palletCountForGrnRecord, 
        package_count: packageCountForGrnRecord, 
        pallet: selectedPalletTypeString, 
        package: selectedPackageTypeString, 
      };
      
      try {
        const actionResult = await createGrnDatabaseEntries({ 
          palletInfo: palletInfoData, 
          grnRecord: grnRecordData 
        }, userId);

        if (actionResult.error) {
          toast.error(`Pallet ${i + 1} DB Error: ${actionResult.error}. Skipping PDF.`);
          setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
          anyFailure = true;
          continue; 
        } else {
          if(actionResult.warning){
            toast.warning(`Pallet ${i + 1} DB: ${actionResult.warning}`);
          } else {
            //toast.success(`Pallet ${i + 1} DB entries created.`);
          }

          const grnInput: GrnInputData = {
            grnNumber: form.grnNumber,
            materialSupplier: form.materialSupplier, 
            productCode: productInfo.product_code,
            productDescription: productInfo.description,
            productType: productInfo.product_type,
            netWeight: netWeight, 
            series: series,
            palletNum: palletNum,
            receivedBy: userId,
          };
          const pdfLabelProps = await prepareGrnLabelData(grnInput);
          collectedPdfLabelProps.push(pdfLabelProps); 
          successfullyGeneratedSeries.push(series); // Store the series used for this PDF
          
          try {
            const uploadResult = await generateAndUploadPdf({
              pdfProps: pdfLabelProps,
              storagePath: 'grn-labels',
              supabaseClient: supabase
            });

            if (uploadResult && uploadResult.blob) {
              collectedPdfBlobs.push(uploadResult.blob);
              //toast.success(`Pallet ${i + 1} (${palletNum}): PDF generated and uploaded.`);
              setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Success' : s) }));
            } else {
              throw new Error('PDF generation or upload failed to return a blob.');
            }
          } catch (uploadError: any) {
            toast.error(`Pallet ${i + 1} (${palletNum}) PDF/Upload Error: ${uploadError.message}. Skipping.`);
            setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
            anyFailure = true;
            continue; // Skip to next pallet if PDF generation/upload fails
          }
        }
      } catch (e:any) {
        toast.error(`Pallet ${i + 1} Unexpected DB or Prep Error: ${e.message}. Skipping PDF.`);
        setPdfProgress(prev => ({ ...prev, status: prev.status.map((s, idx) => idx === i ? 'Failed' : s) }));
        anyFailure = true;
        continue;
      }
    } 

    if (collectedPdfBlobs.length > 0) {
      const pdfArrayBuffers = await Promise.all(collectedPdfBlobs.map(blob => blob.arrayBuffer()));
      let printFileName = '';

      if (collectedPdfBlobs.length === 1) {
        const firstPalletNum = generatedPalletNumbersList.find(p => p !== null && p !== undefined) || 'single_GRN_Pallet';
        const seriesForName = successfullyGeneratedSeries.length > 0 ? successfullyGeneratedSeries[0] : 'single_GRN_Series';
        printFileName = `GRNLabel_${form.grnNumber}_${firstPalletNum.replace('/','_')}_${seriesForName}.pdf`;
        //toast.success(`Single PDF prepared for printing: ${printFileName}`);
      } else { 
        const firstPalletNumForName = generatedPalletNumbersList.length > 0 ? generatedPalletNumbersList[0].replace('/','_') : 'GRN_Pallets';
        printFileName = `GRNLabels_Merged_${form.grnNumber}_${firstPalletNumForName}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;
        //toast.success(`${collectedPdfBlobs.length} PDFs prepared for merged printing: ${printFileName}`);
      }
      
      try {
        await mergeAndPrintPdfs(pdfArrayBuffers, printFileName);
      } catch (printError: any) {
          toast.error(`PDF Printing Error: ${printError.message}`);
      }

    } else {
      if (!anyFailure) { 
        toast.error('No valid gross weights to process. No PDF generated for printing.');
      } else { 
         toast.warning('Processing finished. Some pallets failed. No PDFs generated for printing.');
      }
    }
    
    setGrossWeights(['']); 

    // Clear Product Code and related states
    setForm(prevForm => ({ ...prevForm, productCode: '' }));
    setProductInfo(null);
    setProductInfoDisplay(null);
    setProductError(null); // Also clear any product error

    // Clear Pallet Type state
    setPalletType({
      whiteDry: '',
      whiteWet: '',
      chepDry: '',
      chepWet: '',
      euro: '',
      notIncluded: '',
    });

    // Clear Package Type state
    setPackageType({
      still: '',
      bag: '',
      tote: '',
      octo: '',
      notIncluded: '',
    });

    setIsGrnPasswordConfirmOpen(false);
    setGrnPrintEventToProceed(false);
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
</div>
</div>
</div>
</div>
</div>
</>
);
} 