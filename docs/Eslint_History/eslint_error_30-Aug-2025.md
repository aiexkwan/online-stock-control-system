# ESLint 錯誤報告 - 30-Aug-2025

## 摘要統計

| 項目         | 數量 |
| ------------ | ---- |
| 檢查檔案總數 | 3    |
| 有錯誤的檔案 | 2    |
| 有警告的檔案 | 1    |
| 錯誤總數     | 2    |
| 警告總數     | 2    |

## 詳細報告

### app/services/examples/productCodeValidatorExample.ts

**統計**: 1 個錯誤

- **❌ 錯誤** (第240行): Definition for rule '@typescript-eslint/no-explicit-any' was not found.
  - 規則: `@typescript-eslint/no-explicit-any`

### lib/exportReport.ts

**統計**: 1 個錯誤

- **❌ 錯誤** (第14行): Definition for rule '@typescript-eslint/no-unused-vars' was not found.
  - 規則: `@typescript-eslint/no-unused-vars`

### lib/printing/hooks/usePrinting.ts

**統計**: 2 個警告

- **⚠️ 警告** (第250行): React Hook useCallback has an unnecessary dependency: 'error'. Either exclude it or remove the dependency array.
  - 規則: `react-hooks/exhaustive-deps`
- **⚠️ 警告** (第334行): React Hook useCallback has an unnecessary dependency: 'error'. Either exclude it or remove the dependency array.
  - 規則: `react-hooks/exhaustive-deps`
