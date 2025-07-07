/**
 * 托盤搜尋相關的工具函數
 */

// 搜尋類型
export type SearchType = 'series' | 'pallet_num' | 'unknown';

// 搜尋模式配置
export const SEARCH_PATTERNS = {
  // Series patterns
  series: [
    /^[A-Z]{2,3}-\d{6}$/,        // PM-240615, PT-240615
    /^[A-Z]{2,3}-\d{4}-\d{6}$/,  // PM-2024-060615
    /^[A-Z]+-[A-Z0-9]+$/,        // ACO-FEB24
    /^[\w]+-[\w]+$/,             // General series pattern
    /^[A-Z0-9]{12}$/             // Legacy 12-digit alphanumeric series (舊系統 Excel VBA)
  ],
  
  // Pallet number patterns
  pallet: [
    /^\d{6}\/\d{1,3}$/,          // 240615/1, 240615/12, 240615/123
    /^\d{6}-\d{1,3}$/,           // 240615-1 (alternative format)
    /^PLT-\d{6}\/\d{1,3}$/      // PLT-240615/1 (with prefix)
  ]
} as const;

/**
 * 檢測輸入的搜尋類型
 * @param input 用戶輸入
 * @returns 檢測到的搜尋類型
 */
export function detectSearchType(input: string): SearchType {
  if (!input || typeof input !== 'string') {
    return 'unknown';
  }

  const trimmedInput = input.trim().toUpperCase();

  // 檢查是否匹配 pallet 模式（先檢查 pallet，因為它更具體）
  for (const pattern of SEARCH_PATTERNS.pallet) {
    if (pattern.test(trimmedInput)) {
      return 'pallet_num';
    }
  }

  // 檢查是否匹配 series 模式
  for (const pattern of SEARCH_PATTERNS.series) {
    if (pattern.test(trimmedInput)) {
      // 特殊處理：如果是 12 位純數字或純字母，不應該是 series
      if (trimmedInput.length === 12 && (/^\d+$/.test(trimmedInput) || /^[A-Z]+$/.test(trimmedInput))) {
        continue;
      }
      return 'series';
    }
  }

  // 額外的啟發式檢測
  // 如果包含 '/'，可能是 pallet number
  if (trimmedInput.includes('/')) {
    return 'pallet_num';
  }

  // 檢查是否符合 pallet number 的格式（6位數字-1到3位數字）
  if (/^\d{6}-\d{1,3}$/.test(trimmedInput)) {
    return 'pallet_num';
  }

  // 如果包含 '-' 但不包含 '/'，且不是 pallet number 格式，可能是 series
  if (trimmedInput.includes('-') && !trimmedInput.includes('/')) {
    return 'series';
  }

  // 檢查是否為 12 位英數混合（舊系統格式）
  // 必須至少包含一個字母和一個數字
  if (trimmedInput.length === 12 && 
      /^[A-Z0-9]+$/.test(trimmedInput) &&
      /[A-Z]/.test(trimmedInput) && 
      /[0-9]/.test(trimmedInput)) {
    return 'series';
  }

  return 'unknown';
}

/**
 * 格式化托盤號
 * @param palletNum 原始托盤號
 * @returns 格式化後的托盤號
 */
export function formatPalletNumber(palletNum: string): string {
  // 移除前綴 'PLT-' 如果存在
  const cleaned = palletNum.replace(/^PLT-/i, '');
  
  // 確保使用 '/' 而不是 '-'
  return cleaned.replace('-', '/');
}

/**
 * 驗證托盤號格式
 * @param palletNum 托盤號
 * @returns 是否有效
 */
export function isValidPalletNumber(palletNum: string): boolean {
  return SEARCH_PATTERNS.pallet.some(pattern => pattern.test(palletNum));
}

/**
 * 驗證系列號格式
 * @param series 系列號
 * @returns 是否有效
 */
export function isValidSeriesNumber(series: string): boolean {
  const upperSeries = series.toUpperCase();
  
  // 先檢查標準模式
  for (const pattern of SEARCH_PATTERNS.series) {
    if (pattern.test(upperSeries)) {
      // 特殊處理：如果是 12 位純數字或純字母，不是有效的 series
      if (upperSeries.length === 12 && (/^\d+$/.test(upperSeries) || /^[A-Z]+$/.test(upperSeries))) {
        continue;
      }
      return true;
    }
  }
  
  // 特別檢查 12 位英數混合（確保至少有字母和數字）
  if (upperSeries.length === 12 && 
      /^[A-Z0-9]+$/.test(upperSeries) &&
      /[A-Z]/.test(upperSeries) && 
      /[0-9]/.test(upperSeries)) {
    return true;
  }
  
  return false;
}

/**
 * 從 QR code 提取搜尋值
 * QR code 可能包含額外信息，需要提取實際的托盤號或系列號
 * @param qrCode QR code 內容
 * @returns 提取的值和類型
 */
export function extractFromQRCode(qrCode: string): { value: string; type: SearchType } {
  // 移除可能的前後空格
  const cleaned = qrCode.trim();
  
  // 嘗試解析 JSON 格式的 QR code
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.series) {
      return { value: parsed.series, type: 'series' };
    }
    if (parsed.pallet || parsed.plt_num) {
      return { value: parsed.pallet || parsed.plt_num, type: 'pallet_num' };
    }
  } catch {
    // 不是 JSON 格式，繼續處理
  }
  
  // 直接檢測類型
  const type = detectSearchType(cleaned);
  return { value: cleaned, type };
}

/**
 * 生成搜尋建議
 * @param input 當前輸入
 * @param recentSearches 最近的搜尋歷史
 * @returns 搜尋建議列表
 */
export function generateSearchSuggestions(
  input: string, 
  recentSearches: string[] = []
): string[] {
  if (!input) return recentSearches.slice(0, 5);
  
  const lowercaseInput = input.toLowerCase();
  
  // 從歷史記錄中過濾匹配的項目
  const matchingSearches = recentSearches.filter(search => 
    search.toLowerCase().includes(lowercaseInput)
  );
  
  return matchingSearches.slice(0, 5);
}