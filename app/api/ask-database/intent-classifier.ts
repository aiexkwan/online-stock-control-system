// 智能意圖識別系統 - 將用戶問題映射到 RPC 函數
// 完全取代 OpenAI SQL 生成

export interface QueryIntent {
  type: 'count' | 'stats' | 'location' | 'weight' | 'product' | 'transfer' | 'latest' | 'unknown' | 'inventory_ranking' | 'inventory_threshold' | 'product_count' | 'supplier_count' | 'supplier_info' | 'product_filter' | 'grn_list' | 'aco_list' | 'pallet_history' | 'void' | 'user_activity' | 'operation_history';
  timeframe: 'today' | 'yesterday' | 'day_before_yesterday' | 'week' | 'month' | 'all';
  filters: {
    includeGrn?: boolean;
    excludeGrn?: boolean;
    productCode?: string;
    location?: string;
    limit?: number;
    colour?: string;
    supplierCode?: string;
    palletNumber?: string;
  };
  rpcFunction: string;
  parameters: any[];
  confidence: number; // 0-1 的信心度
  description: string; // 用於調試和日誌
}

// 主要意圖分類函數
export function classifyUserIntent(question: string): QueryIntent {
  console.log('[Intent Classifier] Analyzing question:', question);
  
  const lowerQ = question.toLowerCase();
  const originalQ = question;
  
  // 1. 時間識別
  const timeframe = identifyTimeframe(lowerQ);
  console.log('[Intent Classifier] Timeframe:', timeframe);
  
  // 2. GRN 識別
  const grnFilters = identifyGrnFilters(lowerQ);
  console.log('[Intent Classifier] GRN filters:', grnFilters);
  
  // 3. 產品代碼識別
  const productCode = identifyProductCode(originalQ);
  console.log('[Intent Classifier] Product code:', productCode);
  
  // 4. 位置識別
  const location = identifyLocation(lowerQ);
  console.log('[Intent Classifier] Location:', location);
  
  // 5. 查詢類型識別和 RPC 函數映射
  const intent = identifyQueryTypeAndMapRpc(lowerQ, {
    timeframe,
    grnFilters,
    productCode,
    location
  });
  
  console.log('[Intent Classifier] Final intent:', {
    type: intent.type,
    rpcFunction: intent.rpcFunction,
    confidence: intent.confidence
  });
  
  return intent;
}

// 時間識別函數
function identifyTimeframe(lowerQ: string): QueryIntent['timeframe'] {
  if (lowerQ.includes('今天') || lowerQ.includes('today') || lowerQ.includes('今日')) {
    return 'today';
  }
  if (lowerQ.includes('昨天') || lowerQ.includes('yesterday') || lowerQ.includes('尋日')) {
    return 'yesterday';
  }
  if (lowerQ.includes('前天') || lowerQ.includes('前日') || lowerQ.includes('day before yesterday')) {
    return 'day_before_yesterday';
  }
  if (lowerQ.includes('本週') || lowerQ.includes('this week') || lowerQ.includes('過去7天') || lowerQ.includes('last 7 days')) {
    return 'week';
  }
  if (lowerQ.includes('本月') || lowerQ.includes('this month') || lowerQ.includes('當月')) {
    return 'month';
  }
  return 'all';
}

// GRN 過濾識別
function identifyGrnFilters(lowerQ: string): { includeGrn?: boolean; excludeGrn?: boolean } {
  const hasGrnKeyword = lowerQ.includes('grn') || lowerQ.includes('收貨') || lowerQ.includes('material');
  const hasExcludeKeyword = lowerQ.includes('排除') || lowerQ.includes('exclude') || lowerQ.includes('不包括') || lowerQ.includes('without');
  const hasIncludeKeyword = lowerQ.includes('只要') || lowerQ.includes('only') || lowerQ.includes('僅') || lowerQ.includes('just');
  
  if (hasGrnKeyword && hasExcludeKeyword) {
    return { excludeGrn: true };
  }
  if (hasGrnKeyword && hasIncludeKeyword) {
    return { includeGrn: true };
  }
  if (hasGrnKeyword && !hasExcludeKeyword && !hasIncludeKeyword) {
    return { includeGrn: true };
  }
  
  return {};
}

// 產品代碼識別
function identifyProductCode(question: string): string | undefined {
  // 匹配常見的產品代碼格式
  const productPatterns = [
    /\b([A-Za-z]{2,4}\d{2,6}[A-Za-z]?)\b/g, // MEP123456, ABC1234A, mhcol2 等（支持大小寫）
    /\b(MEP[A-Za-z0-9]+)\b/gi, // MEP 開頭的產品代碼
    /\b(MH[A-Za-z0-9]+)\b/gi, // MH 開頭的產品代碼（如 MHCOL2）
    /產品代碼[：:\s]*([A-Za-z0-9]+)/gi, // 中文產品代碼
    /product[:\s]+([A-Za-z0-9]+)/gi, // 英文產品代碼
    /code[:\s]+([A-Za-z0-9]+)/gi, // code: XXX
    /\bfor\s+([A-Za-z]{2,4}\d{1,6}[A-Za-z]?)\b/gi, // "for mhcol2" 格式
    /\bof\s+([A-Za-z]{2,4}\d{1,6}[A-Za-z]?)\b/gi, // "of mhcol2" 格式
  ];
  
  for (const pattern of productPatterns) {
    const matches = question.match(pattern);
    if (matches && matches.length > 0) {
      // 提取第一個匹配的產品代碼
      const match = matches[0];
      const cleanCode = match.replace(/^(產品代碼|product|code|for|of)[：:\s]*/gi, '').trim();
      if (cleanCode.length >= 3) {
        return cleanCode.toUpperCase();
      }
    }
  }
  
  return undefined;
}

// 識別位置
function identifyLocation(lowerQ: string): string | undefined {
  // 位置關鍵詞映射
  const locationKeywords: { [key: string]: string } = {
    'injection': 'Injection',
    'pipeline': 'Pipeline',
    'prebook': 'Prebook',
    'await': 'Await',
    'awaiting': 'Await',
    'fold': 'Fold Mill',
    'fold mill': 'Fold Mill',
    'bulk': 'Bulk Room',
    'bulk room': 'Bulk Room',
    'back car park': 'Back Car Park',
    'backcarpark': 'Back Car Park',
    'car park': 'Back Car Park',
    'carpark': 'Back Car Park'
  };
  
  for (const [keyword, location] of Object.entries(locationKeywords)) {
    if (lowerQ.includes(keyword)) {
      console.log(`[Intent Classifier] Location detected: ${location}`);
      return location;
    }
  }
  
  return undefined;
}

// 查詢類型識別和 RPC 函數映射
function identifyQueryTypeAndMapRpc(
  lowerQ: string, 
  context: {
    timeframe: QueryIntent['timeframe'];
    grnFilters: { includeGrn?: boolean; excludeGrn?: boolean };
    productCode?: string;
    location?: string;
  }
): QueryIntent {
  const { timeframe, grnFilters, productCode, location } = context;
  
  // 0. 重量查詢 (提升到最高優先級)
  if (lowerQ.includes('重量') || lowerQ.includes('weight') || 
      lowerQ.includes('淨重') || lowerQ.includes('毛重') || 
      lowerQ.includes('net weight') || lowerQ.includes('gross weight') ||
      lowerQ.includes('總重量') || lowerQ.includes('total weight') ||
      lowerQ.includes('平均重量') || lowerQ.includes('average weight') ||
      lowerQ.includes('平均淨重') || lowerQ.includes('平均毛重')) {
    
    console.log('[Intent Classifier] Weight query detected with high priority');
    return mapWeightQuery(timeframe, grnFilters);
  }
  
  // 0.1 員工查詢 (新增 - 高優先級)
  if ((lowerQ.includes('員工') || lowerQ.includes('用戶') || lowerQ.includes('user') || 
       lowerQ.includes('staff') || lowerQ.includes('worker') || lowerQ.includes('人員')) &&
      (lowerQ.includes('處理') || lowerQ.includes('工作量') || lowerQ.includes('操作') || 
       lowerQ.includes('activity') || lowerQ.includes('workload') || lowerQ.includes('handle') ||
       lowerQ.includes('process') || lowerQ.includes('完成') || lowerQ.includes('績效') ||
       lowerQ.includes('哪些') || lowerQ.includes('which') || lowerQ.includes('who') ||
       lowerQ.includes('在工作') || lowerQ.includes('在進行') || lowerQ.includes('active'))) {
    
    console.log('[Intent Classifier] Employee activity query detected');
    return mapEmployeeActivityQuery(lowerQ, timeframe);
  }

  // 0.2 供應商查詢 (保持原有優先級)
  if (lowerQ.includes('供應商') || lowerQ.includes('supplier')) {
    // 檢查是否是特定供應商查詢
    const supplierCodeMatch = lowerQ.match(/[sS]\d{3}/); // 匹配 S001 格式
    if (supplierCodeMatch) {
      return mapSupplierInfoQuery(supplierCodeMatch[0].toUpperCase());
    }
    // 否則是供應商統計
    if (lowerQ.includes('多少') || lowerQ.includes('how many') || lowerQ.includes('count')) {
      return mapSupplierCountQuery();
    }
  }
  
  // 0.3 庫存最少查詢 (新增 - 高優先級)
  if ((lowerQ.includes('庫存') || lowerQ.includes('inventory')) && 
      (lowerQ.includes('最少') || lowerQ.includes('最低') || lowerQ.includes('lowest') || 
       lowerQ.includes('smallest') || lowerQ.includes('minimum'))) {
    
    return mapLowestInventoryQuery(lowerQ);
  }
  
  // 0.5 產品代碼統計查詢 (新增)
  if ((lowerQ.includes('產品代碼') || lowerQ.includes('product code') || lowerQ.includes('product')) && 
      (lowerQ.includes('多少') || lowerQ.includes('how many') || lowerQ.includes('different') || 
       lowerQ.includes('不同') || lowerQ.includes('種') || lowerQ.includes('個'))) {
    return mapProductCodeCountQuery();
  }
  
  // 0.6 產品顏色過濾查詢 (新增)
  if ((lowerQ.includes('黑色') || lowerQ.includes('black') || lowerQ.includes('白色') || 
       lowerQ.includes('white') || lowerQ.includes('紅色') || lowerQ.includes('red')) &&
      (lowerQ.includes('產品') || lowerQ.includes('product'))) {
    return mapProductColourFilterQuery(lowerQ);
  }
  
  // 0.7 GRN 列表查詢 (新增)
  if ((lowerQ.includes('grn') || lowerQ.includes('收貨')) && 
      (lowerQ.includes('記錄') || lowerQ.includes('record') || lowerQ.includes('最近') || 
       lowerQ.includes('recent') || lowerQ.includes('latest') || lowerQ.includes('哪些'))) {
    return mapGrnListQuery(timeframe);
  }
  
  // 0.8 ACO 訂單查詢 (新增)
  if ((lowerQ.includes('aco') || lowerQ.includes('訂單')) && 
      (lowerQ.includes('活躍') || lowerQ.includes('active') || lowerQ.includes('剩餘') || 
       lowerQ.includes('remain') || lowerQ.includes('哪些'))) {
    return mapAcoOrderQuery();
  }
  
  // 0.9 托盤歷史查詢 (新增)
  if ((lowerQ.includes('歷史') || lowerQ.includes('history')) && 
      (lowerQ.includes('托盤') || lowerQ.includes('pallet'))) {
    // 提取托盤號碼
    const palletMatch = lowerQ.match(/\d{6}\/\d+/);
    if (palletMatch) {
      return mapPalletHistoryQuery(palletMatch[0]);
    }
  }
  
  // 0.95 作廢查詢 (新增)
  if (lowerQ.includes('作廢') || lowerQ.includes('void') || lowerQ.includes('廢棄') || 
      lowerQ.includes('cancel') || lowerQ.includes('invalid')) {
    
    if (lowerQ.includes('記錄') || lowerQ.includes('record') || lowerQ.includes('最近') || 
        lowerQ.includes('recent') || lowerQ.includes('latest')) {
      return mapVoidRecordsQuery(timeframe);
    }
    
    return mapVoidCountQuery(timeframe);
  }
  
  // 0.9 用戶活動查詢 (新增)
  if ((lowerQ.includes('用戶') || lowerQ.includes('user') || lowerQ.includes('員工')) &&
      (lowerQ.includes('操作') || lowerQ.includes('活動') || lowerQ.includes('activity') || 
       lowerQ.includes('action') || lowerQ.includes('進行'))) {
    
    return mapUserActivityQuery(timeframe);
  }
  
  // 0.85 操作歷史查詢 (新增)
  if ((lowerQ.includes('操作') || lowerQ.includes('operation') || lowerQ.includes('action')) &&
      (lowerQ.includes('歷史') || lowerQ.includes('history') || lowerQ.includes('記錄') || 
       lowerQ.includes('總數') || lowerQ.includes('total'))) {
    
    return mapOperationHistoryQuery(timeframe);
  }
  
  // 1. 轉移查詢 (提高優先級)
  if (lowerQ.includes('轉移') || lowerQ.includes('transfer') || lowerQ.includes('移動') || 
      lowerQ.includes('move') || lowerQ.includes('records')) {
    
    return mapTransferQuery(timeframe);
  }
  
  // 2. 庫存排名查詢
  if ((lowerQ.includes('top') && lowerQ.includes('inventory')) || 
      (lowerQ.includes('highest') && lowerQ.includes('inventory')) ||
      (lowerQ.includes('top') && lowerQ.includes('products')) ||
      (lowerQ.includes('show') && lowerQ.includes('top') && lowerQ.includes('product')) ||
      (lowerQ.includes('ranking') && lowerQ.includes('inventory')) ||
      (lowerQ.includes('最高') && lowerQ.includes('庫存')) ||
      (lowerQ.includes('排名') && lowerQ.includes('產品'))) {
    
    return mapInventoryRankingQuery(lowerQ);
  }
  
  // 3. 庫存閾值查詢 (新增)
  if ((lowerQ.includes('inventory') || lowerQ.includes('stock') || lowerQ.includes('庫存')) &&
      (lowerQ.includes('below') || lowerQ.includes('under') || lowerQ.includes('less than') ||
       lowerQ.includes('lower than') || lowerQ.includes('< ') || lowerQ.includes('<=') ||
       lowerQ.includes('低於') || lowerQ.includes('少於') || lowerQ.includes('不足') ||
       lowerQ.includes('小於'))) {
    
    return mapInventoryThresholdQuery(lowerQ);
  }
  
  // 4. 產品庫存查詢 (新增 - 提高優先級)
  if (productCode && 
      (lowerQ.includes('qty') || lowerQ.includes('quantity') || lowerQ.includes('inventory') || 
       lowerQ.includes('stock') || lowerQ.includes('數量') || lowerQ.includes('庫存') ||
       lowerQ.includes('total') || lowerQ.includes('units') || lowerQ.includes('current'))) {
    
    return mapProductInventoryQuery(productCode);
  }
  
  // 5. QC 歷史查詢 (新增)
  if ((lowerQ.includes('qc') || lowerQ.includes('quality control') || lowerQ.includes('品控')) &&
      (lowerQ.includes('by') || lowerQ.includes('用戶') || lowerQ.includes('user')) &&
      /\b\d{4}\b/.test(lowerQ)) { // 匹配4位數字的用戶ID
    
    return mapQcHistoryQuery(lowerQ, timeframe);
  }
  
  // 6. 非GRN過濾查詢 (新增 - 優先於一般計數查詢)
  if ((lowerQ.includes('非grn') || lowerQ.includes('non-grn') || lowerQ.includes('生成') && lowerQ.includes('排除')) && 
      (lowerQ.includes('托盤') || lowerQ.includes('pallet'))) {
    
    return mapNonGrnPalletQuery(timeframe);
  }
  
  // 7. 計數查詢 (修正GRN過濾邏輯)
  if (lowerQ.includes('多少') || lowerQ.includes('how many') || lowerQ.includes('count') || 
      lowerQ.includes('數量') || lowerQ.includes('幾多') || lowerQ.includes('幾個')) {
    
    // 特別處理"只要GRN"查詢
    if (lowerQ.includes('只要grn') || lowerQ.includes('only grn') || 
        (lowerQ.includes('grn') && (lowerQ.includes('只要') || lowerQ.includes('only')))) {
      return mapGrnOnlyCountQuery(timeframe);
    }
    
    return mapCountQuery(timeframe, grnFilters, productCode, location);
  }
  
  // 8. 重量查詢
  if (lowerQ.includes('重量') || lowerQ.includes('weight') || lowerQ.includes('淨重') || 
      lowerQ.includes('毛重') || lowerQ.includes('net') || lowerQ.includes('gross')) {
    
    return mapWeightQuery(timeframe, grnFilters);
  }
  
  // 9. 位置查詢
  if (lowerQ.includes('位置') || lowerQ.includes('location') || lowerQ.includes('在哪') || 
      lowerQ.includes('where') || location) {
    
    return mapLocationQuery(location);
  }
  
  // 10. 最新托盤查詢
  if (lowerQ.includes('最新') || lowerQ.includes('latest') || lowerQ.includes('最近') || 
      lowerQ.includes('recent') || lowerQ.includes('新') || lowerQ.includes('last')) {
    
    return mapLatestQuery(timeframe, productCode);
  }
  
  // 11. 默認回退到計數查詢
  console.log('[Intent Classifier] No specific type detected, defaulting to count query');
  return mapCountQuery(timeframe, grnFilters, productCode, location);
}

// 計數查詢映射
function mapCountQuery(
  timeframe: QueryIntent['timeframe'],
  grnFilters: { includeGrn?: boolean; excludeGrn?: boolean },
  productCode?: string,
  location?: string
): QueryIntent {
  
  // 產品特定查詢
  if (productCode) {
    if (timeframe === 'today' && grnFilters.excludeGrn) {
      return {
        type: 'count',
        timeframe: 'today',
        filters: { excludeGrn: true, productCode },
        rpcFunction: 'get_today_product_non_grn_stats',
        parameters: [productCode],
        confidence: 0.95,
        description: `Today's non-GRN pallet count for product ${productCode}`
      };
    }
    if (timeframe === 'today') {
      return {
        type: 'count',
        timeframe: 'today',
        filters: { productCode },
        rpcFunction: 'get_today_product_stats',
        parameters: [productCode],
        confidence: 0.9,
        description: `Today's pallet count for product ${productCode}`
      };
    }
    if (timeframe === 'yesterday') {
      return {
        type: 'count',
        timeframe: 'yesterday',
        filters: { productCode },
        rpcFunction: 'get_yesterday_product_stats',
        parameters: [productCode],
        confidence: 0.9,
        description: `Yesterday's pallet count for product ${productCode}`
      };
    }
  }
  
  // 位置特定查詢
  if (location) {
    return {
      type: 'location',
      timeframe: 'all',
      filters: { location },
      rpcFunction: 'get_location_pallet_count',
      parameters: [location],
      confidence: 0.85,
      description: `Pallet count at location: ${location}`
    };
  }
  
  // 基礎時間 + GRN 過濾查詢
  if (timeframe === 'today') {
    if (grnFilters.excludeGrn) {
      return {
        type: 'count',
        timeframe: 'today',
        filters: { excludeGrn: true },
        rpcFunction: 'get_today_non_grn_pallet_count',
        parameters: [],
        confidence: 0.95,
        description: "Today's non-GRN pallet count"
      };
    }
    if (grnFilters.includeGrn) {
      return {
        type: 'count',
        timeframe: 'today',
        filters: { includeGrn: true },
        rpcFunction: 'get_today_grn_pallet_count',
        parameters: [],
        confidence: 0.95,
        description: "Today's GRN pallet count"
      };
    }
    return {
      type: 'count',
      timeframe: 'today',
      filters: {},
      rpcFunction: 'get_today_pallet_count',
      parameters: [],
      confidence: 0.9,
      description: "Today's total pallet count"
    };
  }
  
  if (timeframe === 'yesterday') {
    if (grnFilters.excludeGrn) {
      return {
        type: 'count',
        timeframe: 'yesterday',
        filters: { excludeGrn: true },
        rpcFunction: 'get_yesterday_non_grn_pallet_count',
        parameters: [],
        confidence: 0.9,
        description: "Yesterday's non-GRN pallet count"
      };
    }
    if (grnFilters.includeGrn) {
      return {
        type: 'count',
        timeframe: 'yesterday',
        filters: { includeGrn: true },
        rpcFunction: 'get_yesterday_grn_pallet_count',
        parameters: [],
        confidence: 0.9,
        description: "Yesterday's GRN pallet count"
      };
    }
    return {
      type: 'count',
      timeframe: 'yesterday',
      filters: {},
      rpcFunction: 'get_yesterday_pallet_count',
      parameters: [],
      confidence: 0.85,
      description: "Yesterday's total pallet count"
    };
  }
  
  if (timeframe === 'day_before_yesterday') {
    return {
      type: 'count',
      timeframe: 'day_before_yesterday',
      filters: {},
      rpcFunction: 'get_day_before_yesterday_pallet_count',
      parameters: [],
      confidence: 0.8,
      description: "Day before yesterday's pallet count"
    };
  }
  
  if (timeframe === 'week') {
    if (grnFilters.excludeGrn) {
      return {
        type: 'count',
        timeframe: 'week',
        filters: { excludeGrn: true },
        rpcFunction: 'get_week_non_grn_pallet_count',
        parameters: [],
        confidence: 0.85,
        description: "This week's non-GRN pallet count"
      };
    }
    return {
      type: 'count',
      timeframe: 'week',
      filters: {},
      rpcFunction: 'get_week_pallet_count',
      parameters: [],
      confidence: 0.8,
      description: "This week's total pallet count"
    };
  }
  
  if (timeframe === 'month') {
    return {
      type: 'count',
      timeframe: 'month',
      filters: {},
      rpcFunction: 'get_month_pallet_count',
      parameters: [],
      confidence: 0.75,
      description: "This month's total pallet count"
    };
  }
  
  // 默認：今天總數
  return {
    type: 'count',
    timeframe: 'today',
    filters: {},
    rpcFunction: 'get_today_pallet_count',
    parameters: [],
    confidence: 0.7,
    description: "Default: Today's total pallet count"
  };
}

// 重量查詢映射 (改進版)
function mapWeightQuery(
  timeframe: QueryIntent['timeframe'],
  grnFilters: { includeGrn?: boolean; excludeGrn?: boolean }
): QueryIntent {
  
  console.log(`[Weight Query] Mapping weight query for timeframe: ${timeframe}`);
  
  if (timeframe === 'today') {
    return {
      type: 'weight',
      timeframe: 'today',
      filters: { includeGrn: true },
      rpcFunction: 'get_today_grn_weight_stats',
      parameters: [],
      confidence: 0.95,
      description: "Today's GRN weight statistics"
    };
  }
  
  if (timeframe === 'yesterday') {
    return {
      type: 'weight',
      timeframe: 'yesterday',
      filters: { includeGrn: true },
      rpcFunction: 'get_yesterday_grn_weight_stats',
      parameters: [],
      confidence: 0.9,
      description: "Yesterday's GRN weight statistics"
    };
  }
  
  if (timeframe === 'week') {
    return {
      type: 'weight',
      timeframe: 'week',
      filters: { includeGrn: true },
      rpcFunction: 'get_week_grn_weight_stats',
      parameters: [],
      confidence: 0.9,
      description: "This week's GRN weight statistics"
    };
  }
  
  if (timeframe === 'month') {
    return {
      type: 'weight',
      timeframe: 'month',
      filters: { includeGrn: true },
      rpcFunction: 'get_month_grn_weight_stats',
      parameters: [],
      confidence: 0.85,
      description: "This month's GRN weight statistics"
    };
  }
  
  // 默認：今天重量統計
  return {
    type: 'weight',
    timeframe: 'today',
    filters: { includeGrn: true },
    rpcFunction: 'get_today_grn_weight_stats',
    parameters: [],
    confidence: 0.8,
    description: "Default: Today's GRN weight statistics"
  };
}

// 產品統計查詢映射
function mapProductStatsQuery(
  timeframe: QueryIntent['timeframe'],
  productCode: string,
  grnFilters: { includeGrn?: boolean; excludeGrn?: boolean }
): QueryIntent {
  
  if (timeframe === 'all') {
    return {
      type: 'product',
      timeframe: 'all',
      filters: { productCode },
      rpcFunction: 'get_product_pallet_stats',
      parameters: [productCode],
      confidence: 0.9,
      description: `All-time statistics for product ${productCode}`
    };
  }
  
  // 其他時間範圍回退到計數查詢
  return mapCountQuery(timeframe, grnFilters, productCode);
}

// 產品庫存查詢映射 (新增)
function mapProductInventoryQuery(productCode: string): QueryIntent {
  return {
    type: 'inventory_threshold',
    timeframe: 'all',
    filters: { productCode },
    rpcFunction: 'get_product_current_inventory',
    parameters: [productCode],
    confidence: 0.95,
    description: `Current inventory quantity for product ${productCode}`
  };
}

// QC 歷史查詢映射 (新增)
function mapQcHistoryQuery(question: string, timeframe: QueryIntent['timeframe']): QueryIntent {
  // 提取用戶 ID (4位數字)
  const userIdMatch = question.match(/\b(\d{4})\b/);
  const userId = userIdMatch ? userIdMatch[1] : '';
  
  return {
    type: 'transfer', // 重用 transfer 類型，因為這也是歷史記錄查詢
    timeframe: timeframe,
    filters: {}, // 空的 filters，用戶ID在parameters中
    rpcFunction: 'get_qc_history_by_user',
    parameters: [userId, timeframe],
    confidence: 0.9,
    description: `QC history for user ${userId} in timeframe ${timeframe}`
  };
}

// 位置查詢映射
function mapLocationQuery(location?: string): QueryIntent {
  
  if (location) {
    return {
      type: 'location',
      timeframe: 'all',
      filters: { location },
      rpcFunction: 'get_location_pallet_count',
      parameters: [location],
      confidence: 0.85,
      description: `Pallet count at location: ${location}`
    };
  }
  
  return {
    type: 'location',
    timeframe: 'all',
    filters: {},
    rpcFunction: 'get_location_inventory_stats',
    parameters: [],
    confidence: 0.8,
    description: "All location inventory statistics"
  };
}

// 最新托盤查詢映射
function mapLatestQuery(
  timeframe: QueryIntent['timeframe'],
  productCode?: string
): QueryIntent {
  
  const limit = 5; // 修改默認顯示為5個
  
  if (productCode && timeframe === 'today') {
    return {
      type: 'latest',
      timeframe: 'today',
      filters: { productCode, limit },
      rpcFunction: 'get_today_product_latest_pallets',
      parameters: [productCode, limit],
      confidence: 0.9,
      description: `Today's latest pallets for product ${productCode}`
    };
  }
  
  if (timeframe === 'today') {
    return {
      type: 'latest',
      timeframe: 'today',
      filters: { limit },
      rpcFunction: 'get_today_latest_pallets',
      parameters: [limit],
      confidence: 0.85,
      description: "Today's latest pallets"
    };
  }
  
  // 默認：今天最新托盤
  return {
    type: 'latest',
    timeframe: 'today',
    filters: { limit },
    rpcFunction: 'get_today_latest_pallets',
    parameters: [limit],
    confidence: 0.75,
    description: "Default: Today's latest pallets"
  };
}

// 庫存排名查詢映射
function mapInventoryRankingQuery(question?: string): QueryIntent {
  // 從問題中提取數量
  let limit = 5; // 默認值
  
  if (question) {
    // 匹配各種數量表達方式
    const numberPatterns = [
      /top\s+(\d+)/i,           // "top 5", "top 10"
      /first\s+(\d+)/i,         // "first 3"
      /最高的?\s*(\d+)/,         // "最高的5個", "最高3個"
      /前\s*(\d+)/,             // "前5個", "前10"
      /頭\s*(\d+)/,             // "頭5個"
      /(\d+)\s*個最高/,          // "5個最高的"
      /show\s+(\d+)/i,          // "show 3 products"
      /give\s+me\s+(\d+)/i,     // "give me 3"
      /list\s+(\d+)/i           // "list 10 products"
    ];
    
    for (const pattern of numberPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const extractedNumber = parseInt(match[1], 10);
        if (extractedNumber > 0) {  // 移除50的限制，讓SQL函數處理
          limit = extractedNumber;
          break;
        }
      }
    }
    
    // 特殊情況：單數形式表示1個
    if (question.match(/\b(the\s+top|最高的?)\s+(product|產品)(?!s)/i)) {
      limit = 1;
    }
  }
  
  return {
    type: 'inventory_ranking',
    timeframe: 'all',
    rpcFunction: 'get_top_products_by_inventory',
    confidence: 0.85,
    description: `Top ${limit} products by total inventory quantity`,
    filters: {
      limit: limit
    },
    parameters: [limit]
  };
}

// 庫存閾值查詢映射
function mapInventoryThresholdQuery(question?: string): QueryIntent {
  // 從問題中提取閾值
  let threshold = 100; // 默認閾值
  
  if (question) {
    // 匹配各種閾值表達方式
    const thresholdPatterns = [
      /below\s+(\d+)/i,          // "below 100"
      /under\s+(\d+)/i,          // "under 50"
      /less\s+than\s+(\d+)/i,    // "less than 100"
      /lower\s+than\s+(\d+)/i,   // "lower than 50"
      /inventory\s+<\s*(\d+)/i,  // "inventory < 100"
      /inventory\s+<=\s*(\d+)/i, // "inventory <= 100"
      /低於\s*(\d+)/,            // "低於100"
      /少於\s*(\d+)/,            // "少於50"
      /不足\s*(\d+)/,            // "不足100"
      /小於\s*(\d+)/,            // "小於100"
      /(\d+)\s*以下/,            // "100以下"
      /(\d+)\s*以內/             // "100以內"
    ];
    
    for (const pattern of thresholdPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const extractedThreshold = parseInt(match[1], 10);
        if (extractedThreshold > 0) {
          threshold = extractedThreshold;
          break;
        }
      }
    }
  }
  
  return {
    type: 'inventory_threshold',
    timeframe: 'all',
    rpcFunction: 'get_products_below_inventory_threshold',
    confidence: 0.9,
    description: `Products with inventory below ${threshold}`,
    filters: {
      limit: threshold
    },
    parameters: [threshold]
  };
}

// 轉移查詢映射 (更新以支持前天)
function mapTransferQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  
  if (timeframe === 'today') {
    return {
      type: 'transfer',
      timeframe: 'today',
      filters: {},
      rpcFunction: 'get_today_transfer_stats',
      parameters: [],
      confidence: 0.85,
      description: "Today's transfer statistics"
    };
  }
  
  if (timeframe === 'week') {
    return {
      type: 'transfer',
      timeframe: 'week',
      filters: {},
      rpcFunction: 'get_week_transfer_stats',
      parameters: [],
      confidence: 0.85,
      description: "This week's transfer statistics"
    };
  }
  
  if (timeframe === 'yesterday') {
    return {
      type: 'transfer',
      timeframe: 'yesterday',
      filters: {},
      rpcFunction: 'get_yesterday_transfer_stats',
      parameters: [],
      confidence: 0.85,
      description: "Yesterday's transfer statistics"
    };
  }
  
  if (timeframe === 'day_before_yesterday') {
    return {
      type: 'transfer',
      timeframe: 'day_before_yesterday',
      filters: {},
      rpcFunction: 'get_day_before_yesterday_transfer_stats',
      parameters: [],
      confidence: 0.85,
      description: "Day before yesterday's transfer statistics"
    };
  }
  
  if (timeframe === 'month') {
    return {
      type: 'transfer',
      timeframe: 'month',
      filters: {},
      rpcFunction: 'get_month_transfer_stats',
      parameters: [],
      confidence: 0.85,
      description: "This month's transfer statistics"
    };
  }
  
  // 默認：今天轉移統計
  return {
    type: 'transfer',
    timeframe: 'today',
    filters: {},
    rpcFunction: 'get_today_transfer_stats',
    parameters: [],
    confidence: 0.75,
    description: "Default: Today's transfer statistics"
  };
}

// 供應商信息查詢映射 (新增)
function mapSupplierInfoQuery(supplierCode: string): QueryIntent {
  return {
    type: 'supplier_info',
    timeframe: 'all',
    filters: { supplierCode },
    rpcFunction: 'get_supplier_info',
    parameters: [supplierCode],
    confidence: 0.95,
    description: `Supplier information for ${supplierCode}`
  };
}

// 供應商統計查詢映射 (新增)
function mapSupplierCountQuery(): QueryIntent {
  return {
    type: 'supplier_count',
    timeframe: 'all',
    filters: {},
    rpcFunction: 'get_supplier_count',
    parameters: [],
    confidence: 0.9,
    description: 'Total supplier count'
  };
}

// 產品代碼統計查詢映射 (新增)
function mapProductCodeCountQuery(): QueryIntent {
  return {
    type: 'product_count',
    timeframe: 'all',
    filters: {},
    rpcFunction: 'get_product_code_count',
    parameters: [],
    confidence: 0.9,
    description: 'Total product code count'
  };
}

// 產品顏色過濾查詢映射 (新增)
function mapProductColourFilterQuery(question: string): QueryIntent {
  let colour = 'Black'; // 默認
  
  if (question.includes('黑色') || question.includes('black')) {
    colour = 'Black';
  } else if (question.includes('白色') || question.includes('white')) {
    colour = 'White';
  } else if (question.includes('紅色') || question.includes('red')) {
    colour = 'Red';
  } else if (question.includes('藍色') || question.includes('blue')) {
    colour = 'Blue';
  } else if (question.includes('綠色') || question.includes('green')) {
    colour = 'Green';
  }
  
  return {
    type: 'product_filter',
    timeframe: 'all',
    filters: { colour },
    rpcFunction: 'get_products_by_colour',
    parameters: [colour],
    confidence: 0.85,
    description: `Products with colour: ${colour}`
  };
}

// GRN 列表查詢映射 (新增)
function mapGrnListQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  const limit = 10; // 默認顯示10筆
  
  if (timeframe === 'today') {
    return {
      type: 'grn_list',
      timeframe: 'today',
      filters: { limit },
      rpcFunction: 'get_today_grn_records',
      parameters: [limit],
      confidence: 0.9,
      description: "Today's GRN records"
    };
  }
  
  // 默認：最近的GRN記錄
  return {
    type: 'grn_list',
    timeframe: 'all',
    filters: { limit },
    rpcFunction: 'get_recent_grn_records',
    parameters: [limit],
    confidence: 0.85,
    description: 'Recent GRN records'
  };
}

// ACO 訂單查詢映射 (新增)
function mapAcoOrderQuery(): QueryIntent {
  return {
    type: 'aco_list',
    timeframe: 'all',
    filters: {},
    rpcFunction: 'get_active_aco_orders',
    parameters: [],
    confidence: 0.85,
    description: 'Active ACO orders with remaining quantities'
  };
}

// 托盤歷史查詢映射 (新增)
function mapPalletHistoryQuery(palletNumber: string): QueryIntent {
  return {
    type: 'pallet_history',
    timeframe: 'all',
    filters: { palletNumber },
    rpcFunction: 'get_pallet_history',
    parameters: [palletNumber],
    confidence: 0.9,
    description: `Transfer history for pallet ${palletNumber}`
  };
}

// 作廢查詢映射 (新增)
function mapVoidRecordsQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  return {
    type: 'void',
    timeframe: timeframe,
    filters: {},
    rpcFunction: 'get_void_records',
    parameters: [],
    confidence: 0.9,
    description: 'Void records'
  };
}

// 作廢計數查詢映射 (新增)
function mapVoidCountQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  return {
    type: 'void',
    timeframe: timeframe,
    filters: {},
    rpcFunction: 'get_void_count',
    parameters: [],
    confidence: 0.9,
    description: 'Void count'
  };
}

// 用戶活動查詢映射 (新增)
function mapUserActivityQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  return {
    type: 'user_activity',
    timeframe: timeframe,
    filters: {},
    rpcFunction: 'get_user_activity',
    parameters: [],
    confidence: 0.9,
    description: 'User activity'
  };
}

// 操作歷史查詢映射 (新增)
function mapOperationHistoryQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  return {
    type: 'operation_history',
    timeframe: timeframe,
    filters: {},
    rpcFunction: 'get_operation_history',
    parameters: [],
    confidence: 0.9,
    description: 'Operation history'
  };
}

// 庫存最少查詢映射 (新增)
function mapLowestInventoryQuery(question?: string): QueryIntent {
  // 從問題中提取數量
  let limit = 3; // 默認值
  
  if (question) {
    // 匹配各種數量表達方式
    const numberPatterns = [
      /前\s*(\d+)/,             // "前3個", "前10"
      /最少的?\s*(\d+)/,         // "最少的3個"
      /(\d+)\s*個最少/,          // "3個最少的"
      /lowest\s+(\d+)/i,        // "lowest 3"
      /smallest\s+(\d+)/i,      // "smallest 5"
    ];
    
    for (const pattern of numberPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        const extractedNumber = parseInt(match[1], 10);
        if (extractedNumber > 0 && extractedNumber <= 50) {
          limit = extractedNumber;
          break;
        }
      }
    }
  }
  
  return {
    type: 'inventory_ranking',
    timeframe: 'all',
    rpcFunction: 'get_lowest_inventory_products',
    confidence: 0.9,
    description: `Lowest ${limit} products by inventory`,
    filters: {
      limit: limit
    },
    parameters: [limit]
  };
}

// 非GRN托盤查詢映射 (新增)
function mapNonGrnPalletQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  
  if (timeframe === 'today') {
    return {
      type: 'count',
      timeframe: 'today',
      filters: { excludeGrn: true },
      rpcFunction: 'get_today_non_grn_pallet_count',
      parameters: [],
      confidence: 0.95,
      description: "Today's non-GRN pallet count"
    };
  }
  
  // 默認：今天非GRN托盤
  return {
    type: 'count',
    timeframe: 'today',
    filters: { excludeGrn: true },
    rpcFunction: 'get_today_non_grn_pallet_count',
    parameters: [],
    confidence: 0.85,
    description: "Default: Today's non-GRN pallet count"
  };
}

// GRN限定查詢映射 (新增)
function mapGrnOnlyCountQuery(timeframe: QueryIntent['timeframe']): QueryIntent {
  
  if (timeframe === 'week') {
    return {
      type: 'count',
      timeframe: 'week',
      filters: { includeGrn: true },
      rpcFunction: 'get_week_grn_pallet_count',
      parameters: [],
      confidence: 0.95,
      description: "This week's GRN-only pallet count"
    };
  }
  
  if (timeframe === 'today') {
    return {
      type: 'count',
      timeframe: 'today',
      filters: { includeGrn: true },
      rpcFunction: 'get_today_grn_pallet_count',
      parameters: [],
      confidence: 0.95,
      description: "Today's GRN pallet count"
    };
  }
  
  // 默認：本週GRN托盤
  return {
    type: 'count',
    timeframe: 'week',
    filters: { includeGrn: true },
    rpcFunction: 'get_week_grn_pallet_count',
    parameters: [],
    confidence: 0.85,
    description: "Default: This week's GRN pallet count"
  };
}

// RPC 函數執行器
export async function executeRpcQuery(intent: QueryIntent, supabase: any): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log(`[RPC Executor] Executing: ${intent.rpcFunction}(${intent.parameters.join(', ')})`);
    console.log(`[RPC Executor] Description: ${intent.description}`);
    
    let result;
    let data;
    let error;

    // 根據 RPC 函數名稱和參數執行對應的查詢
    switch (intent.rpcFunction) {
      // 無參數的函數
      case 'get_today_pallet_count':
      case 'get_yesterday_pallet_count':
      case 'get_day_before_yesterday_pallet_count':
      case 'get_week_pallet_count':
      case 'get_month_pallet_count':
      case 'get_today_grn_pallet_count':
      case 'get_yesterday_grn_pallet_count':
      case 'get_week_grn_pallet_count':
      case 'get_month_grn_pallet_count':
      case 'get_today_non_grn_pallet_count':
      case 'get_yesterday_non_grn_pallet_count':
      case 'get_week_non_grn_pallet_count':
      case 'get_month_non_grn_pallet_count':
      case 'get_today_weight_stats':
      case 'get_yesterday_weight_stats':
      case 'get_week_weight_stats':
      case 'get_month_weight_stats':
      case 'get_today_grn_weight_stats':
      case 'get_yesterday_grn_weight_stats':
      case 'get_week_grn_weight_stats':
      case 'get_yesterday_transfer_stats':
      case 'get_week_transfer_stats':
      case 'get_month_transfer_stats':
      case 'get_day_before_yesterday_transfer_stats':
      case 'get_latest_pallets_today':
      case 'get_latest_pallets_yesterday':
      case 'get_latest_pallets_week':
      case 'get_latest_pallets_month':
      case 'get_latest_pallets_all':
        ({ data, error } = await supabase.rpc(intent.rpcFunction));
        break;

      // 新增的查詢類型處理
      case 'get_lowest_inventory_products':
        if (intent.parameters.length > 0) {
          const limitCount = intent.parameters[0];
          ({ data, error } = await supabase.rpc(intent.rpcFunction, { limit_count: limitCount }));
        } else {
          ({ data, error } = await supabase.rpc(intent.rpcFunction, { limit_count: 3 }));
        }
        break;
        
      // 帶參數的函數
      case 'get_top_products_by_inventory':
        if (intent.parameters.length > 0) {
          const limitCount = intent.parameters[0];
          ({ data, error } = await supabase.rpc(intent.rpcFunction, { limit_count: limitCount }));
        } else {
          // 如果沒有參數，使用默認值
          ({ data, error } = await supabase.rpc(intent.rpcFunction, { limit_count: 5 }));
        }
        break;

      case 'get_products_below_inventory_threshold':
        // 修復：使用正確的聚合查詢邏輯而不是有問題的 RPC 函數
        console.log(`[RPC Executor] Using fixed aggregation logic for inventory threshold query`);
        
        if (intent.parameters.length > 0) {
          const thresholdValue = intent.parameters[0];
          
          // 執行查詢獲取庫存數據
          ({ data, error } = await supabase
            .from('record_inventory')
            .select(`
              product_code,
              injection,
              pipeline, 
              prebook,
              await,
              fold,
              bulk,
              backcarpark
            `));
          
          if (!error && data) {
            // 在客戶端進行聚合計算（確保邏輯正確）
            const productTotals: Record<string, {
              product_code: string;
              injection_qty: number;
              pipeline_qty: number;
              prebook_qty: number;
              await_qty: number;
              fold_qty: number;
              bulk_qty: number;
              backcarpark_qty: number;
              total_inventory: number;
            }> = {};
            
            data.forEach((row: any) => {
              const code = row.product_code;
              if (!code) return;
              
              if (!productTotals[code]) {
                productTotals[code] = {
                  product_code: code,
                  injection_qty: 0, pipeline_qty: 0, prebook_qty: 0,
                  await_qty: 0, fold_qty: 0, bulk_qty: 0, backcarpark_qty: 0,
                  total_inventory: 0
                };
              }
              
              productTotals[code].injection_qty += (row.injection || 0);
              productTotals[code].pipeline_qty += (row.pipeline || 0);
              productTotals[code].prebook_qty += (row.prebook || 0);
              productTotals[code].await_qty += (row.await || 0);
              productTotals[code].fold_qty += (row.fold || 0);
              productTotals[code].bulk_qty += (row.bulk || 0);
              productTotals[code].backcarpark_qty += (row.backcarpark || 0);
              
              productTotals[code].total_inventory = 
                productTotals[code].injection_qty + 
                productTotals[code].pipeline_qty + 
                productTotals[code].prebook_qty + 
                productTotals[code].await_qty + 
                productTotals[code].fold_qty + 
                productTotals[code].bulk_qty + 
                productTotals[code].backcarpark_qty;
            });
            
            // 過濾並排序結果
            data = Object.values(productTotals)
              .filter(product => product.total_inventory < thresholdValue && product.total_inventory >= 0)
              .sort((a, b) => a.total_inventory - b.total_inventory)
              .slice(0, 20);
              
            console.log(`[RPC Executor] Fixed aggregation returned ${data.length} products below ${thresholdValue}`);
          }
        } else {
          // 默認閾值100的查詢
          ({ data, error } = await supabase
            .from('record_inventory')
            .select(`
              product_code,
              injection,
              pipeline, 
              prebook,
              await,
              fold,
              bulk,
              backcarpark
            `));
          
          if (!error && data) {
            // 客戶端聚合計算（默認閾值100）
            const productTotals: Record<string, {
              product_code: string;
              injection_qty: number;
              pipeline_qty: number;
              prebook_qty: number;
              await_qty: number;
              fold_qty: number;
              bulk_qty: number;
              backcarpark_qty: number;
              total_inventory: number;
            }> = {};
            
            data.forEach((row: any) => {
              const code = row.product_code;
              if (!code) return;
              
              if (!productTotals[code]) {
                productTotals[code] = {
                  product_code: code,
                  injection_qty: 0, pipeline_qty: 0, prebook_qty: 0,
                  await_qty: 0, fold_qty: 0, bulk_qty: 0, backcarpark_qty: 0,
                  total_inventory: 0
                };
              }
              
              productTotals[code].injection_qty += (row.injection || 0);
              productTotals[code].pipeline_qty += (row.pipeline || 0);
              productTotals[code].prebook_qty += (row.prebook || 0);
              productTotals[code].await_qty += (row.await || 0);
              productTotals[code].fold_qty += (row.fold || 0);
              productTotals[code].bulk_qty += (row.bulk || 0);
              productTotals[code].backcarpark_qty += (row.backcarpark || 0);
              
              productTotals[code].total_inventory = 
                productTotals[code].injection_qty + 
                productTotals[code].pipeline_qty + 
                productTotals[code].prebook_qty + 
                productTotals[code].await_qty + 
                productTotals[code].fold_qty + 
                productTotals[code].bulk_qty + 
                productTotals[code].backcarpark_qty;
            });
            
            // 過濾並排序結果（默認閾值100）
            data = Object.values(productTotals)
              .filter(product => product.total_inventory < 100 && product.total_inventory >= 0)
              .sort((a, b) => a.total_inventory - b.total_inventory)
              .slice(0, 20);
              
            console.log(`[RPC Executor] Fixed aggregation returned ${data.length} products below 100 (default)`);
          }
        }
        break;

      case 'get_product_current_inventory':
        // 獲取特定產品的當前庫存總量
        console.log(`[RPC Executor] Getting current inventory for product: ${intent.parameters[0]}`);
        
        if (intent.parameters.length > 0) {
          const productCode = intent.parameters[0].toUpperCase();
          
          // 執行查詢獲取該產品的所有庫存記錄
          ({ data, error } = await supabase
            .from('record_inventory')
            .select(`
              product_code,
              injection,
              pipeline, 
              prebook,
              await,
              fold,
              bulk,
              backcarpark
            `)
            .eq('product_code', productCode));
          
          if (!error && data) {
            // 計算該產品的總庫存
            let totalInventory = 0;
            let injection_qty = 0, pipeline_qty = 0, prebook_qty = 0;
            let await_qty = 0, fold_qty = 0, bulk_qty = 0, backcarpark_qty = 0;
            
            data.forEach((row: any) => {
              injection_qty += (row.injection || 0);
              pipeline_qty += (row.pipeline || 0);
              prebook_qty += (row.prebook || 0);
              await_qty += (row.await || 0);
              fold_qty += (row.fold || 0);
              bulk_qty += (row.bulk || 0);
              backcarpark_qty += (row.backcarpark || 0);
            });
            
            totalInventory = injection_qty + pipeline_qty + prebook_qty + 
                           await_qty + fold_qty + bulk_qty + backcarpark_qty;
            
            // 返回單一產品的庫存信息
            data = [{
              product_code: productCode,
              total_inventory: totalInventory,
              injection_qty,
              pipeline_qty,
              prebook_qty,
              await_qty,
              fold_qty,
              bulk_qty,
              backcarpark_qty
            }];
            
            console.log(`[RPC Executor] Product ${productCode} current inventory: ${totalInventory} units`);
          } else {
            // 產品不存在或沒有庫存記錄
            data = [{
              product_code: productCode,
              total_inventory: 0,
              injection_qty: 0, pipeline_qty: 0, prebook_qty: 0,
              await_qty: 0, fold_qty: 0, bulk_qty: 0, backcarpark_qty: 0
            }];
            error = null; // 重置錯誤，因為這是正常情況
            console.log(`[RPC Executor] Product ${productCode} not found or has no inventory`);
          }
        } else {
          throw new Error('Product code parameter is required for get_product_current_inventory');
        }
        break;

      case 'get_qc_history_by_user':
        // 查詢 record_history 表
        console.log(`[RPC Executor] Getting QC history for user: ${intent.parameters[0]} in timeframe: ${intent.parameters[1]}`);
        
        if (intent.parameters.length > 1) {
          const userId = intent.parameters[0];
          const timeframe = intent.parameters[1];
          
          // 計算時間範圍
          const now = new Date();
          let startDate: string, endDate: string;
          
          if (timeframe === 'week') {
            // 計算本週開始和結束日期
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dayOfWeek = today.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - daysToMonday);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            startDate = weekStart.toISOString();
            endDate = weekEnd.toISOString();
          } else if (timeframe === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            
            startDate = today.toISOString();
            endDate = todayEnd.toISOString();
          } else {
            // 默認為今天
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);
            
            startDate = today.toISOString();
            endDate = todayEnd.toISOString();
          }
          
          // 定義 QC 相關的 action 類型（根據用戶說明）
          const qcActions = [
            'GRN Receiving',
            'Stock Transfer', 
            'Finished QC',
            'Auto Reprint',
            'Void Pallet',
            'Partially Damaged'
          ];
          
          // 執行查詢獲取該用戶的 QC 歷史記錄
          ({ data, error } = await supabase
            .from('record_history')
            .select(`
              plt_num,
              action,
              time,
              id
            `)
            .eq('id', userId)
            .gte('time', startDate)
            .lte('time', endDate)
            .in('action', qcActions));
          
          if (!error && data) {
            // 計算托盤數量（去重）
            const uniquePallets = new Set(data.map((row: any) => row.plt_num));
            const totalPallets = uniquePallets.size;
            const totalRecords = data.length;
            
            // 返回統計結果
            data = {
              total_pallets: totalRecords, // 使用總記錄數，因為每條記錄代表一次QC操作
              unique_pallets: totalPallets, // 也保留唯一托盤數供參考
              user_id: userId,
              timeframe: timeframe,
              start_date: startDate,
              end_date: endDate,
              records: data,
              actions: qcActions
            };
            
            console.log(`[RPC Executor] QC history for user ${userId} in timeframe ${timeframe}: ${totalRecords} QC operations on ${totalPallets} unique pallets`);
          } else {
            // 用戶不存在或沒有 QC 歷史記錄
            data = {
              total_pallets: 0,
              unique_pallets: 0,
              user_id: userId,
              timeframe: timeframe,
              start_date: startDate,
              end_date: endDate,
              records: [],
              actions: qcActions
            };
            error = null; // 重置錯誤，因為這是正常情況
            console.log(`[RPC Executor] No QC history found for user ${userId} in timeframe ${timeframe}`);
          }
        } else {
          throw new Error('User ID and timeframe parameters are required for get_qc_history_by_user');
        }
        break;

      // 新增的 RPC 函數處理
      case 'get_product_code_count':
        // 獲取產品代碼總數
        const { count: productCount, error: productCountError } = await supabase
          .from('data_code')
          .select('*', { count: 'exact', head: true });
        
        if (!productCountError) {
          data = productCount || 0; // 返回計數
          console.log(`[RPC Executor] Total product codes: ${data}`);
        } else {
          error = productCountError;
        }
        break;

      case 'get_supplier_count':
        // 獲取供應商總數
        const { count: supplierCount, error: supplierCountError } = await supabase
          .from('data_supplier')
          .select('*', { count: 'exact', head: true });
        
        if (!supplierCountError) {
          data = supplierCount || 0; // 返回計數
          console.log(`[RPC Executor] Total suppliers: ${data}`);
        } else {
          error = supplierCountError;
        }
        break;

      case 'get_supplier_info':
        // 獲取特定供應商信息
        if (intent.parameters.length > 0) {
          const supplierCode = intent.parameters[0];
          ({ data, error } = await supabase
            .from('data_supplier')
            .select('*')
            .eq('supplier_code', supplierCode)
            .single());
          
          if (!error && data) {
            console.log(`[RPC Executor] Found supplier: ${supplierCode}`);
          } else if (!data) {
            data = { supplier_code: supplierCode, supplier_name: 'Not found' };
            error = null;
          }
        }
        break;

      case 'get_products_by_colour':
        // 獲取特定顏色的產品
        if (intent.parameters.length > 0) {
          const colour = intent.parameters[0];
          ({ data, error } = await supabase
            .from('data_code')
            .select('*')
            .eq('colour', colour)
            .limit(20));
          
          if (!error) {
            console.log(`[RPC Executor] Found ${data?.length || 0} ${colour} products`);
          }
        }
        break;

      case 'get_recent_grn_records':
      case 'get_today_grn_records':
        // 獲取最近的 GRN 記錄
        const grnLimit = intent.parameters[0] || 10;
        let grnQuery = supabase
          .from('record_grn')
          .select('*')
          .order('creat_time', { ascending: false })
          .limit(grnLimit);
        
        // 如果是今天的記錄，添加時間過濾
        if (intent.rpcFunction === 'get_today_grn_records') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          grnQuery = grnQuery.gte('creat_time', today.toISOString());
        }
        
        ({ data, error } = await grnQuery);
        
        if (!error) {
          console.log(`[RPC Executor] Found ${data?.length || 0} GRN records`);
        }
        break;

      case 'get_active_aco_orders':
        // 獲取活躍的 ACO 訂單
        ({ data, error } = await supabase
          .from('record_aco')
          .select('*')
          .gt('remain_qty', 0)
          .order('latest_update', { ascending: false })
          .limit(20));
        
        if (!error) {
          console.log(`[RPC Executor] Found ${data?.length || 0} active ACO orders`);
        }
        break;

      case 'get_pallet_history':
        // 獲取托盤歷史
        ({ data, error } = await supabase
          .from('record_history')
          .select('*')
          .eq('plt_num', intent.parameters[0])
          .order('time', { ascending: false })
          .limit(10));
        break;

      case 'get_today_latest_pallets':
        // 獲取今天最新的托盤
        const todayLimit = intent.parameters[0] || 10;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_palletinfo')
          .select('*')
          .gte('generate_time', today.toISOString())
          .order('generate_time', { ascending: false })
          .limit(todayLimit));
        
        if (!error) {
          console.log(`[RPC Executor] Found ${data?.length || 0} pallets generated today`);
        }
        break;

      case 'get_today_transfer_stats':
        // 獲取今天的轉移統計
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_transfer')
          .select('*')
          .gte('tran_date', todayStart.toISOString())
          .order('tran_date', { ascending: false }));
        
        if (!error && data) {
          // 返回轉移列表而不是統計
          console.log(`[RPC Executor] Found ${data.length} transfers today`);
        }
        break;

      // 位置查詢 (修復)
      case 'get_location_pallet_count':
        // 獲取特定位置的托盤數量
        const locationParam = intent.parameters[0];
        const locationColumn = locationParam.toLowerCase().replace(/\s+/g, ''); // 移除空格並轉小寫
        
        // 映射位置名稱到數據庫欄位
        const locationMapping: { [key: string]: string } = {
          'await': 'await',
          'awaiting': 'await',
          'injection': 'injection',
          'pipeline': 'pipeline',
          'prebook': 'prebook',
          'foldmill': 'fold',
          'fold': 'fold',
          'bulkroom': 'bulk',
          'bulk': 'bulk',
          'backcarpark': 'backcarpark',
          'carpark': 'backcarpark'
        };
        
        const dbColumn = locationMapping[locationColumn] || locationColumn;
        
        // 查詢該位置的托盤數量
        ({ data, error } = await supabase
          .from('record_inventory')
          .select(`${dbColumn}`)
          .gt(dbColumn, 0));
        
        if (!error && data) {
          // 計算該位置的總托盤數
          let totalCount = 0;
          data.forEach((record: any) => {
            if (record[dbColumn] > 0) totalCount++;
          });
          data = totalCount;
          console.log(`[RPC Executor] Pallets at ${locationParam}: ${totalCount}`);
        }
        break;

      // 作廢記錄查詢 (新增)
      case 'get_void_records':
        // 獲取最近的作廢記錄
        ({ data, error } = await supabase
          .from('record_history')
          .select('*')
          .eq('action', 'Void Pallet')
          .order('time', { ascending: false })
          .limit(10));
        break;

      // 作廢計數查詢 (新增)
      case 'get_void_count':
        // 獲取作廢托盤總數
        const { count: voidCount, error: voidError } = await supabase
          .from('record_history')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'Void Pallet');
        
        if (!voidError) {
          data = voidCount || 0;
          console.log(`[RPC Executor] Total void pallets: ${data}`);
        } else {
          error = voidError;
        }
        break;

      // 用戶活動查詢 (新增)
      case 'get_user_activity':
        // 獲取今天的用戶活動
        const userActivityStart = new Date();
        userActivityStart.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_history')
          .select('id')
          .gte('time', userActivityStart.toISOString())
          .order('id'));
        
        if (!error && data) {
          // 獲取唯一用戶列表
          const uniqueUsers = [...new Set(data.map((record: any) => record.id))].filter(id => id !== null);
          data = uniqueUsers;
          console.log(`[RPC Executor] Active users today: ${uniqueUsers.length}`);
        }
        break;

      // 操作歷史查詢 (新增)
      case 'get_operation_history':
        // 獲取本週的操作歷史總數
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const { count: historyCount, error: historyError } = await supabase
          .from('record_history')
          .select('*', { count: 'exact', head: true })
          .gte('time', weekStart.toISOString());
        
        if (!historyError) {
          data = historyCount || 0;
          console.log(`[RPC Executor] Operations this week: ${data}`);
        } else {
          error = historyError;
        }
        break;

      // 員工活動查詢 (新增)
      case 'get_user_workload_stats':
        // 獲取特定用戶的工作量統計
        if (intent.parameters.length > 1) {
          const userId = intent.parameters[0];
          const timeframe = intent.parameters[1];
          
          // 計算時間範圍
          const now = new Date();
          let startDate: string;
          
          if (timeframe === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          } else if (timeframe === 'week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            startDate = weekStart.toISOString();
          } else if (timeframe === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            startDate = yesterday.toISOString();
          } else {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          }
          
          // 查詢用戶操作記錄
          const { count: userWorkload, error: userError } = await supabase
            .from('record_history')
            .select('*', { count: 'exact', head: true })
            .eq('id', userId)
            .gte('time', startDate);
          
          if (!userError) {
            data = {
              user_id: userId,
              timeframe: timeframe,
              total_operations: userWorkload || 0,
              start_date: startDate
            };
            console.log(`[RPC Executor] User ${userId} workload in ${timeframe}: ${userWorkload || 0} operations`);
          } else {
            error = userError;
          }
        }
        break;

      case 'get_all_users_workload_stats':
        // 獲取所有用戶的工作量統計
        if (intent.parameters.length > 0) {
          const timeframe = intent.parameters[0];
          
          // 計算時間範圍
          const now = new Date();
          let startDate: string;
          
          if (timeframe === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          } else if (timeframe === 'week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            startDate = weekStart.toISOString();
          } else {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          }
          
          // 查詢所有用戶的操作統計
          ({ data, error } = await supabase
            .from('record_history')
            .select('id')
            .gte('time', startDate));
          
          if (!error && data) {
            // 統計每個用戶的操作數量
            const userStats: Record<string, number> = {};
            data.forEach((record: any) => {
              if (record.id) {
                userStats[record.id] = (userStats[record.id] || 0) + 1;
              }
            });
            
            // 轉換為數組格式
            data = Object.entries(userStats)
              .map(([userId, count]) => ({
                user_id: userId,
                operation_count: count,
                timeframe: timeframe
              }))
              .sort((a, b) => b.operation_count - a.operation_count)
              .slice(0, 20); // 限制返回前20個用戶
            
            console.log(`[RPC Executor] All users workload in ${timeframe}: ${data.length} active users`);
          }
        }
        break;

      case 'get_user_activity_stats':
        // 獲取用戶活動統計（活躍用戶數量）
        if (intent.parameters.length > 0) {
          const timeframe = intent.parameters[0];
          
          const now = new Date();
          let startDate: string;
          
          if (timeframe === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          } else if (timeframe === 'week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            startDate = weekStart.toISOString();
          } else {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate = today.toISOString();
          }
          
          ({ data, error } = await supabase
            .from('record_history')
            .select('id')
            .gte('time', startDate));
          
          if (!error && data) {
            const uniqueUsers = [...new Set(data.map((record: any) => record.id))].filter(id => id !== null);
            data = {
              timeframe: timeframe,
              active_users_count: uniqueUsers.length,
              total_operations: data.length,
              start_date: startDate,
              active_users: uniqueUsers.slice(0, 10) // 前10個活躍用戶
            };
            
            console.log(`[RPC Executor] User activity stats for ${timeframe}: ${uniqueUsers.length} active users`);
          }
        }
        break;

      case 'get_today_grn_weight_stats':
        console.log(`[RPC Executor] Using direct query for today's GRN weight stats`);
        
        const todayWeightStart = new Date();
        todayWeightStart.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_grn')
          .select('gross_weight, net_weight')
          .gte('creat_time', todayWeightStart.toISOString()));
        
        if (!error && data) {
          let totalGrossWeight = 0;
          let totalNetWeight = 0;
          
          data.forEach((record: any) => {
            totalGrossWeight += (record.gross_weight || 0);
            totalNetWeight += (record.net_weight || 0);
          });
          
          data = {
            total_gross_weight: totalGrossWeight,
            total_net_weight: totalNetWeight,
            average_gross_weight: data.length > 0 ? Math.round(totalGrossWeight / data.length) : 0,
            average_net_weight: data.length > 0 ? Math.round(totalNetWeight / data.length) : 0,
            count: data.length
          };
          
          console.log(`[RPC Executor] Today's GRN weight stats: ${data.count} records`);
        }
        break;

      case 'get_yesterday_grn_weight_stats':
        console.log(`[RPC Executor] Using direct query for yesterday's GRN weight stats`);
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        
        ({ data, error } = await supabase
          .from('record_grn')
          .select('gross_weight, net_weight')
          .gte('creat_time', yesterday.toISOString())
          .lte('creat_time', yesterdayEnd.toISOString()));
        
        if (!error && data) {
          let totalGrossWeight = 0;
          let totalNetWeight = 0;
          
          data.forEach((record: any) => {
            totalGrossWeight += (record.gross_weight || 0);
            totalNetWeight += (record.net_weight || 0);
          });
          
          data = {
            total_gross_weight: totalGrossWeight,
            total_net_weight: totalNetWeight,
            average_gross_weight: data.length > 0 ? Math.round(totalGrossWeight / data.length) : 0,
            average_net_weight: data.length > 0 ? Math.round(totalNetWeight / data.length) : 0,
            count: data.length
          };
          
          console.log(`[RPC Executor] Yesterday's GRN weight stats: ${data.count} records`);
        }
        break;

      case 'get_week_grn_weight_stats':
        console.log(`[RPC Executor] Using direct query for this week's GRN weight stats`);
        
        const weekWeightStart = new Date();
        weekWeightStart.setDate(weekWeightStart.getDate() - weekWeightStart.getDay());
        weekWeightStart.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_grn')
          .select('gross_weight, net_weight')
          .gte('creat_time', weekWeightStart.toISOString()));
        
        if (!error && data) {
          let totalGrossWeight = 0;
          let totalNetWeight = 0;
          
          data.forEach((record: any) => {
            totalGrossWeight += (record.gross_weight || 0);
            totalNetWeight += (record.net_weight || 0);
          });
          
          data = {
            total_gross_weight: totalGrossWeight,
            total_net_weight: totalNetWeight,
            average_gross_weight: data.length > 0 ? Math.round(totalGrossWeight / data.length) : 0,
            average_net_weight: data.length > 0 ? Math.round(totalNetWeight / data.length) : 0,
            count: data.length
          };
          
          console.log(`[RPC Executor] This week's GRN weight stats: ${data.count} records`);
        }
        break;

      case 'get_month_grn_weight_stats':
        console.log(`[RPC Executor] Using direct query for this month's GRN weight stats`);
        
        const monthWeightStart = new Date();
        monthWeightStart.setDate(1);
        monthWeightStart.setHours(0, 0, 0, 0);
        
        ({ data, error } = await supabase
          .from('record_grn')
          .select('gross_weight, net_weight')
          .gte('creat_time', monthWeightStart.toISOString()));
        
        if (!error && data) {
          let totalGrossWeight = 0;
          let totalNetWeight = 0;
          
          data.forEach((record: any) => {
            totalGrossWeight += (record.gross_weight || 0);
            totalNetWeight += (record.net_weight || 0);
          });
          
          data = {
            total_gross_weight: totalGrossWeight,
            total_net_weight: totalNetWeight,
            average_gross_weight: data.length > 0 ? Math.round(totalGrossWeight / data.length) : 0,
            average_net_weight: data.length > 0 ? Math.round(totalNetWeight / data.length) : 0,
            count: data.length
          };
          
          console.log(`[RPC Executor] This month's GRN weight stats: ${data.count} records`);
        }
        break;

      case 'get_yesterday_transfer_stats':
        console.log(`[RPC Executor] Using direct query for yesterday's transfer stats`);
        
        const yesterdayTransferStart = new Date();
        yesterdayTransferStart.setDate(yesterdayTransferStart.getDate() - 1);
        yesterdayTransferStart.setHours(0, 0, 0, 0);
        const yesterdayTransferEnd = new Date(yesterdayTransferStart);
        yesterdayTransferEnd.setHours(23, 59, 59, 999);
        
        const { count: yesterdayTransferCount, error: yesterdayTransferError } = await supabase
          .from('record_transfer')
          .select('*', { count: 'exact', head: true })
          .gte('tran_date', yesterdayTransferStart.toISOString())
          .lte('tran_date', yesterdayTransferEnd.toISOString());
        
        if (!yesterdayTransferError) {
          data = yesterdayTransferCount || 0;
          console.log(`[RPC Executor] Yesterday's transfer stats: ${data} transfers`);
        } else {
          error = yesterdayTransferError;
        }
        break;

      case 'get_week_transfer_stats':
        console.log(`[RPC Executor] Using direct query for this week's transfer stats`);
        
        const weekTransferStart = new Date();
        weekTransferStart.setDate(weekTransferStart.getDate() - weekTransferStart.getDay());
        weekTransferStart.setHours(0, 0, 0, 0);
        
        const { count: weekTransferCount, error: weekTransferError } = await supabase
          .from('record_transfer')
          .select('*', { count: 'exact', head: true })
          .gte('tran_date', weekTransferStart.toISOString());
        
        if (!weekTransferError) {
          data = weekTransferCount || 0;
          console.log(`[RPC Executor] This week's transfer stats: ${data} transfers`);
        } else {
          error = weekTransferError;
        }
        break;

      case 'get_month_transfer_stats':
        console.log(`[RPC Executor] Using direct query for this month's transfer stats`);
        
        const monthTransferStart = new Date();
        monthTransferStart.setDate(1);
        monthTransferStart.setHours(0, 0, 0, 0);
        
        const { count: monthTransferCount, error: monthTransferError } = await supabase
          .from('record_transfer')
          .select('*', { count: 'exact', head: true })
          .gte('tran_date', monthTransferStart.toISOString());
        
        if (!monthTransferError) {
          data = monthTransferCount || 0;
          console.log(`[RPC Executor] This month's transfer stats: ${data} transfers`);
        } else {
          error = monthTransferError;
        }
        break;

      default:
        throw new Error(`Unknown RPC function: ${intent.rpcFunction}`);
    }

    if (error) {
      throw new Error(`RPC function ${intent.rpcFunction} failed: ${error.message}`);
    }

    const executionTime = Date.now() - startTime;
    const rowCount = Array.isArray(data) ? data.length : (data !== null ? 1 : 0);
    
    console.log(`[RPC Executor] Success: ${intent.rpcFunction} returned ${rowCount} rows in ${executionTime}ms`);
    
    return {
      data,
      executionTime,
      rowCount
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[RPC Executor] Error in ${intent.rpcFunction}:`, error.message);
    throw new Error(`RPC execution failed: ${error.message} (${executionTime}ms)`);
  }
}

// 獲取 RPC 函數參數名稱
function getParameterName(rpcFunction: string, paramIndex: number): string {
  const parameterMappings: Record<string, string[]> = {
    'get_product_pallet_stats': ['product_code_param'],
    'get_today_product_stats': ['product_code_param'],
    'get_yesterday_product_stats': ['product_code_param'],
    'get_today_product_non_grn_stats': ['product_code_param'],
    'get_location_pallet_count': ['location_name'],
    'get_today_latest_pallets': ['limit_count'],
    'get_today_product_latest_pallets': ['product_code_param', 'limit_count'],
    'get_pallet_transfer_history': ['pallet_num'],
    'get_pallet_current_location': ['pallet_nums'],
    'get_flexible_pallet_count': ['date_filter', 'grn_filter', 'product_filter', 'location_filter']
  };
  
  const params = parameterMappings[rpcFunction];
  if (params && params[paramIndex]) {
    return params[paramIndex];
  }
  
  // 默認參數名稱
  return `param${paramIndex + 1}`;
} 

// 員工活動查詢映射 (新增)
function mapEmployeeActivityQuery(question: string, timeframe: QueryIntent['timeframe']): QueryIntent {
  
  // 檢查是否包含特定用戶ID（4位數字）
  const userIdMatch = question.match(/\b(\d{4})\b/);
  const userId = userIdMatch ? userIdMatch[1] : null;
  
  // "哪些員工"查詢 - 查詢活躍員工列表
  if (question.includes('哪些') || question.includes('which') || 
      question.includes('在工作') || question.includes('在進行') ||
      question.includes('active')) {
    
    return {
      type: 'user_activity',
      timeframe: timeframe,
      filters: {},
      rpcFunction: 'get_user_activity_stats',
      parameters: [timeframe],
      confidence: 0.9,
      description: `Active employees for timeframe ${timeframe}`
    };
  }
  
  // 工作量/處理量查詢
  if (question.includes('工作量') || question.includes('workload') || 
      question.includes('處理') || question.includes('handle') || 
      question.includes('完成') || question.includes('process')) {
    
    if (userId) {
      // 特定用戶的工作量查詢
      return {
        type: 'user_activity',
        timeframe: timeframe,
        filters: {},
        rpcFunction: 'get_user_workload_stats',
        parameters: [userId, timeframe],
        confidence: 0.9,
        description: `Workload statistics for user ${userId} in timeframe ${timeframe}`
      };
    } else {
      // 所有用戶的工作量統計
      return {
        type: 'user_activity',
        timeframe: timeframe,
        filters: {},
        rpcFunction: 'get_all_users_workload_stats',
        parameters: [timeframe],
        confidence: 0.85,
        description: `All users workload statistics for timeframe ${timeframe}`
      };
    }
  }
  
  // 操作/活動查詢
  if (question.includes('操作') || question.includes('activity') || 
      question.includes('action') || question.includes('進行')) {
    
    return {
      type: 'user_activity',
      timeframe: timeframe,
      filters: {},
      rpcFunction: 'get_user_activity_stats',
      parameters: [timeframe],
      confidence: 0.85,
      description: `User activity statistics for timeframe ${timeframe}`
    };
  }
  
  // 默認：用戶活動統計
  return {
    type: 'user_activity',
    timeframe: timeframe,
    filters: {},
    rpcFunction: 'get_user_activity',
    parameters: [],
    confidence: 0.75,
    description: `Default user activity for timeframe ${timeframe}`
  };
}