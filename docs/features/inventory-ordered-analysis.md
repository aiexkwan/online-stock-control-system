# Inventory Ordered Analysis

## Overview

The Inventory Ordered Analysis feature provides real-time analysis of inventory levels against order demands. It helps warehouse managers quickly identify products with insufficient stock to fulfill pending orders.

## Database Function

### `rpc_get_inventory_ordered_analysis`

A PostgreSQL RPC function that analyzes inventory levels versus order demands.

#### Parameters

- `p_product_codes` (text[] DEFAULT NULL) - Optional array of product codes to filter
- `p_product_type` (text DEFAULT NULL) - Optional product type filter

#### Returns

```json
{
  "products": [
    {
      "product_code": "APBK3M",
      "product_description": "Anthracite Porcelain Black 3M",
      "product_type": "Slate",
      "product_colour": "Black",
      "current_stock": 500,
      "order_demand": 750,
      "remaining_stock": -250,
      "fulfillment_rate": 66.67,
      "is_sufficient": false,
      "last_updated": "2025-07-07T12:00:00Z"
    }
  ],
  "summary": {
    "total_products": 25,
    "total_stock": 12500,
    "total_demand": 15000,
    "total_remaining": -2500,
    "sufficient_count": 18,
    "insufficient_count": 7,
    "overall_sufficient": false,
    "overall_fulfillment_rate": 83.33
  },
  "metadata": {
    "execution_time_ms": 45,
    "filters_applied": {
      "product_codes": null,
      "product_type": null
    },
    "generated_at": "2025-07-07T12:00:00Z"
  }
}
```

## TypeScript Types

### Main Types

```typescript
interface InventoryAnalysisProduct {
  product_code: string;
  product_description: string;
  product_type: string | null;
  product_colour: string | null;
  current_stock: number;
  order_demand: number;
  remaining_stock: number;
  fulfillment_rate: number;
  is_sufficient: boolean;
  last_updated: string;
}

interface InventoryAnalysisSummary {
  total_products: number;
  total_stock: number;
  total_demand: number;
  total_remaining: number;
  sufficient_count: number;
  insufficient_count: number;
  overall_sufficient: boolean;
  overall_fulfillment_rate: number;
}
```

## API Client

### InventoryAnalysisAPI

Singleton API client for inventory analysis operations.

```typescript
import { inventoryAnalysisAPI } from '@/lib/api/inventory/InventoryAnalysisAPI';

// Get analysis data
const data = await inventoryAnalysisAPI.getInventoryOrderedAnalysis({
  p_product_codes: ['APBK3M', 'APGY3M']
});

// Export to CSV
const csv = inventoryAnalysisAPI.exportToCSV(data.products);
```

## React Hook

### useInventoryAnalysis

Custom hook for inventory analysis with automatic refresh and filtering.

```typescript
import { useInventoryAnalysis } from '@/app/admin/hooks/useInventoryAnalysis';

// Basic usage
const {
  data,
  products,
  summary,
  criticalMetrics,
  loading,
  error,
  refresh,
  exportToCSV
} = useInventoryAnalysis();

// With filters
const { products } = useInventoryAnalysis({
  p_product_codes: ['APBK3M', 'APGY3M'],
  p_product_type: 'Slate'
});

// With auto-refresh
const { products } = useInventoryAnalysis(
  { p_product_type: 'Slate' },
  { autoRefresh: true, refreshInterval: 60000 }
);
```

## Widget Component

### InventoryOrderedAnalysisWidget

Dashboard widget that displays inventory analysis with real-time updates.

Features:
- Real-time stock level monitoring
- Order demand tracking
- Fulfillment rate visualization
- Critical product highlighting
- Export to CSV functionality
- Integration with StockTypeSelector for filtering

## Performance Considerations

1. **Indexes**: The function uses optimized indexes on:
   - `stock_level(stock, update_time DESC)`
   - `data_order(product_code)`
   - `data_order((product_qty::bigint - loaded_qty::bigint))`
   - `data_code(type)`

2. **Query Optimization**:
   - Uses window functions for efficient latest stock retrieval
   - CTEs for data aggregation
   - Temporary tables for complex analysis

3. **Caching**: The client-side hook implements:
   - Automatic refresh intervals
   - Manual refresh capability
   - Export functionality with no additional queries

## Business Logic

### Fulfillment Rate Calculation
- If demand = 0: 100% fulfillment
- If stock = 0: 0% fulfillment
- Otherwise: (stock / demand) * 100

### Product Status
- **Critical**: Fulfillment rate < 50%
- **Warning**: Fulfillment rate 50-80%
- **Sufficient**: Fulfillment rate ≥ 80%

### Order Demand
- Calculated as: `product_qty - loaded_qty`
- Only includes positive demands (unfulfilled orders)

## Testing

Run the test queries in `scripts/test-inventory-analysis-rpc.sql` to verify functionality:

```sql
-- Get all products with order demand
SELECT * FROM rpc_get_inventory_ordered_analysis();

-- Filter by product codes
SELECT * FROM rpc_get_inventory_ordered_analysis(
  p_product_codes := ARRAY['APBK3M', 'APGY3M']
);

-- Filter by product type
SELECT * FROM rpc_get_inventory_ordered_analysis(
  p_product_type := 'Slate'
);
```

## Migration

To deploy the RPC function to your database:

```bash
psql -U postgres -d your_database -f scripts/create-inventory-ordered-analysis-rpc.sql
```