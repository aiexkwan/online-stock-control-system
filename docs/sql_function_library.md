# SQL 函數庫

本文檔記錄了項目中使用的自定義 PostgreSQL 函數。

## `get_product_details_by_code`

*   **用途描述:** 根據產品代碼從 `data_code` 表中檢索產品的詳細信息。
*   **參數:**
    *   `p_code` (TEXT): 要查詢的產品代碼。查詢時不區分大小寫。
*   **返回類型:** TABLE (`code` TEXT, `description` TEXT, `standard_qty` TEXT, `type` TEXT)
*   **返回結構:** 返回一個包含單行記錄的表，其中包含匹配產品的 `code`, `description`, `standard_qty`, 和 `type`。如果未找到匹配項，則返回空表。
*   **SQL 定義:**
    ```sql
    CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
    RETURNS TABLE (
      code TEXT,
      description TEXT,
      standard_qty TEXT,
      type TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        dc.code,
        dc.description,
        dc.standard_qty,
        dc.type
      FROM
        data_code dc
      WHERE
        dc.code ILIKE p_code;
    END;
    $$;
    ```

---
*(未來可以添加更多函數...)* 