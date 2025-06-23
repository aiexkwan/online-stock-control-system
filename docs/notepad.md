# Injection Page Real Data Implementation Plan

## Requirements Overview
- Implement real data display for injection page
- Support time range selector for data switching
- Ensure time range independence between different tabs
- Handle widget size constraints, support vertical scrolling only

## Implementation Steps

### 1. Update adminDashboardLayouts.ts - Modify injection layout configuration

#### Row 1 Stats Widgets:
- **widget2**: "Today Produced (PLT)"
  - Show total plt_num count for selected period
  - Filter conditions:
    - plt_remark contains "finished in production"
    - generate_time = selected period
    - product_code not starting with "U"
    - Calculate distinct plt_num count

- **widget3**: "Today Produced (QTY)"  
  - Show total product_qty sum for selected period
  - Use same filter conditions
  - Calculate product_qty sum

- **widget4 & widget5**: "Available Soon"
  - Display placeholder content

#### Row 2 Chart Widgets:
- **widget6**: Horizontal Bar Chart
  - Display top 5 products by total product_qty
  - Group by product_code

- **widget7**: Pie Chart
  - Display top 10 products by total product_qty
  - Group by product_code

- **widget8**: "Available Soon"

#### Row 3 Data Widgets:
- **widget9**: Detail List Table
  - Column headers: Pallet Num, Product Code, Qty, Q.C. By
  - Data sources: record_palletinfo + record_history + data_id
  - QC operator query logic:
    1. Use plt_num to find action="Finished QC" in record_history
    2. Get corresponding id
    3. Look up name in data_id table

- **widget10**: Employee Workload Line Chart
  - Data source: work_level table
  - Calculate: qc + grn + move sum
  - Group by employee

### 2. Update AdminWidgetRenderer.tsx - Implement data loading logic

#### New/Modified Functions:
- **loadPalletData**: Add filtering logic
- **loadProductionSummary**: Implement top N statistics
- **loadWorkLevelData**: Add employee workload query
- **loadQCOperator**: Add QC operator query

#### UI Updates:
- Remove all "vs yesterday" trend displays
- "Available Soon" widgets show special styling
- Ensure tables and lists support vertical scrolling

### 3. Data Query SQL Reference

```sql
-- Today Produced (PLT)
SELECT COUNT(DISTINCT plt_num) 
FROM record_palletinfo 
WHERE plt_remark LIKE '%finished in production%'
  AND generate_time BETWEEN :start AND :end
  AND product_code NOT LIKE 'U%';

-- Today Produced (QTY)
SELECT SUM(product_qty)
FROM record_palletinfo
WHERE plt_remark LIKE '%finished in production%'
  AND generate_time BETWEEN :start AND :end
  AND product_code NOT LIKE 'U%';

-- Top Products
SELECT product_code, SUM(product_qty) as total_qty
FROM record_palletinfo
WHERE plt_remark LIKE '%finished in production%'
  AND generate_time BETWEEN :start AND :end
  AND product_code NOT LIKE 'U%'
GROUP BY product_code
ORDER BY total_qty DESC
LIMIT 5;

-- QC Operator
SELECT h.plt_num, h.id, i.name
FROM record_history h
JOIN data_id i ON h.id = i.id
WHERE h.action = 'Finished QC'
  AND h.plt_num = :plt_num;

-- Employee Workload
SELECT w.id, i.name, (w.qc + w.grn + w.move) as total_workload
FROM work_level w
JOIN data_id i ON w.id = i.id
WHERE w.latest_update BETWEEN :start AND :end
ORDER BY total_workload DESC;
```

## Notes
- Ensure all queries use timeFrame parameter
- Handle empty data cases
- Optimize query performance (add appropriate indexes)
- Error handling and loading states