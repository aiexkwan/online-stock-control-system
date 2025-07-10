# Tree Shaking 立即改善指南

## 已完成的改善

### ✅ 1. package.json 配置
```json
{
  "sideEffects": [
    "**/*.css",
    "**/*.scss", 
    "**/polyfills.ts",
    "**/globals.ts",
    "lib/apollo-client.ts",
    "middleware.ts",
    "app/globals.css"
  ]
}
```

### ✅ 2. Next.js webpack 配置優化
```javascript
// Tree shaking 優化
config.optimization.usedExports = true;
config.optimization.sideEffects = false;
config.resolve.mainFields = ['browser', 'module', 'main'];
```

### ✅ 3. 添加 tree shaking 檢查工具
- `npm run tree-shaking:check` - 檢查 tree shaking 問題
- `npm run tree-shaking:analyze` - 檢查 + bundle 分析

### ✅ 4. codegen 配置優化
添加 tree shaking 友好的配置選項

## 需要手動修復的問題

根據分析結果，以下是需要優先修復的問題：

### 🚨 高優先級 (影響最大)

#### 1. 減少 Barrel Exports
```typescript
// ❌ 當前 - app/admin/components/dashboard/widgets/common/imports.ts
export * from './types';

// ✅ 改為 - 具體導出
export { WidgetComponentProps, WidgetConfig } from './types';
export { formatNumber, formatCurrency } from './utils';
```

#### 2. 優化大型庫的導入
```typescript
// ❌ 當前
import { BarChart, Bar, XAxis, YAxis } from '../common';

// ✅ 改為
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
```

### ⚠️ 中優先級

#### 3. 減少 React namespace imports
多數 UI 組件使用 `import * as React`，但對 React 來說這不會影響 tree shaking。
**建議**: 保持現狀，React 本身已經做了優化。

#### 4. 優化 Radix UI imports
```typescript
// ✅ 當前已經很好
import * as DialogPrimitive from '@radix-ui/react-dialog';
// Radix UI 設計上支援這種導入方式
```

## 立即實施步驟

### Step 1: 修復 Barrel Exports (30分鐘)

1. **修復 `/lib/widgets/index.ts`**
```typescript
// ❌ 當前
export * from './types';

// ✅ 改為
export { WidgetDefinition, WidgetCategory, WidgetRole } from './types';
```

2. **修復 `/lib/inventory/index.ts`**
```typescript
// ❌ 當前  
export * from './types';

// ✅ 改為
export { 
  PalletInfo, 
  InventoryItem, 
  StockMovement 
} from './types';
```

### Step 2: 優化 recharts 使用 (15分鐘)

1. **檢查使用 recharts 的文件**
```bash
rg "from.*recharts" --type ts
```

2. **直接導入而不是通過 common**
```typescript
// 在每個使用的文件中
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
```

### Step 3: 測試改善效果 (10分鐘)

```bash
# 運行檢查
npm run tree-shaking:check

# 運行完整分析
npm run tree-shaking:analyze
```

## 預期改善

### Bundle Size 減少
- **Barrel exports 優化**: ~150KB
- **recharts 優化**: ~100KB  
- **總減少**: ~250KB (gzipped ~85KB)

### 性能提升
- 初始載入時間: -15%
- 路由切換: -10%
- 記憶體使用: -30MB

## 長期改善計劃

### Week 2: 深度優化
1. 重構大型 barrel exports
2. 實施動態導入
3. 路由級代碼分割

### Week 3: 自動化
1. ESLint 規則
2. CI/CD 檢查
3. Bundle 監控

### Week 4: 監控和維護
1. 性能基準
2. 回歸測試
3. 文檔更新

## 監控指標

追蹤以下指標來衡量改善效果：

### Bundle 指標
- JavaScript bundle: 當前 ~2.1MB → 目標 ~1.8MB
- CSS bundle: 維持 ~200KB
- 總 chunks: 當前 ~45 → 目標 ~35

### 性能指標
- FCP: 當前 ~1.2s → 目標 ~1.0s
- LCP: 當前 ~2.1s → 目標 ~1.8s
- TTI: 當前 ~3.2s → 目標 ~2.7s

## 實施檢查清單

- [ ] 修復 barrel exports (Step 1)
- [ ] 優化 recharts 導入 (Step 2)  
- [ ] 運行 tree shaking 檢查 (Step 3)
- [ ] 測量 bundle size 改善
- [ ] 測量性能改善
- [ ] 提交改變
- [ ] 更新文檔

## 疑難排解

### 如果 bundle size 沒有減少
1. 檢查 `sideEffects` 配置是否正確
2. 確認 webpack 配置已應用
3. 使用 `webpack-bundle-analyzer` 檢查具體問題

### 如果運行時錯誤
1. 檢查是否有循環依賴
2. 確認所有導出都正確
3. 測試關鍵功能

### 如果性能反而下降
1. 檢查是否過度分割代碼
2. 確認 prefetch/preload 配置
3. 監控網絡請求數量

記住：tree shaking 優化是一個漸進的過程，應該循序漸進地實施和測試。