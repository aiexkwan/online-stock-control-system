# 統一報表生成框架設計文檔

## 1. 架構概覽

### 核心概念
建立一個可擴展、可配置的報表生成框架，統一處理不同類型報表的生成需求。

```typescript
// 報表配置介面
interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'inventory' | 'financial' | 'quality';
  formats: ('pdf' | 'excel' | 'csv')[];
  defaultFormat: 'pdf' | 'excel' | 'csv';
  filters: FilterConfig[];
  sections: SectionConfig[];
  permissions?: string[];
}

// 過濾器配置
interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'text';
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  dataSource?: string; // For dynamic options
}

// 區段配置
interface SectionConfig {
  id: string;
  title: string;
  type: 'summary' | 'table' | 'chart' | 'custom';
  dataSource: string;
  columns?: ColumnConfig[];
  chartConfig?: ChartConfig;
  customComponent?: string;
}
```

## 2. 框架組件結構

```
/app/components/reports/
├── core/
│   ├── ReportEngine.tsx          # 核心報表引擎
│   ├── ReportBuilder.tsx         # 報表構建器
│   ├── ReportViewer.tsx          # 報表預覽器
│   └── ReportExporter.tsx        # 導出處理器
├── filters/
│   ├── DateRangeFilter.tsx       # 日期範圍過濾器
│   ├── SelectFilter.tsx          # 選擇過濾器
│   └── FilterPanel.tsx           # 過濾器面板
├── sections/
│   ├── SummarySection.tsx        # 摘要區段
│   ├── TableSection.tsx          # 表格區段
│   ├── ChartSection.tsx          # 圖表區段
│   └── CustomSection.tsx         # 自定義區段
├── generators/
│   ├── PdfGenerator.tsx          # PDF 生成器
│   ├── ExcelGenerator.tsx        # Excel 生成器
│   └── CsvGenerator.tsx          # CSV 生成器
└── templates/
    ├── BaseTemplate.tsx          # 基礎模板
    └── [report-specific]/        # 特定報表模板
```

## 3. 實施步驟

### Phase 1: 核心框架開發 (1-2 週)

1. **建立基礎架構**
```typescript
// ReportEngine.tsx
export class ReportEngine {
  private config: ReportConfig;
  private data: any;
  private filters: FilterValues;

  constructor(config: ReportConfig) {
    this.config = config;
  }

  async generateReport(format: 'pdf' | 'excel' | 'csv', filters: FilterValues) {
    // 1. 驗證過濾器
    this.validateFilters(filters);
    
    // 2. 獲取數據
    const data = await this.fetchData(filters);
    
    // 3. 處理數據
    const processedData = await this.processData(data);
    
    // 4. 生成報表
    const generator = this.getGenerator(format);
    return generator.generate(processedData, this.config);
  }
}
```

2. **統一數據源介面**
```typescript
// DataSource.ts
export interface DataSource {
  fetch(filters: FilterValues): Promise<any>;
  transform(data: any): any;
  validate(data: any): boolean;
}

// 實現範例
export class InventoryDataSource implements DataSource {
  async fetch(filters: FilterValues) {
    return await supabase.rpc('get_inventory_report_data', filters);
  }
  
  transform(data: any) {
    // 數據轉換邏輯
  }
}
```

### Phase 2: 生成器統一化 (1 週)

1. **PDF 生成器統一**
```typescript
export class UnifiedPdfGenerator {
  private doc: jsPDF;
  
  async generate(data: ProcessedData, config: ReportConfig) {
    this.doc = new jsPDF();
    
    // 添加頁首
    this.addHeader(config);
    
    // 添加各區段
    for (const section of config.sections) {
      await this.addSection(section, data);
    }
    
    // 添加頁尾
    this.addFooter();
    
    return this.doc.output('blob');
  }
}
```

2. **Excel 生成器統一**
```typescript
export class UnifiedExcelGenerator {
  private workbook: XLSX.WorkBook;
  
  async generate(data: ProcessedData, config: ReportConfig) {
    this.workbook = XLSX.utils.book_new();
    
    // 摘要工作表
    if (data.summary) {
      this.addSummarySheet(data.summary);
    }
    
    // 詳細數據工作表
    for (const section of config.sections) {
      this.addDataSheet(section, data);
    }
    
    return XLSX.write(this.workbook, { type: 'blob' });
  }
}
```

### Phase 3: 現有報表遷移 (2-3 週)

1. **Void Pallet Report 遷移**
```typescript
export const voidPalletReportConfig: ReportConfig = {
  id: 'void-pallet',
  name: 'Void Pallet Report',
  category: 'operational',
  formats: ['pdf', 'excel'],
  defaultFormat: 'pdf',
  filters: [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'dateRange',
      required: true
    },
    {
      id: 'productCode',
      label: 'Product Code',
      type: 'text',
      required: false
    }
  ],
  sections: [
    {
      id: 'summary',
      title: 'Summary Statistics',
      type: 'summary',
      dataSource: 'voidPalletSummary'
    },
    {
      id: 'details',
      title: 'Void Details',
      type: 'table',
      dataSource: 'voidPalletDetails',
      columns: [
        { id: 'plt_num', label: 'Pallet #', width: 100 },
        { id: 'product_code', label: 'Product', width: 80 },
        { id: 'void_reason', label: 'Reason', width: 150 }
      ]
    }
  ]
};
```

2. **建立遷移指南**
- 為每個現有報表創建配置
- 實現數據源適配器
- 測試並驗證輸出

### Phase 4: 進階功能 (1-2 週)

1. **報表排程**
```typescript
export interface ScheduledReport {
  reportId: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel';
  filters: FilterValues;
}
```

2. **報表緩存**
```typescript
export class ReportCache {
  async get(reportId: string, filters: FilterValues): Promise<Blob | null> {
    const key = this.generateKey(reportId, filters);
    return await this.storage.get(key);
  }
  
  async set(reportId: string, filters: FilterValues, data: Blob) {
    const key = this.generateKey(reportId, filters);
    await this.storage.set(key, data, { ttl: 300 }); // 5分鐘緩存
  }
}
```

## 4. 使用範例

### 生成報表
```typescript
// 在頁面組件中使用
import { ReportEngine } from '@/app/components/reports/core/ReportEngine';
import { voidPalletReportConfig } from '@/app/reports/configs/voidPallet';

export function VoidPalletReportPage() {
  const engine = new ReportEngine(voidPalletReportConfig);
  
  const handleGenerate = async (filters: FilterValues) => {
    try {
      const blob = await engine.generateReport('pdf', filters);
      downloadBlob(blob, `void-pallet-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };
  
  return (
    <ReportBuilder
      config={voidPalletReportConfig}
      onGenerate={handleGenerate}
    />
  );
}
```

### 添加新報表
```typescript
// 1. 創建報表配置
const newReportConfig: ReportConfig = {
  id: 'inventory-analysis',
  name: 'Inventory Analysis Report',
  // ... 配置詳情
};

// 2. 實現數據源
class InventoryAnalysisDataSource implements DataSource {
  async fetch(filters) {
    // 數據獲取邏輯
  }
}

// 3. 註冊報表
ReportRegistry.register(newReportConfig, new InventoryAnalysisDataSource());
```

## 5. 優勢

1. **一致性**：所有報表使用相同的生成流程和介面
2. **可維護性**：集中管理報表邏輯，易於更新和修復
3. **可擴展性**：輕鬆添加新報表類型和格式
4. **重用性**：共用過濾器、生成器和組件
5. **性能優化**：統一的緩存和優化策略

## 6. 遷移計劃

### 優先級
1. **高**：Void Pallet Report（使用頻率高）
2. **高**：Order Loading Report（業務關鍵）
3. **中**：Stock Take Report（相對簡單）
4. **低**：其他報表

### 風險緩解
- 保留原有報表功能直到新版本穩定
- 逐步遷移，每次只遷移一個報表
- 充分測試，確保輸出格式一致
- 提供回滾機制

## 7. 技術決策

### PDF 生成
- 繼續使用 jsPDF 作為主要 PDF 生成器
- 對於複雜佈局，可選用 @react-pdf/renderer

### Excel 生成
- 統一使用 xlsx 庫
- 標準化工作表結構和樣式

### 數據處理
- 使用 RPC 函數進行數據聚合
- 實施客戶端緩存減少重複查詢

## 8. 未來增強

1. **報表設計器**：允許用戶自定義報表佈局
2. **實時報表**：支持實時數據更新
3. **報表訂閱**：定期自動生成並發送報表
4. **版本控制**：報表配置版本管理
5. **權限管理**：細粒度的報表訪問控制