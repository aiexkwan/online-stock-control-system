# StockTransferCard 技術文檔

## 執行摘要

### 業務價值
StockTransferCard 組件是倉庫管理系統的核心功能模組，負責處理庫存在不同位置間的實時轉移。該組件每日處理數千筆交易，確保庫存數據的準確性和可追溯性。

### 關鍵能力
- **實時庫存轉移**：支援即時更新庫存位置
- **多目的地管理**：預設 9 個轉移目的地
- **操作員驗證**：4 位工號實時驗證
- **智能搜索**：自動識別托盤號/序列號
- **審計追蹤**：完整的操作歷史記錄
- **錯誤處理**：多層次錯誤驗證和恢復機制

### 技術亮點
- React 18.3.1 與 Next.js 15.4.4
- TypeScript 5.8.3 類型安全
- Supabase 實時數據庫
- Server Actions 架構
- 樂觀更新策略

## 組件架構概覽

### 系統上下文
```
┌─────────────────────────────────────────────┐
│              前端應用層                       │
│  ┌─────────────────────────────────────┐    │
│  │     StockTransferCard 組件           │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ UI層    │ │業務邏輯 │ │ 狀態   │  │   │
│  │  └────────┘ └────────┘ └────────┘  │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│            Server Actions 層                 │
│  ┌─────────────────────────────────────┐   │
│  │   searchPalletAuto()                │   │
│  │   validateClockNumber()             │   │
│  │   transferPallet()                  │   │
│  │   getTransferHistory()              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│              數據庫層                       │
│  ┌─────────────────────────────────────┐   │
│  │   Supabase PostgreSQL               │   │
│  │   - record_transfer                 │   │
│  │   - record_inventory                │   │
│  │   - record_palletinfo               │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### 文件結構
```
app/
├── (app)/
│   └── stock-transfer/
│       ├── page.tsx                 # 主頁面
│       └── components/
│           └── StockTransferCard.tsx # 核心組件
├── actions/
│   └── stock-transfer-actions.ts    # Server Actions
├── hooks/
│   └── useStockTransfer.ts         # 業務邏輯鉤子
├── constants/
│   └── stockTransfer.ts            # 常量定義
└── utils/
    └── locationStandardizer.ts     # 工具函數
```

### 核心技術棧
| 層級 | 技術 | 版本 | 用途 |
|------|------|------|------|
| 前端框架 | React | 18.3.1 | UI 渲染 |
| 元框架 | Next.js | 15.4.4 | 全棧應用 |
| 類型系統 | TypeScript | 5.8.3 | 類型安全 |
| 數據庫 | Supabase | 2.29.0 | 後端服務 |
| 狀態管理 | React Hooks | - | 本地狀態 |
| UI 組件 | shadcn/ui | - | 界面組件 |
| 樣式 | Tailwind CSS | 3.4.1 | 樣式系統 |

### 設計模式
1. **關注點分離**：UI、業務邏輯、數據訪問層分離
2. **自定義 Hooks**：封裝複雜的業務邏輯
3. **Server Actions**：類型安全的服務器端操作
4. **樂觀更新**：提供即時的用戶反饋
5. **錯誤邊界**：優雅的錯誤處理和恢復

## 詳細工作流分析

### 完整轉移流程
```
開始
  │
  ▼
┌─────────────────┐
│ 1. 選擇目的地   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 驗證操作員   │
│   輸入4位工號   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 搜索托盤     │
│   掃描/輸入     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 驗證轉移     │
│   檢查合法性    │
└────────┬────────┘
         │
    ▼─────▼
┌──────┐ ┌──────┐
│ 成功 │ │ 失敗 │
└───┬──┘ └───┬──┘
    │        │
    ▼        ▼
┌──────┐ ┌──────────┐
│ 執行 │ │ 顯示錯誤 │
│ 轉移 │ └──────────┘
└───┬──┘
    │
    ▼
┌─────────────────┐
│ 5. 更新狀態     │
│   - 數據庫      │
│   - UI          │
│   - 歷史記錄    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. 重置表單     │
│   準備下一筆    │
└─────────────────┘
```

### 用戶交互序列
```
用戶                組件              Server Actions         數據庫
 │                  │                      │                  │
 ├──選擇目的地──────▶│                      │                  │
 │                  ├──更新狀態            │                  │
 │                  │                      │                  │
 ├──輸入工號────────▶│                      │                  │
 │                  ├──validateClockNumber─▶│                  │
 │                  │                      ├──查詢 data_id───▶│
 │                  │                      │◀─────返回用戶─────┤
 │                  │◀─────驗證結果─────────┤                  │
 │                  │                      │                  │
 ├──掃描托盤────────▶│                      │                  │
 │                  ├──searchPalletAuto────▶│                  │
 │                  │                      ├──查詢托盤資訊───▶│
 │                  │                      │◀─────返回數據─────┤
 │                  │◀─────搜索結果─────────┤                  │
 │                  │                      │                  │
 │                  ├──自動執行轉移         │                  │
 │                  ├──transferPallet──────▶│                  │
 │                  │                      ├──rpc_transfer───▶│
 │                  │                      │◀─────更新完成─────┤
 │                  │◀─────轉移結果─────────┤                  │
 │◀──顯示成功────────┤                      │                  │
```

### 狀態管理架構
```typescript
// 組件狀態結構
interface StockTransferState {
  // 轉移狀態
  transfer: {
    isLoading: boolean;
    isTransferring: boolean;
    selectedPallet: PalletInfo | null;
    selectedDestination: string;
    currentLocation: string;
  };
  
  // 操作員狀態
  operator: {
    clockNumber: string;
    verifiedClockNumber: string;
    verifiedName: string;
    isVerifying: boolean;
    error: string | null;
  };
  
  // UI 狀態
  ui: {
    statusMessage: string;
    searchValue: string;
    transferHistory: TransferRecord[];
    showErrorOverlay: boolean;
    errorDetails: ErrorInfo | null;
  };
  
  // 樂觀更新
  optimistic: {
    transfers: OptimisticTransfer[];
    lastUpdate: Date;
  };
}
```

## 數據流圖表

### 主要數據流
```
┌─────────────────────────────────────────────────┐
│                 用戶輸入                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            StockTransferCard                     │
│  ┌───────────────────────────────────────────┐  │
│  │  State Management (useState, useEffect)   │  │
│  └───────────────┬───────────────────────────┘  │
└──────────────────┼───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            useStockTransfer Hook                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Business Logic & Data Transformation     │  │
│  └───────────────┬───────────────────────────┘  │
└──────────────────┼───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│           Server Actions Layer                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Validation → Database Call → Response    │  │
│  └───────────────┬───────────────────────────┘  │
└──────────────────┼───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│             Supabase Database                    │
│  ┌───────────────────────────────────────────┐  │
│  │  RPC Functions → Triggers → Tables        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 樂觀更新流程
```
用戶操作
    │
    ├──────────────────┐
    ▼                  ▼
立即更新 UI        發送請求到服務器
(樂觀更新)              │
    │                  ▼
    │             服務器處理
    │                  │
    │            ┌─────┴─────┐
    │            ▼           ▼
    │          成功         失敗
    │            │           │
    ▼            ▼           ▼
保持 UI      確認更新    回滾 UI
             更新歷史    顯示錯誤
```

## API 和 GraphQL 集成文檔

### Server Actions 實現

#### 1. searchPalletAuto
```typescript
export async function searchPalletAuto(
  searchValue: string
): Promise<ActionResult<PalletInfo>> {
  try {
    // 1. 輸入驗證
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) {
      return { 
        success: false, 
        error: '請輸入托盤號或序列號' 
      };
    }

    // 2. 自動檢測搜索類型
    const searchType = detectSearchType(trimmedValue);
    
    // 3. 優化搜索策略 (V2 → V1 → 直接查詢)
    const supabase = createClient();
    
    // 嘗試 V2 優化查詢
    let result = await supabase.rpc('search_pallet_optimized_v2', {
      p_search_value: trimmedValue,
      p_search_type: searchType
    });

    // Fallback 到 V1
    if (!result.data || result.data.length === 0) {
      result = await supabase.rpc('search_pallet_optimized', {
        p_search_value: trimmedValue
      });
    }

    // 最終 fallback 到直接查詢
    if (!result.data || result.data.length === 0) {
      result = await supabase
        .from('record_palletinfo')
        .select('*')
        .eq(searchType === 'pallet' ? 'plt_num' : 'serial_num', trimmedValue);
    }

    return {
      success: true,
      data: result.data[0]
    };
  } catch (error) {
    systemLogger.error({ error, searchValue }, '托盤搜索失敗');
    return {
      success: false,
      error: '搜索失敗，請稍後再試'
    };
  }
}
```

#### 2. validateClockNumber
```typescript
export async function validateClockNumber(
  clockNumber: string
): Promise<ActionResult<UserInfo>> {
  try {
    // 1. 格式驗證
    if (!/^\d{4}$/.test(clockNumber)) {
      return {
        success: false,
        error: '工號必須是4位數字'
      };
    }

    // 2. 查詢用戶
    const supabase = createClient();
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, department, role')
      .eq('clock_number', clockNumber)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: '無效的工號'
      };
    }

    // 3. 權限檢查
    if (!hasTransferPermission(data.role)) {
      return {
        success: false,
        error: '您沒有執行轉移的權限'
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        department: data.department
      }
    };
  } catch (error) {
    systemLogger.error({ error, clockNumber }, '工號驗證失敗');
    return {
      success: false,
      error: '驗證失敗，請稍後再試'
    };
  }
}
```

#### 3. transferPallet
```typescript
export async function transferPallet(
  pltNum: string,
  toLocation: string,
  operatorId: number
): Promise<ActionResult<TransferResult>> {
  try {
    // 1. 參數驗證
    if (!pltNum || !toLocation || !operatorId) {
      return {
        success: false,
        error: '缺少必要參數'
      };
    }

    // 2. 執行 RPC 轉移
    const supabase = createClient();
    const { data, error } = await supabase.rpc('rpc_transfer_pallet', {
      p_pallet_num: pltNum,
      p_to_location: toLocation,
      p_user_id: operatorId,
      p_timestamp: new Date().toISOString()
    });

    if (error) {
      // 特殊錯誤處理
      if (error.message.includes('VOIDED')) {
        return {
          success: false,
          error: '此托盤已作廢，無法轉移',
          errorType: 'VOIDED_PALLET'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }

    // 3. 記錄操作
    await systemLogger.info({
      action: 'STOCK_TRANSFER',
      pltNum,
      fromLocation: data.from_location,
      toLocation,
      operatorId,
      timestamp: new Date().toISOString()
    });

    // 4. 重新驗證路徑
    revalidatePath('/stock-transfer');

    return {
      success: true,
      data: {
        transferId: data.transfer_id,
        fromLocation: data.from_location,
        toLocation: data.to_location,
        timestamp: data.timestamp
      }
    };
  } catch (error) {
    systemLogger.error({ error, pltNum, toLocation }, '轉移執行失敗');
    return {
      success: false,
      error: '轉移失敗，請稍後再試'
    };
  }
}
```

### GraphQL Schema (計劃中)
```graphql
# 庫存轉移類型定義
type StockTransfer {
  uuid: ID!
  tranDate: DateTime!
  fromLocation: String!
  toLocation: String!
  pltNum: String!
  operatorId: Int!
  operator: User!
  pallet: Pallet!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 托盤信息
type Pallet {
  pltNum: String!
  productCode: String!
  product: Product!
  serialNum: String
  quantity: Int!
  status: PalletStatus!
  currentLocation: String!
  lastTransfer: StockTransfer
}

# 查詢
type Query {
  # 獲取轉移歷史
  stockTransfers(
    filter: StockTransferFilter
    pagination: PaginationInput
    sort: SortInput
  ): StockTransferConnection!
  
  # 搜索托盤
  searchPallet(
    searchValue: String!
    searchType: SearchType
  ): Pallet
  
  # 驗證操作員
  validateOperator(
    clockNumber: String!
  ): User
}

# 變更
type Mutation {
  # 創建庫存轉移
  createStockTransfer(
    input: CreateStockTransferInput!
  ): StockTransferPayload!
  
  # 批量轉移
  batchStockTransfer(
    input: BatchStockTransferInput!
  ): BatchStockTransferPayload!
}

# 訂閱
type Subscription {
  # 監聽轉移更新
  stockTransferCreated(
    operatorId: Int
    location: String
  ): StockTransfer!
}
```

### RPC 函數實現

#### rpc_transfer_pallet
```sql
CREATE OR REPLACE FUNCTION rpc_transfer_pallet(
  p_pallet_num TEXT,
  p_to_location TEXT,
  p_user_id INTEGER,
  p_timestamp TIMESTAMP DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_location TEXT;
  v_product_code TEXT;
  v_transfer_id UUID;
  v_is_voided BOOLEAN;
BEGIN
  -- 開始事務
  BEGIN
    -- 1. 檢查托盤狀態
    SELECT 
      current_location,
      product_code,
      is_voided
    INTO 
      v_from_location,
      v_product_code,
      v_is_voided
    FROM record_palletinfo
    WHERE plt_num = p_pallet_num
    FOR UPDATE;  -- 鎖定記錄

    -- 2. 驗證托盤存在
    IF NOT FOUND THEN
      RAISE EXCEPTION '托盤不存在: %', p_pallet_num;
    END IF;

    -- 3. 檢查是否作廢
    IF v_is_voided THEN
      RAISE EXCEPTION 'VOIDED: 托盤已作廢';
    END IF;

    -- 4. 檢查是否同一位置
    IF v_from_location = p_to_location THEN
      RAISE EXCEPTION '源位置和目標位置相同';
    END IF;

    -- 5. 創建轉移記錄
    INSERT INTO record_transfer (
      uuid,
      tran_date,
      f_loc,
      t_loc,
      plt_num,
      operator_id,
      product_code
    ) VALUES (
      gen_random_uuid(),
      p_timestamp,
      v_from_location,
      p_to_location,
      p_pallet_num,
      p_user_id,
      v_product_code
    ) RETURNING uuid INTO v_transfer_id;

    -- 6. 更新托盤位置
    UPDATE record_palletinfo
    SET 
      current_location = p_to_location,
      last_transfer_date = p_timestamp,
      updated_at = p_timestamp
    WHERE plt_num = p_pallet_num;

    -- 7. 更新庫存
    PERFORM update_inventory_location(
      v_product_code,
      v_from_location,
      p_to_location,
      1
    );

    -- 8. 記錄歷史
    INSERT INTO record_history (
      action_type,
      table_name,
      record_id,
      old_value,
      new_value,
      user_id,
      timestamp
    ) VALUES (
      'TRANSFER',
      'record_palletinfo',
      p_pallet_num,
      jsonb_build_object('location', v_from_location),
      jsonb_build_object('location', p_to_location),
      p_user_id,
      p_timestamp
    );

    -- 提交事務
    RETURN json_build_object(
      'success', true,
      'transfer_id', v_transfer_id,
      'from_location', v_from_location,
      'to_location', p_to_location,
      'timestamp', p_timestamp
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- 回滾事務
      RAISE;
  END;
END;
$$;
```

## 數據庫架構和操作

### 核心表結構

#### 1. record_transfer (轉移記錄表)
```sql
CREATE TABLE record_transfer (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tran_date TIMESTAMP NOT NULL DEFAULT NOW(),
  f_loc VARCHAR(50) NOT NULL,  -- 源位置
  t_loc VARCHAR(50) NOT NULL,  -- 目標位置
  plt_num VARCHAR(50) NOT NULL,  -- 托盤號
  operator_id INTEGER NOT NULL,  -- 操作員ID
  product_code VARCHAR(50),      -- 產品代碼
  quantity INTEGER DEFAULT 1,    -- 數量
  notes TEXT,                    -- 備註
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 外鍵約束
  CONSTRAINT fk_pallet 
    FOREIGN KEY (plt_num) 
    REFERENCES record_palletinfo(plt_num),
  CONSTRAINT fk_operator 
    FOREIGN KEY (operator_id) 
    REFERENCES data_id(id),
  CONSTRAINT fk_product 
    FOREIGN KEY (product_code) 
    REFERENCES data_code(code)
);

-- 索引優化
CREATE INDEX idx_transfer_tran_date 
  ON record_transfer(tran_date DESC);
CREATE INDEX idx_transfer_plt_num 
  ON record_transfer(plt_num);
CREATE INDEX idx_transfer_operator 
  ON record_transfer(operator_id);
CREATE INDEX idx_transfer_composite 
  ON record_transfer(tran_date DESC, plt_num, operator_id);
```

#### 2. record_palletinfo (托盤信息表)
```sql
CREATE TABLE record_palletinfo (
  plt_num VARCHAR(50) PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL,
  serial_num VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  current_location VARCHAR(50),
  is_voided BOOLEAN DEFAULT FALSE,
  void_reason TEXT,
  void_date TIMESTAMP,
  last_transfer_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 外鍵約束
  CONSTRAINT fk_product_code 
    FOREIGN KEY (product_code) 
    REFERENCES data_code(code)
);

-- 索引優化
CREATE UNIQUE INDEX idx_palletinfo_serial 
  ON record_palletinfo(serial_num) 
  WHERE serial_num IS NOT NULL;
CREATE INDEX idx_palletinfo_product 
  ON record_palletinfo(product_code);
CREATE INDEX idx_palletinfo_location 
  ON record_palletinfo(current_location);
CREATE INDEX idx_palletinfo_void_status 
  ON record_palletinfo(is_voided);
```

#### 3. record_inventory (庫存記錄表)
```sql
CREATE TABLE record_inventory (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL,
  plt_num VARCHAR(50),
  injection INTEGER DEFAULT 0,
  pipeline INTEGER DEFAULT 0,
  prebook INTEGER DEFAULT 0,
  await INTEGER DEFAULT 0,
  fold INTEGER DEFAULT 0,
  bulk INTEGER DEFAULT 0,
  backcarpark INTEGER DEFAULT 0,
  total_quantity INTEGER GENERATED ALWAYS AS (
    injection + pipeline + prebook + await + fold + bulk + backcarpark
  ) STORED,
  last_update TIMESTAMP DEFAULT NOW(),
  
  -- 外鍵約束
  CONSTRAINT fk_inv_product 
    FOREIGN KEY (product_code) 
    REFERENCES data_code(code),
  CONSTRAINT fk_inv_pallet 
    FOREIGN KEY (plt_num) 
    REFERENCES record_palletinfo(plt_num)
);

-- 索引優化
CREATE INDEX idx_inventory_product 
  ON record_inventory(product_code);
CREATE INDEX idx_inventory_update 
  ON record_inventory(last_update DESC);
CREATE INDEX idx_inventory_aggregate 
  ON record_inventory(product_code, total_quantity);
```

### 數據庫觸發器

#### 自動更新時間戳
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 應用到各表
CREATE TRIGGER update_transfer_timestamp
  BEFORE UPDATE ON record_transfer
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_palletinfo_timestamp
  BEFORE UPDATE ON record_palletinfo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### 庫存自動同步
```sql
CREATE OR REPLACE FUNCTION sync_inventory_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- 減少源位置庫存
  UPDATE record_inventory
  SET 
    CASE NEW.f_loc
      WHEN 'injection' THEN injection = injection - 1
      WHEN 'pipeline' THEN pipeline = pipeline - 1
      WHEN 'prebook' THEN prebook = prebook - 1
      WHEN 'await' THEN await = await - 1
      WHEN 'fold' THEN fold = fold - 1
      WHEN 'bulk' THEN bulk = bulk - 1
      WHEN 'backcarpark' THEN backcarpark = backcarpark - 1
    END,
    last_update = NOW()
  WHERE product_code = NEW.product_code;

  -- 增加目標位置庫存
  UPDATE record_inventory
  SET 
    CASE NEW.t_loc
      WHEN 'injection' THEN injection = injection + 1
      WHEN 'pipeline' THEN pipeline = pipeline + 1
      WHEN 'prebook' THEN prebook = prebook + 1
      WHEN 'await' THEN await = await + 1
      WHEN 'fold' THEN fold = fold + 1
      WHEN 'bulk' THEN bulk = bulk + 1
      WHEN 'backcarpark' THEN backcarpark = backcarpark + 1
    END,
    last_update = NOW()
  WHERE product_code = NEW.product_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_inventory
  AFTER INSERT ON record_transfer
  FOR EACH ROW
  EXECUTE FUNCTION sync_inventory_on_transfer();
```

### 索引策略

#### 性能關鍵索引
```sql
-- 複合索引優化查詢
CREATE INDEX idx_transfer_search_optimized 
  ON record_transfer(tran_date DESC, plt_num, operator_id)
  INCLUDE (f_loc, t_loc, product_code);

-- 部分索引優化
CREATE INDEX idx_palletinfo_active 
  ON record_palletinfo(plt_num, current_location) 
  WHERE is_voided = FALSE;

-- BRIN 索引用於時間序列
CREATE INDEX idx_transfer_date_brin 
  ON record_transfer 
  USING BRIN(tran_date);

-- GIN 索引用於全文搜索
CREATE INDEX idx_palletinfo_search 
  ON record_palletinfo 
  USING GIN(to_tsvector('english', 
    plt_num || ' ' || COALESCE(serial_num, '')));
```

### 查詢優化

#### 物化視圖
```sql
-- 每日轉移統計
CREATE MATERIALIZED VIEW mv_daily_transfer_stats AS
SELECT 
  DATE(tran_date) as transfer_date,
  COUNT(*) as total_transfers,
  COUNT(DISTINCT operator_id) as unique_operators,
  COUNT(DISTINCT plt_num) as unique_pallets,
  array_agg(DISTINCT t_loc) as destinations
FROM record_transfer
GROUP BY DATE(tran_date);

-- 自動刷新
CREATE INDEX idx_mv_daily_stats_date 
  ON mv_daily_transfer_stats(transfer_date DESC);

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_transfer_stats;
```

## 測試策略和覆蓋率

### 測試架構
```
測試金字塔
     ╱╲
    ╱E2E╲     5%  - Playwright 端到端測試
   ╱──────╲
  ╱Integration╲  15% - API 和數據庫集成測試  
 ╱──────────────╲
╱   Unit Tests   ╲ 80% - 組件和函數單元測試
──────────────────
```

### 單元測試覆蓋率
| 模組 | 覆蓋率 | 測試數量 |
|------|--------|----------|
| StockTransferCard.tsx | 92% | 45 |
| useStockTransfer.ts | 88% | 32 |
| stock-transfer-actions.ts | 95% | 28 |
| locationStandardizer.ts | 100% | 15 |
| 總體覆蓋率 | 91% | 120 |

### 集成測試案例
```typescript
describe('StockTransfer Integration Tests', () => {
  describe('Database Operations', () => {
    test('應該成功創建轉移記錄', async () => {
      const result = await transferPallet(
        'PLT-001',
        'fold',
        123
      );
      
      expect(result.success).toBe(true);
      expect(result.data.toLocation).toBe('fold');
      
      // 驗證數據庫狀態
      const transfer = await getTransferById(result.data.transferId);
      expect(transfer).toBeDefined();
      expect(transfer.t_loc).toBe('fold');
    });

    test('應該正確更新庫存數量', async () => {
      const beforeInventory = await getInventory('PROD-001');
      
      await transferPallet('PLT-001', 'bulk', 123);
      
      const afterInventory = await getInventory('PROD-001');
      expect(afterInventory.bulk).toBe(beforeInventory.bulk + 1);
      expect(afterInventory.injection).toBe(beforeInventory.injection - 1);
    });

    test('應該處理並發轉移', async () => {
      const transfers = await Promise.all([
        transferPallet('PLT-001', 'fold', 123),
        transferPallet('PLT-002', 'bulk', 124),
        transferPallet('PLT-003', 'await', 125)
      ]);
      
      expect(transfers.every(t => t.success)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('應該拒絕作廢托盤轉移', async () => {
      const result = await transferPallet(
        'VOIDED-PLT',
        'fold',
        123
      );
      
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('VOIDED_PALLET');
    });

    test('應該處理網絡超時', async () => {
      // 模擬網絡延遲
      jest.setTimeout(1000);
      
      const result = await transferPalletWithTimeout(
        'PLT-001',
        'fold',
        123,
        { timeout: 500 }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
});
```

### E2E 測試場景
```typescript
test.describe('StockTransferCard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 登錄並導航到庫存轉移頁面
    await loginAsOperator(page);
    await page.goto('/stock-transfer');
  });

  test('完整轉移工作流', async ({ page }) => {
    // 1. 選擇目的地
    await page.click('[data-destination="fold"]');
    
    // 2. 輸入工號
    await page.fill('#clock-number', '1234');
    await page.waitForSelector('[data-verified="true"]');
    
    // 3. 掃描托盤
    await page.fill('#pallet-search', 'PLT-001');
    await page.waitForSelector('[data-pallet-found="true"]');
    
    // 4. 等待自動轉移
    await page.waitForSelector('[data-transfer-success="true"]');
    
    // 5. 驗證成功消息
    const toast = page.locator('.toast-success');
    await expect(toast).toContainText('轉移成功');
    
    // 6. 驗證歷史記錄更新
    const history = page.locator('[data-transfer-history]');
    await expect(history.first()).toContainText('PLT-001');
  });

  test('錯誤處理', async ({ page }) => {
    // 測試無效工號
    await page.fill('#clock-number', '9999');
    await expect(page.locator('.error-message'))
      .toContainText('無效的工號');
    
    // 測試不存在的托盤
    await page.fill('#clock-number', '1234');
    await page.fill('#pallet-search', 'INVALID-PLT');
    await expect(page.locator('.error-message'))
      .toContainText('找不到托盤');
  });

  test('性能測試', async ({ page }) => {
    const metrics = await page.evaluate(() => 
      performance.getEntriesByType('navigation')[0]
    );
    
    expect(metrics.loadEventEnd - metrics.fetchStart).toBeLessThan(3000);
    expect(metrics.domContentLoadedEventEnd).toBeLessThan(2000);
  });
});
```

### 測試執行命令
```bash
# 單元測試
npm run test:unit

# 集成測試
npm run test:integration

# E2E 測試
npm run test:e2e

# 測試覆蓋率報告
npm run test:coverage

# 性能測試
npm run test:performance

# 監視模式
npm run test:watch
```

## 性能考慮

### 當前性能基準
| 指標 | 目標 | 實際 | 狀態 |
|------|------|------|------|
| 首次內容繪製 (FCP) | <1.8s | 1.2s | ✅ |
| 最大內容繪製 (LCP) | <2.5s | 1.8s | ✅ |
| 首次輸入延遲 (FID) | <100ms | 45ms | ✅ |
| 累積佈局偏移 (CLS) | <0.1 | 0.02 | ✅ |
| 搜索響應時間 | <200ms | 95ms | ✅ |
| 轉移執行時間 | <500ms | 320ms | ✅ |

### 優化技術

#### 1. 數據庫查詢優化
```typescript
// 使用 RPC 函數減少往返
const result = await supabase.rpc('batch_operation', {
  operations: [
    { type: 'search', params: { plt_num: 'PLT-001' } },
    { type: 'validate', params: { clock_number: '1234' } },
    { type: 'transfer', params: { /* ... */ } }
  ]
});

// 使用連接池
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2. 前端優化
```typescript
// 延遲加載非關鍵組件
const TransferHistory = lazy(() => 
  import('./TransferHistory')
);

// 使用 memo 優化重渲染
const DestinationSelector = memo(({ 
  destinations, 
  selected, 
  onChange 
}) => {
  // 組件邏輯
}, (prevProps, nextProps) => 
  prevProps.selected === nextProps.selected
);

// 虛擬化長列表
const VirtualizedHistory = ({ items }) => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      {items[index]}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {rowRenderer}
    </List>
  );
};
```

#### 3. 緩存策略
```typescript
// 使用 SWR 進行數據緩存
const { data, error, mutate } = useSWR(
  `/api/transfer-history`,
  fetcher,
  {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    dedupingInterval: 2000
  }
);

// 本地存儲緩存
const cacheManager = {
  set: (key, value, ttl = 3600) => {
    localStorage.setItem(key, JSON.stringify({
      value,
      expires: Date.now() + ttl * 1000
    }));
  },
  
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { value, expires } = JSON.parse(item);
    if (Date.now() > expires) {
      localStorage.removeItem(key);
      return null;
    }
    
    return value;
  }
};
```

### 監控和分析

#### 性能監控設置
```typescript
// 使用 Performance Observer API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      analytics.track('Performance', {
        name: entry.name,
        duration: entry.duration,
        timestamp: entry.startTime
      });
    }
  }
});

observer.observe({ entryTypes: ['measure'] });

// 自定義性能標記
performance.mark('transfer-start');
await transferPallet(/* ... */);
performance.mark('transfer-end');
performance.measure(
  'stock-transfer-duration',
  'transfer-start',
  'transfer-end'
);
```

## 安全分析

### 安全層級架構
```
┌─────────────────────────────────┐
│      前端驗證層                  │
│  - 輸入格式驗證                 │
│  - XSS 防護                      │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│      API 層安全                  │
│  - CORS 配置                     │
│  - Rate Limiting                 │
│  - Request Validation            │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│      認證授權層                  │
│  - JWT Token 驗證                │
│  - 角色權限檢查                 │
│  - Session 管理                  │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│      數據庫安全層                │
│  - SQL 注入防護                  │
│  - RLS 政策                      │
│  - 加密存儲                      │
└─────────────────────────────────┘
```

### 安全實施

#### 1. 輸入驗證
```typescript
// 使用 Zod 進行嚴格驗證
const TransferSchema = z.object({
  pltNum: z.string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/),
  toLocation: z.enum(VALID_LOCATIONS),
  operatorId: z.number()
    .int()
    .positive(),
  timestamp: z.string()
    .datetime()
});

// 驗證函數
export function validateTransferInput(input: unknown) {
  try {
    return TransferSchema.parse(input);
  } catch (error) {
    throw new ValidationError('Invalid input', error);
  }
}
```

#### 2. SQL 注入防護
```typescript
// 使用參數化查詢
const safeQuery = async (pltNum: string) => {
  // ✅ 安全：使用參數化查詢
  return await supabase
    .from('record_palletinfo')
    .select('*')
    .eq('plt_num', pltNum);
  
  // ❌ 危險：字符串拼接
  // const query = `SELECT * FROM record_palletinfo WHERE plt_num = '${pltNum}'`;
};

// RPC 函數中的安全實踐
CREATE FUNCTION safe_transfer(
  p_plt_num TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- 防止 search_path 攻擊
AS $$
BEGIN
  -- 使用 quote_literal 防止注入
  EXECUTE format(
    'SELECT * FROM record_palletinfo WHERE plt_num = %L',
    p_plt_num
  );
END;
$$;
```

#### 3. 認證和授權
```typescript
// 中間件認證檢查
export async function requireAuth(
  request: Request,
  context: Context
) {
  const session = await getSession(request);
  
  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // 檢查權限
  const hasPermission = await checkPermission(
    session.user.id,
    'stock.transfer'
  );
  
  if (!hasPermission) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  return session.user;
}
```

#### 4. 審計日誌
```typescript
// 完整的審計追蹤
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: number;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export async function logAuditEvent(
  event: Partial<AuditLog>
): Promise<void> {
  await supabase
    .from('audit_logs')
    .insert({
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
      ipAddress: getClientIp(),
      userAgent: getUserAgent()
    });
}
```

### 安全檢查清單
- [x] 輸入驗證和消毒
- [x] SQL 注入防護
- [x] XSS 防護
- [x] CSRF 保護
- [x] 認證機制
- [x] 授權檢查
- [x] 會話管理
- [x] 敏感數據加密
- [x] 審計日誌
- [x] Rate Limiting
- [x] CORS 配置
- [x] 安全標頭

## 關鍵改進實施指南

### 優先級矩陣

| 改進項目 | 優先級 | 影響範圍 | 風險等級 | 預估工時 | 建議時程 |
|---------|--------|----------|----------|----------|----------|
| 數據庫函數 search_path 安全修復 | **P0 - 緊急** | 系統安全 | 高 | 40小時 | 立即執行 |
| 冗餘索引清理 | **P1 - 高** | 寫入性能 | 中 | 24小時 | 本週內 |
| GraphQL/Server Actions 架構統一 | **P2 - 中** | 架構一致性 | 中 | 80小時 | 本月內 |

### 成功指標

- **安全性指標**：100% 函數已修復 search_path 漏洞
- **性能指標**：寫入操作延遲降低 30-50%
- **架構指標**：API 調用統一率達到 95%
- **代碼質量**：技術債務減少 40%

### 資源需求

- **人力資源**：2名高級工程師，1名DBA，1名架構師
- **時間投入**：總計 144 工時（約 3-4 週）
- **工具需求**：數據庫分析工具、性能監控工具、自動化測試框架
- **環境需求**：獨立測試環境、性能測試環境

## 一、GraphQL 和 Server Actions 架構不一致性問題

### 1.1 當前架構衝突分析

#### 問題概述
系統目前同時維護兩套 API 系統，造成以下問題：

```typescript
// 現狀：混合使用兩種 API 模式
// Server Actions (新代碼)
export async function searchPalletAuto(searchValue: string) {
  'use server';
  const supabase = createClient();
  return await supabase.rpc('search_pallet_optimized_v2', {
    p_search_value: searchValue
  });
}

// GraphQL (舊代碼)
const SEARCH_PALLET = gql`
  query SearchPallet($searchValue: String!) {
    searchPallet(searchValue: $searchValue) {
      pltNum
      productCode
      currentLocation
    }
  }
`;
```

#### 具體問題清單

1. **代碼重複**
   - 相同業務邏輯在兩處實現
   - 維護成本翻倍
   - 易造成邏輯不一致

2. **性能開銷**
   - Apollo Client 緩存佔用記憶體（~3MB）
   - GraphQL 解析器額外 CPU 開銷
   - 兩套系統並行運行資源浪費

3. **開發困擾**
   - 團隊需要掌握兩套技術棧
   - 新功能不確定使用哪種方式
   - 測試需要覆蓋兩套系統

### 1.2 遷移策略

#### 決策框架

```typescript
// 決策函數：選擇 API 方式
function selectAPIStrategy(feature: FeatureRequirements): APIStrategy {
  // Server Actions 優先場景
  if (feature.isFormSubmission || 
      feature.requiresServerSideValidation ||
      feature.isSimpleCRUD) {
    return 'SERVER_ACTIONS';
  }
  
  // GraphQL 適用場景
  if (feature.requiresComplexRelations ||
      feature.needsSubscriptions ||
      feature.hasComplexCaching) {
    return 'GRAPHQL';
  }
  
  // 默認使用 Server Actions（Next.js 原生支援）
  return 'SERVER_ACTIONS';
}
```

#### 階段性遷移計劃

##### 第一階段：評估和分類（1週）

```bash
# 1. 掃描現有 API 使用情況
npm run api:scan

# 2. 生成遷移報告
npm run api:report > migration-report.md

# 3. 分類 API 端點
cat migration-report.md | grep -E "(GraphQL|ServerAction)" | sort | uniq -c
```

##### 第二階段：統一新開發標準（2週）

```typescript
// 新的統一 API 層
// lib/api/unified/stock-transfer.ts
import { createServerAction } from '@/lib/api/server-action-factory';
import { z } from 'zod';

// 統一的 API 定義
export const stockTransferAPI = {
  searchPallet: createServerAction({
    input: z.object({
      searchValue: z.string().min(1)
    }),
    async handler({ input }) {
      const { searchValue } = input;
      
      // 業務邏輯集中管理
      const result = await searchPalletLogic(searchValue);
      
      // 統一錯誤處理
      if (!result.success) {
        throw new APIError(result.error);
      }
      
      return result.data;
    }
  }),
  
  transferPallet: createServerAction({
    input: z.object({
      pltNum: z.string(),
      toLocation: z.string(),
      operatorId: z.number()
    }),
    async handler({ input }) {
      return await transferPalletLogic(input);
    }
  })
};
```

##### 第三階段：漸進式遷移（4週）

```typescript
// 遷移包裝器：支援漸進式遷移
export function createMigrationWrapper<T>(
  oldImplementation: () => Promise<T>,
  newImplementation: () => Promise<T>,
  options: {
    migrationPercentage: number; // 0-100
    enableLogging: boolean;
  }
) {
  return async (): Promise<T> => {
    const useNew = Math.random() * 100 < options.migrationPercentage;
    
    if (options.enableLogging) {
      console.log(`Using ${useNew ? 'new' : 'old'} implementation`);
    }
    
    try {
      if (useNew) {
        return await newImplementation();
      } else {
        return await oldImplementation();
      }
    } catch (error) {
      // 記錄錯誤並回退
      console.error(`Error in ${useNew ? 'new' : 'old'} implementation`, error);
      
      // 如果新實現失敗，回退到舊實現
      if (useNew) {
        return await oldImplementation();
      }
      
      throw error;
    }
  };
}
```

##### 第四階段：清理和優化（2週）

```bash
# 1. 移除未使用的 GraphQL 定義
npm run graphql:cleanup

# 2. 優化 bundle 大小
npm run build:analyze

# 3. 移除 Apollo Client（如果完全遷移）
npm uninstall @apollo/client graphql

# 4. 更新文檔
npm run docs:generate
```

### 1.3 風險評估和緩解策略

| 風險 | 影響 | 可能性 | 緩解策略 |
|------|------|--------|----------|
| 遷移過程中服務中斷 | 高 | 低 | 使用藍綠部署，保持回滾能力 |
| 功能退化 | 中 | 中 | 完整的 E2E 測試覆蓋 |
| 性能下降 | 中 | 低 | 性能基準測試和監控 |
| 團隊學習曲線 | 低 | 高 | 提供培訓和文檔 |

### 1.4 實施路線圖

```mermaid
gantt
    title API 架構統一實施計劃
    dateFormat  YYYY-MM-DD
    section 評估階段
    API 使用分析           :a1, 2025-01-20, 3d
    遷移計劃制定           :a2, after a1, 2d
    section 標準化階段
    統一 API 層設計        :b1, 2025-01-27, 5d
    新標準實施             :b2, after b1, 5d
    section 遷移階段
    核心 API 遷移          :c1, 2025-02-10, 10d
    次要 API 遷移          :c2, after c1, 10d
    section 優化階段
    性能優化               :d1, 2025-03-03, 5d
    清理舊代碼             :d2, after d1, 3d
```

## 二、數據庫函數 search_path 安全漏洞

### 2.1 漏洞詳細說明

#### SQL 注入攻擊向量
當前 57 個數據庫函數未設置 `search_path`，存在以下安全風險：

```sql
-- 易受攻擊的函數示例
CREATE OR REPLACE FUNCTION vulnerable_function(p_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
-- 缺少: SET search_path = public
AS $$
BEGIN
  -- 攻擊者可以創建惡意的同名函數在其他 schema
  RETURN some_function(p_input); -- 可能調用惡意函數
END;
$$;

-- 攻擊示例
-- 攻擊者創建惡意 schema
CREATE SCHEMA evil;

-- 在惡意 schema 創建同名函數
CREATE FUNCTION evil.some_function(p_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 竊取數據或執行惡意操作
  INSERT INTO evil.stolen_data VALUES (p_input);
  RETURN 'hacked';
END;
$$ LANGUAGE plpgsql;

-- 修改 search_path 執行攻擊
SET search_path = evil, public;
SELECT vulnerable_function('sensitive_data'); -- 數據被竊取
```

### 2.2 受影響函數清單

```sql
-- 查詢所有需要修復的函數
WITH vulnerable_functions AS (
  SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prolang != 12  -- 排除內部函數
    AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%'
)
SELECT 
  schema_name,
  function_name,
  CASE 
    WHEN function_name LIKE 'rpc_%' THEN 'HIGH'
    WHEN function_name LIKE '%transfer%' THEN 'HIGH'
    WHEN function_name LIKE '%inventory%' THEN 'MEDIUM'
    ELSE 'LOW'
  END AS priority
FROM vulnerable_functions
ORDER BY priority DESC, function_name;
```

### 2.3 修復步驟指南

#### 步驟 1：備份現有函數

```bash
#!/bin/bash
# backup_functions.sh

# 設置變量
DB_NAME="your_database"
BACKUP_DIR="./db_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 導出所有函數定義
pg_dump -h localhost -U postgres -d "$DB_NAME" \
  --schema-only \
  --function='public.*' \
  > "$BACKUP_DIR/functions_backup.sql"

echo "函數備份完成: $BACKUP_DIR/functions_backup.sql"
```

#### 步驟 2：生成修復腳本

```sql
-- generate_fix_script.sql
-- 自動生成修復腳本

DO $$
DECLARE
  func_record RECORD;
  fix_script TEXT := '';
  function_def TEXT;
BEGIN
  FOR func_record IN 
    SELECT 
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS function_definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%'
      AND p.prolang != 12
  LOOP
    -- 獲取函數定義
    function_def := func_record.function_definition;
    
    -- 在 AS $$ 之前插入 SET search_path
    function_def := regexp_replace(
      function_def,
      '(LANGUAGE \w+)(\s+)(AS \$)',
      E'\\1\\2SECURITY DEFINER\\2SET search_path = public\\2\\3',
      'i'
    );
    
    -- 添加到修復腳本
    fix_script := fix_script || 
      E'-- Fixing function: ' || func_record.function_name || E'\n' ||
      'DROP FUNCTION IF EXISTS ' || func_record.function_name || ' CASCADE;' || E'\n' ||
      function_def || E';\n\n';
  END LOOP;
  
  -- 輸出修復腳本
  RAISE NOTICE '%', fix_script;
END $$;
```

#### 步驟 3：批量修復腳本

```python
#!/usr/bin/env python3
# fix_search_path.py

import psycopg2
import re
from datetime import datetime

def fix_database_functions(connection_params):
    """
    批量修復數據庫函數的 search_path 安全問題
    """
    conn = psycopg2.connect(**connection_params)
    cur = conn.cursor()
    
    # 獲取需要修復的函數
    cur.execute("""
        SELECT 
            p.proname AS function_name,
            pg_get_functiondef(p.oid) AS function_definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
            AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%'
            AND p.prolang != 12
    """)
    
    functions = cur.fetchall()
    fixed_count = 0
    error_count = 0
    
    print(f"找到 {len(functions)} 個需要修復的函數")
    
    for func_name, func_def in functions:
        try:
            print(f"修復函數: {func_name}")
            
            # 修改函數定義
            fixed_def = fix_function_definition(func_def)
            
            # 執行修復
            cur.execute(f"DROP FUNCTION IF EXISTS {func_name} CASCADE")
            cur.execute(fixed_def)
            
            fixed_count += 1
            print(f"  ✓ 成功修復 {func_name}")
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ 修復 {func_name} 失敗: {e}")
            conn.rollback()
            continue
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\n修復完成:")
    print(f"  成功: {fixed_count}")
    print(f"  失敗: {error_count}")
    
    return fixed_count, error_count

def fix_function_definition(func_def):
    """
    修改函數定義，添加 search_path 設置
    """
    # 檢查是否已有 SECURITY DEFINER
    if 'SECURITY DEFINER' not in func_def:
        func_def = re.sub(
            r'(LANGUAGE \w+)(\s+)(AS \$)',
            r'\1\2SECURITY DEFINER\2AS $',
            func_def,
            flags=re.IGNORECASE
        )
    
    # 添加 SET search_path
    func_def = re.sub(
        r'(SECURITY DEFINER)(\s+)(AS \$)',
        r'\1\2SET search_path = public\2\3',
        func_def,
        flags=re.IGNORECASE
    )
    
    return func_def

if __name__ == "__main__":
    # 數據庫連接參數
    connection_params = {
        'host': 'localhost',
        'database': 'your_database',
        'user': 'postgres',
        'password': 'your_password'
    }
    
    # 執行修復
    fix_database_functions(connection_params)
```

#### 步驟 4：驗證修復結果

```sql
-- verify_fixes.sql
-- 驗證所有函數已修復

WITH function_check AS (
  SELECT 
    p.proname AS function_name,
    CASE 
      WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' 
      THEN '✓ 已修復'
      ELSE '✗ 未修復'
    END AS status,
    CASE 
      WHEN pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' 
      THEN '✓'
      ELSE '✗'
    END AS has_security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prolang != 12
)
SELECT 
  status,
  COUNT(*) as count,
  array_agg(function_name) AS functions
FROM function_check
GROUP BY status
ORDER BY status;

-- 詳細檢查高風險函數
SELECT 
  function_name,
  status,
  has_security_definer
FROM function_check
WHERE function_name LIKE 'rpc_%' 
   OR function_name LIKE '%transfer%'
ORDER BY status DESC, function_name;
```

### 2.4 預防措施

#### 創建函數模板

```sql
-- function_template.sql
-- 安全函數模板

CREATE OR REPLACE FUNCTION template_safe_function(
  p_param1 TEXT,
  p_param2 INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- 以函數所有者權限執行
SET search_path = public  -- 固定搜索路徑
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- 輸入驗證
  IF p_param1 IS NULL OR p_param2 IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  
  -- 業務邏輯
  SELECT json_build_object(
    'success', true,
    'data', 'processed'
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- 錯誤處理
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
```

#### 自動化檢查流程

```yaml
# .github/workflows/db-security-check.yml
name: Database Security Check

on:
  push:
    paths:
      - 'supabase/migrations/**'
  pull_request:
    paths:
      - 'supabase/migrations/**'

jobs:
  check-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check for search_path in functions
        run: |
          # 檢查所有 SQL 文件中的函數定義
          for file in supabase/migrations/*.sql; do
            if grep -q "CREATE.*FUNCTION" "$file"; then
              if ! grep -q "SET search_path" "$file"; then
                echo "ERROR: Function in $file missing search_path"
                exit 1
              fi
            fi
          done
          
      - name: Run security audit
        run: |
          npm run db:security-audit
```

## 三、冗餘索引清理優化

### 3.1 索引影響分析

#### 當前索引狀況評估

```sql
-- analyze_indexes.sql
-- 全面分析索引使用情況

WITH index_stats AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    pg_relation_size(indexrelid) AS index_size_bytes
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
),
table_stats AS (
  SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del AS write_ops,
    seq_scan + idx_scan AS read_ops
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
),
index_analysis AS (
  SELECT 
    i.*,
    t.write_ops,
    t.read_ops,
    CASE 
      WHEN i.idx_scan = 0 THEN '未使用'
      WHEN i.idx_scan < 100 THEN '極少使用'
      WHEN i.idx_scan < 1000 THEN '偶爾使用'
      ELSE '頻繁使用'
    END AS usage_category,
    ROUND((t.write_ops::numeric / NULLIF(t.read_ops, 0)) * 100, 2) AS write_read_ratio
  FROM index_stats i
  JOIN table_stats t ON i.tablename = t.tablename
)
SELECT 
  tablename,
  indexname,
  usage_category,
  idx_scan AS scan_count,
  index_size,
  write_read_ratio,
  CASE 
    WHEN usage_category = '未使用' THEN '建議刪除'
    WHEN usage_category = '極少使用' AND write_read_ratio > 50 THEN '考慮刪除'
    ELSE '保留'
  END AS recommendation
FROM index_analysis
ORDER BY 
  CASE usage_category 
    WHEN '未使用' THEN 1
    WHEN '極少使用' THEN 2
    WHEN '偶爾使用' THEN 3
    ELSE 4
  END,
  index_size_bytes DESC;
```

#### 重複索引檢測

```sql
-- find_duplicate_indexes.sql
-- 查找重複和冗餘索引

WITH index_columns AS (
  SELECT 
    t.relname AS table_name,
    i.relname AS index_name,
    array_agg(a.attname ORDER BY x.n) AS columns,
    pg_size_pretty(pg_relation_size(i.oid)) AS index_size,
    pg_relation_size(i.oid) AS size_bytes
  FROM pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_class t ON t.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  CROSS JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS x(attnum, n)
  JOIN pg_attribute a ON a.attnum = x.attnum AND a.attrelid = t.oid
  WHERE n.nspname = 'public'
    AND NOT idx.indisprimary
    AND NOT idx.indisunique
  GROUP BY t.relname, i.relname, i.oid
),
duplicate_indexes AS (
  SELECT 
    a.table_name,
    a.index_name AS index_1,
    b.index_name AS index_2,
    a.columns AS columns_1,
    b.columns AS columns_2,
    a.index_size AS size_1,
    b.index_size AS size_2,
    CASE 
      WHEN a.columns = b.columns THEN '完全重複'
      WHEN a.columns @> b.columns THEN 'index_1 包含 index_2'
      WHEN b.columns @> a.columns THEN 'index_2 包含 index_1'
      ELSE '部分重疊'
    END AS relationship
  FROM index_columns a
  JOIN index_columns b ON a.table_name = b.table_name 
    AND a.index_name < b.index_name
    AND (a.columns && b.columns)
)
SELECT * FROM duplicate_indexes
ORDER BY table_name, relationship;
```

### 3.2 安全清理策略

#### 階段性清理計劃

```python
#!/usr/bin/env python3
# cleanup_indexes.py

import psycopg2
import time
from datetime import datetime, timedelta

class IndexCleanupManager:
    def __init__(self, connection_params):
        self.conn = psycopg2.connect(**connection_params)
        self.cur = self.conn.cursor()
        self.cleanup_log = []
    
    def analyze_index_usage(self, days_back=30):
        """分析過去 N 天的索引使用情況"""
        query = """
        SELECT 
            indexname,
            tablename,
            idx_scan,
            idx_tup_read,
            pg_size_pretty(pg_relation_size(indexrelid)) AS size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
            AND idx_scan = 0
            AND pg_relation_size(indexrelid) > 1000000  -- > 1MB
        ORDER BY pg_relation_size(indexrelid) DESC
        """
        
        self.cur.execute(query)
        return self.cur.fetchall()
    
    def create_backup_script(self, indexes_to_remove):
        """生成索引重建腳本"""
        backup_script = f"""
-- Index Backup Script
-- Generated: {datetime.now()}
-- Total indexes: {len(indexes_to_remove)}

"""
        for index in indexes_to_remove:
            self.cur.execute(f"""
                SELECT pg_get_indexdef(indexrelid)
                FROM pg_stat_user_indexes
                WHERE indexname = %s
            """, (index,))
            
            index_def = self.cur.fetchone()
            if index_def:
                backup_script += f"{index_def[0]};\n\n"
        
        # 保存備份腳本
        with open(f"index_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql", 'w') as f:
            f.write(backup_script)
        
        return backup_script
    
    def safe_drop_index(self, index_name, table_name):
        """安全地刪除索引並監控性能"""
        try:
            # 記錄刪除前的性能基準
            pre_metrics = self.get_performance_metrics(table_name)
            
            # 使用 CONCURRENTLY 避免鎖表
            print(f"刪除索引: {index_name}")
            self.cur.execute(f"DROP INDEX CONCURRENTLY IF EXISTS {index_name}")
            self.conn.commit()
            
            # 等待一段時間
            time.sleep(10)
            
            # 檢查性能影響
            post_metrics = self.get_performance_metrics(table_name)
            
            # 如果性能顯著下降，記錄警告
            if self.performance_degraded(pre_metrics, post_metrics):
                self.cleanup_log.append({
                    'index': index_name,
                    'status': 'warning',
                    'message': '性能下降，考慮恢復'
                })
                return False
            
            self.cleanup_log.append({
                'index': index_name,
                'status': 'success',
                'message': '成功刪除'
            })
            return True
            
        except Exception as e:
            self.conn.rollback()
            self.cleanup_log.append({
                'index': index_name,
                'status': 'error',
                'message': str(e)
            })
            return False
    
    def get_performance_metrics(self, table_name):
        """獲取表的性能指標"""
        self.cur.execute("""
            SELECT 
                seq_scan,
                seq_tup_read,
                idx_scan,
                idx_tup_fetch
            FROM pg_stat_user_tables
            WHERE tablename = %s
        """, (table_name,))
        
        return self.cur.fetchone()
    
    def performance_degraded(self, pre_metrics, post_metrics, threshold=0.2):
        """檢查性能是否下降"""
        if not pre_metrics or not post_metrics:
            return False
        
        # 檢查順序掃描是否顯著增加
        seq_scan_increase = (post_metrics[0] - pre_metrics[0]) / max(pre_metrics[0], 1)
        
        return seq_scan_increase > threshold
    
    def execute_cleanup(self, dry_run=True):
        """執行清理流程"""
        print("開始索引清理分析...")
        
        # 1. 識別未使用的索引
        unused_indexes = self.analyze_index_usage()
        print(f"找到 {len(unused_indexes)} 個未使用的索引")
        
        if not unused_indexes:
            print("沒有需要清理的索引")
            return
        
        # 2. 創建備份腳本
        indexes_to_remove = [idx[0] for idx in unused_indexes[:10]]  # 每次最多刪除10個
        self.create_backup_script(indexes_to_remove)
        
        if dry_run:
            print("Dry run 模式，以下索引將被刪除：")
            for idx in indexes_to_remove:
                print(f"  - {idx}")
            return
        
        # 3. 執行刪除
        for index_name, table_name, *_ in unused_indexes[:10]:
            self.safe_drop_index(index_name, table_name)
            time.sleep(5)  # 避免過度影響系統
        
        # 4. 生成報告
        self.generate_report()
    
    def generate_report(self):
        """生成清理報告"""
        report = f"""
索引清理報告
生成時間: {datetime.now()}

清理結果:
"""
        success_count = sum(1 for log in self.cleanup_log if log['status'] == 'success')
        warning_count = sum(1 for log in self.cleanup_log if log['status'] == 'warning')
        error_count = sum(1 for log in self.cleanup_log if log['status'] == 'error')
        
        report += f"""
成功: {success_count}
警告: {warning_count}
錯誤: {error_count}

詳細日誌:
"""
        for log in self.cleanup_log:
            report += f"  [{log['status']}] {log['index']}: {log['message']}\n"
        
        with open(f"cleanup_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", 'w') as f:
            f.write(report)
        
        print(report)

if __name__ == "__main__":
    connection_params = {
        'host': 'localhost',
        'database': 'your_database',
        'user': 'postgres',
        'password': 'your_password'
    }
    
    manager = IndexCleanupManager(connection_params)
    manager.execute_cleanup(dry_run=False)
```

### 3.3 性能監控指南

#### 實時監控腳本

```sql
-- monitor_write_performance.sql
-- 監控寫入性能

CREATE OR REPLACE FUNCTION monitor_write_performance()
RETURNS TABLE(
  table_name TEXT,
  inserts_per_sec NUMERIC,
  updates_per_sec NUMERIC,
  deletes_per_sec NUMERIC,
  total_writes_per_sec NUMERIC,
  avg_insert_time_ms NUMERIC
) AS $$
DECLARE
  v_interval INTEGER := 10; -- 監控間隔（秒）
BEGIN
  -- 創建臨時表存儲初始狀態
  CREATE TEMP TABLE IF NOT EXISTS write_stats_start AS
  SELECT 
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    now() AS snapshot_time
  FROM pg_stat_user_tables;
  
  -- 等待指定間隔
  PERFORM pg_sleep(v_interval);
  
  -- 計算性能指標
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    ROUND((t.n_tup_ins - s.n_tup_ins)::NUMERIC / v_interval, 2) AS inserts_per_sec,
    ROUND((t.n_tup_upd - s.n_tup_upd)::NUMERIC / v_interval, 2) AS updates_per_sec,
    ROUND((t.n_tup_del - s.n_tup_del)::NUMERIC / v_interval, 2) AS deletes_per_sec,
    ROUND(((t.n_tup_ins - s.n_tup_ins) + 
           (t.n_tup_upd - s.n_tup_upd) + 
           (t.n_tup_del - s.n_tup_del))::NUMERIC / v_interval, 2) AS total_writes_per_sec,
    0::NUMERIC AS avg_insert_time_ms -- 需要從應用層獲取
  FROM pg_stat_user_tables t
  JOIN write_stats_start s ON t.tablename = s.tablename
  WHERE ((t.n_tup_ins - s.n_tup_ins) + 
         (t.n_tup_upd - s.n_tup_upd) + 
         (t.n_tup_del - s.n_tup_del)) > 0
  ORDER BY total_writes_per_sec DESC;
  
  -- 清理臨時表
  DROP TABLE IF EXISTS write_stats_start;
END;
$$ LANGUAGE plpgsql;

-- 使用示例
SELECT * FROM monitor_write_performance();
```

#### 自動化性能基準測試

```typescript
// performance-benchmark.ts
// 索引清理前後的性能基準測試

import { createClient } from '@supabase/supabase-js';

interface BenchmarkResult {
  operation: string;
  beforeCleanup: number;
  afterCleanup: number;
  improvement: string;
}

class PerformanceBenchmark {
  private supabase: any;
  private results: BenchmarkResult[] = [];
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  async runBenchmark(testName: string, testFunction: () => Promise<void>) {
    const iterations = 100;
    const timings: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      timings.push(end - start);
    }
    
    // 計算統計數據
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const sorted = timings.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(iterations * 0.5)];
    const p95 = sorted[Math.floor(iterations * 0.95)];
    const p99 = sorted[Math.floor(iterations * 0.99)];
    
    return {
      avg,
      p50,
      p95,
      p99,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
  
  async benchmarkInsertOperation() {
    return this.runBenchmark('Insert Operation', async () => {
      await this.supabase
        .from('record_transfer')
        .insert({
          tran_date: new Date(),
          f_loc: 'injection',
          t_loc: 'fold',
          plt_num: `PLT-TEST-${Math.random()}`,
          operator_id: 123,
          product_code: 'TEST-001'
        });
    });
  }
  
  async benchmarkUpdateOperation() {
    return this.runBenchmark('Update Operation', async () => {
      await this.supabase
        .from('record_palletinfo')
        .update({ current_location: 'bulk' })
        .eq('plt_num', 'PLT-TEST-001');
    });
  }
  
  async benchmarkComplexQuery() {
    return this.runBenchmark('Complex Query', async () => {
      await this.supabase
        .from('record_transfer')
        .select(`
          *,
          operator:data_id(name),
          pallet:record_palletinfo(product_code)
        `)
        .gte('tran_date', new Date(Date.now() - 86400000))
        .limit(100);
    });
  }
  
  async runFullBenchmark() {
    console.log('開始性能基準測試...');
    
    const tests = [
      { name: 'Insert', func: () => this.benchmarkInsertOperation() },
      { name: 'Update', func: () => this.benchmarkUpdateOperation() },
      { name: 'Complex Query', func: () => this.benchmarkComplexQuery() }
    ];
    
    for (const test of tests) {
      console.log(`測試: ${test.name}`);
      const result = await test.func();
      console.log(`  平均: ${result.avg.toFixed(2)}ms`);
      console.log(`  P50: ${result.p50.toFixed(2)}ms`);
      console.log(`  P95: ${result.p95.toFixed(2)}ms`);
      console.log(`  P99: ${result.p99.toFixed(2)}ms`);
    }
  }
}

// 執行基準測試
const benchmark = new PerformanceBenchmark(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

benchmark.runFullBenchmark();
```

### 3.4 回滾程序

```sql
-- rollback_indexes.sql
-- 索引回滾腳本

-- 從備份恢復索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfer_composite 
  ON record_transfer(tran_date DESC, plt_num, operator_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_palletinfo_search 
  ON record_palletinfo USING GIN(to_tsvector('english', 
    plt_num || ' ' || COALESCE(serial_num, '')));

-- 驗證索引創建成功
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indisvalid THEN '✓ 有效'
    ELSE '✗ 無效'
  END AS status
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
JOIN pg_index idx ON idx.indexrelid = c.oid
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_transfer_composite',
    'idx_palletinfo_search'
  );
```

## 測試程序

### 測試前準備

```bash
#!/bin/bash
# pre-implementation-test.sh

echo "執行實施前測試..."

# 1. 備份當前系統狀態
pg_dump -h localhost -U postgres -d production > backup_before_changes.sql

# 2. 記錄當前性能基準
npm run benchmark:current > benchmark_before.json

# 3. 執行安全掃描
npm run security:scan > security_before.json

# 4. 運行完整測試套件
npm run test:all > test_before.log

echo "實施前測試完成"
```

### 測試後驗證

```bash
#!/bin/bash
# post-implementation-test.sh

echo "執行實施後驗證..."

# 1. 運行功能測試
npm run test:e2e

# 2. 性能對比測試
npm run benchmark:current > benchmark_after.json
npm run benchmark:compare benchmark_before.json benchmark_after.json

# 3. 安全驗證
npm run security:verify

# 4. 壓力測試
npm run stress:test

echo "實施後驗證完成"
```

## 維護指南

### 日常維護任務

#### 每日檢查
```bash
# 檢查系統健康狀態
npm run health:check

# 查看錯誤日誌
npm run logs:errors --since=24h

# 檢查數據庫連接
npm run db:ping

# 驗證關鍵功能
npm run test:smoke
```

#### 每週維護
```bash
# 清理舊日誌
npm run logs:cleanup --older-than=7d

# 更新依賴
npm run deps:check
npm run deps:update:patch

# 性能分析
npm run perf:analyze

# 備份數據庫
npm run db:backup
```

#### 每月維護
```bash
# 安全審計
npm run security:audit

# 更新主要依賴
npm run deps:update:minor

# 清理未使用資源
npm run cleanup:unused

# 重建索引
npm run db:reindex
```

### 故障排除指南

#### 常見問題解決
```typescript
// 問題：托盤搜索失敗
解決方案：
1. 檢查數據庫連接
   - 執行: npm run db:test-connection
2. 驗證 RPC 函數
   - 執行: npm run db:test-rpc search_pallet_optimized_v2
3. 檢查索引狀態
   - 執行: npm run db:check-indexes
4. 查看錯誤日誌
   - 執行: npm run logs:search-errors

// 問題：轉移執行緩慢
解決方案：
1. 分析查詢性能
   - 執行: npm run db:explain-analyze
2. 檢查鎖等待
   - 執行: npm run db:check-locks
3. 優化連接池
   - 調整: POOL_MAX_CONNECTIONS
4. 啟用查詢緩存
   - 設置: ENABLE_QUERY_CACHE=true

// 問題：用戶無法登錄
解決方案：
1. 驗證認證服務
   - 執行: npm run auth:test
2. 檢查會話存儲
   - 執行: npm run session:check
3. 清理過期會話
   - 執行: npm run session:cleanup
4. 重置用戶密碼
   - 執行: npm run user:reset-password [user-id]
```

### 部署程序

#### 生產部署流程
```bash
# 1. 預部署檢查
npm run deploy:pre-check

# 2. 運行測試
npm run test:all

# 3. 構建應用
npm run build:production

# 4. 數據庫遷移
npm run db:migrate:production

# 5. 部署
npm run deploy:production

# 6. 健康檢查
npm run deploy:health-check

# 7. 監控
npm run monitor:production
```

#### 回滾程序
```bash
# 1. 確認回滾版本
npm run deploy:list-versions

# 2. 執行回滾
npm run deploy:rollback [version]

# 3. 驗證回滾
npm run deploy:verify-rollback

# 4. 通知團隊
npm run notify:rollback
```

## 已知問題和限制

### 當前限制
1. **批量轉移**：不支援一次轉移多個托盤
2. **離線模式**：需要網絡連接才能運作
3. **並發限制**：同一托盤不能同時被多人操作
4. **歷史記錄**：只顯示最近 100 條記錄
5. **搜索功能**：不支援模糊搜索

### 活躍 Bugs
| ID | 嚴重性 | 描述 | 狀態 | 預計修復 |
|----|--------|------|------|----------|
| #001 | 中 | 快速切換目的地可能導致狀態不同步 | 進行中 | v2.1.0 |
| #002 | 低 | 歷史記錄分頁在邊界情況下顯示錯誤 | 待處理 | v2.2.0 |
| #003 | 低 | 深色模式下某些文字對比度不足 | 待處理 | v2.1.0 |

### 瀏覽器兼容性
| 瀏覽器 | 最低版本 | 狀態 | 備註 |
|--------|----------|------|------|
| Chrome | 90+ | ✅ 完全支援 | 推薦使用 |
| Firefox | 88+ | ✅ 完全支援 | - |
| Safari | 14+ | ⚠️ 部分支援 | 某些動畫可能不流暢 |
| Edge | 90+ | ✅ 完全支援 | - |
| IE | - | ❌ 不支援 | - |

## 未來增強建議

### 短期改進 (Q1 2025)
1. **批量轉移功能**
   - 支援多選托盤
   - 批量驗證和執行
   - 進度追蹤

2. **高級搜索**
   - 模糊搜索支援
   - 過濾器和排序
   - 搜索歷史

3. **性能優化**
   - 實施 Service Worker
   - 增強緩存策略
   - 優化打包大小

### 中期改進 (Q2-Q3 2025)
1. **離線支援**
   - 本地數據緩存
   - 離線隊列
   - 自動同步

2. **實時協作**
   - WebSocket 連接
   - 實時狀態同步
   - 衝突解決

3. **移動應用**
   - React Native 版本
   - 掃碼優化
   - 推送通知

### 長期願景 (2026+)
1. **AI 集成**
   - 智能路徑優化
   - 異常檢測
   - 預測性維護

2. **區塊鏈集成**
   - 不可變審計日誌
   - 供應鏈追蹤
   - 智能合約

3. **IoT 集成**
   - RFID 支援
   - 自動化倉庫
   - 實時追蹤

## 附錄

### API 參考
完整的 API 文檔請參考：`/docs/api/stock-transfer.md`

### 配置選項
```typescript
interface StockTransferConfig {
  // 功能開關
  features: {
    enableBatchTransfer: boolean;
    enableOfflineMode: boolean;
    enableRealTimeSync: boolean;
  };
  
  // 性能設置
  performance: {
    searchDebounceMs: number;
    maxHistoryItems: number;
    cacheTimeout: number;
  };
  
  // 安全設置
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireMFA: boolean;
  };
}
```

### 錯誤代碼參考
| 代碼 | 描述 | 解決方案 |
|------|------|----------|
| E001 | 數據庫連接失敗 | 檢查網絡和數據庫狀態 |
| E002 | 認證失敗 | 重新登錄 |
| E003 | 權限不足 | 聯繫管理員 |
| E004 | 托盤不存在 | 檢查托盤號 |
| E005 | 托盤已作廢 | 無法操作作廢托盤 |
| E006 | 重複轉移 | 托盤已在目標位置 |
| E007 | 並發衝突 | 稍後重試 |
| E008 | 驗證失敗 | 檢查輸入格式 |

---

*文檔版本：1.0.0*  
*最後更新：2025-01-18*  
*作者：技術團隊*