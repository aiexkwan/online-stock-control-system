# Order PDF Upload E2E 測試

呢個測試套件用 Puppeteer 自動化測試訂單 PDF 上傳功能，並分析 OpenAI 提取數據嘅準確性。

## 📋 功能

- 自動登入系統
- 測試所有 `public/pdf` 目錄中嘅 PDF 文件
- 捕獲 OpenAI 返回嘅提取數據
- 比較實際同期望結果
- 生成詳細測試報告（JSON 同 HTML 格式）
- 提供 OpenAI prompt 優化建議

## 🚀 運行測試

```bash
# 運行完整測試套件
npm run test:e2e:pdf

# 或者直接運行
ts-node __tests__/e2e/run-test.ts
```

## 📁 文件結構

```
__tests__/e2e/
├── order-pdf-upload.test.ts    # 主測試文件
├── run-test.ts                 # 測試運行腳本
├── config/
│   └── test-config.ts          # 測試配置
├── helpers/
│   ├── pdf-data-extractor.ts   # PDF 數據提取工具
│   └── report-generator.ts     # 報告生成器
└── reports/                    # 測試報告輸出目錄
```

## ⚙️ 配置

喺 `config/test-config.ts` 修改：

- 登入憑據
- 測試 URL
- Puppeteer 設定（headless 模式等）
- 超時設定

## 📊 測試報告

測試完成後會生成兩種報告：

1. **JSON 報告**: 包含原始測試數據
2. **HTML 報告**: 視覺化測試結果，包括：
   - 測試總結統計
   - 每個 PDF 嘅詳細結果
   - 常見錯誤統計
   - OpenAI prompt 優化建議

## 🔧 添加新嘅測試 PDF

1. 將 PDF 文件放入 `public/pdf` 目錄
2. 喺 `helpers/pdf-data-extractor.ts` 添加期望數據：

```typescript
export const expectedData: ExpectedPDFData = {
  'new-pdf.pdf': {
    orderRef: '123456',
    accountNum: 'ACC001',
    deliveryAddress: '...',
    products: [
      { code: 'PROD1', description: '...', quantity: 10 }
    ]
  }
};
```

3. 重新運行測試

## 🐛 調試

- 設置 `headless: false` 喺配置中睇到瀏覽器操作
- 使用 `slowMo` 選項減慢操作速度
- 檢查 `reports/` 目錄中嘅詳細錯誤日誌

## 💡 優化 OpenAI Prompt

根據測試報告中嘅建議，編輯 `docs/openAI_pdf_prompt` 文件：

1. 查看常見錯誤類型
2. 根據建議調整 prompt 規則
3. 重新運行測試驗證改進
4. 迭代直到達到滿意嘅準確率