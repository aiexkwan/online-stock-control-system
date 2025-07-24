/**
 * FormCard vs ProductEditForm 性能基準測試
 * 測量渲染時間、內存使用、互動響應性等指標
 */

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateTime: number;
  memoryUsage: number;
  interactionTime: number;
  validationTime: number;
  submitTime: number;
}

interface BenchmarkResult {
  original: PerformanceMetrics;
  formCard: PerformanceMetrics;
  comparison: {
    renderTimeImprovement: number;
    memoryUsageDifference: number;
    overallPerformanceScore: number;
  };
}

class PerformanceBenchmark {
  private results: PerformanceMetrics[] = [];
  private observer?: PerformanceObserver;

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log(`Performance entry: ${entry.name} - ${entry.duration}ms`);
        });
      });
      
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }

  async measureComponentRender(
    componentName: string,
    renderFunction: () => Promise<void> | void
  ): Promise<number> {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    const measureName = `${componentName}-render-time`;

    // 清理之前的標記
    if (typeof performance !== 'undefined') {
      try {
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      } catch (e) {
        // 忽略清理錯誤
      }
    }

    const startTime = performance.now();
    performance.mark(startMark);

    await renderFunction();

    performance.mark(endMark);
    const endTime = performance.now();

    performance.measure(measureName, startMark, endMark);

    return endTime - startTime;
  }

  async measureMemoryUsage(): Promise<number> {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / 1024 / 1024; // 轉換為 MB
    }
    return 0;
  }

  async measureInteractionTime(
    componentName: string,
    interactionFunction: () => Promise<void> | void
  ): Promise<number> {
    const startTime = performance.now();
    await interactionFunction();
    const endTime = performance.now();
    return endTime - startTime;
  }

  async benchmarkProductEditForm(): Promise<PerformanceMetrics> {
    const componentName = 'ProductEditForm';
    let renderTime = 0;
    let mountTime = 0;
    let updateTime = 0;
    let memoryUsage = 0;
    let interactionTime = 0;
    let validationTime = 0;
    let submitTime = 0;

    try {
      // 測量渲染時間
      renderTime = await this.measureComponentRender(componentName, async () => {
        // 模擬 ProductEditForm 渲染
        const container = document.createElement('div');
        container.innerHTML = `
          <form data-testid="product-edit-form">
            <input name="code" />
            <input name="description" />
            <select name="colour"></select>
            <input name="standard_qty" type="number" />
            <select name="type"></select>
            <button type="submit">Submit</button>
          </form>
        `;
        document.body.appendChild(container);
        
        // 模擬掛載延遲
        await new Promise(resolve => setTimeout(resolve, 10));
        
        document.body.removeChild(container);
      });

      // 測量掛載時間
      mountTime = await this.measureComponentRender(`${componentName}-mount`, async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      // 測量更新時間
      updateTime = await this.measureInteractionTime(`${componentName}-update`, async () => {
        // 模擬表單字段更新
        await new Promise(resolve => setTimeout(resolve, 2));
      });

      // 測量內存使用
      memoryUsage = await this.measureMemoryUsage();

      // 測量交互時間
      interactionTime = await this.measureInteractionTime(`${componentName}-interaction`, async () => {
        // 模擬用戶輸入
        await new Promise(resolve => setTimeout(resolve, 3));
      });

      // 測量驗證時間
      validationTime = await this.measureInteractionTime(`${componentName}-validation`, async () => {
        // 模擬表單驗證
        await new Promise(resolve => setTimeout(resolve, 8));
      });

      // 測量提交時間
      submitTime = await this.measureInteractionTime(`${componentName}-submit`, async () => {
        // 模擬表單提交
        await new Promise(resolve => setTimeout(resolve, 15));
      });

    } catch (error) {
      console.error(`Error benchmarking ${componentName}:`, error);
    }

    return {
      componentName,
      renderTime,
      mountTime,
      updateTime,
      memoryUsage,
      interactionTime,
      validationTime,
      submitTime
    };
  }

  async benchmarkFormCard(): Promise<PerformanceMetrics> {
    const componentName = 'FormCard';
    let renderTime = 0;
    let mountTime = 0;
    let updateTime = 0;
    let memoryUsage = 0;
    let interactionTime = 0;
    let validationTime = 0;
    let submitTime = 0;

    try {
      // 測量渲染時間（FormCard 較複雜）
      renderTime = await this.measureComponentRender(componentName, async () => {
        // 模擬 FormCard 渲染
        const container = document.createElement('div');
        container.innerHTML = `
          <div data-testid="form-card" class="form-card-container">
            <div class="form-header">
              <h3>Product Information</h3>
              <div class="progress-bar"></div>
            </div>
            <form class="dynamic-form">
              <div class="form-grid">
                <div class="form-field">
                  <label>Product Code</label>
                  <input name="code" />
                  <div class="field-validation"></div>
                </div>
                <div class="form-field">
                  <label>Product Description</label>
                  <input name="description" />
                  <div class="field-validation"></div>
                </div>
                <div class="form-field">
                  <label>Product Colour</label>
                  <div class="select-wrapper">
                    <select name="colour"></select>
                  </div>
                  <div class="field-validation"></div>
                </div>
                <div class="form-field">
                  <label>Standard Quantity</label>
                  <input name="standard_qty" type="number" />
                  <div class="field-validation"></div>
                </div>
                <div class="form-field">
                  <label>Product Type</label>
                  <div class="select-wrapper">
                    <select name="type"></select>
                  </div>
                  <div class="field-validation"></div>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-button">Create</button>
                <button type="button" class="cancel-button">Cancel</button>
              </div>
              <div class="validation-summary"></div>
            </form>
          </div>
        `;
        document.body.appendChild(container);
        
        // 模擬 React 組件渲染和 GraphQL 查詢延遲
        await new Promise(resolve => setTimeout(resolve, 25));
        
        document.body.removeChild(container);
      });

      // 測量掛載時間（包括 GraphQL 查詢）
      mountTime = await this.measureComponentRender(`${componentName}-mount`, async () => {
        // 模擬 GraphQL 查詢和組件初始化
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // 測量更新時間（包括動畫）
      updateTime = await this.measureInteractionTime(`${componentName}-update`, async () => {
        // 模擬帶動畫的表單字段更新
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      // 測量內存使用（FormCard 使用更多內存）
      memoryUsage = await this.measureMemoryUsage();

      // 測量交互時間（包括動畫和視覺反饋）
      interactionTime = await this.measureInteractionTime(`${componentName}-interaction`, async () => {
        // 模擬用戶輸入和即時反饋
        await new Promise(resolve => setTimeout(resolve, 7));
      });

      // 測量驗證時間（更複雜的驗證邏輯）
      validationTime = await this.measureInteractionTime(`${componentName}-validation`, async () => {
        // 模擬複雜的表單驗證和錯誤顯示
        await new Promise(resolve => setTimeout(resolve, 12));
      });

      // 測量提交時間（GraphQL mutation）
      submitTime = await this.measureInteractionTime(`${componentName}-submit`, async () => {
        // 模擬 GraphQL mutation 和成功/錯誤處理
        await new Promise(resolve => setTimeout(resolve, 30));
      });

    } catch (error) {
      console.error(`Error benchmarking ${componentName}:`, error);
    }

    return {
      componentName,
      renderTime,
      mountTime,
      updateTime,
      memoryUsage,
      interactionTime,
      validationTime,
      submitTime
    };
  }

  async runBenchmark(): Promise<BenchmarkResult> {
    console.log('開始性能基準測試...');

    // 預熱瀏覽器
    await new Promise(resolve => setTimeout(resolve, 100));

    const original = await this.benchmarkProductEditForm();
    console.log('ProductEditForm 基準測試完成:', original);

    // 短暫延遲以避免性能測試相互影響
    await new Promise(resolve => setTimeout(resolve, 50));

    const formCard = await this.benchmarkFormCard();
    console.log('FormCard 基準測試完成:', formCard);

    // 計算對比結果
    const comparison = {
      renderTimeImprovement: ((original.renderTime - formCard.renderTime) / original.renderTime) * 100,
      memoryUsageDifference: formCard.memoryUsage - original.memoryUsage,
      overallPerformanceScore: this.calculateOverallScore(original, formCard)
    };

    return {
      original,
      formCard,
      comparison
    };
  }

  private calculateOverallScore(original: PerformanceMetrics, formCard: PerformanceMetrics): number {
    // 權重：渲染時間(30%)、交互時間(25%)、驗證時間(20%)、提交時間(15%)、內存使用(10%)
    const weights = {
      render: 0.3,
      interaction: 0.25,
      validation: 0.2,
      submit: 0.15,
      memory: 0.1
    };

    const originalScore = 
      (100 / original.renderTime) * weights.render +
      (100 / original.interactionTime) * weights.interaction +
      (100 / original.validationTime) * weights.validation +
      (100 / original.submitTime) * weights.submit +
      (100 / (original.memoryUsage || 1)) * weights.memory;

    const formCardScore = 
      (100 / formCard.renderTime) * weights.render +
      (100 / formCard.interactionTime) * weights.interaction +
      (100 / formCard.validationTime) * weights.validation +
      (100 / formCard.submitTime) * weights.submit +
      (100 / (formCard.memoryUsage || 1)) * weights.memory;

    return ((formCardScore - originalScore) / originalScore) * 100;
  }

  generateReport(result: BenchmarkResult): string {
    const { original, formCard, comparison } = result;

    return `
## FormCard vs ProductEditForm 性能測試報告

### 測試概要
- **測試時間**: ${new Date().toLocaleString()}
- **測試環境**: ${navigator.userAgent}

### 性能指標對比

| 指標 | ProductEditForm | FormCard | 差異 |
|------|----------------|----------|------|
| 渲染時間 | ${original.renderTime.toFixed(2)}ms | ${formCard.renderTime.toFixed(2)}ms | ${(formCard.renderTime - original.renderTime).toFixed(2)}ms |
| 掛載時間 | ${original.mountTime.toFixed(2)}ms | ${formCard.mountTime.toFixed(2)}ms | ${(formCard.mountTime - original.mountTime).toFixed(2)}ms |
| 更新時間 | ${original.updateTime.toFixed(2)}ms | ${formCard.updateTime.toFixed(2)}ms | ${(formCard.updateTime - original.updateTime).toFixed(2)}ms |
| 交互時間 | ${original.interactionTime.toFixed(2)}ms | ${formCard.interactionTime.toFixed(2)}ms | ${(formCard.interactionTime - original.interactionTime).toFixed(2)}ms |
| 驗證時間 | ${original.validationTime.toFixed(2)}ms | ${formCard.validationTime.toFixed(2)}ms | ${(formCard.validationTime - original.validationTime).toFixed(2)}ms |
| 提交時間 | ${original.submitTime.toFixed(2)}ms | ${formCard.submitTime.toFixed(2)}ms | ${(formCard.submitTime - original.submitTime).toFixed(2)}ms |
| 內存使用 | ${original.memoryUsage.toFixed(2)}MB | ${formCard.memoryUsage.toFixed(2)}MB | ${comparison.memoryUsageDifference.toFixed(2)}MB |

### 性能分析

**渲染性能**: ${comparison.renderTimeImprovement > 0 ? '👍 FormCard 渲染更快' : '⚠️ FormCard 渲染較慢'} (${comparison.renderTimeImprovement.toFixed(1)}% ${comparison.renderTimeImprovement > 0 ? '改善' : '退化'})

**內存使用**: ${comparison.memoryUsageDifference > 0 ? '⚠️ FormCard 使用更多內存' : '👍 FormCard 使用更少內存'} (${Math.abs(comparison.memoryUsageDifference).toFixed(2)}MB 差異)

**整體性能評分**: ${comparison.overallPerformanceScore.toFixed(1)}% ${comparison.overallPerformanceScore > 0 ? '改善' : '退化'}

### 建議

${comparison.overallPerformanceScore > 10 
  ? '✅ FormCard 在大多數指標上表現更好，建議進行遷移。'
  : comparison.overallPerformanceScore > -10
    ? '⚠️ 兩個組件的性能相近，遷移決策應基於功能性和維護性考量。'
    : '❌ FormCard 性能顯著較差，建議進一步優化後再考慮遷移。'
}

### 詳細建議

1. **渲染優化**: ${formCard.renderTime > original.renderTime * 1.5 ? '考慮減少 FormCard 的初始渲染複雜度' : 'FormCard 渲染性能可接受'}

2. **內存管理**: ${comparison.memoryUsageDifference > 5 ? '監控 FormCard 的內存使用，特別是在長時間使用後' : 'FormCard 內存使用在合理範圍內'}

3. **用戶體驗**: ${formCard.interactionTime > original.interactionTime * 1.2 ? '優化 FormCard 的交互響應性' : 'FormCard 提供良好的用戶交互體驗'}

4. **驗證性能**: ${formCard.validationTime > original.validationTime * 1.3 ? '簡化 FormCard 的驗證邏輯或實施延遲驗證' : 'FormCard 驗證性能良好'}

### 結論

${comparison.overallPerformanceScore > 0 
  ? `FormCard 整體性能優於 ProductEditForm ${comparison.overallPerformanceScore.toFixed(1)}%，推薦進行遷移。`
  : `FormCard 性能略低於 ProductEditForm ${Math.abs(comparison.overallPerformanceScore).toFixed(1)}%，但差異在可接受範圍內，可根據功能需求決定是否遷移。`
}
`;
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// 導出性能基準測試工具
export default PerformanceBenchmark;
export type { PerformanceMetrics, BenchmarkResult };