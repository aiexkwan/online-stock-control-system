'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { generatePalletNumbers } from '@/lib/palletNumUtils';
import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';
import { prepareQcLabelData, mergeAndPrintPdfs, type QcInputData } from '@/lib/pdfUtils';
import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
import { 
  createQcDatabaseEntries, 
  createQcDatabaseEntriesWithTransaction,
  uploadPdfToStorage,
  updateAcoOrderRemainQty,
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
  // 創建服務端 Supabase 客戶端的函數（與 qcActions.ts 相同）
  const createSupabaseAdmin = useCallback(() => {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    
    // 使用與 qcActions.ts 相同的邏輯
    const FALLBACK_SUPABASE_URL = 'https://bbmkuiplnzvpudszrend.supabase.co';
    const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
    
    console.log('[useQcLabelBusiness] 創建服務端 Supabase 客戶端...');
    
    return createSupabaseClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }, []);

  // Get logged in user ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clockNumber = localStorage.getItem('loggedInUserClockNumber');
      if (clockNumber) {
        setFormData(prev => ({ ...prev, userId: clockNumber }));
      }
    }
  }, [setFormData]);

  // Fetch available first-off dates for Slate products
  useEffect(() => {
    if (productInfo?.type === 'Slate') {
      const fetchFirstOffDates = async () => {
        try {
          const supabaseAdmin = createSupabaseAdmin();
          const { data, error } = await supabaseAdmin
            .from('record_slate')
            .select('first_off');

          if (error) {
            console.error('Error fetching first-off dates:', error);
            toast.error('Error fetching historical first-off dates for Slate.');
            setFormData(prev => ({ ...prev, availableFirstOffDates: [] }));
          } else if (data) {
            const dates = data.map((item: { first_off: string | null }) => item.first_off).filter((date: string | null) => date) as string[];
            const uniqueSortedDates = Array.from(new Set(dates)).sort();
            setFormData(prev => ({ ...prev, availableFirstOffDates: uniqueSortedDates }));
          }
        } catch (error) {
          console.error('Error fetching first-off dates:', error);
          toast.error('Error fetching first-off dates.');
        }
      };
      
      const fetchSlateInfo = async () => {
        try {
          const supabaseAdmin = createSupabaseAdmin();
          const { data, error } = await supabaseAdmin
            .from('data_slateinfo')
            .select('shapes, colour')
            .eq('code', productInfo.code)
            .single();

          if (error) {
            console.error('Error fetching slate info:', error);
            // Don't show error toast as this is optional data
          } else if (data) {
            // Pre-fill shapes and colour from data_slateinfo
            setFormData(prev => ({
              ...prev,
              slateDetail: {
                ...prev.slateDetail,
                shapes: data.shapes || '',
                colour: data.colour || ''
              }
            }));
            console.log('Pre-filled Slate info:', data);
          }
        } catch (error) {
          console.error('Error fetching slate info:', error);
        }
      };
      
      fetchFirstOffDates();
      fetchSlateInfo();
    } else {
      setFormData(prev => ({ ...prev, availableFirstOffDates: [] }));
    }
  }, [productInfo?.type, productInfo?.code, createSupabaseAdmin, setFormData]);

  // Fetch available ACO order refs
  useEffect(() => {
    if (productInfo?.type === 'ACO') {
      const fetchAcoOrderRefs = async () => {
        try {
          const supabaseAdmin = createSupabaseAdmin();
          const { data, error } = await supabaseAdmin
            .from('record_aco')
            .select('order_ref, remain_qty');

          if (error) {
            console.error('Error fetching ACO order refs:', error);
            toast.error('Error fetching historical ACO order refs.');
            setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
          } else if (data) {
            // Get all unique order_ref values (including those with remain_qty = 0)
            const orderRefs: number[] = data
              .filter((record: { order_ref: number | null; remain_qty: number | null }) => record.order_ref !== null && record.order_ref !== undefined)
              .map((record: { order_ref: number | null; remain_qty: number | null }) => record.order_ref as number);
            
            const allOrderRefs = Array.from(new Set(orderRefs)).sort((a, b) => a - b);
            
            setFormData(prev => ({ ...prev, availableAcoOrderRefs: allOrderRefs }));
          }
        } catch (error) {
          console.error('Error fetching ACO order refs:', error);
          toast.error('Error fetching ACO order refs.');
        }
      };
      fetchAcoOrderRefs();
    } else {
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
    }
  }, [productInfo?.type, createSupabaseAdmin, setFormData]);

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
    
    // Extract remaining quantity from acoRemain string
    if (formData.acoRemain && formData.acoRemain.includes('Order Remain Qty :')) {
      const remainQtyMatch = formData.acoRemain.match(/Order Remain Qty : (\d+)/);
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

    setFormData(prev => ({ 
      ...prev, 
      acoSearchLoading: true,
      acoNewRef: false, // Reset new order state
      acoOrderDetails: [], // Clear order details
      acoOrderDetailErrors: [] // Clear errors
    }));

    try {
      const supabaseAdmin = createSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from('record_aco')
        .select('order_ref, remain_qty')
        .eq('order_ref', parseInt(formData.acoOrderRef.trim(), 10));

      if (error) {
        console.error('Error searching ACO order:', error);
        toast.error('Error searching ACO order.');
        setFormData(prev => ({ ...prev, acoRemain: null }));
        return;
      }

      if (!data || data.length === 0) {
        // New ACO order
        setFormData(prev => ({ 
          ...prev, 
          acoNewRef: true,
          acoRemain: 'New Order Detected. Please Enter Order Details Below.',
          acoOrderDetails: [{ code: '', qty: '' }], // Initialize with one empty row
          acoOrderDetailErrors: [''] // Initialize with one empty error
        }));
        toast.info('New ACO Order detected. Please enter order details.');
      } else {
        // Existing order - calculate total remaining quantity
        const totalRemainQty = data.reduce((sum: number, record: { order_ref: number | null; remain_qty: number | null }) => sum + (record.remain_qty || 0), 0);

        if (totalRemainQty <= 0) {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: 'Order Been Fullfilled'
          }));
          toast.warning('This ACO order has been fulfilled.');
        } else {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: `Order Remain Qty : ${totalRemainQty}`
          }));
          toast.success(`ACO order found. Remaining quantity: ${totalRemainQty}`);
        }
      }
    } catch (error) {
      console.error('Error searching ACO order:', error);
      toast.error('Error searching ACO order.');
      setFormData(prev => ({ ...prev, acoRemain: null }));
    } finally {
      setFormData(prev => ({ ...prev, acoSearchLoading: false }));
    }
  }, [formData.acoOrderRef, formData.productCode, createSupabaseAdmin, setFormData]);

  // ACO Order Detail Change
  const handleAcoOrderDetailChange = useCallback((idx: number, key: 'code' | 'qty', value: string) => {
    setFormData(prev => {
      const newDetails = [...prev.acoOrderDetails];
      newDetails[idx] = { ...newDetails[idx], [key]: value };
      return { ...prev, acoOrderDetails: newDetails };
    });
  }, [setFormData]);

  // Validate ACO Order Detail Code
  const validateAcoOrderDetailCode = useCallback(async (idx: number, code: string) => {
    if (!code.trim()) {
      setFormData(prev => {
        const newErrors = [...prev.acoOrderDetailErrors];
        newErrors[idx] = '';
        return { ...prev, acoOrderDetailErrors: newErrors };
      });
      return;
    }

    try {
      const supabaseAdmin = createSupabaseAdmin();
      const { data, error } = await supabaseAdmin.rpc('get_product_details_by_code', { 
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
          
          toast.success(`Product ${productData.code} validated as ACO product.`);
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
  }, [createSupabaseAdmin, setFormData]);

  // ACO Order Detail Update
  const handleAcoOrderDetailUpdate = useCallback(async () => {
    // Add a new empty row for additional products
    setFormData(prev => ({
      ...prev,
      acoOrderDetails: [...prev.acoOrderDetails, { code: '', qty: '' }],
      acoOrderDetailErrors: [...prev.acoOrderDetailErrors, '']
    }));
    toast.success('New product row added. You can now enter additional products for this ACO order.');
  }, [setFormData]);

  // Slate batch number change handler
  const handleSlateBatchNumberChange = useCallback((batchNumber: string) => {
    // Update batch number
    setFormData(prev => ({
      ...prev,
      slateDetail: {
        ...prev.slateDetail,
        batchNumber: batchNumber
      }
    }));

    // Auto-fill material based on batch number
    if (batchNumber.length >= 2) {
      const firstTwoDigits = batchNumber.substring(0, 2);
      const materialValue = `Mix Material ${firstTwoDigits}`;
      
      setFormData(prev => ({
        ...prev,
        slateDetail: {
          ...prev.slateDetail,
          batchNumber: batchNumber,
          material: materialValue
        }
      }));
      
      console.log(`Auto-filled material: ${materialValue} from batch number: ${batchNumber}`);
    }
  }, [setFormData]);

  // General Slate detail change handler
  const handleSlateDetailChange = useCallback((field: keyof SlateDetail, value: string) => {
    if (field === 'batchNumber') {
      handleSlateBatchNumberChange(value);
    } else {
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
    
    // 安全處理字符串轉換
    const quantityStr = String(formData.quantity || '');
    const countStr = String(formData.count || '');
    
    if (!productInfo || !formData.productCode.trim() || !quantityStr.trim() || !countStr.trim()) {
      toast.error('Product info, quantity, or count is missing.');
      setPrintEventToProceed(null);
      return;
    }

    const quantity = parseInt(quantityStr.trim(), 10);
    const count = parseInt(countStr.trim(), 10);

    if (isNaN(quantity) || quantity <= 0 || isNaN(count) || count <= 0) {
      toast.error('Please enter valid quantity and count values.');
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

      // 創建服務端 Supabase 客戶端用於生成棧板號碼和系列號
      console.log('[useQcLabelBusiness] 創建服務端客戶端用於生成棧板號碼...');
      const supabaseAdmin = createSupabaseAdmin();

      // Generate pallet numbers and series using admin client
      const generatedPalletNumbers = await generatePalletNumbers(supabaseAdmin, count);
      const generatedSeries = await generateMultipleUniqueSeries(count, supabaseAdmin);

      if (generatedPalletNumbers.length !== count || generatedSeries.length !== count) {
        toast.error('Failed to generate unique pallet numbers or series. Please try again.');
        setPrintEventToProceed(null);
        return;
      }

      const collectedPdfBlobs: Blob[] = [];
      let anyFailure = false;
      
      // For ACO orders, get the initial pallet count once (using admin client)
      let initialAcoPalletCount = 0;
      if (productInfo.type === 'ACO' && formData.acoOrderRef.trim()) {
        initialAcoPalletCount = await getAcoPalletCount(supabaseAdmin, formData.acoOrderRef.trim());
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
                  acoRecords.push({
                    order_ref: parseInt(formData.acoOrderRef.trim(), 10),
                    code: detail.code.trim(),
                    required_qty: requiredQty,
                    remain_qty: requiredQty - (quantity * count) // Subtract total quantity for all pallets
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
          availableFirstOffDates: [],
          productError: null,
          isLoading: false,
          pdfProgress: {
            current: 0,
            total: 0,
            status: []
          },
          slateDetail: {
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
      setPrintEventToProceed(null);
    }
  }, [productInfo, formData, setFormData, onProductInfoReset, createSupabaseAdmin]);

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
      return formData.acoRemain.includes('Order Been Fullfilled');
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
    if (productInfo?.type === 'ACO' && formData.acoRemain && formData.acoRemain.startsWith('Order Remain Qty : ')) {
      const match = formData.acoRemain.match(/Order Remain Qty : (\d+)/);
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
    validateAcoOrderDetailCode,
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