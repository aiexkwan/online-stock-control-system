// Adapter to convert between AdminFormData and FormData types
import { FormData, ErrorInfo } from '../../../components/qc-label-form/types';
import { AdminFormData } from '../types/adminQcTypes';

// Convert AdminFormData to FormData for compatibility with shared hooks
export function adminToFormData(adminData: AdminFormData): FormData {
  // Create ErrorInfo object for productError if it exists
  const productErrorInfo: ErrorInfo | null = adminData.productError
    ? {
        code: 'PRODUCT_ERROR',
        message: adminData.productError,
        timestamp: new Date(),
      }
    : null;

  const converted: FormData = {
    productCode: adminData.productCode,
    productInfo: adminData.productInfo,
    quantity: adminData.quantity,
    count: adminData.count,
    operator: adminData.operator,
    userId: adminData.userId,
    acoOrderRef: adminData.acoOrderRef,
    slateDetail: adminData.slateDetail,
    pdfProgress: {
      current: adminData.pdfProgress.current,
      total: adminData.pdfProgress.total,
      status: adminData.pdfProgress
        .status as readonly (typeof adminData.pdfProgress.status)[number][],
    },
    isLoading: adminData.isLoading,
    acoSearchLoading: adminData.acoSearchLoading,
    productError: productErrorInfo,
    // Add missing ACO fields with default values
    acoOrderDetails: [],
    acoNewRef: false,
    acoNewProductCode: '',
    acoNewOrderQty: '',
    acoRemain: adminData.acoRemain?.toString() || null,
    acoOrderDetailErrors: [],
    availableAcoOrderRefs: adminData.availableAcoOrders?.map(ref => parseInt(ref, 10)) || [],
  };
  return converted;
}

// Convert FormData updates back to AdminFormData
export function formDataToAdmin(
  formData: Partial<FormData>,
  currentAdminData: AdminFormData
): AdminFormData {
  const updates: Partial<AdminFormData> = {};

  // Only copy fields that exist in AdminFormData with proper type checking
  if (formData.productCode !== undefined) updates.productCode = formData.productCode;
  if (formData.productInfo !== undefined) updates.productInfo = formData.productInfo;
  if (formData.quantity !== undefined) updates.quantity = formData.quantity;
  if (formData.count !== undefined) updates.count = formData.count;
  if (formData.operator !== undefined) updates.operator = formData.operator;
  if (formData.userId !== undefined) updates.userId = formData.userId;
  if (formData.acoOrderRef !== undefined) updates.acoOrderRef = formData.acoOrderRef;
  if (formData.acoRemain !== undefined) {
    updates.acoRemain = formData.acoRemain ? Number(formData.acoRemain) : null;
  }
  if (formData.slateDetail !== undefined) updates.slateDetail = formData.slateDetail;
  if (formData.pdfProgress !== undefined) {
    // Convert readonly array to mutable array for AdminFormData compatibility
    updates.pdfProgress = {
      current: formData.pdfProgress.current,
      total: formData.pdfProgress.total,
      status: [...formData.pdfProgress.status],
    };
  }
  if (formData.isLoading !== undefined) updates.isLoading = formData.isLoading;
  if (formData.acoSearchLoading !== undefined) updates.acoSearchLoading = formData.acoSearchLoading;

  // Convert ErrorInfo back to string for AdminFormData
  if (formData.productError !== undefined) {
    updates.productError = formData.productError?.message || null;
  }

  if (
    formData.availableAcoOrderRefs !== undefined &&
    Array.isArray(formData.availableAcoOrderRefs)
  ) {
    updates.availableAcoOrders = formData.availableAcoOrderRefs.map(num => num.toString());
  }

  return {
    ...currentAdminData,
    ...updates,
  };
}
