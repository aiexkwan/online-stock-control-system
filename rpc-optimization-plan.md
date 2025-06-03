# RPC Function 優化計劃

## 🎯 目標
將 Ask Database 系統改為一律使用 RPC FUNCTION，消除 OpenAI SQL 生成步驟，預期速度提升 80-90%。

## 📈 預期效果
- **當前響應時間**: 6-14秒
- **優化後響應時間**: 1-3秒
- **速度提升**: 80-90%
- **成本節省**: 70% OpenAI token 使用

## 🔧 實施階段

### 階段 1: 擴展 RPC 函數庫 (1-2天)

#### 1.1 基礎查詢函數
```sql
-- 今天托盤總數
CREATE OR REPLACE FUNCTION get_today_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 昨天托盤總數
CREATE OR REPLACE FUNCTION get_yesterday_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- 今天非GRN托盤數
CREATE OR REPLACE FUNCTION get_today_non_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE
            AND (plt_remark IS NULL OR plt_remark NOT LIKE '%Material GRN%'));
END;
$$ LANGUAGE plpgsql;

-- 今天GRN托盤數
CREATE OR REPLACE FUNCTION get_today_grn_pallet_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM record_palletinfo 
            WHERE DATE(generate_time) = CURRENT_DATE
            AND plt_remark LIKE '%Material GRN%');
END;
$$ LANGUAGE plpgsql;
```

#### 1.2 產品相關函數
```sql
-- 產品托盤統計
CREATE OR REPLACE FUNCTION get_product_pallet_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT, latest_date TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT,
        MAX(generate_time)
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param);
END;
$$ LANGUAGE plpgsql;

-- 今天特定產品統計
CREATE OR REPLACE FUNCTION get_today_product_stats(product_code_param TEXT)
RETURNS TABLE(pallet_count BIGINT, total_quantity BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(product_qty), 0)::BIGINT
    FROM record_palletinfo 
    WHERE UPPER(product_code) = UPPER(product_code_param)
    AND DATE(generate_time) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 重量統計函數
```sql
-- 今天GRN重量統計
CREATE OR REPLACE FUNCTION get_today_grn_weight_stats()
RETURNS TABLE(pallet_count BIGINT, total_net_weight NUMERIC, total_gross_weight NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rp.plt_num)::BIGINT,
        COALESCE(SUM(rg.net_weight), 0),
        COALESCE(SUM(rg.gross_weight), 0)
    FROM record_palletinfo rp
    JOIN record_grn rg ON rp.plt_num = rg.plt_num
    WHERE DATE(rp.generate_time) = CURRENT_DATE
    AND rp.plt_remark LIKE '%Material GRN%';
END;
$$ LANGUAGE plpgsql;
```

#### 1.4 庫存位置函數
```sql
-- 獲取托盤當前位置
CREATE OR REPLACE FUNCTION get_pallet_current_location(pallet_nums TEXT[])
RETURNS TABLE(plt_num TEXT, current_location TEXT, last_update TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (rh.plt_num) 
        rh.plt_num, 
        rh.loc,
        rh.time
    FROM record_history rh
    WHERE rh.plt_num = ANY(pallet_nums)
    ORDER BY rh.plt_num, rh.time DESC;
END;
$$ LANGUAGE plpgsql;

-- 各位置庫存統計
CREATE OR REPLACE FUNCTION get_location_inventory_stats()
RETURNS TABLE(location TEXT, pallet_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH latest_locations AS (
        SELECT DISTINCT ON (plt_num) plt_num, loc
        FROM record_history
        ORDER BY plt_num, time DESC
    )
    SELECT loc, COUNT(*)::BIGINT
    FROM latest_locations
    WHERE loc != 'Voided'
    GROUP BY loc
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;
```

### 階段 2: 智能意圖識別系統 (2-3天)

#### 2.1 意圖分類器
```typescript
interface QueryIntent {
  type: 'count' | 'stats' | 'location' | 'weight' | 'product';
  timeframe: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  filters: {
    includeGrn?: boolean;
    excludeGrn?: boolean;
    productCode?: string;
    location?: string;
  };
  rpcFunction: string;
  parameters: any[];
}

function classifyUserIntent(question: string): QueryIntent {
  const lowerQ = question.toLowerCase();
  
  // 時間識別
  let timeframe: QueryIntent['timeframe'] = 'all';
  if (lowerQ.includes('今天') || lowerQ.includes('today')) timeframe = 'today';
  else if (lowerQ.includes('昨天') || lowerQ.includes('yesterday')) timeframe = 'yesterday';
  
  // GRN 識別
  const includeGrn = lowerQ.includes('grn') && !lowerQ.includes('排除') && !lowerQ.includes('exclude');
  const excludeGrn = lowerQ.includes('排除') && lowerQ.includes('grn');
  
  // 查詢類型識別
  if (lowerQ.includes('多少') || lowerQ.includes('how many') || lowerQ.includes('count')) {
    if (timeframe === 'today' && excludeGrn) {
      return {
        type: 'count',
        timeframe: 'today',
        filters: { excludeGrn: true },
        rpcFunction: 'get_today_non_grn_pallet_count',
        parameters: []
      };
    }
    // ... 其他組合
  }
  
  // 重量查詢
  if (lowerQ.includes('重量') || lowerQ.includes('weight')) {
    return {
      type: 'weight',
      timeframe: timeframe,
      filters: { includeGrn: true },
      rpcFunction: 'get_today_grn_weight_stats',
      parameters: []
    };
  }
  
  // ... 更多意圖識別邏輯
}
```

#### 2.2 RPC 函數映射器
```typescript
async function executeRpcQuery(intent: QueryIntent, supabase: any): Promise<any> {
  const { rpcFunction, parameters } = intent;
  
  console.log(`[RPC] Executing: ${rpcFunction}(${parameters.join(', ')})`);
  
  const { data, error } = await supabase.rpc(rpcFunction, 
    parameters.length > 0 ? { param1: parameters[0], param2: parameters[1] } : {}
  );
  
  if (error) {
    console.error(`[RPC] Error in ${rpcFunction}:`, error);
    throw error;
  }
  
  console.log(`[RPC] Success: ${rpcFunction} returned ${data?.length || 0} rows`);
  return { data, error: null };
}
```

### 階段 3: 系統整合 (1天)

#### 3.1 修改主要 API 流程
```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { question, sessionId } = await request.json();
    
    // 1. 權限檢查 (保持不變)
    const hasPermission = await checkUserPermission();
    if (!hasPermission) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    
    // 2. 檢查緩存 (保持不變)
    const cacheKey = generateCacheKey(question);
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult) return NextResponse.json({ ...cachedResult, cached: true });
    
    // 3. 🚀 新流程：直接使用 RPC 函數
    const intent = classifyUserIntent(question);
    const queryResult = await executeRpcQuery(intent, supabase);
    
    // 4. 生成自然語言回應 (保持不變，但更快)
    const naturalLanguageResponse = await generateNaturalLanguageResponse(
      question, queryResult, intent.rpcFunction
    );
    
    const result = {
      question,
      rpcFunction: intent.rpcFunction,
      result: queryResult,
      answer: naturalLanguageResponse,
      executionTime: Date.now() - startTime,
      cached: false
    };
    
    // 5. 保存結果 (保持不變)
    queryCache.set(cacheKey, result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    // 錯誤處理
  }
}
```

## 📊 預期性能對比

| 指標 | 當前 (混合模式) | 優化後 (純RPC) | 改善 |
|------|----------------|----------------|------|
| 總響應時間 | 6-14秒 | 1-3秒 | 80-90% ⬇️ |
| 數據庫查詢 | 100-250ms | 50-150ms | 40% ⬇️ |
| OpenAI 調用 | 2次 (SQL+回應) | 1次 (僅回應) | 50% ⬇️ |
| Token 使用 | 2000-4000 | 500-1000 | 70% ⬇️ |
| 緩存命中率 | 30-40% | 60-80% | 100% ⬆️ |
| 錯誤率 | 5-10% | <1% | 90% ⬇️ |

## 🎯 實施優先級

### 高優先級 (立即實施)
1. ✅ 今天托盤總數
2. ✅ 今天非GRN托盤數
3. ✅ 今天GRN托盤數和重量
4. ✅ 產品統計查詢

### 中優先級 (第二週)
1. 昨天/前天查詢
2. 週/月統計
3. 庫存位置查詢
4. 轉移歷史查詢

### 低優先級 (後續優化)
1. 複雜聚合查詢
2. 多表聯接查詢
3. 自定義時間範圍

## 🔄 回退策略

保留現有的 SQL 生成邏輯作為後備：
```typescript
// 如果 RPC 意圖識別失敗，回退到原有邏輯
if (!intent || intent.confidence < 0.8) {
  console.log('[Fallback] Using original SQL generation');
  return await generateSQLWithOpenAI(question, schema);
}
```

## 📈 成功指標

- 平均響應時間 < 2秒
- 緩存命中率 > 70%
- 錯誤率 < 1%
- OpenAI 成本降低 70%
- 用戶滿意度提升 