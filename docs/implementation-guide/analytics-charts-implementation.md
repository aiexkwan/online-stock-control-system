# 數據分析圖表實施方案

## 需求分析

### 三個核心圖表
1. **Output vs Booked Out Ratio** - 生產與出貨比率
2. **Product Ordered Trend** - 產品訂單趨勢
3. **Staff Workload** - 員工工作量

### 功能要求
- 用戶可選時間範圍（1天、7天、30天等）
- 1天顯示為棒型圖（Bar Chart）
- 其他時間範圍顯示為折線圖（Line Chart）
- 使用與 Reports 相同的啟動方式（按鈕觸發）
- Dialog 形式顯示圖表

## 實施架構

### 1. 創建 Analytics 按鈕（類似 Reports Button）

```typescript
// app/components/analytics/AnalyticsButton.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsDashboard } from './useAnalyticsDashboard';

interface AnalyticsButtonProps {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AnalyticsButton({ 
  variant = 'default', 
  size = 'md',
  className 
}: AnalyticsButtonProps) {
  const { openDashboard } = useAnalyticsDashboard();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openDashboard}
      className={className}
    >
      <BarChart3 className="mr-2 h-4 w-4" />
      Analytics
    </Button>
  );
}
```

### 2. 創建 Analytics Dashboard Dialog

```typescript
// app/components/analytics/AnalyticsDashboardDialog.tsx
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dialogStyles, iconColors } from '@/app/utils/dialogStyles';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

interface AnalyticsDashboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboardDialog({ isOpen, onClose }: AnalyticsDashboardDialogProps) {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${dialogStyles.content} max-w-6xl max-h-[90vh]`}>
        <DialogHeader>
          <DialogTitle className={dialogStyles.title}>
            <BarChart3 className={`h-6 w-6 ${iconColors.blue}`} />
            Analytics Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Range Selector */}
          <div className="flex justify-end">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className={`${dialogStyles.select} w-[180px]`}>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">Past 7 Days</SelectItem>
                <SelectItem value="30d">Past 30 Days</SelectItem>
                <SelectItem value="90d">Past 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for different charts */}
          <Tabs defaultValue="ratio" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger value="ratio">Output vs Booked Out</TabsTrigger>
              <TabsTrigger value="trend">Product Trend</TabsTrigger>
              <TabsTrigger value="workload">Staff Workload</TabsTrigger>
            </TabsList>

            <TabsContent value="ratio">
              <OutputRatioChart timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="trend">
              <ProductTrendChart timeRange={timeRange} />
            </TabsContent>

            <TabsContent value="workload">
              <StaffWorkloadChart timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. 圖表組件結構

#### Output vs Booked Out Ratio Chart
```typescript
// app/components/analytics/charts/OutputRatioChart.tsx
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';

interface OutputRatioChartProps {
  timeRange: string;
}

export function OutputRatioChart({ timeRange }: OutputRatioChartProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    const supabase = createClient();
    
    // 根據時間範圍獲取數據
    const startDate = getStartDate(timeRange);
    
    // 獲取生產數據
    const { data: outputData } = await supabase
      .from('record_palletinfo')
      .select('generate_time')
      .gte('generate_time', startDate.toISOString())
      .not('plt_remark', 'ilike', '%Material GRN-%');
    
    // 獲取出貨數據
    const { data: transferData } = await supabase
      .from('record_transfer')
      .select('transfer_time, plt_num')
      .gte('transfer_time', startDate.toISOString());
    
    // 處理數據
    const processedData = processDataByTimeRange(outputData, transferData, timeRange);
    setData(processedData);
    setLoading(false);
  };

  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid #374151',
    borderRadius: '8px'
  };

  // 1天使用棒型圖，其他使用折線圖
  if (timeRange === '1d') {
    return (
      <div className={dialogStyles.card}>
        <h3 className="text-lg font-semibold text-white mb-4">Output vs Booked Out Ratio</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hour" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="output" fill="#3B82F6" name="Output" />
            <Bar dataKey="booked_out" fill="#10B981" name="Booked Out" />
            <Bar dataKey="ratio" fill="#F59E0B" name="Ratio %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={dialogStyles.card}>
      <h3 className="text-lg font-semibold text-white mb-4">Output vs Booked Out Ratio</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart {...chartProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="output" stroke="#3B82F6" name="Output" strokeWidth={2} />
          <Line type="monotone" dataKey="booked_out" stroke="#10B981" name="Booked Out" strokeWidth={2} />
          <Line type="monotone" dataKey="ratio" stroke="#F59E0B" name="Ratio %" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 4. 數據處理邏輯

```typescript
// app/utils/analyticsDataProcessors.ts

export function getStartDate(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '1d':
      return new Date(now.setHours(0, 0, 0, 0));
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
}

export function processDataByTimeRange(
  outputData: any[], 
  transferData: any[], 
  timeRange: string
) {
  if (timeRange === '1d') {
    // 按小時分組
    return groupByHour(outputData, transferData);
  } else {
    // 按日期分組
    return groupByDate(outputData, transferData);
  }
}

function groupByHour(outputData: any[], transferData: any[]) {
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    output: 0,
    booked_out: 0,
    ratio: 0
  }));

  // 統計每小時的數據
  outputData.forEach(record => {
    const hour = new Date(record.generate_time).getHours();
    hourlyData[hour].output++;
  });

  transferData.forEach(record => {
    const hour = new Date(record.transfer_time).getHours();
    hourlyData[hour].booked_out++;
  });

  // 計算比率
  hourlyData.forEach(data => {
    if (data.output > 0) {
      data.ratio = Math.round((data.booked_out / data.output) * 100);
    }
  });

  return hourlyData;
}

function groupByDate(outputData: any[], transferData: any[]) {
  const dailyData = new Map();

  // 處理輸出數據
  outputData.forEach(record => {
    const date = new Date(record.generate_time).toLocaleDateString();
    if (!dailyData.has(date)) {
      dailyData.set(date, { date, output: 0, booked_out: 0, ratio: 0 });
    }
    dailyData.get(date).output++;
  });

  // 處理轉移數據
  transferData.forEach(record => {
    const date = new Date(record.transfer_time).toLocaleDateString();
    if (!dailyData.has(date)) {
      dailyData.set(date, { date, output: 0, booked_out: 0, ratio: 0 });
    }
    dailyData.get(date).booked_out++;
  });

  // 計算比率
  const result = Array.from(dailyData.values());
  result.forEach(data => {
    if (data.output > 0) {
      data.ratio = Math.round((data.booked_out / data.output) * 100);
    }
  });

  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
```

### 5. Product Ordered Trend Chart

```typescript
// app/components/analytics/charts/ProductTrendChart.tsx
export function ProductTrendChart({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductTrendData();
  }, [timeRange]);

  const loadProductTrendData = async () => {
    const supabase = createClient();
    const startDate = getStartDate(timeRange);

    // 獲取 ACO 訂單數據
    const { data: acoData } = await supabase
      .from('record_aco')
      .select('code, required_qty, remain_qty, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // 按產品代碼和時間分組
    const processedData = processProductData(acoData, timeRange);
    setData(processedData);
    setLoading(false);
  };

  // 渲染邏輯類似...
}
```

### 6. Staff Workload Chart

```typescript
// app/components/analytics/charts/StaffWorkloadChart.tsx
export function StaffWorkloadChart({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffWorkloadData();
  }, [timeRange]);

  const loadStaffWorkloadData = async () => {
    const supabase = createClient();
    const startDate = getStartDate(timeRange);

    // 獲取員工操作數據
    const { data: palletData } = await supabase
      .from('record_palletinfo')
      .select('generate_time, operation_name')
      .gte('generate_time', startDate.toISOString());

    // 按員工和時間分組
    const processedData = processStaffData(palletData, timeRange);
    setData(processedData);
    setLoading(false);
  };

  // 渲染邏輯類似...
}
```

### 7. Hook 管理 Dialog 狀態

```typescript
// app/components/analytics/useAnalyticsDashboard.tsx
import { create } from 'zustand';

interface AnalyticsDashboardStore {
  isOpen: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
}

const useAnalyticsDashboardStore = create<AnalyticsDashboardStore>((set) => ({
  isOpen: false,
  openDashboard: () => set({ isOpen: true }),
  closeDashboard: () => set({ isOpen: false }),
}));

export function useAnalyticsDashboard() {
  const { isOpen, openDashboard, closeDashboard } = useAnalyticsDashboardStore();
  
  return {
    isOpen,
    openDashboard,
    closeDashboard,
  };
}
```

### 8. 整合到 Admin Panel

```typescript
// app/admin/page.tsx
import { AnalyticsButton } from '@/app/components/analytics/AnalyticsButton';
import { AnalyticsDashboardDialog } from '@/app/components/analytics/AnalyticsDashboardDialog';
import { useAnalyticsDashboard } from '@/app/components/analytics/useAnalyticsDashboard';

// 在導航欄添加按鈕
<div className="flex items-center gap-2">
  <AnalyticsButton 
    variant="outline"
    size="sm"
    className={dialogStyles.secondaryButton}
  />
  <ReportsButton 
    variant="outline"
    size="sm"
    className={dialogStyles.secondaryButton}
  />
</div>

// 在底部添加 Dialog
<AnalyticsDashboardDialog 
  isOpen={analyticsOpen} 
  onClose={closeAnalytics} 
/>
```

## 關鍵技術要點

1. **動態圖表切換**
   - 根據 timeRange 判斷使用 BarChart 或 LineChart
   - 共用數據處理邏輯

2. **數據聚合策略**
   - 1天：按小時聚合
   - 7天/30天：按日期聚合
   - 90天：可考慮按週聚合以提升性能

3. **性能優化**
   - 使用數據快取避免重複查詢
   - 實施懶加載
   - 限制數據點數量

4. **樣式一致性**
   - 所有圖表使用系統深色主題
   - 統一的顏色方案
   - 響應式設計

## 實施步驟

1. 創建基礎結構和按鈕組件
2. 實現 Dialog 和 Tab 切換
3. 開發各個圖表組件
4. 實現數據獲取和處理邏輯
5. 添加載入狀態和錯誤處理
6. 測試和優化性能
7. 整合到 Admin Panel