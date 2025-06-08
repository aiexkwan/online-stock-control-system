# SQL / RPC Functions Library

This document serves as a unified record of all SQL/RPC functions in the WMS system for easy reference and maintenance.

## 🔥 Atomic Pallet Number Generation Functions

### generate_atomic_pallet_numbers_v2(count INTEGER)
- **Purpose**: Generate unique pallet numbers atomically to prevent race conditions
- **Parameters**: 
  - `count`: Number of pallet numbers to generate (max 50)
- **Returns**: TEXT[] - Array of pallet numbers in format DDMMYY/N
- **Location**: `scripts/fix-atomic-pallet-generation.sql`
- **Usage**: Replaces old `generatePalletNumbers` function to solve duplicate key issues
- **Dependencies**: `daily_pallet_sequence` table
- **Status**: ✅ Active - Currently used in QC/GRN/Auto-reprint

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

## 🔧 Legacy Functions (V1)

### generate_atomic_pallet_numbers(count INTEGER)
- **Purpose**: Original atomic pallet generation (V1)
- **Status**: ⚠️ Deprecated - Use V2 instead
- **Location**: `scripts/create-atomic-pallet-number-generator.sql`
- **Note**: Has table locking issues, replaced by V2

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

## 🔄 Recent Updates

- **2024-06-25**: Implemented atomic pallet number generation V2
- **2024-06-25**: Updated all pallet generation calls to use V2 functions
- **2024-06-25**: Enhanced error handling and performance monitoring 