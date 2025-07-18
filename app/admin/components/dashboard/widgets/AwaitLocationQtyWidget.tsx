/**
 * Await Location Quantity Widget
 * 顯示倉庫等待區庫存數量
 */

import React from 'react';
import { BatchQueryWidgetComponentProps } from '@/app/types/dashboard';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
import { MetricCard } from './common';
import { Package } from 'lucide-react';

const AwaitLocationQtyWidget: React.FC<BatchQueryWidgetComponentProps> = ({ widgetId }) => {
  const { data, loading, error } = useWidgetData(widgetId);

  // 計算等待區總數量
  const awaitQty = React.useMemo(() => {
    if (!data?.records) return 0;
    
    return data.records.reduce((total: number, record: any) => {
      // 假設 location 欄位包含 'AWAIT' 表示等待區
      if (record.location && record.location.includes('AWAIT')) {
        return total + (record.quantity || 0);
      }
      return total;
    }, 0);
  }, [data]);

  return (
    <MetricCard
      title="Await Location Qty"
      value={awaitQty}
      description="Total quantity in await locations"
      loading={loading}
      error={error}
      icon={Package}
      trend={data?.trend}
    />
  );
};

export default AwaitLocationQtyWidget;