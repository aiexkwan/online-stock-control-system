# TypeScript 類型管理系統

統一管理整個應用的 TypeScript 類型定義，提供更好的類型安全和開發體驗。

## 目錄結構

```
types/
├── index.ts                    # 統一導出文件
├── core/                       # 核心業務類型
│   ├── user.ts                # 用戶相關類型
│   ├── auth.ts                # 認證相關類型
│   └── common.ts              # 通用類型
├── api/                        # API 相關類型
│   ├── request.ts             # API 請求類型
│   ├── response.ts            # API 響應類型
│   └── endpoints.ts           # API 端點定義
├── database/                   # 數據庫相關類型
│   ├── supabase.ts            # Supabase 類型
│   ├── tables.ts              # 表格類型
│   └── views.ts               # 視圖和複合查詢類型
├── components/                 # 組件相關類型
│   ├── dashboard.ts           # 儀表板組件類型
│   ├── forms.ts               # 表單組件類型
│   └── charts.ts              # 圖表組件類型
└── external/                   # 外部庫類型
    ├── recharts.ts            # Recharts 圖表庫類型
    ├── excel.ts               # Excel 處理類型
    └── pdf.ts                 # PDF 生成類型
```

## 使用方式

### 1. 統一導入
```typescript
// 推薦：從統一入口導入
import { User, UserRole, ApiResponse, ChartConfig } from '@/types';

// 或者從具體文件導入
import { User, UserRole } from '@/types/core/user';
import { ApiResponse } from '@/types/api/response';
```

### 2. 類型別名配置
在 `tsconfig.json` 中配置路徑別名：
```json
{
  "compilerOptions": {
    "paths": {
      "@/types": ["./types"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

## 類型分類說明

### Core 類型 (`core/`)
應用的核心業務類型，包括：
- **user.ts**: 用戶、角色、權限相關類型
- **auth.ts**: 登錄、註冊、會話相關類型  
- **common.ts**: 分頁、排序、錯誤處理等通用類型

### API 類型 (`api/`)
前後端通信相關類型：
- **request.ts**: API 請求參數類型
- **response.ts**: API 響應數據類型
- **endpoints.ts**: API 端點路徑常量

### Database 類型 (`database/`)
數據庫結構和查詢相關類型：
- **supabase.ts**: Supabase 客戶端和配置類型
- **tables.ts**: 數據庫表格映射類型
- **views.ts**: 複合查詢和統計類型

### Component 類型 (`components/`)
UI 組件相關類型：
- **dashboard.ts**: 儀表板 Widget 配置類型
- **forms.ts**: 表單驗證和配置類型
- **charts.ts**: 圖表配置和數據類型

### External 類型 (`external/`)
第三方庫的類型定義：
- **recharts.ts**: Recharts 圖表庫類型
- **excel.ts**: ExcelJS 相關類型
- **pdf.ts**: PDF 生成相關類型

## 最佳實踐

### 1. 命名約定
- 使用 PascalCase 命名接口和類型
- 使用 SCREAMING_SNAKE_CASE 命名枚舉值
- 使用有意義的前綴，如 `Api`, `Database`, `Widget` 等

### 2. 類型組織
- 相關類型放在同一文件中
- 使用命名空間避免類型名衝突
- 提供清晰的 JSDoc 註釋

### 3. 泛型使用
```typescript
// 好的泛型設計
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// 具體使用
type UserListResponse = ApiResponse<User[]>;
type ProductResponse = ApiResponse<Product>;
```

### 4. 枚舉 vs 聯合類型
```typescript
// 使用枚舉表示固定的值集合
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator'
}

// 使用聯合類型表示簡單的選項
export type Theme = 'light' | 'dark' | 'auto';
```

## 遷移指南

### 從舊系統遷移
1. 逐步移動現有類型定義到對應目錄
2. 更新導入路徑
3. 統一類型命名和結構
4. 添加缺失的類型註釋

### 維護建議
- 定期審查和重構類型定義
- 保持類型定義與實際業務邏輯同步
- 為複雜類型提供使用示例
- 使用 TypeScript strict 模式

## 工具集成

### ESLint 規則
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-unknown-to-any": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"]
  }
}
```

### IDE 支持
- 配置 VS Code 的 TypeScript 路徑映射
- 使用 TypeScript Hero 擴展自動組織導入
- 啟用嚴格的類型檢查

## 常見問題

### Q: 什麼時候創建新的類型文件？
A: 當類型達到 100+ 行或者邏輯上屬於不同領域時，應該拆分到新文件。

### Q: 如何處理循環依賴？
A: 將共享類型提取到 `common.ts` 或創建專門的基礎類型文件。

### Q: 外部庫類型應該如何管理？
A: 在 `external/` 目錄下為每個主要外部庫創建類型定義文件，擴展或重新導出其類型。

---

*此文檔隨著類型系統的發展持續更新*
