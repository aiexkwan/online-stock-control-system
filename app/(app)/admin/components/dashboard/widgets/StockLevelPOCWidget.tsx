/**
 * Stock Level POC Widget
 * Proof of Concept for GraphQL migration using UnifiedDataLayer
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { unifiedDataLayer, DataSourceType } from '@/lib/api/unified-data-layer';
import { WidgetComponentProps } from '@/types/components/dashboard';
import { WidgetSkeleton } from './common/WidgetStates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3Icon, 
  RefreshCwIcon, 
  DatabaseIcon,
  AlertCircle 
} from 'lucide-react';

interface StockLevelData {
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    location: string;
    lastUpdated: string;
  }>;
  totalItems: number;
  totalQuantity: number;
}

export default function StockLevelPOCWidget(props: WidgetComponentProps) {
  const { timeFrame } = props;
  const widget = 'widget' in props ? props.widget : null;
  const widgetId = 'widgetId' in props ? props.widgetId : null;
  
  // Get config from widget or use defaults
  const config = widget && 'config' in widget ? widget.config : {};
  const [data, setData] = useState<StockLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceType>(DataSourceType.AUTO);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await unifiedDataLayer.getWidgetData<StockLevelData>(
        'stock_levels',
        {
          warehouse: (config as any)?.params?.warehouse,
          dateRange: timeFrame ? {
            start: timeFrame.start?.toISOString(),
            end: timeFrame.end?.toISOString(),
          } : undefined,
        }
      );

      if (result.error) {
        throw result.error;
      }

      setData(result.data);
      setDataSource(result.source);
      setExecutionTime(result.executionTime || 0);
    } catch (err) {
      console.error('[StockLevelPOCWidget] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeFrame, widgetId, widget]);

  if (loading) {
    return <WidgetSkeleton type="stats" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with data source indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Stock Levels (POC)</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={dataSource === DataSourceType.GRAPHQL ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <DatabaseIcon className="h-3 w-3" />
            {dataSource.toUpperCase()}
          </Badge>
          <button
            onClick={fetchData}
            className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCwIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{data.totalItems.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-muted-foreground">Total Quantity</p>
          <p className="text-2xl font-bold">{data.totalQuantity.toLocaleString()}</p>
        </div>
      </div>

      {/* Top items list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Top Stock Items</h4>
        {data.items.slice(0, 5).map((item, index) => (
          <motion.div
            key={item.productCode}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex-1">
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-muted-foreground">
                {item.productCode} • {item.location}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{item.quantity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">units</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance metrics */}
      <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>Execution time: {executionTime.toFixed(0)}ms</span>
        <span>Data source: {dataSource}</span>
      </div>
    </div>
  );
}