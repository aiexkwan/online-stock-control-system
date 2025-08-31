/**
 * useAcoManagement Hook
 * 處理 ACO (購買訂單) 相關的所有邏輯
 */

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { createClient } from '../../../../utils/supabase/client';
import { getAcoPalletCount } from '../../../../utils/qcLabelHelpers';
import { _MIN_ACO_ORDER_REF_LENGTH } from '../../constants';
import type { FormData, ProductInfo, AcoOrderDetail } from '../../types';

interface UseAcoManagementProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productInfo: ProductInfo | null;
}

interface UseAcoManagementReturn {
  handleAcoSearch: (orderRef?: string) => Promise<void>;
  handleAutoAcoConfirm: (selectedOrderRef: string) => Promise<void>;
  handleAcoOrderDetailChange: (idx: number, key: 'code' | 'qty', value: string) => void;
  validateAcoProductCode: (code: string, idx: number) => Promise<void>;
  handleAcoOrderDetailUpdate: () => void;
  checkAcoQuantityExcess: () => boolean;
  fetchAcoOrderRefs: () => Promise<void>;
}

export const useAcoManagement = ({
  formData,
  setFormData,
  productInfo,
}: UseAcoManagementProps): UseAcoManagementReturn => {
  // 創建 Supabase 客戶端
  const createClientSupabase = useCallback(() => {
    return createClient();
  }, []);

  // Debounce timer for auto search
  const autoSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 獲取可用的 ACO 訂單參考號
  const fetchAcoOrderRefs = useCallback(async () => {
    if (productInfo?.type !== 'ACO' || !productInfo?.code) {
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
      return;
    }

    try {
      // 使用傳統方法
      const supabaseClient = createClientSupabase();
      // 使用新的 RPC function - 只獲取可用訂單列表
      const { data, error } = await supabaseClient.rpc('get_aco_order_details', {
        p_product_code: productInfo.code,
      });

      if (error) {
        console.error('Error fetching ACO order refs:', error);
        toast.error('Error fetching historical ACO order refs.');
        setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] as readonly number[] }));
      } else if (
        (data as { success?: boolean; available_orders?: number[] })?.success &&
        (data as { success?: boolean; available_orders?: number[] }).available_orders
      ) {
        // RPC 返回的是 JSONB array，直接使用
        const orderRefs = (data as { success?: boolean; available_orders?: number[] })
          .available_orders as number[];
        setFormData(prev => ({ ...prev, availableAcoOrderRefs: orderRefs as readonly number[] }));
      } else {
        setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] as readonly number[] }));
      }
    } catch (fetchError) {
      console.error('Error fetching ACO order refs:', fetchError);
      setFormData(prev => ({ ...prev, availableAcoOrderRefs: [] }));
    }
  }, [productInfo?.type, productInfo?.code, createClientSupabase, setFormData]);

  // 自動獲取 ACO 訂單參考號
  useEffect(() => {
    if (productInfo?.type === 'ACO' && productInfo?.code) {
      fetchAcoOrderRefs();
    }
  }, [productInfo?.type, productInfo?.code, fetchAcoOrderRefs]);

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

    // 從 acoRemain 字符串中提取未完成數量
    if (formData.acoRemain && formData.acoRemain.includes('Order Outstanding Qty for')) {
      const outstandingQtyMatch = formData.acoRemain.match(/Order Outstanding Qty for .+: (\d+)/);
      if (outstandingQtyMatch) {
        const outstandingQty = parseInt(outstandingQtyMatch[1], 10);
        return totalPalletQuantity > outstandingQty;
      }
    }

    return false;
  }, [
    productInfo?.type,
    formData.acoOrderRef,
    formData.acoNewRef,
    formData.quantity,
    formData.count,
    formData.acoRemain,
  ]);

  // ACO 搜索邏輯 - 使用 RPC function (支援手動和自動調用)
  const handleAcoSearch = useCallback(
    async (orderRef?: string) => {
      const searchOrderRef = orderRef || formData.acoOrderRef.trim();

      if (!searchOrderRef || searchOrderRef.length < _MIN_ACO_ORDER_REF_LENGTH) {
        // 對於自動調用，不顯示錯誤toast，只對手動調用顯示
        if (!orderRef) {
          toast.error(`ACO Order Ref must be at least ${_MIN_ACO_ORDER_REF_LENGTH} characters.`);
        }
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
        acoOrderDetails: [] as readonly AcoOrderDetail[],
        acoOrderDetailErrors: [] as readonly string[],
      }));

      try {
        // 使用傳統方法
        const supabaseClient = createClientSupabase();

        // 使用新的 RPC function - 獲取訂單詳情
        const { data, error } = await supabaseClient.rpc('get_aco_order_details', {
          p_product_code: productInfo.code,
          p_order_ref: searchOrderRef,
        });

        if (error) {
          console.error('Error searching ACO order:', error);
          toast.error('Error searching ACO order.');
          setFormData(prev => ({ ...prev, acoRemain: null }));
          return;
        }

        interface AcoSearchResult {
          success?: boolean;
          error?: string;
          available_orders?: number[];
          order_details?: {
            order_ref: number;
            supplier_item_code: string;
            material_description: string;
            supplier: string;
          };
        }

        const result = data as AcoSearchResult;
        if (!result?.success) {
          toast.error(result?.error || 'Error searching ACO order.');
          setFormData(prev => ({ ...prev, acoRemain: null }));
          return;
        }

        // 更新可用訂單列表（如果有）
        if (data && result.available_orders) {
          setFormData(prev => ({
            ...prev,
            availableAcoOrderRefs: (result.available_orders || []) as readonly number[],
          }));
        }

        // 處理訂單詳情
        if (data && result.order_details) {
          const details = result.order_details;

          if (!details || !('order_ref' in details)) {
            // 訂單不存在
            setFormData(prev => ({
              ...prev,
              acoNewRef: false,
              acoRemain: 'Order not found',
            }));
            toast.warning('Order not found');
          } else {
            // 訂單存在 - 顯示狀態
            setFormData(prev => ({
              ...prev,
              acoRemain: `Order ${details.order_ref} found`,
            }));

            // 檢查訂單狀態（如果有相關屬性）
            if ('status' in details && (details as { status?: string }).status === 'fulfilled') {
              toast.warning('This order has already been fulfilled.');
            }
          }
        }
      } catch (searchError) {
        console.error('Error searching ACO order:', searchError);
        // 對於自動調用，減少錯誤toast的干擾
        if (!orderRef) {
          toast.error('Error searching ACO order.');
        }
        setFormData(prev => ({ ...prev, acoRemain: null }));
      } finally {
        setFormData(prev => ({ ...prev, acoSearchLoading: false }));
      }
    },
    [formData.acoOrderRef, productInfo, createClientSupabase, setFormData]
  );

  // 新增：自動 ACO 確認函數 (選擇訂單後自動觸發搜索)
  const handleAutoAcoConfirm = useCallback(
    async (selectedOrderRef: string) => {
      // Clear any existing timeout
      if (autoSearchTimeoutRef.current) {
        clearTimeout(autoSearchTimeoutRef.current);
      }

      // Update the form data first
      setFormData(prev => ({
        ...prev,
        acoOrderRef: selectedOrderRef,
        acoNewRef: false,
        acoRemain: null,
      }));

      // Auto-trigger search with debounce to avoid excessive calls
      if (selectedOrderRef && selectedOrderRef.length >= _MIN_ACO_ORDER_REF_LENGTH) {
        autoSearchTimeoutRef.current = setTimeout(async () => {
          await handleAcoSearch(selectedOrderRef);
        }, 300); // 300ms debounce
      }
    },
    [handleAcoSearch, setFormData]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSearchTimeoutRef.current) {
        clearTimeout(autoSearchTimeoutRef.current);
      }
    };
  }, []);

  // ACO 訂單詳情更改
  const handleAcoOrderDetailChange = useCallback(
    (idx: number, key: 'code' | 'qty', value: string) => {
      setFormData(prev => {
        const newDetails = [...prev.acoOrderDetails];
        newDetails[idx] = { ...newDetails[idx], [key]: value };
        return { ...prev, acoOrderDetails: newDetails as readonly AcoOrderDetail[] };
      });
    },
    [setFormData]
  );

  // ACO 產品代碼驗證
  const validateAcoProductCode = useCallback(
    async (code: string, idx: number) => {
      if (!code.trim()) {
        setFormData(prev => {
          const newErrors = [...prev.acoOrderDetailErrors];
          newErrors[idx] = '';
          return { ...prev, acoOrderDetailErrors: newErrors as readonly string[] };
        });
        return;
      }

      try {
        // 使用與 ProductCodeInput 相同的 RPC 函數
        const { data, error } = await createClientSupabase().rpc('get_product_details_by_code', {
          p_code: code.trim(),
        });

        if (error || !data || !Array.isArray(data) || data.length === 0) {
          setFormData(prev => {
            const newErrors = [...prev.acoOrderDetailErrors];
            newErrors[idx] = `Product code ${code} not found.`;
            return { ...prev, acoOrderDetailErrors: newErrors as readonly string[] };
          });
        } else {
          const productData =
            Array.isArray(data) && data.length > 0
              ? data[0]
              : {
                  code: '',
                  description: '',
                  standard_qty: '',
                  type: '',
                };

          // 檢查產品類型是否為 ACO
          if (productData.type !== 'ACO') {
            setFormData(prev => {
              const newErrors = [...prev.acoOrderDetailErrors];
              newErrors[idx] =
                `Product ${code} is not an ACO product. Only ACO products are allowed in ACO orders.`;
              return { ...prev, acoOrderDetailErrors: newErrors as readonly string[] };
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
                acoOrderDetailErrors: newErrors as readonly string[],
                acoOrderDetails: newDetails as readonly AcoOrderDetail[],
              };
            });
          }
        }
      } catch (validationError) {
        console.error('Error validating product code:', validationError);
        setFormData(prev => {
          const newErrors = [...prev.acoOrderDetailErrors];
          newErrors[idx] = 'Error validating product code. Please try again.';
          return { ...prev, acoOrderDetailErrors: newErrors as string[] };
        });
        toast.error('Error validating product code.');
      }
    },
    [createClientSupabase, setFormData]
  );

  // ACO 訂單詳情更新（添加新行）
  const handleAcoOrderDetailUpdate = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      acoOrderDetails: [
        ...prev.acoOrderDetails,
        { code: '', qty: '' },
      ] as readonly AcoOrderDetail[],
      acoOrderDetailErrors: [...prev.acoOrderDetailErrors, ''] as readonly string[],
    }));
  }, [setFormData]);

  // 獲取 ACO 卡板計數（用於生成序數）
  const _getAcoPalletOrdinal = useCallback(
    async (acoOrderRef: string): Promise<string> => {
      try {
        const supabase = createClientSupabase();
        const count = await getAcoPalletCount(supabase, acoOrderRef);
        return count.toString();
      } catch (countError) {
        console.error('Error getting ACO pallet count:', countError);
        return '1';
      }
    },
    [createClientSupabase]
  );

  return {
    handleAcoSearch,
    handleAutoAcoConfirm,
    handleAcoOrderDetailChange,
    validateAcoProductCode,
    handleAcoOrderDetailUpdate,
    checkAcoQuantityExcess,
    fetchAcoOrderRefs,
  };
};
