/**
 * 簡單的產品代碼清理器
 * 修正常見的AI識別錯誤
 */

export class ProductCodeCleaner {
  /**
   * 清理和修正產品代碼
   * 主要處理Pack Size被錯誤附加的問題
   */
  static cleanProductCode(rawCode: string): string {
    if (!rawCode) return rawCode;
    
    let cleaned = rawCode.trim().toUpperCase();
    
    // 常見錯誤模式修正
    const corrections: Record<string, string> = {
      // MHL系列修正
      'MHL101': 'MHL10',      // MHL10 + 1 (pack size)
      'MHL101M': 'MHL10',     // MHL10 + 1 + M (from M12 in description)
      'MHL151': 'MHL15',
      'MHL151G': 'MHL15G',
      'MHL181': 'MHL18',
      'MHL181G': 'MHL18G',
      'MHL211': 'MHL21',
      'MHL211G': 'MHL21G',
      'MHL361': 'MHL36',
      'MHL361G': 'MHL36G',
      'MHL391': 'MHL39',
      'MHL391G': 'MHL39G',
      'MHL421': 'MHL42',
      'MHL421G': 'MHL42G',
      'MHL451': 'MHL45',
      'MHL451G': 'MHL45G',
      'MHL481': 'MHL48',
      'MHL481G': 'MHL48G',
      'MHL511': 'MHL51',
      'MHL511G': 'MHL51G',
      
      // MHEASY系列修正
      'MHEASYB1': 'MHEASYB',
      'MHEASYA1': 'MHEASYA',
      'MHEASY151': 'MHEASY15',
      'MHEASY601': 'MHEASY60',
      
      // 其他常見錯誤
      'MHCONKIT1': 'MHCONKIT',
      'MHCONR1': 'MHCONR',
    };
    
    // 檢查是否有直接匹配的修正
    if (corrections[cleaned]) {
      console.log(`[ProductCodeCleaner] Corrected: ${cleaned} → ${corrections[cleaned]}`);
      return corrections[cleaned];
    }
    
    // 通用規則：移除末尾的數字1（如果前面是字母）
    // 例如：ABC1231 -> ABC123
    const pattern = /^([A-Z]+\d+)1$/;
    const match = cleaned.match(pattern);
    if (match) {
      const corrected = match[1];
      console.log(`[ProductCodeCleaner] Pattern corrected: ${cleaned} → ${corrected}`);
      return corrected;
    }
    
    // 移除末尾的單個字母M（可能來自描述）
    if (cleaned.endsWith('M') && cleaned.length > 2) {
      const withoutM = cleaned.slice(0, -1);
      // 檢查是否是合理的產品代碼
      if (/^[A-Z]+\d+/.test(withoutM)) {
        console.log(`[ProductCodeCleaner] Removed trailing M: ${cleaned} → ${withoutM}`);
        return withoutM;
      }
    }
    
    return cleaned;
  }
  
  /**
   * 批量清理產品代碼
   */
  static cleanProductCodes(codes: string[]): string[] {
    return codes.map(code => this.cleanProductCode(code));
  }
  
  /**
   * 驗證產品代碼格式
   */
  static isValidProductCode(code: string): boolean {
    if (!code || code.length < 2) return false;
    
    // 產品代碼通常是字母開頭，後面可能有數字和字母
    const validPattern = /^[A-Z][A-Z0-9]{1,20}$/;
    return validPattern.test(code);
  }
}