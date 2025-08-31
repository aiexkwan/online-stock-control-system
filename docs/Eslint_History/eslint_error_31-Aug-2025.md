# ESLint 錯誤報告 - 2025-08-31

**掃描時間**: 2025-08-31 20:35 UTC+8  
**總錯誤數**: 15 個警告  
**錯誤類型**: React Hooks 相依性陣列問題

## 錯誤分佈統計

### 按錯誤類型分組

- **react-hooks/exhaustive-deps**: 15 個警告

### 按檔案分組

1. `./app/(app)/admin/components/UserIdVerificationDialog.tsx` - 1 個警告
2. `./app/(app)/admin/hooks/useAdminQcLabelBusiness.tsx` - 2 個警告
3. `./app/(app)/admin/hooks/useDataUpdate.ts` - 4 個警告
4. `./app/(app)/admin/hooks/useUploadManager.ts` - 1 個警告
5. `./app/components/shared/validation/SupplierInput.tsx` - 2 個警告
6. `./app/hooks/useStockTransfer.ts` - 1 個警告
7. `./app/hooks/useZodForm.ts` - 2 個警告
8. `./lib/api/inventory/StockLevelsAPI.ts` - 1 個警告
9. `./lib/error-handling/components/ErrorFallback.tsx` - 1 個警告
10. `./lib/graphql/apollo-provider-dynamic.tsx` - 1 個警告

## 詳細錯誤列表

### UserIdVerificationDialog.tsx

```
104:5  Warning: React Hook useCallback has a missing dependency: '_error'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### useAdminQcLabelBusiness.tsx

```
140:5  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
466:5  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### useDataUpdate.ts

```
200:5  Warning: React Hook useCallback has a missing dependency: 'config.fields'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
277:5  Warning: React Hook useCallback has missing dependencies: 'config.primaryKey' and 'supabase'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
319:6  Warning: React Hook useCallback has missing dependencies: 'supabase' and 'validateForm'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
370:6  Warning: React Hook useCallback has missing dependencies: 'config.primaryKey', 'supabase', and 'validateForm'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
```

### useUploadManager.ts

```
180:6  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### SupplierInput.tsx

```
133:5  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
182:5  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### useStockTransfer.ts

```
204:5  Warning: React Hook useCallback has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### useZodForm.ts

```
181:31  Warning: React Hook useCallback has a missing dependency: 'errors'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
199:6  Warning: React Hook useCallback has a missing dependency: 'validateForm'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### StockLevelsAPI.ts

```
356:6  Warning: React Hook useEffect has missing dependencies: 'config' and 'params'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
```

### ErrorFallback.tsx

```
81:61  Warning: React Hook useMemo has a missing dependency: 'severity'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

### apollo-provider-dynamic.tsx

```
82:6  Warning: React Hook useEffect has a missing dependency: 'supabase.auth'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
```

## 修復建議

所有錯誤都是 React Hooks 的相依性陣列問題：

1. **缺少相依項**: Hook 使用了變數但未在相依性陣列中宣告
2. **修復策略**:
   - 將缺少的變數加入相依性陣列
   - 使用 `useCallback` 或 `useMemo` 包裝函數以避免重複建立
   - 考慮使用 `useRef` 來處理穩定的引用

## 優先級分類

- **高優先級**: `useDataUpdate.ts` (4個錯誤) - 核心數據更新邏輯
- **中優先級**: `useAdminQcLabelBusiness.tsx`、`SupplierInput.tsx`、`useZodForm.ts` - 業務邏輯 Hook
- **低優先級**: 其他單一錯誤檔案
