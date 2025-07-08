# 盤點系統改進計劃（基於實際代碼分析）

## 概述
基於代碼分析，盤點系統已有完善嘅QR掃描功能同批量模式，位於`/app/stock-take/cycle-count/`。系統使用`jsQR`進行掃描，支援觸控數字鍵盤。主要問題係缺乏離線支援、無RFID功能，以及每次掃描都需要同步API調用導致性能瓶頸。

## 現有系統實際架構

### 核心組件
```
app/stock-take/cycle-count/
├── page.tsx                     # 主頁面
├── components/
│   ├── ScanToStart.tsx         # QR掃描介面
│   ├── ManualInput.tsx         # 手動輸入
│   ├── NumberPad.tsx           # 觸控數字鍵盤
│   ├── RemainToCount.tsx       # 剩餘數量顯示
│   └── ErrorBoundary.tsx       # 錯誤處理
└── api/
    ├── stock-count/scan/       # 掃描處理
    ├── stock-count/process/    # 盤點邏輯
    └── stock-count/validate/   # 驗證API
```

### 現有功能
- **QR掃描**：使用jsQR通過相機掃描
- **手動輸入**：支援棧板號格式 DDMMYY/X
- **批量模式**：可連續掃描多個棧板
- **防重複**：即時驗證避免重複盤點
- **移動優化**：響應式設計，大按鈕觸控友好
- **實時計算**：顯示剩餘待盤數量

### 發現嘅問題

#### 1. 無離線能力
```typescript
// 現有實現：每次掃描都需要網絡
const response = await fetch('/api/stock-count/scan', {
  method: 'POST',
  body: JSON.stringify({ code })
});
// 斷網即無法工作
```

#### 2. 性能瓶頸
```typescript
// 每個掃描都係同步API調用
// 無批量處理或背景隊列
// 導致10-15件/分鐘嘅速度限制
```

#### 3. 缺乏RFID支援
```typescript
// 只支援QR碼同手動輸入
// 無法處理RFID標籤
// 限制咗大批量盤點效率
```

#### 4. 基礎數據分析
```typescript
// 只有簡單統計
// 無預測或異常檢測
// 缺乏智能洞察
```

## 改進方案

### 第一階段：離線優先架構（2週）

#### 1.1 實施Service Worker
```typescript
// app/stock-take/service-worker.ts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('stock-count-v1').then(cache => {
      return cache.addAll([
        '/stock-take/cycle-count',
        '/api/stock-count/offline-data',
        '/assets/scanner-worker.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 離線優先策略
  if (event.request.url.includes('/api/stock-count/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 離線時使用本地處理
          return handleOfflineRequest(event.request);
        })
    );
  }
});

async function handleOfflineRequest(request: Request) {
  const { pathname } = new URL(request.url);
  
  if (pathname.includes('/scan')) {
    // 離線掃描處理
    const data = await request.json();
    await queueForSync(data);
    return new Response(JSON.stringify({ 
      success: true, 
      offline: true 
    }));
  }
}
```

#### 1.2 IndexedDB本地存儲
```typescript
// app/lib/stock-count/offlineStorage.ts
export class OfflineStorage {
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    this.db = await openDB('StockCountDB', 1, {
      upgrade(db) {
        // 產品主數據
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'code' });
        }
        
        // 棧板信息
        if (!db.objectStoreNames.contains('pallets')) {
          const palletStore = db.createObjectStore('pallets', { 
            keyPath: 'plt_num' 
          });
          palletStore.createIndex('series', 'series');
        }
        
        // 盤點記錄
        if (!db.objectStoreNames.contains('counts')) {
          const countStore = db.createObjectStore('counts', { 
            keyPath: 'id',
            autoIncrement: true
          });
          countStore.createIndex('sync_status', 'sync_status');
        }
      }
    });
  }
  
  async cacheProductData(): Promise<void> {
    // 預載入常用產品數據
    const products = await fetch('/api/products/frequent').then(r => r.json());
    const tx = this.db!.transaction('products', 'readwrite');
    
    for (const product of products) {
      await tx.objectStore('products').put(product);
    }
  }
  
  async saveOfflineCount(data: CountData): Promise<void> {
    const tx = this.db!.transaction('counts', 'readwrite');
    await tx.objectStore('counts').add({
      ...data,
      sync_status: 'pending',
      created_at: new Date(),
      device_id: getDeviceId()
    });
  }
  
  async getPendingCounts(): Promise<CountData[]> {
    const tx = this.db!.transaction('counts', 'readonly');
    const index = tx.objectStore('counts').index('sync_status');
    return await index.getAll('pending');
  }
}
```

#### 1.3 智能同步機制
```typescript
// app/hooks/useOfflineSync.ts
export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    // 監聽網絡狀態
    const handleOnline = () => {
      if (navigator.onLine) {
        startSync();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    // 定期檢查待同步數據
    const interval = setInterval(async () => {
      const pending = await storage.getPendingCounts();
      setPendingCount(pending.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);
  
  const startSync = async () => {
    setSyncStatus('syncing');
    
    try {
      const pending = await storage.getPendingCounts();
      
      // 批量同步
      const batches = chunk(pending, 50);
      
      for (const batch of batches) {
        await syncBatch(batch);
        
        // 更新狀態
        await markAsSynced(batch.map(b => b.id));
      }
      
      setSyncStatus('completed');
    } catch (error) {
      setSyncStatus('error');
      // 重試邏輯
      setTimeout(() => startSync(), 30000);
    }
  };
  
  return { syncStatus, pendingCount, startSync };
}
```

### 第二階段：性能優化（2週）

#### 2.1 Web Worker掃描處理
```typescript
// public/workers/scanner-worker.js
let scanQueue = [];
let processing = false;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'ADD_SCAN':
      scanQueue.push(data);
      if (!processing) {
        processScanQueue();
      }
      break;
      
    case 'PROCESS_BATCH':
      const results = await processBatch(data.items);
      self.postMessage({ 
        type: 'BATCH_COMPLETE', 
        results 
      });
      break;
  }
});

async function processScanQueue() {
  processing = true;
  
  while (scanQueue.length > 0) {
    // 批量處理提高效率
    const batch = scanQueue.splice(0, 10);
    
    try {
      const validated = await validateBatch(batch);
      
      self.postMessage({
        type: 'SCAN_VALIDATED',
        items: validated
      });
      
      // 避免阻塞
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      self.postMessage({
        type: 'SCAN_ERROR',
        error: error.message
      });
    }
  }
  
  processing = false;
}
```

#### 2.2 優化掃描組件
```typescript
// app/components/EnhancedScanner.tsx
export function EnhancedScanner() {
  const workerRef = useRef<Worker>();
  const [scanRate, setScanRate] = useState(0);
  const scanBuffer = useRef<ScanItem[]>([]);
  
  useEffect(() => {
    workerRef.current = new Worker('/workers/scanner-worker.js');
    
    workerRef.current.onmessage = (event) => {
      const { type, items } = event.data;
      
      if (type === 'SCAN_VALIDATED') {
        updateUI(items);
        updateScanRate(items.length);
      }
    };
    
    return () => workerRef.current?.terminate();
  }, []);
  
  const handleScan = useCallback((code: string) => {
    // 添加到緩衝區
    scanBuffer.current.push({
      code,
      timestamp: Date.now()
    });
    
    // 使用 requestIdleCallback 批量處理
    requestIdleCallback(() => {
      if (scanBuffer.current.length > 0) {
        workerRef.current?.postMessage({
          type: 'ADD_SCAN',
          data: scanBuffer.current
        });
        scanBuffer.current = [];
      }
    });
  }, []);
  
  // 計算掃描速率
  const updateScanRate = (count: number) => {
    setScanRate(prev => {
      const now = Date.now();
      const rate = calculateRate(prev, count, now);
      return rate;
    });
  };
  
  return (
    <div className="scanner-container">
      <div className="scan-stats">
        掃描速率: {scanRate} 件/分鐘
      </div>
      <QRScanner onScan={handleScan} />
    </div>
  );
}
```

#### 2.3 虛擬列表優化
```typescript
// app/components/VirtualCountList.tsx
import { VariableSizeList } from 'react-window';

export function VirtualCountList({ items, onItemUpdate }) {
  const listRef = useRef<VariableSizeList>(null);
  
  const getItemSize = (index: number) => {
    // 動態高度計算
    return items[index].hasVariance ? 120 : 80;
  };
  
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <div style={style} className="count-item">
        <CountItemCard 
          item={item}
          onUpdate={(updates) => onItemUpdate(index, updates)}
        />
      </div>
    );
  };
  
  return (
    <VariableSizeList
      ref={listRef}
      height={window.innerHeight - 200}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
      overscanCount={5}
    >
      {Row}
    </VariableSizeList>
  );
}
```

### 第三階段：RFID整合（3週）

#### 3.1 RFID讀取器接口
```typescript
// app/lib/rfid/rfidReader.ts
export class RFIDReader {
  private reader: any;
  private isConnected = false;
  private callbacks: Map<string, Function> = new Map();
  
  async connect(): Promise<void> {
    try {
      // Web Serial API 連接RFID讀取器
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      
      this.reader = port;
      this.isConnected = true;
      
      // 開始讀取數據流
      this.startReading();
    } catch (error) {
      throw new Error('RFID讀取器連接失敗');
    }
  }
  
  private async startReading() {
    const reader = this.reader.readable.getReader();
    
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // 解析RFID數據
        const tags = this.parseRFIDData(value);
        
        // 批量處理標籤
        if (tags.length > 0) {
          this.processTags(tags);
        }
      }
    } catch (error) {
      console.error('RFID讀取錯誤:', error);
    }
  }
  
  private parseRFIDData(data: Uint8Array): RFIDTag[] {
    // 解析RFID協議數據
    const tags: RFIDTag[] = [];
    // ... 解析邏輯
    return tags;
  }
  
  private processTags(tags: RFIDTag[]) {
    // 去重處理
    const uniqueTags = this.deduplicateTags(tags);
    
    // 觸發回調
    this.callbacks.forEach(callback => {
      callback(uniqueTags);
    });
  }
  
  onTagsDetected(callback: (tags: RFIDTag[]) => void): void {
    const id = crypto.randomUUID();
    this.callbacks.set(id, callback);
  }
}
```

#### 3.2 RFID批量盤點
```typescript
// app/components/RFIDBulkCount.tsx
export function RFIDBulkCount() {
  const [detectedTags, setDetectedTags] = useState<Set<string>>(new Set());
  const [countRate, setCountRate] = useState(0);
  const rfidReader = useRef<RFIDReader>();
  
  useEffect(() => {
    initializeRFID();
    
    return () => {
      rfidReader.current?.disconnect();
    };
  }, []);
  
  const initializeRFID = async () => {
    try {
      rfidReader.current = new RFIDReader();
      await rfidReader.current.connect();
      
      rfidReader.current.onTagsDetected((tags) => {
        processBulkTags(tags);
      });
    } catch (error) {
      toast.error('RFID初始化失敗');
    }
  };
  
  const processBulkTags = async (tags: RFIDTag[]) => {
    const newTags = tags.filter(tag => !detectedTags.has(tag.id));
    
    if (newTags.length > 0) {
      // 更新檢測集合
      setDetectedTags(prev => {
        const updated = new Set(prev);
        newTags.forEach(tag => updated.add(tag.id));
        return updated;
      });
      
      // 批量驗證
      const validated = await validateRFIDTags(newTags);
      
      // 更新盤點記錄
      await updateCountRecords(validated);
      
      // 計算速率
      updateCountRate(newTags.length);
    }
  };
  
  return (
    <div className="rfid-bulk-count">
      <div className="stats-panel">
        <div className="stat-item">
          <span className="label">已掃描</span>
          <span className="value">{detectedTags.size}</span>
        </div>
        <div className="stat-item">
          <span className="label">速率</span>
          <span className="value">{countRate} 件/秒</span>
        </div>
      </div>
      
      <div className="rfid-indicator">
        <RFIDStatusIndicator connected={!!rfidReader.current} />
      </div>
      
      <TagCloud tags={Array.from(detectedTags)} />
    </div>
  );
}
```

### 第四階段：智能分析（3週）

#### 4.1 異常檢測引擎
```typescript
// app/lib/analytics/anomalyDetection.ts
export class AnomalyDetector {
  private model: tf.LayersModel | null = null;
  
  async loadModel(): Promise<void> {
    this.model = await tf.loadLayersModel('/models/stock-anomaly/model.json');
  }
  
  async detectAnomalies(countData: CountData[]): Promise<Anomaly[]> {
    if (!this.model) await this.loadModel();
    
    const anomalies: Anomaly[] = [];
    
    // 準備特徵
    const features = this.extractFeatures(countData);
    
    // 預測
    const predictions = this.model!.predict(features) as tf.Tensor;
    const scores = await predictions.data();
    
    // 識別異常
    countData.forEach((item, index) => {
      const score = scores[index];
      
      if (score > 0.8) { // 異常閾值
        anomalies.push({
          item,
          score,
          type: this.classifyAnomaly(item, score),
          suggestion: this.generateSuggestion(item)
        });
      }
    });
    
    return anomalies;
  }
  
  private extractFeatures(data: CountData[]): tf.Tensor {
    // 提取特徵：差異率、歷史模式、時間因素等
    const features = data.map(item => [
      item.variance / item.systemQty, // 差異率
      item.lastCountDays || 0,        // 距上次盤點天數
      item.locationChangeFreq || 0,   // 位置變動頻率
      item.seasonalityScore || 0,     // 季節性分數
      // ... 更多特徵
    ]);
    
    return tf.tensor2d(features);
  }
  
  private classifyAnomaly(item: CountData, score: number): AnomalyType {
    if (item.variance > item.systemQty * 0.2) {
      return 'MAJOR_SHORTAGE';
    } else if (item.variance < -item.systemQty * 0.2) {
      return 'MAJOR_SURPLUS';
    } else if (item.lastCountDays > 180) {
      return 'STALE_INVENTORY';
    }
    return 'UNKNOWN';
  }
}
```

#### 4.2 預測性分析
```typescript
// app/components/PredictiveAnalytics.tsx
export function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  
  useEffect(() => {
    loadPredictions();
  }, []);
  
  const loadPredictions = async () => {
    // 獲取歷史數據
    const history = await fetchCountHistory();
    
    // 生成預測
    const predictor = new StockPredictor();
    const results = await predictor.predict({
      history,
      horizon: 30, // 預測30天
      confidence: 0.95
    });
    
    setPredictions(results.predictions);
    setAccuracy(results.accuracy);
  };
  
  return (
    <div className="predictive-dashboard">
      <div className="accuracy-badge">
        預測準確率: {(accuracy * 100).toFixed(1)}%
      </div>
      
      <div className="predictions-grid">
        {predictions.map(pred => (
          <PredictionCard key={pred.productCode}>
            <h3>{pred.productCode}</h3>
            <TrendChart data={pred.trend} />
            <div className="insights">
              {pred.insights.map(insight => (
                <InsightBadge key={insight.id} insight={insight} />
              ))}
            </div>
            <div className="recommendations">
              {pred.recommendations.map(rec => (
                <RecommendationItem key={rec.id} recommendation={rec} />
              ))}
            </div>
          </PredictionCard>
        ))}
      </div>
    </div>
  );
}
```

#### 4.3 智能排程建議
```typescript
// app/lib/analytics/smartScheduler.ts
export class SmartScheduler {
  async generateSchedule(params: ScheduleParams): Promise<Schedule> {
    // 分析產品重要性
    const priorities = await this.analyzePriorities(params.products);
    
    // 考慮資源限制
    const resources = await this.getAvailableResources();
    
    // 優化排程
    const schedule = this.optimizeSchedule({
      priorities,
      resources,
      constraints: params.constraints
    });
    
    return {
      daily: this.groupByDay(schedule),
      weekly: this.groupByWeek(schedule),
      suggestions: this.generateSuggestions(schedule)
    };
  }
  
  private async analyzePriorities(products: Product[]): Promise<Priority[]> {
    return products.map(product => ({
      productCode: product.code,
      score: this.calculatePriorityScore(product),
      factors: {
        value: product.unitValue * product.quantity,
        turnover: product.turnoverRate,
        variance: product.historicalVariance,
        lastCount: product.daysSinceLastCount
      }
    }));
  }
  
  private calculatePriorityScore(product: Product): number {
    // 多因素優先級計算
    const valueScore = Math.log(product.unitValue * product.quantity) / 10;
    const turnoverScore = product.turnoverRate * 2;
    const varianceScore = product.historicalVariance > 0.1 ? 1.5 : 1;
    const timeScore = Math.min(product.daysSinceLastCount / 30, 2);
    
    return valueScore + turnoverScore + varianceScore + timeScore;
  }
}
```

## 實施時間表

### 第1-2週：離線架構（中優先級）
- [ ] 實施Service Worker - 解決斷網問題
- [ ] 建立IndexedDB存儲 - 本地緩存系統
- [ ] 智能同步機制 - 背景批量同步
- 🎯 目標：解決10-15件/分鐘速度限制

### 第3-4週：性能優化（中優先級）
- [x] 基礎QR掃描 - ✅ 已實現jsQR相機掃描
- [x] 手動輸入支援 - ✅ 已支援DDMMYY/X格式
- [x] 防重複驗證 - ✅ 已實現即時驗證
- [ ] Web Worker處理 - 背景批量處理
- [ ] 批量API優化 - 減少同步調用
- [ ] 虛擬列表實施 - 大量資料優化

### 第5-7週：RFID整合（低優先級）
- [ ] RFID讀取器接口 - Web Serial API連接
- [ ] 批量標籤處理 - 200件/分鐘目標
- [ ] 混合掃描模式 - QR + RFID同時支援
- 📝 說明：需要硬體投資，目前未列入計劃

### 第8-10週：智能分析（低優先級）
- [ ] 異常檢測模型 - ML驅動的差異分析
- [ ] 預測分析實施 - 庫存變化預測
- [ ] 智能排程系統 - 自動優先級排序
- 📝 說明：高級功能，需要大量數據訓練

## 預期成果

### 效率提升
- 掃描速度：15件/分鐘 → 60+件/分鐘
- RFID批量：可達 200件/分鐘
- 離線工作：100%功能可用

### 準確性改善
- 盤點準確率：95% → 99%+
- 異常檢測率：新增功能，>90%
- 預測準確率：目標 85%+

### 營運效益
- 盤點時間：減少 70%
- 人力需求：減少 50%
- 庫存準確性：提升至 99%+

## 風險評估

### 技術風險
- RFID硬件兼容性
- 離線數據同步衝突
- ML模型準確性

### 緩解措施
- 多廠商RFID支援
- 衝突解決算法
- 持續模型訓練

## 相關資源
- 現有代碼：`/app/stock-take/cycle-count/`
- API端點：`/app/api/stock-count/`
- 數據表：`record_stocktake`, `stock_level`
- 文檔：`/docs/fn_stock_count.md`