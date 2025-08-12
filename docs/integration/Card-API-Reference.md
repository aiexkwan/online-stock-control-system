# Card API Reference

**版本**: 1.0  
**更新日期**: 2025-07-26  
**狀態**: 🎉 完成

## 📋 概覽

本文檔詳細說明各種 Card 組件的 API，包括 Props、方法和使用示例。

## 🎴 基礎 Card 組件

### StatsCard

顯示統計數據的卡片組件。

```typescript
interface StatsCardProps {
  title?: string;
  description?: string;
  stats?: StatsData[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  className?: string;
  height?: string | number;
  isEditMode?: boolean;
}

interface StatsData {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
}
```

**使用示例**：
```typescript
<StatsCard
  title="銷售統計"
  stats={[
    { label: '今日訂單', value: 156, change: 12, changeType: 'increase' },
    { label: '總收入', value: '$45,678', change: -5, changeType: 'decrease' }
  ]}
/>
```

### ChartCard

顯示圖表的卡片組件。

```typescript
interface ChartCardProps {
  title?: string;
  description?: string;
  chartTypes?: ChartType[];
  metrics?: string[];
  dimensions?: string[];
  granularity?: 'hour' | 'day' | 'week' | 'month';
  timeFrame?: TimeFrame;
  data?: any[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  className?: string;
  height?: string | number;
  isEditMode?: boolean;
}

enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter'
}
```

### ListCard

顯示列表數據的卡片組件。

```typescript
interface ListCardProps {
  title?: string;
  description?: string;
  listType?: ListType;
  columns?: ColumnDefinition[];
  data?: any[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  onRowClick?: (row: any) => void;
  loading?: boolean;
  error?: Error | null;
  className?: string;
  height?: string | number;
  isEditMode?: boolean;
}
```

## 🔧 操作類 Card

### BaseOperationCard

所有操作類 Card 的基礎組件。

```typescript
interface BaseOperationCardProps {
  // 基礎屬性
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  height?: string | number;
  isEditMode?: boolean;
  
  // 操作類型
  operationType: 'action' | 'selector' | 'upload' | 'monitor';
  
  // 操作配置
  actionConfig?: ActionConfig;
  selectorConfig?: SelectorConfig;
  uploadConfig?: UploadConfig;
  monitorConfig?: MonitorConfig;
  
  // 事件處理
  onAction?: (params?: any) => Promise<ActionResult>;
  onSelect?: (value: any) => void;
  onUpload?: (files: File[]) => Promise<void>;
  
  // 狀態
  loading?: boolean;
  error?: Error | null;
  disabled?: boolean;
  
  // 權限
  requiredPermission?: string;
  
  // 自定義內容
  customContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

interface ActionConfig {
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirmRequired?: boolean;
  confirmMessage?: string;
  dangerLevel?: 'low' | 'medium' | 'high';
  successMessage?: string;
  errorMessage?: string;
}

interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
}
```

### VoidPalletCard

托盤作廢操作卡片。

```typescript
interface VoidPalletCardProps extends Omit<BaseOperationCardProps, 'operationType'> {
  defaultPalletId?: string;
  allowBatchMode?: boolean;
  showHistory?: boolean;
  onVoidComplete?: (palletIds: string[]) => void;
}
```

### DepartmentSelectorOperationCard

部門選擇器卡片。

```typescript
interface DepartmentSelectorOperationCardProps extends Omit<BaseOperationCardProps, 'operationType'> {
  departments?: Department[];
  defaultDepartment?: string;
  onDepartmentChange?: (department: string) => void;
  showStats?: boolean;
}
```

## 📤 上傳類 Card

### BaseUploadCard

所有上傳類 Card 的基礎組件。

```typescript
interface BaseUploadCardProps {
  // 基礎屬性
  title?: string;
  description?: string;
  className?: string;
  height?: string | number;
  isEditMode?: boolean;
  
  // 上傳配置
  uploadConfig: UploadConfiguration;
  
  // 事件處理
  onUpload: (files: UploadFile[]) => void | Promise<void>;
  onFileRemove?: (fileId: string) => void;
  onError?: (error: Error) => void;
  
  // 狀態
  loading?: boolean;
  disabled?: boolean;
  
  // 自定義
  customContent?: React.ReactNode;
  renderFileItem?: (file: UploadFile, onRemove: () => void) => React.ReactNode;
  processFile?: (file: File) => Promise<ProcessedFile>;
}

interface UploadConfiguration {
  acceptedTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  uploadType?: 'basic' | 'pdf-analysis' | 'image-gallery' | 'custom';
  customValidation?: (file: File) => string | null;
}

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}
```

### UploadOrdersCard

訂單上傳卡片，支援 PDF 分析。

```typescript
interface UploadOrdersCardProps {
  title?: string;
  description?: string;
  maxFiles?: number;
  autoAnalysis?: boolean;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}
```

## 📊 分析類 Card

### BaseAnalysisCard

所有分析類 Card 的基礎組件。

```typescript
interface BaseAnalysisCardProps {
  // 基礎屬性
  title?: string;
  description?: string;
  className?: string;
  isEditMode?: boolean;
  
  // 分析類型
  analysisType: 'static' | 'expandable' | 'paged' | 'realtime';
  
  // 數據配置
  dataSource?: string;
  metrics?: string[];
  dimensions?: string[];
  filters?: FilterConfig[];
  
  // 顯示配置
  displayMode?: 'card' | 'full' | 'compact';
  showLegend?: boolean;
  showToolbar?: boolean;
  
  // 交互配置
  interactive?: boolean;
  expandable?: boolean;
  exportable?: boolean;
  
  // 事件
  onDataUpdate?: (data: any) => void;
  onExport?: (format: string) => void;
  onFilterChange?: (filters: FilterConfig[]) => void;
  
  // 自定義渲染
  renderContent?: (data: any) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
}
```

### ExpandableAnalysisCard

可展開的分析卡片。

```typescript
interface ExpandableAnalysisCardProps extends BaseAnalysisCardProps {
  sections: AnalysisSection[];
  defaultExpanded?: string[];
  accordion?: boolean;
  maxExpanded?: number;
}

interface AnalysisSection {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string;
}
```

## 🎨 特殊功能 Card

### SpecialCardKit

特殊功能的組合工具集。

```typescript
interface SpecialCardComposition {
  useDialog?: boolean;
  useTreeStructure?: boolean;
  useRealtimeData?: boolean;
  use3DRendering?: boolean;
  usePerformanceMonitor?: boolean;
}

// 使用示例
const MySpecialCard = withSpecialCardKit(MyComponent, {
  useDialog: true,
  useRealtimeData: true
});
```

### Folder3DCard

3D 文件夾視覺效果卡片。

```typescript
interface Folder3DCardProps {
  title?: string;
  folders?: Folder3DItem[];
  onFolderClick?: (folder: Folder3DItem) => void;
  animationSpeed?: number;
  showLabels?: boolean;
}

interface Folder3DItem {
  id: string;
  name: string;
  color?: string;
  icon?: React.ReactNode;
  fileCount?: number;
  size?: string;
}
```

## 🔄 生命週期

### Card 生命週期方法

所有 Card 組件都遵循 React 組件生命週期，並提供以下擴展：

1. **初始化階段**
   - Props 驗證
   - 默認值設置
   - 權限檢查

2. **數據載入階段**
   - 自動處理 loading 狀態
   - 錯誤邊界保護
   - 重試機制

3. **交互階段**
   - 事件處理
   - 狀態更新
   - 實時反饋

4. **清理階段**
   - 取消未完成的請求
   - 清理事件監聽器
   - 釋放資源

## 🛡️ 錯誤處理

### 統一錯誤處理模式

```typescript
try {
  // 執行操作
  const result = await someOperation();
  toast.success('操作成功');
  return { success: true, data: result };
} catch (error) {
  console.error('操作失敗:', error);
  toast.error(error.message || '操作失敗');
  return { success: false, error };
}
```

### 錯誤邊界

所有 Card 組件都被錯誤邊界包裹，確保單個組件的錯誤不會影響整個應用。

## 📦 工具函數

### Card 相關工具

```typescript
// 獲取 Card 默認高度
export const getCardHeight = (type: CardType): number => {
  const heights = {
    stats: 200,
    chart: 400,
    list: 500,
    operation: 300,
    upload: 400,
    analysis: 600,
  };
  return heights[type] || 400;
};

// Card 類型檢查
export const isOperationCard = (card: any): card is BaseOperationCard => {
  return card?.operationType !== undefined;
};

// Card 權限檢查
export const checkCardPermission = (
  card: BaseCard,
  userPermissions: string[]
): boolean => {
  if (!card.requiredPermission) return true;
  return userPermissions.includes(card.requiredPermission);
};
```

## 🎯 最佳實踐

1. **總是提供默認值**
   ```typescript
   const MyCard: React.FC<MyCardProps> = ({
     title = '默認標題',
     loading = false,
     data = [],
   }) => { ... };
   ```

2. **使用 TypeScript 嚴格類型**
   ```typescript
   interface MyCardProps {
     data: DataItem[]; // 不要使用 any[]
   }
   ```

3. **處理所有狀態**
   - Loading
   - Error
   - Empty
   - Success

4. **優化性能**
   - 使用 React.memo
   - 使用 useMemo/useCallback
   - 虛擬化長列表

5. **提供良好的用戶反饋**
   - Loading 指示器
   - 錯誤消息
   - 成功提示
   - 空狀態說明

---

**注意**: 本 API 參考會隨著新 Card 的添加而更新。完整的使用示例請參考各個 Card 的測試頁面。