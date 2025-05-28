# Product Update 系統文檔

## 概述

Product Update 系統提供完整的產品代碼管理功能，包括搜尋、更新和新增產品。系統支援大小寫不敏感搜尋，確保用戶可以使用任何大小寫組合來查找產品。所有操作都會自動記錄到系統歷史中。

## 功能特性

### ✅ 核心功能
- **智能搜尋**: 支援精確匹配和大小寫不敏感搜尋
- **產品更新**: 修改現有產品的描述、顏色、標準數量等信息
- **產品新增**: 創建新的產品代碼和相關信息
- **數據驗證**: 自動檢查產品代碼是否存在，防止重複創建
- **操作歷史**: 自動記錄所有產品更新和新增操作到 record_history 表

### 🔍 搜尋功能
- **精確匹配**: 優先使用精確匹配提高性能
- **模糊匹配**: 如果精確匹配失敗，自動使用大小寫不敏感搜尋
- **支援格式**: 
  - `MEP9090150` (原始大寫)
  - `mep9090150` (全小寫)
  - `Mep9090150` (混合大小寫)
  - 任何大小寫組合

### 📝 歷史記錄功能
- **自動記錄**: 每次產品更新或新增都會自動記錄到 record_history 表
- **操作類型**: 
  - `Product Update` - 產品更新操作
  - `Product Added` - 產品新增操作
- **記錄格式**: 
  - **action**: `Product Update` 或 `Product Added`
  - **remark**: `{產品代碼}, By {用戶名}`
  - **id**: `null` (id 是 data_id 的外鍵，產品操作時留空)
  - **time**: 操作時間戳
- **用戶識別**: 自動從當前登入用戶的 email 中提取用戶名

## 技術架構

### 資料庫表結構
```sql
-- data_code 表結構
CREATE TABLE public.data_code (
  code text PRIMARY KEY,           -- 產品代碼
  description text,                -- 產品描述
  colour text,                     -- 顏色
  standard_qty integer,            -- 標準數量
  type text                        -- 類型
);
```

### 認證要求
- 使用 Supabase 服務端認證
- 需要 `authenticated` 角色權限
- RLS (Row Level Security) 政策保護數據安全

### 核心函數

#### 0. recordProductHistory(action, productCode, userEmail?)
**歷史記錄函數，自動記錄產品操作**

```typescript
async function recordProductHistory(
  action: 'Product Update' | 'Product Added',
  productCode: string,
  userEmail?: string
): Promise<void>
```

**功能說明**:
- 自動獲取當前登入用戶信息
- 從 email 中提取用戶名 (去掉 @pennineindustries.com 部分)
- 構建 remark 格式: `{產品代碼}, By {用戶名}`
- 插入記錄到 record_history 表
- id 欄位設為 null (因為是 data_id 的外鍵)
- 錯誤不會影響主要操作 (使用 try-catch 保護)

**記錄示例**:
```typescript
// 用戶: akwan@pennineindustries.com
// 產品: MEP9090150
// 結果 remark: "MEP9090150, By akwan"
// id: null
```

#### 1. getProductByCode(code: string)
**智能搜尋函數，支援大小寫不敏感**

```typescript
// 第一步：精確匹配
const exactMatch = await supabase
  .from('data_code')
  .select('*')
  .eq('code', code.trim())
  .limit(1);

// 第二步：如果精確匹配失敗，使用模糊匹配
if (!exactMatch.data?.length) {
  const fuzzyMatch = await supabase
    .from('data_code')
    .select('*')
    .ilike('code', code.trim())
    .limit(1);
}
```

**返回格式**:
```typescript
{
  success: boolean;
  data?: {
    code: string;
    description: string;
    colour: string;
    standard_qty: number;
    type: string;
  };
  error?: string;
}
```

#### 2. updateProduct(code: string, productData: Partial<ProductData>)
**更新現有產品信息**

```typescript
// 使用大小寫不敏感搜尋找到實際產品代碼
const matches = await supabase
      .from('data_code')
  .select('code')
  .ilike('code', code.trim());

// 使用實際代碼進行精確更新
const result = await supabase
      .from('data_code')
  .update(updateData)
  .eq('code', actualCode)
  .select();
```

#### 3. createProduct(productData: ProductData)
**創建新產品**

```typescript
const result = await supabase
      .from('data_code')
      .insert(productData)
      .select()
      .single();
```

#### 4. checkProductExists(code: string)
**檢查產品是否存在**

```typescript
const result = await supabase
  .from('data_code')
  .select('code')
  .ilike('code', code.trim());

return { exists: result.data?.length > 0 };
```

## 使用方式

### 前端整合

#### 搜尋產品
```typescript
import { getProductByCode } from '@/app/actions/productActions';

const handleSearch = async (code: string) => {
  const result = await getProductByCode(code);
  
  if (result.success) {
    console.log('找到產品:', result.data);
    // 顯示產品信息
  } else {
    console.log('產品未找到:', result.error);
    // 顯示錯誤或建議創建新產品
  }
};
```

#### 更新產品
```typescript
import { updateProduct } from '@/app/actions/productActions';

const handleUpdate = async (code: string, updates: Partial<ProductData>) => {
  const result = await updateProduct(code, updates);

  if (result.success) {
    console.log('更新成功:', result.data);
    // ✅ 歷史記錄已自動添加到 record_history 表
    // action: "Product Update"
    // remark: "{產品代碼}, By {用戶名}"
  } else {
    console.log('更新失敗:', result.error);
  }
};
```

#### 創建產品
```typescript
import { createProduct } from '@/app/actions/productActions';

const handleCreate = async (productData: ProductData) => {
  const result = await createProduct(productData);
  
  if (result.success) {
    console.log('創建成功:', result.data);
    // ✅ 歷史記錄已自動添加到 record_history 表
    // action: "Product Added"
    // remark: "{產品代碼}, By {用戶名}"
  } else {
    console.log('創建失敗:', result.error);
  }
};
```

### 歷史記錄查詢

可以通過查詢 record_history 表來查看產品操作歷史：

```sql
-- 查看特定產品的操作歷史
SELECT time, action, remark 
FROM record_history 
WHERE action IN ('Product Update', 'Product Added')
  AND remark LIKE 'MEP9090150%'
ORDER BY time DESC;

-- 查看特定用戶的產品操作 (通過 remark 中的用戶名)
SELECT time, action, remark 
FROM record_history 
WHERE action IN ('Product Update', 'Product Added')
  AND remark LIKE '%, By akwan'
ORDER BY time DESC;

-- 查看所有產品操作歷史
SELECT time, action, remark 
FROM record_history 
WHERE action IN ('Product Update', 'Product Added')
ORDER BY time DESC
LIMIT 50;
```

## 錯誤處理

### 常見錯誤類型
- `Product not found`: 產品代碼不存在
- `Product code already exists`: 嘗試創建重複的產品代碼
- `Update failed: No rows affected`: 更新操作沒有影響任何行
- `Auth session missing!`: 認證會話缺失

### 錯誤處理最佳實踐
```typescript
const result = await getProductByCode(code);

if (!result.success) {
  switch (result.error) {
    case 'Product not found':
      // 提示用戶產品不存在，詢問是否創建
      break;
    case 'Auth session missing!':
      // 重定向到登入頁面
      break;
    default:
      // 顯示通用錯誤信息
      console.error('操作失敗:', result.error);
  }
}
```

## 性能優化

### 搜尋策略
1. **優先精確匹配**: 大部分情況下用戶輸入正確的大小寫
2. **智能降級**: 只有在精確匹配失敗時才使用模糊匹配
3. **限制結果**: 使用 `limit(1)` 減少數據傳輸

### 資料庫優化
```sql
-- 建議在 code 欄位上創建索引
CREATE INDEX idx_data_code_code ON public.data_code (code);

-- 對於大小寫不敏感搜尋，可以考慮創建函數索引
CREATE INDEX idx_data_code_code_lower ON public.data_code (LOWER(code));
```

## 安全考慮

### RLS 政策
確保 `data_code` 表有適當的 RLS 政策：

```sql
-- 允許認證用戶讀取
CREATE POLICY "Allow authenticated users to read data_code" 
ON public.data_code 
FOR SELECT 
TO authenticated 
USING (true);

-- 允許認證用戶更新
CREATE POLICY "Allow authenticated users to update data_code" 
ON public.data_code 
FOR UPDATE 
TO authenticated 
USING (true);

-- 允許認證用戶插入
CREATE POLICY "Allow authenticated users to insert data_code" 
ON public.data_code 
FOR INSERT 
TO authenticated 
WITH CHECK (true);
```

### 輸入驗證
- 所有輸入都會使用 `trim()` 去除空白字符
- 產品代碼不能為空
- 數值字段會進行類型轉換和驗證

## 部署配置

### 環境變數
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 配置
1. 確保 RLS 已啟用
2. 創建必要的政策
3. 設置適當的角色權限
4. 配置認證提供者

## 故障排除

### 常見問題

#### 1. 搜尋返回空結果
**症狀**: 明明存在的產品代碼搜尋不到
**原因**: RLS 政策缺失或認證問題
**解決**: 檢查 RLS 政策和用戶認證狀態

#### 2. 更新失敗
**症狀**: 更新操作返回 "No rows affected"
**原因**: 產品代碼不存在或權限不足
**解決**: 先使用 `checkProductExists` 確認產品存在

#### 3. 認證錯誤
**症狀**: "Auth session missing!" 錯誤
**原因**: 服務端無法獲取用戶認證信息
**解決**: 確保使用正確的 Supabase 服務端客戶端

### 調試工具

#### 檢查認證狀態
```typescript
const supabase = createClient();
const { data: user } = await supabase.auth.getUser();
console.log('當前用戶:', user);
```

#### 檢查 RLS 政策
```sql
-- 查看表的 RLS 狀態
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'data_code';

-- 查看現有政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'data_code';
```

## 更新歷史

### v2.1.0 (最新)
- ✅ 新增操作歷史記錄功能
- ✅ 自動記錄產品更新和新增操作到 record_history 表
- ✅ 智能用戶識別 (從 email 提取用戶名)
- ✅ 標準化 remark 格式: `{產品代碼}, By {用戶名}`
- ✅ 錯誤保護機制 (歷史記錄失敗不影響主要操作)
- ✅ 完整的歷史查詢 SQL 示例

### v2.0.0
- ✅ 實現智能搜尋 (精確 + 模糊匹配)
- ✅ 支援大小寫不敏感搜尋
- ✅ 修復服務端認證問題
- ✅ 優化性能和錯誤處理
- ✅ 移除調試日誌減少開支

### v1.0.0 (初始版本)
- ✅ 基本搜尋功能
- ✅ 產品更新和創建
- ✅ RLS 安全保護

## 相關文件
- `app/actions/productActions.ts` - 核心業務邏輯
- `app/productUpdate/page.tsx` - 前端界面
- `app/utils/supabase/server.ts` - 服務端 Supabase 客戶端
- `middleware.ts` - 認證中間件

## 支援
如有問題或需要協助，請參考：
1. 本文檔的故障排除部分
2. Supabase 官方文檔
3. Next.js 服務端 Actions 文檔
