'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createClient } from '@/app/utils/supabase/client';
import { prepareQcLabelData, mergeAndPrintPdfs, type QcInputData } from '@/lib/pdfUtils';
import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { 
  createQcDatabaseEntries, 
  createQcDatabaseEntriesWithTransaction,
  uploadPdfToStorage,
  updateAcoOrderRemainQty,
  generatePalletNumbersDirectQuery,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcAcoRecordPayload,
  type QcSlateRecordPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';
import type { ProductInfo, FormData, SlateDetail } from '../types';

interface UseQcLabelBusinessProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productInfo: ProductInfo | null;
  onProductInfoReset?: () => void;
}

export const useQcLabelBusiness = ({
  formData,
  setFormData,
  productInfo,
  onProductInfoReset
}: UseQcLabelBusinessProps) => {
  // 創建客戶端 Supabase 實例用於查詢操作
  const createClientSupabase = useCallback(() => {
    // Use the correct SSR client from utils
    return createClient();
  }, []);

  // Get logged in user ID from Supabase Auth
  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClientSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          // Extract clock number from email (format: clocknumber@pennine.com)
          const clockNumber = user.email.split('@')[0];
          setFormData(prev => ({ ...prev, userId: clockNumber }));
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };

    getUserId();
  }, [setFormData, createClientSupabase]);

  // Fetch available first-off dates for Slate products - REMOVED (no longer needed)
  // Only batch number is required for Slate products now
  useEffect(() => {
    // No additional data fetching needed for Slate products
    // Only batch number input is required
  }, [productInfo?.type, productInfo?.code, setFormData]);

  // Fetch available ACO order refs
  useEffect(() => {
    if (productInfo?.type === 'ACO' && productInfo?.code) {
      const fetchAcoOrderRefs = async () => {
        try {
          console.log('[useQcLabelBusiness] Fetching ACO order refs for product:', productInfo.code);
          const supabaseClient = createClientSupabase();
          const { data, error } = await supabaseClient
            .from('record_aco')
            .select('order_ref, remain_qty, code')
            .eq('code', productInfo.code);

          console.log('[useQcLabelBusiness] ACO query result for product:', { data, error, productCode: productInfo.code });

          if (error) {
            console.error('Error fetching ACO order refs:', error);
            toast.error('Error fetching historical ACO order refs.');
            setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
          } else if (data) {
            console.log('[useQcLabelBusiness] Raw ACO data for product:', data);
            
            // Get all unique order_ref values for this specific product
            // Handle both string and number types for order_ref
            const orderRefs: number[] = data
              .filter((record: any) => record.order_ref !== null && record.order_ref !== undefined)
              .map((record: any) => {
                // Convert to number, handling both string and number inputs
                const orderRef = typeof record.order_ref === 'string' 
                  ? parseInt(record.order_ref, 10) 
                  : Number(record.order_ref);
                return isNaN(orderRef) ? null : orderRef;
              })
              .filter((ref: number | null) => ref !== null) as number[];
            
            const allOrderRefs = Array.from(new Set(orderRefs)).sort((a, b) => a - b);
            
            console.log('[useQcLabelBusiness] Processed order refs for product:', allOrderRefs);
            setFormData(prev => ({ ...prev, availableAcoOrderRefs: allOrderRefs }));
            
            if (allOrderRefs.length > 0) {
              //toast.success(`Loaded ${allOrderRefs.length} ACO order references for ${productInfo.code}.`);
            } else {
              //toast.info(`No ACO order references found for product ${productInfo.code}.`);
            }
          }
        } catch (error) {
          console.error('Error fetching ACO order refs:', error);
          //  toast.error('Error fetching ACO order refs.');
          setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
        }
      };
      fetchAcoOrderRefs();
    } else {
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
    }
  }, [productInfo?.type, productInfo?.code, createClientSupabase, setFormData]);

  // Check if current input quantity exceeds ACO remaining quantity
  const checkAcoQuantityExcess = useCallback(() => {
    if (productInfo?.type !== 'ACO' || !formData.acoOrderRef.trim() || formData.acoNewRef) {
      return false;
    }

    // 安全處理 quantity 和 count - 確保它們是字符串
    const quantityStr = String(formData.quantity || '');
    const countStr = String(formData.count || '');
    
    const quantity = parseInt(quantityStr.trim(), 10);
    const count = parseInt(countStr.trim(), 10);
    
    if (isNaN(quantity) || isNaN(count) || quantity <= 0 || count <= 0) {
      return false;
    }

    const totalPalletQuantity = quantity * count;
    
    // Extract remaining quantity from acoRemain string - updated pattern to match new format
    if (formData.acoRemain && formData.acoRemain.includes('Order Remain Qty for')) {
      const remainQtyMatch = formData.acoRemain.match(/Order Remain Qty for .+: (\d+)/);
      if (remainQtyMatch) {
        const remainingQty = parseInt(remainQtyMatch[1], 10);
        return totalPalletQuantity > remainingQty;
      }
    }
    
    return false;
  }, [productInfo?.type, formData.acoOrderRef, formData.acoNewRef, formData.quantity, formData.count, formData.acoRemain]);

  // ACO Search Logic
  const handleAcoSearch = useCallback(async () => {
    if (!formData.acoOrderRef.trim() || formData.acoOrderRef.trim().length < 5) {
      toast.error('ACO Order Ref must be at least 5 characters.');
      return;
    }

    if (!productInfo?.code) {
      toast.error('Please select a product first before searching ACO order.');
      return;
    }

    console.log('[useQcLabelBusiness] Searching for ACO order:', {
      orderRef: formData.acoOrderRef.trim(),
      productCode: productInfo.code
    });

    setFormData(prev => ({ 
      ...prev, 
      acoSearchLoading: true,
      acoNewRef: false, // Reset new order state
      acoOrderDetails: [], // Clear order details
      acoOrderDetailErrors: [] // Clear errors
    }));

    try {
      const supabaseClient = createClientSupabase();
      const searchOrderRef = formData.acoOrderRef.trim();
      
      // Search for ACO order with both order_ref and product code matching
      const { data, error } = await supabaseClient
        .from('record_aco')
        .select('order_ref, code, remain_qty')
        .or(`order_ref.eq.${searchOrderRef},order_ref.eq."${searchOrderRef}"`)
        .eq('code', productInfo.code);

      console.log('[useQcLabelBusiness] ACO search result:', { 
        data, 
        error, 
        searchOrderRef, 
        productCode: productInfo.code 
      });

      if (error) {
        console.error('Error searching ACO order:', error);
        toast.error('Error searching ACO order.');
        setFormData(prev => ({ ...prev, acoRemain: null }));
        return;
      }

      if (!data || data.length === 0) {
        // New ACO order - no matching order_ref + product_code combination found
        console.log('[useQcLabelBusiness] New ACO order detected for this product');
        setFormData(prev => ({ 
          ...prev, 
          acoNewRef: true,
          acoRemain: `New Order Detected for ${productInfo.code}. Please Enter Order Details Below.`,
          acoOrderDetails: [{ code: productInfo.code, qty: '' }], // Pre-fill with current product code
          acoOrderDetailErrors: [''] // Initialize with one empty error
        }));
        toast.info(`New ACO Order. Please enter order details.`);
      } else {
        // Existing order - calculate total remaining quantity for this specific product
        console.log('[useQcLabelBusiness] Existing ACO order found for this product:', data);
        const totalRemainQty = data.reduce((sum: number, record: any) => {
          const remainQty = typeof record.remain_qty === 'string' 
            ? parseInt(record.remain_qty, 10) 
            : Number(record.remain_qty || 0);
          return sum + (isNaN(remainQty) ? 0 : remainQty);
        }, 0);

        console.log('[useQcLabelBusiness] Total remaining quantity for this product:', totalRemainQty);

        if (totalRemainQty <= 0) {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: `Order Been Fulfilled for ${productInfo.code}`
          }));
          //toast.warning(`This ACO order has been fulfilled for product ${productInfo.code}.`);
        } else {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: `Order Remain Qty for ${productInfo.code}: ${totalRemainQty}`
          }));
          //toast.success(`ACO order found for ${productInfo.code}. Remaining quantity: ${totalRemainQty}`);
        }
      }
    } catch (error) {
      console.error('Error searching ACO order:', error);
      toast.error('Error searching ACO order.');
      setFormData(prev => ({ ...prev, acoRemain: null }));
    } finally {
      setFormData(prev => ({ ...prev, acoSearchLoading: false }));
    }
  }, [formData.acoOrderRef, productInfo, createClientSupabase, setFormData]);

  // ACO Order Detail Change
  const handleAcoOrderDetailChange = useCallback((idx: number, key: 'code' | 'qty', value: string) => {
    setFormData(prev => {
      const newDetails = [...prev.acoOrderDetails];
      newDetails[idx] = { ...newDetails[idx], [key]: value };
      return { ...prev, acoOrderDetails: newDetails };
    });
  }, [setFormData]);

  // ACO Product Code Validation
  const validateAcoProductCode = useCallback(async (code: string, idx: number) => {
    if (!code.trim()) {
      setFormData(prev => {
        const newErrors = [...prev.acoOrderDetailErrors];
        newErrors[idx] = '';
        return { ...prev, acoOrderDetailErrors: newErrors };
      });
      return;
    }

    try {
      // Use the same RPC function as ProductCodeInput
      const { data, error } = await createClientSupabase().rpc('get_product_details_by_code', { 
        p_code: code.trim() 
      });

      if (error || !data || data.length === 0) {
        setFormData(prev => {
          const newErrors = [...prev.acoOrderDetailErrors];
          newErrors[idx] = `Product code ${code} not found.`;
          return { ...prev, acoOrderDetailErrors: newErrors };
        });
      } else {
        const productData = data[0];
        
        // Check if product type is ACO
        if (productData.type !== 'ACO') {
          setFormData(prev => {
            const newErrors = [...prev.acoOrderDetailErrors];
            newErrors[idx] = `Product ${code} is not an ACO product. Only ACO products are allowed in ACO orders.`;
            return { ...prev, acoOrderDetailErrors: newErrors };
          });
        } else {
          // Product is valid ACO type, standardize the code and clear error
          setFormData(prev => {
            const newErrors = [...prev.acoOrderDetailErrors];
            newErrors[idx] = '';
            
            // Update the product code to the standardized version from database
            const newDetails = [...prev.acoOrderDetails];
            newDetails[idx] = { ...newDetails[idx], code: productData.code };
            
            return { 
              ...prev, 
              acoOrderDetailErrors: newErrors,
              acoOrderDetails: newDetails
            };
          });
          
          // toast.success(`Product ${productData.code} validated as ACO product.`);
        }
      }
    } catch (error) {
      console.error('Error validating product code:', error);
      setFormData(prev => {
        const newErrors = [...prev.acoOrderDetailErrors];
        newErrors[idx] = 'Error validating product code. Please try again.';
        return { ...prev, acoOrderDetailErrors: newErrors };
      });
      toast.error('Error validating product code.');
    }
  }, [createClientSupabase, setFormData]);

  // ACO Order Detail Update
  const handleAcoOrderDetailUpdate = useCallback(async () => {
    // Add a new empty row for additional products
    setFormData(prev => ({
      ...prev,
      acoOrderDetails: [...prev.acoOrderDetails, { code: '', qty: '' }],
      acoOrderDetailErrors: [...prev.acoOrderDetailErrors, '']
    }));
    //toast.success('New product row added. You can now enter additional products for this ACO order.');
  }, [setFormData]);

  // Slate batch number change handler - simplified to only handle batch number
  const handleSlateBatchNumberChange = useCallback((batchNumber: string) => {
    // Only update batch number, no auto-fill material
    setFormData(prev => ({
      ...prev,
      slateDetail: {
        ...prev.slateDetail,
        batchNumber: batchNumber
      }
    }));
  }, [setFormData]);

  // General Slate detail change handler - simplified
  const handleSlateDetailChange = useCallback((field: keyof SlateDetail, value: string) => {
    if (field === 'batchNumber') {
      handleSlateBatchNumberChange(value);
    } else {
      // For other fields, just update normally without special logic
      setFormData(prev => ({
        ...prev,
        slateDetail: {
          ...prev.slateDetail,
          [field]: value
        }
      }));
    }
  }, [setFormData, handleSlateBatchNumberChange]);

  // Clock number confirmation state
  const [isClockConfirmOpen, setIsClockConfirmOpen] = useState(false);
  const [printEventToProceed, setPrintEventToProceed] = useState<React.FormEvent | null>(null);
  
  // State for preventing duplicate submissions
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);

  // Main print logic
  const handlePrintLabel = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store the event and open clock number confirmation
    setPrintEventToProceed(e);
    setIsClockConfirmOpen(true);
  }, []);

  // Handle clock number confirmation
  const handleClockNumberConfirm = useCallback(async (clockNumber: string) => {
    setIsClockConfirmOpen(false);
    
    // Prevent duplicate submissions
    const currentTime = Date.now();
    const timeSinceLastSubmission = currentTime - lastSubmissionTime;
    
    if (isProcessing) {
      toast.warning('Processing in progress. Please wait...');
      setPrintEventToProceed(null);
      return;
    }
    
    if (timeSinceLastSubmission < 3000) { // 3 seconds cooldown
      toast.warning('Please wait a moment before submitting again to prevent duplicate pallet numbers.');
      setPrintEventToProceed(null);
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    setLastSubmissionTime(currentTime);
    
    // 安全處理字符串轉換
    const quantityStr = String(formData.quantity || '');
    const countStr = String(formData.count || '');
    
    if (!productInfo || !formData.productCode.trim() || !quantityStr.trim() || !countStr.trim()) {
      toast.error('Product info, quantity, or count is missing.');
      setIsProcessing(false);
      setPrintEventToProceed(null);
      return;
    }

    const quantity = parseInt(quantityStr.trim(), 10);
    const count = parseInt(countStr.trim(), 10);

    if (isNaN(quantity) || quantity <= 0 || isNaN(count) || count <= 0) {
      toast.error('Please enter valid quantity and count values.');
      setIsProcessing(false);
      setPrintEventToProceed(null);
      return;
    }

    try {
      // Initialize progress
      setFormData(prev => ({
        ...prev,
        pdfProgress: {
          current: 0,
          total: count,
          status: Array(count).fill('Pending')
        }
      }));

      // 使用直接查詢數據庫的方式生成棧板號碼和系列號（無緩存）
      console.log('[useQcLabelBusiness] 使用直接查詢數據庫生成棧板號碼和系列號（無緩存）...');
      
      let generationResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      // Retry mechanism for pallet number generation
      while (retryCount < maxRetries) {
        generationResult = await generatePalletNumbersDirectQuery(count);
        
        if (!generationResult.error) {
          break; // Success, exit retry loop
        }
        
        retryCount++;
        console.warn(`[useQcLabelBusiness] Pallet generation attempt ${retryCount} failed:`, generationResult.error);
        
        if (retryCount < maxRetries) {
          toast.warning(`Pallet generation failed (attempt ${retryCount}/${maxRetries}). Retrying...`);
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          toast.error(`Failed to generate pallet numbers after ${maxRetries} attempts: ${generationResult.error}`);
          setIsProcessing(false);
          setPrintEventToProceed(null);
          return;
        }
      }
      
      const { palletNumbers: generatedPalletNumbers, series: generatedSeries } = generationResult!;

      if (generatedPalletNumbers.length !== count || generatedSeries.length !== count) {
        toast.error('Failed to generate unique pallet numbers or series. Please try again.');
        setIsProcessing(false);
        setPrintEventToProceed(null);
        return;
      }

      const collectedPdfBlobs: Blob[] = [];
      let anyFailure = false;
      
      // For ACO orders, get the initial pallet count once (using client)
      let initialAcoPalletCount = 0;
      if (productInfo.type === 'ACO' && formData.acoOrderRef.trim()) {
        const supabaseClient = createClientSupabase();
        initialAcoPalletCount = await getAcoPalletCount(supabaseClient, formData.acoOrderRef.trim());
      }
      
      // For new ACO orders, create ACO records only once (not per pallet)
      let acoRecordsCreated = false;

      // Process each pallet
      for (let i = 0; i < count; i++) {
        // Update progress
        setFormData(prev => ({
          ...prev,
          pdfProgress: {
            ...prev.pdfProgress,
            current: i + 1,
            status: prev.pdfProgress.status.map((s, idx) => idx === i ? 'Processing' : s)
          }
        }));

        const palletNum = generatedPalletNumbers[i];
        const series = generatedSeries[i];

        try {
          // Prepare database payload
          const palletInfoRecord: QcPalletInfoPayload = {
            plt_num: palletNum,
            series: series,
            product_code: productInfo.code,
            product_qty: quantity,
            plt_remark: productInfo.type === 'ACO' && formData.acoOrderRef.trim() 
              ? `Finished In Production ACO Ref : ${formData.acoOrderRef.trim()}`
              : productInfo.type === 'Slate' && formData.slateDetail.batchNumber.trim()
              ? `Finished In Production Batch Num : ${formData.slateDetail.batchNumber.trim()}`
              : 'Finished In Production'
          };

          // Calculate ACO pallet count for this specific pallet
          let acoPalletCount = 0;
          let acoDisplayText = '';
          if (productInfo.type === 'ACO' && formData.acoOrderRef.trim()) {
            acoPalletCount = initialAcoPalletCount + i; // Each pallet gets incremental count
            acoDisplayText = `${formData.acoOrderRef.trim()} - ${getOrdinalSuffix(acoPalletCount)} Pallet`;
          }

          const historyRecord: QcHistoryPayload = {
            time: new Date().toISOString(),
            id: clockNumber,
            action: 'Finished QC',
            plt_num: palletNum,
            loc: 'Await',
            remark: productInfo.type === 'ACO' && formData.acoOrderRef.trim()
              ? `ACO Ref : ${formData.acoOrderRef.trim()}`
              : productInfo.type === 'Slate' && formData.slateDetail.batchNumber.trim()
              ? `Batch Num : ${formData.slateDetail.batchNumber.trim()}`
              : formData.operator || '-'
          };

          const inventoryRecord: QcInventoryPayload = {
            product_code: productInfo.code,
            plt_num: palletNum,
            await: quantity
          };

          const acoRecords: QcAcoRecordPayload[] = [];
          const slateRecords: QcSlateRecordPayload[] = [];

          // Handle product type specific records
          if (productInfo.type === 'ACO' && formData.acoNewRef && formData.acoOrderRef.trim() && !acoRecordsCreated) {
            // Create ACO records only once for the first pallet
            formData.acoOrderDetails.forEach((detail, idx) => {
              // Only create records for valid products (no errors and both fields filled)
              if (detail.code.trim() && 
                  detail.qty.trim() && 
                  !formData.acoOrderDetailErrors[idx]) {
                const requiredQty = parseInt(detail.qty.trim(), 10);
                if (!isNaN(requiredQty) && requiredQty > 0) {
                  // Calculate remain_qty correctly: only subtract quantity for the current product being printed
                  const currentProductQuantityUsed = detail.code.trim() === productInfo.code ? (quantity * count) : 0;
                  
                  acoRecords.push({
                    order_ref: parseInt(formData.acoOrderRef.trim(), 10),
                    code: detail.code.trim(),
                    required_qty: requiredQty,
                    remain_qty: requiredQty - currentProductQuantityUsed // Only subtract if this is the current product
                  });
                  
                  console.log(`[useQcLabelBusiness] Creating ACO record for ${detail.code.trim()}:`, {
                    required_qty: requiredQty,
                    quantity_used: currentProductQuantityUsed,
                    remain_qty: requiredQty - currentProductQuantityUsed,
                    is_current_product: detail.code.trim() === productInfo.code
                  });
                }
              }
            });
            acoRecordsCreated = true; // Mark as created to avoid duplicates
          } else if (productInfo.type === 'Slate') {
            // Slate products no longer write to record_slate table
            // Only write to the main tables: record_pallet_info, record_history, record_inventory
          }

          // Create database entries using server action with transaction
          const dbPayload: QcDatabaseEntryPayload = {
            palletInfo: palletInfoRecord,
            historyRecord: historyRecord,
            inventoryRecord: inventoryRecord,
            acoRecords: acoRecords.length > 0 ? acoRecords : undefined,
            slateRecords: slateRecords.length > 0 ? slateRecords : undefined
          };

          // Prepare ACO update info for existing orders
          let acoUpdateInfo = undefined;
          if (productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef.trim() && i === 0) {
            // Only update ACO remain_qty once for the first pallet
            acoUpdateInfo = {
              orderRef: parseInt(formData.acoOrderRef.trim(), 10),
              productCode: productInfo.code,
              quantityUsed: quantity * count // Total quantity for all pallets
            };
          }

          const dbResult = await createQcDatabaseEntriesWithTransaction(dbPayload, clockNumber, acoUpdateInfo);
          
          if (dbResult.error) {
            // Check if it's a duplicate pallet number error
            if (dbResult.error.includes('already exists') || dbResult.error.includes('duplicate')) {
              console.error(`[useQcLabelBusiness] Duplicate pallet number detected for ${palletNum}:`, dbResult.error);
              console.error(`[useQcLabelBusiness] This indicates a race condition or stale pallet number. Stopping all processing.`);
              
              toast.error(`Duplicate pallet number ${palletNum} detected. This may be due to rapid clicking or a system issue. Please wait a moment and try again.`);
              
              // Stop processing immediately and reset form to allow retry
              setFormData(prev => ({
                ...prev,
                pdfProgress: {
                  current: 0,
                  total: 0,
                  status: []
                }
              }));
              setIsProcessing(false);
              setPrintEventToProceed(null);
              return;
            }
            
            throw new Error(`Database operation failed: ${dbResult.error}`);
          }

          // Prepare QC label data
          const qcInput: QcInputData = {
            productCode: productInfo.code,
            productDescription: productInfo.description,
            quantity: quantity,
            series: series,
            palletNum: palletNum,
            operatorClockNum: formData.operator || '-',
            qcClockNum: clockNumber,
            workOrderNumber: productInfo.type === 'ACO' && acoDisplayText 
              ? acoDisplayText 
              : formData.acoOrderRef || undefined,
            workOrderName: productInfo.type === 'ACO' ? 'ACO Order' : undefined,
            productType: productInfo.type
          };

          const pdfLabelProps = await prepareQcLabelData(qcInput);

          // Generate PDF blob
          const pdfElement = <PrintLabelPdf {...pdfLabelProps} />;
          const pdfBlob = await pdf(pdfElement).toBlob();
          
          if (!pdfBlob) {
            throw new Error('PDF generation failed to return a blob.');
          }

          // Convert blob to ArrayBuffer and then to number array for server action
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          const pdfUint8Array = new Uint8Array(pdfArrayBuffer);
          const pdfNumberArray = Array.from(pdfUint8Array);

          // Upload PDF using server action
          const fileName = `${palletNum.replace('/', '_')}.pdf`;
          const uploadResult = await uploadPdfToStorage(pdfNumberArray, fileName, 'qc-labels');

          if (uploadResult.error) {
            throw new Error(`PDF upload failed: ${uploadResult.error}`);
          }

          if (uploadResult.publicUrl) {
            collectedPdfBlobs.push(pdfBlob);
            
            // Update progress to success
            setFormData(prev => ({
              ...prev,
              pdfProgress: {
                ...prev.pdfProgress,
                status: prev.pdfProgress.status.map((s, idx) => idx === i ? 'Success' : s)
              }
            }));
          } else {
            throw new Error('PDF upload succeeded but no public URL returned.');
          }

        } catch (error: any) {
          console.error(`Error processing pallet ${i + 1}:`, error);
          toast.error(`Pallet ${i + 1} (${palletNum}) Error: ${error.message}. Skipping.`);
          
          // Update progress to failed
          setFormData(prev => ({
            ...prev,
            pdfProgress: {
              ...prev.pdfProgress,
              status: prev.pdfProgress.status.map((s, idx) => idx === i ? 'Failed' : s)
            }
          }));
          
          anyFailure = true;
          continue;
        }
      }

      // Handle PDF printing
      if (collectedPdfBlobs.length > 0) {
        const pdfArrayBuffers = await Promise.all(collectedPdfBlobs.map(blob => blob.arrayBuffer()));
        let printFileName = '';

        if (collectedPdfBlobs.length === 1) {
          const firstPalletNum = generatedPalletNumbers[0];
          const seriesForName = generatedSeries[0];
          printFileName = `QCLabel_${productInfo.code}_${firstPalletNum.replace('/', '_')}_${seriesForName}.pdf`;
        } else {
          const firstPalletNumForName = generatedPalletNumbers[0].replace('/', '_');
          printFileName = `QCLabels_Merged_${productInfo.code}_${firstPalletNumForName}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;
        }

        try {
          await mergeAndPrintPdfs(pdfArrayBuffers, printFileName);
          // ============================================================================
          // NEW FUNCTIONALITY: Update stock_level and work_level after successful print
          // ============================================================================
          try {
            console.log('[useQcLabelBusiness] Updating stock and work levels...');
            
            // Calculate total quantity for all pallets
            const totalQuantity = quantity * count;
            
            // Get user ID from clock number
            const userIdNum = parseInt(clockNumber, 10);
            
            if (isNaN(userIdNum)) {
              console.error('Invalid user ID (clock number):', clockNumber);
              toast.warning('Print successful, but failed to update work records due to invalid user ID.');
            } else {
              // Call the new API endpoint for stock and work level updates
              const response = await fetch('/api/print-label-updates', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  productCode: productInfo.code,
                  quantity: totalQuantity,
                  userId: userIdNum,
                  palletCount: count,
                  description: productInfo.description
                }),
              });

              const updateResult = await response.json();

              if (updateResult.success) {
                console.log('[useQcLabelBusiness] Stock and work levels updated successfully:', updateResult);
                //toast.success('Stock and work levels updated successfully.');
              } else {
                console.error('[useQcLabelBusiness] Failed to update stock/work levels:', updateResult.error);
                toast.warning(`Print successful, but failed to update records: ${updateResult.error}`);
              }
            }
          } catch (updateError: any) {
            console.error('[useQcLabelBusiness] Error updating stock/work levels:', updateError);
            toast.warning(`Print successful, but failed to update stock/work records: ${updateError.message}`);
          }
          
          // ============================================================================
          // ACO ORDER ENHANCEMENT: Update ACO order with latest_update and check completion
          // ============================================================================
          console.log('[useQcLabelBusiness] ACO Enhancement Check:', {
            productType: productInfo.type,
            isNewRef: formData.acoNewRef,
            orderRef: formData.acoOrderRef.trim(),
            shouldTrigger: productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef.trim()
          });
          
          if (productInfo.type === 'ACO' && !formData.acoNewRef && formData.acoOrderRef.trim()) {
            try {
              console.log('[useQcLabelBusiness] Processing ACO order enhancement...');
              
              const totalQuantity = quantity * count;
              const orderRefNum = parseInt(formData.acoOrderRef.trim(), 10);
              
              // Call the enhanced ACO order update API
              const acoResponse = await fetch('/api/aco-order-updates', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderRef: orderRefNum,
                  productCode: productInfo.code,
                  quantityUsed: totalQuantity
                }),
              });

              const acoResult = await acoResponse.json();

              if (acoResult.success) {
                console.log('[useQcLabelBusiness] ACO order updated successfully:', acoResult);
                
                if (acoResult.orderCompleted) {
                  // Order completed - show special notification
                  toast.success(`🎉 ACO Order ${orderRefNum} has been completed! Email notification sent.`);
                  
                  if (acoResult.emailNotification?.success) {
                    console.log('[useQcLabelBusiness] Email notification sent successfully');
                  } else {
                    console.warn('[useQcLabelBusiness] Email notification failed:', acoResult.emailNotification?.error);
                    toast.warning('Order completed but email notification failed.');
                  }
                } else {
                  // Order updated but not completed
                  const remainingQty = acoResult.totalRemainingInOrder;
                  toast.success(`ACO Order ${orderRefNum} updated. Remaining quantity: ${remainingQty}`);
                }
              } else {
                console.error('[useQcLabelBusiness] Failed to update ACO order:', acoResult.error);
                toast.warning(`Print successful, but ACO order update failed: ${acoResult.error}`);
              }
            } catch (acoError: any) {
              console.error('[useQcLabelBusiness] Error processing ACO order enhancement:', acoError);
              toast.warning(`Print successful, but ACO order processing failed: ${acoError.message}`);
            }
          }
          // ============================================================================
          
          // Final success message
          toast.success(`${collectedPdfBlobs.length} QC label(s) generated and ready for printing.`);
          
        } catch (printError: any) {
          toast.error(`PDF Printing Error: ${printError.message}`);
        }
      } else {
        if (!anyFailure) {
          toast.error('No valid labels to process. No PDF generated for printing.');
        } else {
          toast.warning('Processing finished. Some labels failed. No PDFs generated for printing.');
        }
      }

      // Reset form after successful processing
      if (collectedPdfBlobs.length > 0) {
        setFormData(prev => ({
          ...prev,
          productCode: '',
          quantity: '',
          count: '',
          operator: '',
          acoOrderRef: '',
          acoOrderDetails: [],
          acoNewRef: false,
          acoNewProductCode: '',
          acoNewOrderQty: '',
          acoRemain: null,
          acoOrderDetailErrors: [],
          acoSearchLoading: false,
          availableAcoOrderRefs: [],
          productError: null,
          isLoading: false,
          pdfProgress: {
            current: 0,
            total: 0,
            status: []
          },
          slateDetail: {
            batchNumber: ''
          }
        }));
        
        // Reset productInfo in parent component
        if (onProductInfoReset) {
          onProductInfoReset();
        }
      }

    } catch (error: any) {
      console.error('Error during print process:', error);
      toast.error(`Print process failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setPrintEventToProceed(null);
    }
  }, [productInfo, formData, setFormData, onProductInfoReset, createClientSupabase]);

  // Handle clock number confirmation cancel
  const handleClockNumberCancel = useCallback(() => {
    setIsClockConfirmOpen(false);
    setPrintEventToProceed(null);
  }, []);

  // Computed values
  const canSearchAco = formData.acoOrderRef.trim().length >= 5;
  
  // Check if ACO order is fulfilled
  const isAcoOrderFulfilled = (() => {
    if (productInfo?.type === 'ACO' && formData.acoRemain) {
      return formData.acoRemain.includes('Order Been Fulfilled for');
    }
    return false;
  })();

  // Check if ACO order details are incomplete
  const isAcoOrderIncomplete = (() => {
    if (productInfo?.type !== 'ACO') {
      return false;
    }

    // If no ACO order reference is provided
    if (!formData.acoOrderRef.trim()) {
      return true;
    }

    // If ACO order reference is provided but no search has been performed
    if (formData.acoOrderRef.trim().length >= 5 && !formData.acoRemain) {
      return true;
    }

    // If it's a new ACO order but no order details are provided
    if (formData.acoNewRef) {
      const validOrderDetails = formData.acoOrderDetails.filter((detail, idx) => 
        detail.code.trim() && 
        detail.qty.trim() && 
        !formData.acoOrderDetailErrors[idx] && // No validation errors
        !isNaN(parseInt(detail.qty.trim())) && 
        parseInt(detail.qty.trim()) > 0
      );
      
      if (validOrderDetails.length === 0) {
        return true;
      }
      
      // Check if there are any validation errors in the order details
      const hasValidationErrors = formData.acoOrderDetailErrors.some(error => error.trim() !== '');
      if (hasValidationErrors) {
        return true;
      }
    }

    return false;
  })();
  
  const isAcoOrderExcess = (() => {
    if (productInfo?.type === 'ACO' && formData.acoRemain && formData.acoRemain.includes('Order Remain Qty for')) {
      const match = formData.acoRemain.match(/Order Remain Qty for .+: (\d+)/);
      if (match) {
        const acoRemainQty = parseInt(match[1], 10);
        // 安全處理 quantity 和 count - 確保它們是字符串
        const quantityStr = String(formData.quantity || '');
        const countStr = String(formData.count || '');
        const quantityPerPallet = parseInt(quantityStr.trim(), 10);
        const palletCount = parseInt(countStr.trim(), 10);

        if (!isNaN(acoRemainQty) && !isNaN(quantityPerPallet) && !isNaN(palletCount)) {
          return (quantityPerPallet * palletCount) > acoRemainQty;
        }
      }
    }
    return false;
  })();

  return {
    // ACO handlers
    handleAcoSearch,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess,

    // Slate handlers
    handleSlateDetailChange,

    // Print handlers
    handlePrintLabel,
    handleClockNumberConfirm,
    handleClockNumberCancel,

    // Clock number confirmation state
    isClockConfirmOpen,

    // Processing state
    isProcessing,

    // Computed values
    canSearchAco,
    isAcoOrderExcess,
    isAcoOrderFulfilled,
    isAcoOrderIncomplete
  };
};

// Helper function to generate ordinal numbers (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return `${num}st`;
  }
  if (j === 2 && k !== 12) {
    return `${num}nd`;
  }
  if (j === 3 && k !== 13) {
    return `${num}rd`;
  }
  return `${num}th`;
}

// Helper function to get ACO pallet count for a specific order ref
async function getAcoPalletCount(supabase: any, acoOrderRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('record_history')
      .select('id')
      .like('remark', `ACO Ref : ${acoOrderRef}%`);
    
    if (error) {
      console.error('Error fetching ACO pallet count:', error);
      return 1; // Start from 1 if error
    }
    
    return (data?.length || 0) + 1; // Return the next pallet number
  } catch (error) {
    console.error('Error in getAcoPalletCount:', error);
    return 1; // Start from 1 if error
  }
}