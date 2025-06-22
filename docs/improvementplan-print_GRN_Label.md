# GRN標籤打印改進計劃（基於實際代碼分析）

## 概述
基於代碼分析，GRN標籤打印系統已經有完善嘅實現，包括PDF生成、QR碼、批量打印同Supabase Storage整合。系統使用@react-pdf/renderer生成PDF，支援多種棧板類型同包裝重量計算。主要改進空間在於打印隊列管理同性能優化。

## 現有系統實際架構

### 核心組件
```
app/print-grnlabel/
├── page.tsx                      # 橙色主題UI，玻璃態設計
├── components/
│   └── GrnLabelFormV2.tsx        # 核心表單處理
├── hooks/
│   └── useGrnLabelBusiness.tsx   # 業務邏輯
└── actions/
    └── grnActions.ts             # 數據庫操作

app/utils/
├── pdfGeneration.ts              # 統一PDF生成介面
└── lib/pdfUtils.tsx              # PDF工具函數
```

### 現有功能
- **供應商驗證**：對照 `data_supplier` 表
- **重量計算系統**：
  - 棧板類型：White Dry/Wet (19/23kg)、Chep Dry/Wet (22.5/26.5kg)、Euro (20/24kg)
  - 包裝重量：Still、Bag、Tote、Octo
- **原子性棧板號生成**：`DDMMYY/XX` 格式
- **PDF生成**：包含公司logo、QR碼、產品資訊、重量
- **批量打印**：支援多個棧板同時生成

### 發現嘅問題

#### 1. 缺乏打印隊列管理
```typescript
// 現有實現：直接生成PDF後打印
const pdfUrl = await generatePDF(labelData);
window.print(); // 簡單瀏覽器打印
// 無隊列、無重試、無狀態追蹤
```

#### 2. 性能瓶頸
```typescript
// 每次都重新生成模板
const MyDocument = () => (
  <Document>
    <Page size="A4">
      {/* 重複渲染整個模板 */}
    </Page>
  </Document>
);
// 無模板緩存
```

#### 3. 錯誤處理不足
```typescript
// 簡單try-catch
try {
  // 生成PDF
} catch (error) {
  console.error(error);
  // 無詳細錯誤分類或恢復機制
}
```

## 改進方案

### 第一階段：打印隊列實現（1週）

#### 1.1 建立打印隊列系統
```typescript
// app/lib/print-queue/printQueue.ts
import { createClient } from '@supabase/supabase-js';

export class PrintQueue {
  private queue: PrintJob[] = [];
  private processing = false;
  private maxRetries = 3;
  
  async addJob(job: PrintJob): Promise<string> {
    const jobId = crypto.randomUUID();
    
    // 保存到數據庫
    await supabase
      .from('print_jobs')
      .insert({
        id: jobId,
        type: 'GRN_LABEL',
        data: job.data,
        status: 'pending',
        created_at: new Date()
      });
    
    this.queue.push({ ...job, id: jobId });
    this.processQueue();
    
    return jobId;
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const job = this.queue.shift()!;
    
    try {
      await this.processJob(job);
      await this.updateJobStatus(job.id, 'completed');
    } catch (error) {
      await this.handleJobError(job, error);
    }
    
    this.processing = false;
    this.processQueue(); // 處理下一個
  }
  
  private async processJob(job: PrintJob) {
    // 生成PDF
    const pdf = await this.generatePDF(job.data);
    
    // 上傳到Storage
    const url = await this.uploadPDF(pdf, job.id);
    
    // 觸發打印
    await this.triggerPrint(url, job.printOptions);
    
    // 發送通知
    this.notifyCompletion(job);
  }
  
  private async handleJobError(job: PrintJob, error: Error) {
    job.retries = (job.retries || 0) + 1;
    
    if (job.retries < this.maxRetries) {
      // 重新加入隊列
      this.queue.push(job);
      await this.updateJobStatus(job.id, 'retrying');
    } else {
      await this.updateJobStatus(job.id, 'failed', error.message);
      this.notifyError(job, error);
    }
  }
}
```

#### 1.2 實時狀態追蹤
```typescript
// app/components/PrintQueueStatus.tsx
export function PrintQueueStatus() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  
  useEffect(() => {
    // 訂閱打印任務更新
    const subscription = supabase
      .channel('print_jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'print_jobs' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setJobs(prev => 
              prev.map(job => 
                job.id === payload.new.id ? payload.new : job
              )
            );
          }
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <div className="space-y-2">
      {jobs.map(job => (
        <PrintJobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

function PrintJobCard({ job }: { job: PrintJob }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <div>
        <span className="font-medium">{job.data.grnNumber}</span>
        <span className="text-sm text-gray-500 ml-2">
          {job.data.palletCount} 張標籤
        </span>
      </div>
      <PrintJobStatus status={job.status} />
    </div>
  );
}
```

### 第二階段：性能優化（1週）

#### 2.1 PDF模板緩存
```typescript
// app/lib/pdf/templateCache.ts
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';

export class PDFTemplateCache {
  private static cache = new Map<string, any>();
  
  static getTemplate(type: 'GRN' | 'QC'): any {
    if (!this.cache.has(type)) {
      this.cache.set(type, this.createTemplate(type));
    }
    return this.cache.get(type);
  }
  
  private static createTemplate(type: string) {
    // 預編譯樣式
    const styles = StyleSheet.create({
      page: {
        padding: 30,
        fontFamily: 'Helvetica'
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
      },
      // ... 其他樣式
    });
    
    // 返回可重用模板
    return { styles, layout: this.getLayout(type) };
  }
}

// 使用緩存模板
export async function generateGRNLabel(data: GRNData): Promise<Buffer> {
  const template = PDFTemplateCache.getTemplate('GRN');
  
  // 只填充數據，不重新創建整個結構
  const doc = (
    <Document>
      <Page size="A4" style={template.styles.page}>
        {template.layout(data)}
      </Page>
    </Document>
  );
  
  return await renderToBuffer(doc);
}
```

#### 2.2 批量生成優化
```typescript
// app/lib/pdf/batchGenerator.ts
import { PDFDocument } from 'pdf-lib';
import pLimit from 'p-limit';

export class BatchPDFGenerator {
  private limit = pLimit(4); // 並發限制
  
  async generateBatch(
    items: GRNData[], 
    onProgress?: (progress: number) => void
  ): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    // 並行生成單個PDF
    const pdfPromises = items.map((item, index) => 
      this.limit(async () => {
        const pdf = await generateGRNLabel(item);
        onProgress?.(((index + 1) / items.length) * 100);
        return pdf;
      })
    );
    
    const pdfs = await Promise.all(pdfPromises);
    
    // 合併PDF
    for (const pdfBytes of pdfs) {
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save();
  }
}
```

#### 2.3 Web Worker 支援
```typescript
// app/workers/pdf-generator.worker.ts
import { generateGRNLabel } from '@/lib/pdf/generator';

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  if (type === 'GENERATE_PDF') {
    try {
      const pdf = await generateGRNLabel(data);
      self.postMessage({ 
        type: 'PDF_READY', 
        pdf,
        id: data.id 
      });
    } catch (error) {
      self.postMessage({ 
        type: 'PDF_ERROR', 
        error: error.message,
        id: data.id 
      });
    }
  }
});

// 主線程使用
export function usePDFWorker() {
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/pdf-generator.worker.ts', import.meta.url)
    );
    
    return () => workerRef.current?.terminate();
  }, []);
  
  const generatePDF = useCallback((data: GRNData) => {
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id === data.id) {
          if (e.data.type === 'PDF_READY') {
            resolve(e.data.pdf);
          } else {
            reject(new Error(e.data.error));
          }
          workerRef.current?.removeEventListener('message', handler);
        }
      };
      
      workerRef.current?.addEventListener('message', handler);
      workerRef.current?.postMessage({ type: 'GENERATE_PDF', data });
    });
  }, []);
  
  return generatePDF;
}
```

### 第三階段：用戶體驗增強（2週）

#### 3.1 打印預覽改進
```typescript
// app/components/EnhancedPrintPreview.tsx
export function EnhancedPrintPreview({ 
  labels, 
  onPrint,
  onEdit 
}: PrintPreviewProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  
  return (
    <div className="flex h-full">
      {/* 側邊欄 */}
      <div className="w-64 border-r p-4">
        <h3 className="font-semibold mb-4">標籤列表</h3>
        <div className="space-y-2">
          {labels.map((label, index) => (
            <label 
              key={label.id}
              className="flex items-center p-2 hover:bg-gray-50 rounded"
            >
              <input
                type="checkbox"
                checked={selectedLabels.includes(label.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLabels([...selectedLabels, label.id]);
                  } else {
                    setSelectedLabels(
                      selectedLabels.filter(id => id !== label.id)
                    );
                  }
                }}
                className="mr-2"
              />
              <span className="flex-1">
                {label.grnNumber} - {label.productName}
              </span>
              <button
                onClick={() => onEdit(label)}
                className="text-blue-600 hover:text-blue-800"
              >
                編輯
              </button>
            </label>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => onPrint(selectedLabels)}
            disabled={selectedLabels.length === 0}
            className="w-full bg-blue-600 text-white py-2 rounded 
                     disabled:bg-gray-300"
          >
            打印選中 ({selectedLabels.length})
          </button>
        </div>
      </div>
      
      {/* 預覽區域 */}
      <div className="flex-1 bg-gray-100 p-4 overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">預覽</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div 
          className="bg-white shadow-lg mx-auto"
          style={{ 
            width: `${210 * (zoom / 100)}mm`,
            transform: `scale(${zoom / 100})`
          }}
        >
          {selectedLabels.length > 0 && (
            <PDFViewer 
              labels={labels.filter(l => 
                selectedLabels.includes(l.id)
              )} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 智能重印功能
```typescript
// app/components/ReprintManager.tsx
export function ReprintManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  
  const { data: printHistory } = useQuery({
    queryKey: ['print-history', searchTerm, dateRange],
    queryFn: () => fetchPrintHistory({ searchTerm, dateRange })
  });
  
  return (
    <div>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="搜尋 GRN 號碼或產品"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>
      
      <div className="space-y-2">
        {printHistory?.map(record => (
          <PrintHistoryCard
            key={record.id}
            record={record}
            onReprint={(record) => {
              // 重印邏輯
              const queue = new PrintQueue();
              queue.addJob({
                data: record.labelData,
                printOptions: { copies: 1 }
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 第四階段：進階功能（2週）

#### 4.1 打印機管理
```typescript
// app/lib/printer/printerManager.ts
export class PrinterManager {
  private printers: Map<string, PrinterConfig> = new Map();
  
  async detectPrinters(): Promise<Printer[]> {
    // 使用 Web Print API (如果可用)
    if ('printers' in navigator) {
      const printers = await (navigator as any).printers.getPrinters();
      return printers;
    }
    
    // 否則使用配置的網絡打印機
    return this.getNetworkPrinters();
  }
  
  async print(
    pdfUrl: string, 
    printerId: string, 
    options: PrintOptions
  ): Promise<void> {
    const printer = this.printers.get(printerId);
    
    if (!printer) {
      throw new Error('打印機未找到');
    }
    
    if (printer.type === 'network') {
      // 發送到網絡打印服務器
      await this.sendToNetworkPrinter(pdfUrl, printer, options);
    } else {
      // 使用瀏覽器打印
      await this.browserPrint(pdfUrl, options);
    }
  }
  
  private async sendToNetworkPrinter(
    pdfUrl: string,
    printer: NetworkPrinter,
    options: PrintOptions
  ) {
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfUrl,
        printerAddress: printer.address,
        options
      })
    });
    
    if (!response.ok) {
      throw new Error('網絡打印失敗');
    }
  }
}
```

#### 4.2 標籤模板管理
```typescript
// app/components/LabelTemplateManager.tsx
export function LabelTemplateManager() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null);
  
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3">
        <h3 className="font-semibold mb-4">模板列表</h3>
        {templates.map(template => (
          <div
            key={template.id}
            className="p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50"
            onClick={() => setEditingTemplate(template)}
          >
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-gray-500">
              {template.lastModified}
            </div>
          </div>
        ))}
        <button className="w-full mt-4 p-2 border-2 border-dashed rounded">
          + 新增模板
        </button>
      </div>
      
      <div className="col-span-9">
        {editingTemplate && (
          <LabelTemplateEditor
            template={editingTemplate}
            onSave={(updated) => {
              setTemplates(templates.map(t => 
                t.id === updated.id ? updated : t
              ));
            }}
          />
        )}
      </div>
    </div>
  );
}
```

## 實施時間表

### 第1週：打印隊列
- [ ] 實施打印隊列系統
- [ ] 添加實時狀態追蹤
- [ ] 數據庫schema更新

### 第2週：性能優化  
- [ ] PDF模板緩存
- [ ] 批量生成優化
- [ ] Web Worker實現

### 第3-4週：用戶體驗
- [ ] 增強打印預覽
- [ ] 智能重印功能
- [ ] 錯誤處理改進

### 第5-6週：進階功能
- [ ] 打印機管理
- [ ] 模板系統
- [ ] API整合

## 預期成果

### 性能改善
- PDF生成速度：提升 60%（模板緩存）
- 批量處理：10張 → 100+張
- 並發處理：支援多任務

### 功能提升
- 打印狀態追蹤：100%可見性
- 錯誤恢復：自動重試機制
- 用戶控制：選擇性打印、編輯

### 可靠性
- 打印成功率：95% → 99%+
- 錯誤處理：詳細分類及解決方案
- 審計追蹤：完整打印歷史

## 風險評估

### 技術風險
- 瀏覽器打印API限制
- PDF生成內存使用

### 緩解措施
- 提供多種打印方式
- 實施內存管理策略
- 漸進式功能推出

## 相關資源
- 現有代碼：`/app/print-grnlabel/`
- PDF工具：`/app/utils/pdfGeneration.ts`
- API端點：`/app/api/print-label-pdf/`
- 文檔：`/docs/fn_print_GRN_Label.md`