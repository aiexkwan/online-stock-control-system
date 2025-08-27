# print-label 路徑依賴關係分析報告

**分析目標**: `/app/(app)/print-label`
**分析日期**: 2025-08-27
**分析範圍**: 整個 Pennine WMS 系統

## 執行摘要

經過全面的依賴關係分析，`/app/(app)/print-label` 模組在系統中有**中等程度的依賴關係**，總計發現 **27個直接或間接引用**。該模組目前處於**半激活狀態**（AuthChecker 中被註釋但未完全移除）。

## 模組結構

### 核心檔案
- `/app/(app)/print-label/page.tsx` - 主要頁面元件（394行代碼）
- `/app/(app)/print-label/layout.tsx` - 佈局元件（12行代碼）

### 功能特性
- QC標籤生成和列印
- 支援 ACO 和 Slate 產品類型
- 整合硬體測試功能
- PDF 進度監控
- 時鐘號碼確認機制

## 依賴關係映射

### 1. 路由引用 (4個)

#### 直接路由
- `app/(app)/print-label/page.tsx` - Next.js App Router 自動路由
- `app/(app)/print-label/layout.tsx` - 佈局配置

#### 配置引用
- `.lighthouserc.js:14` - 效能測試目標URL
- `scripts/lighthouse-quick-test.js:13` - 快速效能測試
- `scripts/performance-lighthouse-test.js:17` - 效能監控腳本

### 2. 中間件和安全配置 (2個)

#### 認證中間件
- `middleware.ts:62` - `/api/print-label-html` 公開路由配置
- `app/components/AuthChecker.tsx:24` - **已註釋但未移除** (`//'/print-label'`)

### 3. 無障礙功能引用 (1個)

#### 跳轉連結
- `app/components/GlobalSkipLinks.tsx:78` - 為 print-label 頁面提供無障礙跳轉

### 4. API 端點 (2個)

#### 相關 API
- `/app/api/print-label-html/route.ts` - HTML 標籤預覽 API（283行）
- `/app/api/print-label-updates/route.ts` - 庫存更新 API（103行）

### 5. 組件依賴 (10個)

#### PrintLabelPdf 組件引用
多個模組引用 `@/components/print-label-pdf/PrintLabelPdf`：
- `app/components/print-label-pdf/PdfGenerator.tsx:4`
- `lib/performance/enhanced-pdf-parallel-processor.ts:13`
- `app/components/qc-label-form/hooks/modules/useStreamingPdfGeneration.tsx:10`
- `lib/pdfUtils.tsx:6`
- `app/(app)/print-grnlabel/hooks/useGrnLabelBusinessV3.tsx:22`
- `app/(app)/print-grnlabel/hooks/useGrnLabelBusinessV3.tsx.backup:24`
- `app/(app)/admin/hooks/usePdfGeneration.tsx:11`
- `app/(app)/admin/hooks/useAdminGrnLabelBusiness.tsx:25`

#### 業務邏輯引用
- `app/components/qc-label-form/hooks/modules/useStockUpdates.tsx:57` - 調用 print-label-updates API
- `lib/api/print/PrintLabelAPI.ts:48` - API 基礎類別

### 6. 系統整合 (3個)

#### 硬體整合
- `lib/hardware/services/printer-service.ts:3` - 列印服務註釋
- `lib/hardware/types/index.ts:6` - 類型定義註釋

#### 管理面板
- `app/(app)/admin/constants/cardConfig.ts:76` - 管理卡片配置

### 7. 文檔和測試 (5個)

#### 系統文檔
- 多個系統更新文檔中提及 print-label
- 歷史記錄文檔中的相關記載

## 資料庫依賴分析

### Supabase RPC 函數
- `handle_print_label_updates` - 處理庫存和工作更新的資料庫函數

### 資料流向
```
print-label page → API(/api/print-label-updates) → Supabase RPC → 資料庫更新
```

## 影響評估

### 高風險區域 (需要修改)
1. **API 端點**: `/api/print-label-html` 和 `/api/print-label-updates` 需要處理
2. **中間件配置**: `middleware.ts` 中的公開路由設定需要清理
3. **PrintLabelPdf 組件**: 8個模組依賴此組件，需要評估替代方案

### 中風險區域 (可能需要修改)
1. **AuthChecker**: 已註釋但未移除，建議完全清理
2. **GlobalSkipLinks**: 無障礙跳轉配置需要更新
3. **效能測試**: Lighthouse 配置需要移除相關測試

### 低風險區域 (影響輕微)
1. **文檔引用**: 主要是記錄性質，影響有限
2. **硬體服務註釋**: 僅為註釋，不影響功能
3. **管理面板配置**: 可選擇性保留或移除

## 建議移除策略

### 階段一：準備階段
1. 備份相關組件和 API 邏輯
2. 識別和記錄所有依賴的替代方案
3. 評估 PrintLabelPdf 組件的重用可能性

### 階段二：清理核心
1. 移除 `/app/(app)/print-label/` 目錄
2. 移除相關 API 端點 (`/api/print-label-html`, `/api/print-label-updates`)
3. 清理中間件配置

### 階段三：更新依賴
1. 更新所有引用 PrintLabelPdf 的模組
2. 清理 AuthChecker 和 GlobalSkipLinks 中的引用
3. 更新效能測試配置

### 階段四：驗證和測試
1. 確認所有引用模組正常運作
2. 執行完整的回歸測試
3. 驗證相關 API 調用被正確處理

## 風險評分

**總體風險等級**: **中等** (6/10)

**風險因素**:
- PrintLabelPdf 組件被多個模組引用 (高風險)
- API 端點有實際業務邏輯 (中風險)  
- 資料庫 RPC 函數可能被其他地方調用 (中風險)
- 已有部分註釋顯示正在逐步移除 (低風險)

## 結論

`print-label` 模組雖然有較多依賴關係，但大部分為可管理的依賴。建議採用分階段移除策略，特別注意 PrintLabelPdf 組件和相關 API 端點的處理。移除前需要確認其他模組(特別是 print-grnlabel)不會受到影響。

---
*本報告由系統依賴分析工具自動生成，建議在執行移除操作前進行人工驗證。*