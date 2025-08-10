// Data management and file handling related types

// UploadCenterCard types
export interface UploadConfiguration {
  maxFileSize: number;
  allowedFormats: string[];
  autoProcess: boolean;
  validateOnUpload: boolean;
  requireConfirmation: boolean;
  enableDragDrop: boolean;
  multiple: boolean;
  preserveStructure: boolean;
}

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
}

export interface UploadRecord {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  status: string;
  recordsProcessed?: number;
  recordsFailed?: number;
  errorLog?: string[];
}

export interface DocUploadRecord {
  id: string;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  tags?: string[];
}

export interface UserData {
  name: string;
  email: string;
  uploadCount: number;
  lastUpload?: string;
}

export interface UploadCenterCardProps {
  className?: string;
  onUploadComplete?: (files: UploadFile[]) => void;
  configuration?: Partial<UploadConfiguration>;
  height?: string | number;
  isEditMode?: boolean;
}

export interface UploadToastState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// DownloadCenterCard types
export interface DownloadCenterCardProps {
  className?: string;
  onReportSelect?: (reportId: string) => void;
  showHeader?: boolean;
  height?: number | string;
}

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  category: string;
  formats: ('pdf' | 'excel' | 'csv' | 'json')[];
  parameters?: ReportParameter[];
  lastGenerated?: string;
  size?: number;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text' | 'number';
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
}

// DataUpdateCard types
export interface DataUpdateCardProps {
  className?: string;
  onUpdateComplete?: (data: ProductData | SupplierData) => void;
  entityType?: 'product' | 'supplier';
}

export type DataUpdateMode = 'initial' | 'searching' | 'display' | 'edit' | 'add';

export interface ProductData {
  id?: string;
  material_code: string;
  material_description: string;
  product_group?: string;
  unit?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierData {
  id?: string;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

