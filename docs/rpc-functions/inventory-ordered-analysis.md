# Inventory Ordered Analysis RPC Function

## Overview
The `rpc_get_inventory_ordered_analysis` function provides comprehensive analysis of inventory levels against outstanding orders, helping identify stock shortages, fulfillment rates, and inventory gaps.

## Function Signature
```sql
rpc_get_inventory_ordered_analysis(p_product_type text DEFAULT NULL) RETURNS jsonb
```

### Parameters
- `p_product_type` (optional): Filter results by product type. If NULL, returns all products.

## Return Structure
```json
{
  "success": true,
  "summary": {
    "total_products": number,
    "total_inventory_value": number,
    "total_outstanding_orders_value": number,
    "overall_fulfillment_rate": number,
    "products_sufficient": number,
    "products_insufficient": number,
    "products_out_of_stock": number,
    "products_no_orders": number
  },
  "data": [
    {
      "product_code": string,
      "product_description": string,
      "product_type": string,
      "standard_qty": number,
      "inventory": {
        "total": number,
        "locations": {
          "injection": number,
          "pipeline": number,
          "prebook": number,
          "await": number,
          "fold": number,
          "bulk": number,
          "backcarpark": number,
          "damage": number,
          "await_grn": number
        },
        "last_update": timestamp
      },
      "orders": {
        "total_orders": number,
        "total_ordered_qty": number,
        "total_loaded_qty": number,
        "total_outstanding_qty": number
      },
      "analysis": {
        "fulfillment_rate": number,
        "inventory_gap": number,
        "status": "Sufficient" | "Insufficient" | "Out of Stock" | "No Orders"
      }
    }
  ],
  "generated_at": timestamp
}
```

## Key Calculations

### Total Inventory
Sum of all location quantities:
```
total_inventory = injection + pipeline + prebook + await + fold + bulk + backcarpark + damage + await_grn
```

### Outstanding Orders
Orders where `loaded_qty` is NULL, empty, or less than `product_qty`:
```
outstanding_qty = product_qty - COALESCE(loaded_qty, 0)
```

### Fulfillment Rate
Percentage of outstanding orders that can be fulfilled:
```
fulfillment_rate = (total_inventory / total_outstanding_qty) * 100
```

### Inventory Gap
Difference between available inventory and outstanding orders:
```
inventory_gap = total_inventory - total_outstanding_qty
```
- Positive: Surplus inventory
- Negative: Shortage

### Status Classification
- **Out of Stock**: No inventory, but has outstanding orders
- **Insufficient**: Some inventory, but less than outstanding orders
- **Sufficient**: Inventory meets or exceeds outstanding orders
- **No Orders**: Has inventory but no outstanding orders

## Usage Examples

### Get all products analysis
```typescript
const { data, error } = await supabase
  .rpc('rpc_get_inventory_ordered_analysis')
```

### Filter by product type
```typescript
const { data, error } = await supabase
  .rpc('rpc_get_inventory_ordered_analysis', { 
    p_product_type: 'Type A' 
  })
```

## Use Cases

1. **Inventory Planning**: Identify products needing restocking
2. **Order Fulfillment**: Prioritize orders based on inventory availability
3. **Shortage Analysis**: Quickly identify products with insufficient stock
4. **Performance Metrics**: Track overall fulfillment rates and inventory efficiency

## Performance Considerations

- The function uses CTEs for efficient aggregation
- Indexes on `product_code` in all related tables improve performance
- Results are sorted by status priority (Out of Stock first) and inventory gap

## Related Tables
- `record_inventory`: Current inventory levels by location
- `data_order`: Customer orders and fulfillment status
- `data_code`: Product master data