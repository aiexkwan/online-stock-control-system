/**
 * QC Label 工具函數
 * 包含通用的輔助函數，用於 QC Label 功能
 */

import {
  ORDINAL_SUFFIX_REMAINDER_10,
  HUNDRED_MODULO,
  ORDINAL_SUFFIX_SPECIAL_CASE_11,
  ORDINAL_SUFFIX_REMAINDER_1,
  ORDINAL_SUFFIX_SPECIAL_CASE_12,
  ORDINAL_SUFFIX_REMAINDER_2,
  ORDINAL_SUFFIX_SPECIAL_CASE_13,
  ORDINAL_SUFFIX_REMAINDER_3,
  DEFAULT_ACO_PALLET_START_COUNT,
} from '@/app/components/qc-label-form/constants';

/**
 * 生成序數字符串 (1st, 2nd, 3rd, 4th, etc.)
 * @param num - 要轉換的數字
 * @returns 帶有適當後綴的序數字符串
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % ORDINAL_SUFFIX_REMAINDER_10;
  const k = num % HUNDRED_MODULO;

  if (j === ORDINAL_SUFFIX_REMAINDER_1 && k !== ORDINAL_SUFFIX_SPECIAL_CASE_11) {
    return `${num}st`;
  }
  if (j === ORDINAL_SUFFIX_REMAINDER_2 && k !== ORDINAL_SUFFIX_SPECIAL_CASE_12) {
    return `${num}nd`;
  }
  if (j === ORDINAL_SUFFIX_REMAINDER_3 && k !== ORDINAL_SUFFIX_SPECIAL_CASE_13) {
    return `${num}rd`;
  }
  return `${num}th`;
}

/**
 * 獲取特定 ACO 訂單的卡板計數
 * @param supabase - Supabase 客戶端實例
 * @param acoOrderRef - ACO 訂單參考號
 * @returns 下一個卡板編號
 */
export async function getAcoPalletCount(supabase: any, acoOrderRef: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('record_history')
      .select('id')
      .like('remark', `ACO Ref : ${acoOrderRef}%`);

    if (error) {
      // 生產環境調試日誌
      console.error('Error fetching ACO pallet count:', error);
      return DEFAULT_ACO_PALLET_START_COUNT; // 如果出錯則從 1 開始
    }

    // 返回下一個卡板編號
    return (data?.length || 0) + DEFAULT_ACO_PALLET_START_COUNT;
  } catch (error) {
    console.error('Error in getAcoPalletCount:', error);
    return DEFAULT_ACO_PALLET_START_COUNT; // 如果出錯則從 1 開始
  }
}

/**
 * 格式化卡板數量顯示
 * @param count - 卡板數量
 * @returns 格式化的顯示字符串
 */
export function formatPalletCount(count: number): string {
  if (count === 1) {
    return '1 pallet';
  }
  return `${count} pallets`;
}

/**
 * 驗證產品代碼格式
 * @param productCode - 產品代碼
 * @returns 是否為有效的產品代碼
 */
export function isValidProductCode(productCode: string): boolean {
  // 產品代碼應該是非空字符串
  if (!productCode || typeof productCode !== 'string') {
    return false;
  }

  // 去除首尾空格後檢查
  const trimmedCode = productCode.trim();
  return trimmedCode.length > 0;
}

/**
 * 計算總數量
 * @param quantity - 單個數量
 * @param count - 計數
 * @returns 總數量
 */
export function calculateTotalQuantity(quantity: string | number, count: string | number): number {
  const qty = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  const cnt = typeof count === 'string' ? parseInt(count, 10) : count;

  if (isNaN(qty) || isNaN(cnt)) {
    return 0;
  }

  return qty * cnt;
}

/**
 * 生成 PDF 文件名
 * @param productCode - 產品代碼
 * @param timestamp - 時間戳（可選）
 * @returns PDF 文件名
 */
export function generatePdfFileName(productCode: string, timestamp?: Date): string {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  return `QC-Label_${productCode}_${dateStr}_${timeStr}.pdf`;
}

/**
 * 驗證電郵格式提取時鐘編號
 * @param email - 用戶電郵
 * @returns 時鐘編號或 null
 */
export function extractClockNumberFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) {
    return null;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return null;
  }

  const clockNumber = parts[0];
  // 驗證時鐘編號格式（假設是數字）
  if (!/^\d+$/.test(clockNumber)) {
    return null;
  }

  return clockNumber;
}
