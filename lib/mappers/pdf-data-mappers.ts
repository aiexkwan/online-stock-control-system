/**
 * PDF 數據映射器
 * 統一化 PDF 組件計劃 - 階段一任務2
 *
 * 將不同業務類型的數據（QC、GRN）轉換為統一的 PDF 屬性格式
 * 確保數據處理的一致性和可維護性
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import { format } from 'date-fns';
import * as QRCode from 'qrcode';
import type { PrintLabelPdfProps } from '../../components/print-label-pdf/PrintLabelPdf';
import type { LabelMode } from '../types/grn';

// ============================================================================
// 類型定義 - 輸入數據結構
// ============================================================================

/**
 * QC 標籤專用輸入數據
 * 用於 QC（質量控制）和 ACO 訂單標籤
 */
export interface QcLabelInputData {
  /** 產品代碼 */
  productCode: string;
  /** 產品描述 */
  productDescription: string;
  /** 數量 */
  quantity: number;
  /** 系列號 */
  series: string;
  /** 棧板號 */
  palletNum: string;
  /** 操作員時鐘號碼 */
  operatorClockNum: string;
  /** QC 人員時鐘號碼 */
  qcClockNum: string;
  /** 工作訂單號碼（可選，適用於 ACO 訂單） */
  workOrderNumber?: string;
  /** 工作訂單名稱（可選） */
  workOrderName?: string;
  /** 產品類型（'ACO' 或其他） */
  productType?: string | null;
}

/**
 * GRN 標籤專用輸入數據
 * 用於貨物收據單標籤
 */
export interface GrnLabelInputData {
  /** GRN 編號 */
  grnNumber: string;
  /** 材料供應商代碼 */
  materialSupplier: string;
  /** 產品代碼 */
  productCode: string;
  /** 產品描述 */
  productDescription: string;
  /** 產品類型（通常為 null） */
  productType?: string | null;
  /** 淨重（用作數量） */
  netWeight: number;
  /** 系列號 */
  series: string;
  /** 棧板號 */
  palletNum: string;
  /** 接收人員時鐘號碼 */
  receivedBy: string;
  /** 標籤模式（'qty' 或 'weight'） */
  labelMode?: LabelMode;
}

/**
 * 統一的 PDF 數據結構
 * 這是映射後的標準化數據格式，可直接用於 PDF 生成
 */
export interface UnifiedPdfData {
  /** 產品代碼 */
  productCode: string;
  /** 產品描述 */
  description: string;
  /** 數量或重量（顯示值） */
  quantity: string | number;
  /** 日期字符串 */
  date: string;
  /** 操作員時鐘號碼 */
  operatorClockNum: string;
  /** QC/接收人員時鐘號碼 */
  qcClockNum: string;
  /** 棧板號 */
  palletNum: string;
  /** QR 碼數據 URL */
  qrCodeDataUrl: string;
  /** 產品類型 */
  productType?: string;
  /** 標籤類型（'QC' 或 'GRN'） */
  labelType: 'QC' | 'GRN';
  /** 標籤模式（'qty' 或 'weight'） */
  labelMode?: LabelMode;
  /** QC 工作訂單號碼（QC 標籤專用） */
  qcWorkOrderNumber?: string;
  /** QC 工作訂單名稱（QC 標籤專用） */
  qcWorkOrderName?: string;
  /** GRN 編號（GRN 標籤專用） */
  grnNumber?: string;
  /** GRN 材料供應商（GRN 標籤專用） */
  grnMaterialSupplier?: string;
}

// ============================================================================
// QR 碼生成工具函數
// ============================================================================

/**
 * 生成 QR 碼數據 URL
 * 統一的 QR 碼生成邏輯，確保所有標籤的 QR 碼格式一致
 *
 * @param data - 要編碼的數據（通常是系列號或產品代碼）
 * @param fallbackData - 備用數據（當主數據為空時使用）
 * @returns QR 碼的數據 URL，生成失敗時返回空字符串
 */
async function generateQrCodeDataUrl(data: string, fallbackData?: string): Promise<string> {
  const qrData = data || fallbackData || '';

  if (!qrData.trim()) {
    console.warn('[PDF Mapper] No data available for QR code generation');
    return '';
  }

  try {
    console.log(`[PDF Mapper] Generating QR code for data: ${qrData}`);
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
    });
    console.log('[PDF Mapper] QR code generated successfully');
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[PDF Mapper] Failed to generate QR code:', error);
    return '';
  }
}

// ============================================================================
// 核心映射函數
// ============================================================================

/**
 * 準備 QC 標籤數據
 * 將 QC 特定的業務數據轉換為統一的 PDF 屬性格式
 *
 * @param input - QC 標籤輸入數據
 * @returns 統一的 PDF 數據結構
 */
export async function prepareQcLabelData(input: QcLabelInputData): Promise<PrintLabelPdfProps> {
  console.log('[prepareQcLabelData] Processing QC label data:', {
    productCode: input.productCode,
    palletNum: input.palletNum,
    productType: input.productType,
  });

  // 生成標籤日期（當前日期）
  const labelDate = format(new Date(), 'dd-MMM-yyyy');

  // 決定 QR 碼數據：優先使用系列號，備用產品代碼
  const qrCodeDataUrl = await generateQrCodeDataUrl(input.series, input.productCode);

  // 構建統一的 PDF 數據結構
  const unifiedData: PrintLabelPdfProps = {
    // 基本產品資訊
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.quantity,
    date: labelDate,

    // 人員資訊
    operatorClockNum: input.operatorClockNum,
    qcClockNum: input.qcClockNum,

    // 標籤標識
    palletNum: input.palletNum,
    qrCodeDataUrl,
    productType: input.productType || undefined,
    labelType: 'QC',

    // QC 專用欄位
    qcWorkOrderNumber: input.workOrderNumber,
    qcWorkOrderName: input.workOrderName,
  };

  console.log('[prepareQcLabelData] QC label data prepared successfully');
  return unifiedData;
}

/**
 * 準備 GRN 標籤數據
 * 將 GRN 特定的業務數據轉換為統一的 PDF 屬性格式
 *
 * @param input - GRN 標籤輸入數據
 * @returns 統一的 PDF 數據結構
 */
export async function prepareGrnLabelData(input: GrnLabelInputData): Promise<PrintLabelPdfProps> {
  console.log('[prepareGrnLabelData] Processing GRN label data:', {
    grnNumber: input.grnNumber,
    productCode: input.productCode,
    palletNum: input.palletNum,
    labelMode: input.labelMode,
  });

  // 生成標籤日期（當前日期）
  const labelDate = format(new Date(), 'dd-MMM-yyyy');

  // 決定 QR 碼數據：優先使用系列號，備用產品代碼
  const qrCodeDataUrl = await generateQrCodeDataUrl(input.series, input.productCode);

  // 構建統一的 PDF 數據結構
  const unifiedData: PrintLabelPdfProps = {
    // 基本產品資訊
    productCode: input.productCode,
    description: input.productDescription,
    quantity: input.netWeight, // GRN 中數量即為淨重
    date: labelDate,

    // 人員資訊（GRN 中操作員為 '-'，接收人員填入 qcClockNum）
    operatorClockNum: '-',
    qcClockNum: input.receivedBy,

    // 標籤標識
    palletNum: input.palletNum,
    qrCodeDataUrl,
    productType: input.productType || undefined,
    labelType: 'GRN',
    labelMode: input.labelMode || 'weight', // 預設為重量模式

    // GRN 專用欄位
    grnNumber: input.grnNumber,
    grnMaterialSupplier: input.materialSupplier,
  };

  console.log('[prepareGrnLabelData] GRN label data prepared successfully');
  return unifiedData;
}

// ============================================================================
// 數據驗證工具函數
// ============================================================================

/**
 * 驗證 QC 標籤輸入數據
 * 檢查必要欄位是否存在且有效
 *
 * @param input - QC 標籤輸入數據
 * @returns 驗證結果對象
 */
export function validateQcLabelInput(input: Partial<QcLabelInputData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.productCode?.trim()) {
    errors.push('Product code is required');
  }
  if (!input.productDescription?.trim()) {
    errors.push('Product description is required');
  }
  if (typeof input.quantity !== 'number' || input.quantity <= 0) {
    errors.push('Quantity must be a positive number');
  }
  if (!input.palletNum?.trim()) {
    errors.push('Pallet number is required');
  }
  if (!input.series?.trim()) {
    errors.push('Series is required');
  }
  if (!input.operatorClockNum?.trim()) {
    errors.push('Operator clock number is required');
  }
  if (!input.qcClockNum?.trim()) {
    errors.push('QC clock number is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 驗證 GRN 標籤輸入數據
 * 檢查必要欄位是否存在且有效
 *
 * @param input - GRN 標籤輸入數據
 * @returns 驗證結果對象
 */
export function validateGrnLabelInput(input: Partial<GrnLabelInputData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.grnNumber?.trim()) {
    errors.push('GRN number is required');
  }
  if (!input.materialSupplier?.trim()) {
    errors.push('Material supplier is required');
  }
  if (!input.productCode?.trim()) {
    errors.push('Product code is required');
  }
  if (!input.productDescription?.trim()) {
    errors.push('Product description is required');
  }
  if (typeof input.netWeight !== 'number' || input.netWeight <= 0) {
    errors.push('Net weight must be a positive number');
  }
  if (!input.palletNum?.trim()) {
    errors.push('Pallet number is required');
  }
  if (!input.series?.trim()) {
    errors.push('Series is required');
  }
  if (!input.receivedBy?.trim()) {
    errors.push('Received by is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// 導出類型與函數
// ============================================================================

// 向後兼容性：重新導出原有的數據類型
export type QcInputData = QcLabelInputData;
export type GrnInputData = GrnLabelInputData;
