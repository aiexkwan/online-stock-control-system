# 性能優化清理命令

## 用法
`/cleanup-performance` 或 `/cleanup-performance [模組路徑]`

## 執行流程
1. **啟動工具**
   - Ultrathink - 深度性能分析
   - Sequential-thinking - 系統性優化
   - Task - 並行性能測試
   - Puppeteer MCP - 性能測量

2. **性能掃描**
   - Bundle Size 分析
   - 網絡請求優化
   - React 渲染性能
   - 資源載入效率

3. **測試憑證**
   - Email: ${env.local.PUPPETEER_LOGIN}
   - Password: ${env.local.PUPPETEER_PASSWORD}

## 角色建議
- 主要角色: ⚡ Optimizer（性能優化專家）
- 協作角色: 🎨 Frontend + ⚙️ Backend + 🏗️ Architect
- 測試角色: 🧪 QA（性能測試驗證）

## 性能檢查項目
### 🎯 前端性能
- [ ] Bundle Size 分析 (<500KB初始)
- [ ] Code Splitting 實施
- [ ] 圖片優化 (WebP格式)
- [ ] 懶加載機制
- [ ] React 渲染優化

### 🚀 網絡性能
- [ ] API 響應時間 (<200ms)
- [ ] 資源緩存策略
- [ ] CDN 使用情況
- [ ] 壓縮配置
- [ ] 請求數量優化

### 📊 資料庫性能
- [ ] 查詢執行時間 (<50ms)
- [ ] 索引使用情況
- [ ] N+1 查詢檢查
- [ ] RPC 函數優化
- [ ] 連接池配置

## 性能目標
| 指標 | 目標值 | 測量方法 |
|------|--------|----------|
| 首次內容繪製(FCP) | <1.8秒 | Puppeteer測量 |
| 最大內容繪製(LCP) | <2.5秒 | Puppeteer測量 |
| 累積佈局偏移(CLS) | <0.1 | 手動計算 |
| Bundle大小 | <500KB | 構建分析 |
| API響應時間 | <200ms | 網絡監控 |

## 優化策略
### 📦 Bundle 優化
```javascript
// 實施 Code Splitting
const LazyComponent = lazy(() => import('./HeavyComponent'));

// 動態導入
const loadModule = () => import('./utils/heavyModule');

// Tree Shaking 優化
export { specific } from './utils'; // 避免 export *
```

### 🖼️ 圖片優化
```javascript
// WebP 格式使用
<Image 
  src="/image.webp" 
  alt="description"
  width={800}
  height={600}
  loading="lazy"
/>

// 響應式圖片
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="fallback" />
</picture>
```

### ⚛️ React 優化
```javascript
// React.memo 使用
const OptimizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo 緩存
const expensiveValue = useMemo(() => 
  heavyCalculation(data), [data]
);

// 虛擬化大列表
import { FixedSizeList } from 'react-window';
```

## 檢查命令
```bash
# 性能分析
npm run analyze
npm run test:perf

# Bundle 分析
npm run build && npm run analyze:view

# 性能測試
npm run test:e2e:performance
```

## 報告輸出路徑
`docs/cleanup/performance-cleanup-v[X.X.X].md`

---

**清理焦點**: 前端性能 + 網絡優化 + 資料庫效能
**目標改善**: 載入時間減少50%，響應速度提升30%