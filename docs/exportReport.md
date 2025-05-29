# Export Report 功能完整文檔

## 📋 功能概述

Export Report 頁面提供多種報表匯出功能，支援 ACO Order Report、GRN Report、Transaction Report 和 Slate Report（開發中）。

### 🎯 主要功能
- **ACO Order Report**：根據 ACO 訂單參考號匯出產品棧板資訊
- **GRN Report**：根據 GRN 參考號匯出物料接收報告
- **Transaction Report**：匯出產品移動記錄表
- **Slate Report**：石板產品報告（功能待開發）

## 🏗️ 架構分析

### 文件結構
```
app/export-report/
├── page.tsx                    # 主頁面組件
app/actions/
├── reportActions.ts            # 報表數據獲取 Server Actions
lib/
├── exportReport.ts             # Excel 報表生成邏輯
```

### 技術棧
- **前端框架**：Next.js 14 (App Router)
- **UI 組件**：Shadcn/ui (Dialog, Button)
- **Excel 生成**：ExcelJS
- **文件下載**：file-saver
- **通知系統**：Sonner Toast
- **數據庫**：Supabase

## 🔍 現有功能詳細分析

### 1. ACO Order Report

#### 功能流程
1. **選擇 ACO 訂單**：從對話框選擇 ACO Order Reference
2. **數據獲取**：查詢 `record_aco` 和 `record_palletinfo` 表
3. **報表生成**：創建包含產品代碼、棧板號、數量、QC 日期的 Excel 報表
4. **文件下載**：自動下載 `ACO_{orderRef}_Report.xlsx`

#### 數據結構
```typescript
interface AcoProductData {
  product_code: string;
  pallets: PalletInfo[];
}

interface PalletInfo {
  plt_num: string | null;
  product_qty: number | null;
  generate_time: string | null; // 格式：DD-MM-YY
}
```

#### 報表格式
- **標題**：ACO Record (48pt, 粗體, 底線)
- **訂單資訊**：ACO Order Ref 和生成日期
- **數據區域**：最多 4 個產品區塊 (A-D, E-H, I-L, M-P)
- **欄位**：Product Code, Pallet No., Qty, QC Date

### 2. GRN Report

#### 功能流程
1. **選擇 GRN 參考號**：從對話框選擇 GRN Reference Number
2. **獲取物料代碼**：查詢該 GRN 的所有物料代碼
3. **批量生成**：為每個物料代碼生成獨立報表
4. **數據整合**：包含供應商、物料描述、重量統計等

#### 數據結構
```typescript
interface GrnReportPageData {
  grn_ref: string;
  user_id: string;
  material_code: string;
  material_description: string | null;
  supplier_name: string | null;
  report_date: string; // 格式：dd-MMM-yyyy
  records: GrnRecordDetail[];
  total_gross_weight: number;
  total_net_weight: number;
  weight_difference: number;
}

interface GrnRecordDetail {
  gross_weight: number | null;
  net_weight: number | null;
  pallet: string | null;
  package_type: string | null;
  pallet_count: number | null;
  package_count: number | null;
}
```

#### 報表格式
- **頁面設置**：A4 直向，適合頁面寬度
- **標題區域**：GRN 號碼、物料代碼、供應商等資訊
- **數據區域**：棧板類型、包裝類型、重量統計
- **總計區域**：總重量、淨重量、差異

### 3. Transaction Report

#### 功能流程
1. **直接生成**：無需選擇參數，直接生成空白模板
2. **模板下載**：產品移動記錄表模板

#### 報表格式
- **標題**：Product Movement Sheet (36pt, 粗體)
- **移動區域**：From/To 位置選擇 (6 個位置)
- **產品資訊**：產品代碼、數量、棧板總數
- **追蹤資訊**：棧板參考號、操作員資訊

### 4. Slate Report (待開發)

#### 當前狀態
- 按鈕已存在但被禁用
- 功能尚未實現
- 需要定義數據結構和報表格式

## 🎨 UI/UX 分析

### 頁面佈局
```tsx
<div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
  <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
    Export Reports
  </h1>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
    {/* 4 個報表按鈕 */}
  </div>
</div>
```

### 對話框設計
- **深色主題**：`bg-gray-800 border-gray-700 text-white`
- **選擇器**：原生 `<select>` 元素，支援鍵盤導航
- **按鈕狀態**：載入中、禁用狀態的視覺反饋
- **錯誤處理**：Toast 通知系統

### 互動狀態
- **載入狀態**：按鈕文字變更為 "Exporting..."
- **禁用邏輯**：防止同時執行多個匯出操作
- **進度反饋**：Toast 通知匯出進度和結果

## 🔧 技術實現細節

### Server Actions 實現

#### 數據獲取策略
```typescript
// 1. 獲取唯一參考號
export async function getUniqueAcoOrderRefs(): Promise<string[]>
export async function getUniqueGrnRefs(): Promise<string[]>

// 2. 獲取報表數據
export async function getAcoReportData(orderRef: string): Promise<AcoProductData[]>
export async function getGrnReportData(grnRef: string, materialCode: string, userId: string): Promise<GrnReportPageData | null>

// 3. 獲取相關數據
export async function getMaterialCodesForGrnRef(grnRef: string): Promise<string[]>
```

#### 錯誤處理機制
- **數據庫錯誤**：記錄錯誤並返回空陣列
- **無數據情況**：友善的用戶提示
- **類型安全**：完整的 TypeScript 類型定義

### Excel 生成實現

#### ExcelJS 配置
```typescript
// 頁面設置
sheet.pageSetup = {
  margins: { left: 0.2, right: 0.2, top: 0.2, bottom: 0.75 },
  orientation: 'portrait',
  paperSize: 9, // A4
  fitToPage: true,
  fitToWidth: 1
};

// 樣式定義
const center: Partial<ExcelJS.Alignment> = { 
  horizontal: 'center', 
  vertical: 'middle', 
  wrapText: true 
};
```

#### 動態數據填充
- **ACO Report**：支援最多 4 個產品區塊
- **GRN Report**：動態行數，最多 32 行數據
- **格式化**：日期格式化、數字格式、邊框樣式

### 用戶體驗優化

#### 本地存儲整合
```typescript
const getStoredUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const clockNumber = localStorage.getItem('loggedInUserClockNumber');
    return clockNumber;
  }
  return null;
};
```

#### 狀態管理
- **React Hooks**：useState, useEffect, useTransition
- **載入狀態**：防止重複操作
- **錯誤狀態**：優雅的錯誤處理

## 🚀 優化建議

### 1. 性能優化

#### 數據獲取優化
```typescript
// 建議：實現數據快取
const [cachedRefs, setCachedRefs] = useState<{
  aco: string[];
  grn: string[];
  lastFetch: number;
}>({
  aco: [],
  grn: [],
  lastFetch: 0
});

// 建議：分頁載入大量數據
export async function getAcoReportDataPaginated(
  orderRef: string, 
  page: number = 1, 
  limit: number = 100
): Promise<{ data: AcoProductData[]; total: number; hasMore: boolean }>
```

#### Excel 生成優化
```typescript
// 建議：使用 Web Workers 處理大型報表
const generateReportInWorker = async (data: any) => {
  return new Promise((resolve) => {
    const worker = new Worker('/workers/excel-generator.js');
    worker.postMessage(data);
    worker.onmessage = (e) => resolve(e.data);
  });
};
```

### 2. 功能增強

#### 批量匯出功能
```typescript
// 建議：支援批量選擇和匯出
interface BatchExportConfig {
  type: 'aco' | 'grn';
  selections: string[];
  format: 'xlsx' | 'csv' | 'pdf';
}

const handleBatchExport = async (config: BatchExportConfig) => {
  // 實現批量匯出邏輯
};
```

#### 報表預覽功能
```typescript
// 建議：添加報表預覽
const [previewData, setPreviewData] = useState<any>(null);
const [showPreview, setShowPreview] = useState(false);

const handlePreview = async (type: string, ref: string) => {
  const data = await getReportPreview(type, ref);
  setPreviewData(data);
  setShowPreview(true);
};
```

#### 自定義報表格式
```typescript
// 建議：支援報表格式自定義
interface ReportTemplate {
  id: string;
  name: string;
  type: 'aco' | 'grn' | 'transaction';
  columns: ColumnConfig[];
  styling: StyleConfig;
}

const [templates, setTemplates] = useState<ReportTemplate[]>([]);
```

### 3. UI/UX 改進

#### 響應式設計優化
```scss
// 建議：改進移動端體驗
.export-grid {
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### 進度指示器
```tsx
// 建議：添加詳細進度指示
const [exportProgress, setExportProgress] = useState({
  stage: 'idle', // 'fetching' | 'generating' | 'downloading'
  progress: 0,
  message: ''
});

const ProgressIndicator = () => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${exportProgress.progress}%` }}
    />
  </div>
);
```

#### 搜索和篩選功能
```tsx
// 建議：添加搜索功能
const [searchTerm, setSearchTerm] = useState('');
const [filteredRefs, setFilteredRefs] = useState<string[]>([]);

const SearchInput = () => (
  <input
    type="text"
    placeholder="搜索參考號..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md"
  />
);
```

### 4. 錯誤處理改進

#### 詳細錯誤信息
```typescript
// 建議：實現詳細錯誤追蹤
interface ExportError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
}

const logExportError = async (error: ExportError) => {
  // 記錄到數據庫或外部服務
  await fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify(error)
  });
};
```

#### 重試機制
```typescript
// 建議：添加自動重試
const retryExport = async (
  exportFn: () => Promise<any>, 
  maxRetries: number = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await exportFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 5. 數據驗證和安全性

#### 輸入驗證
```typescript
// 建議：添加嚴格的輸入驗證
import { z } from 'zod';

const ExportRequestSchema = z.object({
  type: z.enum(['aco', 'grn', 'transaction']),
  reference: z.string().min(1).max(50),
  userId: z.string().min(1)
});

export async function validateExportRequest(request: unknown) {
  return ExportRequestSchema.parse(request);
}
```

#### 權限控制
```typescript
// 建議：實現基於角色的權限控制
interface UserPermissions {
  canExportAco: boolean;
  canExportGrn: boolean;
  canExportTransaction: boolean;
  canViewAllReports: boolean;
}

const checkExportPermission = async (userId: string, reportType: string) => {
  const permissions = await getUserPermissions(userId);
  return permissions[`canExport${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`];
};
```

## 📊 性能指標

### 當前性能
- **ACO Report 生成時間**：~2-5 秒（取決於數據量）
- **GRN Report 生成時間**：~3-8 秒（包含多個物料代碼）
- **Transaction Report 生成時間**：~1-2 秒（模板生成）
- **文件大小**：通常 50-200KB

### 優化目標
- **生成時間**：減少 50% 的處理時間
- **用戶體驗**：添加進度指示和預覽功能
- **錯誤率**：降低到 1% 以下
- **移動端支援**：完整的響應式設計

## 🔄 開發路線圖

### Phase 1: 基礎優化 (2 週)
- [ ] 實現 Slate Report 功能
- [ ] 添加報表預覽功能
- [ ] 改進錯誤處理和用戶反饋
- [ ] 優化移動端體驗

### Phase 2: 功能增強 (3 週)
- [ ] 實現批量匯出功能
- [ ] 添加搜索和篩選功能
- [ ] 實現報表格式自定義
- [ ] 添加數據快取機制

### Phase 3: 高級功能 (4 週)
- [ ] 實現 Web Workers 優化
- [ ] 添加報表排程功能
- [ ] 實現權限控制系統
- [ ] 添加報表分析和統計

### Phase 4: 企業級功能 (5 週)
- [ ] 實現報表版本控制
- [ ] 添加 API 接口
- [ ] 實現報表分享功能
- [ ] 添加審計日誌

## 🧪 測試策略

### 單元測試
```typescript
// 建議：添加完整的測試覆蓋
describe('Export Report Functions', () => {
  test('should generate ACO report correctly', async () => {
    const mockData = [/* mock data */];
    const result = await exportAcoReport(mockData, 'TEST001');
    expect(result).toBeDefined();
  });

  test('should handle empty data gracefully', async () => {
    const result = await exportAcoReport([], 'TEST001');
    expect(result).toBeNull();
  });
});
```

### 整合測試
```typescript
// 建議：測試完整的匯出流程
describe('Export Report Integration', () => {
  test('should complete full ACO export flow', async () => {
    // 1. 獲取參考號
    const refs = await getUniqueAcoOrderRefs();
    expect(refs.length).toBeGreaterThan(0);

    // 2. 獲取數據
    const data = await getAcoReportData(refs[0]);
    expect(data).toBeDefined();

    // 3. 生成報表
    const result = await exportAcoReport(data, refs[0]);
    expect(result).toBeDefined();
  });
});
```

### E2E 測試
```typescript
// 建議：使用 Playwright 進行 E2E 測試
test('should export ACO report through UI', async ({ page }) => {
  await page.goto('/export-report');
  await page.click('button:has-text("ACO Order Report")');
  await page.selectOption('select', 'TEST001');
  await page.click('button:has-text("Confirm Export")');
  
  // 驗證下載
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('ACO_TEST001_Report.xlsx');
});
```

## 📚 API 文檔

### Server Actions

#### `getUniqueAcoOrderRefs()`
**描述**：獲取所有唯一的 ACO 訂單參考號  
**返回**：`Promise<string[]>`  
**錯誤處理**：返回空陣列

#### `getAcoReportData(orderRef: string)`
**描述**：獲取指定 ACO 訂單的報表數據  
**參數**：
- `orderRef`: ACO 訂單參考號  
**返回**：`Promise<AcoProductData[]>`  
**錯誤處理**：返回空陣列

#### `getUniqueGrnRefs()`
**描述**：獲取所有唯一的 GRN 參考號  
**返回**：`Promise<string[]>`  
**錯誤處理**：拋出錯誤

#### `getGrnReportData(grnRef: string, materialCode: string, userId: string)`
**描述**：獲取指定 GRN 和物料的報表數據  
**參數**：
- `grnRef`: GRN 參考號
- `materialCode`: 物料代碼
- `userId`: 用戶 ID  
**返回**：`Promise<GrnReportPageData | null>`  
**錯誤處理**：返回 null

### Export Functions

#### `exportAcoReport(reportData: AcoProductData[], orderRef: string)`
**描述**：生成並下載 ACO 報表  
**參數**：
- `reportData`: 報表數據
- `orderRef`: 訂單參考號  
**文件名**：`ACO_{orderRef}_Report.xlsx`

#### `exportGrnReport(data: GrnReportPageData)`
**描述**：生成並下載 GRN 報表  
**參數**：
- `data`: GRN 報表數據  
**文件名**：`GRN_Report_{grn_ref}_{material_code}.xlsx`

#### `buildTransactionReport()`
**描述**：生成並返回交易報表模板  
**返回**：`Promise<Buffer>`  
**文件名**：`Transaction_Report_{date}.xlsx`

## 🔗 相關資源

### 數據庫表結構
- `record_aco`: ACO 訂單記錄
- `record_palletinfo`: 棧板資訊
- `record_grn`: GRN 記錄
- `data_code`: 產品代碼資訊
- `data_supplier`: 供應商資訊

### 外部依賴
- **ExcelJS**: Excel 文件生成
- **file-saver**: 文件下載
- **date-fns**: 日期格式化
- **Sonner**: Toast 通知

### 相關頁面
- `/dashboard`: 主控台
- `/print-label`: 標籤打印
- `/inventory`: 庫存管理

---

**最後更新**：2024年1月28日  
**版本**：1.0.0  
**維護者**：開發團隊
