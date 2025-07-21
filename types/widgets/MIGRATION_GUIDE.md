# Widget 類型系統遷移指南
Widget Type System Migration Guide

## 概述

本指南幫助開發者將現有的 Widget 代碼遷移到新的統一類型系統。新系統提供了更好的類型安全性、代碼重用性和維護性。

## 目錄結構

```
types/widgets/
├── base/          # 基礎類型定義
├── data/          # 數據相關類型
├── state/         # 狀態管理類型
├── unified/       # 統一導出
└── index.ts       # 主入口
```

## 類型映射表

### 舊類型 → 新類型

| 舊類型位置 | 舊類型名稱 | 新類型位置 | 新類型名稱 |
|-----------|-----------|-----------|-----------|
| `@/app/admin/types/dashboard` | `WidgetProps` | `@/types/widgets` | `BaseWidgetProps` |
| `@/app/admin/types/dashboard` | `DashboardBatchQueryData` | `@/types/widgets` | `DashboardBatchQueryData` |
| `@/app/admin/components/dashboard/widgets/common/types` | `BaseWidgetConfig` | `@/types/widgets` | `BaseWidgetConfig` |
| `@/app/admin/components/dashboard/widgets/common/types` | `BaseWidgetState` | `@/types/widgets` | `WidgetState` |
| `@/app/admin/components/dashboard/widgets/types/WidgetApiTypes` | `BaseApiResponse` | `@/types/widgets` | `BaseApiResponse` |
| `@/app/admin/components/dashboard/adminDashboardLayouts` | `AdminWidgetConfig` | `@/types/widgets` | `BaseWidgetConfig` |
| `@/types/components/dashboard` | `WidgetType` | `@/types/widgets` | `WidgetType` |
| `@/types/components/dashboard` | `WidgetComponentProps` | `@/types/widgets` | `BaseWidgetProps` |

## 遷移步驟

### 步驟 1: 更新導入語句

**舊代碼：**
```typescript
import { WidgetProps } from '@/app/admin/types/dashboard';
import { BaseWidgetConfig } from '@/app/admin/components/dashboard/widgets/common/types';
import { WidgetType } from '@/types/components/dashboard';
import { AdminWidgetConfig } from '../adminDashboardLayouts';
```

**新代碼：**
```typescript
import { 
  BaseWidgetProps, 
  BaseWidgetConfig, 
  WidgetType 
} from '@/types/widgets';
```

### 步驟 2: 更新組件屬性接口

**舊代碼：**
```typescript
interface MyWidgetProps {
  config: AdminWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

**新代碼：**
```typescript
import { BaseWidgetProps, BaseWidgetConfig } from '@/types/widgets';

interface MyWidgetProps extends BaseWidgetProps {
  config: BaseWidgetConfig;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

### 步驟 3: 更新狀態管理

**舊代碼：**
```typescript
interface WidgetState {
  loading: boolean;
  error: string | null;
  data: any;
}
```

**新代碼：**
```typescript
import { WidgetState, createInitialWidgetState } from '@/types/widgets';

// 使用類型化的狀態
const [state, setState] = useState<WidgetState<MyDataType>>(
  createInitialWidgetState(widgetId)
);
```

### 步驟 4: 更新錯誤處理

**舊代碼：**
```typescript
setError('Something went wrong');
```

**新代碼：**
```typescript
import { WidgetError, WidgetErrorType } from '@/types/widgets';

const error: WidgetError = {
  type: WidgetErrorType.DATA_ERROR,
  message: 'Something went wrong',
  context: 'MyWidget',
  timestamp: new Date()
};
```

### 步驟 5: 更新 API 響應類型

**舊代碼：**
```typescript
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

**新代碼：**
```typescript
import { BaseApiResponse, ApiMetadata } from '@/types/widgets';

interface MyApiResponse extends BaseApiResponse {
  data?: MyDataType;
  metadata?: ApiMetadata;
}
```

## 具體範例

### 統計 Widget 遷移

**舊代碼：**
```typescript
// StatsWidget.tsx
import { AdminWidgetConfig } from '../adminDashboardLayouts';

interface StatsWidgetProps {
  config: AdminWidgetConfig;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ config }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // ...
};
```

**新代碼：**
```typescript
// StatsWidget.tsx
import { 
  BaseWidgetProps, 
  WidgetState, 
  createInitialWidgetState,
  StatsCardData 
} from '@/types/widgets';

interface StatsWidgetProps extends BaseWidgetProps {
  // 額外的屬性
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ 
  widgetId, 
  config,
  onRefresh 
}) => {
  const [state, setState] = useState<WidgetState<StatsCardData>>(
    createInitialWidgetState(widgetId)
  );
  
  // 使用統一的狀態管理
  const handleDataFetch = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const data = await fetchData();
      setState(prev => ({
        ...prev,
        isLoading: false,
        data,
        lastUpdated: new Date(),
        hasError: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        error: {
          type: WidgetErrorType.NETWORK_ERROR,
          message: error.message,
          timestamp: new Date()
        }
      }));
    }
  };
  
  // ...
};
```

### 圖表 Widget 遷移

**舊代碼：**
```typescript
// ChartWidget.tsx
interface ChartWidgetProps {
  widget: { 
    type: string; 
    config: any;
  };
}
```

**新代碼：**
```typescript
// ChartWidget.tsx
import { 
  BaseWidgetProps,
  ChartDataPoint,
  ChartType 
} from '@/types/widgets';

interface ChartWidgetProps extends BaseWidgetProps {
  chartType?: ChartType;
  data?: ChartDataPoint[];
}
```

## 類型檢查工具

使用新的類型保護函數確保類型安全：

```typescript
import { 
  isWidgetError, 
  isBaseApiResponse,
  isChartDataPoint,
  isValidWidgetType 
} from '@/types/widgets';

// 檢查錯誤類型
if (isWidgetError(error)) {
  console.error(`Widget error: ${error.type} - ${error.message}`);
}

// 檢查 API 響應
if (isBaseApiResponse(response)) {
  processData(response.data);
}

// 檢查圖表數據
const validData = data.filter(isChartDataPoint);

// 驗證 Widget 類型
if (isValidWidgetType(widgetType)) {
  renderWidget(widgetType);
}
```

## 最佳實踐

1. **使用類型化的狀態管理**
   ```typescript
   const [state, dispatch] = useReducer(
     widgetStateReducer<MyDataType>,
     createInitialWidgetState<MyDataType>(widgetId)
   );
   ```

2. **統一錯誤處理**
   ```typescript
   const handleError = (error: unknown) => {
     const widgetError = WidgetDataMapper.createWidgetError(
       error, 
       'MyWidget'
     );
     dispatch({ 
       type: WidgetActionType.SET_ERROR, 
       payload: { error: widgetError } 
     });
   };
   ```

3. **使用常量**
   ```typescript
   import { WIDGET_CONSTANTS } from '@/types/widgets';
   
   const refreshInterval = config.refreshInterval || 
     WIDGET_CONSTANTS.DEFAULT_REFRESH_INTERVAL;
   ```

4. **類型安全的配置創建**
   ```typescript
   import { createWidgetConfig, WidgetType } from '@/types/widgets';
   
   const config = createWidgetConfig(WidgetType.STATS_CARD, {
     id: 'stats-1',
     title: 'Statistics',
     refreshInterval: 30000
   });
   ```

## 常見問題

### Q: 如何處理自定義 Widget 類型？

A: 擴展基礎類型：
```typescript
interface MyCustomWidgetConfig extends BaseWidgetConfig {
  customField: string;
  customOptions: {
    // ...
  };
}
```

### Q: 如何遷移 GraphQL 數據類型？

A: 使用泛型：
```typescript
interface GraphQLWidgetState<T> extends WidgetState<T> {
  query?: string;
  variables?: Record<string, unknown>;
}
```

### Q: 如何保持向後兼容？

A: 創建類型別名：
```typescript
// 在過渡期間使用
export type AdminWidgetConfig = BaseWidgetConfig;
export type WidgetProps = BaseWidgetProps;
```

## 檢查清單

- [ ] 更新所有導入語句
- [ ] 替換舊的類型定義
- [ ] 使用新的狀態管理工具
- [ ] 實施統一的錯誤處理
- [ ] 添加類型保護檢查
- [ ] 更新單元測試
- [ ] 移除未使用的舊類型導入
- [ ] 運行 TypeScript 編譯檢查

## 需要幫助？

如有任何問題，請查看：
- 類型定義文件：`types/widgets/`
- 範例代碼：`app/admin/components/dashboard/widgets/`
- TypeScript 文檔：https://www.typescriptlang.org/