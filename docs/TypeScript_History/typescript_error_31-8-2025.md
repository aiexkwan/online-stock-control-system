# TypeScript 錯誤報告 - 31-8-2025

## 錯誤統計

- **總錯誤數**: 172個
- **影響檔案數**: 33個
- **主要問題類型**:
  - 類型分配錯誤 (Type assignment errors)
  - 資料庫查詢錯誤 (Database query errors)
  - 屬性不存在錯誤 (Property does not exist)
  - 未定義變數錯誤 (Undefined variables)

## 詳細錯誤列表

### app/(auth)/main-login/components/compound/CompoundForm.tsx

- **錯誤**: Type 'FormCompoundContext<TFormData>' is not assignable to type 'FormCompoundContext<Record<string, unknown>>'

### app/actions/DownloadCentre-Actions.ts

- **錯誤1**: Argument of type '(pallet: Record<string, unknown>) => void' is not assignable
- **錯誤2**: Property 'suppliername' does not exist on type 'SelectQueryError'
- **錯誤3**: Multiple conversion errors with SelectQueryError types
- **錯誤4**: DatabaseRecord type conversion issues

### app/actions/fileActions.ts

- **錯誤**: No overload matches this call - 'who' property does not exist

### app/actions/grnActions.ts

- **錯誤**: Multiple type assignment and property access errors

### app/actions/orderLoadingActions.ts

- **錯誤**: Type assignment issues with order loading data

### app/actions/orderUploadActions.ts

- **錯誤**: Supabase table reference errors

### app/actions/palletActions.ts

- **錯誤**: Property access and type conversion errors

### app/actions/productActions.ts

- **錯誤**: Database query type mismatches

### app/actions/qcActions.ts

- **錯誤**: QC actions type compatibility issues

### app/actions/stockTransferActions.ts

- **錯誤**: Stock transfer data type errors

### app/actions/supplierActions.ts

- **錯誤**: Supplier data type assignment errors

### app/api/ask-database/route.ts

- **錯誤**: Database query type issues

### app/api/graphql/route.ts

- **錯誤**: GraphQL type resolution errors

### app/components/qc-label-form/hooks/modules/useAcoManagement.tsx

- **錯誤**: ACO management type errors

### app/components/qc-label-form/hooks/modules/useAuth.tsx

- **錯誤**: Authentication hook type issues

### app/components/qc-label-form/hooks/modules/useBatchProcessing.tsx

- **錯誤**: Batch processing type compatibility

### app/components/qc-label-form/hooks/modules/useClockConfirmation.tsx

- **錯誤**: Clock confirmation type errors

### app/components/qc-label-form/hooks/modules/useEnhancedErrorHandling.tsx

- **錯誤**: Error handling type issues

### app/components/qc-label-form/hooks/modules/useFormValidation.tsx

- **錯誤**: Form validation type errors

### app/components/qc-label-form/hooks/modules/useSlateManagement.tsx

- **錯誤**: Slate management type compatibility

### app/components/qc-label-form/hooks/modules/useStockUpdates.tsx

- **錯誤**: Stock updates type assignment errors

### app/components/qc-label-form/hooks/modules/useStreamingPdfGeneration.tsx

- **錯誤**: PDF generation type issues

### app/components/qc-label-form/hooks/useQcLabelBusiness.tsx

- **錯誤**: QC label business logic type errors

### app/components/reports/generators/ExcelGenerator.ts

- **錯誤**: Excel generator type compatibility issues

### app/services/chatCompletionService.ts

- **錯誤**: Chat completion service type errors

### app/services/palletInfo.ts

- **錯誤**: Pallet info service type issues

### app/utils/optimizedPalletGenerationV6.ts

- **錯誤**: Optimized pallet generation type errors

### hooks/useUnifiedPdfGeneration.ts

- **錯誤**: PDF generation hook type issues

### lib/graphql/resolvers/inventory.resolver.ts

- **錯誤**: Inventory resolver type compatibility

### lib/migration-context/migration-tracker.ts

- **錯誤1**: Argument 'migration_context' not assignable to parameter type 'never'
- **錯誤2**: Argument 'migration_tracking' not assignable to parameter type
- **錯誤3**: Property 'component_id' does not exist in database schema

### lib/query-templates.ts

- **錯誤**: Multiple undefined 'result' variable errors

### lib/redis.ts

- **錯誤**: No value exists in scope for shorthand property 'result'

## 問題分析

### 主要問題模式

1. **資料庫查詢錯誤**: 大量的 SelectQueryError 類型問題，主要由於資料庫 schema 與 TypeScript 類型定義不匹配
2. **泛型類型約束**: FormCompoundContext 等泛型類型的約束過於嚴格
3. **未定義變數**: query-templates.ts 和 redis.ts 中存在未定義的 result 變數
4. **屬性不存在**: 多個檔案中嘗試訪問不存在的屬性

### 建議修復策略

1. **更新資料庫類型定義**: 重新生成或手動更新 Supabase 類型定義
2. **放寬泛型約束**: 調整 FormCompoundContext 等類型的約束條件
3. **修復未定義變數**: 在相關檔案中正確定義或導入 result 變數
4. **類型守衛**: 添加適當的類型守衛來處理可能不存在的屬性

生成時間: 2025-08-31
