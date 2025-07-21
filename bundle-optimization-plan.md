# Bundle Size 優化計劃

## 當前狀況分析

### 最大的依賴（已識別）
1. **ExcelJS** (0.9 MB) - 用於生成 Excel 報告
2. **@react-pdf/pdfkit** (0.63 MB x 4 = 2.52 MB) - PDF 生成，有重複載入問題
3. **fontkit** (0.52 MB x 4 = 2.08 MB) - 字體處理，有重複載入問題
4. **html2canvas** (0.42 MB) - 截圖功能
5. **jspdf** (0.34 MB) - PDF 生成
6. **lucide-react** (0.19 MB) - 圖標庫

## 優化策略

### 1. 解決重複模塊問題 (預計減少 40-50%)
- @react-pdf/pdfkit 和 fontkit 被載入多次
- 需要檢查 webpack 配置確保正確的去重

### 2. ExcelJS 優化 (預計減少 0.9 MB)
**現狀**：部分地方直接 import，部分動態 import
**方案**：
- 統一改為動態 import
- 考慮使用 xlsx-lite 或其他輕量級替代品
- 將 Excel 生成移到 server-side only

### 3. PDF 庫整合 (預計減少 1-2 MB)
**現狀**：同時使用 @react-pdf、jspdf、pdf-lib
**方案**：
- 統一使用單一 PDF 庫
- 優先考慮 pdf-lib (更輕量)
- 移除其他 PDF 庫

### 4. 圖標庫優化 (預計減少 0.15 MB)
**現狀**：lucide-react 載入所有圖標
**方案**：
- 改為按需導入
- 使用 babel-plugin-import 或手動導入

### 5. 程式碼分割優化
**方案**：
- 調整 maxSize 從 200KB 降到 150KB
- 增加更細緻的 cacheGroups
- 優化 priority 設置

### 6. Tree Shaking 改進
**方案**：
- 檢查 package.json 的 sideEffects
- 確保所有庫都支持 ES modules
- 移除未使用的導出

## 實施步驟

### Phase 1: 快速優化 (1-2小時)
1. 修復重複模塊載入問題
2. 統一 ExcelJS 為動態導入
3. 調整 webpack splitChunks 配置

### Phase 2: 中期優化 (3-4小時)
1. 整合 PDF 庫
2. 優化圖標導入
3. 實施更細緻的代碼分割

### Phase 3: 長期優化 (1-2天)
1. 考慮替換大型庫
2. 實施 server-side 渲染報告
3. 優化整體架構

## 預期成果
- **目標**: 減少 60-70% bundle size
- **從**: ~10-15 MB
- **到**: ~3-5 MB
- **首屏加載時間**: 減少 50%+
