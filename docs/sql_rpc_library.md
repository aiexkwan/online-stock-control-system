# SQL / RPC Functions Library

This document serves as a unified record of all SQL/RPC functions in the WMS system for easy reference and maintenance.

## 📦 Order Loading Functions (Atomic Transactions)

### rpc_load_pallet_to_order
- **Purpose**: Atomically load a pallet to an order with all related updates
- **Parameters**:
  - `p_order_ref`: Order reference number
  - `p_pallet_input`: Pallet number or series to load
  - `p_user_id`: User ID performing the action (default: 0)
  - `p_user_name`: User name (default: 'System')
- **Returns**: JSON with success status and details
- **Location**: `app/order-loading/sql/rpc_order_loading.sql`
- **Features**:
  - ✅ Atomic transaction - all updates succeed or all fail
  - ✅ Duplicate load prevention
  - ✅ Quantity validation
  - ✅ Updates: order quantity, history, stock level, inventory, pallet remarks
- **Usage**:
```sql
SELECT rpc_load_pallet_to_order('ORD123', '260125/1', 1001, 'John Doe');
```

### rpc_undo_load_pallet
- **Purpose**: Atomically undo a pallet loading operation
- **Parameters**:
  - `p_order_ref`: Order reference number
  - `p_pallet_num`: Pallet number to undo
  - `p_product_code`: Product code
  - `p_quantity`: Quantity to restore
  - `p_user_id`: User ID performing the action (default: 0)
  - `p_user_name`: User name (default: 'System')
- **Returns**: JSON with success status and details
- **Location**: `app/order-loading/sql/rpc_order_loading.sql`
- **Features**:
  - ✅ Atomic rollback of all loading operations
  - ✅ Restores stock levels and inventory
  - ✅ Resets pallet status for reloading
  - ✅ Deletes original load record
- **Usage**:
```sql
SELECT rpc_undo_load_pallet('ORD123', '260125/1', 'PROD001', 100, 1001, 'John Doe');
```

## 🔥 Atomic Pallet Number Generation Functions

### generate_atomic_pallet_numbers_v3(count INTEGER)
- **Purpose**: Generate unique pallet numbers atomically to prevent race conditions
- **Parameters**: 
  - `count`: Number of pallet numbers to generate (max 50)
- **Returns**: TEXT[] - Array of pallet numbers in format DDMMYY/N
- **Location**: `scripts/fix-atomic-pallet-generation.sql`
- **Usage**: Replaces old `generatePalletNumbers` function to solve duplicate key issues
- **Dependencies**: `daily_pallet_sequence` table
- **Status**: ✅ Active - Currently used in QC/GRN/Auto-reprint

**新增特性 (v3)**:
- 🔧 總是檢查實際的 record_palletinfo 表中的最大號碼
- 🔧 使用實際最大值與序列值中的較大者確保同步
- 🔧 同步更新序列表為正確的值
- 🔒 使用 INSERT ... ON CONFLICT 來原子性地更新序列
- 增強的錯誤處理和日誌記錄

**使用示例**:
```sql
SELECT * FROM generate_atomic_pallet_numbers_v3(5);
```

**函數實現**:
```sql
DECLARE
    current_date_str TEXT;
    result TEXT[] := ARRAY[]::TEXT[];
    i INTEGER;
    start_num INTEGER;
    existing_max INTEGER;
    sequence_max INTEGER;
BEGIN
    -- 檢查輸入參數
    IF count <= 0 THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    IF count > 50 THEN
        RAISE EXCEPTION 'Cannot generate more than 50 pallet numbers at once';
    END IF;
    
    -- 獲取當前日期字符串 (DDMMYY 格式)
    current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYY');
    
    -- 🔒 使用 INSERT ... ON CONFLICT 來原子性地更新序列
    INSERT INTO daily_pallet_sequence (date_str, current_max)
    VALUES (current_date_str, 0)
    ON CONFLICT (date_str) DO NOTHING;
    
    -- 🔧 總是檢查實際的 record_palletinfo 表中的最大號碼
    SELECT COALESCE(MAX(
        CASE 
            WHEN plt_num LIKE current_date_str || '/%' 
            THEN CAST(SPLIT_PART(plt_num, '/', 2) AS INTEGER)
            ELSE 0 
        END
    ), 0) INTO existing_max
    FROM record_palletinfo
    WHERE plt_num LIKE current_date_str || '/%';
    
    -- 獲取序列表中的當前值
    SELECT current_max INTO sequence_max
    FROM daily_pallet_sequence
    WHERE date_str = current_date_str;
    
    -- 🔧 使用實際最大值與序列值中的較大者
    start_num := GREATEST(existing_max, COALESCE(sequence_max, 0));
    
    -- 🔧 同步更新序列表為正確的值
    UPDATE daily_pallet_sequence 
    SET current_max = start_num + count,
        last_updated = NOW()
    WHERE date_str = current_date_str;
    
    -- 生成連續的棧板號碼
    FOR i IN 1..count LOOP
        result := array_append(result, current_date_str || '/' || (start_num + i));
    END LOOP;
    
    -- 記錄生成日誌
    RAISE NOTICE 'Generated % pallet numbers for date % (actual_max: %, sequence_max: %): % to %', 
        count, current_date_str, existing_max, sequence_max, start_num + 1, start_num + count;
    
    RETURN result;
END;
```

### daily_pallet_sequence Table
- **Purpose**: Sequence management table for atomic pallet number generation
- **Columns**:
  - `date_str`: TEXT PRIMARY KEY (DDMMYY format)
  - `current_max`: INTEGER NOT NULL DEFAULT 0
  - `last_updated`: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- **Location**: `scripts/fix-atomic-pallet-generation.sql`

### cleanup_old_pallet_sequences()
- **Purpose**: Clean up old sequence records (older than 7 days)
- **Returns**: INTEGER - Number of deleted records
- **Schedule**: Should be run periodically
- **Location**: `scripts/fix-atomic-pallet-generation.sql`

### monitor_pallet_generation_performance_v2()
- **Purpose**: Monitor pallet generation performance and statistics
- **Returns**: TABLE with current date, total pallets, max sequence, etc.
- **Location**: `scripts/fix-atomic-pallet-generation.sql`

### test_atomic_pallet_generation_v2()
- **Purpose**: Test function for atomic pallet generation
- **Returns**: TABLE with test results
- **Location**: `scripts/fix-atomic-pallet-generation.sql`

---

## 🏷️ GRN Label Enhancement Functions

### update_grn_level(p_grn_ref TEXT, p_label_mode TEXT, p_gross_weight NUMERIC, p_net_weight NUMERIC, p_quantity INTEGER)
- **Purpose**: Update or insert grn_level records for GRN operations
- **Parameters**:
  - `p_grn_ref`: GRN reference number
  - `p_label_mode`: 'weight' or 'qty'
  - `p_gross_weight`: Gross weight (for weight mode)
  - `p_net_weight`: Net weight (for weight mode)
  - `p_quantity`: Quantity (for qty mode)
- **Returns**: TEXT - Operation result message
- **Location**: `scripts/grn-label-enhancement-rpc.sql`

### update_work_level_grn(p_user_id INTEGER, p_grn_count INTEGER)
- **Purpose**: Update or insert work_level records for GRN work tracking
- **Parameters**:
  - `p_user_id`: User ID
  - `p_grn_count`: Number of GRN operations (default 1)
- **Returns**: TEXT - Operation result message
- **Location**: `scripts/grn-label-enhancement-rpc.sql`

### update_stock_level_grn(p_product_code TEXT, p_quantity BIGINT, p_description TEXT)
- **Purpose**: Update or insert stock_level records for GRN operations
- **Parameters**:
  - `p_product_code`: Product code
  - `p_quantity`: Quantity to add to stock
  - `p_description`: Product description (optional)
- **Returns**: TEXT - Operation result message
- **Location**: `scripts/grn-label-enhancement-rpc.sql`

### update_grn_workflow(...)
- **Purpose**: Combined function to update grn_level, work_level, and stock_level simultaneously
- **Returns**: JSONB - Combined operation results
- **Location**: `scripts/grn-label-enhancement-rpc.sql`

### update_work_level_move(p_user_id INTEGER, p_move_count INTEGER)
- **Purpose**: Update work_level records for stock transfer operations
- **Parameters**:
  - `p_user_id`: User ID
  - `p_move_count`: Number of move operations (default 1)
- **Returns**: TEXT - Operation result message
- **Location**: `scripts/grn-label-enhancement-rpc.sql`

---

## 📦 ACO Order Enhancement Functions

### update_aco_order_with_completion_check(p_order_ref INTEGER, p_product_code TEXT, p_quantity_used INTEGER)
- **Purpose**: Update ACO order remain_qty and check completion status
- **Parameters**:
  - `p_order_ref`: ACO order reference number
  - `p_product_code`: Product code
  - `p_quantity_used`: Quantity used from the order
- **Returns**: JSON - Update results and completion status
- **Location**: `scripts/aco-order-enhancement-rpc.sql`

### check_aco_order_completion(p_order_ref INTEGER)
- **Purpose**: Check if an ACO order is completed
- **Parameters**:
  - `p_order_ref`: ACO order reference number
- **Returns**: JSON - Order completion status and details
- **Location**: `scripts/aco-order-enhancement-rpc.sql`

### get_completed_aco_orders()
- **Purpose**: Get list of all completed ACO orders
- **Returns**: TABLE with order_ref, completion_date, total_products
- **Location**: `scripts/aco-order-enhancement-rpc.sql`

---

## 🖨️ Print Label Enhancement Functions

### update_stock_level(p_product_code TEXT, p_quantity BIGINT, p_description TEXT)
- **Purpose**: Update or insert stock_level records for print operations
- **Parameters**:
  - `p_product_code`: Product code
  - `p_quantity`: Quantity to add to stock
  - `p_description`: Product description (optional)
- **Returns**: BOOLEAN - Success status
- **Location**: `scripts/print-label-enhancement-rpc.sql`

### update_work_level_qc(p_user_id INTEGER, p_pallet_count INTEGER)
- **Purpose**: Update work_level records for QC operations
- **Parameters**:
  - `p_user_id`: User ID
  - `p_pallet_count`: Number of pallets processed (default 1)
- **Returns**: BOOLEAN - Success status
- **Location**: `scripts/print-label-enhancement-rpc.sql`

### handle_print_label_updates(p_product_code TEXT, p_quantity BIGINT, p_user_id INTEGER, p_pallet_count INTEGER, p_description TEXT)
- **Purpose**: Combined function for all print label updates
- **Returns**: JSON - Combined operation results
- **Location**: `scripts/print-label-enhancement-rpc.sql`

---

## 🗑️ Void Pallet Functions

### update_stock_level_void(p_product_code TEXT, p_quantity BIGINT, p_operation TEXT)
- **Purpose**: Update stock_level for void operations (decrease stock)
- **Parameters**:
  - `p_product_code`: Product code
  - `p_quantity`: Quantity to void
  - `p_operation`: Operation type ('void', 'damage', 'auto_reprint')
- **Returns**: TEXT - Operation result message
- **Location**: `scripts/void-pallet-stock-level-rpc.sql`

### process_void_pallet_inventory(...)
- **Purpose**: Combined function for void pallet inventory and stock level updates
- **Returns**: JSONB - Combined operation results
- **Location**: `scripts/void-pallet-stock-level-rpc.sql`

---

## 🔍 Query Execution Functions

### execute_sql_query(query_text TEXT)
- **Purpose**: Execute SQL queries (SELECT only) for Ask Me Anything feature
- **Parameters**:
  - `query_text`: SQL query string (must be SELECT)
- **Returns**: TABLE(result JSONB) - Query results in JSON format
- **Security**: Restricted to SELECT statements only, prevents SQL injection
- **Location**: `scripts/create-sql-query-rpc.sql`

---

## 📊 Inventory Management Functions

### get_top_products_by_inventory(limit_count INTEGER)
- **Purpose**: Get top products by total inventory quantity
- **Parameters**:
  - `limit_count`: Number of products to return (default 5, max 50)
- **Returns**: TABLE with product details and inventory quantities
- **Location**: `scripts/create-inventory-ranking-rpc.sql`

### get_products_below_inventory_threshold(threshold_value BIGINT)
- **Purpose**: Get products with inventory below specified threshold
- **Parameters**:
  - `threshold_value`: Inventory threshold value
- **Returns**: TABLE with products below threshold
- **Location**: `scripts/create-inventory-threshold-rpc.sql`

---

---

## 🛠️ Utility Functions

### update_product_details(...)
- **Purpose**: Update product details
- **Location**: `scripts/update-product-details-rpc.sql`

### Various cleanup and maintenance functions
- **Location**: Multiple files in `scripts/` directory

---

## 📋 Function Categories Summary

| Category | Functions | Primary Use |
|----------|-----------|-------------|
| **Pallet Generation** | 5 functions | Atomic pallet number generation |
| **GRN Operations** | 5 functions | GRN label printing workflow |
| **ACO Orders** | 3 functions | ACO order management |
| **Print Labels** | 3 functions | QC label printing workflow |
| **Void Operations** | 2 functions | Pallet voiding and inventory |
| **Query System** | 1 function | Ask Me Anything feature |
| **Inventory** | 2 functions | Inventory analysis and reporting |

---

## 🔒 Security & Permissions

- All functions use `SECURITY DEFINER` for controlled execution
- Functions are granted to `authenticated` role
- Query execution function has strict SQL injection prevention
- Input validation implemented in all critical functions

---

## 📈 Performance Considerations

- Atomic operations prevent race conditions
- Proper indexing on sequence tables
- Efficient queries for large datasets
- Regular cleanup of old records

---

## 🧹 Maintenance Tasks

### Daily
- Monitor atomic pallet generation performance
- Check for any failed operations in logs

### Weekly
- Run `cleanup_old_pallet_sequences()` to clean old sequence records
- Review function performance metrics

### Monthly
- Update documentation when functions are modified
- Test functions after any database schema changes
- Review and optimize slow-performing functions

---

## 📝 Notes

- All functions follow PostgreSQL best practices
- Error handling is implemented for all critical operations
- Functions are designed for high concurrency environments
- Regular testing ensures reliability in production

---

## 📊 Stock Take Functions

### validate_stocktake_count(p_product_code TEXT, p_counted_qty BIGINT)
- **Purpose**: Validate stock count quantity against defined rules
- **Parameters**:
  - `p_product_code`: Product code
  - `p_counted_qty`: Counted quantity
- **Returns**: JSONB - Validation result with warnings/errors
- **Features**:
  - Checks against validation rules in stocktake_validation_rules table
  - Calculates variance percentage
  - Returns detailed warnings and errors
- **Location**: Stock take SQL queries
- **Status**: ✅ Active - Used in cycle count validation

### process_batch_scan(p_batch_id UUID, p_scans JSONB)
- **Purpose**: Process multiple stock count scans in batch
- **Parameters**:
  - `p_batch_id`: Batch session ID
  - `p_scans`: Array of scan records in JSONB format
- **Returns**: JSONB - Processing results with success/error counts
- **Features**:
  - Batch processing for improved performance
  - Individual error handling for each scan
  - Transaction safety
- **Location**: Stock take SQL queries
- **Status**: ✅ Active - Used in batch mode scanning

### refresh_stocktake_reports()
- **Purpose**: Refresh materialized views for stock take reports
- **Returns**: void
- **Features**:
  - Updates mv_stocktake_variance_report
  - Improves report query performance
  - Should be run after major count sessions
- **Location**: Stock take SQL queries
- **Status**: ✅ Active - Used for report optimization

---



## 🔄 Recent Updates

- **2025-01-11**: Added stock take enhancement functions (validation, batch processing, reporting)
- **2024-06-25**: Implemented atomic pallet number generation V2
- **2024-06-25**: Updated all pallet generation calls to use V2 functions
- **2024-06-25**: Enhanced error handling and performance monitoring 