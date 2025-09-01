# ProductCodeValidator 使用說明

## 概述

ProductCodeValidator 是一個高性能、安全的產品代碼驗證和豐富化服務，專為大規模庫存管理系統設計。它提供了完整的產品代碼驗證、自動修正和相似度匹配功能。

## 主要特性

### 🏗️ 架構特點

- **單例模式**：確保全應用程序唯一實例，避免資源重複
- **LRU快取**：智能快取管理，5分鐘過期時間，防止內存洩漏
- **批量處理**：支援最多100筆/批的高效批量驗證
- **高精度匹配**：使用Levenshtein距離算法，≥0.85相似度閾值

### 🛡️ 安全特性

- **SQL注入防護**：使用參數化查詢和Supabase安全層
- **內存保護**：LRU快取限制10,000條記錄，防止內存溢出
- **輸入驗證**：嚴格的數據驗證和清理
- **降級策略**：數據庫故障時的優雅降級處理

### ⚡ 性能指標

- 快取命中：< 1ms
- 批量驗證：< 100ms
- 內存使用：< 10MB
- 支援併發處理

## 快速開始

### 基本使用

```typescript
import ProductCodeValidator from '@/app/services/productCodeValidator';

// 驗證單個產品代碼
const result = await ProductCodeValidator.validateAndEnrichCodes(['ABC123']);
console.log(result.enrichedOrders[0]);
// 輸出: {
//   product_code: 'ABC123',
//   product_desc: 'Test Product ABC123',
//   is_valid: true,
//   was_corrected: false
// }

// 批量驗證
const batchResult = await ProductCodeValidator.validateAndEnrichCodes([
  'ABC123',
  'xyz789', // 將自動轉為大寫
  'abc124', // 可能被修正為 'ABC123'
  'INVALID999', // 標記為無效
]);

console.log(batchResult.summary);
// 輸出: {
//   total: 4,
//   valid: 2,
//   corrected: 1,
//   invalid: 1
// }
```

### API端點使用

```bash
# POST 驗證產品代碼
curl -X POST http://localhost:3000/api/product-code-validation \
  -H "Content-Type: application/json" \
  -d '{
    "codes": ["ABC123", "xyz789", "invalid001"],
    "options": {
      "includeCacheStats": true,
      "includeHealthCheck": false
    }
  }'

# GET 服務狀態
curl http://localhost:3000/api/product-code-validation
```

## 詳細功能

### 1. 產品代碼標準化

```typescript
// 自動處理大小寫、空格和特殊字符
const codes = [
  'abc123', // → 'ABC123'
  '  XYZ789  ', // → 'XYZ789'
  'AB-C123', // → 'AB-C123' (保留連字符)
  'AB@C123', // → 'ABC123' (移除特殊字符)
];

const result = await ProductCodeValidator.validateAndEnrichCodes(codes);
```

### 2. 相似度匹配

```typescript
// 查找相似的產品代碼
const similarCodes = ProductCodeValidator.findSimilarCodes('ABC124');
console.log(similarCodes);
// 可能返回: [
//   { code: 'ABC123', description: 'Similar Product' },
//   { code: 'ABC125', description: 'Another Similar Product' }
// ]

// 計算相似度分數
const similarity = ProductCodeValidator.calculateSimilarity('ABC123', 'ABC124');
console.log(similarity); // 0.83 (83%相似)
```

### 3. 快取管理

```typescript
// 手動刷新快取
await ProductCodeValidator.refreshCache();

// 獲取快取統計
const stats = ProductCodeValidator.getCacheStats();
console.log(stats);
// 輸出: {
//   cacheSize: 150,
//   maxCacheSize: 10000,
//   totalProductCodes: 5000,
//   lastRefresh: 1640995200000
// }
```

### 4. 健康檢查

```typescript
const health = await ProductCodeValidator.healthCheck();
console.log(health);
// 輸出: {
//   status: 'healthy', // 'healthy' | 'degraded' | 'unhealthy'
//   details: {
//     cache: { cacheSize: 150, ... },
//     database: { status: 'connected' },
//     productCodes: { status: 'loaded', count: 5000 }
//   }
// }
```

## 高級用法

### 批量處理最佳實踐

```typescript
// 處理大量數據時使用分批策略
const allCodes = ['ABC001', 'ABC002' /* ... 1000+ codes */];
const batchSize = 100;

const results = [];
for (let i = 0; i < allCodes.length; i += batchSize) {
  const batch = allCodes.slice(i, i + batchSize);
  const batchResult = await ProductCodeValidator.validateAndEnrichCodes(batch);
  results.push(...batchResult.enrichedOrders);

  // 可選：添加短暫延遲避免過載
  if (i + batchSize < allCodes.length) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
```

### 錯誤處理

```typescript
try {
  const result = await ProductCodeValidator.validateAndEnrichCodes(codes);

  // 檢查是否有需要人工處理的項目
  const needsAttention = result.enrichedOrders.filter(
    order => !order.is_valid || order.was_corrected
  );

  if (needsAttention.length > 0) {
    console.log('需要注意的項目:', needsAttention);
  }
} catch (error) {
  console.error('驗證失敗:', error.message);

  // 使用降級策略
  if (error.message.includes('Database')) {
    // 數據庫故障，使用本地快取或離線模式
  }
}
```

### 性能監控

```typescript
// 監控批量處理性能
const startTime = Date.now();
const result = await ProductCodeValidator.validateAndEnrichCodes(codes);
const processingTime = Date.now() - startTime;

console.log(`處理 ${codes.length} 個代碼耗時: ${processingTime}ms`);
console.log(`平均每個代碼: ${(processingTime / codes.length).toFixed(2)}ms`);

if (processingTime > 100) {
  console.warn('處理時間超過目標值，請考慮優化');
}
```

## 配置選項

```typescript
// 內部配置 (在 ProductCodeValidator 類中)
interface BatchProcessingConfig {
  maxBatchSize: number; // 100 - 最大批量大小
  similarityThreshold: number; // 0.85 - 相似度閾值
  cacheExpireTime: number; // 300000ms - 快取過期時間 (5分鐘)
  maxCacheSize: number; // 10000 - 最大快取條目
  queryTimeout: number; // 30000ms - 查詢超時時間
}
```

## API 回應格式

### 驗證結果

```typescript
interface ValidationResult {
  enrichedOrders: Array<{
    product_code: string; // 驗證後的產品代碼
    product_desc: string; // 產品描述
    is_valid: boolean; // 是否有效
    was_corrected: boolean; // 是否被修正
    original_code?: string; // 原始代碼 (如果被修正)
    confidence_score?: number; // 信心分數 (0-1)
  }>;
  summary: {
    total: number; // 總數
    valid: number; // 有效數量
    corrected: number; // 修正數量
    invalid: number; // 無效數量
  };
}
```

### API 回應

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    processingTime: number;
    timestamp: string;
    requestId: string;
  };
}
```

## 故障排除

### 常見問題

1. **"Batch size exceeds limit"**
   - 解決方案：將請求分成小於100個代碼的批次

2. **"Database connection failed"**
   - 解決方案：檢查Supabase連接配置，系統會自動降級

3. **"Cache refresh failed"**
   - 解決方案：手動刷新快取或重啟服務

4. **處理速度慢**
   - 檢查快取命中率
   - 考慮增加快取大小
   - 監控資料庫性能

### 日誌監控

```bash
# 查看詳細日誌
tail -f logs/app.log | grep ProductCodeValidator

# 監控性能指標
grep "processingTimeMs" logs/app.log
```

## 最佳實踐

1. **批量大小**：建議每批50-100個代碼
2. **快取策略**：在高峰期前預熱快取
3. **錯誤處理**：始終檢查降級情況
4. **監控**：設置性能和錯誤率警報
5. **測試**：使用提供的測試文件驗證功能

## 測試

```bash
# 運行基本功能測試
npm run vitest -- __tests__/services/productCodeValidator.simple.test.ts

# 運行完整測試套件 (需要數據庫連接)
npm run vitest -- __tests__/services/productCodeValidator.test.ts

# 運行完整測試和綜合測試
npm run vitest -- __tests__/services/productCodeValidator.comprehensive.test.ts
```

## 相關文件

- `app/services/productCodeValidator.ts` - 主要實現
- `app/api/product-code-validation/route.ts` - API 端點
- `__tests__/services/productCodeValidator.*.test.ts` - 測試文件
