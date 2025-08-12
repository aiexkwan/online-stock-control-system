# Vercel Puppeteer 部署指南

## 部署配置

### 1. 依賴配置
```json
// package.json
{
  "dependencies": {
    "puppeteer": "^24.12.1"
  }
}
```

### 2. Next.js 配置
```js
// next.config.js
module.exports = {
  serverExternalPackages: ['puppeteer']
}
```

### 3. Vercel 配置
```json
// vercel.json
{
  "functions": {
    "app/api/print-label-pdf/route.tsx": {
      "maxDuration": 30
    }
  },
  "env": {
    "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true",
    "PUPPETEER_EXECUTABLE_PATH": "/usr/bin/google-chrome-stable"
  }
}
```

### 4. 環境變數
在 Vercel Dashboard 設置：
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable`

## 最佳實踐

### 1. 錯誤處理
- 動態導入 Puppeteer
- 優雅降級處理
- 詳細錯誤日誌

### 2. 性能優化
- 設置適當的超時時間
- 使用最佳的 Chrome 參數
- 實施連線池（如需要）

### 3. 監控
- 實施性能監控
- 記錄 PDF 生成統計
- 設置警報和通知

## 故障排除

### 常見問題
1. **Module not found**: 確保 Puppeteer 在 dependencies 中
2. **Chrome not found**: 檢查 PUPPETEER_EXECUTABLE_PATH
3. **Timeout errors**: 調整 maxDuration 設置

### 替代方案
如果 Puppeteer 在 Vercel 上持續出現問題，考慮：
1. 使用 Playwright（更好的 serverless 支持）
2. 使用外部 PDF 服務（如 PDFShift, HTML/CSS to PDF API）
3. 客戶端 PDF 生成（jsPDF + html2canvas）