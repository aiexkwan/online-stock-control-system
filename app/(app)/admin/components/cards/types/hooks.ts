// Hook-related types for admin cards

// Form validation hook types - only keep used ones
export interface UseAdminFormValidationProps {
  formType?: 'qc' | 'grn' | 'upload' | 'update';
  validationRules?: ValidationRules;
  customValidators?: CustomValidator[];
  formData?: any;
  productInfo?: any;
}

export interface UseAdminFormValidationReturn {
  isValid: boolean;
  errors: Record<string, string>;
  validate: (field?: string) => boolean;
  clearErrors: () => void;
}

export interface ValidationRules {
  required?: string[];
  minLength?: Record<string, number>;
  maxLength?: Record<string, number>;
  pattern?: Record<string, RegExp>;
  custom?: Record<string, (value: any) => boolean | string>;
}

export interface CustomValidator {
  field: string;
  validate: (value: any, formData: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// GRN Label Business hook types - only keep used ones
export interface UseGrnLabelBusinessV3Props {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  initialValues?: Partial<GrnFormData>;
}

export interface UseGrnLabelBusinessV3Return {
  formData: GrnFormData;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: GrnFormData) => Promise<void>;
  handleReset: () => void;
  validateForm: () => ValidationResult;
  generateLabels: (count: number) => Promise<any[]>;
}

export interface GrnFormData {
  grnRef: string;
  supplier: string;
  material: string;
  materialCode: string;
  batch: string;
  quantity: number;
  grossWeight?: number;
  netWeight?: number;
  packageType?: string;
  palletType?: string;
  location?: string;
  notes?: string;
}

// QC Label Business hook types - only keep used ones
export interface UseAdminQcLabelBusinessProps {
  onPrintComplete?: (data: any) => void;
  onError?: (error: Error) => void;
  defaultValues?: Partial<QcFormData>;
}

export interface UseAdminQcLabelBusinessReturn {
  formData: QcFormData;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: QcFormData) => Promise<void>;
  handlePrint: () => Promise<void>;
  validateForm: () => ValidationResult;
  generateQcLabels: (count: number) => Promise<any[]>;
}

export interface QcFormData {
  productCode: string;
  productName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate?: string;
  qcStatus: 'pending' | 'passed' | 'failed';
  qcBy?: string;
  qcDate?: string;
  notes?: string;
}