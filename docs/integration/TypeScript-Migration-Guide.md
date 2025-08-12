# TypeScript 類型遷移指南

## 更新日期：2025-07-27

### 概述
本文檔記錄了 Widget 到 Card 架構遷移過程中的 TypeScript 類型變更。

### 主要類型變更

#### 1. ReportGenerationParams 擴展
```typescript
// 原類型
export interface ReportGenerationParams {
  reportType: string;
  filters?: Record<string, unknown>;
  format?: 'pdf' | 'excel' | 'csv';
  options?: {
    includeDetails?: boolean;
    groupBy?: string;
    sortBy?: string;
    [key: string]: unknown;
  };
}

// 新增類型
export interface ReportGenerationParamsWithSelection extends ReportGenerationParams {
  selectedValue?: string;
  selectedValues?: string[];
  dateFrom?: string;
  dateTo?: string;
}
```

#### 2. BaseAnalysisCard 泛型約束
```typescript
// 更新前
export const BaseAnalysisCard = <TData = unknown>

// 更新後
export const BaseAnalysisCard = <TData extends Record<string, unknown> = Record<string, unknown>>
```

#### 3. AnalysisState 類型更新
```typescript
// 更新前
type AnalysisState<T = unknown> = {
  data: T;
  // ...
}

// 更新後
type AnalysisState<T = unknown> = {
  data: T | undefined;  // 使用 undefined 替代 null
  // ...
}
```

#### 4. OperationChildProps 類型參數
```typescript
// 使用時需要指定具體的參數類型
const renderContent = (props: OperationChildProps<{ operation: string }>) => {
  // ...
}
```

### 數據庫欄位對應
| 表名 | 欄位名 | 類型定義屬性 |
|------|--------|--------------|
| data_code | type | product_type |
| data_code | remark | remark |
| record_palletinfo | plt_remark | plt_remark |
| record_palletinfo | generate_time | generated_at |

### 遷移檢查清單
- [ ] 更新所有使用 ReportGenerationParams 的組件
- [ ] 檢查泛型約束是否符合新規範
- [ ] 確保數據庫欄位名稱與類型定義匹配
- [ ] 使用 undefined 替代 null 作為初始值
- [ ] 為 OperationChildProps 指定正確的參數類型

### 常見問題

1. **類型不兼容錯誤**
   - 檢查是否使用了正確的擴展類型（如 ReportGenerationParamsWithSelection）
   - 確保泛型參數符合約束條件

2. **屬性不存在錯誤**
   - 檢查數據庫欄位名稱是否正確
   - 確認類型定義是否包含所需屬性

3. **泛型約束錯誤**
   - 使用 Record<string, unknown> 作為基礎約束
   - 避免使用過於寬鬆的 unknown 類型

### 參考資源
- TypeScript 官方文檔：https://www.typescriptlang.org/
- 專案類型定義：/types/cards/
- GraphQL 類型定義：/types/generated/