/**
 * Analysis Display Container - 新的分析顯示容器
 * 替換 AnalysisExpandableCards 的展開選擇功能
 * 
 * 重構決策 (2025-07-22):
 * - 從7個自定義圖表改為11個 UnifiedWidget
 * - 從內部選擇改為外部控制
 * - 簡化架構，提高可維護性
 * 
 * 🚨 緊急修復 (2025-07-22): 專家會議決策
 * - 使用 UnifiedWidget 系統替代 ANALYSIS_WIDGETS_CONFIG
 * - 解決 "Widget loader not configured" 錯誤
 * - 符合原始設計意圖和用戶需求
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { textClasses } from '@/lib/design-system/typography';
import { UNIFIED_WIDGET_CONFIG } from '@/lib/widgets/unified-widget-config';

/**
 * 分析頁面專用的11個 UnifiedWidget 選擇
 * 基於業務需求和使用頻率從 UNIFIED_WIDGET_CONFIG 中選擇
 * 
 * 🚨 緊急修復：使用 UnifiedWidget 系統解決 loader 問題
 */
export const ANALYSIS_WIDGET_SELECTION = [
  'HistoryTreeV2',
  'InventoryOrderedAnalysisWidget', 
  'StockDistributionChartV2',
  'StockLevelHistoryChart',
  'TopProductsByQuantityWidget',
  'TopProductsDistributionWidget',
  'TransferTimeDistributionWidget',
  'WarehouseWorkLevelAreaChart',
  'WarehouseTransferListWidget',
  'TransactionReportWidget',
  'AnalysisExpandableCards'
] as const;

export type AnalysisWidgetId = typeof ANALYSIS_WIDGET_SELECTION[number];

interface AnalysisDisplayContainerProps {
  selectedWidget: AnalysisWidgetId;
  onWidgetError?: (widgetId: string, error: Error) => void;
  className?: string;
}

/**
 * 動態 Widget 載入器組件
 */
const DynamicWidgetLoader: React.FC<{
  widgetId: string;
  loader: () => Promise<{ default: React.ComponentType<any> }>;
}> = ({ widgetId, loader }) => {
  const [WidgetComponent, setWidgetComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loadError, setLoadError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    
    loader()
      .then((module) => {
        if (isMounted) {
          setWidgetComponent(() => module.default);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLoadError(error);
          console.error(`Failed to load widget ${widgetId}:`, error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [widgetId, loader]);

  if (loadError) {
    return (
      <div className="flex h-48 items-center justify-center text-destructive">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm">Failed to load widget</p>
          <p className="text-xs text-muted-foreground mt-1">{widgetId}</p>
        </div>
      </div>
    );
  }

  if (!WidgetComponent) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <WidgetComponent />;
};

/**
 * Widget 錯誤邊界組件
 */
const WidgetErrorBoundary: React.FC<{ 
  widgetId: string; 
  children: React.ReactNode;
  onError?: (widgetId: string, error: Error) => void;
}> = ({ widgetId, children, onError }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      setHasError(true);
      onError?.(widgetId, new Error(error.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [widgetId, onError]);

  if (hasError) {
    return (
      <div className={cn(
        'flex h-48 flex-col items-center justify-center',
        'border border-destructive/20 rounded-lg bg-destructive/5',
        'text-destructive'
      )}>
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p className={cn(textClasses['body-small'], 'font-medium')}>
          Widget Load Error
        </p>
        <p className={cn(textClasses['label-small'], 'mt-1 opacity-70')}>
          {widgetId}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * 動畫變量配置
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// 移除網格佈局相關代碼，改為單一widget全屏顯示

export const AnalysisDisplayContainer: React.FC<AnalysisDisplayContainerProps> = ({
  selectedWidget,
  onWidgetError,
  className
}) => {
  // 驗證選中的 widget 配置
  const widgetConfig = useMemo(() => {
    // 檢查是否為分析頁面支援的 widget
    const isAnalysisWidget = ANALYSIS_WIDGET_SELECTION.includes(selectedWidget);
    const config = UNIFIED_WIDGET_CONFIG[selectedWidget];
    
    return config && isAnalysisWidget ? { config } : null;
  }, [selectedWidget]);

  // 如果 widget 配置無效
  if (!widgetConfig) {
    return (
      <div className={cn(
        'flex h-64 flex-col items-center justify-center',
        'text-muted-foreground',
        className
      )}>
        <div className="mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className={cn(textClasses['body-base'], 'font-medium mb-2')}>
          Widget Configuration Error
        </h3>
        <p className={cn(textClasses['body-small'], 'text-center max-w-sm')}>
          The selected widget "{selectedWidget}" is not properly configured.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        'w-full',
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 標題區域 */}
      <div className="mb-6">
        <h2 className={cn(textClasses['heading-small'], 'font-bold text-foreground')}>
          {widgetConfig.config.name}
        </h2>
        <p className={cn(textClasses['body-small'], 'text-muted-foreground mt-1')}>
          {widgetConfig.config.description || 'Analysis Widget Display'}
        </p>
      </div>

      {/* 單一 Widget 顯示區域 */}
      <motion.div
        className="w-full"
        variants={itemVariants}
      >
        <WidgetErrorBoundary 
          widgetId={selectedWidget}
          onError={onWidgetError}
        >
          <div className={cn(
            'w-full h-[1000px] min-h-[1000px] max-h-[1000px] rounded-lg border bg-card p-6',
            'shadow-sm hover:shadow-md transition-shadow duration-200',
            'flex flex-col overflow-hidden'
          )}>
            {/* Widget 內容 - 全屏顯示 */}
            <div className="flex-1 min-h-0">
              <React.Suspense 
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                {/* 動態載入 Widget 組件 */}
                {widgetConfig.config.loader ? (
                  <DynamicWidgetLoader 
                    widgetId={selectedWidget}
                    loader={widgetConfig.config.loader}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <p>Widget loader not configured for: {selectedWidget}</p>
                    <p className="text-xs mt-2">Available in UNIFIED_WIDGET_CONFIG but missing loader function</p>
                  </div>
                )}
              </React.Suspense>
            </div>
          </div>
        </WidgetErrorBoundary>
      </motion.div>

    </motion.div>
  );
};

export default AnalysisDisplayContainer;

/**
 * 使用範例：
 * 
 * ```tsx
 * const [selectedWidget, setSelectedWidget] = useState<AnalysisWidgetId>('HistoryTreeV2');
 * 
 * <AnalysisDisplayContainer
 *   selectedWidget={selectedWidget}
 *   onWidgetError={(widgetId, error) => {
 *     console.error(`Widget ${widgetId} failed:`, error);
 *   }}
 * />
 * ```
 */