// 智能意圖識別系統 - 將用戶問題映射到 RPC 函數
// 完全取代 OpenAI SQL 生成

export interface QueryIntent {
  type: 'count' | 'stats' | 'location' | 'weight' | 'product' | 'transfer' | 'latest' | 'unknown' | 'inventory_ranking';
  timeframe: 'today' | 'yesterday' | 'day_before_yesterday' | 'week' | 'month' | 'all';
  filters: {
    includeGrn?: boolean;
    excludeGrn?: boolean;
    productCode?: string;
    location?: string;
    limit?: number;
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
    /\b([A-Z]{2,4}\d{2,6}[A-Z]?)\b/g, // MEP123456, ABC1234A 等
    /\b(MEP[A-Z0-9]+)\b/gi, // MEP 開頭的產品代碼
    /產品代碼[：:\s]*([A-Z0-9]+)/gi, // 中文產品代碼
    /product[:\s]+([A-Z0-9]+)/gi, // 英文產品代碼
    /code[:\s]+([A-Z0-9]+)/gi, // code: XXX
  ];
  
  for (const pattern of productPatterns) {
    const matches = question.match(pattern);
    if (matches && matches.length > 0) {
      // 提取第一個匹配的產品代碼
      const match = matches[0];
      const cleanCode = match.replace(/^(產品代碼|product|code)[：:\s]*/gi, '').trim();
      if (cleanCode.length >= 3) {
        return cleanCode.toUpperCase();
      }
    }
  }
  
  return undefined;
}

// 位置識別
function identifyLocation(lowerQ: string): string | undefined {
  const locationKeywords = {
    'await': ['await', '等待', '等候'],
    'production': ['production', '生產', '注塑'],
    'fold mill': ['fold mill', 'fold', '摺疊', '摺疊機'],
    'pipeline': ['pipeline', '管道', '流水線'],
    'bulk room': ['bulk room', 'bulk', '散裝', '散裝室'],
    'voided': ['voided', '作廢', '廢棄']
  };
  
  for (const [location, keywords] of Object.entries(locationKeywords)) {
    if (keywords.some(keyword => lowerQ.includes(keyword))) {
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
  
  // 1. 轉移查詢 (提高優先級)
  if (lowerQ.includes('轉移') || lowerQ.includes('transfer') || lowerQ.includes('移動') || 
      lowerQ.includes('move') || lowerQ.includes('records')) {
    
    return mapTransferQuery(timeframe);
  }
  
  // 2. 庫存排名查詢 (新增)
  if ((lowerQ.includes('top') && lowerQ.includes('inventory')) || 
      (lowerQ.includes('highest') && lowerQ.includes('inventory')) ||
      (lowerQ.includes('top') && lowerQ.includes('products')) ||
      (lowerQ.includes('show') && lowerQ.includes('top') && lowerQ.includes('product')) ||
      (lowerQ.includes('ranking') && lowerQ.includes('inventory')) ||
      (lowerQ.includes('最高') && lowerQ.includes('庫存')) ||
      (lowerQ.includes('排名') && lowerQ.includes('產品'))) {
    
    return mapInventoryRankingQuery(lowerQ);
  }
  
  // 3. 計數查詢 (最常見)
  if (lowerQ.includes('多少') || lowerQ.includes('how many') || lowerQ.includes('count') || 
      lowerQ.includes('數量') || lowerQ.includes('幾多') || lowerQ.includes('幾個')) {
    
    return mapCountQuery(timeframe, grnFilters, productCode, location);
  }
  
  // 4. 重量查詢
  if (lowerQ.includes('重量') || lowerQ.includes('weight') || lowerQ.includes('淨重') || 
      lowerQ.includes('毛重') || lowerQ.includes('net') || lowerQ.includes('gross')) {
    
    return mapWeightQuery(timeframe, grnFilters);
  }
  
  // 5. 產品統計查詢
  if ((lowerQ.includes('統計') || lowerQ.includes('stats') || lowerQ.includes('總計') || 
       lowerQ.includes('total')) && productCode) {
    
    return mapProductStatsQuery(timeframe, productCode, grnFilters);
  }
  
  // 6. 位置查詢
  if (lowerQ.includes('位置') || lowerQ.includes('location') || lowerQ.includes('在哪') || 
      lowerQ.includes('where') || location) {
    
    return mapLocationQuery(location);
  }
  
  // 7. 最新托盤查詢
  if (lowerQ.includes('最新') || lowerQ.includes('latest') || lowerQ.includes('最近') || 
      lowerQ.includes('recent') || lowerQ.includes('新') || lowerQ.includes('last')) {
    
    return mapLatestQuery(timeframe, productCode);
  }
  
  // 8. 默認回退到計數查詢
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

// 重量查詢映射
function mapWeightQuery(
  timeframe: QueryIntent['timeframe'],
  grnFilters: { includeGrn?: boolean; excludeGrn?: boolean }
): QueryIntent {
  
  if (timeframe === 'today') {
    return {
      type: 'weight',
      timeframe: 'today',
      filters: { includeGrn: true },
      rpcFunction: 'get_today_grn_weight_stats',
      parameters: [],
      confidence: 0.9,
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
      confidence: 0.85,
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
      confidence: 0.8,
      description: "This week's GRN weight statistics"
    };
  }
  
  // 默認：今天重量
  return {
    type: 'weight',
    timeframe: 'today',
    filters: { includeGrn: true },
    rpcFunction: 'get_today_grn_weight_stats',
    parameters: [],
    confidence: 0.75,
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
  
  const limit = 10; // 默認顯示最新10個
  
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

// 轉移查詢映射
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
      case 'get_month_grn_weight_stats':
      case 'get_yesterday_transfer_stats':
      case 'get_week_transfer_stats':
      case 'get_month_transfer_stats':
      case 'get_latest_pallets_today':
      case 'get_latest_pallets_yesterday':
      case 'get_latest_pallets_week':
      case 'get_latest_pallets_month':
      case 'get_latest_pallets_all':
        ({ data, error } = await supabase.rpc(intent.rpcFunction));
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