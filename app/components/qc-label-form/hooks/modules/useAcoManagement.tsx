/**
 * useAcoManagement Hook
 * 處理 ACO (購買訂單) 相關的所有邏輯
 */

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/app/utils/supabase/client';
import { getAcoPalletCount } from '@/app/utils/qcLabelHelpers';
import { MIN_ACO_ORDER_REF_LENGTH } from '../../constants';
import type { FormData, ProductInfo } from '../../types';

interface UseAcoManagementProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productInfo: ProductInfo | null;
}

interface UseAcoManagementReturn {
  handleAcoSearch: () => Promise<void>;
  handleAcoOrderDetailChange: (idx: number, key: 'code' | 'qty', value: string) => void;
  validateAcoProductCode: (code: string, idx: number) => Promise<void>;
  handleAcoOrderDetailUpdate: () => void;
  checkAcoQuantityExcess: () => boolean;
  fetchAcoOrderRefs: () => Promise<void>;
}

export const useAcoManagement = ({
  formData,
  setFormData,
  productInfo
}: UseAcoManagementProps): UseAcoManagementReturn => {
  
  // 創建 Supabase 客戶端
  const createClientSupabase = useCallback(() => {
    return createClient();
  }, []);

  // 獲取可用的 ACO 訂單參考號
  const fetchAcoOrderRefs = useCallback(async () => {
    if (productInfo?.type !== 'ACO' || !productInfo?.code) {
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
      return;
    }

    try {
      const supabaseClient = createClientSupabase();
      const { data, error } = await supabaseClient
        .from('record_aco')
        .select('order_ref, remain_qty, code')
        .eq('code', productInfo.code);

      if (error) {
        console.error('Error fetching ACO order refs:', error);
        toast.error('Error fetching historical ACO order refs.');
        setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
      } else if (data) {
        // 處理 order_ref 的字符串和數字類型
        const orderRefs: number[] = data
          .filter((record: any) => record.order_ref !== null && record.order_ref !== undefined)
          .map((record: any) => {
            const orderRef = typeof record.order_ref === 'string' 
              ? parseInt(record.order_ref, 10) 
              : Number(record.order_ref);
            return isNaN(orderRef) ? null : orderRef;
          })
          .filter((ref: number | null) => ref !== null) as number[];
        
        const allOrderRefs = Array.from(new Set(orderRefs)).sort((a, b) => a - b);
        setFormData(prev => ({ ...prev, availableAcoOrderRefs: allOrderRefs }));
      }
    } catch (error) {
      console.error('Error fetching ACO order refs:', error);
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
    }
  }, [productInfo?.type, productInfo?.code, createClientSupabase, setFormData]);

  // 自動獲取 ACO 訂單參考號
  useEffect(() => {
    fetchAcoOrderRefs();
  }, [fetchAcoOrderRefs]);

  // 檢查當前輸入數量是否超過 ACO 剩餘數量
  const checkAcoQuantityExcess = useCallback(() => {
    if (productInfo?.type !== 'ACO' || !formData.acoOrderRef.trim() || formData.acoNewRef) {
      return false;
    }

    // 安全處理 quantity 和 count
    const quantityStr = String(formData.quantity || '');
    const countStr = String(formData.count || '');
    
    const quantity = parseInt(quantityStr.trim(), 10);
    const count = parseInt(countStr.trim(), 10);
    
    if (isNaN(quantity) || isNaN(count) || quantity <= 0 || count <= 0) {
      return false;
    }

    const totalPalletQuantity = quantity * count;
    
    // 從 acoRemain 字符串中提取剩餘數量
    if (formData.acoRemain && formData.acoRemain.includes('Order Remain Qty for')) {
      const remainQtyMatch = formData.acoRemain.match(/Order Remain Qty for .+: (\d+)/);
      if (remainQtyMatch) {
        const remainingQty = parseInt(remainQtyMatch[1], 10);
        return totalPalletQuantity > remainingQty;
      }
    }
    
    return false;
  }, [productInfo?.type, formData.acoOrderRef, formData.acoNewRef, formData.quantity, formData.count, formData.acoRemain]);

  // ACO 搜索邏輯
  const handleAcoSearch = useCallback(async () => {
    if (!formData.acoOrderRef.trim() || formData.acoOrderRef.trim().length < MIN_ACO_ORDER_REF_LENGTH) {
      toast.error(`ACO Order Ref must be at least ${MIN_ACO_ORDER_REF_LENGTH} characters.`);
      return;
    }

    if (!productInfo?.code) {
      toast.error('Please select a product first before searching ACO order.');
      return;
    }

    setFormData(prev => ({ 
      ...prev, 
      acoSearchLoading: true,
      acoNewRef: false,
      acoOrderDetails: [],
      acoOrderDetailErrors: []
    }));

    try {
      const supabaseClient = createClientSupabase();
      const searchOrderRef = formData.acoOrderRef.trim();
      
      // 搜索 ACO 訂單
      const { data, error } = await supabaseClient
        .from('record_aco')
        .select('order_ref, code, remain_qty')
        .or(`order_ref.eq.${searchOrderRef},order_ref.eq."${searchOrderRef}"`)
        .eq('code', productInfo.code);

      if (error) {
        console.error('Error searching ACO order:', error);
        toast.error('Error searching ACO order.');
        setFormData(prev => ({ ...prev, acoRemain: null }));
        return;
      }

      if (!data || data.length === 0) {
        // 沒有找到訂單 - 必須先通過 PDF 上傳訂單
        setFormData(prev => ({ 
          ...prev, 
          acoNewRef: false,
          acoRemain: `No Order Found for ${productInfo.code}. Please upload order via PDF first.`
        }));
        toast.warning(`No ACO order found for ${productInfo.code}. Please upload order via PDF first.`);
      } else {
        // 現有訂單 - 計算特定產品的總剩餘數量
        const totalRemainQty = data.reduce((sum: number, record: any) => {
          const remainQty = typeof record.remain_qty === 'string' 
            ? parseInt(record.remain_qty, 10) 
            : Number(record.remain_qty || 0);
          return sum + (isNaN(remainQty) ? 0 : remainQty);
        }, 0);

        if (totalRemainQty <= 0) {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: `Order Been Fulfilled for ${productInfo.code}`
          }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            acoRemain: `Order Remain Qty for ${productInfo.code}: ${totalRemainQty}`
          }));
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

  // ACO 訂單詳情更改
  const handleAcoOrderDetailChange = useCallback((idx: number, key: 'code' | 'qty', value: string) => {
    setFormData(prev => {
      const newDetails = [...prev.acoOrderDetails];
      newDetails[idx] = { ...newDetails[idx], [key]: value };
      return { ...prev, acoOrderDetails: newDetails };
    });
  }, [setFormData]);

  // ACO 產品代碼驗證
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
      // 使用與 ProductCodeInput 相同的 RPC 函數
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
        
        // 檢查產品類型是否為 ACO
        if (productData.type !== 'ACO') {
          setFormData(prev => {
            const newErrors = [...prev.acoOrderDetailErrors];
            newErrors[idx] = `Product ${code} is not an ACO product. Only ACO products are allowed in ACO orders.`;
            return { ...prev, acoOrderDetailErrors: newErrors };
          });
        } else {
          // 產品是有效的 ACO 類型，標準化代碼並清除錯誤
          setFormData(prev => {
            const newErrors = [...prev.acoOrderDetailErrors];
            newErrors[idx] = '';
            
            // 更新產品代碼為數據庫中的標準化版本
            const newDetails = [...prev.acoOrderDetails];
            newDetails[idx] = { ...newDetails[idx], code: productData.code };
            
            return { 
              ...prev, 
              acoOrderDetailErrors: newErrors,
              acoOrderDetails: newDetails
            };
          });
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

  // ACO 訂單詳情更新（添加新行）
  const handleAcoOrderDetailUpdate = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      acoOrderDetails: [...prev.acoOrderDetails, { code: '', qty: '' }],
      acoOrderDetailErrors: [...prev.acoOrderDetailErrors, '']
    }));
  }, [setFormData]);

  // 獲取 ACO 卡板計數（用於生成序數）
  const getAcoPalletOrdinal = useCallback(async (acoOrderRef: string): Promise<string> => {
    try {
      const supabase = createClientSupabase();
      const count = await getAcoPalletCount(supabase, acoOrderRef);
      return count.toString();
    } catch (error) {
      console.error('Error getting ACO pallet count:', error);
      return '1';
    }
  }, [createClientSupabase]);

  return {
    handleAcoSearch,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess,
    fetchAcoOrderRefs
  };
};