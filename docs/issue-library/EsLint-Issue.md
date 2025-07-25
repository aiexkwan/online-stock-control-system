# ESLint Issue Library

記錄並整理常見的 ESLint 錯誤及其解決方案。

## 目錄
- [TypeScript 類型相關](#typescript-類型相關)
- [React 無障礙性相關](#react-無障礙性相關)

---

## TypeScript 類型相關

### @typescript-eslint/no-explicit-any

**問題描述**: 使用了 `any` 類型，失去了 TypeScript 的類型安全性

**常見場景及解決方案**:

#### 1. 動態對象屬性
```typescript
// ❌ 錯誤
const obj = { 
  field1: value1,
  field2: value2 
} as any;
obj[dynamicKey] = value;

// ✅ 正確 - 使用 Partial<Record<T, V>>
type MyRecord = {
  field1: string;
  field2: number;
} & Partial<Record<string, unknown>>;

const obj: MyRecord = {
  field1: value1,
  field2: value2
};
```

#### 2. 庫存更新對象（inventory update）
```typescript
// ❌ 錯誤
const inventoryUpdate = {
  product_code: productCode,
  latest_update: new Date().toISOString(),
  plt_num: palletNum,
} as any;

// ✅ 正確 - 定義類型
import { DatabaseLocationColumn } from '@/lib/inventory/utils/locationMapper';

type InventoryUpdateRecord = {
  product_code: string;
  latest_update: string;
  plt_num: string;
  damage?: number;
} & Partial<Record<DatabaseLocationColumn, number>>;

const inventoryUpdate: InventoryUpdateRecord = {
  product_code: productCode,
  latest_update: new Date().toISOString(),
  plt_num: palletNum,
};
```

#### 3. Supabase Client 狀態
```typescript
// ❌ 錯誤
const [supabase, setSupabase] = useState<any>(null);

// ✅ 正確
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database/supabase';

const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
```

#### 4. 類型斷言優化
```typescript
// ❌ 錯誤 - 不必要的 any 轉換
condition: (isValidCondition(value) ? value : 'default') as any as ConditionType

// ✅ 正確 - 類型守衛已確保安全
condition: (isValidCondition(value) ? value : 'default') as ConditionType
```

---

## React 無障礙性相關

### jsx-a11y/alt-text

**問題描述**: Image 元素缺少 alt 屬性，影響無障礙性

**解決方案**:

```tsx
// ❌ 錯誤
<Image src={logoUrl} style={styles} />

// ✅ 正確 - 有意義的圖片
<Image src={logoUrl} alt="Company logo" style={styles} />

// ✅ 正確 - 裝飾性圖片
<Image src={decorativeUrl} alt="" style={styles} />

// ✅ 正確 - 功能性圖片
<Image src={qrCodeUrl} alt="QR code for product" style={styles} />
```

**最佳實踐**:
- 為所有圖片添加 alt 屬性
- 有意義的圖片使用描述性文字
- 純裝飾性圖片使用空字符串 `alt=""`
- 避免使用 "image" 或 "picture" 等冗餘詞彙

---

## 修復記錄

### 2025-07-25 修復

**修復文件列表**:
1. `/app/(app)/void-pallet/services/inventoryService.ts` - 替換 any 為 InventoryUpdateRecord 類型
2. `/app/hooks/useStockTransfer.ts` - 添加動態對象類型定義
3. `/components/print-label-pdf/PrintLabelPdf.tsx` - 添加圖片 alt 屬性
4. `/components/ui/dynamic-action-bar/index.tsx` - 使用 SupabaseClient<Database> 類型
5. `/lib/alerts/services/AlertMonitoringService.ts` - 移除不必要的 any 轉換

**修復策略**:
- 優先使用類型定義而非 disable
- 使用 TypeScript 的 Record 和 Partial 處理動態屬性
- 確保所有圖片元素都有適當的 alt 屬性

---

## 預防措施

1. **開發時啟用 ESLint**: 在 VSCode 中安裝 ESLint 插件，實時查看錯誤
2. **提交前檢查**: 運行 `npm run lint` 確保無錯誤
3. **類型優先**: 盡量定義明確的類型，避免使用 any
4. **無障礙性考慮**: 開發 UI 組件時始終考慮無障礙性需求

---

更新日期: 2025-07-25