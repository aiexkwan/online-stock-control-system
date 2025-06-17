# 數據視覺化圖表實施指南

## 概述
為 Admin Dashboard 添加互動式數據視覺化圖表，以提供更直觀的數據分析和趨勢展示。

## 技術選型

### 推薦圖表庫：Recharts
- 基於 React 的圖表庫
- 支援響應式設計
- 與系統現有技術棧完美整合
- 已安裝在專案中

```bash
# 如需安裝
npm install recharts
```

## 實施計劃

### 第一階段：趨勢圖表

#### 1. 創建趨勢圖表組件
```typescript
// app/components/charts/TrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dialogStyles } from '@/app/utils/dialogStyles';

interface TrendChartProps {
  data: Array<{
    date: string;
    output: number;
    transferred: number;
  }>;
  title: string;
}

export function TrendChart({ data, title }: TrendChartProps) {
  return (
    <div className={dialogStyles.card}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px' 
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="output" 
            stroke="#3B82F6" 
            name="Output"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="transferred" 
            stroke="#10B981" 
            name="Transferred"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 2. 在 Admin Dashboard 中集成
```typescript
// app/admin/page.tsx
import { TrendChart } from '@/app/components/charts/TrendChart';

// 在組件中添加數據獲取
const [trendData, setTrendData] = useState([]);

const loadTrendData = async () => {
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('generate_time')
    .gte('generate_time', past7DaysStart.toISOString())
    .order('generate_time');
    
  // 處理數據並按日期分組
  const groupedData = processDataByDate(data);
  setTrendData(groupedData);
};

// 在 JSX 中添加圖表
<div className="mt-8">
  <TrendChart 
    data={trendData} 
    title="7-Day Production Trend"
  />
</div>
```

### 第二階段：產品活動熱力圖

#### 1. 創建熱力圖組件
```typescript
// app/components/charts/ProductHeatmap.tsx
import { dialogStyles } from '@/app/utils/dialogStyles';

interface HeatmapData {
  productCode: string;
  hour: number;
  count: number;
}

export function ProductHeatmap({ data }: { data: HeatmapData[] }) {
  // 實施熱力圖邏輯
  return (
    <div className={dialogStyles.card}>
      <h3 className="text-lg font-semibold text-white mb-4">
        Product Activity Heatmap
      </h3>
      {/* 熱力圖實現 */}
    </div>
  );
}
```

### 第三階段：互動式圖表增強

#### 1. 添加圖表互動功能
- 點擊數據點顯示詳細信息
- 拖拽縮放時間範圍
- 導出圖表為圖片

#### 2. 創建圖表配置組件
```typescript
// app/components/charts/ChartControls.tsx
export function ChartControls({ 
  onTimeRangeChange, 
  onChartTypeChange 
}) {
  return (
    <div className="flex gap-2 mb-4">
      <Select onValueChange={onTimeRangeChange}>
        <SelectTrigger className={dialogStyles.select}>
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Past 7 Days</SelectItem>
          <SelectItem value="30d">Past 30 Days</SelectItem>
          <SelectItem value="90d">Past 90 Days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## 數據處理

### 1. 創建數據聚合函數
```typescript
// app/utils/chartDataProcessors.ts
export function aggregateDataByDay(records: any[]) {
  const grouped = records.reduce((acc, record) => {
    const date = new Date(record.generate_time).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { output: 0, transferred: 0 };
    }
    acc[date].output++;
    if (record.is_transferred) {
      acc[date].transferred++;
    }
    return acc;
  }, {});
  
  return Object.entries(grouped).map(([date, counts]) => ({
    date,
    ...counts
  }));
}
```

### 2. 創建實時更新機制
```typescript
// 使用 Supabase 實時訂閱
useEffect(() => {
  const subscription = supabase
    .channel('pallets-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'record_palletinfo' },
      (payload) => {
        // 更新圖表數據
        updateChartData(payload);
      }
    )
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 性能優化

### 1. 數據快取
```typescript
// 使用 React Query 或 SWR 進行數據快取
import useSWR from 'swr';

const { data, error } = useSWR(
  ['chart-data', timeRange],
  () => fetchChartData(timeRange),
  {
    refreshInterval: 60000, // 每分鐘刷新
    revalidateOnFocus: false
  }
);
```

### 2. 懶加載圖表組件
```typescript
const TrendChart = dynamic(
  () => import('@/app/components/charts/TrendChart'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false 
  }
);
```

## 樣式整合

確保所有圖表組件與系統深色主題一致：

```typescript
// app/utils/chartTheme.ts
export const chartTheme = {
  backgroundColor: 'transparent',
  textColor: '#9CA3AF',
  gridColor: '#374151',
  tooltipBackground: '#1F2937',
  tooltipBorder: '#374151',
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#F59E0B',
    quaternary: '#8B5CF6'
  }
};
```

## 測試計劃

1. **單元測試**
   - 測試數據處理函數
   - 測試圖表組件渲染

2. **集成測試**
   - 測試數據獲取和更新
   - 測試用戶互動功能

3. **性能測試**
   - 測試大量數據點的渲染性能
   - 測試實時更新的性能影響

## 部署檢查清單

- [ ] 確保所有圖表在不同螢幕尺寸下正常顯示
- [ ] 檢查深色主題的一致性
- [ ] 優化數據查詢以減少載入時間
- [ ] 添加適當的載入狀態和錯誤處理
- [ ] 確保圖表可訪問性（ARIA 標籤等）

## 未來擴展

1. **更多圖表類型**
   - 圓餅圖：顯示產品分佈
   - 條形圖：比較不同位置的庫存
   - 散點圖：分析產品效率

2. **高級功能**
   - 圖表數據導出（CSV/PNG）
   - 自定義圖表顏色主題
   - 圖表註釋功能

3. **AI 驅動的洞察**
   - 自動檢測異常模式
   - 預測性分析
   - 智能提醒和建議