# 報表遷移指南

## 概述
本指南幫助開發者將現有報表遷移到統一報表框架，同時確保輸出格式保持不變。

## 遷移步驟

### 1. 創建報表配置文件

在 `/app/components/reports/configs/` 目錄下創建配置文件：

```typescript
// yourReport.ts
import { ReportConfig } from '../core/ReportConfig';

export const yourReportConfig: ReportConfig = {
  id: 'your-report-id',
  name: 'Your Report Name',
  description: 'Report description',
  category: 'operational',
  formats: ['pdf', 'excel'],
  defaultFormat: 'pdf',

  // 過濾器配置
  filters: [
    // 複製現有報表的過濾器
  ],

  // 區段配置
  sections: [
    // 定義報表的各個區段
  ],

  // 重要：保持現有格式
  styleOverrides: {
    pdf: {
      useLegacyStyles: true // 確保格式不變
    }
  }
};
```

### 2. 實現數據源

在 `/app/components/reports/dataSources/` 目錄下創建數據源：

```typescript
// YourReportDataSource.ts
import { ReportDataSource, FilterValues } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/server';

export class YourReportSummaryDataSource implements ReportDataSource {
  id = 'yourReportSummary';

  async fetch(filters: FilterValues) {
    // 複製現有的數據查詢邏輯
    const supabase = createClient();
    // ... 查詢邏輯
  }

  transform(data: any) {
    // 數據轉換邏輯
  }
}

// 導出所有數據源
export const yourReportDataSources = new Map([
  ['yourReportSummary', new YourReportSummaryDataSource()],
  // ... 其他數據源
]);
```

### 3. 創建舊版 PDF 生成器（如需要）

如果報表有特殊的 PDF 格式，創建專用的舊版生成器：

```typescript
// LegacyYourReportPdfGenerator.ts
import { jsPDF } from 'jspdf';

export class LegacyYourReportPdfGenerator {
  generate(data: any): Blob {
    // 複製現有的 PDF 生成邏輯
    const doc = new jsPDF();
    // ... 生成邏輯
    return doc.output('blob');
  }
}
```

### 4. 創建適配器

將統一框架數據轉換為舊版格式：

```typescript
// LegacyYourReportAdapter.ts
export class LegacyYourReportAdapter {
  static async generatePdf(
    data: ProcessedReportData,
    config: ReportConfig
  ): Promise<Blob> {
    // 數據轉換邏輯
    const generator = new LegacyYourReportPdfGenerator();
    return generator.generate(transformedData);
  }
}
```

### 5. 註冊報表

在 `ReportRegistry.ts` 中註冊：

```typescript
import { yourReportConfig } from '../configs/yourReport';
import { yourReportDataSources } from '../dataSources/YourReportDataSource';

if (typeof window !== 'undefined') {
  ReportRegistry.register(yourReportConfig, yourReportDataSources);
}
```

### 6. 更新 PDF 生成器

在 `PdfGenerator.ts` 的 `generateLegacyPdf` 方法中添加：

```typescript
if (config.id === 'your-report-id') {
  const { LegacyYourReportAdapter } = await import('./LegacyYourReportAdapter');
  return LegacyYourReportAdapter.generatePdf(data, config);
}
```

### 7. 創建統一對話框組件

```typescript
// UnifiedYourReportDialog.tsx
export function UnifiedYourReportDialog({ isOpen, onClose }) {
  const { generateReport } = useReportGeneration('your-report-id');
  // ... 實現邏輯
}
```

## 測試檢查清單

- [ ] 過濾器功能正常
- [ ] PDF 格式與原版完全一致
- [ ] Excel 格式與原版完全一致
- [ ] 數據查詢結果正確
- [ ] 性能無明顯下降
- [ ] 錯誤處理正常

## 注意事項

1. **保持向後兼容**：使用 `useLegacyStyles: true` 確保格式不變
2. **逐步遷移**：保留原有報表功能，驗證後再切換
3. **完整測試**：使用測試頁面對比新舊輸出
4. **文檔更新**：記錄任何特殊處理或限制

## 常見問題

### Q: 如何處理特殊的報表格式？
A: 創建專用的舊版生成器，完全複製現有邏輯。

### Q: 數據源如何處理複雜查詢？
A: 可以直接複製現有的查詢邏輯，或創建 RPC 函數優化性能。

### Q: 如何確保格式完全一致？
A: 使用 `useLegacyStyles: true` 並創建專用的舊版生成器。

## 已遷移報表範例

1. **Void Pallet Report**
   - 配置：`voidPalletReport.ts`
   - 數據源：`VoidPalletDataSource.ts`
   - 舊版生成器：`LegacyPdfGenerator.ts`

2. **Order Loading Report**
   - 配置：`orderLoadingReport.ts`
   - 數據源：`OrderLoadingDataSource.ts`
   - 舊版生成器：`LegacyOrderLoadingPdfGenerator.ts`
