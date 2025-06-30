# xlsx 到 ExcelJS 遷移計畫

## 執行摘要

由於 xlsx 函式庫存在 3 個高嚴重性安全漏洞（原型污染和 ReDoS 攻擊），我們需要將所有基於 xlsx 的報表生成遷移到 ExcelJS。ExcelJS 不僅更安全，還提供更豐富的格式化功能。

## 安全漏洞

```bash
# npm audit 報告
xlsx  *
嚴重性：高
- sheetJS 中的原型污染 - GHSA-4r6h-8v6p-xvw6
- SheetJS 正則表達式拒絕服務攻擊 (ReDoS) - GHSA-5pgg-2g8v-p4x9
無修復版本可用
```

## 技術評估

### 相容性分析

 | 平台 | xlsx | ExcelJS | 風險評估 |
|----------|------|---------|-----------------|
| Node.js | ✅ | ✅ | 無風險 |
| Vercel | ✅ | ✅ 已驗證 | 無風險 |
| 套件大小 | ~400KB | ~1MB | 可接受 |
| 記憶體使用量 | 低 | 中等 | 在 Vercel 1GB 限制內 |

### 功能比較

| 功能 | xlsx | ExcelJS | 優勢 |
|---------|------|---------|-----------|
| 基本讀寫 | ✅ | ✅ | 相同 |
| 樣式設定 | ❌ | ✅ | ExcelJS 更佳 |
| 公式支援 | 有限 | 完整 | ExcelJS 更佳 |
| 串流處理 | ❌ | ✅ | ExcelJS 更高效 |
| 文檔 | 一般 | 優秀 | ExcelJS 更佳 |
| 社群支援 | 有限 | 活躍 | ExcelJS 更佳 |

## 需要遷移的檔案

### 第一階段（高優先級）
1. **通用 Excel 生成器**
   - 檔案：`/app/components/reports/generators/ExcelGenerator.ts`
   - 影響：所有動態報表生成
   - 複雜度：高

2. **匯出所有資料**
   - 檔案：`/app/api/reports/export-all/route.ts`
   - 影響：系統資料備份功能
   - 複雜度：中等

### 第二階段（中等優先級）
3. **訂單裝載報表**
   - 檔案：`/app/order-loading/services/loadingReportService.ts`
   - 影響：訂單裝載功能
   - 複雜度：中等

4. **作廢棧板報表**
   - 檔案：`/app/void-pallet/services/voidReportService.ts`
   - 影響：作廢棧板功能
   - 複雜度：中等

### 第三階段（低優先級）
5. **庫存盤點報表**
   - 檔案：`/app/api/reports/stock-take/route.ts`
   - 影響：庫存盤點功能
   - 複雜度：低

6. **交易報表**
   - 檔案：`/app/api/reports/transaction/route.ts`
   - 影響：倉庫轉移記錄
   - 複雜度：低

## 遷移範例

### 主要 API 變更

```typescript
// === 1. 匯入方式 ===
// 舊版 (xlsx)
import * as XLSX from 'xlsx';

// 新版 (ExcelJS)
import ExcelJS from 'exceljs';
// 或動態匯入（建議用於 API 路由）
const ExcelJS = await import('exceljs');

// === 2. 建立工作簿 ===
// 舊版
const workbook = XLSX.utils.book_new();

// 新版
const workbook = new ExcelJS.Workbook();

// === 3. 建立工作表 ===
// 舊版
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

// 新版
const worksheet = workbook.addWorksheet('Sheet1');
data.forEach(row => {
  worksheet.addRow(row);
});

// === 4. 設定欄寬 ===
// 舊版
worksheet['!cols'] = [
  { wch: 15 },
  { wch: 25 }
];

// 新版
worksheet.columns = [
  { width: 15 },
  { width: 25 }
];

// === 5. 合併儲存格 ===
// 舊版
worksheet['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
];

// 新版
worksheet.mergeCells('A1:D1');
// 或
worksheet.mergeCells(1, 1, 1, 4);

// === 6. 輸出檔案 ===
// 舊版
const buffer = XLSX.write(workbook, { 
  type: 'array',
  bookType: 'xlsx' 
});

// 新版
const buffer = await workbook.xlsx.writeBuffer();
```

### ExcelJS 進階功能

```typescript
// 樣式設定（xlsx 不支援）
const cell = worksheet.getCell('A1');
cell.font = { 
  size: 16, 
  bold: true, 
  color: { argb: 'FF0066CC' } 
};
cell.alignment = { 
  vertical: 'middle', 
  horizontal: 'center' 
};
cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFCCCCCC' }
};

// 邊框樣式
cell.border = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};

// 列高度
worksheet.getRow(1).height = 30;

// 公式支援
worksheet.getCell('C3').value = { formula: 'SUM(A1:B2)' };
```

## 實施步驟

### 第一階段：準備工作（1 天）
1. 建立測試環境
2. 建立遷移輔助函數
3. 準備測試資料集

### 第二階段：核心遷移（3-4 天）
1. 遷移通用 Excel 生成器
2. 遷移匯出所有功能
3. 建立向後相容性層

### 第三階段：功能遷移（2-3 天）
1. 遷移訂單裝載報表
2. 遷移作廢棧板報表
3. 遷移庫存盤點報表
4. 遷移交易報表

### 第四階段：測試與驗證（2 天）
1. 對所有遷移函數進行單元測試
2. 比較新舊報表輸出
3. 使用者驗收測試
4. 效能基準測試

### 第五階段：部署（1 天）
1. 分段部署到生產環境
2. 監控錯誤日誌
3. 收集使用者回饋
4. 移除 xlsx 依賴

## 風險管理

### 主要風險
1. **API 不相容**
   - 緩解措施：建立相容性層
   - 監控：詳細測試每個函數

2. **格式差異**
   - 緩解措施：仔細比較輸出
   - 監控：使用者回饋

3. **效能影響**
   - 緩解措施：使用串流 API
   - 監控：效能指標

### 回滾計畫
1. 保留舊程式碼分支
2. 功能旗標控制
3. 快速切換機制

## 預期效益

1. **安全性提升**
   - 消除 3 個高嚴重性漏洞
   - 提升系統安全評分

2. **功能增強**
   - 支援更豐富的樣式選項
   - 更好的公式支援
   - 大檔案串流處理

3. **維護性改善**
   - 統一的 Excel 處理函式庫
   - 更好的文檔支援
   - 活躍的社群支援

4. **長期效益**
   - 減少技術債務
   - 提升程式碼品質
   - 更容易的未來擴展

## 成功指標

1. **技術指標**
   - 零安全漏洞
   - 報表生成時間 ≤ 原始時間 +10%
   - 記憶體使用量 ≤ 原始用量 +20%

2. **業務指標**
   - 所有報表功能正常運作
   - 格式一致性維持
   - 無縫使用者遷移

3. **品質指標**
   - 測試覆蓋率 > 90%
   - 零生產環境事故
   - 程式碼審查通過

## 時程表

| 階段 | 日期 | 負責人 | 狀態 |
|-------|------|-------|--------|
| 準備工作 | 2025-01-02 | 待定 | 待處理 |
| 核心遷移 | 2025-01-03 至 01-06 | 待定 | 待處理 |
| 功能遷移 | 2025-01-07 至 01-09 | 待定 | 待處理 |
| 測試與驗證 | 2025-01-10 至 01-11 | 待定 | 待處理 |
| 部署 | 2025-01-12 | 待定 | 待處理 |

## 結論

從 xlsx 遷移到 ExcelJS 是一個必要且可行的升級。雖然需要開發工作，但從長遠來看，它將顯著提升系統安全性、功能性和可維護性。我們建議盡快開始這個遷移工作。

---

文檔版本：1.0  
最後更新：2025-01-01  
作者：Claude 助理  
狀態：待核准
