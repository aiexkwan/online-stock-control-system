# Zod 驗證實施規劃報告
*版本: 1.6.0*
*日期: 2025-08-11*
*狀態: 規劃階段*

## 執行摘要

本文件概述了一項全面計畫，旨在於整個 PennineWMS 程式碼庫中實施 Zod 驗證，將目前 13.5% 的覆蓋率提升至關鍵路徑 100% 的目標。此實施將分階段在 8 週內完成，以最小化風險並確保系統穩定性。

## 目錄

1.  [現況分析](#現況分析)
2.  [實施策略](#實施策略)
3.  [第一階段: Server Actions (第 1-2 週)](#第一階段-server-actions-第-1-2-週)
4.  [第二階段: API 路由 (第 3-4 週)](#第二階段-api-路由-第-3-4-週)
5.  [第三階段: 後端服務 (第 5-6 週)](#第三階段-後端服務-第-5-6-週)
6.  [第四階段: 測試與文件 (第 7 週)](#第四階段-測試與文件-第-7-週)
7.  [第五階段: 部署與監控 (第 8 週)](#第五階段-部署與監控-第-8-週)
8.  [資源需求](#資源需求)
9.  [風險評估](#風險評估)
10. [成功指標](#成功指標)

---

## 現況分析

### 實際資料庫結構（已驗證）

基於 Supabase 資料庫實際查詢結果（日期: 2025-08-11）：

#### 核心資料表

| 表名 | 主要欄位 | 資料型別 | 備註 |
|------|----------|------------|-------|
| **record_palletinfo** | plt_num | text (NOT NULL) | 格式: DDMMYY/XXX |
| | product_code | text (NOT NULL) | 產品代碼 |
| | product_qty | **bigint** (NOT NULL) | 注意: 不是 number |
| | series | text (NOT NULL) | 系列號 |
| | generate_time | timestamp with time zone | 生成時間 |
| **record_inventory** | product_code | text (NOT NULL) | 產品代碼 |
| | injection | **bigint** (NOT NULL) | 所有數量欄位 |
| | pipeline | **bigint** (NOT NULL) | 都使用 bigint |
| | await | **bigint** (NOT NULL) | |
| | fold | **bigint** (NOT NULL) | |
| **record_history** | id | **integer** (NOT NULL) | 工號/用戶ID |
| | action | text (NOT NULL) | 動作類型 |
| | plt_num | text (NULLABLE) | 棧板號 |
| | loc | text (NULLABLE) | 位置 |
| | time | timestamp with time zone | 時間 |
| **data_id** | id | **integer** (NOT NULL) | 工號 |
| | name | text (NOT NULL) | 姓名 |
| | email | text (NULLABLE) | 電子郵件 |
| | department | text (NOT NULL) | 部門 |
| **data_code** | code | text (NOT NULL) | 產品代碼 |
| | description | text (NOT NULL) | 描述 |
| | standard_qty | **integer** (NOT NULL) | 標準數量 |

#### 重要發現
1. **數量欄位使用 bigint**：所有庫存數量都使用 `bigint` 而非 `number`
2. **工號使用 integer**：`data_id.id` 和 `record_history.id` 是 `integer` 而非字串
3. **時間戳格式**：使用 `timestamp with time zone`
4. **棧板號格式**：確認為 `^\d{6}\/\d{1,3}$` (DDMMYY/XXX)

### 覆蓋率統計

| 元件 | 總檔案數 | 使用 Zod | 覆蓋率 | 優先級 |
|-----------|------------|-----------|----------|----------|
| API 路由 | 43 | 9 | 20.9% | 🔴 高 |
| Server Actions | 17 | 8 | 47.1% | 🔴 高 |
| 後端服務 | 85 | 3 | 3.5% | 🟠 中 |
| 型別定義 | 59 | 3 | 5.1% | 🟡 低 |
| **總計** | **204** | **23** | **11.3%** | - |

### 已識別的關鍵差距

#### 無驗證的高風險區域
- **驗證與授權**: 使用者登入、密碼重設、會話管理
- **檔案操作**: 上傳、下載、PDF 生成
- **資料變動**: 庫存轉移、訂單處理、庫存更新
- **外部通訊**: 郵件發送、API 整合

#### 技術債
- 混合的驗證方法 (Zod vs class-validator)
- 不一致的錯誤處理
- 缺乏集中的驗證結構 (schemas)
- 沒有自動化的驗證測試

---

## 實施策略

### 核心原則

1.  **型別安全優先**: 所有驗證必須是型別安全的，並具備正確的 TypeScript 型別推斷
2.  **漸進式增強**: 在不破壞現有功能的情況下實施驗證
3.  **統一架構**: 驗證結構的單一事實來源
4.  **開發者體驗**: 清晰的錯誤訊息與易於使用的模式
5.  **性能考量**: 對回應時間的影響降至最低

### 統一驗證架構

```
lib/validation/
├── core/                    # 核心驗證基礎設施
│   ├── index.ts            # 主要導出
│   ├── validator.ts        # 通用驗證器類別
│   └── middleware.ts       # 驗證中介軟體
├── schemas/                 # 結構定義
│   ├── common/             # 共享結構
│   │   ├── base.ts        # 基礎型別 (ID, timestamp 等)
│   │   ├── pagination.ts  # 分頁結構
│   │   └── response.ts    # API 回應結構
│   ├── business/           # 業務領域結構
│   │   ├── auth.ts        # 驗證結構
│   │   ├── inventory.ts   # 庫存管理
│   │   ├── orders.ts      # 訂單處理
│   │   ├── products.ts    # 產品管理
│   │   └── suppliers.ts   # 供應商管理
│   └── api/                # API 特定結構
│       ├── requests.ts     # 請求驗證
│       └── responses.ts    # 回應驗證
├── utils/                   # 工具函式
│   ├── transformers.ts     # 資料轉換
│   ├── sanitizers.ts       # 輸入淨化
│   └── parsers.ts          # 安全解析工具
├── errors/                  # 錯誤處理
│   ├── types.ts            # 錯誤型別定義
│   ├── handlers.ts         # 錯誤處理器
│   └── formatters.ts       # 錯誤格式化器
└── tests/                   # 驗證測試
    ├── schemas/            # 結構測試
    └── integration/        # 整合測試
```

### 基礎結構庫

```typescript
// lib/validation/schemas/common/base.ts
import { z } from 'zod';

// ===== 識別碼 =====
// 重要: UUID 全部由 Supabase 自動生成 (gen_random_uuid())
// 系統只讀取 UUID，不需要驗證或生成
// export const UuidSchema = z.string().uuid(); // 不需要

// data_id.id 在 Supabase 中是 integer 類型
// 注意：ClockNumber 驗證已在多處實現：
// 1. /app/components/qc-label-form/ClockNumberConfirmDialog.tsx (UI驗證)
// 2. /lib/validation/zod-schemas.ts 中的 DataIdSchema (表結構驗證)
export const ClockNumberSchema = z.union([
  z.number().int().positive('工號必須為正整數'),
  z.string().regex(/^\d+$/, '工號必須僅包含數字').transform(val => parseInt(val, 10))
]);
// 實際 pallet 號碼格式來自 app/utils/palletSearchUtils.ts
export const PalletNumberSchema = z.string()
  .regex(/^\d{6}\/\d{1,3}$/, '無效的棧板號格式 (DDMMYY/XXX)');

// ⚠️ Series 號碼不需要驗證 Schema
// 原因：
// 1. Series 由系統自動生成 (lib/seriesUtils.ts)
//    - 格式: DDMMYY-XXXXXX (日期 + 6位隨機英數)
// 2. 由 Supabase 函數管理 (generate_atomic_pallet_numbers_v6)
//    - 從 pallet_number_buffer 表獲取
// 3. 用戶只能搜索 Series，不能輸入或修改
// 
// export const SeriesSchema = z.string(); // 不需要
export const ProductCodeSchema = z.string()
  .min(1, '產品代碼為必填項')
  .transform(val => val.trim().toUpperCase());

// ===== 時間戳 =====
// Supabase 使用 timestamp with time zone
export const DateTimeSchema = z.union([
  z.string().datetime('無效的日期時間格式'),
  z.date().transform(val => val.toISOString())
]);
export const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '無效的日期格式 (YYYY-MM-DD)');

// ===== 數字 =====
// 注意: Supabase 使用 bigint 儲存數量，需要 coerce 或 string 轉換
export const QuantitySchema = z.union([
  z.bigint().min(0n, '數量不能為負數'),
  z.number().int('數量必須為整數').min(0, '數量不能為負數'),
  z.string().regex(/^\d+$/, '數量必須為數字').transform(val => BigInt(val))
]);
export const StandardQtySchema = z.number()
  .int('標準數量必須為整數')
  .min(0, '標準數量不能為負數');
export const WeightSchema = z.number()
  .min(0, '重量不能為負數')
  .max(10000, '重量超過最大限制');
export const PercentageSchema = z.number()
  .min(0, '百分比不能小於 0')
  .max(100, '百分比不能超過 100');

// ===== 字串 =====
export const EmailSchema = z.string()
  .email('無效的電子郵件格式')
  .toLowerCase();
export const NonEmptyStringSchema = z.string()
  .min(1, '此欄位為必填項')
  .transform(val => val.trim());
export const OptionalStringSchema = z.string()
  .optional()
  .transform(val => val?.trim());

// ===== 常見模式 =====
export const SearchQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const DateRangeSchema = z.object({
  startDate: DateTimeSchema,
  endDate: DateTimeSchema,
}).refine(
  data => new Date(data.startDate) <= new Date(data.endDate),
  { message: '結束日期必須在開始日期之後' }
);
```

---

## 第一階段: Server Actions (第 1-2 週)

### 第 1 週: 高優先級 Actions

#### 待實施檔案

| 檔案 | 優先級 | 複雜度 | 現況 | 依賴 |
|------|----------|------------|---------------|--------------|
| `stockTransferActions.ts` | 🔴 嚴重 | 高 | 部分 types 但無 Zod | 庫存結構 |
| `orderUploadActions.ts` | 🔴 嚴重 | 高 | 有 Zod schemas | 檔案上傳結構 |
| `productActions.ts` | 🔴 嚴重 | 中 | 無驗證 | 產品結構 |
| `palletActions.ts` | 🔴 嚴重 | 中 | 有 types 但少 Zod | 棧板結構 |
| `dashboardActions.ts` | 🟠 重要 | 低 | 無驗證 | 儀表板結構 |

#### 實施範例

```typescript
// app/actions/schemas/stockTransfer.ts
import { z } from 'zod';
import { PalletNumberSchema, QuantitySchema, ClockNumberSchema } from '@/lib/validation/schemas/common/base';

// 基於實際使用的 locations（來自 stockTransferActions.ts）
const LocationSchema = z.enum([
  'Await', 'Await_grn', 'Fold Mill', 'Production', 
  'PipeLine', 'Void', 'Lost', 'Ship', 'Damage', 'Voided'
]);

export const StockTransferSchema = z.object({
  palletNumber: PalletNumberSchema,
  fromLocation: LocationSchema.optional(),  // 可能從 record_history 查詢
  toLocation: LocationSchema,
  quantity: QuantitySchema,  // 會轉換為 bigint
  transferredBy: ClockNumberSchema,  // 會轉換為 integer
  reason: z.enum(['restock', 'order', 'adjustment', 'return']).optional(),
  notes: z.string().max(500).optional(),
});

export const BulkTransferSchema = z.object({
  transfers: z.array(StockTransferSchema).min(1).max(100),
  batchId: z.string().uuid().optional(),
});

export type StockTransferInput = z.infer<typeof StockTransferSchema>;
export type BulkTransferInput = z.infer<typeof BulkTransferSchema>;
```

```typescript
// app/actions/stockTransferActions.ts
'use server';

import { StockTransferSchema, BulkTransferSchema } from './schemas/stockTransfer';
import { createValidatedAction } from '@/lib/validation/core/validator';

export const transferStock = createValidatedAction(
  StockTransferSchema,
  async (data) => {
    // 經過驗證的資料在此處是型別安全的
    const result = await db.stockTransfers.create({
      data: {
        pallet_number: data.palletNumber,
        from_location: data.fromLocation,
        to_location: data.toLocation,
        quantity: data.quantity,
        transferred_by: data.transferredBy,
        reason: data.reason,
        notes: data.notes,
      },
    });

    return { success: true, transferId: result.id };
  }
);

export const bulkTransferStock = createValidatedAction(
  BulkTransferSchema,
  async (data) => {
    const results = await db.$transaction(
      data.transfers.map(transfer =>
        db.stockTransfers.create({ data: transfer })
      )
    );

    return {
      success: true,
      transferred: results.length,
      batchId: data.batchId
    };
  }
);
```

### 第 2 週: 中低優先級 Actions

#### 待實施檔案

| 檔案 | 優先級 | 複雜度 | 現況 |
|------|----------|------------|---------------|
| `grnActions.ts` | 🟠 中 | 中 | 有 Zod schemas |
| `qcActions.ts` | 🟠 中 | 中 | 有 Zod schemas |
| `fileActions.ts` | 🟠 中 | 中 | 有部分 Zod schemas |
| `authActions.ts` | 🟠 中 | 低 | 部分功能，主要用 Supabase Auth |
| `acoOrderProgressActions.ts` | 🟡 低 | 低 | 無驗證 |
| `orderLoadingActions.ts` | 🟡 低 | 中 | 無驗證 |
| `storageActions.ts` | 🟡 低 | 低 | 無驗證 |
| `DownloadCentre-Actions.ts` | 🟡 低 | 高 | 無驗證 |
| `newReportActions.ts` | 🟡 低 | 中 | 無驗證 |

---

## 第二階段: API 路由 (第 3-4 週)

### 第 3 週: 關鍵 API 路由

#### 優先級矩陣

| 端點 | 風險等級 | 使用頻率 | 資料敏感度 |
|----------|------------|-----------------|------------------|
| `/api/print-label-pdf` | 🔴 高 | 高 | 高 |
| `/api/stock-count/*` | 🔴 高 | 高 | 高 |
| `/api/analyze-order-pdf-assistant` | 🔴 高 | 中 | 高 |
| `/api/warehouse/summary` | 🟠 中 | 高 | 中 |
| `/api/anomaly-detection` | 🟠 中 | 低 | 高 |

#### 實施模式

```typescript
// lib/validation/schemas/api/print-label.ts
import { z } from 'zod';
import { ProductCodeSchema, QuantitySchema } from '@/lib/validation/schemas/common/base';

export const PrintLabelRequestSchema = z.object({
  items: z.array(z.object({
    productCode: ProductCodeSchema,
    quantity: QuantitySchema,
    location: z.string().min(1),
    customText: z.string().max(50).optional(),
  })).min(1).max(100),
  format: z.enum(['pdf', 'zpl', 'epl']).default('pdf'),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  copies: z.number().int().min(1).max(10).default(1),
});

export type PrintLabelRequest = z.infer<typeof PrintLabelRequestSchema>;
```

```typescript
// app/api/print-label-pdf/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { PrintLabelRequestSchema } from '@/lib/validation/schemas/api/print-label';
import { ValidationError, formatValidationError } from '@/lib/validation/errors';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // 解析並驗證請求主體
    const body = await request.json();
    const validatedData = PrintLabelRequestSchema.parse(body);

    // 使用驗證後的資料生成 PDF
    const pdf = await generateLabelPDF(validatedData);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="labels.pdf"',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatValidationError(new ValidationError(error, 'print-label-pdf')),
        { status: 400 }
      );
    }

    console.error('列印標籤錯誤:', error);
    return NextResponse.json(
      { success: false, error: '生成標籤失敗' },
      { status: 500 }
    );
  }
}
```

### 第 4 週: 重要與標準 API 路由

#### 實施檢查清單

- [ ] `/api/v1/alerts/*` (6 個路由)
- [ ] `/api/v1/metrics/*` (3 個路由)
- [ ] `/api/v1/health/*` (2 個路由)
- [ ] `/api/monitoring/*` (2 個路由)
- [ ] `/api/send-order-email` (1 個路由)
- [ ] 其餘標準路由 (20 個路由)

---

## 第三階段: 後端服務 (第 5-6 週)

### 遷移策略

#### 重要遷移考量（基於實際資料庫）

1. **bigint 處理**：
   - Supabase 回傳的 bigint 可能是字串或數字
   - 需要在 Zod schemas 中處理轉換
   ```typescript
   const QuantitySchema = z.union([
     z.bigint(),
     z.number().int(),
     z.string().regex(/^\d+$/).transform(val => BigInt(val))
   ]);
   ```

2. **現有 schemas 整合**：
   - 利用 `/lib/schemas/shared.ts` 中的現有 schemas
   - 避免重複定義

3. **位置枚舉**：
   - 使用實際的倉庫位置列表
   - 從 `stockTransferActions.ts` 中提取

#### 方案一: 漸進式遷移 (建議)

```typescript
// backend/newpennine-api/src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: '驗證失敗',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      throw error;
    }
  }
}
```

```typescript
// ⚠️ 重要說明：系統使用 Supabase Auth，不需要 NestJS Auth 模組
// backend/newpennine-api/src/auth/* 為廢棄代碼，不應實施 Zod schemas

// 實際認證在前端處理：
// app/(auth)/main-login/utils/unified-auth.ts - 使用 Supabase Auth
// app/services/supabaseAuth.ts - 封裝 Supabase Auth 功能

// 🚨 重要說明：登入驗證不需要 Zod schemas
// 
// 原因：
// 1. Email 驗證：已有 EmailValidator component
//    - 位置：app/(auth)/main-login/components/EmailValidator.tsx
//    - 檢查 @pennineindustries.com domain
// 
// 2. Password 驗證：已在 useLogin hook 中實施
//    - 位置：app/hooks/useLogin.ts
//    - 檢查長度和字符類型
// 
// 3. 最終驗證：由 Supabase Auth 處理
//    - supabase.auth.signInWithPassword()
//    - supabase.auth.signUp()
// 
// 結論：前端已有完整驗證機制，不需要額外 Zod schemas
```

### 第 5 週: 核心後端模組

| 模組 | 檔案數 | 優先級 | 依賴 | 備註 |
|--------|-------|----------|--------------|-------|
| ~~Auth~~ | ~~8~~ | ~~🔴 嚴重~~ | ~~User, Session 結構~~ | **廢棄 - 使用 Supabase Auth** |
| Inventory | 6 | 🔴 嚴重 | Product, Location 結構 | GraphQL + REST |
| Orders | 6 | 🔴 嚴重 | Order, LineItem 結構 | GraphQL + REST |
| Transfers | 6 | 🟠 重要 | Transfer, Movement 結構 | GraphQL + REST |

### 第 6 週: 次要後端模組

| 模組 | 檔案數 | 優先級 | 依賴 |
|--------|-------|----------|--------------|
| Pallets | 4 | 🟠 重要 | Pallet 結構 |
| Products | 3 | 🟠 重要 | Product 結構 |
| Suppliers | 4 | 🟡 低 | Supplier 結構 |
| Reports | 5 | 🟡 低 | Report 結構 |
| 其他 | 42 | 🟡 低 | 各式各樣 |

---

## 第四階段: 測試與文件 (第 7 週)

### 測試策略

#### 結構的單元測試

```typescript
// lib/validation/schemas/__tests__/common/base.test.ts
import { describe, it, expect } from 'vitest';
import {
  PalletNumberSchema,
  ClockNumberSchema,
  QuantitySchema
} from '../../common/base';

describe('PalletNumberSchema', () => {
  it('應接受有效的棧板號', () => {
    const valid = ['123456/1', '999999/999', '000001/001'];
    valid.forEach(num => {
      expect(() => PalletNumberSchema.parse(num)).not.toThrow();
    });
  });

  it('應拒絕無效的棧板號', () => {
    const invalid = ['12345/1', '1234567/1', 'ABC123/1', '123456'];
    invalid.forEach(num => {
      expect(() => PalletNumberSchema.parse(num)).toThrow();
    });
  });
});

describe('ClockNumberSchema', () => {
  it('應將字串轉換為數字', () => {
    const result = ClockNumberSchema.parse('12345');
    expect(result).toBe(12345);
    expect(typeof result).toBe('number');
  });

  it('應拒絕非數字字串', () => {
    expect(() => ClockNumberSchema.parse('ABC')).toThrow();
    expect(() => ClockNumberSchema.parse('12.34')).toThrow();
  });
});
```

#### API 路由的整合測試

```typescript
// app/api/__tests__/stock-count/scan.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../../stock-count/scan/route';
import { NextRequest } from 'next/server';

describe('POST /api/stock-count/scan', () => {
  it('應接受有效的掃描資料', async () => {
    const validData = {
      barcode: 'ABC123',
      location: 'A1-01',
      quantity: 10,
      countedBy: '12345',
    };

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('應拒絕無效的數量', async () => {
    const invalidData = {
      barcode: 'ABC123',
      location: 'A1-01',
      quantity: -5, // 負數數量
      countedBy: '12345',
    };

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.details).toContainEqual(
      expect.objectContaining({
        field: 'quantity',
        message: expect.stringContaining('positive'),
      })
    );
  });
});
```

### 文件要求

#### API 文件

```typescript
/**
 * @api {post} /api/stock-count/scan 庫存盤點掃描
 * @apiName StockCountScan
 * @apiGroup StockCount
 * @apiVersion 1.0.0
 *
 * @apiParam {String} barcode 產品條碼
 * @apiParam {String} location 儲存位置
 * @apiParam {Number} quantity 盤點數量 (正整數)
 * @apiParam {String} countedBy 盤點人員工號 (數字字串)
 *
 * @apiSuccess {Boolean} success 操作成功狀態
 * @apiSuccess {Object} data 掃描結果資料
 * @apiSuccess {String} data.scanId 唯一掃描識別碼
 * @apiSuccess {String} data.timestamp 掃描時間戳
 *
 * @apiError ValidationError 輸入資料無效
 * @apiError {Boolean} success=false 操作失敗
 * @apiError {String} error 錯誤訊息
 * @apiError {Object[]} details 驗證錯誤詳情
 * @apiError {String} details.field 錯誤的欄位
 * @apiError {String} details.message 錯誤描述
 *
 * @apiExample {json} 請求範例:
 *     {
 *       "barcode": "ABC123",
 *       "location": "A1-01",
 *       "quantity": 10,
 *       "countedBy": "12345"
 *     }
 *
 * @apiExample {json} 成功回應範例:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "scanId": "123e4567-e89b-12d3-a456-426614174000",
 *         "timestamp": "2025-08-11T10:30:00Z"
 *       }
 *     }
 *
 * @apiExample {json} 錯誤回應範例:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "success": false,
 *       "error": "驗證失敗",
 *       "details": [
 *         {
 *           "field": "quantity",
 *           "message": "數量必須為正數"
 *         }
 *       ]
 *     }
 */
```

---

## 第五階段: 部署與監控 (第 8 週)

### 部署檢查清單

#### 部署前
- [ ] 所有單元測試通過 (>90% 覆蓋率)
- [ ] 所有整合測試通過
- [ ] 滿足性能基準 (<5% 影響)
- [ ] 完成安全稽核
- [ ] 完成程式碼審查
- [ ] 更新文件

#### 部署步驟
1.  **第一階段: 開發環境**
    -   部署至開發環境
    -   執行煙霧測試
    -   監控 24 小時
2.  **第二階段: 預備環境 (Staging)**
    -   部署至預備環境
    -   執行完整測試套件
    -   進行負載測試
    -   監控 48 小時
3.  **第三階段: 生產環境推出**
    -   使用功能旗標部署
    -   初始流量 10%
    -   監控錯誤率
    -   逐步推出至 100%

### 監控設定

```typescript
// lib/validation/monitoring/metrics.ts
import { Counter, Histogram, register } from 'prom-client';

// 驗證指標
export const validationCounter = new Counter({
  name: 'validation_total',
  help: '總驗證次數',
  labelNames: ['schema', 'result', 'context'],
});

export const validationDuration = new Histogram({
  name: 'validation_duration_seconds',
  help: '驗證持續時間 (秒)',
  labelNames: ['schema', 'context'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1],
});

// 追蹤驗證性能
export function trackValidation(
  schema: string,
  context: string,
  duration: number,
  success: boolean
) {
  validationCounter.inc({
    schema,
    context,
    result: success ? 'success' : 'failure',
  });

  validationDuration.observe(
    { schema, context },
    duration / 1000
  );
}
```

---

## 資源需求

### 人力資源

| 角色 | 分配 | 時長 | 職責 |
|------|------------|----------|------------------|
| 後端架構師 | 100% | 8 週 | 架構、實施、審查 |
| TypeScript 開發者 | 100% | 6 週 | 實施、測試 |
| QA 工程師 | 50% | 4 週 | 測試案例建立、驗證 |
| DevOps 工程師 | 25% | 2 週 | 部署、監控 |
| 技術文件撰寫員 | 25% | 2 週 | 文件撰寫 |

### 技術資源

- **開發環境**: 1 個專用實例
- **測試環境**: 1 個帶有測試資料庫的專用實例
- **預備環境**: 1 個類生產環境的實例
- **CI/CD 管線**: 額外的驗證步驟
- **監控**: Prometheus + Grafana 設定

### 預算估計

| 項目 | 成本 | 備註 |
|------|------|-------|
| 開發 (12 人週) | $60,000 | 2 位開發者 × 6 週 |
| 測試 (2 人週) | $8,000 | QA 工程師 × 4 週 @ 50% |
| 基礎設施 | $2,000 | 額外環境 |
| 工具與授權 | $500 | 測試工具 |
| **總計** | **$70,500** | 包含 10% 應急費用 |

---

## 風險評估

### 技術風險

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|------------|--------|------------|
| 破壞性變更 | 中 | 高 | 功能旗標、逐步推出 |
| 性能下降 | 低 | 中 | 性能測試、監控 |
| 整合問題 | 中 | 中 | 全面測試 |
| 學習曲線 | 低 | 低 | 培訓、文件 |

### 業務風險

| 風險 | 可能性 | 影響 | 緩解措施 |
|------|------------|--------|------------|
| 交付延遲 | 低 | 中 | 20% 時間緩衝、平行工作 |
| 功能回歸 | 低 | 高 | 自動化測試、回滾計畫 |
| 使用者干擾 | 低 | 中 | 分階段部署、溝通 |

### 緩解策略

1.  **功能旗標**: 每個端點可控制驗證的啟用
2.  **回滾計畫**: 5 分鐘內快速還原的能力
3.  **監控警報**: 即時錯誤率監控
4.  **備用邏輯**: 對驗證失敗進行優雅降級
5.  **溝通計畫**: 對任何問題通知使用者

---

## 成功指標

### 覆蓋率目標

| 元件 | 目前 | 第 4 週目標 | 第 8 週目標 |
|-----------|---------|---------------|---------------|
| Server Actions | 47.1% | 100% | 100% |
| API 路由 | 20.9% | 60% | 100% |
| 後端服務 | 3.5% | 20% | 80% |
| **總體** | **13.5%** | **50%** | **90%** |

### 品質指標

- **結構測試覆蓋率**: >90%
- **整合測試覆蓋率**: 關鍵路徑 100%
- **型別安全**: 驗證程式碼中 0 個 `any` 型別
- **文件覆蓋率**: 公開 API 100%

### 性能指標

- **驗證開銷**: <5ms 每次請求
- **記憶體影響**: <10MB 額外增加
- **錯誤率**: <0.1% 驗證失敗
- **回應時間**: 增長不超過 5%

### 業務指標

- **系統穩定性**: 維持 99.9% 正常運行時間
- **資料品質**: 資料錯誤減少 50%
- **開發者生產力**: 偵錯時間減少 30%
- **使用者滿意度**: 支援案件無增加

---

## 附錄

### A. 已存在的 Zod Schemas

目前已在程式碼庫中實施的 Zod schemas：

#### `/lib/validation/zod-schemas.ts` (主要驗證檔案)
- DataIdSchema (驗證 data_id 表結構)
- RecordPalletinfoSchema (驗證 record_palletinfo 表結構)
- RecordInventorySchema (驗證 record_inventory 表結構)
- RecordAcoSchema, RecordGrnSchema 等表結構驗證
- ProductCodeSchema, QuantitySchema, DateSchema 等基礎驗證
- 完整的驗證函數和類型守衛

#### `/lib/schemas/shared.ts`
- TimestampSchema
- ~~UuidSchema~~ (不需要 - UUID 由 Supabase 生成)  
- ProductCodeSchema
- PalletNumberSchema (`^\d{6}\/\d{1,3}$`)
- PaginationSchema
- TimeRangeSchema
- ApiResponseSchema
- ErrorResponseSchema
- DatabaseRecordSchema

#### `/app/actions/schemas.ts`
- clockNumberSchema
- passwordSchema

#### `/app/components/reports/schemas/ExcelGeneratorSchemas.ts`
- 完整的 Excel 報表生成 schemas
- ColumnConfigSchema
- SectionConfigSchema
- ReportConfigSchema

#### `/app/api/alerts/rules/route.ts`
- CreateAlertRuleSchema
- UpdateAlertRuleSchema
- QueryAlertRulesSchema

### B. 檔案清單

#### 需要驗證的 Server Actions
```
app/actions/stockTransferActions.ts
app/actions/orderUploadActions.ts
app/actions/productActions.ts
app/actions/dashboardActions.ts
app/actions/acoOrderProgressActions.ts
app/actions/orderLoadingActions.ts
app/actions/storageActions.ts
app/actions/DownloadCentre-Actions.ts
app/actions/newReportActions.ts
```

#### 關鍵 API 路由
```
app/api/print-label-pdf/route.tsx
app/api/stock-count/scan/route.ts
app/api/stock-count/process/route.ts
app/api/stock-count/validate/route.ts
app/api/stock-count/batch-process/route.ts
app/api/analyze-order-pdf-assistant/route.ts
app/api/warehouse/summary/route.ts
app/api/anomaly-detection/route.ts
app/api/send-order-email/route.ts
```

### B. 程式碼模板

可在 `/lib/validation/templates/` 中找到:
- `schema.template.ts` - 結構定義模板
- `action.template.ts` - Server action 模板
- `api.template.ts` - API 路由模板
- `test.template.ts` - 測試檔案模板

### C. 參考資料

- [Zod 文件](https://zod.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [NestJS 驗證](https://docs.nestjs.com/techniques/validation)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)

---

## 修訂歷史

| 版本 | 日期 | 作者 | 變更 |
|---------|------|--------|---------|
| 1.0.0 | 2025-08-11 | Claude Code | 初始規劃文件 |
| 1.1.0 | 2025-08-11 | Claude Code | 更新為實際資料庫結構，修正 bigint 與 integer 型別 |
| 1.2.0 | 2025-08-11 | Claude Code | 移除 NestJS Auth 模組（使用 Supabase Auth） |
| 1.3.0 | 2025-08-11 | Claude Code | 注明 UUID 無需驗證（由 Supabase gen_random_uuid() 生成） |
| 1.4.0 | 2025-08-11 | Claude Code | 移除登入 Zod schemas 建議（已有前端驗證 + Supabase Auth） |
| 1.5.0 | 2025-08-11 | Claude Code | 移除 Series 驗證 Schema（系統生成，非用戶輸入） |
| 1.6.0 | 2025-08-11 | Claude Code | 補充已存在的驗證機制（DataIdSchema、RecordPalletinfoSchema 等） |

---

## 核准

| 角色 | 姓名 | 簽名 | 日期 |
|------|------|-----------|------|
| 技術主管 | | | |
| 專案經理 | | | |
| QA 主管 | | | |
| 產品負責人 | | | |

---

*文件結束*