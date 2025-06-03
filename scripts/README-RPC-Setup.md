# 設置 Supabase RPC 函數以解決 Ask Database 複雜查詢問題

## 🎯 問題背景

NewPennine Ask Database 功能在處理複雜的 AND+OR 條件查詢時，Supabase 查詢構建器出現邏輯錯誤：

- **問題案例**：「今天排除GRN的托盤」
- **預期結果**：14個（28個總托盤 - 14個GRN托盤）
- **實際結果**：107個（不合理，> 28）

根本原因：查詢構建器在組合日期條件和 OR 條件時，日期過濾失效。

## 🚀 解決方案：RPC 函數

通過創建 PostgreSQL RPC 函數，我們可以：
1. 繞過查詢構建器的限制
2. 直接執行原生 SQL
3. 確保複雜條件的正確邏輯

## 📋 設置步驟

### 1. 登入 Supabase Dashboard

訪問：[https://app.supabase.com/project/bbmkuiplnzvpudszrend](https://app.supabase.com/project/bbmkuiplnzvpudszrend)

### 2. 前往 SQL Editor

在左側導航欄中點擊 **SQL Editor**

### 3. 執行設置腳本

複製 `scripts/setup-rpc-functions.sql` 中的所有 SQL 代碼並執行：

```sql
-- 1. 通用查詢執行函數
CREATE OR REPLACE FUNCTION execute_query(query_text TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- [完整的函數代碼見 setup-rpc-functions.sql]
$$;

-- 2. 專用計數查詢函數
CREATE OR REPLACE FUNCTION execute_count_query(table_name TEXT, where_conditions TEXT DEFAULT '')
-- [完整的函數代碼見 setup-rpc-functions.sql]

-- 3. GRN 重量統計函數
CREATE OR REPLACE FUNCTION get_grn_weight_stats(date_filter TEXT DEFAULT '')
-- [完整的函數代碼見 setup-rpc-functions.sql]

-- 4. 產品統計函數
CREATE OR REPLACE FUNCTION get_product_stats(product_code_param TEXT)
-- [完整的函數代碼見 setup-rpc-functions.sql]

-- 5. 複雜條件托盤查詢函數
CREATE OR REPLACE FUNCTION get_pallet_count_complex(
    date_condition TEXT DEFAULT '',
    grn_condition TEXT DEFAULT '',
    product_condition TEXT DEFAULT ''
)
-- [完整的函數代碼見 setup-rpc-functions.sql]
```

### 4. 授予權限

確保包含權限授予語句：

```sql
GRANT EXECUTE ON FUNCTION execute_query(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_count_query(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grn_weight_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pallet_count_complex(TEXT, TEXT, TEXT) TO authenticated;
```

## 🧪 驗證設置

### 使用測試腳本

```bash
node test-rpc-simple.js
```

**成功的輸出應該包含**：
- ✅ 基本連接成功
- ✅ get_pallet_count_complex 工作正常
- ✅ 今天排除GRN托盤: [正確數字]
- ✅ 今天GRN托盤: [正確數字]

### 手動驗證（在 SQL Editor 中）

```sql
-- 測試複雜條件函數
SELECT * FROM get_pallet_count_complex(
    'DATE(generate_time) = CURRENT_DATE',
    '(plt_remark IS NULL OR plt_remark NOT LIKE ''%Material GRN%'')',
    ''
);
```

## 🎉 設置完成後的效果

1. **Ask Database API 自動使用 RPC**：
   - 優先嘗試專用 RPC 函數
   - 回退到通用 RPC 執行
   - 最後才使用查詢構建器

2. **查詢準確性提升**：
   - 複雜條件邏輯正確
   - 數學邏輯一致
   - 性能更好

3. **測試結果修復**：
   - 今天總托盤：28個 ✅
   - 今天排除GRN：14個 ✅
   - 今天GRN：14個 ✅
   - 數學檢查：28 = 14 + 14 ✅

## 🔧 故障排除

### RPC 函數創建失敗
- 檢查是否有 `CREATE FUNCTION` 權限
- 確保使用 Service Role 或 Owner 角色
- 檢查 SQL 語法錯誤

### 權限問題
- 確保執行了 `GRANT EXECUTE` 語句
- 檢查 RLS (Row Level Security) 設置
- 驗證用戶角色權限

### 連接問題
- 檢查 Supabase 項目狀態
- 驗證網絡連接
- 確認 API 密鑰正確

## 📞 支援

如遇到問題，請：
1. 運行 `node test-rpc-simple.js` 獲取詳細錯誤信息
2. 檢查 Supabase Dashboard 的 Logs 頁面
3. 確認所有 SQL 語句都已成功執行

設置完成後，Ask Database 功能將能正確處理所有複雜查詢！ 