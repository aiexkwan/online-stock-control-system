/**
 * 通用類型定義
 */

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterRequest {
  search?: string;
  filters?: Record<string, unknown>;
  dateRange?: DateRange;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  url?: string;
}

export enum UploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actions?: ToastAction[];
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | null;
  errorCode?: string;
  message?: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
