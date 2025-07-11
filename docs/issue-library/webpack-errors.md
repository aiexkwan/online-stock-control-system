# Webpack Errors

呢個文件記錄所有同 webpack 相關嘅錯誤同解決方案。

## optimization.usedExports can't be used with cacheUnaffected

**錯誤訊息：**
```
[Error: optimization.usedExports can't be used with cacheUnaffected as export usage is a global effect]
```

**發生時間：** 2025-07-11

**原因：**
Next.js 14 使用 webpack 5 嘅持久化緩存功能。`usedExports` 係一個全局效應，會影響整個 bundle 嘅輸出，所以唔可以同緩存機制一齊使用。

**錯誤來源：**
喺 `next.config.js` 入面重複設定咗 `optimization.usedExports`：
1. 第 135 行單獨設定 `config.optimization.usedExports = true`
2. 第 142 行又重新定義整個 `optimization` object

**解決方案：**
移除或註釋 `usedExports` 設定。Next.js 14 默認已經啟用咗 tree shaking，唔需要手動設定。

**修改：**
```javascript
// next.config.js
config.optimization = {
  ...config.optimization,
  // 暫時註釋 usedExports 以解決 webpack cache 衝突
  // Next.js 14 默認已啟用 tree shaking，無需手動設定
  // usedExports: true,
  sideEffects: false,
  // ... 其他設定
}
```

**測試結果：**
修復後 `npm run dev` 成功運行，冇再出現錯誤。

**相關文件：**
- `/next.config.js` - 主要配置文件
- `/docs/tree-shaking-analysis.md` - Tree shaking 分析文檔
- `/docs/tree-shaking-improvements.md` - Tree shaking 優化建議

**注意事項：**
- Next.js 14 已經內建優化咗 tree shaking，一般唔需要手動設定
- 如果需要更細緻嘅控制，可以考慮使用 `swcMinify` 代替 webpack optimization
- 持久化緩存對開發效率有幫助，建議保留