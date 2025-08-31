/**
 * Strategy 4: Type Guards for Hardware Types
 * Type narrowing functions to safely work with unknown data
 */

import { PrintJob, ScanResult, HardwareEvent, DeviceStatus } from '../types';

// Print Job Data Type Guards
export function isPrintJobData(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object';
}

// Strategy 2: DTO/自定義 type interface - 定義明確的數據結構
export interface QCLabelData {
  operator_clock_num: string;
  pallet_number: string;
  lot_number?: string;
  product_code?: string;
  quantity?: number;
}

export function isQCLabelData(data: unknown): data is QCLabelData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).operator_clock_num === 'string' &&
    typeof (data as Record<string, unknown>).pallet_number === 'string'
  );
}

export interface GRNLabelData {
  grn_number: string;
  supplier_name: string;
  product_code: string;
  batch_number?: string;
  expiry_date?: string;
}

export function isGRNLabelData(data: unknown): data is GRNLabelData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).grn_number === 'string' &&
    typeof (data as Record<string, unknown>).supplier_name === 'string' &&
    typeof (data as Record<string, unknown>).product_code === 'string'
  );
}

export interface ReportData {
  title: string;
  content: unknown[];
  metadata?: Record<string, unknown>;
}

export function isReportData(data: unknown): data is ReportData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).title === 'string' &&
    Array.isArray((data as Record<string, unknown>).content)
  );
}

// Hardware Event Data Type Guards
export interface DeviceConnectedData {
  deviceId: string;
  deviceType: string;
  timestamp: string;
}

export function isDeviceConnectedData(data: unknown): data is DeviceConnectedData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).deviceId === 'string' &&
    typeof (data as Record<string, unknown>).deviceType === 'string' &&
    typeof (data as Record<string, unknown>).timestamp === 'string'
  );
}

export interface JobCompletedData {
  jobId: string;
  success: boolean;
  duration?: number;
  error?: string;
}

export function isJobCompletedData(data: unknown): data is JobCompletedData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).jobId === 'string' &&
    typeof (data as Record<string, unknown>).success === 'boolean'
  );
}

export interface ScanResultData {
  data: string;
  format: 'qr' | 'barcode' | 'datamatrix';
  timestamp: string;
  confidence?: number;
}

export function isScanResultData(data: unknown): data is ScanResultData {
  return (
    isPrintJobData(data) &&
    typeof (data as Record<string, unknown>).data === 'string' &&
    typeof (data as Record<string, unknown>).format === 'string' &&
    typeof (data as Record<string, unknown>).timestamp === 'string' &&
    ['qr', 'barcode', 'datamatrix'].includes((data as Record<string, unknown>).format as string)
  );
}

// Metadata Type Guards
export function isPrintJobMetadata(metadata: unknown): metadata is {
  operatorClockNum?: string;
  timestamp?: string;
  source?: string;
  [key: string]: unknown;
} {
  if (!isPrintJobData(metadata)) return false;

  const meta = metadata as Record<string, unknown>;

  // Optional fields validation
  if (meta.operatorClockNum && typeof meta.operatorClockNum !== 'string') return false;
  if (meta.timestamp && typeof meta.timestamp !== 'string') return false;
  if (meta.source && typeof meta.source !== 'string') return false;

  return true;
}

// Device Status Type Guards
export function isValidDeviceStatus(status: unknown): status is DeviceStatus {
  if (!isPrintJobData(status)) return false;

  const s = status as Record<string, unknown>;

  return (
    typeof s.deviceId === 'string' &&
    typeof s.deviceType === 'string' &&
    ['printer', 'scanner', 'scale', 'other'].includes(s.deviceType as string) &&
    typeof s.status === 'string' &&
    ['online', 'offline', 'error', 'busy'].includes(s.status as string) &&
    typeof s.lastSeen === 'string'
  );
}

// Safe data extraction functions
// Strategy 2: DTO/自定義 type interface - 簡化複雜條件類型
export interface ExtractedPrintJobData {
  qcLabel?: QCLabelData;
  grnLabel?: GRNLabelData;
  report?: ReportData;
  raw: unknown;
}

export function extractPrintJobData(job: PrintJob): ExtractedPrintJobData {
  const raw = job.data;

  return {
    qcLabel: isQCLabelData(raw) ? raw : undefined,
    grnLabel: isGRNLabelData(raw) ? raw : undefined,
    report: isReportData(raw) ? raw : undefined,
    raw,
  };
}

// Strategy 2: DTO/自定義 type interface - 簡化複雜條件類型
export interface ExtractedEventData {
  deviceConnected?: DeviceConnectedData;
  jobCompleted?: JobCompletedData;
  scanResult?: ScanResultData;
  raw: unknown;
}

export function extractEventData(event: HardwareEvent): ExtractedEventData {
  const raw = event.data;

  return {
    deviceConnected: isDeviceConnectedData(raw) ? raw : undefined,
    jobCompleted: isJobCompletedData(raw) ? raw : undefined,
    scanResult: isScanResultData(raw) ? raw : undefined,
    raw,
  };
}

// Runtime validation helper
export function validateAndExtractData<T>(
  data: unknown,
  guard: (data: unknown) => data is T,
  fallback: T
): T {
  return guard(data) ? data : fallback;
}

// Safe property access
export function safeGetProperty<T>(
  obj: unknown,
  key: string,
  guard: (value: unknown) => value is T,
  fallback: T
): T {
  if (!isPrintJobData(obj)) return fallback;

  const value = (obj as Record<string, unknown>)[key];
  return guard(value) ? value : fallback;
}

export function safeGetString(obj: unknown, key: string, fallback = ''): string {
  return safeGetProperty(obj, key, (v): v is string => typeof v === 'string', fallback);
}

export function safeGetNumber(obj: unknown, key: string, fallback = 0): number {
  return safeGetProperty(obj, key, (v): v is number => typeof v === 'number', fallback);
}

export function safeGetBoolean(obj: unknown, key: string, fallback = false): boolean {
  return safeGetProperty(obj, key, (v): v is boolean => typeof v === 'boolean', fallback);
}
