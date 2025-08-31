# TypeScript 錯誤報告 - 31-Aug-2025 (Phase 2 更新)

## 執行時間

- **初始報告**: 2025-08-31 早期
- **Phase 2 更新**: 2025-08-31 後期

## 錯誤統計 (Phase 2)

- **總錯誤數**: 200+ 個錯誤 (輸出被截斷，實際數量更多)
- **影響檔案數**: 60+ 個檔案
- **主要錯誤類型**:
  - Module not found (TS2307): 25+ 個 (新增 Archon UI 依賴問題)
  - Property does not exist (TS2339/TS2551/TS2552): 80+ 個
  - Type assignment issues (TS2769/TS2352/TS2416): 15+ 個
  - Cannot find name (TS2304): 30+ 個
  - Object literal properties (TS2561/TS2322): 20+ 個
  - Other type-related issues: 30+ 個

## 錯誤分類 (Phase 2)

### 1. 新增：模組依賴錯誤 (最嚴重)

Archon UI 系統缺少關鍵依賴：

- `react-router-dom` - 路由系統
- `prismjs` - 代碼高亮
- `@xyflow/react` - 流程圖組件
- `react-dnd` - 拖拽功能
- 影響 25+ 個 Archon UI 檔案

### 2. 新增：數據庫架構錯誤

- `backup_history` 表格不存在於 Supabase 類型定義中
- 影響 `lib/database/backup-disaster-recovery.ts`
- 需要 Schema 更新或類型定義修正

### 3. 繼承：屬性存取錯誤 (持續)

主要為存取不存在屬性的錯誤，包括：

- `config` vs `_config` 命名問題
- `error` vs `_error` 命名問題
- `name` vs `_name` 命名問題
- `code_examples_count` 屬性缺失

### 4. 繼承：變數定義錯誤 (持續)

未定義變數的使用，如：

- `error` 變數未定義
- `result` 變數未定義
- `startTime` 變數未定義

### 5. 新增：複合組件系統錯誤

- 組件註冊類型不匹配
- `ComponentRegistry` 介面實現問題
- 影響認證系統的複合組件

### 6. 新增：React 提供者配置錯誤

- ErrorProvider 缺少必要的 `children` 屬性
- 影響錯誤處理系統的初始化

## 完整錯誤輸出 (Phase 2)

**注意**: 輸出被截斷，總共有 200+ 個錯誤，以下顯示前面部分：

```
app/(auth)/main-login/components/compound/utils.ts(30,3): error TS2416: Property 'get' in type 'CompoundComponentRegistry' is not assignable to the same property in base type 'ComponentRegistry'.
  Type '<P = Record<string, unknown>>(name: string) => RegisteredComponent<P>' is not assignable to type '(name: string) => ComponentType<any>'.
    Type 'RegisteredComponent<Record<string, unknown>>' is not assignable to type 'ComponentType<any>'.
archon/archon-ui-main/src/App.tsx(2,66): error TS2307: Cannot find module 'react-router-dom' or its corresponding type declarations.
archon/archon-ui-main/src/components/code/CodeViewerModal.tsx(16,19): error TS2307: Cannot find module 'prismjs' or its corresponding type declarations.
archon/archon-ui-main/src/components/knowledge-base/GroupCreationModal.tsx(119,46): error TS2322: Type '{ children: string; key: number; accentColor: string; }' is not assignable to type 'IntrinsicAttributes & BadgeProps'.
  Property 'accentColor' does not exist on type 'IntrinsicAttributes & BadgeProps'.
archon/archon-ui-main/src/components/knowledge-base/GroupCreationModal.tsx(124,34): error TS2322: Type '{ children: (string | number)[]; accentColor: string; }' is not assignable to type 'IntrinsicAttributes & BadgeProps'.
  Property 'accentColor' does not exist on type 'IntrinsicAttributes & BadgeProps'.
archon/archon-ui-main/src/components/knowledge-base/GroupedKnowledgeItemCard.tsx(238,43): error TS2339: Property 'code_examples_count' does not exist on type 'KnowledgeItemMetadata'.
archon/archon-ui-main/src/components/knowledge-base/GroupedKnowledgeItemCard.tsx(244,50): error TS2339: Property 'code_examples_count' does not exist on type 'KnowledgeItemMetadata'.
archon/archon-ui-main/src/components/knowledge-base/KnowledgeItemCard.tsx(219,43): error TS2339: Property 'code_examples_count' does not exist on type 'KnowledgeItemMetadata'.
archon/archon-ui-main/src/components/knowledge-base/KnowledgeItemCard.tsx(319,17): error TS2322: Type '{ className: string; title: string; }' is not assignable to type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'.
  Property 'title' does not exist on type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'.
archon/archon-ui-main/src/components/layouts/MainLayout.tsx(2,42): error TS2307: Cannot find module 'react-router-dom' or its corresponding type declarations.
archon/archon-ui-main/src/components/layouts/SideNavigation.tsx(2,35): error TS2307: Cannot find module 'react-router-dom' or its corresponding type declarations.
archon/archon-ui-main/src/components/mcp/MCPClients.tsx(161,23): error TS2339: Property 'version' does not exist on type '{ url: string; }'.
archon/archon-ui-main/src/components/mcp/MCPClients.tsx(162,22): error TS2339: Property 'region' does not exist on type '{ url: string; }'.
archon/archon-ui-main/src/components/project-tasks/DataTab.tsx(3,192): error TS2307: Cannot find module '@xyflow/react' or its corresponding type declarations.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(563,34): error TS2339: Property 'docs' does not exist on type '{ id: string; title: string; created_at?: string; updated_at?: string; }'.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(569,54): error TS2339: Property 'docs' does not exist on type '{ id: string; title: string; created_at?: string; updated_at?: string; }'.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(644,34): error TS2339: Property 'tags' does not exist on type 'ProjectDoc'.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(645,36): error TS2339: Property 'author' does not exist on type 'ProjectDoc'.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(942,17): error TS2322: Type 'ProjectDoc' is not assignable to type 'import("/Users/chun/Documents/PennineWMS/online-stock-control-system/archon/archon-ui-main/src/components/project-tasks/DocumentCard").ProjectDoc'.
  Property 'content' is optional in type 'ProjectDoc' but required in type 'ProjectDoc'.
archon/archon-ui-main/src/components/project-tasks/DocsTab.tsx(944,17): error TS2322: Type 'Dispatch<SetStateAction<ProjectDoc>>' is not assignable to type '(doc: ProjectDoc) => void'.
  Types of parameters 'value' and 'doc' are incompatible.
    Type 'ProjectDoc' is not assignable to type 'SetStateAction<ProjectDoc>'.
      Type 'import("/Users/chun/Documents/PennineWMS/online-stock-control-system/archon/archon-ui-main/src/components/project-tasks/DocumentCard").ProjectDoc' is not assignable to type 'ProjectDoc'.
        Property 'created_at' is optional in type 'ProjectDoc' but required in type 'ProjectDoc'.
archon/archon-ui-main/src/components/project-tasks/DraggableTaskCard.tsx(2,34): error TS2307: Cannot find module 'react-dnd' or its corresponding type declarations.
archon/archon-ui-main/src/components/project-tasks/FeaturesTab.tsx(18,8): error TS2307: Cannot find module '@xyflow/react' or its corresponding type declarations.

... [錯誤輸出被截斷，實際有 200+ 個錯誤] ...

lib/database/backup-disaster-recovery.ts(618,26): error TS2352: Conversion of type '{ account_num: string; created_at: string; customer_ref: string; delivery_add: string; invoice_to: string; loaded_qty: string; order_ref: string; product_code: string; product_desc: string; ... 5 more ...; weight: number; } | ... 19 more ... | { ...; }' to type '{ id: number; backup_type: string; status: string; start_time: string; end_time?: string; backup_size_mb?: number; backup_location?: string; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ grn: number; id: number; latest_update: string; loading: number; move: number; qc: number; uuid: string; }' is missing the following properties from type '{ id: number; backup_type: string; status: string; start_time: string; end_time?: string; backup_size_mb?: number; backup_location?: string; }': backup_type, status, start_time
lib/database/backup-disaster-recovery.ts(691,13): error TS2769: No overload matches this call.
  Overload 1 of 2, '(relation: "data_code" | "data_supplier" | "data_id" | "stock_level" | "record_palletinfo" | "API" | "record_history" | "record_inventory" | "record_transfer" | "record_aco" | "record_grn" | ... 9 more ... | "work_level"): PostgrestQueryBuilder<...>', gave the following error.
    Argument of type '"backup_history"' is not assignable to parameter of type '"data_code" | "data_supplier" | "data_id" | "stock_level" | "record_palletinfo" | "API" | "record_history" | "record_inventory" | "record_transfer" | "record_aco" | "record_grn" | ... 9 more ... | "work_level"'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder<{ Tables: { API: { Row: { description: string; name: string; uuid: string; value: string; }; Insert: { description?: string; name: string; uuid?: string; value: string; }; Update: { description?: string; name?: string; uuid?: string; value?: string; }; Relationships: []; }; ... 19 more ...; work_level: { ...; }; }; Views: {}; Functions: { ...; }; Enums: {}; CompositeTypes: {}; }, never, never, never>', gave the following error.
    Argument of type '"backup_history"' is not assignable to parameter of type 'never'.
lib/error-handling/index.tsx(225,34): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type '{ maxErrorHistory?: number; enableAutoCleanup?: boolean; cleanupInterval?: number; }' is not assignable to parameter of type 'Attributes & ErrorProviderProps'.
      Property 'children' is missing in type '{ maxErrorHistory?: number; enableAutoCleanup?: boolean; cleanupInterval?: number; }' but required in type 'ErrorProviderProps'.
```

## 檔案錯誤統計 (Phase 2)

### 新增高嚴重性錯誤檔案

| 檔案                                                                     | 錯誤類型   | 嚴重性      |
| ------------------------------------------------------------------------ | ---------- | ----------- |
| archon/archon-ui-main/src/App.tsx                                        | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/layouts/MainLayout.tsx              | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/layouts/SideNavigation.tsx          | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/code/CodeViewerModal.tsx            | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/project-tasks/DataTab.tsx           | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/project-tasks/DraggableTaskCard.tsx | 模組依賴   | 🔴 Critical |
| archon/archon-ui-main/src/components/project-tasks/FeaturesTab.tsx       | 模組依賴   | 🔴 Critical |
| lib/database/backup-disaster-recovery.ts                                 | 數據庫架構 | 🔴 Critical |
| app/(auth)/main-login/components/compound/utils.ts                       | 類型系統   | 🟠 High     |
| lib/error-handling/index.tsx                                             | 組件配置   | 🟠 High     |

### 繼承錯誤檔案 (Phase 1 持續)

| 檔案                                                 | 錯誤數估計 | 狀態      |
| ---------------------------------------------------- | ---------- | --------- |
| hooks/useUnifiedPdfGeneration.ts                     | 22+        | 🟠 High   |
| app/services/OptimizedPDFExtractionService.ts        | 16+        | 🟠 High   |
| app/services/productCodeValidator.ts                 | 16+        | 🟠 High   |
| lib/cache/apollo-cache-adapter.ts                    | 12+        | 🟡 Medium |
| lib/cache/memory-cache-adapter.ts                    | 12+        | 🟡 Medium |
| lib/cache/redis-cache-adapter.ts                     | 12+        | 🟡 Medium |
| app/services/examples/productCodeValidatorExample.ts | 11+        | 🟡 Medium |

## 建議修復優先順序 (Phase 2)

### 🔴 Critical Priority (立即處理)

1. **模組依賴問題** - 安裝缺失的 npm 套件：
   - `react-router-dom`
   - `prismjs`
   - `@xyflow/react`
   - `react-dnd`
2. **數據庫架構修正** - `lib/database/backup-disaster-recovery.ts`
3. **組件配置修正** - `lib/error-handling/index.tsx`

### 🟠 High Priority (Phase 2 焦點)

4. **複合組件系統** - `app/(auth)/main-login/components/compound/utils.ts`
5. **繼承高錯誤檔案**:
   - hooks/useUnifiedPdfGeneration.ts (22個錯誤)
   - app/services/OptimizedPDFExtractionService.ts (16個錯誤)
   - app/services/productCodeValidator.ts (16個錯誤)

### 🟡 Medium Priority (並行處理)

6. **Cache adapters** - 各自12個錯誤
7. **其他 Archon UI 屬性錯誤**
8. **Zod 整合範例錯誤**
