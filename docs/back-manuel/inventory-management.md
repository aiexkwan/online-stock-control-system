# 庫存管理系統技術架構文檔

## 目錄
1. [系統概述](#系統概述)
2. [庫存轉移流程同事務處理](#庫存轉移流程同事務處理)
3. [訂單裝載邏輯](#訂單裝載邏輯)
4. [產品更新機制](#產品更新機制)
5. [實時庫存追蹤](#實時庫存追蹤)
6. [RPC 函數同原子操作](#rpc-函數同原子操作)
7. [緩存策略同優化](#緩存策略同優化)
8. [批量操作處理](#批量操作處理)
9. [技術亮點同最佳實踐](#技術亮點同最佳實踐)

## 系統概述

NewPennine 庫存管理系統係一個基於 Next.js 14、TypeScript 同 Supabase 嘅企業級倉庫管理系統。系統採用現代化嘅架構設計，支援完整嘅供應鏈管理功能。

### 核心模塊

- **庫存轉移 (Stock Transfer)**: 處理棧板喺唔同位置之間嘅轉移
- **訂單裝載 (Order Loading)**: 管理訂單嘅棧板裝載流程
- **產品更新 (Product Update)**: 維護產品資料同屬性
- **實時追蹤**: 提供庫存變動嘅實時監控

### 技術架構

```
┌─────────────────────────────────────────────────┐
│                前端應用層                         │
│  (Next.js 14 + React 18 + TypeScript)           │
├─────────────────────────────────────────────────┤
│              Server Actions 層                   │
│  (統一數據操作 + 事務管理)                       │
├─────────────────────────────────────────────────┤
│               服務層                             │
│  (UnifiedInventoryService + PalletService)      │
├─────────────────────────────────────────────────┤
│              數據庫層                            │
│  (Supabase PostgreSQL + RPC Functions)          │
└─────────────────────────────────────────────────┘
```

## 庫存轉移流程同事務處理

### 1. 前端頁面實現 (`/app/stock-transfer/page.tsx`)

庫存轉移頁面採用組件化設計，主要功能包括：

```typescript
// 核心狀態管理
const [selectedPallet, setSelectedPallet] = useState<PalletInfo | null>(null);
const [selectedDestination, setSelectedDestination] = useState('');
const [verifiedClockNumber, setVerifiedClockNumber] = useState<string | null>(null);
const [optimisticTransfers, setOptimisticTransfers] = useState<OptimisticTransfer[]>([]);
```

#### 自動執行機制

系統實現咗智能嘅自動執行機制，當滿足以下三個條件時自動執行轉移：

1. 已掃描/選擇棧板 (`selectedPallet`)
2. 已選擇目標位置 (`selectedDestination`)
3. 已驗證操作員身份 (`verifiedClockNumber`)

```typescript
useEffect(() => {
  if (selectedPallet && selectedDestination && verifiedClockNumber && !isTransferring) {
    executeStockTransfer(selectedPallet, selectedDestination, verifiedClockNumber).then(success => {
      if (success) {
        // 清除棧板搜索，保留目的地同操作員
        setSearchValue('');
        setSelectedPallet(null);
        focusSearchInput();
      }
    });
  }
}, [selectedPallet?.plt_num, selectedDestination, verifiedClockNumber, isTransferring]);
```

#### 樂觀更新機制

為咗提升用戶體驗，系統實現咗樂觀更新：

```typescript
interface OptimisticTransfer {
  id: string;
  pltNum: string;
  fromLocation: string;
  toLocation: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

// 添加樂觀更新
setOptimisticTransfers(prev => [...prev, optimisticEntry]);

// 執行轉移後更新狀態
setOptimisticTransfers(prev =>
  prev.map(t => (t.id === transferId ? { ...t, status: 'success' } : t))
);
```

### 2. Server Actions 實現 (`/app/actions/stockTransferActions.ts`)

#### 搜索功能

系統支援兩種搜索方式：
- **棧板號碼搜索**: 格式為 `DDMMYY/XXX`
- **系列號搜索**: 自動檢測同搜索

```typescript
export async function searchPallet(searchValue: string): Promise<SearchPalletResult> {
  // 自動檢測搜索類型
  const searchType = detectSearchType(searchValue);
  
  if (searchType === 'unknown') {
    return {
      success: false,
      error: 'Invalid search format',
    };
  }

  // 根據搜索類型執行查詢
  let palletQuery;
  if (searchType === 'pallet_num') {
    palletQuery = supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, plt_remark, series')
      .eq('plt_num', searchValue)
      .single();
  } else {
    palletQuery = supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, plt_remark, series')
      .eq('series', searchValue)
      .order('plt_num', { ascending: true })
      .limit(1);
  }
}
```

#### 優化版搜索

系統提供優化版搜索函數，使用 RPC 函數同 Materialized View：

```typescript
export async function searchPalletOptimized(
  searchType: 'series' | 'pallet_num',
  searchValue: string
): Promise<SearchPalletResult> {
  // 優先使用 V2 函數（包含回退機制）
  const { data: v2Data, error: v2Error } = await supabase.rpc('search_pallet_optimized_v2', {
    p_search_type: searchType,
    p_search_value: searchValue.trim(),
  });

  // 如果 V2 函數不存在，回退到 V1
  if (v2Error && v2Error.code === '42883') {
    const { data, error } = await supabase.rpc('search_pallet_optimized', {
      p_search_type: searchType,
      p_search_value: searchValue.trim(),
    });
  }
}
```

#### 轉移操作

庫存轉移使用 RPC 函數確保原子性：

```typescript
export async function transferPallet(
  palletNumber: string,
  toLocation: string
): Promise<TransferPalletResult> {
  const transactionService = new TransactionLogService();
  const transactionId = transactionService.generateTransactionId();

  // 開始事務追蹤
  await transactionService.startTransaction(transactionEntry);

  // 使用 RPC 函數進行原子轉移
  const { data, error } = await supabase.rpc('rpc_transfer_pallet', {
    p_pallet_num: palletNumber,
    p_to_location: toLocation,
    p_user_id: userId,
    p_user_name: userName,
  });

  // 完成事務追蹤
  await transactionService.completeTransaction(transactionId, resultData);
}
```

### 3. 事務日誌追蹤

系統實現咗完整嘅事務日誌追蹤機制：

```typescript
const transactionEntry: TransactionLogEntry = {
  transactionId,
  sourceModule: TransactionSource.INVENTORY_TRANSFER,
  sourcePage: 'stock-transfer',
  sourceAction: 'transfer_pallet',
  operationType: TransactionOperation.TRANSFER_STOCK,
  userId: userId.toString(),
  userClockNumber: userId.toString(),
  metadata: {
    palletNumber,
    toLocation,
    timestamp: new Date().toISOString(),
  },
};
```

## 訂單裝載邏輯

### 1. 前端實現 (`/app/order-loading/page.tsx`)

訂單裝載頁面包含以下核心功能：

#### 用戶身份驗證

```typescript
// 自動加載保存嘅 ID
useEffect(() => {
  const savedId = localStorage.getItem('orderLoadingUserId');
  if (savedId && /^\d{4}$/.test(savedId)) {
    setIdNumber(savedId);
    checkIdExists(savedId);
  }
}, []);

// 驗證 ID 存在性
const checkIdExists = async (id: string) => {
  const { data, error } = await supabase
    .from('data_id')
    .select('id')
    .eq('id', id)
    .single();
    
  if (error || !data) {
    sound.playError();
    toast.error(`❌ ID ${id} not found`);
  } else {
    setIsIdValid(true);
    sound.playSuccess();
    await fetchAvailableOrders();
  }
};
```

#### 訂單數據緩存

系統實現咗訂單數據緩存機制，提升性能：

```typescript
// 使用緩存 hooks
const orderDataCache = useOrderDataCache();
const orderSummariesCache = useOrderSummariesCache();

// 檢查緩存
const cacheKey = `order-data-${orderRef}`;
const cachedData = orderDataCache.get(cacheKey);

if (cachedData) {
  setOrderData(cachedData);
  return;
}

// 獲取新數據並緩存
const { data } = await supabase
  .from('data_order')
  .select('*')
  .eq('order_ref', orderRef);
  
orderDataCache.set(cacheKey, data);
```

#### 掃描裝載流程

```typescript
const handleSearchSelect = async (result: any) => {
  // 使用 server action 裝載棧板
  const response = await loadPalletToOrder(selectedOrderRef, result.data.value);

  if (response.success) {
    sound.playSuccess();
    toast.success(
      `✓ Successfully Loaded! Pallet: ${response.data.palletNumber} | 
       Product: ${response.data.productCode} | 
       Qty: ${response.data.productQty}`
    );

    // 顯示異常警告
    if (response.warning) {
      sound.playWarning();
      toast.warning(response.warning);
    }

    // 刷新數據
    await refreshAllData();
  }
};
```

### 2. Server Actions 實現 (`/app/actions/orderLoadingActions.ts`)

#### 裝載操作

```typescript
export async function loadPalletToOrder(
  orderRef: string,
  palletInput: string
): Promise<LoadPalletResult> {
  // 檢查操作異常
  const anomalyCheck = await checkOperationAnomaly(userId.toString(), orderRef);
  if (anomalyCheck.hasAnomaly && anomalyCheck.severity === 'error') {
    return {
      success: false,
      message: anomalyCheck.message || 'Operation blocked due to anomaly',
      error: 'ANOMALY_DETECTED',
    };
  }

  // 調用 RPC 函數進行原子事務
  const { data, error } = await supabase.rpc('rpc_load_pallet_to_order', {
    p_order_ref: orderRef,
    p_pallet_input: cleanInput,
    p_user_id: userId,
    p_user_name: userName,
  });

  // 檢查非阻塞異常警告
  const postLoadAnomaly = await checkOperationAnomaly(userId.toString(), orderRef);
  
  return {
    ...data,
    warning: postLoadAnomaly.hasAnomaly ? postLoadAnomaly.message : undefined,
  };
}
```

#### 撤銷裝載

系統支援撤銷最近嘅裝載操作：

```typescript
export async function undoLoadPallet(
  orderRef: string,
  palletNum: string,
  productCode: string,
  quantity: number
): Promise<UndoLoadResult> {
  const { data, error } = await supabase.rpc('rpc_undo_load_pallet', {
    p_order_ref: orderRef,
    p_pallet_num: palletNum,
    p_product_code: productCode,
    p_quantity: quantity,
    p_user_id: userId,
    p_user_name: userName,
  });

  return data;
}
```

### 3. 異常檢測服務

系統整合咗異常檢測服務，監控異常操作模式：

```typescript
// 檢查操作異常
await checkOperationAnomaly(userId, orderRef);

// 記錄失敗掃描
await logFailedScan(userId, orderRef, palletInput, errorMessage);
```

## 產品更新機制

### 1. 前端實現 (`/app/productUpdate/page.tsx`)

產品更新頁面提供完整嘅 CRUD 功能：

#### 搜索同創建流程

```typescript
const handleSearch = useCallback(async (code: string) => {
  const result = await getProductByCode(code);

  if (result.success && result.data) {
    // 顯示產品信息
    setProductData(result.data);
    setStatusMessage({
      type: 'success',
      message: `Product found: ${result.data.code}`,
    });
  } else {
    // 詢問是否新增
    setShowCreateDialog(true);
    setStatusMessage({
      type: 'warning',
      message: `Product "${code}" not found. Would you like to create it?`,
    });
  }
}, []);
```

#### 編輯同更新

```typescript
const handleSubmit = useCallback(async (formData: ProductData) => {
  if (isEditing && productData) {
    // 移除 code 字段（主鍵不應更新）
    const { code: _, ...updateData } = formData;
    
    // 確保數據類型正確
    if (typeof updateData.standard_qty === 'string') {
      updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
    }
    
    result = await updateProduct(productData.code, updateData);
  } else {
    // 新增產品
    result = await createProduct(formData);
  }
}, [isEditing, productData]);
```

### 2. Server Actions 實現 (`/app/actions/productActions.ts`)

#### 大小寫不敏感搜索

系統支援大小寫不敏感嘅產品搜索：

```typescript
export async function getProductByCode(code: string): Promise<ProductActionResult> {
  // 第一步：嘗試精確匹配
  const { data: exactData } = await supabase
    .from('data_code')
    .select('*')
    .eq('code', code.trim())
    .limit(1);

  if (exactData && exactData.length > 0) {
    return { success: true, data: exactData[0] };
  }

  // 第二步：大小寫不敏感搜索
  const { data: fuzzyData } = await supabase
    .from('data_code')
    .select('*')
    .ilike('code', code.trim())
    .limit(1);

  return fuzzyData ? { success: true, data: fuzzyData[0] } : { success: false };
}
```

#### 產品操作歷史記錄

所有產品操作都會記錄到歷史表：

```typescript
async function recordProductHistory(
  action: 'Add' | 'Edit',
  productCode: string,
  userEmail?: string
): Promise<void> {
  const userId = await getUserIdFromEmail(currentUserEmail);
  
  await supabase.from('record_history').insert({
    time: new Date().toISOString(),
    id: userId || 999,
    action: action === 'Add' ? 'Product Added' : 'Product Update',
    plt_num: null,
    loc: null,
    remark: productCode,
  });
}
```

## 實時庫存追蹤

### 1. Real-time Hook 實現 (`/lib/api/hooks/useRealtimeStock.ts`)

系統提供實時庫存監控功能：

```typescript
export function useRealtimeStock(
  warehouse?: string,
  options?: {
    enableWebSocket?: boolean;
    refreshInterval?: number;
  }
) {
  // WebSocket 訂閱實時變化
  useEffect(() => {
    if (!options?.enableWebSocket) return;

    const channel = supabase
      .channel('stock-movements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'record_history',
          filter: warehouse ? `loc=like.${warehouse}%` : undefined,
        },
        payload => {
          // 樂觀更新數據
          mutate((currentData: RealtimeStockData | undefined) => {
            const movement: StockMovement = {
              id: payload.new?.uuid || crypto.randomUUID(),
              palletNum: payload.new?.plt_num || '',
              productCode: payload.new?.product_code || '',
              fromLocation: payload.old?.loc || '',
              toLocation: payload.new?.loc || '',
              quantity: payload.new?.quantity || 0,
              timestamp: payload.new?.time || new Date().toISOString(),
              operator: payload.new?.user_name || 'System',
            };

            return {
              ...currentData,
              movements: [movement, ...currentData.movements.slice(0, 49)],
              activeTransfers: currentData.activeTransfers + 1,
              lastUpdate: new Date().toISOString(),
            };
          });
        }
      )
      .subscribe();
  }, [warehouse, options?.enableWebSocket]);
}
```

### 2. 特定棧板監控

```typescript
export function useRealtimePallet(palletNum: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`pallet-${palletNum}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'data_product',
          filter: `plt_num=eq.${palletNum}`,
        },
        payload => {
          // 即時更新棧板狀態
          mutate({
            location: payload.new.current_plt_loc || 'Unknown',
            status: 'transferred',
            lastUpdate: new Date().toISOString(),
          });
        }
      )
      .subscribe();
  }, [palletNum]);
}
```

## RPC 函數同原子操作

### 1. 庫存轉移 RPC

```sql
-- rpc_transfer_pallet
-- 確保庫存轉移嘅原子性
CREATE OR REPLACE FUNCTION rpc_transfer_pallet(
  p_pallet_num TEXT,
  p_to_location TEXT,
  p_user_id INTEGER,
  p_user_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_product_code TEXT;
  v_product_qty INTEGER;
  v_from_location TEXT;
BEGIN
  -- 開始事務
  -- 1. 獲取棧板信息
  SELECT product_code, product_qty 
  INTO v_product_code, v_product_qty
  FROM record_palletinfo
  WHERE plt_num = p_pallet_num;

  -- 2. 獲取當前位置
  SELECT loc INTO v_from_location
  FROM record_history
  WHERE plt_num = p_pallet_num AND action = 'Transfer'
  ORDER BY time DESC LIMIT 1;

  -- 3. 更新庫存記錄
  UPDATE record_inventory
  SET current_location = p_to_location,
      last_updated = NOW()
  WHERE plt_num = p_pallet_num;

  -- 4. 插入歷史記錄
  INSERT INTO record_history (
    time, id, action, plt_num, loc, remark
  ) VALUES (
    NOW(), p_user_id, 'Transfer', p_pallet_num, p_to_location,
    format('From %s to %s by %s', v_from_location, p_to_location, p_user_name)
  );

  -- 5. 返回結果
  v_result := json_build_object(
    'success', true,
    'product_code', v_product_code,
    'product_qty', v_product_qty,
    'from_location', v_from_location,
    'transfer_id', gen_random_uuid()
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. 訂單裝載 RPC

```sql
-- rpc_load_pallet_to_order
-- 處理訂單裝載嘅複雜邏輯
CREATE OR REPLACE FUNCTION rpc_load_pallet_to_order(
  p_order_ref TEXT,
  p_pallet_input TEXT,
  p_user_id INTEGER,
  p_user_name TEXT
) RETURNS JSON AS $$
DECLARE
  v_pallet_num TEXT;
  v_product_code TEXT;
  v_product_qty INTEGER;
  v_order_qty INTEGER;
  v_loaded_qty INTEGER;
BEGIN
  -- 1. 解析輸入（支援棧板號或系列號）
  -- 2. 驗證棧板存在
  -- 3. 檢查產品是否在訂單中
  -- 4. 檢查是否超過訂單數量
  -- 5. 更新 loaded_qty
  UPDATE data_order
  SET loaded_qty = loaded_qty + v_product_qty
  WHERE order_ref = p_order_ref AND product_code = v_product_code;

  -- 6. 記錄歷史
  INSERT INTO record_history (
    time, id, action, plt_num, remark
  ) VALUES (
    NOW(), p_user_id, 'Order Load', v_pallet_num,
    format('Order: %s, Product: %s, Qty: %s by %s', 
           p_order_ref, v_product_code, v_product_qty, p_user_name)
  );

  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'palletNumber', v_pallet_num,
      'productCode', v_product_code,
      'productQty', v_product_qty,
      'updatedLoadedQty', v_loaded_qty + v_product_qty
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. 優化搜索 RPC

```sql
-- search_pallet_optimized_v2
-- 使用 Materialized View 優化搜索性能
CREATE OR REPLACE FUNCTION search_pallet_optimized_v2(
  p_search_type TEXT,
  p_search_value TEXT
) RETURNS TABLE (
  plt_num TEXT,
  product_code TEXT,
  product_desc TEXT,
  product_qty INTEGER,
  current_location TEXT,
  is_from_mv BOOLEAN
) AS $$
BEGIN
  -- 首先嘗試從 Materialized View 搜索
  IF EXISTS (
    SELECT 1 FROM mv_pallet_current_location 
    WHERE CASE 
      WHEN p_search_type = 'pallet_num' THEN plt_num = p_search_value
      WHEN p_search_type = 'series' THEN series = p_search_value
    END
  ) THEN
    RETURN QUERY
    SELECT 
      m.plt_num,
      m.product_code,
      c.desc as product_desc,
      m.product_qty,
      m.current_location,
      true as is_from_mv
    FROM mv_pallet_current_location m
    LEFT JOIN data_code c ON m.product_code = c.code
    WHERE CASE 
      WHEN p_search_type = 'pallet_num' THEN m.plt_num = p_search_value
      WHEN p_search_type = 'series' THEN m.series = p_search_value
    END;
  ELSE
    -- 回退到實時查詢
    RETURN QUERY
    SELECT 
      p.plt_num,
      p.product_code,
      c.desc as product_desc,
      p.product_qty,
      COALESCE(
        (SELECT loc FROM record_history h 
         WHERE h.plt_num = p.plt_num AND h.action = 'Transfer'
         ORDER BY h.time DESC LIMIT 1),
        'Await'
      ) as current_location,
      false as is_from_mv
    FROM record_palletinfo p
    LEFT JOIN data_code c ON p.product_code = c.code
    WHERE CASE 
      WHEN p_search_type = 'pallet_num' THEN p.plt_num = p_search_value
      WHEN p_search_type = 'series' THEN p.series = p_search_value
    END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 緩存策略同優化

### 1. 前端緩存策略

#### 訂單數據緩存

```typescript
// useOrderCache hook
export function useOrderDataCache() {
  const cache = useRef<Map<string, OrderData[]>>(new Map());
  
  return {
    get: (key: string) => cache.current.get(key),
    set: (key: string, data: OrderData[]) => {
      cache.current.set(key, data);
      // 設置過期時間
      setTimeout(() => cache.current.delete(key), 5 * 60 * 1000); // 5分鐘
    },
    remove: (key: string) => cache.current.delete(key),
    clear: () => cache.current.clear(),
  };
}
```

#### React Query 整合

```typescript
// 使用 React Query 進行數據緩存
const { data, isLoading } = useQuery({
  queryKey: ['inventory', 'pallets', palletNum],
  queryFn: () => fetchPalletData(palletNum),
  staleTime: 30 * 1000, // 30秒
  cacheTime: 5 * 60 * 1000, // 5分鐘
  refetchOnWindowFocus: false,
});
```

### 2. 數據庫層優化

#### Materialized View

```sql
-- 創建物化視圖加速查詢
CREATE MATERIALIZED VIEW mv_pallet_current_location AS
SELECT 
  p.plt_num,
  p.product_code,
  p.product_qty,
  p.series,
  COALESCE(
    (SELECT h.loc 
     FROM record_history h 
     WHERE h.plt_num = p.plt_num 
       AND h.action = 'Transfer'
     ORDER BY h.time DESC 
     LIMIT 1),
    'Await'
  ) as current_location,
  NOW() as last_refresh
FROM record_palletinfo p
WHERE p.is_voided IS NOT TRUE;

-- 創建索引
CREATE INDEX idx_mv_pallet_plt_num ON mv_pallet_current_location(plt_num);
CREATE INDEX idx_mv_pallet_series ON mv_pallet_current_location(series);
CREATE INDEX idx_mv_pallet_location ON mv_pallet_current_location(current_location);
```

#### 自動刷新機制

```sql
-- 定期刷新物化視圖
CREATE OR REPLACE FUNCTION refresh_mv_pallet_location() 
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pallet_current_location;
END;
$$ LANGUAGE plpgsql;

-- 設置定時任務（每5分鐘刷新）
SELECT cron.schedule(
  'refresh-pallet-location-mv',
  '*/5 * * * *',
  'SELECT refresh_mv_pallet_location();'
);
```

### 3. API 層緩存

```typescript
// Redis 緩存整合
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getCachedPalletData(palletNum: string) {
  const cacheKey = `pallet:${palletNum}`;
  
  // 檢查緩存
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // 獲取數據
  const data = await fetchPalletFromDB(palletNum);
  
  // 設置緩存（TTL: 5分鐘）
  await redis.setex(cacheKey, 300, JSON.stringify(data));
  
  return data;
}
```

## 批量操作處理

### 1. 批量轉移實現

```typescript
export async function batchTransferPallets(
  transfers: Array<{ palletNumber: string; toLocation: string }>
): Promise<BatchTransferResult> {
  const BATCH_SIZE = 5;
  const results: TransferPalletResult[] = [];

  // 分批處理，避免超載
  for (let i = 0; i < transfers.length; i += BATCH_SIZE) {
    const batch = transfers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(({ palletNumber, toLocation }) => 
        transferPallet(palletNumber, toLocation)
      )
    );
    results.push(...batchResults);
  }

  return {
    success: results.every(r => r.success),
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    results,
  };
}
```

### 2. UnifiedInventoryService 批量操作

```typescript
async batchTransfer(batch: BatchTransferDto): Promise<BatchTransferResult> {
  // 在單一事務中執行所有轉移
  const operations = batch.transfers.map(
    transfer => () => this.transactionService.executeStockTransfer(transfer)
  );

  const txResult = await this.transactionService.executeBatchOperations(
    operations,
    {
      description: `Batch transfer: ${batch.transfers.length} pallets`,
      logTransaction: true,
    }
  );

  // 批量失效緩存
  if (successCount > 0) {
    await Promise.all(
      batch.transfers.map(t => this.invalidateCache(t.palletNum))
    );
  }
}
```

### 3. 批量導入優化

```typescript
// 使用數據庫 COPY 命令進行大批量導入
export async function bulkImportPallets(pallets: PalletData[]) {
  // 準備 CSV 數據
  const csvData = pallets.map(p => 
    `${p.plt_num},${p.product_code},${p.product_qty}`
  ).join('\n');

  // 使用 COPY 命令
  const { error } = await supabase.rpc('bulk_import_pallets', {
    csv_data: csvData
  });

  if (error) throw error;
}
```

## 技術亮點同最佳實踐

### 1. 事務一致性

- **原子操作**: 所有關鍵操作使用 RPC 函數確保原子性
- **事務日誌**: 完整嘅事務追蹤同審計日誌
- **錯誤恢復**: 自動回滾機制同錯誤處理

### 2. 性能優化

- **Materialized Views**: 加速常用查詢
- **智能緩存**: 多層緩存策略（前端、API、數據庫）
- **批量處理**: 優化大量數據操作
- **懶加載**: 組件同數據嘅按需加載

### 3. 用戶體驗

- **樂觀更新**: 即時反饋，提升響應速度
- **自動化流程**: 智能檢測同自動執行
- **實時通知**: WebSocket 實時數據推送
- **錯誤提示**: 友好嘅錯誤信息同指引

### 4. 系統可靠性

- **數據驗證**: 多層數據驗證機制
- **異常檢測**: 自動檢測異常操作模式
- **備份機制**: 自動備份同恢復策略
- **監控告警**: 系統健康監控同告警

### 5. 開發效率

- **統一接口**: UnifiedInventoryService 提供一致嘅 API
- **代碼復用**: 共享組件同服務
- **類型安全**: 完整嘅 TypeScript 類型定義
- **測試覆蓋**: 單元測試同 E2E 測試

## 總結

NewPennine 庫存管理系統通過現代化嘅技術架構，實現咗高效、可靠、易用嘅倉庫管理解決方案。系統嘅核心優勢包括：

1. **強大嘅事務處理能力**: 確保數據一致性同完整性
2. **優秀嘅性能表現**: 多層優化策略，快速響應
3. **出色嘅用戶體驗**: 智能化操作，減少人為錯誤
4. **高度嘅可維護性**: 模塊化設計，易於擴展

系統將持續優化同升級，為企業提供更加完善嘅倉庫管理服務。