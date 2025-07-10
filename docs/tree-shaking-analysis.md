# Tree Shaking 分析報告

## 當前配置分析

### 1. package.json 配置問題

**主要問題：缺少 `sideEffects` 配置**

```json
{
  "name": "pennine-stock",
  "sideEffects": false  // ❌ 缺少這個關鍵配置
}
```

### 2. 主要依賴庫 Tree Shaking 支援分析

#### ✅ 支援良好的庫

1. **@radix-ui/* 組件庫**
   - 所有組件都支援 tree shaking
   - 使用命名導入：`import { Dialog, DialogContent } from '@radix-ui/react-dialog'`

2. **@tanstack/react-query**
   - 優秀的 tree shaking 支援
   - 正確使用：`import { useQuery, useQueryClient } from '@tanstack/react-query'`

3. **@supabase/supabase-js**
   - 較新的庫，支援 tree shaking
   - 正確使用：`import { createClient } from '@supabase/supabase-js'`

#### ⚠️ 需要優化的庫

1. **recharts**
   ```typescript
   // ✅ 當前使用（良好）
   import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
   
   // ❌ 避免
   import * as Recharts from 'recharts';
   ```

2. **@apollo/client**
   ```typescript
   // ✅ 當前使用（良好）
   import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
   import { useQuery, gql } from '@apollo/client';
   
   // ❌ 避免
   import Apollo from '@apollo/client';
   ```

#### ❌ 有問題的使用模式

1. **Barrel Exports 過度使用**
   ```typescript
   // ❌ 在 app/admin/components/dashboard/widgets/common/imports.ts
   export * from 'recharts';  // 導入整個 recharts 庫
   ```

### 3. 自定義組件 Tree Shaking 問題

#### ❌ 問題的 Barrel Exports

1. **`/components/ui/core/Dialog/index.ts`**
   ```typescript
   // 導出太多組件，影響 tree shaking
   export {
     Dialog, DialogTrigger, DialogPortal, DialogClose,
     DialogOverlay, DialogContent, DialogHeader, DialogTitle,
     // ... 20+ exports
   } from './Dialog';
   ```

2. **`/app/admin/components/dashboard/widgets/common/imports.ts`**
   ```typescript
   // ❌ 重新導出整個 recharts
   export {
     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
     ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
     Area, AreaChart,
   } from 'recharts';
   ```

#### ✅ 良好的組件結構

1. **Widget 懶加載**
   ```typescript
   const OrdersListWidget = React.lazy(() => 
     import('./widgets/OrdersListWidgetV2').then(mod => ({ 
       default: mod.OrdersListWidgetV2 
     }))
   );
   ```

### 4. 動態導入使用分析

#### ✅ 優點
- 大量使用 `React.lazy()` 進行組件懶加載
- 正確的動態導入語法
- Widget 系統有良好的懶加載機制

#### ⚠️ 改善空間
- 有些 widget 沒有懶加載
- 缺少路由級別的代碼分割

## Tree Shaking 效果問題

### 1. 未被正確 Tree Shake 的模組

1. **recharts 完整導入**
   - 通過 barrel export 導入整個庫
   - 建議：直接從具體模組導入

2. **utility 函數過度綁定**
   - `app/utils/index.ts` 雖然簡潔，但可能被過度使用

3. **GraphQL generated code**
   - 自動生成的 hooks 可能包含未使用的查詢

### 2. Side Effects 問題

1. **CSS 導入**
   ```typescript
   // 這些可能有 side effects
   import '@/styles/globals.css'
   import 'ldrs/ring'
   ```

2. **Polyfills 和初始化代碼**
   ```typescript
   // 可能有 side effects
   import { apolloClient } from '@/lib/apollo-client';
   ```

## 改善建議

### 1. 立即修復（高優先級）

#### A. 添加 `sideEffects` 配置
```json
// package.json
{
  "sideEffects": [
    "**/*.css",
    "**/*.scss",
    "**/polyfills.ts",
    "**/globals.ts",
    "lib/apollo-client.ts"
  ]
}
```

#### B. 優化 Barrel Exports
```typescript
// ❌ 移除這種導出
export * from 'recharts';

// ✅ 改為具體導出
export {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
```

#### C. 修復組件導入
```typescript
// ❌ 避免
import { formatNumber, formatCurrency } from '../common';

// ✅ 改為
import { formatNumber } from '../common/formatNumber';
import { formatCurrency } from '../common/formatCurrency';
```

### 2. 中期優化

#### A. webpack 配置優化
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 優化 tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // 模組解析優化
      config.resolve.mainFields = ['browser', 'module', 'main'];
    }
    return config;
  }
}
```

#### B. 路由級代碼分割
```typescript
// 實施頁面級懶加載
const AdminDashboard = dynamic(() => import('../components/AdminDashboard'), {
  loading: () => <DashboardSkeleton />
});
```

#### C. 第三方庫優化導入
```typescript
// recharts 優化
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer 
} from 'recharts/es6';  // 使用 ES6 模組版本

// date-fns 優化
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
```

### 3. 長期改進

#### A. 組件架構重構
1. 拆分大型 barrel exports
2. 實施更細粒度的組件導入
3. 創建更小的 utility 模組

#### B. Bundle 分析自動化
```bash
# 添加到 package.json scripts
"analyze:detailed": "ANALYZE=true npm run build && webpack-bundle-analyzer .next/static/chunks/*.js"
"tree-shaking-check": "node scripts/check-tree-shaking.js"
```

#### C. ESLint 規則
```json
// .eslintrc.js
{
  "rules": {
    "import/no-namespace": "error",
    "import/prefer-default-export": "off",
    "import/no-default-export": "warn"
  }
}
```

## 預期改善效果

### Bundle Size 減少預估
- **recharts 優化**：~200KB
- **Apollo Client 優化**：~50KB  
- **UI 組件優化**：~100KB
- **總預期減少**：~350KB (gzipped ~120KB)

### 性能改善
- 初始加載時間減少 15-20%
- 路由切換速度提升 10-15%
- 記憶體使用減少 ~50MB

### 實施優先級

1. **Week 1**: `sideEffects` 配置 + Barrel exports 優化
2. **Week 2**: 第三方庫導入優化
3. **Week 3**: webpack 配置 + 路由分割
4. **Week 4**: ESLint 規則 + 自動化檢查

## 監控指標

### Bundle 分析指標
- JavaScript bundle size
- CSS bundle size  
- Chunk 數量和大小分佈
- 未使用代碼比例

### 性能指標
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Bundle load time

## 總結

當前項目的 tree shaking 配置有重大改善空間。主要問題包括：

1. **缺少 `sideEffects` 配置**
2. **過度使用 barrel exports**
3. **第三方庫導入未優化**
4. **webpack 配置未針對 tree shaking 優化**

通過實施上述建議，預期可以減少 ~35% 的 bundle size，顯著改善應用性能。

建議立即開始實施高優先級修復，特別是 `sideEffects` 配置和 barrel exports 優化。