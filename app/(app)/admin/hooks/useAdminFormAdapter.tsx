// Adapter to convert between AdminFormData and FormData types
import { AdminFormData } from '../types/adminQcTypes';
import { FormData } from '@/app/components/qc-label-form/types';

// Convert AdminFormData to FormData for compatibility with shared hooks
export function adminToFormData(adminData: AdminFormData): FormData {
  const converted = {
    productCode: adminData.productCode,
    productInfo: adminData.productInfo,
    quantity: adminData.quantity,
    count: adminData.count,
    operator: adminData.operator,
    userId: adminData.userId,
    acoOrderRef: adminData.acoOrderRef,
    slateDetail: adminData.slateDetail,
    pdfProgress: adminData.pdfProgress,
    isLoading: adminData.isLoading,
    acoSearchLoading: adminData.acoSearchLoading,
    productError: adminData.productError,
    // Add missing ACO fields with default values
    acoOrderDetails: [],
    acoNewRef: false,
    acoNewProductCode: '',
    acoNewOrderQty: '',
    acoRemain: adminData.acoRemain?.toString() || null,
    acoOrderDetailErrors: [],
    availableAcoOrderRefs: adminData.availableAcoOrders?.map(ref => parseInt(ref, 10)) || [],
  };
  return converted as FormData;
}

// Convert FormData updates back to AdminFormData
export function formDataToAdmin(formData: Partial<FormData>, currentAdminData: AdminFormData): AdminFormData {
  const updates: Partial<AdminFormData> = {};
  
  // Only copy fields that exist in AdminFormData
  if ('productCode' in formData) updates.productCode = formData.productCode!;
  if ('productInfo' in formData) updates.productInfo = formData.productInfo!;
  if ('quantity' in formData) updates.quantity = formData.quantity!;
  if ('count' in formData) updates.count = formData.count!;
  if ('operator' in formData) updates.operator = formData.operator!;
  if ('userId' in formData) updates.userId = formData.userId!;
  if ('acoOrderRef' in formData) updates.acoOrderRef = formData.acoOrderRef!;
  if ('acoRemain' in formData) updates.acoRemain = formData.acoRemain ? Number(formData.acoRemain) : null;
  if ('slateDetail' in formData) updates.slateDetail = formData.slateDetail!;
  if ('pdfProgress' in formData) updates.pdfProgress = formData.pdfProgress!;
  if ('isLoading' in formData) updates.isLoading = formData.isLoading!;
  if ('acoSearchLoading' in formData) updates.acoSearchLoading = formData.acoSearchLoading!;
  if ('productError' in formData) updates.productError = formData.productError!;
  if ('availableAcoOrders' in formData) updates.availableAcoOrders = formData.availableAcoOrders as string[];
  if ('acoOrdersLoading' in formData && typeof formData.acoOrdersLoading === 'boolean') {
    updates.acoOrdersLoading = formData.acoOrdersLoading;
  }
  
  return {
    ...currentAdminData,
    ...updates,
  };
}