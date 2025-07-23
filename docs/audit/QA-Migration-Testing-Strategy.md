# GraphQL → REST API 遷移測試策略
**QA專家 - 完整遷移品質保證計劃**

---

## 📋 測試策略概述

### 測試目標
1. **功能一致性** - 確保 GraphQL 同 REST API 返回相同結果
2. **性能非回歸** - 驗證 REST API 性能不低於 GraphQL 
3. **資料完整性** - 保證遷移過程中資料無遺失或損壞
4. **用戶體驗連續性** - 確保前端功能無感知切換
5. **錯誤處理強化** - 驗證 fallback 機制運作正常

### 高風險組件識別
- **InventoryOrderedAnalysisWidget** - 複雜庫存分析計算
- **HistoryTreeV2** - 歷史記錄樹狀結構
- **Dashboard API** - 核心資料聚合端點
- **Real-time 更新** - WebSocket 同 polling 混合機制

---

## 🏗️ 五層測試架構

### Layer 1: 單元測試層 (Unit Tests)
**框架**: Jest + @testing-library/react
**覆蓋率目標**: >80% for API adapters

```typescript
// 測試重點
✅ API Response Mappers
✅ Data Transformation Logic  
✅ Error Handling Functions
✅ Cache Mechanisms
✅ Type Safety Validation

// 示例測試結構
describe('InventoryAnalysisMapper', () => {
  it('should convert GraphQL response to REST format', () => {
    // GraphQL → REST 轉換測試
  });
  
  it('should handle missing fields gracefully', () => {
    // 缺失欄位處理測試
  });
});
```

### Layer 2: API 一致性測試層 (API Consistency)
**框架**: Jest + Supertest
**測試頻率**: 每次 deployment

```typescript
// GraphQL vs REST 對比測試
describe('API Migration Consistency', () => {
  const testCases = [
    {
      name: 'inventory_ordered_analysis',
      graphql: INVENTORY_ANALYSIS_QUERY,
      restEndpoint: '/api/dashboard/widgets/inventory-analysis',
      compareFields: ['products', 'summary', 'metadata']
    },
    {
      name: 'history_tree_data', 
      graphql: HISTORY_TREE_QUERY,
      restEndpoint: '/api/dashboard/widgets/history-tree',
      compareFields: ['nodes', 'relationships', 'timestamp']
    }
  ];

  testCases.forEach(testCase => {
    it(`${testCase.name} should return consistent data`, async () => {
      const graphqlResult = await executeGraphQL(testCase.graphql);
      const restResult = await request(app).get(testCase.restEndpoint);
      
      // 深度對比關鍵欄位
      expect(normalizeGraphQLResponse(graphqlResult))
        .toEqual(normalizeRESTResponse(restResult.body));
    });
  });
});
```

### Layer 3: 整合測試層 (Integration Tests)  
**框架**: Jest + Test Database
**資料隔離**: 每個測試使用獨立 schema

```typescript
// 資料完整性驗證
describe('Data Integrity Validation', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  it('should maintain data consistency during migration', async () => {
    // 1. 記錄遷移前狀態
    const preMigrationState = await captureDataSnapshot();
    
    // 2. 執行遷移操作  
    await triggerMigration();
    
    // 3. 驗證資料完整性
    const postMigrationState = await captureDataSnapshot();
    expect(postMigrationState.recordCount).toBe(preMigrationState.recordCount);
    expect(postMigrationState.checksum).toBe(preMigrationState.checksum);
  });

  it('should handle concurrent operations safely', async () => {
    // 並發操作測試
    const operations = [
      () => createInventoryRecord(),
      () => updateOrderStatus(), 
      () => generateAnalysisReport()
    ];
    
    await Promise.all(operations.map(op => op()));
    // 驗證資料一致性
  });
});
```

### Layer 4: E2E 測試層 (End-to-End Tests)
**框架**: Playwright + 真實瀏覽器環境
**測試覆蓋**: 關鍵用戶流程

```typescript
// 用戶體驗連續性測試
describe('Migration E2E Testing', () => {
  test('Dashboard widgets should load correctly after migration', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // 等待 InventoryOrderedAnalysisWidget 載入
    await page.waitForSelector('[data-testid="inventory-analysis-widget"]');
    
    // 驗證資料顯示
    const stockData = await page.textContent('.stock-summary');
    expect(stockData).toContain('Total Stock:');
    
    // 驗證交互功能
    await page.click('[data-testid="filter-dropdown"]');
    await page.selectOption('select[name="productType"]', 'electronics');
    
    // 等待篩選結果
    await page.waitForTimeout(2000);
    const filteredResults = await page.$$('.product-item');
    expect(filteredResults.length).toBeGreaterThan(0);
  });

  test('Real-time updates should work seamlessly', async ({ page }) => {
    // 開啟兩個 tab 測試即時更新
    const page2 = await page.context().newPage();
    
    await page.goto('/admin/dashboard');
    await page2.goto('/admin/inventory');
    
    // 在 page2 更新庫存
    await page2.fill('[data-testid="stock-input"]', '100');
    await page2.click('[data-testid="update-stock"]');
    
    // 驗證 page1 即時更新
    await page.waitForFunction(() => {
      const element = document.querySelector('.stock-count');
      return element?.textContent?.includes('100');
    }, { timeout: 10000 });
  });
});
```

### Layer 5: 性能監控層 (Performance Monitoring)
**框架**: Playwright Performance + Custom Metrics
**監控指標**: Response Time, Throughput, Error Rate

```typescript
// 性能回歸測試
describe('Performance Regression Testing', () => {
  const performanceThresholds = {
    inventoryAnalysis: {
      maxResponseTime: 2000, // 2秒
      minThroughput: 50, // 50 requests/sec
      maxErrorRate: 0.01 // 1%
    },
    historyTree: {
      maxResponseTime: 1500,
      minThroughput: 100, 
      maxErrorRate: 0.005
    }
  };

  test('REST API should meet performance requirements', async () => {
    const startTime = Date.now();
    const responses = [];
    
    // 並發測試
    for (let i = 0; i < 100; i++) {
      responses.push(
        fetch('/api/dashboard/widgets/inventory-analysis')
          .then(r => ({ status: r.status, time: Date.now() - startTime }))
      );
    }
    
    const results = await Promise.all(responses);
    const avgResponseTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const errorRate = results.filter(r => r.status >= 400).length / results.length;
    
    expect(avgResponseTime).toBeLessThan(performanceThresholds.inventoryAnalysis.maxResponseTime);
    expect(errorRate).toBeLessThan(performanceThresholds.inventoryAnalysis.maxErrorRate);
  });
});
```

---

## 📊 監控和警告機制

### 實時性能監控
```typescript
// Performance Dashboard 整合
class MigrationPerformanceMonitor {
  private metrics = new Map();
  
  async captureMetrics(endpoint: string) {
    const start = performance.now();
    try {
      const response = await fetch(endpoint);
      const duration = performance.now() - start;
      
      this.metrics.set(endpoint, {
        responseTime: duration,
        status: response.status,
        timestamp: new Date()
      });
      
      // 警告機制
      if (duration > PERFORMANCE_THRESHOLD) {
        await this.sendAlert(`Performance degradation detected: ${endpoint}`);
      }
    } catch (error) {
      await this.sendAlert(`API failure: ${endpoint} - ${error.message}`);
    }
  }
  
  async sendAlert(message: string) {
    // 整合 Slack/Email 通知
    await notificationService.send({
      channel: '#dev-alerts',
      message: `🚨 Migration Alert: ${message}`,
      severity: 'high'
    });
  }
}
```

### 錯誤監控和回滾觸發
```typescript
// 錯誤率監控
class ErrorRateMonitor {
  private errorCount = 0;
  private totalRequests = 0;
  
  recordRequest(success: boolean) {
    this.totalRequests++;
    if (!success) this.errorCount++;
    
    const errorRate = this.errorCount / this.totalRequests;
    
    // 錯誤率超過 5% 自動回滾
    if (errorRate > 0.05 && this.totalRequests > 100) {
      this.triggerRollback('High error rate detected');
    }
  }
  
  async triggerRollback(reason: string) {
    console.error(`🔴 ROLLBACK TRIGGERED: ${reason}`);
    // 執行回滾程序
    await rollbackService.execute();
    await this.sendEmergencyAlert(reason);
  }
}
```

---

## ✅ 手動測試檢查清單

### 🎯 高風險功能驗證

#### InventoryOrderedAnalysisWidget
- [ ] **資料準確性**
  - [ ] 庫存數量計算正確
  - [ ] 訂單需求統計準確  
  - [ ] 滿足率計算無誤
  - [ ] 產品篩選功能正常

- [ ] **實時更新**
  - [ ] StockTypeSelector 事件監聽正常
  - [ ] AdminRefresh 觸發重新載入
  - [ ] 資料變更即時反映

- [ ] **視覺呈現**
  - [ ] Progress bar 顯示正確
  - [ ] 顏色編碼符合邏輯 (綠色=充足, 紅色=不足)
  - [ ] 骨架屏載入流暢
  - [ ] 響應式設計適配

#### HistoryTreeV2  
- [ ] **基本功能**
  - [ ] 編輯模式正確顯示
  - [ ] 樹狀結構渲染正常
  - [ ] 無 Next.js 15 錯誤

- [ ] **樣式和布局**
  - [ ] 暗色主題正確應用
  - [ ] 版面配置無破版
  - [ ] 內容可讀性良好

### 🔄 跨瀏覽器兼容性
- [ ] **桌面瀏覽器**
  - [ ] Chrome/Chromium (>90%)
  - [ ] Firefox (>90%) 
  - [ ] Safari (>14%)
  - [ ] Edge (>90%)

- [ ] **移動設備**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Samsung Internet

### 📱 響應式測試
- [ ] **視窗尺寸**
  - [ ] 1920x1080 (桌面)
  - [ ] 1366x768 (筆電)
  - [ ] 768x1024 (平板)
  - [ ] 375x667 (手機)

---

## 🚨 回滾標準和程序

### 自動回滾觸發條件
1. **錯誤率 > 5%** (100+ requests sample)
2. **平均響應時間 > 3秒** (連續 10 分鐘)
3. **可用性 < 95%** (5分鐘內)
4. **資料不一致檢測** (checksum 不匹配)

### 回滾執行程序
```bash
# 1. 緊急停用 REST API
npm run migration:disable-rest

# 2. 恢復 GraphQL endpoints
npm run migration:enable-graphql

# 3. 清理快取
npm run cache:clear

# 4. 重啟服務
npm run restart:production

# 5. 驗證回滾成功
npm run test:rollback-verification
```

### 回滾驗證清單  
- [ ] GraphQL endpoints 正常回應
- [ ] Widget 資料載入正確
- [ ] 用戶會話保持有效
- [ ] 快取一致性恢復
- [ ] 監控指標正常

---

## 🎯 測試執行時程

### Phase 1: 準備階段 (2天)
- [x] 測試環境建置
- [ ] 測試資料準備
- [ ] 自動化腳本開發
- [ ] 監控系統配置

### Phase 2: 基礎測試 (3天)
- [ ] 單元測試執行
- [ ] API 一致性驗證
- [ ] 資料完整性檢查
- [ ] 基本功能測試

### Phase 3: 壓力測試 (2天)  
- [ ] 性能基準測試
- [ ] 併發負載測試
- [ ] 錯誤場景測試
- [ ] 回滾程序驗證

### Phase 4: 用戶驗收 (2天)
- [ ] E2E 流程測試
- [ ] 跨瀏覽器測試
- [ ] 移動設備測試
- [ ] 業務場景驗證

### Phase 5: 上線準備 (1天)
- [ ] 最終驗證測試
- [ ] 監控系統就位
- [ ] 回滾程序確認
- [ ] 團隊培訓完成

---

## 📈 成功指標

### 功能性指標
- ✅ **API 一致性**: 100% 關鍵欄位匹配
- ✅ **資料完整性**: 0% 資料遺失
- ✅ **功能覆蓋**: 100% 現有功能保持

### 性能指標
- ✅ **響應時間**: ≤ GraphQL baseline + 10%
- ✅ **吞吐量**: ≥ GraphQL baseline - 5%
- ✅ **錯誤率**: < 1%

### 用戶體驗指標
- ✅ **頁面載入**: < 3秒 (P95)
- ✅ **互動響應**: < 200ms
- ✅ **可用性**: > 99.5%

---

## 💡 QA 專家建議

### 關鍵風險緩解
1. **漸進式切換** - 按 widget 分批遷移，降低影響範圍
2. **特徵開關** - 使用 feature flags 控制 API 切換
3. **監控先行** - 在遷移前建立完整監控體系
4. **雙寫方案** - 短期內同時維護兩套 API 確保穩定性

### 長期品質保證
1. **自動化優先** - 90% 測試案例自動化執行
2. **持續監控** - 建立 SLA 監控和告警機制  
3. **定期審查** - 每月進行性能基準比較
4. **文檔維護** - 保持測試案例同代碼同步更新

---

**文檔版本**: v1.0.0  
**最後更新**: 2025-07-23  
**負責人**: QA專家  
**審查週期**: 每週  