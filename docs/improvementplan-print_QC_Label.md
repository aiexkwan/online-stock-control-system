# QC標籤打印改進計劃（基於實際代碼分析）

## 概述
基於代碼分析，QC標籤打印系統已經有完善嘅實現，使用React PDF生成210mm x 145mm標籤，支援ACO同Slate特殊產品。系統使用原子性棧板號生成同buffer pool機制。主要問題係buffer pool固定大小同缺乏實時狀態更新。

## 現有系統實際架構

### 核心組件
```
app/print-label/
├── page.tsx                        # 玻璃態設計主頁
├── components/
│   ├── PerformanceOptimizedForm.tsx # 主表單邏輯
│   ├── ProductCodeInput.tsx        # 產品代碼搜索
│   ├── AcoOrderForm.tsx            # ACO產品表單
│   ├── SlateDetailsForm.tsx        # Slate產品表單
│   └── PrintLabelPdf.tsx           # PDF組件
├── hooks/
│   ├── usePdfGeneration.tsx        # PDF生成邏輯
│   └── useStreamingPdfGeneration.tsx # 串流PDF生成
└── actions/
    └── qcActions.ts                # 數據庫操作
```

### 現有功能
- **產品代碼搜索**：實時下拉選擇
- **操作員驗證**：可選操作員/必須QC員工號
- **原子性棧板號**：`DDMMYY/XXXX` 格式
- **特殊產品處理**：
  - ACO：需要訂單號，檢查剩餘數量
  - Slate：需要批次號，特殊格式
- **PDF功能**：QR碼、批量生成、Storage上傳

### 發現嘅問題

#### 1. Buffer Pool 管理
```typescript
// 現有實現：固定50個buffer
const BUFFER_SIZE = 50;
// 無動態調整，高峰期可能不足
```

#### 2. 缺乏實時更新
```typescript
// 現有實現：無WebSocket，依賴輪詢
// 用戶看唔到其他人正在打印嘅標籤
```

#### 3. 產品識別依賴人工
```typescript
// 需要手動搜索產品代碼
// ACO/Slate產品需要人工判斷
```

#### 4. 性能瓶頸
```typescript
// V2.1修復咗部分問題，但仍有改進空間
// 特別係大批量打印時
```

## 改進方案

### 第一階段：Buffer Pool 優化（1週）

#### 1.1 動態Buffer調整
```typescript
// app/lib/qc-buffer/dynamicBufferPool.ts
export class DynamicBufferPool {
  private pools = new Map<string, PalletBuffer[]>();
  private usage = new Map<string, UsageStats>();
  
  async adjustPoolSize(date: string): Promise<void> {
    const stats = this.usage.get(date) || this.getDefaultStats();
    const predictedDemand = await this.predictDemand(date, stats);
    
    // 根據預測需求調整
    const currentSize = this.pools.get(date)?.length || 0;
    const targetSize = Math.min(
      Math.max(predictedDemand * 1.2, 20), // 最少20
      200 // 最多200
    );
    
    if (targetSize > currentSize) {
      await this.expandPool(date, targetSize - currentSize);
    } else if (targetSize < currentSize * 0.5) {
      await this.shrinkPool(date, currentSize - targetSize);
    }
  }
  
  private async predictDemand(
    date: string, 
    stats: UsageStats
  ): Promise<number> {
    // 基於歷史數據預測
    const dayOfWeek = new Date(date).getDay();
    const historicalAvg = await this.getHistoricalAverage(dayOfWeek);
    
    // 考慮趨勢
    const trend = stats.recentUsage.reduce((acc, val, idx) => 
      acc + val * (idx + 1), 0
    ) / stats.recentUsage.length;
    
    return Math.ceil(historicalAvg * (1 + trend * 0.1));
  }
}
```

#### 1.2 智能預生成
```typescript
// app/hooks/useSmartBufferGeneration.ts
export function useSmartBufferGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const preGenerateBuffers = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // 分析當前使用模式
      const patterns = await analyzeUsagePatterns();
      
      // 預生成明天嘅buffer
      const tomorrow = addDays(new Date(), 1);
      const predictions = patterns.map(p => ({
        date: format(tomorrow, 'ddMMyy'),
        count: Math.ceil(p.avgDaily * 1.3),
        priority: p.peakHours
      }));
      
      // 分批生成避免阻塞
      for (const pred of predictions) {
        await generateBufferBatch(pred);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  return { preGenerateBuffers, isGenerating };
}
```

### 第二階段：實時協作（2週）

#### 2.1 WebSocket 實時更新
```typescript
// app/components/RealtimePrintStatus.tsx
export function RealtimePrintStatus() {
  const [activePrints, setActivePrints] = useState<ActivePrint[]>([]);
  
  useEffect(() => {
    // 建立實時通道
    const channel = supabase
      .channel('qc-printing')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        updateActivePrints(state);
      })
      .on('broadcast', { event: 'print-start' }, (payload) => {
        addActivePrint(payload.print);
      })
      .on('broadcast', { event: 'print-complete' }, (payload) => {
        removeActivePrint(payload.printId);
      })
      .subscribe();
    
    // 加入presence
    channel.track({
      user: auth.user?.email,
      online_at: new Date().toISOString()
    });
    
    return () => {
      channel.unsubscribe();
    };
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 max-w-sm">
      <div className="bg-gray-900/90 backdrop-blur rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">
          正在打印 ({activePrints.length})
        </h3>
        <div className="space-y-2">
          {activePrints.map(print => (
            <ActivePrintCard key={print.id} print={print} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 協作鎖定機制
```typescript
// app/lib/qc-collaboration/printLocking.ts
export class PrintLockManager {
  private locks = new Map<string, PrintLock>();
  
  async acquireLock(
    productCode: string, 
    userId: string
  ): Promise<LockResult> {
    const existingLock = this.locks.get(productCode);
    
    if (existingLock && !this.isExpired(existingLock)) {
      return {
        success: false,
        owner: existingLock.userId,
        expiresAt: existingLock.expiresAt
      };
    }
    
    // 獲取鎖
    const lock: PrintLock = {
      productCode,
      userId,
      acquiredAt: new Date(),
      expiresAt: addMinutes(new Date(), 5)
    };
    
    this.locks.set(productCode, lock);
    
    // 廣播鎖定狀態
    await this.broadcastLockStatus(productCode, 'locked');
    
    return { success: true, lockId: lock.id };
  }
  
  async releaseLock(productCode: string, userId: string): Promise<void> {
    const lock = this.locks.get(productCode);
    
    if (lock?.userId === userId) {
      this.locks.delete(productCode);
      await this.broadcastLockStatus(productCode, 'released');
    }
  }
}
```

### 第三階段：智能產品識別（3週）

#### 3.1 產品特徵學習
```typescript
// app/lib/ml/productClassifier.ts
export class ProductClassifier {
  private model: tf.LayersModel | null = null;
  
  async loadModel(): Promise<void> {
    this.model = await tf.loadLayersModel('/models/qc-product/model.json');
  }
  
  async classifyProduct(features: ProductFeatures): Promise<Classification> {
    if (!this.model) await this.loadModel();
    
    // 提取特徵向量
    const featureVector = this.extractFeatures(features);
    
    // 預測
    const prediction = this.model!.predict(featureVector) as tf.Tensor;
    const probabilities = await prediction.data();
    
    // 解釋結果
    const classes = ['STANDARD', 'ACO', 'SLATE', 'CUSTOM'];
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    
    return {
      type: classes[maxIndex],
      confidence: probabilities[maxIndex],
      requiresSpecialHandling: ['ACO', 'SLATE'].includes(classes[maxIndex])
    };
  }
  
  private extractFeatures(features: ProductFeatures): tf.Tensor {
    // 提取產品特徵
    const vector = [
      features.code.startsWith('ACO') ? 1 : 0,
      features.code.startsWith('SLT') ? 1 : 0,
      features.hasThickness ? 1 : 0,
      features.hasCoating ? 1 : 0,
      features.hasCertification ? 1 : 0,
      // ... 更多特徵
    ];
    
    return tf.tensor2d([vector]);
  }
}
```

#### 3.2 智能表單填充
```typescript
// app/components/SmartProductForm.tsx
export function SmartProductForm({ onSubmit }) {
  const [productCode, setProductCode] = useState('');
  const [suggestion, setSuggestion] = useState<ProductSuggestion | null>(null);
  const classifier = useProductClassifier();
  
  const handleProductCodeChange = async (code: string) => {
    setProductCode(code);
    
    if (code.length >= 3) {
      // 獲取產品資訊
      const productInfo = await fetchProductInfo(code);
      
      // 分類產品
      const classification = await classifier.classify(productInfo);
      
      // 生成建議
      setSuggestion({
        type: classification.type,
        confidence: classification.confidence,
        requiredFields: getRequiredFields(classification.type),
        autoFillData: await getAutoFillData(code, classification.type)
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <ProductCodeInput
        value={productCode}
        onChange={handleProductCodeChange}
      />
      
      {suggestion && suggestion.confidence > 0.8 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-medium">
            檢測到 {suggestion.type} 產品 
            (置信度: {(suggestion.confidence * 100).toFixed(1)}%)
          </p>
          <button
            onClick={() => autoFillForm(suggestion.autoFillData)}
            className="text-blue-600 text-sm underline mt-1"
          >
            自動填充表單
          </button>
        </div>
      )}
      
      {/* 根據產品類型動態渲染表單 */}
      {suggestion?.type === 'ACO' && <AcoOrderForm />}
      {suggestion?.type === 'SLATE' && <SlateDetailsForm />}
    </div>
  );
}
```

### 第四階段：性能優化（2週）

#### 4.1 批量處理優化
```typescript
// app/lib/qc-performance/batchProcessor.ts
export class BatchPDFProcessor {
  private workerPool: Worker[] = [];
  private queue: PDFJob[] = [];
  
  constructor() {
    // 創建worker池
    const workerCount = navigator.hardwareConcurrency || 4;
    for (let i = 0; i < workerCount; i++) {
      this.workerPool.push(
        new Worker('/workers/pdf-generator.js')
      );
    }
  }
  
  async processBatch(labels: QCLabel[]): Promise<ProcessResult> {
    const startTime = performance.now();
    const chunks = this.chunkLabels(labels, this.workerPool.length);
    
    // 並行處理
    const results = await Promise.all(
      chunks.map((chunk, index) => 
        this.processChunk(chunk, this.workerPool[index])
      )
    );
    
    // 合併結果
    const mergedPDF = await this.mergePDFs(results.flat());
    
    return {
      pdf: mergedPDF,
      processTime: performance.now() - startTime,
      labelCount: labels.length
    };
  }
  
  private processChunk(
    labels: QCLabel[], 
    worker: Worker
  ): Promise<Uint8Array[]> {
    return new Promise((resolve, reject) => {
      worker.postMessage({ type: 'GENERATE_BATCH', labels });
      
      worker.onmessage = (e) => {
        if (e.data.type === 'BATCH_COMPLETE') {
          resolve(e.data.pdfs);
        } else if (e.data.type === 'ERROR') {
          reject(new Error(e.data.error));
        }
      };
    });
  }
}
```

#### 4.2 串流生成優化
```typescript
// app/hooks/useOptimizedStreaming.ts
export function useOptimizedStreaming() {
  const [progress, setProgress] = useState(0);
  const abortController = useRef<AbortController>();
  
  const generateStream = useCallback(async (
    labels: QCLabel[],
    onChunk: (chunk: Uint8Array) => void
  ) => {
    abortController.current = new AbortController();
    
    const encoder = new TextEncoder();
    const stream = new TransformStream({
      async transform(label, controller) {
        try {
          // 生成單個PDF
          const pdf = await generateSinglePDF(label);
          
          // 更新進度
          setProgress(prev => prev + (100 / labels.length));
          
          // 發送chunk
          controller.enqueue(pdf);
          onChunk(pdf);
          
          // 讓出控制權避免阻塞
          await new Promise(resolve => setTimeout(resolve, 0));
        } catch (error) {
          controller.error(error);
        }
      }
    });
    
    // 開始串流處理
    const reader = labels.stream().pipeThrough(stream).getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (abortController.current?.signal.aborted) {
          throw new Error('生成已取消');
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, []);
  
  return { generateStream, progress, abort: () => abortController.current?.abort() };
}
```

### 第五階段：生產線整合（3週）

#### 5.1 MES系統對接
```typescript
// app/lib/mes/qcIntegration.ts
export class QCMESConnector {
  private client: MESClient;
  
  async syncProductionOrder(labelData: QCLabelData): Promise<void> {
    // 獲取生產訂單
    const order = await this.client.getOrder(labelData.orderNumber);
    
    // 驗證產品信息
    if (order.productCode !== labelData.productCode) {
      throw new Error('產品代碼不匹配');
    }
    
    // 更新MES系統
    await this.client.updateQCStatus({
      orderNumber: order.number,
      qcPassed: true,
      labelGenerated: true,
      labelId: labelData.id,
      inspector: labelData.inspectorId,
      timestamp: new Date()
    });
    
    // 如果是ACO訂單，更新剩餘數量
    if (labelData.type === 'ACO') {
      await this.client.updateACORemaining({
        orderNumber: order.number,
        completed: labelData.quantity,
        remaining: order.totalQuantity - labelData.quantity
      });
    }
  }
  
  async getProductionSchedule(): Promise<Schedule[]> {
    const schedule = await this.client.getDailySchedule();
    
    return schedule.map(item => ({
      time: item.scheduledTime,
      productCode: item.productCode,
      quantity: item.plannedQuantity,
      priority: item.priority,
      specialRequirements: item.requirements
    }));
  }
}
```

#### 5.2 自動觸發打印
```typescript
// app/services/autoPrintService.ts
export class AutoPrintService {
  private triggers = new Map<string, PrintTrigger>();
  
  async setupProductionTrigger(config: TriggerConfig): Promise<void> {
    const trigger: PrintTrigger = {
      id: crypto.randomUUID(),
      productCode: config.productCode,
      condition: config.condition,
      action: config.action,
      enabled: true
    };
    
    this.triggers.set(trigger.id, trigger);
    
    // 監聽生產事件
    supabase
      .channel(`production-${config.productCode}`)
      .on('broadcast', { event: 'batch-complete' }, async (payload) => {
        if (this.evaluateCondition(trigger.condition, payload)) {
          await this.executeTrigger(trigger, payload);
        }
      })
      .subscribe();
  }
  
  private async executeTrigger(
    trigger: PrintTrigger, 
    data: any
  ): Promise<void> {
    // 自動生成標籤
    const labels = await this.generateLabelsForBatch({
      productCode: trigger.productCode,
      batchId: data.batchId,
      quantity: data.quantity
    });
    
    // 自動發送到打印機
    await this.sendToPrinter({
      labels,
      printer: trigger.action.printer || 'default',
      copies: trigger.action.copies || 1,
      priority: 'HIGH'
    });
    
    // 發送通知
    await this.notifyCompletion(trigger, labels);
  }
}
```

## 實施時間表

### 第1週：Buffer Pool優化
- [ ] 實施動態buffer調整
- [ ] 添加使用統計追蹤
- [ ] 智能預生成邏輯

### 第2-3週：實時協作
- [ ] WebSocket實時更新
- [ ] 協作鎖定機制
- [ ] 在線用戶顯示

### 第4-6週：智能識別
- [ ] 訓練產品分類模型
- [ ] 實施智能表單
- [ ] A/B測試驗證

### 第7-8週：性能優化
- [ ] Worker池批量處理
- [ ] 串流生成優化
- [ ] 內存管理改進

### 第9-11週：生產線整合
- [ ] MES系統API對接
- [ ] 自動觸發機制
- [ ] 生產排程同步

## 預期成果

### 效率提升
- Buffer利用率：50% → 85%
- 標籤生成速度：提升 60%
- 人工識別時間：30秒 → 0秒（自動）

### 質量改進
- 產品識別準確率：75% → 98%
- 錯誤率：8% → <1%
- 追溯能力：基礎 → 完整

### 協作增強
- 實時查看打印狀態
- 避免重複打印
- 生產線無縫對接

## 風險評估

### 技術風險
- ML模型準確性需要持續訓練
- WebSocket連接穩定性

### 緩解措施
- 保留人工覆核選項
- 實施自動重連機制
- 完整降級方案

## 相關資源
- 現有代碼：`/app/print-label/`
- PDF生成：`/app/print-label/hooks/usePdfGeneration.tsx`
- 數據庫操作：`/app/print-label/actions/qcActions.ts`
- 文檔：`/docs/fn_print_QC_Label.md`